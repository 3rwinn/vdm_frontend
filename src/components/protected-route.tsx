import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"
import { paths } from "@/routes/paths"

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={paths.workspaces} replace />
  }

  return <Outlet />
}
