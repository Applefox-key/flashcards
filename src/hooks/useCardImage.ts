import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const imageCache = new Map<string, string>()

/**
 * Loads a card image with auth token.
 * Backend serves images via GET /img?col={collectionId}&img={filename}
 * Returns a blob object URL, or the original URL if it's already absolute.
 * Module-level cache prevents re-fetching on remount.
 */
export function useCardImage(filename: string | undefined, collectionId: number): string | undefined {
  const cacheKey = `${collectionId}:${filename}`

  const [blobUrl, setBlobUrl] = useState<string | undefined>(() => {
    if (!filename || filename === 'null' || filename === '') return undefined
    if (filename.startsWith('http')) return filename
    return imageCache.get(cacheKey)
  })

  useEffect(() => {
    if (!filename || filename === 'null' || filename === '') {
      setBlobUrl(undefined)
      return
    }
    if (filename.startsWith('http')) {
      setBlobUrl(filename)
      return
    }

    // Already cached — no fetch needed
    if (imageCache.has(cacheKey)) {
      setBlobUrl(imageCache.get(cacheKey))
      return
    }

    const token = useAuthStore.getState().token
    let objectUrl: string | undefined

    fetch(`${API_URL}/img?col=${collectionId}&img=${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('image load failed')
        return res.blob()
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        imageCache.set(cacheKey, objectUrl)
        setBlobUrl(objectUrl)
      })
      .catch(() => setBlobUrl(undefined))

    return () => {
      // Don't revoke — the URL is stored in the cache for reuse
    }
  }, [filename, collectionId, cacheKey])

  return blobUrl
}
