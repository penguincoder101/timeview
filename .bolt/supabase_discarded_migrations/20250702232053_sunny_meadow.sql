/*
  # Fix RLS Functions and Policies

  This migration fixes the function dependency issues by:
  1. First dropping all policies that depend on functions
  2. Then dropping and recreating the functions
  3. Finally recreating all policies with correct function references

  ## Changes Made
  - Drop all existing policies first to avoid dependency conflicts
  - Recreate helper functions with proper error handling
  - Recreate all RLS policies using the updated functions
*/

-- Step 1: Drop all existing policies first to avoid dependency conflicts
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_all_super_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;

DROP POLICY IF EXISTS "Allow user to read their memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Allow user to read their own memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_delete_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_select_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON public.organization_memberships;

DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;

DROP POLICY IF EXISTS "topics_delete_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_insert_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_select_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_update_policy" ON public.topics;

DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;

-- Step 2: Now drop and recreate functions
DROP FUNCTION IF EXISTS is_super_admin_safe(uuid);
DROP FUNCTION IF EXISTS is_super_admin(uuid);
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid);
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_profile(uuid);
DROP FUNCTION IF EXISTS uid();

-- Helper function to safely get current user ID
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Safe version of is_super_admin that handles null cases
CREATE OR REPLACE FUNCTION is_super_admin_safe(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT role = 'super_admin'
      FROM public.user_profiles
      WHERE id = COALESCE(user_id, auth.uid())
    ),
    false
  );
$$;

-- Update the original is_super_admin function to be consistent
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT role = 'super_admin'
      FROM public.user_profiles
      WHERE id = COALESCE(user_id, auth.uid())
    ),
    false
  );
$$;

-- Function to check if user has access to an organization
CREATE OR REPLACE FUNCTION has_org_access(org_id uuid, user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.organization_id = org_id
    AND om.user_id = COALESCE(user_id, auth.uid())
    AND o.status = 'approved'
  );
$$;

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION get_org_role(org_id uuid, user_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT om.role
      FROM public.organization_memberships om
      JOIN public.organizations o ON o.id = om.organization_id
      WHERE om.organization_id = org_id
      AND om.user_id = COALESCE(user_id, auth.uid())
      AND o.status = 'approved'
    ),
    'none'
  );
$$;

-- Function to check if user can edit in an organization
CREATE OR REPLACE FUNCTION can_edit_org(org_id uuid, user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT get_org_role(org_id, COALESCE(user_id, auth.uid())) IN ('org_admin', 'org_editor');
$$;

-- Safe RPC function to get user profile (used by frontend)
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.avatar_url,
    up.role,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up
  WHERE up.id = get_user_profile.user_id
  AND (
    up.id = auth.uid() OR 
    is_super_admin_safe(auth.uid())
  );
$$;

-- Step 3: Recreate all RLS policies

-- User Profiles policies
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
  FOR SELECT
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    id = auth.uid()
  );

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
  FOR UPDATE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    id = auth.uid()
  )
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    id = auth.uid()
  );

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    id = auth.uid()
  );

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
  FOR DELETE
  TO public
  USING (
    is_super_admin_safe(auth.uid())
  );

-- Organization Memberships policies
CREATE POLICY "memberships_select_policy" ON public.organization_memberships
  FOR SELECT
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    user_id = auth.uid() OR 
    get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_insert_policy" ON public.organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_update_policy" ON public.organization_memberships
  FOR UPDATE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(organization_id, auth.uid()) = 'org_admin'
  )
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_delete_policy" ON public.organization_memberships
  FOR DELETE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(organization_id, auth.uid()) = 'org_admin' OR 
    user_id = auth.uid()
  );

-- Organizations policies
CREATE POLICY "organizations_select_policy" ON public.organizations
  FOR SELECT
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    (status = 'approved' AND has_org_access(id, auth.uid())) OR 
    created_by = auth.uid()
  );

CREATE POLICY "organizations_insert_policy" ON public.organizations
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "organizations_update_policy" ON public.organizations
  FOR UPDATE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(id, auth.uid()) = 'org_admin'
  )
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "organizations_delete_policy" ON public.organizations
  FOR DELETE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    get_org_role(id, auth.uid()) = 'org_admin'
  );

-- Topics policies
CREATE POLICY "topics_select_policy" ON public.topics
  FOR SELECT
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    is_public = true OR 
    (organization_id IS NOT NULL AND has_org_access(organization_id, auth.uid())) OR 
    (organization_id IS NULL AND created_by = auth.uid())
  );

CREATE POLICY "topics_insert_policy" ON public.topics
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR 
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "topics_update_policy" ON public.topics
  FOR UPDATE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR 
    (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
  )
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR 
    (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR 
    (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
  );

CREATE POLICY "topics_delete_policy" ON public.topics
  FOR DELETE
  TO public
  USING (
    is_super_admin_safe(auth.uid()) OR 
    (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR 
    (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
  );

-- Events policies
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.topics t
      WHERE t.id = events.topic_id
      AND (
        is_super_admin_safe(auth.uid()) OR 
        t.is_public = true OR 
        (t.organization_id IS NOT NULL AND has_org_access(t.organization_id, auth.uid())) OR 
        (t.organization_id IS NULL AND t.created_by = auth.uid())
      )
    )
  );

CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM public.topics t
      WHERE t.id = events.topic_id
      AND (
        is_super_admin_safe(auth.uid()) OR 
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
        t.organization_id IS NULL
      )
    )
  );

CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.topics t
      WHERE t.id = events.topic_id
      AND (
        is_super_admin_safe(auth.uid()) OR 
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.topics t
      WHERE t.id = events.topic_id
      AND (
        is_super_admin_safe(auth.uid()) OR 
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  );

CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.topics t
      WHERE t.id = events.topic_id
      AND (
        is_super_admin_safe(auth.uid()) OR 
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  );