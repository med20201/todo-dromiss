/*
  # Create auth users for testing

  This migration creates the auth users that correspond to the users in db.json
  Run this in your Supabase SQL Editor after running the previous migrations
*/

-- Create auth users with the service role (this requires service_role key)
-- You need to run this with service_role permissions

-- Insert auth users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'mohamed@dromiss.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Mohamed Aboummar"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'fatima-zahra@dromiss.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Fatima Zahra FIGASSOUN"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'amine@dromiss.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Amine"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'ibtissam@dromiss.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Ibtissam"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-5555-5555-555555555555',
    'authenticated',
    'authenticated',
    'oualid@dromiss.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Oualid"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (email) DO NOTHING;

-- Update the users table to link with auth users
UPDATE users SET auth_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'mohamed@dromiss.com';
UPDATE users SET auth_id = '22222222-2222-2222-2222-222222222222' WHERE email = 'fatima-zahra@dromiss.com';
UPDATE users SET auth_id = '33333333-3333-3333-3333-333333333333' WHERE email = 'amine@dromiss.com';
UPDATE users SET auth_id = '44444444-4444-4444-4444-444444444444' WHERE email = 'ibtissam@dromiss.com';
UPDATE users SET auth_id = '55555555-5555-5555-5555-555555555555' WHERE email = 'oualid@dromiss.com';

-- Insert auth identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES 
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub": "11111111-1111-1111-1111-111111111111", "email": "mohamed@dromiss.com"}', 'email', NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub": "22222222-2222-2222-2222-222222222222", "email": "fatima-zahra@dromiss.com"}', 'email', NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub": "33333333-3333-3333-3333-333333333333", "email": "amine@dromiss.com"}', 'email', NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub": "44444444-4444-4444-4444-444444444444", "email": "ibtissam@dromiss.com"}', 'email', NOW(), NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '{"sub": "55555555-5555-5555-5555-555555555555", "email": "oualid@dromiss.com"}', 'email', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;