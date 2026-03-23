import { useState, useMemo, useEffect, useRef } from 'react'
import { shuffle, formatParts, weightedRandom } from '@/utils/gameUtils'
import { useGameProbs } from './useGameProbs'
import { ResultScreen } from './ResultScreen'
import type { Content } from '@/types'

interface Props {
  cards: Content[]
  onPlayAgain: () => void
  onRetryMistakes?: (wrongIds: Set<number>) => void
  onBack: () => void
}

export function PartsGame({ cards: allCards, onPlayAgain, onRetryMistakes, onBack }: Props) {
  const playableCards = useMemo(
    () => allCards.filter((c) => formatParts(c.answer).length > 0),
    [allCards]
  )

  const { probs, updateProb, saveProbs } = useGameProbs(playableCards, 'parts0')

  const deck = useMemo(() => shuffle(playableCards), [playableCards])
  const [initialized, setInitialized] = useState(false)
  const [remaining, setRemaining] = useState<Content[]>([])

  const [current, setCurrent] = useState<Content | null>(null)
  const [correctParts, setCorrectParts] = useState<string[]>([])
  const [shuffledParts, setShuffledParts] = useState<string[]>([])
  const [clicked, setClicked] = useState<string[]>([])
  const [wrongIndex, setWrongIndex] = useState<number | null>(null)
  const [noMistake, setNoMistake] = useState(true)
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 })
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)

  const remainingRef = useRef<Content[]>([])
  const probsRef = useRef<Record<number, number>>(probs)

  useEffect(() => {
    if (initialized || Object.keys(probs).length === 0) return
    setInitialized(true)
    const sorted = [...deck].sort((a, b) => (probs[b.id] ?? 10) - (probs[a.id] ?? 10))
    loadCard(sorted[0])
    setRemaining(sorted.slice(1))
    remainingRef.current = sorted.slice(1)
  }, [probs, deck, initialized])

  useEffect(() => {
    probsRef.current = probs
  }, [probs])

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  function loadCard(card: Content) {
    const parts = formatParts(card.answer)
    setCurrent(card)
    setCorrectParts(parts)
    setShuffledParts(shuffle(parts))
    setClicked([])
    setWrongIndex(null)
    setNoMistake(true)
  }

  function pickNext() {
    const rem = remainingRef.current
    const currentProbs = probsRef.current
    if (rem.length === 0) {
      setDone(true)
      saveProbs()
      return
    }
    const probList = rem.map((c) => currentProbs[c.id] ?? 10)
    const nextIdx = weightedRandom(probList)
    const next = rem[nextIdx]
    const newRem = rem.filter((_, i) => i !== nextIdx)
    setRemaining(newRem)
    remainingRef.current = newRem
    loadCard(next)
  }

  function handlePartClick(part: string) {
    if (wrongIndex !== null || !current) return
    const position = clicked.length
    const expected = correctParts[position]

    if (part === expected) {
      const next = [...clicked, part]
      setClicked(next)

      if (next.length === correctParts.length) {
        // Puzzle complete
        const correct = noMistake
        updateProb(current.id, correct)
        setScore((s) => ({
          r: s.r + (correct ? 1 : 0),
          w: s.w + (correct ? 0 : 1),
          t: s.t + 1,
        }))
        if (!correct) setWrongCardIds((prev) => new Set([...prev, current.id]))
        setTimeout(pickNext, 600)
      }
    } else {
      setClicked((prev) => [...prev, part])
      setWrongIndex(clicked.length)
      setNoMistake(false)
      setTimeout(() => {
        setClicked((prev) => prev.slice(0, -1))
        setWrongIndex(null)
      }, 700)
    }
  }

  function handleUndo() {
    if (clicked.length === 0 || wrongIndex !== null) return
    setClicked((prev) => prev.slice(0, -1))
  }

  function handleHint() {
    if (wrongIndex !== null || !current) return
    const expected = correctParts[clicked.length]
    if (!expected) return
    handlePartClick(expected)
  }

  if (!initialized || !current) {
    return (
      <div className="max-w-lg mx-auto animate-pulse flex flex-col gap-4">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 w-20 bg-gray-100 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (playableCards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No cards suitable for the parts game.</p>
        <p className="text-sm mt-2">Answers need 2–10 parts when split.</p>
      </div>
    )
  }

  if (done) {
    return (
      <ResultScreen
        score={score}
        onPlayAgain={onPlayAgain}
        onRetryMistakes={
          onRetryMistakes && wrongCardIds.size > 0
            ? () => onRetryMistakes(wrongCardIds)
            : undefined
        }
        onBack={onBack}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{score.t + 1} / {playableCards.length}</span>
        <span>✓ {score.r} &nbsp; ✗ {score.w}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${(score.t / playableCards.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Question</p>
        <p className="text-lg font-medium text-gray-900">{current.question}</p>
      </div>

      {/* Build area */}
      <div className="min-h-[52px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center flex-wrap gap-2">
        {clicked.length === 0 ? (
          <span className="text-sm text-gray-300">Click parts in the correct order…</span>
        ) : (
          clicked.map((part, i) => (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                wrongIndex === i
                  ? 'bg-red-100 text-red-700 border-2 border-red-300'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {part}
            </span>
          ))
        )}
      </div>

      {/* Part buttons */}
      <div className="flex flex-wrap gap-2">
        {shuffledParts.map((part, i) => {
          // Determine how many of this part have been used vs available
          const usedCount = clicked.filter((p) => p === part).length
          const totalCount = shuffledParts.filter((p) => p === part).length
          const isUsed = usedCount >= totalCount
          return (
            <button
              key={`${part}-${i}`}
              onClick={() => handlePartClick(part)}
              disabled={isUsed || wrongIndex !== null}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-150 ${
                isUsed
                  ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-default'
                  : 'border-gray-300 text-gray-700 bg-white hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              {part}
            </button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleUndo}
          disabled={clicked.length === 0 || wrongIndex !== null}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30"
        >
          ↩ Undo
        </button>
        <button
          onClick={handleHint}
          disabled={wrongIndex !== null}
          className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30"
        >
          💡 Hint
        </button>
      </div>

      {current.note && (
        <p className="text-xs text-gray-400 italic text-center">{current.note}</p>
      )}
    </div>
  )
}
