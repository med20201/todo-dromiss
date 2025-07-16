import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

interface UserProfile {
  id: string
  name: string
  role?: string
  department?: string
  avatar?: string | null
  created_at?: string
  email?: string // Add email to interface
}

interface AuthContextType {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // جلب الجلسة الحالية عند بدء التشغيل
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      console.log('Initial getSession data:', data, 'error:', error)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }
    getSession()

    // متابعة تغيرات حالة المصادقة (تسجيل دخول/خروج)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed session:', session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        console.log('No user, clearing userProfile')
        setUserProfile(null)
        return
      }
      
      console.log('Fetching profile for user auth_id:', user.id)
      console.log('User email:', user.email)

      // First, let's check what columns exist in your users table
      const { data: tableData, error: tableError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      if (tableError) {
        console.error('Error checking users table:', tableError)
      } else {
        console.log('Sample user record structure:', tableData)
      }

      // Try multiple approaches to find the user profile
      let profileData = null
      let profileError = null

      // Approach 1: Try with auth_id
      const { data: data1, error: error1 } = await supabase
        .from('users')
        .select('id, name, role, department, avatar, created_at, email')
        .eq('auth_id', user.id)

      if (!error1 && data1.length > 0) {
        profileData = data1[0]
        console.log('Found profile with auth_id:', profileData)
      } else {
        console.log('No profile found with auth_id:', user.id, 'Error:', error1)
        
        // Approach 2: Try with email
        const { data: data2, error: error2 } = await supabase
          .from('users')
          .select('id, name, role, department, avatar, created_at, email')
          .eq('email', user.email)

        if (!error2 && data2.length > 0) {
          profileData = data2[0]
          console.log('Found profile with email:', profileData)
        } else {
          console.log('No profile found with email:', user.email, 'Error:', error2)
          
          // Approach 3: Try with id (if auth_id is actually stored as id)
          const { data: data3, error: error3 } = await supabase
            .from('users')
            .select('id, name, role, department, avatar, created_at, email')
            .eq('id', user.id)

          if (!error3 && data3.length > 0) {
            profileData = data3[0]
            console.log('Found profile with id:', profileData)
          } else {
            console.log('No profile found with id:', user.id, 'Error:', error3)
          }
        }
      }

      if (profileData) {
        setUserProfile(profileData)
        console.log('User profile loaded:', profileData)
      } else {
        console.warn('User profile not found in any approach')
        // Create a fallback profile with basic info
        setUserProfile({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email,
          role: 'Utilisateur',
          department: '',
          avatar: null,
          created_at: new Date().toISOString()
        })
      }
    }

    fetchUserProfile()
  }, [user])

  const signIn = async (email: string, password: string) => {
    console.log('Signing in with email:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      setUser(data.user)
      console.log('SignIn success, user:', data.user)
    } else {
      console.error('SignIn error:', error)
    }
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}