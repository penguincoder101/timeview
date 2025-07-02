/*
  # Fix ambiguous user_id column reference in organization_memberships policies

  1. Policy Updates
    - Update all RLS policies on organization_memberships table to properly qualify column references
    - Replace ambiguous `user_id` with `organization_memberships.user_id`
    - Ensure all column references are fully qualified to prevent ambiguity

  2. Security
    - Maintain existing security logic while fixing column reference issues
    - Preserve all existing access controls and permissions
*/

-- Drop existing policies to recreate them with proper column qualification
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
          o.id = organization_memberships.organization_id AND (
            o.status = 'approved'::text OR 
            o.created_by = auth.uid()
          )
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
    is_super_admin() OR (
      get_org_role(organization_memberships.organization_id, auth.uid()) = 'org_admin'::text
    ) OR (
      organization_memberships.user_id = auth.uid()
    )
  );