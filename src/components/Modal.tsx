import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

const sizeClass = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'md' | 'lg' | 'xl'
  children: ReactNode
}

export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClass[size]} mx-4 p-6 max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
