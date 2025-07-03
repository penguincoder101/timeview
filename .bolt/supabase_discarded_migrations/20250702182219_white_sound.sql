/*
  # Fix column reference ambiguity in RLS policies

  1. Drop all dependent policies first
  2. Drop and recreate functions with proper parameter names
  3. Recreate all policies with corrected function calls

  This resolves the "column reference 'user_id' is ambiguous" error by:
  - Using properly named function parameters (p_org_id, p_user_id)
  - Ensuring all column references are fully qualified
  - Maintaining the same security logic
*/

-- Step 1: Drop all policies that depend on the functions we need to change
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

-- Step 2: Drop and recreate functions with proper parameter names
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid);
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid);

-- Recreate uid() function
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Recreate is_super_admin() function with proper qualification
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'super_admin'
  );
$$;

-- Recreate has_org_access function with renamed parameters
CREATE OR REPLACE FUNCTION has_org_access(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_memberships om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.organization_id = p_org_id 
    AND om.user_id = p_user_id
    AND o.status = 'approved'
  );
$$;

-- Recreate can_edit_org function with renamed parameters
CREATE OR REPLACE FUNCTION can_edit_org(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_memberships om
    WHERE om.organization_id = p_org_id 
    AND om.user_id = p_user_id
    AND om.role IN ('org_admin', 'org_editor')
  );
$$;

-- Recreate get_org_role function with renamed parameters
CREATE OR REPLACE FUNCTION get_org_role(p_org_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT om.role 
     FROM organization_memberships om
     WHERE om.organization_id = p_org_id 
     AND om.user_id = p_user_id
     LIMIT 1),
    'none'
  );
$$;

-- Step 3: Recreate all policies with corrected function calls

-- Topics policies
CREATE POLICY "topics_select_policy"
  ON topics
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR 
    (topics.is_public = true) OR 
    ((topics.organization_id IS NOT NULL) AND has_org_access(topics.organization_id, uid())) OR 
    ((topics.organization_id IS NULL) AND (topics.created_by = uid()))
  );

CREATE POLICY "topics_insert_policy"
  ON topics
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR 
    ((topics.organization_id IS NOT NULL) AND can_edit_org(topics.organization_id, uid())) OR 
    ((topics.organization_id IS NULL) AND (topics.created_by = uid()))
  );

CREATE POLICY "topics_update_policy"
  ON topics
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR 
    ((topics.organization_id IS NOT NULL) AND can_edit_org(topics.organization_id, uid())) OR 
    ((topics.organization_id IS NULL) AND (topics.is_public = false) AND (topics.created_by = uid()))
  );

CREATE POLICY "topics_delete_policy"
  ON topics
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR 
    ((topics.organization_id IS NOT NULL) AND can_edit_org(topics.organization_id, uid())) OR 
    ((topics.organization_id IS NULL) AND (topics.is_public = false) AND (topics.created_by = uid()))
  );

-- Events policies
CREATE POLICY "events_select_policy"
  ON events
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM topics t
      WHERE t.id = events.topic_id 
      AND (
        (t.is_public = true) OR 
        (t.organization_id IS NULL) OR 
        is_super_admin() OR 
        has_org_access(t.organization_id, uid())
      )
    )
  );

CREATE POLICY "events_insert_policy"
  ON events
  FOR INSERT
  TO public
  WITH CHECK (
    (uid() IS NOT NULL) AND 
    EXISTS (
      SELECT 1
      FROM topics t
      WHERE t.id = events.topic_id 
      AND (
        is_super_admin() OR 
        ((t.organization_id IS NOT NULL) AND can_edit_org(t.organization_id, uid())) OR 
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
      SELECT 1
      FROM topics t
      WHERE t.id = events.topic_id 
      AND (
        is_super_admin() OR 
        ((t.organization_id IS NOT NULL) AND can_edit_org(t.organization_id, uid())) OR 
        ((t.organization_id IS NULL) AND (uid() IS NOT NULL))
      )
    )
  );

CREATE POLICY "events_delete_policy"
  ON events
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM topics t
      WHERE t.id = events.topic_id 
      AND (
        is_super_admin() OR 
        ((t.organization_id IS NOT NULL) AND can_edit_org(t.organization_id, uid())) OR 
        ((t.organization_id IS NULL) AND (uid() IS NOT NULL))
      )
    )
  );

-- Organizations policies
CREATE POLICY "organizations_select_policy"
  ON organizations
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR 
    ((organizations.status = 'approved') AND has_org_access(organizations.id, uid())) OR 
    (organizations.created_by = uid())
  );

CREATE POLICY "organizations_insert_policy"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (uid() IS NOT NULL);

CREATE POLICY "organizations_update_policy"
  ON organizations
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR 
    (get_org_role(organizations.id, uid()) = 'org_admin')
  );

CREATE POLICY "organizations_delete_policy"
  ON organizations
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR 
    (get_org_role(organizations.id, uid()) = 'org_admin')
  );

-- Organization memberships policies
CREATE POLICY "memberships_select_policy"
  ON organization_memberships
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR (
      EXISTS (
        SELECT 1
        FROM organizations o
        WHERE o.id = organization_memberships.organization_id
        AND (o.status = 'approved' OR o.created_by = uid())
      ) AND has_org_access(organization_memberships.organization_id, uid())
    )
  );

CREATE POLICY "memberships_insert_policy"
  ON organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR 
    (get_org_role(organization_memberships.organization_id, uid()) = 'org_admin')
  );

CREATE POLICY "memberships_update_policy"
  ON organization_memberships
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR 
    (get_org_role(organization_memberships.organization_id, uid()) = 'org_admin')
  );

CREATE POLICY "memberships_delete_policy"
  ON organization_memberships
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR 
    (get_org_role(organization_memberships.organization_id, uid()) = 'org_admin') OR 
    (organization_memberships.user_id = uid())
  );