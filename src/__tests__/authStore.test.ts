import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

const mockUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('sets token on login and user via setUser', () => {
    useAuthStore.getState().login('test-token', 'user')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('test-token')

    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('clears state on logout', () => {
    useAuthStore.getState().login('test-token', 'user')
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('updates user via setUser', () => {
    useAuthStore.getState().login('test-token', 'user')
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser({ ...mockUser, name: 'Updated Name' })
    expect(useAuthStore.getState().user?.name).toBe('Updated Name')
  })
})
