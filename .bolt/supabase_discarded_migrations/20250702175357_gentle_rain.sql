/*
  # Fix ambiguous user_id column references in organization_memberships RLS policies

  1. Security Updates
    - Drop existing RLS policies for organization_memberships table
    - Recreate policies with properly qualified column references
    - Use auth.uid() instead of uid() for current user identification
    - Maintain same security model with proper column qualification

  2. Changes
    - All user_id references now qualified as organization_memberships.user_id
    - All organization_id references now qualified as organization_memberships.organization_id
    - Replace uid() with auth.uid() throughout policies
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
          ((o.status = 'approved'::text) OR (o.created_by = auth.uid()))
        )
      )) AND 
      has_org_access(organization_memberships.organization_id, auth.uid())
    )
  );

-- Recreate INSERT policy with properly qualified column references
CREATE POLICY "memberships_insert_policy"
  ON organization_memberships
  FOR INSERT
  TO public
  WITH CHECK (
    is_super_admin() OR (
      get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'::text
    )
  );

-- Recreate UPDATE policy with properly qualified column references
CREATE POLICY "memberships_update_policy"
  ON organization_memberships
  FOR UPDATE
  TO public
  USING (
    is_super_admin() OR (
      get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'::text
    )
  );

-- Recreate DELETE policy with properly qualified column references
CREATE POLICY "memberships_delete_policy"
  ON organization_memberships
  FOR DELETE
  TO public
  USING (
    is_super_admin() OR 
    (get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'::text) OR 
    (organization_memberships.user_id = auth.uid())
  );