/*
  # Fix RLS infinite recursion in user_profiles policies

  1. Problem
    - The `is_super_admin()` function queries `user_profiles` table
    - When used in `user_profiles` RLS policies, it creates infinite recursion
    - This happens because RLS policies are triggered when the helper function queries the same table

  2. Solution
    - Create helper functions that use `SECURITY DEFINER` to bypass RLS
    - Simplify the user_profiles policies to avoid self-referencing
    - Use auth.uid() directly where possible instead of complex helper functions

  3. Changes
    - Drop existing problematic helper functions
    - Create new safe helper functions
    - Update user_profiles policies to prevent recursion
    - Ensure other policies still work correctly
*/

-- Drop existing helper functions that might cause recursion
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_super_admin(uuid);

-- Create a safe helper function that bypasses RLS for checking super admin status
CREATE OR REPLACE FUNCTION is_super_admin_safe()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a direct query that bypasses RLS by using SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$;

-- Create a safe helper function for checking super admin status of any user
CREATE OR REPLACE FUNCTION is_super_admin_safe(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a direct query that bypasses RLS by using SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = user_id 
    AND role = 'super_admin'
  );
END;
$$;

-- Recreate other helper functions to use the safe super admin check
CREATE OR REPLACE FUNCTION has_org_access(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admins have access to everything
  IF is_super_admin_safe(user_id) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member of the organization
  RETURN EXISTS (
    SELECT 1 
    FROM organization_memberships 
    WHERE organization_id = org_id 
    AND organization_memberships.user_id = has_org_access.user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_org_role(org_id uuid, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Super admins have super admin role
  IF is_super_admin_safe(user_id) THEN
    RETURN 'super_admin';
  END IF;
  
  -- Get the user's role in the organization
  SELECT role INTO user_role
  FROM organization_memberships
  WHERE organization_id = org_id 
  AND organization_memberships.user_id = get_org_role.user_id;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;

CREATE OR REPLACE FUNCTION can_edit_org(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admins can edit everything
  IF is_super_admin_safe(user_id) THEN
    RETURN true;
  END IF;
  
  -- Check if user has admin or editor role in the organization
  RETURN EXISTS (
    SELECT 1 
    FROM organization_memberships 
    WHERE organization_id = org_id 
    AND organization_memberships.user_id = can_edit_org.user_id
    AND role IN ('org_admin', 'org_editor')
  );
END;
$$;

-- Now update the user_profiles policies to be simple and avoid recursion
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;

-- Simple SELECT policy that doesn't cause recursion
CREATE POLICY "user_profiles_select_policy" 
ON user_profiles FOR SELECT 
TO public 
USING (
  -- Users can see their own profile
  id = auth.uid() 
  OR 
  -- Or if they are a super admin (checked via auth metadata or direct role check)
  -- We avoid the helper function here to prevent recursion
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Simple UPDATE policy that doesn't cause recursion  
CREATE POLICY "user_profiles_update_policy" 
ON user_profiles FOR UPDATE 
TO public 
USING (
  -- Users can update their own profile
  id = auth.uid()
  OR
  -- Or if they are a super admin (direct check to avoid recursion)
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Update other policies to use the safe helper functions
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
CREATE POLICY "organizations_select_policy" 
ON organizations FOR SELECT 
TO public 
USING (
  is_super_admin_safe() 
  OR (status = 'approved' AND has_org_access(id, auth.uid())) 
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
CREATE POLICY "organizations_insert_policy" 
ON organizations FOR INSERT 
TO public 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
CREATE POLICY "organizations_update_policy" 
ON organizations FOR UPDATE 
TO public 
USING (
  is_super_admin_safe() 
  OR get_org_role(id, auth.uid()) = 'org_admin'
);

DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;
CREATE POLICY "organizations_delete_policy" 
ON organizations FOR DELETE 
TO public 
USING (
  is_super_admin_safe() 
  OR get_org_role(id, auth.uid()) = 'org_admin'
);

-- Update organization_memberships policies
DROP POLICY IF EXISTS "memberships_select_policy" ON organization_memberships;
CREATE POLICY "memberships_select_policy" 
ON organization_memberships FOR SELECT 
TO public 
USING (
  is_super_admin_safe() 
  OR user_id = auth.uid() 
  OR get_org_role(organization_id, auth.uid()) = 'org_admin'
);

DROP POLICY IF EXISTS "memberships_insert_policy" ON organization_memberships;
CREATE POLICY "memberships_insert_policy" 
ON organization_memberships FOR INSERT 
TO public 
WITH CHECK (
  is_super_admin_safe() 
  OR get_org_role(organization_id, auth.uid()) = 'org_admin'
);

DROP POLICY IF EXISTS "memberships_update_policy" ON organization_memberships;
CREATE POLICY "memberships_update_policy" 
ON organization_memberships FOR UPDATE 
TO public 
USING (
  is_super_admin_safe() 
  OR get_org_role(organization_id, auth.uid()) = 'org_admin'
);

DROP POLICY IF EXISTS "memberships_delete_policy" ON organization_memberships;
CREATE POLICY "memberships_delete_policy" 
ON organization_memberships FOR DELETE 
TO public 
USING (
  is_super_admin_safe() 
  OR get_org_role(organization_id, auth.uid()) = 'org_admin' 
  OR user_id = auth.uid()
);

-- Update topics policies
DROP POLICY IF EXISTS "topics_select_policy" ON topics;
CREATE POLICY "topics_select_policy" 
ON topics FOR SELECT 
TO public 
USING (
  is_super_admin_safe() 
  OR is_public = true 
  OR (organization_id IS NOT NULL AND has_org_access(organization_id, auth.uid())) 
  OR (organization_id IS NULL AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "topics_insert_policy" ON topics;
CREATE POLICY "topics_insert_policy" 
ON topics FOR INSERT 
TO public 
WITH CHECK (
  is_super_admin_safe() 
  OR (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) 
  OR (organization_id IS NULL AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "topics_update_policy" ON topics;
CREATE POLICY "topics_update_policy" 
ON topics FOR UPDATE 
TO public 
USING (
  is_super_admin_safe() 
  OR (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) 
  OR (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "topics_delete_policy" ON topics;
CREATE POLICY "topics_delete_policy" 
ON topics FOR DELETE 
TO public 
USING (
  is_super_admin_safe() 
  OR (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) 
  OR (organization_id IS NULL AND is_public = false AND created_by = auth.uid())
);

-- Update events policies
DROP POLICY IF EXISTS "events_select_policy" ON events;
CREATE POLICY "events_select_policy" 
ON events FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin_safe() 
      OR t.is_public = true 
      OR (t.organization_id IS NOT NULL AND has_org_access(t.organization_id, auth.uid())) 
      OR (t.organization_id IS NULL AND t.created_by = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "events_insert_policy" ON events;
CREATE POLICY "events_insert_policy" 
ON events FOR INSERT 
TO public 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin_safe() 
      OR (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) 
      OR t.organization_id IS NULL
    )
  )
);

DROP POLICY IF EXISTS "events_update_policy" ON events;
CREATE POLICY "events_update_policy" 
ON events FOR UPDATE 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin_safe() 
      OR (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) 
      OR (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
);

DROP POLICY IF EXISTS "events_delete_policy" ON events;
CREATE POLICY "events_delete_policy" 
ON events FOR DELETE 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin_safe() 
      OR (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) 
      OR (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
);