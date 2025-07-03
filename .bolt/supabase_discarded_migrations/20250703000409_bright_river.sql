/*
  # Remove Organization Features Migration

  This migration removes all organization-related functionality from the database:
  
  1. Drops organization-related tables and functions
  2. Removes organization columns from topics table
  3. Simplifies RLS policies for admin-only topic management
  4. Keeps only super admin and standard user roles
  
  WARNING: This is a destructive migration that will remove all organization data.
*/

-- Temporarily disable RLS to avoid dependency issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "topics_select_policy" ON topics;
DROP POLICY IF EXISTS "topics_insert_policy" ON topics;
DROP POLICY IF EXISTS "topics_update_policy" ON topics;
DROP POLICY IF EXISTS "topics_delete_policy" ON topics;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- Drop organization-related functions
DROP FUNCTION IF EXISTS get_pending_organizations();
DROP FUNCTION IF EXISTS approve_organization(uuid);
DROP FUNCTION IF EXISTS reject_organization(uuid);
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid);
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid);
DROP FUNCTION IF EXISTS is_super_admin_safe(uuid);

-- Drop organization membership table (this will cascade to remove foreign keys)
DROP TABLE IF EXISTS organization_memberships CASCADE;

-- Drop organizations table
DROP TABLE IF EXISTS organizations CASCADE;

-- Remove organization-related columns and constraints from topics table
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_organization_id_fkey;
DROP INDEX IF EXISTS idx_topics_organization_id;
DROP INDEX IF EXISTS idx_topics_is_public;
ALTER TABLE topics DROP COLUMN IF EXISTS organization_id;
ALTER TABLE topics DROP COLUMN IF EXISTS is_public;

-- Remove organization-related columns from events table if they exist
ALTER TABLE events DROP COLUMN IF EXISTS organization_id;

-- Update user_profiles role constraint to only allow super_admin and standard_user
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE user_profiles ADD CONSTRAINT valid_role 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'standard_user'::text]));

-- Recreate essential helper functions
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return false if user_id is null
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has super_admin role
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = user_id 
    AND role = 'super_admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

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
  
  IF auth.uid() != target_user_id AND NOT is_super_admin(auth.uid()) THEN
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

-- Re-enable RLS on remaining tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies

-- User profiles: Users can view/update their own profile, super admins can view/update all
CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_super_admin(auth.uid()));

CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_super_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR is_super_admin(auth.uid()));

-- Topics: All authenticated users can read, only super admins can create/update/delete
CREATE POLICY "topics_select_policy" ON topics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "topics_insert_policy" ON topics
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "topics_update_policy" ON topics
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "topics_delete_policy" ON topics
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));

-- Events: All authenticated users can read, only super admins can create/update/delete
CREATE POLICY "events_select_policy" ON events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "events_insert_policy" ON events
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "events_update_policy" ON events
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "events_delete_policy" ON events
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;

-- Update any existing topics to remove organization references
UPDATE topics SET created_by = NULL WHERE created_by IS NOT NULL;

-- Clean up any orphaned data
DELETE FROM events WHERE topic_id NOT IN (SELECT id FROM topics);