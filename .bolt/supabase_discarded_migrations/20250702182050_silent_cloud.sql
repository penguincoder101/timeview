/*
  # Fix ambiguous user_id column reference

  1. Database Functions
    - Update helper functions to properly qualify column references
    - Rename function parameters to avoid conflicts with column names
    
  2. Security
    - Maintain existing RLS policies functionality
    - Ensure proper column qualification in all functions
*/

-- Drop existing functions to recreate them with proper column qualification
DROP FUNCTION IF EXISTS uid();
DROP FUNCTION IF EXISTS is_super_admin();
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

-- Update organization_memberships policies to use the corrected functions
DROP POLICY IF EXISTS "memberships_select_policy" ON organization_memberships;
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

-- Update other policies that might have similar issues
DROP POLICY IF EXISTS "memberships_insert_policy" ON organization_memberships;
CREATE POLICY "memberships_insert_policy"
  ON organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR 
    get_org_role(organization_memberships.organization_id, uid()) = 'org_admin'
  );

DROP POLICY IF EXISTS "memberships_update_policy" ON organization_memberships;
CREATE POLICY "memberships_update_policy"
  ON organization_memberships
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR 
    get_org_role(organization_memberships.organization_id, uid()) = 'org_admin'
  );

DROP POLICY IF EXISTS "memberships_delete_policy" ON organization_memberships;
CREATE POLICY "memberships_delete_policy"
  ON organization_memberships
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR 
    get_org_role(organization_memberships.organization_id, uid()) = 'org_admin' OR 
    organization_memberships.user_id = uid()
  );