import { useState, useEffect, useRef } from 'react'
import { gamesApi } from '@/api'
import { adjustProb } from '@/utils/gameUtils'
import type { Content } from '@/types'

/**
 * Loads per-card probabilities from the backend on mount and saves them on unmount.
 * Default probability is 10 (mid-scale 1–20).
 */
export function useGameProbs(cards: Content[], gameKey: string) {
  const [probs, setProbs] = useState<Record<number, number>>({})
  const probsRef = useRef<Record<number, number>>({})
  const savedRef = useRef(false)
  const touchedRef = useRef<Set<number>>(new Set())

  // Keep probsRef in sync with probs state after every render.
  // This is the idiomatic React way — no side effects inside state updaters.
  useEffect(() => {
    probsRef.current = probs
  }, [probs])

  useEffect(() => {
    if (cards.length === 0) return
    const defaults: Record<number, number> = {}
    cards.forEach((c) => { defaults[c.id] = 10 })

    gamesApi
      .getResults({ listid: cards.map((c) => c.id), game: gameKey })
      .then((results) => {
        results.forEach((r) => { defaults[r.contentid] = r.probability })
      })
      .catch(() => {})
      .finally(() => {
        setProbs(defaults)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (savedRef.current) return
      const current = probsRef.current
      // In React 18 Strict Mode the cleanup runs before probsRef is populated —
      // skip silently so savedRef stays false and the real save can still happen.
      if (Object.keys(current).length === 0) return
      savedRef.current = true
      const touched = touchedRef.current
      const newProb: Record<string, Record<string, number>> = {}
      Object.entries(current)
        .filter(([id]) => touched.has(Number(id)))
        .forEach(([id, prob]) => {
          newProb[id] = { [gameKey]: prob }
        })
      if (Object.keys(newProb).length > 0) {
        gamesApi.saveResults({ newProb }).catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateProb(cardId: number, correct: boolean) {
    touchedRef.current.add(cardId)
    setProbs((prev) => ({
      ...prev,
      [cardId]: adjustProb(prev[cardId] ?? 10, correct),
    }))
  }

  function resetProb(cardId: number) {
    touchedRef.current.add(cardId)
    setProbs((prev) => ({ ...prev, [cardId]: 10 }))
  }

  function setProb(cardId: number, value: number) {
    touchedRef.current.add(cardId)
    setProbs((prev) => ({ ...prev, [cardId]: Math.max(1, Math.min(20, value)) }))
  }

  function resetAllProbs() {
    const reset: Record<number, number> = {}
    cards.forEach((c) => {
      reset[c.id] = 10
      touchedRef.current.add(c.id)
    })
    setProbs(reset)
    savedRef.current = false
  }

  /** Call this to save probs immediately (e.g. on game end) without waiting for unmount */
  function saveProbs() {
    if (savedRef.current) return
    const current = probsRef.current
    if (Object.keys(current).length === 0) return
    savedRef.current = true
    const touched = touchedRef.current
    const newProb: Record<string, Record<string, number>> = {}
    Object.entries(current)
      .filter(([id]) => touched.has(Number(id)))
      .forEach(([id, prob]) => {
        newProb[id] = { [gameKey]: prob }
      })
    if (Object.keys(newProb).length > 0) {
      gamesApi.saveResults({ newProb }).catch(() => {})
    }
  }

  return { probs, updateProb, resetProb, setProb, resetAllProbs, saveProbs }
}
