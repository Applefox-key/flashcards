import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RecentEntry {
  id: number
  ts: number
}

interface RecentCollectionsState {
  recents: RecentEntry[]
  trackVisit: (id: number) => void
}

const MAX_RECENTS = 10

export const useRecentCollectionsStore = create<RecentCollectionsState>()(
  persist(
    (set) => ({
      recents: [],
      trackVisit: (id: number) =>
        set((s) => {
          const filtered = s.recents.filter((r) => r.id !== id)
          return { recents: [{ id, ts: Date.now() }, ...filtered].slice(0, MAX_RECENTS) }
        }),
    }),
    { name: 'fm_recent_collections' },
  ),
)
