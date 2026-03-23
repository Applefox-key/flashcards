import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/hooks/useToast'
import {
  useCollectionTags,
  useCreateCollectionTag,
  useEditCollectionTag,
  useDeleteCollectionTag,
} from '@/features/collections/hooks/useCollectionTags'

function TagSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded flex-1 max-w-xs" />
      <div className="h-4 w-10 bg-gray-100 rounded" />
      <div className="h-4 w-12 bg-gray-100 rounded" />
    </div>
  )
}

export function CollectionTagsPage() {
  const toast = useToast()
  const { data: tags = [], isLoading } = useCollectionTags()
  const createTag = useCreateCollectionTag()
  const editTag = useEditCollectionTag()
  const deleteTag = useDeleteCollectionTag()

  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const newInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (addingNew) newInputRef.current?.focus() }, [addingNew])
  useEffect(() => { if (editingId !== null) editInputRef.current?.focus() }, [editingId])

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    createTag.mutate(name, {
      onSuccess: () => { setNewName(''); setAddingNew(false) },
    })
  }

  function handleSaveEdit() {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    editTag.mutate({ id: editingId, name }, {
      onSuccess: () => setEditingId(null),
    })
  }

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete tag "${name}"? It will be removed from all collections.`)) return
    deleteTag.mutate(id, {
      onSuccess: () => toast.success('Tag deleted'),
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
        {!addingNew && (
          <Button size="sm" onClick={() => setAddingNew(true)}>+ New tag</Button>
        )}
      </div>

      {/* Inline add form */}
      {addingNew && (
        <div className="bg-white rounded-lg border border-violet-300 px-4 py-3 flex items-center gap-3 mb-3 shadow-sm">
          <input
            ref={newInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAddingNew(false); setNewName('') }
            }}
            placeholder="Tag name"
            className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
          />
          <Button size="sm" onClick={handleAdd} disabled={createTag.isPending || !newName.trim()}>
            Add
          </Button>
          <button
            onClick={() => { setAddingNew(false); setNewName('') }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <TagSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tags.length === 0 && !addingNew && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">No tags yet.</p>
          <p className="text-sm">Create tags to organise your collections.</p>
        </div>
      )}

      {/* Tag list */}
      {!isLoading && (
        <div className="flex flex-col gap-2">
          {tags.map((tag) => {
            const isEditing = editingId === tag.id
            return (
              <div
                key={tag.id}
                className="group flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-violet-200 transition-colors">
                {isEditing ? (
                  <>
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 text-sm outline-none border-b border-violet-400 text-gray-900 bg-transparent pb-0.5"
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={editTag.isPending || !editName.trim()}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors disabled:opacity-50">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-900 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                      {tag.name}
                    </span>
                    <button
                      onClick={() => { setEditingId(tag.id); setEditName(tag.name) }}
                      className="text-xs text-gray-400 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      Delete
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
