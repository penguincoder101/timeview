/*
  # Allow Public Read Access to Topics and Events

  This migration updates the Row Level Security (RLS) policies to allow unauthenticated users 
  to read topics and events data, removing the authentication requirement for viewing content.

  ## Changes Made

  1. **Topics Table**
     - Drop existing authenticated-only SELECT policy
     - Create new policy allowing all users (including anonymous) to read topics

  2. **Events Table**
     - Drop existing authenticated-only SELECT policy  
     - Create new policy allowing all users (including anonymous) to read events

  ## Security Notes
  
  - Read access is now public for topics and events
  - Write operations (INSERT, UPDATE, DELETE) still require authentication
  - This enables the timeline explorer to work without user login
*/

-- Update topics table policies
DROP POLICY IF EXISTS topics_select_policy ON public.topics;

CREATE POLICY "topics_public_select_policy" 
  ON public.topics 
  FOR SELECT 
  USING (true);

-- Update events table policies  
DROP POLICY IF EXISTS events_select_policy ON public.events;

CREATE POLICY "events_public_select_policy" 
  ON public.events 
  FOR SELECT 
  USING (true);