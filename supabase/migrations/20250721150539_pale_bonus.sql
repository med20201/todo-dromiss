/*
  # Create users table and authentication setup

  1. New Tables
    - `users` table with proper structure
    - Links to Supabase auth.users via auth_id

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users to read/update their own data
    - Add policy for admins to manage all users

  3. Sample Data
    - Insert sample users from db.json
    - Create corresponding auth users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text, -- For reference only, actual auth handled by Supabase
  role text,
  department text,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

-- Policy: Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('Manager Technique', 'Responsable Technique', 'Responsable Marketing')
    )
  );

-- Policy: Admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('Manager Technique', 'Responsable Technique', 'Responsable Marketing')
    )
  );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('Manager Technique', 'Responsable Technique', 'Responsable Marketing')
    )
  );

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND role IN ('Manager Technique', 'Responsable Technique', 'Responsable Marketing')
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_id, name, email, role, department, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    NEW.raw_user_meta_data->>'avatar'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Insert sample users (you'll need to create these in Supabase Auth dashboard or via API)
-- Note: These are just the profile records. The actual auth users need to be created separately.

-- For now, let's create a temporary admin user profile that can be linked later
INSERT INTO users (id, name, email, role, department, password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mohamed Aboummar', 'mohamed@dromiss.com', 'Responsable Technique', 'Technique', 'demo123'),
  ('00000000-0000-0000-0000-000000000002', 'Fatima Zahra FIGASSOUN', 'fatima-zahra@dromiss.com', 'Responsable Marketing', 'Marketing', 'demo123'),
  ('00000000-0000-0000-0000-000000000003', 'Amine', 'amine@dromiss.com', 'Stagiaire Intégrateur Odoo', 'Technique', 'demo123'),
  ('00000000-0000-0000-0000-000000000004', 'Ibtissam', 'ibtissam@dromiss.com', 'Stagiaire Marketing', 'Marketing', 'demo123'),
  ('00000000-0000-0000-0000-000000000005', 'Oualid', 'oualid@dromiss.com', 'Manager Technique', 'Technique', 'demo123')
ON CONFLICT (email) DO NOTHING;