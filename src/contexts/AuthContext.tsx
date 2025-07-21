// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

interface UserProfile {
  id: string
  name: string
  role?: string
  department?: string
  avatar?: string | null
  created_at?: string
  email?: string
}

interface AuthContextType {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
  fetchUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session first
    const storedUser = localStorage.getItem('supabase_user')
    const storedProfile = localStorage.getItem('supabase_profile')
    
    if (storedUser && storedProfile) {
      setUser(JSON.parse(storedUser))
      setUserProfile(JSON.parse(storedProfile))
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async () => {
    if (!user?.id) {
      setUserProfile(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // Create a default profile if user data doesn't exist
        setUserProfile({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email,
          role: 'Utilisateur',
          department: '',
          avatar: null,
          created_at: new Date().toISOString()
        })
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback profile
      setUserProfile({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
        email: user.email,
        role: 'Utilisateur',
        department: '',
        avatar: null,
        created_at: new Date().toISOString()
      })
    }
  }

  // Fetch user profile when user changes
  useEffect(() => {
    fetchUserProfile()
  }, [user])

  const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting Supabase login for:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      console.error('Supabase auth error:', error)
      return { error: { message: 'Email ou mot de passe incorrect' } }
    }

    // Save session user
    setUser(data.user)
    localStorage.setItem('supabase_user', JSON.stringify(data.user))

    // Fetch profile from your "users" table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', data.user.id)
      .single()

    if (profileError || !profile) {
      console.warn('No profile found in users table, using fallback')
      const fallbackProfile = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Utilisateur',
        email: data.user.email,
        role: 'Utilisateur',
        department: '',
        avatar: null,
        created_at: new Date().toISOString()
      }
      setUserProfile(fallbackProfile)
      localStorage.setItem('supabase_profile', JSON.stringify(fallbackProfile))
    } else {
      setUserProfile(profile)
      localStorage.setItem('supabase_profile', JSON.stringify(profile))
    }

    return { error: null }

  } catch (err) {
    console.error('Login error:', err)
    return { error: { message: 'Erreur de connexion' } }
  }
}


  const signOut = async () => {
    // Clear localStorage
    localStorage.removeItem('supabase_user')
    localStorage.removeItem('supabase_profile')
    
    setUser(null)
    setUserProfile(null)
    
    /* Original Supabase signout
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
    */
  }

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, signIn, signOut, setUserProfile, fetchUserProfile }}
    >
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