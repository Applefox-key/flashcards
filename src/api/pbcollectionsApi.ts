import apiClient from './axios'
import type { Collection, CollectionWithContent } from '@/types'

export const pbcollectionsApi = {
  getAll: async (): Promise<Collection[]> => {
    const res = await apiClient.get('/pbcollections')
    return res.data.data as Collection[]
  },

  getAllWithContent: async (): Promise<CollectionWithContent[]> => {
    const res = await apiClient.get('/pbcollections/content')
    return res.data.data as CollectionWithContent[]
  },

  getAllWithCount: async (): Promise<Collection[]> => {
    const res = await apiClient.get('/pbcollections/count')
    return res.data.data as Collection[]
  },

  getWithContent: async (id: number): Promise<CollectionWithContent> => {
    const res = await apiClient.get(`/pbcollections/${id}/content`)
    return res.data.data as CollectionWithContent
  },
}
