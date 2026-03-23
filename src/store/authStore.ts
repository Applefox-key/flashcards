import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { DEMO_USER } from '@/demo/demoData'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isDemo: boolean
  login: (token: string, role: string) => void
  logout: () => void
  setUser: (user: User) => void
  enterDemo: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isDemo: false,

      login: (token, _role) =>
        set({ token, isAuthenticated: true, isDemo: false }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isDemo: false }),

      setUser: (user) =>
        set({ user }),

      enterDemo: () =>
        set({
          user: DEMO_USER as User,
          token: 'demo',
          isAuthenticated: true,
          isDemo: true,
        }),
    }),
    {
      name: 'fm_token',
      partialize: (state) => ({
        token: state.token,
        isDemo: state.isDemo,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
