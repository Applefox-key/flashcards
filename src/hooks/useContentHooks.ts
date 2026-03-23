import { useIsDemo } from './useIsDemo'
import * as real from '@/features/content/hooks/useContent'
import * as demo from '@/demo/useDemoContent'

export function useAddCard() {
  const isDemo = useIsDemo()
  const r = real.useAddCard()
  const d = demo.useAddCard()
  return isDemo ? d : r
}

export function useAddCardWithImage() {
  const isDemo = useIsDemo()
  const r = real.useAddCardWithImage()
  const d = demo.useAddCardWithImage()
  return isDemo ? d : r
}

export function useBulkAddCards() {
  const isDemo = useIsDemo()
  const r = real.useBulkAddCards()
  const d = demo.useBulkAddCards()
  return isDemo ? d : r
}

export function useEditCard() {
  const isDemo = useIsDemo()
  const r = real.useEditCard()
  const d = demo.useEditCard()
  return isDemo ? d : r
}

export function useDeleteCard() {
  const isDemo = useIsDemo()
  const r = real.useDeleteCard()
  const d = demo.useDeleteCard()
  return isDemo ? d : r
}

export function useMoveCards() {
  const isDemo = useIsDemo()
  const r = real.useMoveCards()
  const d = demo.useMoveCards()
  return isDemo ? d : r
}
