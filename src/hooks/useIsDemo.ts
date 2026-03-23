import { useAuthStore } from '@/store/authStore'

export function useIsDemo() {
  return useAuthStore((s) => s.isDemo)
}
