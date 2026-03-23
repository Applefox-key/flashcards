import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/api'

const CATEGORIES_KEY = ['categories'] as const
const WITH_COLLECTIONS_KEY = ['categories', 'withCollections'] as const

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: categoriesApi.getAll,
  })
}

export function useCategoriesWithCollections() {
  return useQuery({
    queryKey: WITH_COLLECTIONS_KEY,
    queryFn: categoriesApi.getAllWithCollections,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => categoriesApi.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      void queryClient.invalidateQueries({ queryKey: WITH_COLLECTIONS_KEY })
    },
  })
}

export function useEditCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      categoriesApi.edit(id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      void queryClient.invalidateQueries({ queryKey: WITH_COLLECTIONS_KEY })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      void queryClient.invalidateQueries({ queryKey: WITH_COLLECTIONS_KEY })
    },
  })
}
