import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Spinner } from '../ui'
import { useAuth } from './context'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="size-7 text-primary" />
    </div>
  )
}

// Nothing under this guard renders until the session is known, so a typed-in URL cannot
// flash dashboard content at an anonymous visitor.
export function RequireAuth() {
  const { isResolving, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isResolving) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

export function RedirectIfAuthenticated() {
  const { isResolving, isAuthenticated } = useAuth()

  if (isResolving) return <FullScreenLoader />
  if (isAuthenticated) return <Navigate to="/plants" replace />
  return <Outlet />
}
