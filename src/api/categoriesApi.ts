import apiClient from './axios'
import type { Category, CategoryWithCollections, Collection } from '@/types'

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories/user')
    return res.data.data as Category[]
  },

  getAllWithCollections: async (): Promise<CategoryWithCollections[]> => {
    const res = await apiClient.get('/categories/user/collections')
    return res.data.data as CategoryWithCollections[]
  },

  getPublic: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories/public')
    return res.data.data as Category[]
  },

  getPublicWithCollections: async (): Promise<CategoryWithCollections[]> => {
    const res = await apiClient.get('/categories/public/collections')
    return res.data.data as CategoryWithCollections[]
  },

  getCollectionsByCategory: async (id: number): Promise<Collection[]> => {
    const res = await apiClient.get(`/categories/${id}/collections`)
    return res.data.data as Collection[]
  },

  create: async (name: string): Promise<Category> => {
    const res = await apiClient.post('/categories/user', { name })
    return res.data.data as Category
  },

  edit: async (id: number, name: string): Promise<Category> => {
    const res = await apiClient.patch(`/categories/${id}`, { name })
    return res.data.data as Category
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`)
  },
}
