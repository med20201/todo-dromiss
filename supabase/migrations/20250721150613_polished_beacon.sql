/*
  # Create projects table with proper RLS policies

  1. New Tables
    - `projects` table with JSONB for teammembers field
    - Proper foreign key relationships

  2. Security
    - Enable RLS on projects table
    - Add policies for project creators and team members
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on-hold')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date date,
  end_date date,
  teammembers jsonb, -- Array of user IDs
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Project creators can do everything with their projects
CREATE POLICY "Project creators can manage their projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Policy: Team members can read projects they're assigned to
CREATE POLICY "Team members can read assigned projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    teammembers ? (auth.uid()::text) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND id::text = ANY(SELECT jsonb_array_elements_text(teammembers))
    )
  );

-- Policy: Team members can update project status and progress
CREATE POLICY "Team members can update project status"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    teammembers ? (auth.uid()::text) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND id::text = ANY(SELECT jsonb_array_elements_text(teammembers))
    )
  );

-- Insert sample projects
INSERT INTO projects (id, name, description, status, progress, start_date, end_date, teammembers, created_by, created_at, updated_at) VALUES
  ('1', 'Employee Management System', 'Complete employee management and task tracking system', 'active', 65, '2024-07-01', '2024-08-31', '["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000003", "00000000-0000-0000-0000-000000000005"]', '00000000-0000-0000-0000-000000000001', '2024-07-01T00:00:00.000Z', '2024-07-15T00:00:00.000Z'),
  ('2', 'Mobile App Development', 'Develop mobile companion app', 'planning', 0, '2024-08-01', '2024-10-31', '["00000000-0000-0000-0000-000000000002", "00000000-0000-0000-0000-000000000004"]', '00000000-0000-0000-0000-000000000002', '2024-07-10T00:00:00.000Z', '2024-07-10T00:00:00.000Z'),
  ('1752641108971', 'Dromiss site', 'kljkjdklm\nfcjkncd\ndfsklzcjxkl\ndfxckvn m\nfdkcnvxk', 'active', 14, '2025-07-16', '2025-09-19', '["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002", "00000000-0000-0000-0000-000000000003", "00000000-0000-0000-0000-000000000004", "00000000-0000-0000-0000-000000000005"]', '00000000-0000-0000-0000-000000000001', '2025-07-16T04:45:50.143Z', '2025-07-16T04:45:50.143Z')
ON CONFLICT (id) DO NOTHING;