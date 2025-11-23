'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let supabase
    try {
      supabase = createClient()
    } catch (configError) {
      console.error('❌ AuthContext: Erreur configuration Supabase:', configError)
      if (mounted) {
        setLoading(false)
      }
      return
    }

    // Timeout de sécurité : forcer loading à false après 1 seconde maximum
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('⏱️ AuthContext: Timeout - forcer loading à false')
        setLoading(false)
      }
    }, 1000)

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          clearTimeout(timeoutId)
        setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Erreur vérification session:', error)
        if (mounted) {
          clearTimeout(timeoutId)
        setLoading(false)
        }
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        clearTimeout(timeoutId)
      setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      if (subscription) {
      subscription.unsubscribe()
      }
    }
  }, [])

  // Inscription - Le trigger créera automatiquement le profil
  const signUp = async (email, password, username) => {
    try {
      let supabase
      try {
        supabase = createClient()
      } catch (configError) {
        console.error('❌ AuthContext signUp: Erreur configuration Supabase:', configError)
        return { 
          data: null, 
          error: 'Erreur de configuration. Vérifiez les variables d\'environnement.'
        }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name: username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Erreur inscription:', error)
      return { 
        data: null, 
        error: error.message || 'Erreur lors de l\'inscription'
      }
    }
  }

  // Connexion
  const signIn = async (email, password) => {
    try {
      let supabase
      try {
        supabase = createClient()
      } catch (configError) {
        console.error('❌ AuthContext signIn: Erreur configuration Supabase:', configError)
        return { 
          data: null, 
          error: 'Erreur de configuration. Vérifiez les variables d\'environnement.'
        }
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error.message || 'Email ou mot de passe incorrect'
      }
    }
  }

  // Déconnexion
  const signOut = async () => {
    try {
      let supabase
      try {
        supabase = createClient()
      } catch (configError) {
        console.error('❌ AuthContext signOut: Erreur configuration Supabase:', configError)
        return { error: 'Erreur de configuration. Vérifiez les variables d\'environnement.' }
      }
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      return { error: null }
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      return { error: error.message }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}