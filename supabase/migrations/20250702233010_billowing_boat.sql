-- Complete RLS Functions and Policies Fix
-- This migration creates a clean, working set of RLS policies and helper functions

-- Step 1: Drop ALL existing policies and functions to start clean
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

DROP POLICY IF EXISTS "memberships_select_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "memberships_delete_policy" ON public.organization_memberships;

DROP POLICY IF EXISTS "topics_select_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_insert_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_update_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_delete_policy" ON public.topics;

DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;

-- Drop all existing helper functions with CASCADE
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_super_admin_safe() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin_safe(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_pending_organizations() CASCADE;
DROP FUNCTION IF EXISTS approve_organization(uuid) CASCADE;
DROP FUNCTION IF EXISTS reject_organization(uuid) CASCADE;
DROP FUNCTION IF EXISTS uid() CASCADE;

-- Step 2: Create helper functions with SECURITY DEFINER to bypass RLS completely
-- These functions use empty search_path to prevent any RLS interference

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin_safe(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Direct query bypassing RLS
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = check_user_id AND role = 'super_admin'
  );
END;
$$;

-- Function to check if user has access to an organization
CREATE OR REPLACE FUNCTION has_org_access(check_org_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF check_user_id IS NULL OR check_org_id IS NULL THEN
    RETURN false;
  END IF;

  -- Super admins have access to everything
  IF is_super_admin_safe(check_user_id) THEN
    RETURN true;
  END IF;

  -- Check if user is a member of an approved organization
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.organization_id = check_org_id 
    AND om.user_id = check_user_id
    AND o.status = 'approved'
  );
END;
$$;

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION get_org_role(check_org_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  IF check_user_id IS NULL OR check_org_id IS NULL THEN
    RETURN 'none';
  END IF;

  -- Super admins have super admin role
  IF is_super_admin_safe(check_user_id) THEN
    RETURN 'super_admin';
  END IF;

  -- Get organization role directly
  SELECT om.role INTO user_role
  FROM public.organization_memberships om
  JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.organization_id = check_org_id 
  AND om.user_id = check_user_id
  AND o.status = 'approved'
  LIMIT 1;

  RETURN COALESCE(user_role, 'none');
END;
$$;

-- Function to check if user can edit in an organization
CREATE OR REPLACE FUNCTION can_edit_org(check_org_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  IF check_user_id IS NULL OR check_org_id IS NULL THEN
    RETURN false;
  END IF;

  -- Super admins can edit everything
  IF is_super_admin_safe(check_user_id) THEN
    RETURN true;
  END IF;

  -- Get user role and check if they can edit
  user_role := get_org_role(check_org_id, check_user_id);
  RETURN user_role IN ('org_admin', 'org_editor');
END;
$$;

-- Function to get user profile (used by frontend)
CREATE OR REPLACE FUNCTION get_user_profile(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only allow users to get their own profile or super admins to get any profile
  IF target_user_id = auth.uid() OR is_super_admin_safe(auth.uid()) THEN
    RETURN QUERY
    SELECT 
      up.id,
      up.email,
      up.full_name,
      up.avatar_url,
      up.role,
      up.created_at,
      up.updated_at
    FROM public.user_profiles up
    WHERE up.id = target_user_id;
  END IF;
END;
$$;

-- Organization management functions for super admins
CREATE OR REPLACE FUNCTION get_pending_organizations()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  created_by uuid,
  created_at timestamptz,
  creator_email text,
  creator_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only super admins can see pending organizations
  IF NOT is_super_admin_safe(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.description,
    o.created_by,
    o.created_at,
    up.email as creator_email,
    up.full_name as creator_name
  FROM public.organizations o
  LEFT JOIN public.user_profiles up ON up.id = o.created_by
  WHERE o.status = 'pending'
  ORDER BY o.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION approve_organization(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only super admins can approve organizations
  IF NOT is_super_admin_safe(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can approve organizations';
  END IF;

  -- Update organization status to approved
  UPDATE public.organizations 
  SET status = 'approved', updated_at = now()
  WHERE id = org_id AND status = 'pending';

  -- Add the creator as an admin of the organization
  INSERT INTO public.organization_memberships (user_id, organization_id, role)
  SELECT created_by, id, 'org_admin'
  FROM public.organizations 
  WHERE id = org_id AND created_by IS NOT NULL
  ON CONFLICT (user_id, organization_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION reject_organization(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only super admins can reject organizations
  IF NOT is_super_admin_safe(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can reject organizations';
  END IF;

  -- Update organization status to rejected
  UPDATE public.organizations 
  SET status = 'rejected', updated_at = now()
  WHERE id = org_id AND status = 'pending';
END;
$$;

-- Step 3: Create RLS policies for user_profiles (simplest first)
CREATE POLICY "user_profiles_select_policy" 
  ON user_profiles 
  FOR SELECT 
  TO public 
  USING (
    -- Users can see their own profile OR super admins can see all
    id = auth.uid() OR is_super_admin_safe(auth.uid())
  );

CREATE POLICY "user_profiles_update_policy" 
  ON user_profiles 
  FOR UPDATE 
  TO public 
  USING (
    -- Users can update their own profile OR super admins can update any
    id = auth.uid() OR is_super_admin_safe(auth.uid())
  )
  WITH CHECK (
    -- Same check for WITH CHECK
    id = auth.uid() OR is_super_admin_safe(auth.uid())
  );

CREATE POLICY "user_profiles_insert_policy" 
  ON user_profiles 
  FOR INSERT 
  TO public 
  WITH CHECK (
    -- Users can insert their own profile OR super admins can insert any
    id = auth.uid() OR is_super_admin_safe(auth.uid())
  );

CREATE POLICY "user_profiles_delete_policy" 
  ON user_profiles 
  FOR DELETE 
  TO public 
  USING (
    -- Only super admins can delete profiles
    is_super_admin_safe(auth.uid())
  );

-- Step 4: Create RLS policies for organizations
CREATE POLICY "organizations_select_policy" 
  ON organizations 
  FOR SELECT 
  TO public 
  USING (
    is_super_admin_safe(auth.uid()) OR
    (status = 'approved' AND has_org_access(id, auth.uid())) OR
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
    is_super_admin_safe(auth.uid()) OR
    get_org_role(id, auth.uid()) = 'org_admin'
  )
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR
    get_org_role(id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "organizations_delete_policy" 
  ON organizations 
  FOR DELETE 
  TO public 
  USING (
    is_super_admin_safe(auth.uid()) OR
    get_org_role(id, auth.uid()) = 'org_admin'
  );

-- Step 5: Create RLS policies for organization_memberships
CREATE POLICY "memberships_select_policy" 
  ON organization_memberships 
  FOR SELECT 
  TO public 
  USING (
    is_super_admin_safe(auth.uid()) OR
    user_id = auth.uid() OR
    get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_insert_policy" 
  ON organization_memberships 
  FOR INSERT 
  TO public 
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR
    get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

CREATE POLICY "memberships_update_policy" 
  ON organization_memberships 
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

CREATE POLICY "memberships_delete_policy" 
  ON organization_memberships 
  FOR DELETE 
  TO public 
  USING (
    is_super_admin_safe(auth.uid()) OR
    get_org_role(organization_id, auth.uid()) = 'org_admin' OR
    user_id = auth.uid()
  );

-- Step 6: Create RLS policies for topics
CREATE POLICY "topics_select_policy" 
  ON topics 
  FOR SELECT 
  TO public 
  USING (
    is_super_admin_safe(auth.uid()) OR
    is_public = true OR
    (organization_id IS NOT NULL AND has_org_access(organization_id, auth.uid())) OR
    (organization_id IS NULL AND created_by = auth.uid())
  );

CREATE POLICY "topics_insert_policy" 
  ON topics 
  FOR INSERT 
  TO public 
  WITH CHECK (
    is_super_admin_safe(auth.uid()) OR
    (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "topics_update_policy" 
  ON topics 
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

CREATE POLICY "topics_delete_policy" 
  ON topics 
  FOR DELETE 
  TO public 
  USING (
    is_super_admin_safe(auth.uid()) OR
    (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR
    (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
  );

-- Step 7: Create RLS policies for events
CREATE POLICY "events_select_policy" 
  ON events 
  FOR SELECT 
  TO public 
  USING (
    EXISTS (
      SELECT 1 FROM topics t 
      WHERE t.id = events.topic_id 
      AND (
        is_super_admin_safe(auth.uid()) OR
        t.is_public = true OR
        (t.organization_id IS NOT NULL AND has_org_access(t.organization_id, auth.uid())) OR
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
        is_super_admin_safe(auth.uid()) OR
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR
        t.organization_id IS NULL
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
        is_super_admin_safe(auth.uid()) OR
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics t 
      WHERE t.id = events.topic_id 
      AND (
        is_super_admin_safe(auth.uid()) OR
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR
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
        is_super_admin_safe(auth.uid()) OR
        (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  );

-- Step 8: Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION is_super_admin_safe(uuid) TO public;
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION can_edit_org(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO public;
GRANT EXECUTE ON FUNCTION get_pending_organizations() TO public;
GRANT EXECUTE ON FUNCTION approve_organization(uuid) TO public;
GRANT EXECUTE ON FUNCTION reject_organization(uuid) TO public;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_org ON organization_memberships(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_role ON organization_memberships(role);
CREATE INDEX IF NOT EXISTS idx_topics_organization_id ON topics(organization_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_by ON topics(created_by);
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON topics(is_public);
CREATE INDEX IF NOT EXISTS idx_events_topic_id ON events(topic_id);
CREATE INDEX IF NOT EXISTS idx_events_year ON events(year);

-- Step 10: Ensure proper constraints exist
DO $$
BEGIN
  -- Add unique constraint to email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_email_key' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
  END IF;
  
  -- Update role constraint to include all valid roles
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_role' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT valid_role;
  END IF;
  
  ALTER TABLE user_profiles ADD CONSTRAINT valid_role 
    CHECK (role = ANY (ARRAY['super_admin'::text, 'standard_user'::text, 'user'::text]));
END $$;