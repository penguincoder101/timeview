/*
  # Fix get_user_profile RPC function

  1. Function Updates
    - Update `get_user_profile` function to use correct helper function
    - Replace `is_super_admin_safe(uuid)` with `is_super_admin(user_id)`
    - Ensure function works with existing database schema

  2. Changes Made
    - Corrected function call from non-existent `is_super_admin_safe` to existing `is_super_admin`
    - Maintained all existing functionality and security policies
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_profile(uuid);

-- Recreate the function with the correct helper function call
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
  IF target_user_id = auth.uid() OR is_super_admin(auth.uid()) THEN
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
  ELSE
    -- Return empty result if user doesn't have permission
    RETURN;
  END IF;
END;
$$;