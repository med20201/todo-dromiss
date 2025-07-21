// JSON Server API Client
const API_BASE_URL = 'http://localhost:3001'

class JsonServerClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth methods
  async signInWithPassword(email, password) {
    try {
      // Get all users and find matching email
      const users = await this.request('/users')
      const user = users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        return { error: { message: 'Email ou mot de passe incorrect' } }
      }

      // Remove password from user object before storing
      const userWithoutPassword = { ...user }
      delete userWithoutPassword.password

      // Create session
      const session = {
        id: Date.now().toString(),
        user_id: user.id,
        access_token: `token_${Date.now()}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
        user: userWithoutPassword
      }

      // Store session
      await this.request('/sessions', {
        method: 'POST',
        body: JSON.stringify(session)
      })

      // Store in localStorage for persistence
      localStorage.setItem('json_server_session', JSON.stringify(session))
      localStorage.setItem('json_server_user', JSON.stringify(userWithoutPassword))

      return { data: { user: userWithoutPassword, session }, error: null }
    } catch (error) {
      return { error: { message: 'Erreur de connexion' } }
    }
  }

  async signOut() {
    try {
      const sessionData = localStorage.getItem('json_server_session')
      if (sessionData) {
        const session = JSON.parse(sessionData)
        // Remove session from server
        try {
          await this.request(`/sessions/${session.id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.log('Session not found on server, continuing with logout')
        }
      }
      
      // Clear localStorage
      localStorage.removeItem('json_server_session')
      localStorage.removeItem('json_server_user')
      
      // Trigger auth change event
      window.dispatchEvent(new CustomEvent('auth-changed'))
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async getSession() {
    try {
      const sessionData = localStorage.getItem('json_server_session')
      const userData = localStorage.getItem('json_server_user')
      
      if (sessionData && userData) {
        const session = JSON.parse(sessionData)
        const user = JSON.parse(userData)
        
        // Check if session is still valid
        if (new Date(session.expires_at) > new Date()) {
          return { data: { session: { ...session, user } }, error: null }
        }
      }
      
      return { data: { session: null }, error: null }
    } catch (error) {
      return { data: { session: null }, error }
    }
  }

  // Database methods
  async from(table) {
    return {
      select: (columns = '*') => ({
        eq: async (column, value) => {
          const items = await this.request(`/${table}`)
          const filtered = items.filter(item => item[column] === value)
          return { data: filtered, error: null }
        },
        single: async () => {
          const items = await this.request(`/${table}`)
          return { data: items[0] || null, error: null }
        },
        then: async (callback) => {
          const items = await this.request(`/${table}`)
          return callback({ data: items, error: null })
        }
      }),
      insert: async (data) => {
        const newItem = {
          ...data,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const result = await this.request(`/${table}`, {
          method: 'POST',
          body: JSON.stringify(newItem)
        })
        
        return { data: result, error: null }
      },
      update: async (data) => ({
        eq: async (column, value) => {
          const items = await this.request(`/${table}`)
          const item = items.find(i => i[column] === value)
          
          if (!item) {
            return { data: null, error: { message: 'Item not found' } }
          }
          
          const updatedItem = {
            ...item,
            ...data,
            updated_at: new Date().toISOString()
          }
          
          const result = await this.request(`/${table}/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedItem)
          })
          
          return { data: result, error: null }
        }
      }),
      delete: () => ({
        eq: async (column, value) => {
          const items = await this.request(`/${table}`)
          const item = items.find(i => i[column] === value)
          
          if (!item) {
            return { data: null, error: { message: 'Item not found' } }
          }
          
          await this.request(`/${table}/${item.id}`, {
            method: 'DELETE'
          })
          
          return { data: item, error: null }
        }
      })
    }
  }
}

// Create client instance
export const jsonServerClient = new JsonServerClient()

// Auth object to mimic Supabase auth
export const auth = {
  signInWithPassword: ({ email, password }) => jsonServerClient.signInWithPassword(email, password),
  signOut: () => jsonServerClient.signOut(),
  getSession: () => jsonServerClient.getSession(),
  // Listen for auth changes
  onAuthStateChange: (callback) => {
    // Simple implementation - in a real app you'd want more sophisticated state management
    const checkAuth = () => {
      jsonServerClient.getSession().then(({ data }) => {
        if (data.session) {
          callback('SIGNED_IN', data.session)
        } else {
          callback('SIGNED_OUT', null)
        }
      })
    }
    
    // Check initial state
    setTimeout(checkAuth, 100)
    
    // Listen for storage changes (primitive implementation)
    const handleStorageChange = (e) => {
      if (e.key === 'json_server_session' || e.key === 'json_server_user') {
        setTimeout(checkAuth, 100)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom auth events
    const handleAuthChange = () => {
      setTimeout(checkAuth, 100)
    }
    
    window.addEventListener('auth-changed', handleAuthChange)
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('auth-changed', handleAuthChange)
          }
        }
      }
    }
  }
}