import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collectionsApi } from '@/api'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { useToast } from '@/hooks/useToast'
import { useCreatePlaylist, useEditPlaylist } from '@/hooks/usePlaylistHooks'
import { useCollections } from '@/hooks/useCollectionHooks'
import { useIsDemo } from '@/hooks/useIsDemo'
import type { Playlist } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  /** Pass to edit an existing playlist; omit to create a new one */
  editPlaylist?: Playlist
}

export function PlaylistModal({ open, onClose, editPlaylist }: Props) {
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<(number | undefined)[]>([])
  const [search, setSearch] = useState('')
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const createPlaylist = useCreatePlaylist()
  const editPlaylistMutation = useEditPlaylist()

  // Sync form when target changes (or modal opens)
  useEffect(() => {
    setName(editPlaylist?.name ?? '')
    setSelectedIds(editPlaylist?.collections.map((c) => c.id) ?? [])
    setActiveSlot(null)
    setSearch('')
  }, [editPlaylist, open])

  // Autofocus search input when picker opens
  useEffect(() => {
    if (activeSlot !== null) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [activeSlot])

  const isDemo = useIsDemo()
  const demoCollections = useCollections()
  const realCollections = useQuery({
    queryKey: ['collections'],
    queryFn: collectionsApi.getAll,
    enabled: open && !isDemo,
  })
  const allCollections = isDemo ? (demoCollections.data ?? []) : (realCollections.data ?? [])

  const handleSave = () => {
    if (!name.trim()) return
    const listIds = selectedIds.filter(Boolean) as number[]
    if (editPlaylist) {
      editPlaylistMutation.mutate(
        { id: editPlaylist.id, data: { name: name.trim(), listIds } },
        {
          onSuccess: () => { toast.success('Playlist saved'); onClose() },
          onError: () => toast.error('Failed to save playlist'),
        }
      )
    } else {
      createPlaylist.mutate(
        { name: name.trim(), listIds },
        {
          onSuccess: () => { toast.success('Playlist created'); onClose() },
          onError: () => toast.error('Failed to create playlist'),
        }
      )
    }
  }

  const isPending = createPlaylist.isPending || editPlaylistMutation.isPending
  const filledCount = selectedIds.filter(Boolean).length

  function removeSlot(i: number) {
    setSelectedIds((prev) => {
      const next = [...prev]
      next[i] = undefined
      return next
    })
  }

  function pickCollection(id: number) {
    if (activeSlot === null) return
    setSelectedIds((prev) => {
      const next = [...prev]
      next[activeSlot] = id
      return next
    })
    setActiveSlot(null)
    setSearch('')
  }

  function closePicker() {
    setActiveSlot(null)
    setSearch('')
  }

  function resolveCollectionName(id: number): string {
    const col =
      allCollections.find((c) => c.id === id) ??
      editPlaylist?.collections.find((c) => c.id === id)
    return col?.name ?? `Collection #${id}`
  }

  // Collections available in the picker (not already selected, sorted by name, filtered by search)
  const pickerCollections = allCollections
    .filter((c) => !selectedIds.includes(c.id))
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const slotRows = Array.from({ length: 10 }, (_, i) => {
    const id = selectedIds[i]
    const isFilled = id != null
    const isActive = activeSlot === i

    if (isFilled) {
      return (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
        >
          <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
          <span className="flex-1 text-gray-800">{resolveCollectionName(id)}</span>
          <button
            onClick={() => removeSlot(i)}
            className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none w-6 text-center"
          >
            ×
          </button>
        </div>
      )
    }

    return (
      <div
        key={i}
        onClick={() => setActiveSlot(i)}
        className={isActive
          ? 'flex items-center gap-3 px-3 py-2 rounded-lg border border-indigo-400 bg-indigo-50 text-sm cursor-pointer'
          : 'flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-200 text-sm cursor-pointer hover:border-indigo-300 hover:bg-gray-50'
        }
      >
        <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
        <span className="text-sm text-gray-400 italic">add collection</span>
      </div>
    )
  })

  const pickerContent = (listClassName: string) => (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">
          Slot {activeSlot !== null ? activeSlot + 1 : ''}
        </span>
        <button
          onClick={closePicker}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none w-6 text-center"
        >
          ×
        </button>
      </div>
      <input
        ref={searchRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className={listClassName}>
        {pickerCollections.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            {search ? 'No matches' : 'No collections available'}
          </p>
        ) : (
          pickerCollections.map((col) => (
            <div
              key={col.id}
              onClick={() => pickCollection(col.id)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm rounded"
            >
              <span className="flex-1 text-gray-800">{col.name}</span>
              {col.category && (
                <span className="text-xs text-indigo-400 shrink-0">{col.category.name}</span>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={editPlaylist ? 'Edit Playlist' : 'New Playlist'} size={activeSlot !== null ? 'xl' : 'lg'}>
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            placeholder="e.g. Morning review"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Collections */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Collections</label>
            <span className={filledCount === 10
              ? 'text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium'
              : 'text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium'
            }>
              {filledCount} / 10
            </span>
          </div>

          <div className="relative">
            <div className={activeSlot !== null
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 items-start'
              : 'grid grid-cols-1'
            }>
              {/* Left column: slots list */}
              <div className="flex flex-col gap-1.5">
                {slotRows}
              </div>

              {/* Right column: picker panel — desktop only */}
              {activeSlot !== null && (
                <div className="hidden sm:block border border-indigo-200 rounded-lg p-3 bg-indigo-50 sticky top-0">
                  {pickerContent('max-h-64 overflow-y-auto mt-2')}
                </div>
              )}
            </div>

            {/* Mobile overlay: picker panel — small screens only */}
            {activeSlot !== null && (
              <div className="sm:hidden absolute inset-0 z-10 bg-white rounded-lg border border-indigo-200 p-3 flex flex-col">
                {pickerContent('flex-1 overflow-y-auto mt-2')}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">Sets can contain up to 10 collections.</p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button onClick={handleSave} loading={isPending} disabled={!name.trim()}>
            {editPlaylist ? 'Save changes' : 'Create'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
