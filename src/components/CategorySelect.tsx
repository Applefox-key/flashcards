import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/api'
import { Button } from './Button'

interface Props {
  value?: number
  onChange: (id: number | undefined) => void
}

export function CategorySelect({ value, onChange }: Props) {
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const queryClient = useQueryClient()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => categoriesApi.create(name),
    onSuccess: (cat) => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
      void queryClient.invalidateQueries({ queryKey: ['categories', 'withCollections'] })
      onChange(cat.id)
      setAddingNew(false)
      setNewName('')
    },
  })

  if (addingNew) {
    return (
      <div className="flex gap-2 items-center">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (newName.trim()) createMutation.mutate(newName.trim())
            }
            if (e.key === 'Escape') setAddingNew(false)
          }}
          placeholder="Category name"
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button
          type="button"
          size="sm"
          loading={createMutation.isPending}
          disabled={!newName.trim()}
          onClick={() => { if (newName.trim()) createMutation.mutate(newName.trim()) }}
        >
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingNew(false); setNewName('') }}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setAddingNew(true)}
        className="text-sm text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 whitespace-nowrap"
      >
        + New
      </button>
    </div>
  )
}
