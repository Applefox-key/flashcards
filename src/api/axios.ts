import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Wrap POST/PATCH body in { data: ... } unless it's FormData
  if (
    ['post', 'patch', 'put'].includes(config.method ?? '') &&
    config.data !== undefined &&
    config.data !== null &&
    !(config.data instanceof FormData)
  ) {
    config.data = { data: config.data }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
