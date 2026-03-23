import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { playlistsApi } from '@/api'

const PLAYLISTS_KEY = ['playlists'] as const

export function usePlaylists() {
  return useQuery({
    queryKey: PLAYLISTS_KEY,
    queryFn: playlistsApi.getAll,
  })
}

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: ['playlists', id],
    queryFn: () => playlistsApi.getById(id),
    enabled: !!id,
  })
}

export function usePlaylistContent(id: number) {
  return useQuery({
    queryKey: ['playlists', id, 'content'],
    queryFn: () => playlistsApi.getContent(id),
    enabled: !!id,
  })
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; listIds: number[] }) =>
      playlistsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY })
    },
  })
}

export function useEditPlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; listIds: number[] } }) =>
      playlistsApi.edit(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['playlists', id] })
      void queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY })
    },
  })
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => playlistsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY })
    },
  })
}
