import { useIsDemo } from './useIsDemo'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/api'
import * as real from '@/features/categories/hooks/useCategories'
import * as demo from '@/demo/useDemoCategories'

export function useCategories() {
  const isDemo = useIsDemo()
  const r = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll, enabled: !isDemo })
  const d = demo.useCategories()
  return isDemo ? d : r
}

export function useCategoriesWithCollections() {
  const isDemo = useIsDemo()
  const r = useQuery({
    queryKey: ['categories', 'withCollections'],
    queryFn: categoriesApi.getAllWithCollections,
    enabled: !isDemo,
  })
  const d = demo.useCategoriesWithCollections()
  return isDemo ? d : r
}

export function useCreateCategory() {
  const isDemo = useIsDemo()
  const r = real.useCreateCategory()
  const d = demo.useCreateCategory()
  return isDemo ? d : r
}

export function useEditCategory() {
  const isDemo = useIsDemo()
  const r = real.useEditCategory()
  const d = demo.useEditCategory()
  return isDemo ? d : r
}

export function useDeleteCategory() {
  const isDemo = useIsDemo()
  const r = real.useDeleteCategory()
  const d = demo.useDeleteCategory()
  return isDemo ? d : r
}
