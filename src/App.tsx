import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { authApi } from './api'
import { useAuthStore } from './store/authStore'
import { parseUserSettings } from './lib/userSettings'

function syncOnboardedFromUser(user: { settings?: unknown } | null) {
  if (!user) return
  const s = parseUserSettings(user.settings)
  if (s.flashcards?.onboarded) localStorage.setItem('fm_onboarded', 'true')
}

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
    const { token, isDemo, setUser, login, logout, enterDemo, setInitializing } = useAuthStore.getState()

    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      window.history.replaceState({}, '', window.location.pathname)
      login(urlToken, '')
      authApi.getMe()
        .then((user) => {
          if (!user?.id || !user?.email) {
            logout()
          } else {
            syncOnboardedFromUser(user)
            setUser(user)
          }
        })
        .catch(() => logout())
        .finally(() => setInitializing(false))
      return
    }

    if (isDemo) {
      enterDemo()
      setInitializing(false)
    } else if (token) {
      authApi.getMe()
        .then((user) => { syncOnboardedFromUser(user); setUser(user) })
        .catch(() => logout())
        .finally(() => setInitializing(false))
    } else {
      // No token in localStorage — try cookie auth (cross-project SSO)
      authApi.getMe()
        .then((user) => {
          syncOnboardedFromUser(user)
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
