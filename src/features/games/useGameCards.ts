import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { collectionsApi, playlistsApi } from '@/api'
import { useIsDemo } from '@/hooks/useIsDemo'
import { useDemoStore } from '@/demo/demoStore'
import type { Content, Collection } from '@/types'

const EMPTY_CONTENT: Content[] = []

interface CollectionContentResponse {
  collection: Collection
  content: Content[]
}

export function useGameCards() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const numId = Number(id)
  const isPlaylist = searchParams.get('src') === 'pl'
  const isDemo = useIsDemo()

  // Demo selectors — stable references, no new objects on each render
  const demoCol = useDemoStore((s) => s.collections.find((c) => c.id === numId))
  const demoColContent = useDemoStore((s) => s.content[numId] ?? EMPTY_CONTENT)
  const demoPlaylist = useDemoStore((s) => s.playlists.find((p) => p.id === numId))
  const demoContent = useDemoStore((s) => s.content)

  const colQuery = useQuery({
    queryKey: ['collections', numId, 'content'],
    queryFn: () => collectionsApi.getWithContent(numId),
    enabled: !isDemo && !isPlaylist && !!numId,
  })

  const plQuery = useQuery({
    queryKey: ['playlists', numId, 'content'],
    queryFn: () => playlistsApi.getContent(numId),
    enabled: !isDemo && isPlaylist && !!numId,
  })

  const plMetaQuery = useQuery({
    queryKey: ['playlists', numId],
    queryFn: () => playlistsApi.getById(numId),
    enabled: !isDemo && isPlaylist && !!numId,
  })

  if (isDemo) {
    if (isPlaylist) {
      const cards = demoPlaylist
        ? demoPlaylist.collections.flatMap((c) => demoContent[c.id] ?? [])
        : []
      return { cards, title: demoPlaylist?.name ?? '', isLoading: false, isError: false }
    }
    return {
      cards: demoColContent,
      title: demoCol?.name ?? '',
      isLoading: false,
      isError: false,
    }
  }

  if (isPlaylist) {
    return {
      cards: plQuery.data ?? [],
      title: plMetaQuery.data?.name ?? '',
      isLoading: plQuery.isLoading || plMetaQuery.isLoading,
      isError: plQuery.isError,
    }
  }

  const raw = colQuery.data as unknown as CollectionContentResponse[] | undefined
  return {
    cards: raw?.[0]?.content ?? [],
    title: raw?.[0]?.collection?.name ?? '',
    isLoading: colQuery.isLoading,
    isError: colQuery.isError,
  }
}
