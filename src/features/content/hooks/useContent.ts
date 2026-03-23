import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi } from '@/api'
import apiClient from '@/api/axios'
import type { CardAddRequest, CardEditRequest, MoveCardsRequest, Content } from '@/types'

function contentKey(collectionId: number) {
  return ['collections', collectionId, 'content'] as const
}

export function useAddCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, card }: { collectionId: number; card: CardAddRequest }) =>
      contentApi.addToCollection(collectionId, card),
    onSuccess: (_, { collectionId }) => {
      void queryClient.invalidateQueries({ queryKey: contentKey(collectionId) })
    },
  })
}

export function useAddCardWithImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, formData }: { collectionId: number; formData: FormData }) =>
      apiClient.post(`/collections/${collectionId}/content`, formData).then((r) => r.data.data as Content),
    onSuccess: (_, { collectionId }) => {
      void queryClient.invalidateQueries({ queryKey: contentKey(collectionId) })
    },
  })
}

export function useBulkAddCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      collectionId,
      list,
    }: {
      collectionId: number
      list: CardAddRequest[]
    }) => contentApi.bulkAddToCollection(collectionId, list),
    onSuccess: (_, { collectionId }) => {
      void queryClient.invalidateQueries({ queryKey: contentKey(collectionId) })
    },
  })
}

export function useEditCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      data,
    }: {
      collectionId: number
      data: CardEditRequest
    }) => contentApi.edit(data),
    onSuccess: (_, { collectionId }) => {
      void queryClient.invalidateQueries({ queryKey: contentKey(collectionId) })
    },
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId }: { cardId: number; collectionId: number }) =>
      contentApi.delete(cardId),
    onSuccess: (_, { collectionId }) => {
      void queryClient.invalidateQueries({ queryKey: contentKey(collectionId) })
    },
  })
}

export function useMoveCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: MoveCardsRequest
      sourceCollectionId?: number
    }) => contentApi.moveCards(data),
    onSuccess: (_, { data, sourceCollectionId }) => {
      void queryClient.invalidateQueries({
        queryKey: contentKey(data.newCollectionId),
      })
      if (sourceCollectionId) {
        void queryClient.invalidateQueries({
          queryKey: contentKey(sourceCollectionId),
        })
      }
    },
  })
}
