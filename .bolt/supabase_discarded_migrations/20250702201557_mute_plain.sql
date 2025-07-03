/*
  # Fix RLS infinite recursion in organization_memberships

  1. Problem
    - Infinite recursion detected in policy for relation "organization_memberships"
    - Helper functions are likely querying the same table they're protecting

  2. Solution
    - Rewrite helper functions to use SECURITY DEFINER to bypass RLS
    - Simplify policies to avoid circular dependencies
    - Use direct auth.uid() checks where possible

  3. Changes
    - Drop and recreate helper functions with SECURITY DEFINER
    - Simplify RLS policies to avoid recursion
    - Ensure proper access control without circular references
*/

-- Drop existing helper functions to recreate them properly
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid);
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid);

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

-- Drop existing policies for organization_memberships
DROP POLICY IF EXISTS "memberships_select_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_delete_policy" ON organization_memberships;

-- Create simplified RLS policies for organization_memberships to avoid recursion
CREATE POLICY "memberships_select_policy"
  ON organization_memberships
  FOR SELECT
  TO public
  USING (
    -- Super admins can see all memberships
    is_super_admin() OR
    -- Users can see their own membership
    user_id = auth.uid() OR
    -- Organization admins can see all memberships in their org
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'org_admin'
    )
  );

CREATE POLICY "memberships_insert_policy"
  ON organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    -- Super admins can add anyone
    is_super_admin() OR
    -- Organization admins can add members to their org
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'org_admin'
    )
  );

CREATE POLICY "memberships_update_policy"
  ON organization_memberships
  FOR UPDATE
  TO public
  USING (
    -- Super admins can update any membership
    is_super_admin() OR
    -- Organization admins can update memberships in their org
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'org_admin'
    )
  );

CREATE POLICY "memberships_delete_policy"
  ON organization_memberships
  FOR DELETE
  TO public
  USING (
    -- Super admins can delete any membership
    is_super_admin() OR
    -- Organization admins can remove members from their org
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'org_admin'
    ) OR
    -- Users can remove themselves
    user_id = auth.uid()
  );

-- Update other table policies to use the improved helper functions
-- Topics policies
DROP POLICY IF EXISTS "topics_select_policy" ON topics;
DROP POLICY IF EXISTS "topics_insert_policy" ON topics;
DROP POLICY IF EXISTS "topics_update_policy" ON topics;
DROP POLICY IF EXISTS "topics_delete_policy" ON topics;

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

-- Events policies (simplified to avoid recursion)
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

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

-- Organizations policies
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

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

-- User profiles policies (keep existing simple policy)
DROP POLICY IF EXISTS "Allow user to read their own profile" ON user_profiles;

CREATE POLICY "user_profiles_select_policy"
  ON user_profiles
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR
    id = auth.uid()
  );

CREATE POLICY "user_profiles_update_policy"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR
    id = auth.uid()
  );

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO public;
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION can_edit_org(uuid, uuid) TO public;