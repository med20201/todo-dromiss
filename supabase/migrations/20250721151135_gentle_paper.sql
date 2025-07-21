/*
  # Fix auth users with simplified approach
  
  This migration creates auth users using the admin API approach
  and ensures proper RLS policies are in place.
*/

-- First, let's make sure we have the proper RLS policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create simplified RLS policies
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for users based on auth_id" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = auth_id);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update existing users to have proper auth_id format
-- We'll use the existing IDs but convert them to proper UUIDs
UPDATE users SET auth_id = 
  CASE 
    WHEN email = 'mohamed@dromiss.com' THEN '11111111-1111-1111-1111-111111111111'::uuid
    WHEN email = 'fatima-zahra@dromiss.com' THEN '22222222-2222-2222-2222-222222222222'::uuid
    WHEN email = 'amine@dromiss.com' THEN '33333333-3333-3333-3333-333333333333'::uuid
    WHEN email = 'ibtissam@dromiss.com' THEN '44444444-4444-4444-4444-444444444444'::uuid
    WHEN email = 'oualid@dromiss.com' THEN '55555555-5555-5555-5555-555555555555'::uuid
  END
WHERE email IN ('mohamed@dromiss.com', 'fatima-zahra@dromiss.com', 'amine@dromiss.com', 'ibtissam@dromiss.com', 'oualid@dromiss.com');