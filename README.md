todo-dromiss

### 1. Supabase Setup

1. Go to your Supabase dashboard: https://aiopfirandvmatobdujy.supabase.co
2. Run the migrations in the `supabase/migrations/` folder
3. Create auth users for the sample data:

**Important**: You need to create these users in Supabase Auth first, then update the users table with their auth_id:

```sql
-- After creating auth users, update the users table with their auth_ids
-- Replace the UUIDs below with the actual auth user IDs from Supabase Auth

UPDATE users SET auth_id = 'ACTUAL_AUTH_UUID_HERE' WHERE email = 'mohamed@dromiss.com';
UPDATE users SET auth_id = 'ACTUAL_AUTH_UUID_HERE' WHERE email = 'fatima-zahra@dromiss.com';
UPDATE users SET auth_id = 'ACTUAL_AUTH_UUID_HERE' WHERE email = 'amine@dromiss.com';
UPDATE users SET auth_id = 'ACTUAL_AUTH_UUID_HERE' WHERE email = 'ibtissam@dromiss.com';
UPDATE users SET auth_id = 'ACTUAL_AUTH_UUID_HERE' WHERE email = 'oualid@dromiss.com';
```

### 2. Create Auth Users

You can create auth users either:

**Option A: Via Supabase Dashboard**
1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user"
3. Create users with these credentials:
   - mohamed@dromiss.com / demo123
   - fatima-zahra@dromiss.com / demo123
   - amine@dromiss.com / demo123
   - ibtissam@dromiss.com / demo123
   - oualid@dromiss.com / demo123

**Option B: Via SQL (if you have service role key)**
```sql
-- This requires service role permissions
SELECT auth.create_user(
  email := 'mohamed@dromiss.com',
  password := 'demo123',
  email_confirm := true
);
```

### 3. Test Login

After setting up the auth users, you can login with:
- Email: mohamed@dromiss.com
- Password: demo123

Or any of the other created users.
## Setup Instructions