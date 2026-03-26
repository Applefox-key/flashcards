import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { authApi } from './api'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

/** Hydrates the user on page load when a persisted token exists. */
function AppInit() {
  useEffect(() => {
    const { token, isDemo, setUser, logout, enterDemo, setInitializing } = useAuthStore.getState()
    if (isDemo) {
      enterDemo()
      setInitializing(false)
    } else if (token) {
      authApi.getMe()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setInitializing(false))
    } else {
      // No token in localStorage — try cookie auth (cross-project SSO)
      authApi.getMe()
        .then((user) => {
          useAuthStore.setState({ isAuthenticated: true })
          setUser(user)
        })
        .catch(() => {})
        .finally(() => setInitializing(false))
    }
  }, [])

  return <RouterProvider router={router} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInit />
    </QueryClientProvider>
  )
}
