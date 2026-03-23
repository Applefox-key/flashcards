import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collectionsApi } from '@/api'
import type { CollectionCreateRequest } from '@/types'

const COLLECTIONS_KEY = ['collections'] as const
const CATEGORIES_WITH_COLLECTIONS_KEY = ['categories', 'withCollections'] as const

export function useCollections() {
  return useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: collectionsApi.getAll,
  })
}

export function useCollectionsWithCount() {
  return useQuery({
    queryKey: ['collections', 'withCount'],
    queryFn: collectionsApi.getAllWithCount,
  })
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: ['collections', id],
    queryFn: () => collectionsApi.getById(id),
    enabled: !!id,
  })
}

export function useCollectionWithContent(id: number) {
  return useQuery({
    queryKey: ['collections', id, 'content'],
    queryFn: () => collectionsApi.getWithContent(id),
    enabled: !!id,
  })
}

export function useFavoriteCollections() {
  return useQuery({
    queryKey: ['collections', 'favorites'],
    queryFn: collectionsApi.getFavorites,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CollectionCreateRequest) => collectionsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_WITH_COLLECTIONS_KEY })
    },
  })
}

export function useEditCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CollectionCreateRequest }) =>
      collectionsApi.edit(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['collections', id] })
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_WITH_COLLECTIONS_KEY })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => collectionsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_WITH_COLLECTIONS_KEY })
    },
  })
}

export function useTogglePublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: number; isPublic: boolean }) =>
      collectionsApi.togglePublic(id, isPublic),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['collections', id] })
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_WITH_COLLECTIONS_KEY })
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      collectionsApi.toggleFavorite(id, isFavorite),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['collections', id] })
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_WITH_COLLECTIONS_KEY })
    },
  })
}

export function useDeleteAllCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => collectionsApi.deleteAllCards(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['collections', id, 'content'] })
    },
  })
}

export function useCopyCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (colId: number) => collectionsApi.copyPublic(colId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_WITH_COLLECTIONS_KEY })
    },
  })
}
