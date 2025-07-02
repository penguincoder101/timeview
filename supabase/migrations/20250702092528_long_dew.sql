/*
  # Create Default Organization and Migrate Existing Data

  1. Create a default organization for existing topics
  2. Migrate existing topics to the default organization
  3. Set up initial super admin user (to be configured manually)
*/

-- Create default organization for existing data
INSERT INTO public.organizations (id, name, slug, description, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default',
  'Default organization for migrated timeline topics',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Migrate existing topics to default organization
UPDATE public.topics 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Note: Super admin user needs to be set manually after first user signs up
-- Run this SQL in Supabase SQL editor after creating your first user:
-- UPDATE public.user_profiles SET role = 'super_admin' WHERE email = 'your-admin-email@example.com';