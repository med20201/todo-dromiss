// src/pages/api/create-user.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// تحقق من وجود متغيرات البيئة قبل إنشاء العميل
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') 
    return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, name, role, department } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // 1. إنشاء مستخدم في Auth
    const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError) {
      console.error('Auth error:', signUpError)
      return res.status(400).json({ error: signUpError.message })
    }

    const userId = authUser?.user?.id

    if (!userId) return res.status(500).json({ error: 'Failed to get user ID' })

    // 2. Insert using raw SQL to bypass RLS issues
    const { error: dbError, data: userData } = await supabaseAdmin
      .rpc('insert_user_admin', {
        p_auth_id: userId,
        p_name: name,
        p_email: email,
        p_role: role,
        p_department: department
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({ error: dbError.message })
    }

    return res.status(200).json({ 
      success: true, 
      user: userData[0],
      auth_id: userId 
    })
    
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}