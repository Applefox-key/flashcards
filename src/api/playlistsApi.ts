import apiClient from './axios'
import type { Content } from '@/types'

interface PlaylistCollection {
  id: number
  name: string
  isMy: 0 | 1
}

interface PlaylistSummary {
  id: number
  name: string
  collections: PlaylistCollection[]
}

export const playlistsApi = {
  getAll: async (): Promise<PlaylistSummary[]> => {
    const res = await apiClient.get('/playlists')
    return res.data.data as PlaylistSummary[]
  },

  getById: async (id: number): Promise<PlaylistSummary> => {
    const res = await apiClient.get(`/playlists/${id}`)
    return res.data.data as PlaylistSummary
  },

  getContent: async (id: number): Promise<Content[]> => {
    const res = await apiClient.get(`/playlists/${id}/content`)
    return res.data.data as Content[]
  },

  create: async (data: { name: string; listIds: number[] }): Promise<PlaylistSummary> => {
    const res = await apiClient.post('/playlists', { name: data.name, listIds: data.listIds.join(',') })
    return res.data.data as PlaylistSummary
  },

  edit: async (id: number, data: { name: string; listIds: number[] }): Promise<PlaylistSummary> => {
    const res = await apiClient.patch(`/playlists/${id}`, { name: data.name, listIds: data.listIds.join(',') })
    return res.data.data as PlaylistSummary
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/playlists/${id}`)
  },
}
