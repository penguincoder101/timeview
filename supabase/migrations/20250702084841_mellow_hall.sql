/*
  # Timeline Explorer Database Schema

  1. New Tables
    - `topics`
      - `id` (text, primary key)
      - `name` (text, not null)
      - `default_display_mode` (text, default 'years')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `events`
      - `id` (text, primary key)
      - `topic_id` (text, foreign key to topics)
      - `title` (text, not null)
      - `date` (text, not null)
      - `year` (integer, not null)
      - `description` (text, not null)
      - `short_description` (text, optional)
      - `image_url` (text, not null)
      - `details_url` (text, optional)
      - `tags` (text array, optional)
      - `related_topic_id` (text, foreign key to topics, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for authenticated user write access

  3. Indexes
    - Add indexes for performance on commonly queried fields
*/

-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
  id text PRIMARY KEY,
  name text NOT NULL,
  default_display_mode text DEFAULT 'years'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  topic_id text NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  date text NOT NULL,
  year integer NOT NULL,
  description text NOT NULL,
  short_description text,
  image_url text NOT NULL,
  details_url text,
  tags text[],
  related_topic_id text REFERENCES public.topics(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for topics table
CREATE POLICY "Enable read access for all users" ON public.topics
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.topics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.topics
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON public.topics
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for events table
CREATE POLICY "Enable read access for all users" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.events
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON public.events
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_topic_id ON public.events(topic_id);
CREATE INDEX IF NOT EXISTS idx_events_year ON public.events(year);
CREATE INDEX IF NOT EXISTS idx_events_related_topic_id ON public.events(related_topic_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();