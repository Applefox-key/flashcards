import apiClient from './axios'
import type { CollectionTag } from '@/types'

export const collectionTagsApi = {
  getAll: async (): Promise<CollectionTag[]> => {
    const res = await apiClient.get('/collection-tags')
    return res.data.data as CollectionTag[]
  },

  create: async (name: string): Promise<{ id: number }> => {
    const res = await apiClient.post('/collection-tags', { name })
    return res.data.data as { id: number }
  },

  edit: async (id: number, name: string): Promise<void> => {
    await apiClient.patch(`/collection-tags/${id}`, { name })
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/collection-tags/${id}`)
  },

  getByCollection: async (collectionId: number): Promise<CollectionTag[]> => {
    const res = await apiClient.get(`/collection-tags/collection/${collectionId}`)
    return res.data.data as CollectionTag[]
  },

  setCollectionTags: async (collectionId: number, tagIds: number[]): Promise<void> => {
    await apiClient.put(`/collection-tags/collection/${collectionId}`, { tagIds })
  },
}
