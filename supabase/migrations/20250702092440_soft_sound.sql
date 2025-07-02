/*
  # Multi-Tenant Database Schema Implementation

  1. New Tables
    - `user_profiles` - Extended user information with global roles
    - `organizations` - Independent entities managing their own timelines
    - `organization_memberships` - Links users to organizations with specific roles
    
  2. Modified Tables
    - `topics` - Add organization_id and created_by columns
    - `events` - Add created_by and last_modified_by columns
    
  3. Security
    - Enable RLS on all tables
    - Create comprehensive policies for role-based access
    - Super admin bypass policies
    - Organization-scoped data access
    
  4. Functions
    - Helper functions for role checking
    - Organization membership validation
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'standard_user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'standard_user'))
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_memberships table
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'org_viewer',
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id),
  CONSTRAINT valid_org_role CHECK (role IN ('org_admin', 'org_editor', 'org_viewer'))
);

-- Add organization_id and created_by to topics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.topics ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.topics ADD COLUMN created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add created_by and last_modified_by to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.events ADD COLUMN created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'last_modified_by'
  ) THEN
    ALTER TABLE public.events ADD COLUMN last_modified_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION public.has_org_access(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = org_id AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check organization role
CREATE OR REPLACE FUNCTION public.get_org_role(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.organization_memberships
  WHERE organization_id = org_id AND user_id = user_id;
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit in organization
CREATE OR REPLACE FUNCTION public.can_edit_org(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Super admins can edit anything
  IF public.is_super_admin(user_id) THEN
    RETURN true;
  END IF;
  
  -- Check organization role
  user_role := public.get_org_role(org_id, user_id);
  RETURN user_role IN ('org_admin', 'org_editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.user_profiles;
CREATE POLICY "Super admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (public.is_super_admin());

-- RLS Policies for organizations
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    public.is_super_admin() OR 
    public.has_org_access(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Organization admins can update their organization" ON public.organizations;
CREATE POLICY "Organization admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    public.is_super_admin() OR 
    public.get_org_role(id, auth.uid()) = 'org_admin'
  );

DROP POLICY IF EXISTS "Organization admins can delete their organization" ON public.organizations;
CREATE POLICY "Organization admins can delete their organization" ON public.organizations
  FOR DELETE USING (
    public.is_super_admin() OR 
    public.get_org_role(id, auth.uid()) = 'org_admin'
  );

-- RLS Policies for organization_memberships
DROP POLICY IF EXISTS "Super admins can manage all memberships" ON public.organization_memberships;
CREATE POLICY "Super admins can manage all memberships" ON public.organization_memberships
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Users can view memberships in their organizations" ON public.organization_memberships;
CREATE POLICY "Users can view memberships in their organizations" ON public.organization_memberships
  FOR SELECT USING (
    public.is_super_admin() OR 
    public.has_org_access(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Organization admins can manage memberships" ON public.organization_memberships;
CREATE POLICY "Organization admins can manage memberships" ON public.organization_memberships
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR 
    public.get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

DROP POLICY IF EXISTS "Organization admins can update memberships" ON public.organization_memberships;
CREATE POLICY "Organization admins can update memberships" ON public.organization_memberships
  FOR UPDATE USING (
    public.is_super_admin() OR 
    public.get_org_role(organization_id, auth.uid()) = 'org_admin'
  );

DROP POLICY IF EXISTS "Organization admins can delete memberships" ON public.organization_memberships;
CREATE POLICY "Organization admins can delete memberships" ON public.organization_memberships
  FOR DELETE USING (
    public.is_super_admin() OR 
    public.get_org_role(organization_id, auth.uid()) = 'org_admin' OR
    user_id = auth.uid() -- Users can remove themselves
  );

-- Update RLS Policies for topics table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.topics;
CREATE POLICY "Enable read access for all users" ON public.topics
  FOR SELECT USING (
    -- Public access for topics without organization (legacy)
    organization_id IS NULL OR
    -- Super admin access
    public.is_super_admin() OR
    -- Organization member access
    public.has_org_access(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.topics;
CREATE POLICY "Enable insert for authenticated users" ON public.topics
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Super admin can create anywhere
      public.is_super_admin() OR
      -- Organization members with edit rights can create
      (organization_id IS NOT NULL AND public.can_edit_org(organization_id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.topics;
CREATE POLICY "Enable update for authenticated users" ON public.topics
  FOR UPDATE USING (
    -- Super admin can update anything
    public.is_super_admin() OR
    -- Organization editors can update topics in their org
    (organization_id IS NOT NULL AND public.can_edit_org(organization_id, auth.uid())) OR
    -- Legacy topics (no organization) can be updated by authenticated users
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.topics;
CREATE POLICY "Enable delete for authenticated users" ON public.topics
  FOR DELETE USING (
    -- Super admin can delete anything
    public.is_super_admin() OR
    -- Organization editors can delete topics in their org
    (organization_id IS NOT NULL AND public.can_edit_org(organization_id, auth.uid())) OR
    -- Legacy topics (no organization) can be deleted by authenticated users
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- Update RLS Policies for events table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
CREATE POLICY "Enable read access for all users" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND (
        -- Public access for topics without organization (legacy)
        t.organization_id IS NULL OR
        -- Super admin access
        public.is_super_admin() OR
        -- Organization member access
        public.has_org_access(t.organization_id, auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.events;
CREATE POLICY "Enable insert for authenticated users" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND (
        -- Super admin can create anywhere
        public.is_super_admin() OR
        -- Organization editors can create events
        (t.organization_id IS NOT NULL AND public.can_edit_org(t.organization_id, auth.uid())) OR
        -- Legacy topics (no organization) allow authenticated users
        (t.organization_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.events;
CREATE POLICY "Enable update for authenticated users" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND (
        -- Super admin can update anything
        public.is_super_admin() OR
        -- Organization editors can update events
        (t.organization_id IS NOT NULL AND public.can_edit_org(t.organization_id, auth.uid())) OR
        -- Legacy topics (no organization) allow authenticated users
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.events;
CREATE POLICY "Enable delete for authenticated users" ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND (
        -- Super admin can delete anything
        public.is_super_admin() OR
        -- Organization editors can delete events
        (t.organization_id IS NOT NULL AND public.can_edit_org(t.organization_id, auth.uid())) OR
        -- Legacy topics (no organization) allow authenticated users
        (t.organization_id IS NULL AND auth.uid() IS NOT NULL)
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_id ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org_id ON public.organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_role ON public.organization_memberships(role);
CREATE INDEX IF NOT EXISTS idx_topics_organization_id ON public.topics(organization_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_by ON public.topics(created_by);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_last_modified_by ON public.events(last_modified_by);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();