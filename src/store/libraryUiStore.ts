import { create } from 'zustand'

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
    compactCards: false,
    selectedCategoryId: null,
    viewMode: 'by-category',
    allPage: 1,
  },
  publicLibrary: {
    search: '',
    activeTag: null,
    page: 1,
  },
  setMyLibrary: (patch) =>
    set((s) => ({ myLibrary: { ...s.myLibrary, ...patch } })),
  setPublicLibrary: (patch) =>
    set((s) => ({ publicLibrary: { ...s.publicLibrary, ...patch } })),
}))
