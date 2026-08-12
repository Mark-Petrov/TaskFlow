import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, setToken, getToken, checkApiHealth } from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'
import type { Profile } from '../types'

interface AuthUser {
  id: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)

  const applyUser = (u: Profile & { email: string }, token: string) => {
    setToken(token)
    setUser({ id: u.id, email: u.email })
    setProfile(u)
    connectSocket()
  }

  useEffect(() => {
    checkApiHealth().then(async (ok) => {
      setIsConfigured(ok)
      const token = getToken()
      if (ok && token) {
        try {
          const { user: u } = await authApi.me()
          applyUser(u, token)
        } catch {
          setToken(null)
        }
      }
      setLoading(false)
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) return { error: 'Сервер недоступен. Запустите npm run dev:server' }
    try {
      const { token, user: u } = await authApi.login({ email, password })
      applyUser(u, token)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ошибка входа' }
    }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    if (!isConfigured) return { error: 'Сервер недоступен. Запустите npm run dev:server' }
    try {
      const { token, user: u } = await authApi.register({
        email, password, username,
        display_name: displayName || username,
      })
      applyUser(u, token)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ошибка регистрации' }
    }
  }

  const signOut = async () => {
    setToken(null)
    setUser(null)
    setProfile(null)
    disconnectSocket()
  }

  const refreshProfile = async () => {
    if (!getToken()) return
    try {
      const { user: u } = await authApi.me()
      setProfile(u)
      setUser({ id: u.id, email: u.email })
    } catch { /* noop */ }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isConfigured,
      signIn, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
