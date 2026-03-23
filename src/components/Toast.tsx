import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useToastStore, type Toast as ToastItem } from '@/store/toastStore'

const AUTO_DISMISS_MS = 3000

const typeStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-indigo-600 text-white',
}

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'i',
}

function ToastItem({ toast }: { toast: ToastItem }) {
  const removeToast = useToastStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-64 max-w-sm
        animate-slideIn
        ${typeStyles[toast.type]}
      `}
    >
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
        {typeIcons[toast.type]}
      </span>
      <span className="text-sm flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-white/70 hover:text-white text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  )
}
