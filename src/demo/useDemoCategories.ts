import { useDemoStore } from './demoStore'

type MutateOpts = { onSuccess?: () => void; onError?: () => void }

export function useCategories() {
  const categories = useDemoStore((s) => s.categories)
  return { data: categories, isLoading: false, isError: false }
}

export function useCategoriesWithCollections() {
  const cats = useDemoStore((s) => s.categoriesWithCollections)
  return { data: cats, isLoading: false, isError: false }
}

export function useCreateCategory() {
  const addCategory = useDemoStore((s) => s.addCategory)
  return {
    mutate: (name: string, opts?: MutateOpts) => {
      addCategory(name)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useEditCategory() {
  const editCategory = useDemoStore((s) => s.editCategory)
  return {
    mutate: ({ id, name }: { id: number; name: string }, opts?: MutateOpts) => {
      editCategory(id, name)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}

export function useDeleteCategory() {
  const deleteCategory = useDemoStore((s) => s.deleteCategory)
  return {
    mutate: (id: number, opts?: MutateOpts) => {
      deleteCategory(id)
      opts?.onSuccess?.()
    },
    isPending: false,
  }
}
