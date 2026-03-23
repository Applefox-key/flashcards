import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collectionTagsApi } from '@/api'

const TAGS_KEY = ['collection-tags'] as const

export function useCollectionTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: collectionTagsApi.getAll,
  })
}

export function useCreateCollectionTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => collectionTagsApi.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_KEY })
    },
  })
}

export function useEditCollectionTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      collectionTagsApi.edit(id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      void queryClient.invalidateQueries({ queryKey: ['categories', 'withCollections'] })
      void queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useDeleteCollectionTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => collectionTagsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TAGS_KEY })
      void queryClient.invalidateQueries({ queryKey: ['categories', 'withCollections'] })
      void queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useSetCollectionTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, tagIds }: { collectionId: number; tagIds: number[] }) =>
      collectionTagsApi.setCollectionTags(collectionId, tagIds),
    onSuccess: (_, { collectionId }) => {
      void queryClient.invalidateQueries({ queryKey: ['collections', collectionId, 'content'] })
      void queryClient.invalidateQueries({ queryKey: ['categories', 'withCollections'] })
      void queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}
