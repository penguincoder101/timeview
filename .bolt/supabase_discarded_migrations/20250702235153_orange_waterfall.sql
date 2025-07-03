/*
  # Fix get_pending_organizations RPC function

  1. Changes Made
    - Drop the existing get_pending_organizations function if it exists
    - Recreate it with the correct helper function call (is_super_admin instead of is_super_admin_safe)
    - Ensure proper security by checking if the current user is a super admin
    - Return organization details with creator information for pending organizations

  2. Security
    - Only super admins can call this function
    - Uses the correct is_super_admin helper function with auth.uid()
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_pending_organizations();

-- Create the corrected function
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
AS $$
BEGIN
  -- Check if the current user is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  -- Return pending organizations with creator details
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
  LEFT JOIN user_profiles up ON o.created_by = up.id
  WHERE o.status = 'pending'
  ORDER BY o.created_at DESC;
END;
$$;