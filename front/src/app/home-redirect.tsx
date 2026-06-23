import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getDefaultLandingPath } from '@/lib/user-permissions'

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={getDefaultLandingPath(user)} replace />
}
