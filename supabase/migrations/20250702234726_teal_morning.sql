-- Fix missing database functions that are causing frontend errors
-- This migration ensures all required RPC functions exist and work correctly

-- Step 1: Drop any existing conflicting functions
DROP FUNCTION IF EXISTS is_super_admin_safe() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin_safe(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_pending_organizations() CASCADE;
DROP FUNCTION IF EXISTS approve_organization(uuid) CASCADE;
DROP FUNCTION IF EXISTS reject_organization(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid) CASCADE;

-- Step 2: Create the core helper functions with SECURITY DEFINER to bypass RLS

-- Function to check if current user is super admin (no parameters)
CREATE OR REPLACE FUNCTION is_super_admin_safe()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- Function to check if specific user is super admin (with parameter)
CREATE OR REPLACE FUNCTION is_super_admin_safe(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = check_user_id AND role = 'super_admin'
  );
END;
$$;

-- Function to check organization access
CREATE OR REPLACE FUNCTION has_org_access(check_org_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    SELECT 1 FROM organization_memberships om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.organization_id = check_org_id 
    AND om.user_id = check_user_id
    AND o.status = 'approved'
  );
END;
$$;

-- Function to get user's role in organization
CREATE OR REPLACE FUNCTION get_org_role(check_org_id uuid, check_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Get the user's role in the organization
  SELECT om.role INTO user_role
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.organization_id = check_org_id 
  AND om.user_id = check_user_id
  AND o.status = 'approved'
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;

-- Function to check if user can edit in organization
CREATE OR REPLACE FUNCTION can_edit_org(check_org_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Step 3: Create the main RPC functions used by the frontend

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
SET search_path = public
AS $$
BEGIN
  -- Check if the requesting user can access this profile
  -- Users can access their own profile, super admins can access any profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND NOT is_super_admin_safe(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return the user profile
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.avatar_url,
    up.role,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.id = target_user_id;
END;
$$;

-- Function to get pending organizations (super admin only)
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
SET search_path = public
AS $$
BEGIN
  -- Only super admins can see pending organizations
  IF NOT is_super_admin_safe() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can view pending organizations';
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
  FROM organizations o
  LEFT JOIN user_profiles up ON up.id = o.created_by
  WHERE o.status = 'pending'
  ORDER BY o.created_at DESC;
END;
$$;

-- Function to approve organization (super admin only)
CREATE OR REPLACE FUNCTION approve_organization(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can approve organizations
  IF NOT is_super_admin_safe() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can approve organizations';
  END IF;

  -- Update organization status to approved
  UPDATE organizations 
  SET status = 'approved', updated_at = now()
  WHERE id = org_id AND status = 'pending';

  -- Add the creator as an admin of the organization
  INSERT INTO organization_memberships (user_id, organization_id, role)
  SELECT created_by, id, 'org_admin'
  FROM organizations 
  WHERE id = org_id AND created_by IS NOT NULL
  ON CONFLICT (user_id, organization_id) DO NOTHING;
END;
$$;

-- Function to reject organization (super admin only)
CREATE OR REPLACE FUNCTION reject_organization(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can reject organizations
  IF NOT is_super_admin_safe() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can reject organizations';
  END IF;

  -- Update organization status to rejected
  UPDATE organizations 
  SET status = 'rejected', updated_at = now()
  WHERE id = org_id AND status = 'pending';
END;
$$;

-- Step 4: Grant execute permissions to all users
GRANT EXECUTE ON FUNCTION is_super_admin_safe() TO public;
GRANT EXECUTE ON FUNCTION is_super_admin_safe(uuid) TO public;
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION can_edit_org(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO public;
GRANT EXECUTE ON FUNCTION get_pending_organizations() TO public;
GRANT EXECUTE ON FUNCTION approve_organization(uuid) TO public;
GRANT EXECUTE ON FUNCTION reject_organization(uuid) TO public;

-- Also grant to authenticated users specifically
GRANT EXECUTE ON FUNCTION is_super_admin_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_org(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_organization(uuid) TO authenticated;

-- Step 5: Ensure RLS policies exist and reference the correct functions
-- Only recreate policies if they don't exist or are broken

-- Check if user_profiles policies exist, if not create simple ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'user_profiles_select_policy'
  ) THEN
    CREATE POLICY "user_profiles_select_policy" 
      ON user_profiles 
      FOR SELECT 
      TO public 
      USING (
        id = auth.uid() OR is_super_admin_safe(auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'user_profiles_update_policy'
  ) THEN
    CREATE POLICY "user_profiles_update_policy" 
      ON user_profiles 
      FOR UPDATE 
      TO public 
      USING (
        id = auth.uid() OR is_super_admin_safe(auth.uid())
      )
      WITH CHECK (
        id = auth.uid() OR is_super_admin_safe(auth.uid())
      );
  END IF;
END $$;