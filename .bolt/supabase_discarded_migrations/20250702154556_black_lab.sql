/*
  # Update Topic Permissions

  1. RLS Policy Updates
    - Drop existing policies for topics table
    - Create refined policies for granular access control
    - Super admins can edit all topics
    - Organization members can edit topics within their organization
    - Users can only edit their own private topics
    - Public topics without organization can only be edited by super admins

  2. Security
    - Maintains data integrity
    - Prevents unauthorized access
    - Allows proper delegation of permissions
*/

-- Drop existing RLS policies for the 'topics' table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.topics;

-- Recreate RLS policies with refined access control

-- SELECT policy:
-- Allows super admins to read all topics.
-- Allows anyone to read topics marked as public.
-- Allows organization members to read topics belonging to their organization.
-- Allows the creator of a private, non-organizational topic to read it.
CREATE POLICY "Enable read access for all users" ON public.topics
FOR SELECT USING (
  is_super_admin() OR
  (is_public = TRUE) OR
  (organization_id IS NOT NULL AND has_org_access(organization_id, uid())) OR
  (organization_id IS NULL AND created_by = uid())
);

-- INSERT policy:
-- Allows super admins to create any topic.
-- Allows organization admins/editors to create topics within their organization.
-- Allows any authenticated user to create a private topic for themselves (organization_id IS NULL and created_by = uid()).
CREATE POLICY "Enable insert for authenticated users" ON public.topics
FOR INSERT WITH CHECK (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, uid())) OR
  (organization_id IS NULL AND created_by = uid())
);

-- UPDATE policy:
-- Allows super admins to update any topic.
-- Allows organization admins/editors to update topics within their organization.
-- Allows the creator of a private, non-organizational topic (is_public = FALSE) to update it.
-- Public topics without an organization can only be updated by super admins.
CREATE POLICY "Enable update for authenticated users" ON public.topics
FOR UPDATE USING (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, uid())) OR
  (organization_id IS NULL AND is_public = FALSE AND created_by = uid())
);

-- DELETE policy:
-- Allows super admins to delete any topic.
-- Allows organization admins/editors to delete topics within their organization.
-- Allows the creator of a private, non-organizational topic (is_public = FALSE) to delete it.
-- Public topics without an organization can only be deleted by super admins.
CREATE POLICY "Enable delete for authenticated users" ON public.topics
FOR DELETE USING (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, uid())) OR
  (organization_id IS NULL AND is_public = FALSE AND created_by = uid())
);