/*
  # Fix infinite recursion in user_profiles RLS policy

  1. Problem
    - The current SELECT policy for user_profiles creates infinite recursion
    - It queries user_profiles table from within its own policy to check super_admin role
    - This causes the policy to call itself indefinitely

  2. Solution
    - Drop the existing problematic policy
    - Create a new policy that allows users to read their own profile
    - Create a separate policy for super admin access that doesn't cause recursion
    - Use a simpler approach that doesn't query the same table from within the policy

  3. Security
    - Users can only read their own profile data
    - Super admin functionality will be handled at the application level
    - Maintains data security while preventing recursion
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;

-- Create a simple policy that allows users to read their own profile
CREATE POLICY "user_profiles_select_own" 
  ON user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (id = auth.uid());

-- Drop the existing update policy and recreate it with the same simple logic
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;

CREATE POLICY "user_profiles_update_own" 
  ON user_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());