import { useDemoStore } from './demoStore'
import type { Content, CardEditRequest } from '@/types'

type MutateOpts = { onSuccess?: () => void; onError?: () => void }

export function useAddCard() {
  const addCard = useDemoStore((s) => s.addCard)
  return {
    mutate: (
      { collectionId, card }: { collectionId: number; card: Omit<Content, 'id' | 'collectionid'> },
      opts?: MutateOpts
    ) => {
      addCard(collectionId, { ...card, collectionid: collectionId })
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useAddCardWithImage() {
  const addCard = useDemoStore((s) => s.addCard)
  return {
    mutate: (
      { collectionId, formData }: { collectionId: number; formData: FormData },
      opts?: MutateOpts
    ) => {
      try {
        const raw = formData.get('data')
        const parsed = raw ? JSON.parse(raw as string) : {}
        addCard(collectionId, {
          question: parsed.question ?? '',
          answer: parsed.answer ?? '',
          note: parsed.note,
          collectionid: collectionId,
          imgQ: '',
          imgA: '',
          rate: 0,
        })
        opts?.onSuccess?.()
      } catch {
        opts?.onError?.()
      }
    },
    isPending: false,
  }
}

export function useBulkAddCards() {
  const addCard = useDemoStore((s) => s.addCard)
  return {
    mutate: (
      { collectionId, list }: { collectionId: number; list: Omit<Content, 'id' | 'collectionid'>[] },
      opts?: MutateOpts
    ) => {
      list.forEach((card) => addCard(collectionId, { ...card, collectionid: collectionId }))
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useEditCard() {
  const editCard = useDemoStore((s) => s.editCard)
  return {
    mutate: (
      { data }: { collectionId: number; data: CardEditRequest | FormData },
      opts?: MutateOpts
    ) => {
      if (data instanceof FormData) {
        try {
          const raw = data.get('data')
          const parsed = raw ? JSON.parse(raw as string) : {}
          editCard(parsed)
        } catch {
          opts?.onError?.()
          return
        }
      } else {
        editCard(data)
      }
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useDeleteCard() {
  const deleteCard = useDemoStore((s) => s.deleteCard)
  return {
    mutate: (
      { cardId, collectionId }: { cardId: number; collectionId: number },
      opts?: MutateOpts
    ) => {
      deleteCard(cardId, collectionId)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useMoveCards() {
  return {
    mutate: (_data: unknown, opts?: MutateOpts) => {
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}
