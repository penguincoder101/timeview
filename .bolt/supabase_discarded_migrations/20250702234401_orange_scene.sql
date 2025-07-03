-- Create only the missing get_user_profile function
-- This is the main function causing the frontend errors
-- We avoid modifying existing functions to prevent parameter name conflicts

-- Function to get user profile (RPC function for frontend)
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;