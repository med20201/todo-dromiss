/*
  # Create tasks table with proper RLS policies

  1. New Tables
    - `tasks` table with JSONB for assigned_to field
    - Proper foreign key relationships

  2. Security
    - Enable RLS on tasks table
    - Add policies for task creators and assigned users
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to jsonb, -- Array of user IDs
  project_id uuid,
  due_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Task creators can do everything with their tasks
CREATE POLICY "Task creators can manage their tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Policy: Assigned users can read and update task status/priority
CREATE POLICY "Assigned users can read and update tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    assigned_to ? (auth.uid()::text) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND id::text = ANY(SELECT jsonb_array_elements_text(assigned_to))
    )
  );

-- Policy: Assigned users can update task status and priority
CREATE POLICY "Assigned users can update task status"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to ? (auth.uid()::text) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
      AND id::text = ANY(SELECT jsonb_array_elements_text(assigned_to))
    )
  );

-- Insert sample tasks
INSERT INTO tasks (id, title, description, status, priority, assigned_to, project_id, due_date, created_by, created_at, updated_at) VALUES
  ('1752641268178', 'ssdd', 'deds', 'completed', 'medium', '["00000000-0000-0000-0000-000000000001"]', '', '2025-07-17', '00000000-0000-0000-0000-000000000001', '2025-07-16T04:48:37.082Z', '2025-07-16T04:48:37.082Z'),
  ('1752641290785', 'ddcdslm', 'kljklj', 'in-progress', 'high', '["00000000-0000-0000-0000-000000000001"]', '', '2025-11-28', '00000000-0000-0000-0000-000000000001', '2025-07-16T05:03:47.248Z', '2025-07-16T05:03:47.248Z'),
  ('1752641862604', 'a', 'a', 'completed', 'medium', '["00000000-0000-0000-0000-000000000002"]', '', '2025-07-23', '00000000-0000-0000-0000-000000000002', '2025-07-16T04:57:53.509Z', '2025-07-16T04:57:53.509Z'),
  ('1752644936809', 'ssssssssssssssss', 'sssssssssss', 'todo', 'medium', '["00000000-0000-0000-0000-000000000004"]', '', '2025-07-18', '00000000-0000-0000-0000-000000000001', '2025-07-16T05:48:56.809Z', '2025-07-16T05:48:56.809Z'),
  ('1752648589779', 'test', 'test', 'in-progress', 'low', '["00000000-0000-0000-0000-000000000001"]', '', '2025-07-17', '00000000-0000-0000-0000-000000000001', '2025-07-16T06:50:00.563Z', '2025-07-16T06:50:00.563Z')
ON CONFLICT (id) DO NOTHING;