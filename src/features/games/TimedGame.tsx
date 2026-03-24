import { useState, useEffect, useRef } from 'react'
import { shuffle } from '@/utils/gameUtils'
import { ResultScreen } from './ResultScreen'
import type { Content } from '@/types'

interface Props {
  cards: Content[]
  onPlayAgain: () => void
  onBack: () => void
  answerFirst?: boolean
}

export function TimedGame({ cards: initialCards, onPlayAgain, onBack, answerFirst = false }: Props) {
  const [cards] = useState(() => shuffle(initialCards))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [running, setRunning] = useState(false)
  const [delay, setDelay] = useState(2) // seconds per side
  const [done, setDone] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  useEffect(() => {
    if (!running) return
    clearTimer()
    timerRef.current = setTimeout(() => {
      if (!flipped) {
        setFlipped(true)
      } else {
        const next = index + 1
        if (next >= cards.length) {
          setRunning(false)
          setDone(true)
        } else {
          setIndex(next)
          setFlipped(false)
        }
      }
    }, delay * 1000)
    return clearTimer
  }, [running, flipped, index, delay, cards.length])

  const card = cards[index]

  if (done) {
    return (
      <ResultScreen
        score={{ r: cards.length, w: 0, t: cards.length }}
        onPlayAgain={onPlayAgain}
        onBack={onBack}
      />
    )
  }

  if (!card) return null

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{index + 1} / {cards.length}</span>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="bg-white border-2 border-gray-200 rounded-2xl p-8 min-h-[200px] flex flex-col items-center justify-center gap-3 cursor-pointer select-none"
        onClick={() => { if (!running) setFlipped((f) => !f) }}
      >
        {!flipped ? (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">{answerFirst ? 'Answer' : 'Question'}</p>
            <p className="text-xl font-medium text-gray-900">{answerFirst ? card.answer : card.question}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">{answerFirst ? 'Question' : 'Answer'}</p>
            <p className="text-xl font-medium text-gray-900">{answerFirst ? card.question : card.answer}</p>
            {card.note && (
              <p className="text-sm text-gray-400 mt-3 italic">{card.note}</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
            running
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {running ? '⏸ Pause' : '▶ Start'}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-500 whitespace-nowrap">Delay: {delay}s</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
      </div>

      {/* Manual navigation when paused */}
      {!running && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false) }}
            disabled={index === 0}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
          >
            ← Prev
          </button>
          <button
            onClick={() => {
              if (index + 1 >= cards.length) setDone(true)
              else { setIndex((i) => i + 1); setFlipped(false) }
            }}
            disabled={index === cards.length - 1}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
