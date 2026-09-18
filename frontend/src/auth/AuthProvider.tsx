import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'

import { apiFetch } from '../api/client'
import { queryKeys, useSession } from '../api/queries'
import type { User } from '../api/types'
import { AuthContext, type Credentials } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useSession()

  const loginMutation = useMutation({
    mutationFn: (credentials: Credentials) =>
      apiFetch<User>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.session, user),
  })

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout/', { method: 'POST' }),
    // Dropping every cached query on logout keeps one user's data off the next user's screen.
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(queryKeys.session, null)
    },
  })

  const { mutateAsync: runLogin, error: loginError, isPending: isLoggingIn } = loginMutation
  const { mutate: runLogout } = logoutMutation

  const value = useMemo(
    () => ({
      user: session.data ?? null,
      isResolving: session.isLoading,
      isAuthenticated: Boolean(session.data),
      login: async (credentials: Credentials) => {
        await runLogin(credentials)
      },
      loginError: loginError ? loginError.message : null,
      isLoggingIn,
      logout: () => runLogout(),
    }),
    [session.data, session.isLoading, runLogin, loginError, isLoggingIn, runLogout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
