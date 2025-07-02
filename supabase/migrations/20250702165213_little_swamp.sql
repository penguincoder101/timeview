/*
  # Fix User Profile Creation

  This migration ensures that user profiles are automatically created when users sign up.
  
  1. Functions
    - Creates or replaces the `handle_new_user()` function
    - This function automatically creates a user profile when a new user signs up
  
  2. Triggers
    - Creates the `on_auth_user_created` trigger on the `auth.users` table
    - This trigger calls `handle_new_user()` after each user insertion
  
  3. Security
    - Function is marked as SECURITY DEFINER to run with elevated privileges
    - Ensures all new users get a proper profile entry
*/

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to call handle_new_user after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;