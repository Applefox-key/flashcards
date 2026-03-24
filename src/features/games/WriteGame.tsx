import { useState, useMemo, useEffect, useRef } from 'react'
import { shuffle, normalizeText, weightedRandom } from '@/utils/gameUtils'
import { useGameProbs } from './useGameProbs'
import { ResultScreen } from './ResultScreen'
import type { Content } from '@/types'

interface Props {
  cards: Content[]
  onPlayAgain: () => void
  onRetryMistakes?: (wrongIds: Set<number>) => void
  onBack: () => void
  answerFirst?: boolean
}

type Phase = 'input' | 'revealed'

export function WriteGame({ cards, onPlayAgain, onRetryMistakes, onBack, answerFirst = false }: Props) {
  const { probs, updateProb, saveProbs } = useGameProbs(cards, 'write0')

  const deck = useMemo(() => shuffle(cards), [cards])
  const [initialized, setInitialized] = useState(false)
  const [remaining, setRemaining] = useState<Content[]>([])

  const [current, setCurrent] = useState<Content | null>(null)
  const [input, setInput] = useState('')
  const [hint, setHint] = useState('')
  const [phase, setPhase] = useState<Phase>('input')
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 })
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)
  // Captured remaining for use in timeout callbacks
  const remainingRef = useRef<Content[]>([])
  const probsRef = useRef<Record<number, number>>(probs)

  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialized || Object.keys(probs).length === 0) return
    setInitialized(true)
    const sorted = [...deck].sort((a, b) => (probs[b.id] ?? 10) - (probs[a.id] ?? 10))
    setCurrent(sorted[0])
    setRemaining(sorted.slice(1))
    remainingRef.current = sorted.slice(1)
  }, [probs, deck, initialized])

  useEffect(() => {
    probsRef.current = probs
  }, [probs])

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (phase === 'input') inputRef.current?.focus()
  }, [current, phase])

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
    setCurrent(next)
    setInput('')
    setHint('')
    setPhase('input')
  }

  function handleCheck() {
    if (!current || phase !== 'input') return
    const correctAnswer = answerFirst ? current.question : current.answer
    const correct = normalizeText(input) === normalizeText(correctAnswer)
    setIsCorrect(correct)
    setPhase('revealed')
    updateProb(current.id, correct)
    setScore((s) => ({
      r: s.r + (correct ? 1 : 0),
      w: s.w + (correct ? 0 : 1),
      t: s.t + 1,
    }))
    if (!correct) setWrongCardIds((prev) => new Set([...prev, current.id]))
  }

  function handleHint() {
    if (!current || phase !== 'input') return
    const correctAnswer = answerFirst ? current.question : current.answer
    const next = correctAnswer.slice(0, hint.length + 1)
    setHint(next)
    setInput(next)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (phase === 'input') handleCheck()
      else pickNext()
    }
  }

  if (!initialized || !current) {
    return (
      <div className="max-w-lg mx-auto animate-pulse flex flex-col gap-4">
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-20 bg-gray-100 rounded-xl" />
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
        <span>{score.t + 1} / {cards.length}</span>
        <span>✓ {score.r} &nbsp; ✗ {score.w}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${(score.t / cards.length) * 100}%` }}
        />
      </div>

      {/* Prompt card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{answerFirst ? 'Answer' : 'Question'}</p>
        <p className="text-lg font-medium text-gray-900">{answerFirst ? current.answer : current.question}</p>
        {(answerFirst ? current.imgA : current.imgQ) && (
          <img src={answerFirst ? current.imgA : current.imgQ} alt="" className="max-h-28 mx-auto mt-3 object-contain rounded" />
        )}
      </div>

      {/* Input phase */}
      {phase === 'input' && (
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            rows={3}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleHint}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
            >
              💡 Hint
            </button>
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Check ↵
            </button>
          </div>
        </div>
      )}

      {/* Revealed phase */}
      {phase === 'revealed' && (
        <div className={`border-2 rounded-xl p-5 flex flex-col gap-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <p className={`font-semibold text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Wrong'}
          </p>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Your answer:</p>
            <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-red-700 line-through'}`}>
              {input || '(empty)'}
            </p>
          </div>
          {!isCorrect && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Correct answer:</p>
              <p className="text-sm font-medium text-gray-800">{answerFirst ? current.question : current.answer}</p>
            </div>
          )}
          {current.note && (
            <p className="text-xs text-gray-500 italic mt-1">{current.note}</p>
          )}
          <button
            onClick={pickNext}
            className="mt-2 bg-white border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Next ↵
          </button>
        </div>
      )}
    </div>
  )
}
