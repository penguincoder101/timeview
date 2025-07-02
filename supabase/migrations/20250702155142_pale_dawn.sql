/*
  # Update Topic Permissions with Refined Access Control

  This migration updates the RLS policies for topics to implement proper permission controls:
  - Super admins can manage all topics
  - Public topics are readable by everyone, editable only by super admins (if no organization)
  - Organization topics are managed by organization admins/editors
  - Private topics are managed only by their creators
*/

-- Drop existing RLS policies for the 'topics' table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.topics;

-- Drop existing helper functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS has_org_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_org(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_org_role(uuid, uuid) CASCADE;

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

-- Recreate RLS policies for topics with refined access control

-- SELECT policy for topics:
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

-- INSERT policy for topics:
-- Allows super admins to create any topic.
-- Allows organization admins/editors to create topics within their organization.
-- Allows any authenticated user to create a private topic for themselves.
CREATE POLICY "Enable insert for authenticated users" ON public.topics
FOR INSERT WITH CHECK (
  is_super_admin() OR
  (organization_id IS NOT NULL AND can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND created_by = auth.uid())
);

-- UPDATE policy for topics:
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

-- DELETE policy for topics:
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

-- Recreate dependent policies that were dropped with CASCADE

-- Events table policies
CREATE POLICY "Enable read access for all users" ON public.events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = events.topic_id 
    AND (
      (t.is_public = true) OR 
      (t.organization_id IS NULL) OR 
      is_super_admin() OR 
      has_org_access(t.organization_id, auth.uid())
    )
  )
);

CREATE POLICY "Enable insert for authenticated users" ON public.events
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin() OR 
      (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
      (t.organization_id IS NULL)
    )
  )
);

CREATE POLICY "Enable update for authenticated users" ON public.events
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin() OR 
      (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
      (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
);

CREATE POLICY "Enable delete for authenticated users" ON public.events
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = events.topic_id 
    AND (
      is_super_admin() OR 
      (t.organization_id IS NOT NULL AND can_edit_org(t.organization_id, auth.uid())) OR 
      (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
);

-- Organizations table policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
FOR SELECT USING (
  is_super_admin() OR 
  ((status = 'approved') AND has_org_access(id, auth.uid())) OR 
  (created_by = auth.uid())
);

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organization admins can update their organization" ON public.organizations
FOR UPDATE USING (
  is_super_admin() OR 
  (get_org_role(id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Organization admins can delete their organization" ON public.organizations
FOR DELETE USING (
  is_super_admin() OR 
  (get_org_role(id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Super admins can manage all organizations" ON public.organizations
FOR ALL USING (is_super_admin());

-- Organization memberships table policies
CREATE POLICY "Users can view memberships in their organizations" ON public.organization_memberships
FOR SELECT USING (
  is_super_admin() OR 
  (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_memberships.organization_id 
      AND ((o.status = 'approved') OR (o.created_by = auth.uid()))
    ) AND 
    has_org_access(organization_id, auth.uid())
  )
);

CREATE POLICY "Organization admins can manage memberships" ON public.organization_memberships
FOR INSERT WITH CHECK (
  is_super_admin() OR 
  (get_org_role(organization_id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Organization admins can update memberships" ON public.organization_memberships
FOR UPDATE USING (
  is_super_admin() OR 
  (get_org_role(organization_id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Organization admins can delete memberships" ON public.organization_memberships
FOR DELETE USING (
  is_super_admin() OR 
  (get_org_role(organization_id, auth.uid()) = 'org_admin') OR 
  (user_id = auth.uid())
);

CREATE POLICY "Super admins can manage all memberships" ON public.organization_memberships
FOR ALL USING (is_super_admin());