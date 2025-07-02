/*
  # Fix ambiguous user_id column references in RLS policies

  1. Problem
    - The organization_memberships table has RLS policies with ambiguous "user_id" references
    - This causes conflicts between table columns and function parameters
    - Results in "column reference 'user_id' is ambiguous" errors

  2. Solution
    - Drop existing RLS policies for organization_memberships table
    - Recreate policies with properly qualified column references
    - Ensure all references use "organization_memberships.user_id" instead of just "user_id"

  3. Security
    - Maintains the same security model as before
    - Only fixes the ambiguous column reference issue
*/

-- Drop existing policies for organization_memberships table
DROP POLICY IF EXISTS "memberships_delete_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_insert_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_select_policy" ON organization_memberships;
DROP POLICY IF EXISTS "memberships_update_policy" ON organization_memberships;

-- Recreate SELECT policy with properly qualified column references
CREATE POLICY "memberships_select_policy"
  ON organization_memberships
  FOR SELECT
  TO public
  USING (
    is_super_admin() OR (
      (EXISTS ( 
        SELECT 1
        FROM organizations o
        WHERE (
          (o.id = organization_memberships.organization_id) AND 
          ((o.status = 'approved'::text) OR (o.created_by = uid()))
        )
      )) AND 
      has_org_access(organization_memberships.organization_id, uid())
    )
  );

-- Recreate INSERT policy with properly qualified column references
CREATE POLICY "memberships_insert_policy"
  ON organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR (
      get_org_role(organization_memberships.organization_id, uid()) = 'org_admin'::text
    )
  );

-- Recreate UPDATE policy with properly qualified column references
CREATE POLICY "memberships_update_policy"
  ON organization_memberships
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR (
      get_org_role(organization_memberships.organization_id, uid()) = 'org_admin'::text
    )
  );

-- Recreate DELETE policy with properly qualified column references
CREATE POLICY "memberships_delete_policy"
  ON organization_memberships
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR 
    (get_org_role(organization_memberships.organization_id, uid()) = 'org_admin'::text) OR 
    (organization_memberships.user_id = uid())
  );