import React, { createContext, useContext, useEffect, useState } from 'react'
import { jsonServerClient, auth } from '../lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  userProfile: User | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user
      setUser(sessionUser ?? null)
      if (sessionUser) {
        fetchUserProfile(sessionUser.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser ?? null)
      if (sessionUser) {
        await fetchUserProfile(sessionUser.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await jsonServerClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await auth.signOut()
  }

  const value = {
    user,
    userProfile,
    signIn,
    signOut,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}