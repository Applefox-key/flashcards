import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RootRedirect() {
  const { isAuthenticated, isInitializing } = useAuthStore()
  if (isInitializing) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  return <Navigate to={isAuthenticated ? '/library' : '/login'} replace />
}
