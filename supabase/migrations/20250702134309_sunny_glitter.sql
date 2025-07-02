-- Add status column to organizations table for approval workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Add constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_org_status'
  ) THEN
    ALTER TABLE public.organizations 
    ADD CONSTRAINT valid_org_status 
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Create index for organization status
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Update RLS policies for organizations to handle approval workflow
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    public.is_super_admin() OR 
    (status = 'approved' AND public.has_org_access(id, auth.uid())) OR
    (created_by = auth.uid()) -- Users can always see organizations they created
  );

-- Update organization memberships to only work with approved organizations
DROP POLICY IF EXISTS "Users can view memberships in their organizations" ON public.organization_memberships;
CREATE POLICY "Users can view memberships in their organizations" ON public.organization_memberships
  FOR SELECT USING (
    public.is_super_admin() OR 
    (EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND (o.status = 'approved' OR o.created_by = auth.uid())
    ) AND public.has_org_access(organization_id, auth.uid()))
  );

-- Function to approve organization and create admin membership
CREATE OR REPLACE FUNCTION public.approve_organization(org_id uuid)
RETURNS void AS $$
DECLARE
  org_creator_id uuid;
BEGIN
  -- Only super admins can approve organizations
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can approve organizations';
  END IF;

  -- Get the organization creator
  SELECT created_by INTO org_creator_id
  FROM public.organizations
  WHERE id = org_id;

  IF org_creator_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found or has no creator';
  END IF;

  -- Update organization status to approved
  UPDATE public.organizations
  SET status = 'approved'
  WHERE id = org_id;

  -- Create organization membership for the creator as admin
  INSERT INTO public.organization_memberships (user_id, organization_id, role)
  VALUES (org_creator_id, org_id, 'org_admin')
  ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'org_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject organization
CREATE OR REPLACE FUNCTION public.reject_organization(org_id uuid)
RETURNS void AS $$
BEGIN
  -- Only super admins can reject organizations
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can reject organizations';
  END IF;

  -- Update organization status to rejected
  UPDATE public.organizations
  SET status = 'rejected'
  WHERE id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending organizations (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_pending_organizations()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  created_by uuid,
  created_at timestamptz,
  creator_email text,
  creator_name text
) AS $$
BEGIN
  -- Only super admins can view pending organizations
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can view pending organizations';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.description,
    o.created_by,
    o.created_at,
    up.email as creator_email,
    up.full_name as creator_name
  FROM public.organizations o
  LEFT JOIN public.user_profiles up ON o.created_by = up.id
  WHERE o.status = 'pending'
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set existing organizations to approved status (for migration)
UPDATE public.organizations 
SET status = 'approved' 
WHERE status = 'pending' AND id = '00000000-0000-0000-0000-000000000001';