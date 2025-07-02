/*
  # Add public topics support

  1. Schema Changes
    - Add `is_public` column to topics table with default false
    - Update RLS policy to allow public access to public topics

  2. Security
    - Modify "Enable read access for all users" policy on topics table
    - Allow SELECT access if is_public is true, regardless of authentication
    - Maintain existing organization-based access controls
*/

-- Add is_public column to topics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'topics' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.topics ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Update the RLS policy for topics to allow public access to public topics
DROP POLICY IF EXISTS "Enable read access for all users" ON public.topics;
CREATE POLICY "Enable read access for all users" ON public.topics
  FOR SELECT USING (
    -- Public access for public topics
    is_public = true OR
    -- Public access for legacy topics without organization
    organization_id IS NULL OR
    -- Super admin access
    public.is_super_admin() OR
    -- Organization member access
    public.has_org_access(organization_id, auth.uid())
  );

-- Update the RLS policy for events to allow public access to events of public topics
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
CREATE POLICY "Enable read access for all users" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.topics t
      WHERE t.id = topic_id AND (
        -- Public access for public topics
        t.is_public = true OR
        -- Public access for legacy topics without organization
        t.organization_id IS NULL OR
        -- Super admin access
        public.is_super_admin() OR
        -- Organization member access
        public.has_org_access(t.organization_id, auth.uid())
      )
    )
  );

-- Create index for performance on is_public column
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON public.topics(is_public);

-- Mark some existing topics as public (the original sample topics)
UPDATE public.topics 
SET is_public = true 
WHERE id IN (
  'seven-wonders',
  'wwii', 
  'ancient-civilizations',
  'ancient-rwanda',
  'rwandan-kingdoms',
  'independence-movements',
  'scientific-milestones',
  'cultural-revolutions',
  'global-conflicts',
  'influential-figures'
);