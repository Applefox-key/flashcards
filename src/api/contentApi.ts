import apiClient from './axios'
import type { Content, CardAddRequest, CardEditRequest, MoveCardsRequest } from '@/types'

export const contentApi = {
  getAll: async (): Promise<Content[]> => {
    const res = await apiClient.get('/content')
    return res.data.data as Content[]
  },

  getById: async (id: number): Promise<Content> => {
    const res = await apiClient.get(`/content/${id}`)
    return res.data.data as Content
  },

  getPublicById: async (id: number): Promise<Content> => {
    const res = await apiClient.get(`/content/pub/${id}`)
    return res.data.data as Content
  },

  /** PATCH /content — edit a card (also used for image uploads via FormData) */
  edit: async (data: CardEditRequest | FormData): Promise<Content> => {
    const res = await apiClient.patch('/content', data)
    return res.data.data as Content
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/content/${id}`)
  },

  moveCards: async (data: MoveCardsRequest): Promise<void> => {
    await apiClient.post('/content/move', data)
  },

  /** POST /collections/:id/content — add a single card */
  addToCollection: async (collectionId: number, data: CardAddRequest): Promise<Content> => {
    const res = await apiClient.post(`/collections/${collectionId}/content`, data)
    return res.data.data as Content
  },

  /** POST /collections/:id/content — bulk add via { list: [...] } */
  bulkAddToCollection: async (collectionId: number, list: CardAddRequest[]): Promise<Content[]> => {
    const res = await apiClient.post(`/collections/${collectionId}/content`, { list })
    return res.data.data as Content[]
  },
}
