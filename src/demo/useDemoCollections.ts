import { useDemoStore } from './demoStore'
import type { Collection, Content } from '@/types'

type MutateOpts = { onSuccess?: () => void; onError?: () => void }

const EMPTY_CONTENT: Content[] = []

export function useCollectionWithContent(id: number) {
  const col = useDemoStore((s) => s.collections.find((c) => c.id === id))
  const content = useDemoStore((s) => s.content[id] ?? EMPTY_CONTENT)
  return {
    data: col ? [{ collection: col, content }] : undefined,
    isLoading: false,
    isError: false,
  }
}

export function useCollections() {
  const collections = useDemoStore((s) => s.collections)
  return { data: collections, isLoading: false, isError: false }
}

export function useToggleFavorite() {
  const toggleFavorite = useDemoStore((s) => s.toggleFavorite)
  return {
    mutate: ({ id, isFavorite }: { id: number; isFavorite: boolean }, opts?: MutateOpts) => {
      toggleFavorite(id, isFavorite)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useTogglePublic() {
  const togglePublic = useDemoStore((s) => s.togglePublic)
  return {
    mutate: ({ id, isPublic }: { id: number; isPublic: boolean }, opts?: MutateOpts) => {
      togglePublic(id, isPublic)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useCreateCollection() {
  const addCollection = useDemoStore((s) => s.addCollection)
  return {
    mutate: (data: Partial<Collection>, opts?: MutateOpts) => {
      addCollection(data)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useEditCollection() {
  const editCollection = useDemoStore((s) => s.editCollection)
  return {
    mutate: ({ id, data }: { id: number; data: Partial<Collection> }, opts?: MutateOpts) => {
      editCollection(id, data)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useDeleteCollection() {
  const deleteCollection = useDemoStore((s) => s.deleteCollection)
  return {
    mutate: (id: number, opts?: MutateOpts) => {
      deleteCollection(id)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useDeleteAllCards() {
  const clearContent = useDemoStore((s) => s.clearContent)
  return {
    mutate: (id: number, opts?: MutateOpts) => {
      clearContent(id)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}
