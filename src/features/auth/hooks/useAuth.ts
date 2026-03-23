import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest, RegisterRequest } from '@/types'

export function useLogin() {
  const { login, setUser } = useAuthStore()
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async ({ token, role }) => {
      login(token, role)
      try {
        const user = await authApi.getMe()
        setUser(user)
      } catch {
        // user will be fetched by AppInit on next load
      }
    },
  })
}

export function useRegister() {
  const { login, setUser } = useAuthStore()
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async ({ token, role }) => {
      login(token, role)
      try {
        const user = await authApi.getMe()
        setUser(user)
      } catch {
        // user will be fetched by AppInit on next load
      }
    },
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Log out locally even if the request fails
      logout()
    },
  })
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await authApi.getMe()
      setUser(user)
      return user
    },
    enabled: !!token,
  })
}
