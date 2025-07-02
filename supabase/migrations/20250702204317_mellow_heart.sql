-- Fix RLS infinite recursion by properly handling dependencies
-- First drop all policies that depend on the functions, then recreate everything

-- Drop all policies that depend on helper functions
DROP POLICY IF EXISTS "topics_select_policy" ON topics;
DROP POLICY IF EXISTS "topics_insert_policy" ON topics;
DROP POLICY IF EXISTS "topics_update_policy" ON topics;
DROP POLICY IF EXISTS "topics_delete_policy" ON topics;

DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

DROP POLICY IF EXISTS "memberships_select_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_delete_policy" ON organization_memberships;

DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "Allow user to read their own profile" ON user_profiles;

-- Now drop existing helper functions
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_super_admin(uuid);
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid);
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid);
DROP FUNCTION IF EXISTS uid();

-- Create improved helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_org_role(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF user_id IS NULL THEN
    RETURN 'none';
  END IF;

  -- Check if super admin first
  IF is_super_admin(user_id) THEN
    RETURN 'super_admin';
  END IF;

  -- Get organization role directly without RLS
  SELECT role INTO user_role
  FROM organization_memberships
  WHERE organization_id = org_id AND user_id = get_org_role.user_id;

  RETURN COALESCE(user_role, 'none');
END;
$$;

CREATE OR REPLACE FUNCTION has_org_access(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Super admins have access to everything
  IF is_super_admin(user_id) THEN
    RETURN true;
  END IF;

  -- Check if user is a member of the organization
  RETURN EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = org_id AND user_id = has_org_access.user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION can_edit_org(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Super admins can edit everything
  IF is_super_admin(user_id) THEN
    RETURN true;
  END IF;

  -- Get user role in organization
  user_role := get_org_role(org_id, user_id);
  
  -- Only admins and editors can edit
  RETURN user_role IN ('org_admin', 'org_editor');
END;
$$;

-- Recreate RLS policies for user_profiles (SIMPLIFIED to avoid recursion)
CREATE POLICY "user_profiles_select_policy"
  ON user_profiles
  FOR SELECT
  TO public
  USING (
    id = auth.uid()
  );

CREATE POLICY "user_profiles_update_policy"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (
    id = auth.uid()
  );

-- Recreate RLS policies for organization_memberships (SIMPLIFIED to avoid recursion)
CREATE POLICY "memberships_select_policy"
  ON organization_memberships
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR
    user_id = auth.uid() OR
    get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_insert_policy"
  ON organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR
    get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_update_policy"
  ON organization_memberships
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR
    get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_delete_policy"
  ON organization_memberships
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR
    get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin' OR
    user_id = auth.uid()
  );

-- Recreate Topics policies
CREATE POLICY "topics_select_policy"
  ON topics
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR
    is_public = true OR
    (organization_id IS NOT NULL AND has_org_access(organization_id)) OR
    (organization_id IS NULL AND created_by = auth.uid())
  );

CREATE POLICY "topics_insert_policy"
  ON topics
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR
    (organization_id IS NOT NULL AND can_edit_org(organization_id)) OR
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "topics_update_policy"
  ON topics
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR
    (organization_id IS NOT NULL AND can_edit_org(organization_id)) OR
    (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
  );

CREATE POLICY "topics_delete_policy"
  ON topics
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR
    (organization_id IS NOT NULL AND can_edit_org(organization_id)) OR
    (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
  );

-- Recreate Events policies
CREATE POLICY "events_select_policy"
  ON events
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = events.topic_id
        AND (
          is_super_admin() OR
          t.is_public = true OR
          (t.organization_id IS NOT NULL AND has_org_access(t.organization_id)) OR
          (t.organization_id IS NULL AND t.created_by = auth.uid())
        )
    )
  );

CREATE POLICY "events_insert_policy"
  ON events
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = events.topic_id
        AND (
          is_super_admin() OR
          (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id)) OR
          (t.organization_id IS NULL)
        )
    )
  );

CREATE POLICY "events_update_policy"
  ON events
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = events.topic_id
        AND (
          is_super_admin() OR
          (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id)) OR
          (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
        )
    )
  );

CREATE POLICY "events_delete_policy"
  ON events
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM topics t
      WHERE t.id = events.topic_id
        AND (
          is_super_admin() OR
          (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id)) OR
          (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
        )
    )
  );

-- Recreate Organizations policies
CREATE POLICY "organizations_select_policy"
  ON organizations
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR
    (status = 'approved' AND has_org_access(id)) OR
    created_by = auth.uid()
  );

CREATE POLICY "organizations_insert_policy"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "organizations_update_policy"
  ON organizations
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR
    get_org_role(id) = 'org_admin'
  );

CREATE POLICY "organizations_delete_policy"
  ON organizations
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR
    get_org_role(id) = 'org_admin'
  );

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO public;
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION can_edit_org(uuid, uuid) TO public;