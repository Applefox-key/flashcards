import { create } from 'zustand'
import {
  DEMO_CATEGORIES,
  DEMO_COLLECTIONS,
  DEMO_CONTENT,
  DEMO_CATEGORIES_WITH_COLLECTIONS,
  DEMO_PLAYLISTS,
  DEMO_USER,
} from './demoData'
import type { Collection, Content, Category, CategoryWithCollections, Playlist } from '@/types'

interface DemoState {
  user: typeof DEMO_USER
  categories: Category[]
  categoriesWithCollections: CategoryWithCollections[]
  collections: Collection[]
  content: Record<number, Content[]>
  playlists: Playlist[]

  getCollectionWithContent: (id: number) => { collection: Collection; content: Content[] } | null
  getPlaylistContent: (id: number) => Content[]

  toggleFavorite: (id: number, isFavorite: boolean) => void
  togglePublic: (id: number, isPublic: boolean) => void
  addCard: (collectionId: number, card: Omit<Content, 'id'>) => Content
  editCard: (data: Partial<Content> & { id: number }) => void
  deleteCard: (id: number, collectionId: number) => void
  addCollection: (data: Partial<Collection>) => Collection
  editCollection: (id: number, data: Partial<Collection>) => void
  deleteCollection: (id: number) => void
  clearContent: (id: number) => void
  addCategory: (name: string) => Category
  editCategory: (id: number, name: string) => void
  deleteCategory: (id: number) => void
  addPlaylist: (name: string, listIds: number[]) => void
  editPlaylist: (id: number, name: string, listIds: number[]) => void
  deletePlaylist: (id: number) => void
  updateCardRate: (id: number, collectionId: number, rate: number) => void
}

export const useDemoStore = create<DemoState>((set, get) => ({
  user: DEMO_USER,
  categories: [...DEMO_CATEGORIES],
  categoriesWithCollections: JSON.parse(JSON.stringify(DEMO_CATEGORIES_WITH_COLLECTIONS)),
  collections: JSON.parse(JSON.stringify(DEMO_COLLECTIONS)),
  content: JSON.parse(JSON.stringify(DEMO_CONTENT)),
  playlists: JSON.parse(JSON.stringify(DEMO_PLAYLISTS)),

  getCollectionWithContent: (id) => {
    const col = get().collections.find((c) => c.id === id)
    if (!col) return null
    return { collection: col, content: get().content[id] ?? [] }
  },

  getPlaylistContent: (id) => {
    const pl = get().playlists.find((p) => p.id === id)
    if (!pl) return []
    return pl.collections.flatMap((c) => get().content[c.id] ?? [])
  },

  toggleFavorite: (id, isFavorite) =>
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, isFavorite } : c)),
      categoriesWithCollections: s.categoriesWithCollections.map((cat) => ({
        ...cat,
        collections: cat.collections.map((c) => (c.id === id ? { ...c, isFavorite } : c)),
      })),
    })),

  togglePublic: (id, isPublic) =>
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, isPublic } : c)),
      categoriesWithCollections: s.categoriesWithCollections.map((cat) => ({
        ...cat,
        collections: cat.collections.map((c) => (c.id === id ? { ...c, isPublic } : c)),
      })),
    })),

  addCard: (collectionId, card) => {
    const newCard: Content = { ...card, id: Date.now(), collectionid: collectionId }
    set((s) => ({
      content: {
        ...s.content,
        [collectionId]: [...(s.content[collectionId] ?? []), newCard],
      },
    }))
    return newCard
  },

  editCard: (data) =>
    set((s) => ({
      content: Object.fromEntries(
        Object.entries(s.content).map(([colId, cards]) => [
          colId,
          cards.map((c) => (c.id === data.id ? { ...c, ...data } : c)),
        ])
      ),
    })),

  deleteCard: (id, collectionId) =>
    set((s) => ({
      content: {
        ...s.content,
        [collectionId]: (s.content[collectionId] ?? []).filter((c) => c.id !== id),
      },
    })),

  addCollection: (data) => {
    const newCol: Collection = {
      id: Date.now(),
      name: data.name ?? 'New Collection',
      note: data.note,
      userid: 999,
      categoryid: data.categoryid,
      isPublic: false,
      isFavorite: false,
      cardCount: 0,
    }
    set((s) => ({ collections: [...s.collections, newCol] }))
    return newCol
  },

  editCollection: (id, data) =>
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  deleteCollection: (id) =>
    set((s) => ({
      collections: s.collections.filter((c) => c.id !== id),
      content: Object.fromEntries(Object.entries(s.content).filter(([k]) => Number(k) !== id)),
    })),

  clearContent: (id) =>
    set((s) => ({ content: { ...s.content, [id]: [] } })),

  addCategory: (name) => {
    const newCat: Category = { id: Date.now(), name, userid: 999 }
    set((s) => ({
      categories: [...s.categories, newCat],
      categoriesWithCollections: [...s.categoriesWithCollections, { ...newCat, collections: [] }],
    }))
    return newCat
  },

  editCategory: (id, name) =>
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)),
      categoriesWithCollections: s.categoriesWithCollections.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    })),

  deleteCategory: (id) =>
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      categoriesWithCollections: s.categoriesWithCollections.filter((c) => c.id !== id),
    })),

  addPlaylist: (name, listIds) => {
    const cols = listIds.map((id) => {
      const col = get().collections.find((c) => c.id === id)
      return { id, name: col?.name ?? '', isMy: 1 as const }
    })
    set((s) => ({ playlists: [...s.playlists, { id: Date.now(), name, userid: 999, collections: cols }] }))
  },

  editPlaylist: (id, name, listIds) => {
    const cols = listIds.map((colId) => {
      const col = get().collections.find((c) => c.id === colId)
      return { id: colId, name: col?.name ?? '', isMy: 1 as const }
    })
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === id ? { ...p, name, collections: cols } : p)),
    }))
  },

  deletePlaylist: (id) =>
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

  updateCardRate: (id, collectionId, rate) =>
    set((s) => ({
      content: {
        ...s.content,
        [collectionId]: (s.content[collectionId] ?? []).map((c) =>
          c.id === id ? { ...c, rate } : c
        ),
      },
    })),
}))
