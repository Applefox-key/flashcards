import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FilterTag = 'All' | 'Favorites' | 'Public'

interface MyLibraryState {
  search: string
  activeFilter: FilterTag
  activeTagId: number | null
  expanded: number[]
  compactCards: boolean
  selectedCategoryId: number | null
  viewMode: 'by-category' | 'all'
  allPage: number
}

interface PublicLibraryState {
  search: string
  activeTag: string | null
  page: number
}

interface PlaylistsUiState {
  selectedId: number | null
}

interface LibraryUiState {
  myLibrary: MyLibraryState
  publicLibrary: PublicLibraryState
  playlists: PlaylistsUiState
  setMyLibrary: (patch: Partial<MyLibraryState>) => void
  setPublicLibrary: (patch: Partial<PublicLibraryState>) => void
  setPlaylists: (patch: Partial<PlaylistsUiState>) => void
}

export const useLibraryUiStore = create<LibraryUiState>()(
  persist(
    (set) => ({
      myLibrary: {
        search: '',
        activeFilter: 'All',
        activeTagId: null,
        expanded: [],
        compactCards: false,
        selectedCategoryId: null,
        viewMode: 'all',
        allPage: 1,
      },
      publicLibrary: {
        search: '',
        activeTag: null,
        page: 1,
      },
      playlists: {
        selectedId: null,
      },
      setMyLibrary: (patch) =>
        set((s) => ({ myLibrary: { ...s.myLibrary, ...patch } })),
      setPublicLibrary: (patch) =>
        set((s) => ({ publicLibrary: { ...s.publicLibrary, ...patch } })),
      setPlaylists: (patch) =>
        set((s) => ({ playlists: { ...s.playlists, ...patch } })),
    }),
    {
      name: 'fm_library_ui',
      partialize: (s) => ({
        myLibrary: {
          activeFilter: s.myLibrary.activeFilter,
          activeTagId: s.myLibrary.activeTagId,
          selectedCategoryId: s.myLibrary.selectedCategoryId,
          viewMode: s.myLibrary.viewMode,
          compactCards: s.myLibrary.compactCards,
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<LibraryUiState>
        return {
          ...current,
          myLibrary: { ...current.myLibrary, ...(p.myLibrary ?? {}) },
        }
      },
    },
  ),
)
