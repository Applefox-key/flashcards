import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  activeModal: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openModal: (name: string) => void
  closeModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  activeModal: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}))
