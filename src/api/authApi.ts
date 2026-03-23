import apiClient from './axios'
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types'

export const authApi = {
  /** POST /users/login — returns token + role */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post('/users/login', data)
    // backend returns { token, role } directly (no data wrapper)
    return res.data as LoginResponse
  },

  /** POST /users — create account, returns token + role */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const res = await apiClient.post('/users', data)
    // backend returns { token, role } directly (no data wrapper)
    return res.data as LoginResponse
  },

  /** DELETE /users/logout */
  logout: async (): Promise<void> => {
    await apiClient.delete('/users/logout')
  },

  /** GET /users — returns the current user derived from the token */
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/users')
    return res.data.data as User
  },

  /**
   * PATCH /users — update profile (name, email, optional password, optional avatar).
   * Send as FormData: file (optional), data[name], data[email], data[password], data[img], data[id]
   */
  updateProfile: async (formData: FormData): Promise<User> => {
    const res = await apiClient.patch('/users', formData)
    return res.data.data as User
  },

  /** POST /resetpassword — send reset link to email */
  sendResetEmail: async (email: string): Promise<void> => {
    await apiClient.post('/resetpassword', { email, page: 'card' })
  },

  /** GET /resetpassword?resetToken — validate the token from the email link */
  validateResetToken: async (resetToken: string): Promise<void> => {
    await apiClient.get('/resetpassword', { params: { resetToken } })
  },

  /** PATCH /resetpassword — set new password using a valid reset token */
  setNewPassword: async (password: string, resetToken: string): Promise<void> => {
    await apiClient.patch('/resetpassword', { password, resetToken })
  },
}
