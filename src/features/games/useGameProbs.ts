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
        probsRef.current = defaults
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (savedRef.current) return
      savedRef.current = true
      const current = probsRef.current
      if (Object.keys(current).length === 0) return
      const newProb: Record<string, Record<string, number>> = {}
      Object.entries(current).forEach(([id, prob]) => {
        newProb[id] = { [gameKey]: prob }
      })
      gamesApi.saveResults({ newProb }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateProb(cardId: number, correct: boolean) {
    setProbs((prev) => {
      const next = { ...prev, [cardId]: adjustProb(prev[cardId] ?? 10, correct) }
      probsRef.current = next
      return next
    })
  }

  /** Call this to save probs immediately (e.g. on game end) without waiting for unmount */
  function saveProbs() {
    if (savedRef.current) return
    savedRef.current = true
    const current = probsRef.current
    if (Object.keys(current).length === 0) return
    const newProb: Record<string, Record<string, number>> = {}
    Object.entries(current).forEach(([id, prob]) => {
      newProb[id] = { [gameKey]: prob }
    })
    gamesApi.saveResults({ newProb }).catch(() => {})
  }

  return { probs, updateProb, saveProbs }
}
