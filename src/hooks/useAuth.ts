import { useEffect, useState } from 'react'
import { type Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const login = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const register = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const logout = () => supabase.auth.signOut()

  const loginWithApple = () => supabase.auth.signInWithOAuth({ provider: 'apple' })

  return { session, loading, login, register, logout, loginWithApple }
}
