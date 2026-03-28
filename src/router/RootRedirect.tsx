import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RootRedirect() {
  const { isAuthenticated, isInitializing } = useAuthStore()
  if (isInitializing) return null
  return <Navigate to={isAuthenticated ? '/library' : '/login'} replace />
}
