import { useIsDemo } from './useIsDemo'
import { useQuery } from '@tanstack/react-query'
import { playlistsApi } from '@/api'
import * as real from '@/features/playlists/hooks/usePlaylists'
import * as demo from '@/demo/useDemoPlaylists'

export function usePlaylists() {
  const isDemo = useIsDemo()
  const r = useQuery({ queryKey: ['playlists'], queryFn: playlistsApi.getAll, enabled: !isDemo })
  const d = demo.usePlaylists()
  return isDemo ? d : r
}

export function usePlaylist(id: number) {
  const isDemo = useIsDemo()
  const r = useQuery({ queryKey: ['playlists', id], queryFn: () => playlistsApi.getById(id), enabled: !isDemo && !!id })
  const d = demo.usePlaylist(id)
  return isDemo ? d : r
}

export function usePlaylistContent(id: number) {
  const isDemo = useIsDemo()
  const r = useQuery({ queryKey: ['playlists', id, 'content'], queryFn: () => playlistsApi.getContent(id), enabled: !isDemo && !!id })
  const d = demo.usePlaylistContent(id)
  return isDemo ? d : r
}

export function useCreatePlaylist() {
  const isDemo = useIsDemo()
  const r = real.useCreatePlaylist()
  const d = demo.useCreatePlaylist()
  return isDemo ? d : r
}

export function useEditPlaylist() {
  const isDemo = useIsDemo()
  const r = real.useEditPlaylist()
  const d = demo.useEditPlaylist()
  return isDemo ? d : r
}

export function useDeletePlaylist() {
  const isDemo = useIsDemo()
  const r = real.useDeletePlaylist()
  const d = demo.useDeletePlaylist()
  return isDemo ? d : r
}
