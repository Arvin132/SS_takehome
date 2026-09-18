import { createContext, useContext } from 'react'

import type { User } from '../api/types'

export interface Credentials {
  username: string
  password: string
}

export interface AuthState {
  user: User | null
  // True only while the initial session probe is in flight, so guards can hold rendering.
  isResolving: boolean
  isAuthenticated: boolean
  login: (credentials: Credentials) => Promise<void>
  loginError: string | null
  isLoggingIn: boolean
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
