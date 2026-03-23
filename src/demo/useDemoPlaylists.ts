import { useDemoStore } from './demoStore'
import { useMemo } from 'react'
import type { Playlist, Content } from '@/types'

type MutateOpts = { onSuccess?: () => void; onError?: () => void }

const EMPTY_CONTENT: Content[] = []

export function usePlaylists() {
  const playlists = useDemoStore((s) => s.playlists)
  return { data: playlists as Playlist[], isLoading: false, isError: false }
}

export function usePlaylist(id: number) {
  const playlist = useDemoStore((s) => s.playlists.find((p) => p.id === id))
  return { data: playlist as Playlist | undefined, isLoading: false, isError: false }
}

export function usePlaylistContent(id: number) {
  // Serialize to string so Zustand's Object.is check is stable between renders
  const collectionIdsStr = useDemoStore((s) => {
    const pl = s.playlists.find((p) => p.id === id)
    return pl ? pl.collections.map((c) => c.id).join(',') : ''
  })
  const content = useDemoStore((s) => s.content)
  const cards = useMemo(() => {
    if (!collectionIdsStr) return EMPTY_CONTENT
    return collectionIdsStr.split(',').map(Number).flatMap((cid) => content[cid] ?? EMPTY_CONTENT)
  }, [collectionIdsStr, content])
  return { data: cards, isLoading: false, isError: false }
}

export function useCreatePlaylist() {
  const addPlaylist = useDemoStore((s) => s.addPlaylist)
  return {
    mutate: ({ name, listIds }: { name: string; listIds: number[] }, opts?: MutateOpts) => {
      addPlaylist(name, listIds)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useEditPlaylist() {
  const editPlaylist = useDemoStore((s) => s.editPlaylist)
  return {
    mutate: (
      { id, data }: { id: number; data: { name: string; listIds: number[] } },
      opts?: MutateOpts
    ) => {
      editPlaylist(id, data.name, data.listIds)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useDeletePlaylist() {
  const deletePlaylist = useDemoStore((s) => s.deletePlaylist)
  return {
    mutate: (id: number, opts?: MutateOpts) => {
      deletePlaylist(id)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}
