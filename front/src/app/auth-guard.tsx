import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { selectIsAuthenticated } from '@/store/slices/auth.slice'

export function AuthGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/kassir/buyurtmalar" replace />
  }

  return <Outlet />
}
