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
    const raw = res.data.data as Array<Record<string, unknown>>
    return raw.map((item) => ({
      ...item,
      cardCount: (item.content_count as number | undefined) ?? (item.count as number | undefined),
    })) as Collection[]
  },

  getWithContent: async (id: number): Promise<CollectionWithContent> => {
    const res = await apiClient.get(`/pbcollections/${id}/content`)
    return res.data.data as CollectionWithContent
  },
}
