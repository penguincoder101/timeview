-- Create missing database functions without dropping existing ones
-- This avoids conflicts with existing RLS policies that depend on these functions

-- Function to get user profile (RPC function for frontend)
-- This is the main missing function causing the errors
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

-- Ensure all helper functions exist (create or replace to update if needed)
CREATE OR REPLACE FUNCTION has_org_access(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if either parameter is null
  IF org_id IS NULL OR user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Super admins have access to all organizations
  IF is_super_admin_safe(user_id) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member of the organization
  RETURN EXISTS (
    SELECT 1 
    FROM organization_memberships om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.organization_id = org_id 
    AND om.user_id = user_id
    AND o.status = 'approved'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION can_edit_org(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if either parameter is null
  IF org_id IS NULL OR user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Super admins can edit any organization
  IF is_super_admin_safe(user_id) THEN
    RETURN true;
  END IF;
  
  -- Check if user has admin or editor role in the organization
  RETURN EXISTS (
    SELECT 1 
    FROM organization_memberships om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.organization_id = org_id 
    AND om.user_id = user_id
    AND om.role IN ('org_admin', 'org_editor')
    AND o.status = 'approved'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION get_org_role(org_id uuid, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Return null if either parameter is null
  IF org_id IS NULL OR user_id IS NULL THEN
    RETURN null;
  END IF;
  
  -- Super admins have super_admin role everywhere
  IF is_super_admin_safe(user_id) THEN
    RETURN 'super_admin';
  END IF;
  
  -- Get user's role in the organization
  SELECT om.role INTO user_role
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.organization_id = org_id 
  AND om.user_id = user_id
  AND o.status = 'approved';
  
  RETURN COALESCE(user_role, 'none');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'none';
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_org(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO authenticated;

-- Also grant to anon for public access where needed
GRANT EXECUTE ON FUNCTION has_org_access(uuid, uuid) TO anon;