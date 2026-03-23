import { useIsDemo } from './useIsDemo'
import { useToggleFavorite as realUseToggleFavorite } from '@/features/collections/hooks/useCollections'
import { useTogglePublic as realUseTogglePublic } from '@/features/collections/hooks/useCollections'
import { useCreateCollection as realUseCreateCollection } from '@/features/collections/hooks/useCollections'
import { useEditCollection as realUseEditCollection } from '@/features/collections/hooks/useCollections'
import { useDeleteCollection as realUseDeleteCollection } from '@/features/collections/hooks/useCollections'
import { useDeleteAllCards as realUseDeleteAllCards } from '@/features/collections/hooks/useCollections'
import * as demo from '@/demo/useDemoCollections'
import { useQuery } from '@tanstack/react-query'
import { collectionsApi } from '@/api'

// Wrap real useCollectionWithContent to support enabled:false in demo mode
function useRealCollectionWithContent(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['collections', id, 'content'],
    queryFn: () => collectionsApi.getWithContent(id),
    enabled: enabled && !!id,
  })
}

function useRealCollections(enabled: boolean) {
  return useQuery({
    queryKey: ['collections'],
    queryFn: collectionsApi.getAll,
    enabled,
  })
}

export function useCollectionWithContent(id: number) {
  const isDemo = useIsDemo()
  const r = useRealCollectionWithContent(id, !isDemo)
  const d = demo.useCollectionWithContent(id)
  return isDemo ? d : r
}

export function useCollections() {
  const isDemo = useIsDemo()
  const r = useRealCollections(!isDemo)
  const d = demo.useCollections()
  return isDemo ? d : r
}

export function useToggleFavorite() {
  const isDemo = useIsDemo()
  const r = realUseToggleFavorite()
  const d = demo.useToggleFavorite()
  return isDemo ? d : r
}

export function useTogglePublic() {
  const isDemo = useIsDemo()
  const r = realUseTogglePublic()
  const d = demo.useTogglePublic()
  return isDemo ? d : r
}

export function useCreateCollection() {
  const isDemo = useIsDemo()
  const r = realUseCreateCollection()
  const d = demo.useCreateCollection()
  return isDemo ? d : r
}

export function useEditCollection() {
  const isDemo = useIsDemo()
  const r = realUseEditCollection()
  const d = demo.useEditCollection()
  return isDemo ? d : r
}

export function useDeleteCollection() {
  const isDemo = useIsDemo()
  const r = realUseDeleteCollection()
  const d = demo.useDeleteCollection()
  return isDemo ? d : r
}

export function useDeleteAllCards() {
  const isDemo = useIsDemo()
  const r = realUseDeleteAllCards()
  const d = demo.useDeleteAllCards()
  return isDemo ? d : r
}
