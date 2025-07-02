/*
  # Topic Editing Permissions Migration

  This migration implements refined access control for topics with the following permissions:

  ## Topics Access Control:
  - **Super Admins**: Full access to all topics
  - **Public Topics**: Readable by everyone, editable only by super admins (if no organization)
  - **Organization Topics**: Managed by organization admins/editors
  - **Private Topics**: Managed only by their creators

  ## Changes:
  1. Drop and recreate helper functions to ensure clean state
  2. Update topic RLS policies with refined permission logic
  3. Recreate all dependent policies that were affected by CASCADE
*/

-- Drop existing RLS policies for all affected tables
DROP POLICY IF EXISTS "Enable read access for all users" ON public.topics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.topics;

-- Drop events policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.events;

-- Drop organizations policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can delete their organization" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;

-- Drop organization memberships policies
DROP POLICY IF EXISTS "Users can view memberships in their organizations" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can manage memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can update memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Organization admins can delete memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.organization_memberships;

-- Drop all existing helper functions with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_org_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_org(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_org_role(uuid, uuid) CASCADE;

-- Recreate helper functions with proper signatures

-- Function to check if current user is super admin (no parameters)
CREATE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to organization
CREATE FUNCTION public.has_org_access(org_id UUID, user_id UUID)
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
CREATE FUNCTION public.can_edit_org(org_id UUID, user_id UUID)
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
CREATE FUNCTION public.get_org_role(org_id UUID, user_id UUID)
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

-- Create RLS policies for topics with refined access control

-- SELECT policy for topics:
-- Allows super admins to read all topics.
-- Allows anyone to read topics marked as public.
-- Allows organization members to read topics belonging to their organization.
-- Allows the creator of a private, non-organizational topic to read it.
CREATE POLICY "Enable read access for all users" ON public.topics
FOR SELECT USING (
  public.is_super_admin() OR
  (is_public = TRUE) OR
  (organization_id IS NOT NULL AND public.has_org_access(organization_id, auth.uid())) OR
  (organization_id IS NULL AND created_by = auth.uid())
);

-- INSERT policy for topics:
-- Allows super admins to create any topic.
-- Allows organization admins/editors to create topics within their organization.
-- Allows any authenticated user to create a private topic for themselves.
CREATE POLICY "Enable insert for authenticated users" ON public.topics
FOR INSERT WITH CHECK (
  public.is_super_admin() OR
  (organization_id IS NOT NULL AND public.can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND created_by = auth.uid())
);

-- UPDATE policy for topics:
-- Allows super admins to update any topic.
-- Allows organization admins/editors to update topics within their organization.
-- Allows the creator of a private, non-organizational topic to update it.
-- Public topics without an organization can only be updated by super admins.
CREATE POLICY "Enable update for authenticated users" ON public.topics
FOR UPDATE USING (
  public.is_super_admin() OR
  (organization_id IS NOT NULL AND public.can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND is_public = FALSE AND created_by = auth.uid())
);

-- DELETE policy for topics:
-- Allows super admins to delete any topic.
-- Allows organization admins/editors to delete topics within their organization.
-- Allows the creator of a private, non-organizational topic to delete it.
-- Public topics without an organization can only be deleted by super admins.
CREATE POLICY "Enable delete for authenticated users" ON public.topics
FOR DELETE USING (
  public.is_super_admin() OR
  (organization_id IS NOT NULL AND public.can_edit_org(organization_id, auth.uid())) OR
  (organization_id IS NULL AND is_public = FALSE AND created_by = auth.uid())
);

-- Create events table policies
CREATE POLICY "Enable read access for all users" ON public.events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.topics t
    WHERE t.id = events.topic_id 
    AND (
      (t.is_public = true) OR 
      (t.organization_id IS NULL) OR 
      public.is_super_admin() OR 
      public.has_org_access(t.organization_id, auth.uid())
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
      public.is_super_admin() OR 
      (t.organization_id IS NOT NULL AND public.can_edit_org(t.organization_id, auth.uid())) OR 
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
      public.is_super_admin() OR 
      (t.organization_id IS NOT NULL AND public.can_edit_org(t.organization_id, auth.uid())) OR 
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
      public.is_super_admin() OR 
      (t.organization_id IS NOT NULL AND public.can_edit_org(t.organization_id, auth.uid())) OR 
      (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
);

-- Create organizations table policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
FOR SELECT USING (
  public.is_super_admin() OR 
  ((status = 'approved') AND public.has_org_access(id, auth.uid())) OR 
  (created_by = auth.uid())
);

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organization admins can update their organization" ON public.organizations
FOR UPDATE USING (
  public.is_super_admin() OR 
  (public.get_org_role(id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Organization admins can delete their organization" ON public.organizations
FOR DELETE USING (
  public.is_super_admin() OR 
  (public.get_org_role(id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Super admins can manage all organizations" ON public.organizations
FOR ALL USING (public.is_super_admin());

-- Create organization memberships table policies
CREATE POLICY "Users can view memberships in their organizations" ON public.organization_memberships
FOR SELECT USING (
  public.is_super_admin() OR 
  (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_memberships.organization_id 
      AND ((o.status = 'approved') OR (o.created_by = auth.uid()))
    ) AND 
    public.has_org_access(organization_id, auth.uid())
  )
);

CREATE POLICY "Organization admins can manage memberships" ON public.organization_memberships
FOR INSERT WITH CHECK (
  public.is_super_admin() OR 
  (public.get_org_role(organization_id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Organization admins can update memberships" ON public.organization_memberships
FOR UPDATE USING (
  public.is_super_admin() OR 
  (public.get_org_role(organization_id, auth.uid()) = 'org_admin')
);

CREATE POLICY "Organization admins can delete memberships" ON public.organization_memberships
FOR DELETE USING (
  public.is_super_admin() OR 
  (public.get_org_role(organization_id, auth.uid()) = 'org_admin') OR 
  (user_id = auth.uid())
);

CREATE POLICY "Super admins can manage all memberships" ON public.organization_memberships
FOR ALL USING (public.is_super_admin());