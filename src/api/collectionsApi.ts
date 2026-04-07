import apiClient from './axios'
import type {
  Collection,
  CollectionWithContent,
  CollectionCreateRequest,
  CollectionCreateWithCardsRequest,
} from '@/types'

export const collectionsApi = {
  getAll: async (): Promise<Collection[]> => {
    const res = await apiClient.get('/collections')
    return res.data.data as Collection[]
  },

  getAllWithCount: async (): Promise<Collection[]> => {
    const res = await apiClient.get('/collections/count')
    return res.data.data as Collection[]
  },

  getById: async (id: number): Promise<Collection> => {
    const res = await apiClient.get(`/collections/${id}`)
    return res.data.data as Collection
  },

  getWithContent: async (id: number): Promise<CollectionWithContent> => {
    const res = await apiClient.get(`/collections/${id}/content`)
    return res.data.data as CollectionWithContent
  },

  getFavorites: async (): Promise<Collection[]> => {
    const res = await apiClient.get('/collections/favorite')
    return res.data.data as Collection[]
  },

  create: async (data: CollectionCreateRequest): Promise<{ id: number }> => {
    const res = await apiClient.post('/collections', data)
    return res.data.id as { id: number }
  },

  createWithCards: async (data: CollectionCreateWithCardsRequest): Promise<Collection> => {
    const res = await apiClient.post('/collections/content', data)
    return res.data.data as Collection
  },

  copyPublic: async (colId: number): Promise<Collection> => {
    const res = await apiClient.post('/collections/copy', { colId })
    return res.data.data as Collection
  },

  edit: async (id: number, data: CollectionCreateRequest): Promise<Collection> => {
    const res = await apiClient.patch(`/collections/${id}`, data)
    return res.data.data as Collection
  },

  // Uses PATCH /collections/:id — same general edit endpoint, just sends isFavorite field
  toggleFavorite: async (id: number, isFavorite: boolean): Promise<void> => {
    await apiClient.patch(`/collections/${id}`, { isFavorite })
  },

  // Uses dedicated PATCH /collections/share/:id endpoint
  togglePublic: async (id: number, isPublic: boolean): Promise<void> => {
    await apiClient.patch(`/collections/share/${id}`, { isPublic })
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/collections/${id}`)
  },

  deleteAllCards: async (id: number): Promise<void> => {
    await apiClient.delete(`/collections/${id}/content`)
  },
}
