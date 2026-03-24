import type { Content } from '@/types'

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/** Strip non-alphanumeric, lowercase — for answer comparison */
export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Clamp probability 1–20, adjust by answer correctness */
export function adjustProb(prob: number, correct: boolean): number {
  return correct ? Math.max(1, prob - 1) : Math.min(20, prob + 1)
}

/**
 * Weighted random index: higher probability = more likely to be selected.
 * Used to pick the next card in probability-weighted games.
 */
export function weightedRandom(probs: number[]): number {
  const total = probs.reduce((a, b) => a + b, 0)
  let rand = Math.floor(Math.random() * total) + 1
  for (let i = 0; i < probs.length; i++) {
    rand -= probs[i]
    if (rand <= 0) return i
  }
  return probs.length - 1
}

/**
 * Split an answer into clickable parts for the Parts game.
 * - 2+ spaces: split by word
 * - 0–1 space: split by character (excluding space)
 * Returns [] if parts count is outside [2, 10].
 */
export function formatParts(text: string): string[] {
  const trimmed = text.trim().toLowerCase().replace(/\s+/g, ' ')
  const spaceCount = (trimmed.match(/ /g) ?? []).length
  const parts =
    spaceCount >= 2
      ? trimmed.split(' ').filter(Boolean)
      : trimmed.split('')
  if (parts.length < 2 || parts.length > 15) return []
  return parts
}

/** Build 4 multiple-choice options: 1 correct + up to 3 random wrong, shuffled */
export function buildTestOptions(allCards: Content[], correct: Content): Content[] {
  const wrong = shuffle(allCards.filter((c) => c.id !== correct.id)).slice(0, 3)
  return shuffle([correct, ...wrong])
}
