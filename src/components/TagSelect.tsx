import { useState } from 'react'
import {
  useCollectionTags,
  useCreateCollectionTag,
} from '@/features/collections/hooks/useCollectionTags'

interface Props {
  value: number[]
  onChange: (ids: number[]) => void
}

export function TagSelect({ value, onChange }: Props) {
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: allTags = [] } = useCollectionTags()
  const createTag = useCreateCollectionTag()

  const selectedTags = allTags.filter((t) => value.includes(t.id))
  const unselectedTags = allTags.filter((t) => !value.includes(t.id))

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((i) => i !== id) : [...value, id])
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    createTag.mutate(name, {
      onSuccess: (result) => {
        onChange([...value, result.id])
        setNewName('')
        setCreatingNew(false)
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
        {selectedTags.length === 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 py-0.5">No tags selected</span>
        )}
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 px-2 py-0.5 rounded-full">
            {tag.name}
            <button
              type="button"
              onClick={() => toggle(tag.id)}
              className="leading-none hover:text-red-500 transition-colors">
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Available tags to add + create */}
      <div className="flex flex-wrap gap-1.5">
        {unselectedTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className="text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            + {tag.name}
          </button>
        ))}

        {creatingNew ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreate() }
                if (e.key === 'Escape') { setCreatingNew(false); setNewName('') }
              }}
              placeholder="Tag name"
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-xs w-24
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || createTag.isPending}
              className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 disabled:opacity-40 transition-colors">
              Add
            </button>
            <button
              type="button"
              onClick={() => { setCreatingNew(false); setNewName('') }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingNew(true)}
            className="text-xs border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-full hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
            + New tag
          </button>
        )}
      </div>
    </div>
  )
}
