/*
  # Update Topic Permissions with Refined Access Control

  This migration updates the RLS policies for the topics table to implement
  a more granular permission system:

  1. Super admins can manage all topics
  2. Public topics are readable by everyone
  3. Organization topics are managed by organization members
  4. Private topics are managed by their creators
  5. Public legacy topics (no organization) can only be edited by super admins

  ## Changes Made
  - Drop and recreate all topic RLS policies
  - Ensure helper functions exist with proper signatures
  - Implement refined permission logic
*/

-- Drop existing RLS policies for the 'topics' table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.topics;

-- Drop existing helper functions to avoid signature conflicts
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid);
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid);

-- Recreate helper functions with proper signatures

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to organization
CREATE OR REPLACE FUNCTION has_org_access(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.organization_id = org_id 
    AND om.user_id = user_id
    AND o.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can edit in organization (admin or editor)
CREATE OR REPLACE FUNCTION can_edit_org(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.organization_id = org_id 
    AND om.user_id = user_id
    AND om.role IN ('org_admin', 'org_editor')
    AND o.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in organization
CREATE OR REPLACE FUNCTION get_org_role(org_id UUID, user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT om.role FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.organization_id = org_id 
    AND om.user_id = user_id
    AND o.status = 'approved'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  (organization_id IS NOT NULL AND has_org_access(organization_id, auth.uid())) OR
  (organization_id IS NULL AND created_by = auth.uid())
);

-- INSERT policy:
-- Allows super admins to create any topic.
-- Allows organization admins/editors to create topics within their organization.
-- Allows any authenticated user to create a private topic for themselves.
CREATE POLICY "Enable insert for authenticated users" ON public.topics
FOR INSERT WITH CHECK (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND created_by = auth.uid())
);

-- UPDATE policy:
-- Allows super admins to update any topic.
-- Allows organization admins/editors to update topics within their organization.
-- Allows the creator of a private, non-organizational topic to update it.
-- Public topics without an organization can only be updated by super admins.
CREATE POLICY "Enable update for authenticated users" ON public.topics
FOR UPDATE USING (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND is_public = FALSE AND created_by = auth.uid())
);

-- DELETE policy:
-- Allows super admins to delete any topic.
-- Allows organization admins/editors to delete topics within their organization.
-- Allows the creator of a private, non-organizational topic to delete it.
-- Public topics without an organization can only be deleted by super admins.
CREATE POLICY "Enable delete for authenticated users" ON public.topics
FOR DELETE USING (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND is_public = FALSE AND created_by = auth.uid())
);