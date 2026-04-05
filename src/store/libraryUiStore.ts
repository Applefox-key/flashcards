import { create } from 'zustand'

type FilterTag = 'All' | 'Favorites' | 'Public'

interface MyLibraryState {
  search: string
  activeFilter: FilterTag
  activeTagId: number | null
  expanded: number[] // category ids that are expanded
}

interface PublicLibraryState {
  search: string
  activeTag: string | null
}

interface LibraryUiState {
  myLibrary: MyLibraryState
  publicLibrary: PublicLibraryState
  setMyLibrary: (patch: Partial<MyLibraryState>) => void
  setPublicLibrary: (patch: Partial<PublicLibraryState>) => void
}

export const useLibraryUiStore = create<LibraryUiState>((set) => ({
  myLibrary: {
    search: '',
    activeFilter: 'All',
    activeTagId: null,
    expanded: [],
  },
  publicLibrary: {
    search: '',
    activeTag: null,
  },
  setMyLibrary: (patch) =>
    set((s) => ({ myLibrary: { ...s.myLibrary, ...patch } })),
  setPublicLibrary: (patch) =>
    set((s) => ({ publicLibrary: { ...s.publicLibrary, ...patch } })),
}))
