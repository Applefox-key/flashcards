import { useState } from 'react'
import { RichTextDisplay } from '@/components/RichTextDisplay'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useCollectionWithContent } from '@/hooks/useCollectionHooks'
import { gamesApi } from '@/api'
import { Modal } from '@/components/Modal'
import { useToast } from '@/hooks/useToast'
import type { Content, CardProbs, CollectionProbs } from '@/types'

const GAME_MODES = [
  { key: 'flashcard0', icon: '🃏', tKey: 'game_hub.activities.flashcard.label', dir: 'Q→A' },
  { key: 'flashcard1', icon: '🃏', tKey: 'game_hub.activities.flashcard.label', dir: 'A→Q' },
  { key: 'test0',      icon: '✓',  tKey: 'game_hub.activities.test.label',      dir: 'Q→A' },
  { key: 'test1',      icon: '✓',  tKey: 'game_hub.activities.test.label',      dir: 'A→Q' },
  { key: 'write0',     icon: '✏️', tKey: 'game_hub.activities.write.label',     dir: 'Q→A' },
  { key: 'parts0',     icon: '🔤', tKey: 'game_hub.activities.parts.label',     dir: 'Q→A' },
]
const ALL_PROB_KEYS = GAME_MODES.map(m => m.key)

function probToMastery(prob: number): number {
  return Math.round(((20 - prob) / 19) * 100)
}

function avgMastery(probs: CardProbs, keys = ALL_PROB_KEYS): number | null {
  const vals = keys.map(k => probs[k]).filter((v): v is number => v !== undefined)
  if (!vals.length) return null
  return probToMastery(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function masteryBarColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 50) return 'bg-blue-400'
  if (pct >= 25) return 'bg-amber-400'
  return 'bg-red-400'
}

function masteryTextColor(pct: number): string {
  if (pct >= 75) return 'text-green-700 dark:text-green-400'
  if (pct >= 50) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 25) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function Stars({ rate }: { rate?: number }) {
  const r = rate ?? 0
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map(s => (
        <svg
          key={s}
          viewBox="0 0 20 20"
          className={`w-3.5 h-3.5 ${s <= r ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`}
          fill="currentColor"
        >
          <path d="M10 1l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 13.4l-4.8 2.5.9-5.4L2.2 6.7l5.4-.8z" />
        </svg>
      ))}
    </span>
  )
}

function MasteryDot({ pct, label }: { pct: number | null; label: string }) {
  if (pct === null)
    return (
      <span
        className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 inline-block"
        title={label}
      />
    )
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${masteryBarColor(pct)}`}
      title={`${label}: ${pct}%`}
    />
  )
}

// ── Reset collection stats modal ──────────────────────────────────────────────

type ResetPending = { mode: 'all' | string; name: string }

function ResetCollectionStatsModal({
  colId,
  availableModeKeys,
  open,
  onClose,
}: {
  colId: number
  availableModeKeys: string[]
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [pending, setPending] = useState<ResetPending | null>(null)
  const [busy, setBusy] = useState(false)

  const handleClose = () => {
    setPending(null)
    onClose()
  }

  const handleReset = async () => {
    if (!pending) return
    setBusy(true)
    try {
      if (pending.mode === 'all') {
        await gamesApi.resetCollectionStats(colId)
      } else {
        await gamesApi.resetCollectionModeStats(colId, pending.mode)
      }
      await queryClient.invalidateQueries({ queryKey: ['collectionProbs', colId] })
      toast.success(t('stats.reset_success'))
      handleClose()
    } catch {
      toast.error(t('stats.reset_error'))
    } finally {
      setBusy(false)
    }
  }

  const availableModes = GAME_MODES.filter(m => availableModeKeys.includes(m.key))

  return (
    <Modal open={open} onClose={handleClose} title={t('stats.reset_modal_title')}>
      {pending ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {pending.mode === 'all'
              ? t('stats.reset_confirm_collection_all')
              : t('stats.reset_confirm_collection_mode', { name: pending.name })}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setPending(null)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('stats.reset_back')}
            </button>
            <button
              onClick={handleReset}
              disabled={busy}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
            >
              {t('stats.reset_confirm_yes')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {t('stats.reset_scope_collection')}
          </p>
          <button
            onClick={() => setPending({ mode: 'all', name: t('stats.reset_all_modes') })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-left transition-colors"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t('stats.reset_all_modes')}
          </button>

          {availableModes.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1">
                {t('stats.reset_by_mode')}
              </p>
              <div className="space-y-1.5">
                {availableModes.map(mode => {
                  const name = `${t(mode.tKey)} ${mode.dir}`
                  return (
                    <button
                      key={mode.key}
                      onClick={() => setPending({ mode: mode.key, name })}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm text-left transition-colors"
                    >
                      <span>{mode.icon}</span>
                      <span>{t(mode.tKey)}</span>
                      <span className="text-gray-400 text-xs">{mode.dir}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Card detail modal ─────────────────────────────────────────────────────────

function CardStatsModal({
  card,
  probs,
  colId,
  open,
  onClose,
}: {
  card: Content
  probs: CardProbs
  colId: number
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [cardResetPending, setCardResetPending] = useState<ResetPending | null>(null)
  const [busy, setBusy] = useState(false)

  const overallMastery = avgMastery(probs)
  const hasData = ALL_PROB_KEYS.some(k => probs[k] !== undefined)
  const playedModes = GAME_MODES.filter(m => probs[m.key] !== undefined)

  const handleCardReset = async () => {
    if (!cardResetPending) return
    setBusy(true)
    try {
      if (cardResetPending.mode === 'all') {
        await gamesApi.resetCardStats(card.id)
      } else {
        await gamesApi.resetCardModeStats(card.id, cardResetPending.mode)
      }
      await queryClient.invalidateQueries({ queryKey: ['collectionProbs', colId] })
      toast.success(t('stats.reset_success'))
      setCardResetPending(null)
    } catch {
      toast.error(t('stats.reset_error'))
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    setCardResetPending(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('stats.card_stats_title')} size="lg">
      <div className="space-y-4">
        {/* Q / A */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">{t('stats.question')}</p>
            <RichTextDisplay html={card.question} className="text-sm text-gray-900 dark:text-white font-medium break-words" />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">{t('stats.answer')}</p>
            <RichTextDisplay html={card.answer} className="text-sm text-gray-900 dark:text-white font-medium break-words" />
          </div>
        </div>

        {/* User star rating */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{t('stats.user_ratings')}:</span>
          <Stars rate={card.rate} />
          {(!card.rate || card.rate === 0) && (
            <span className="text-xs text-gray-400">{t('stats.unrated')}</span>
          )}
        </div>

        {/* Overall auto-mastery */}
        {overallMastery !== null && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{t('stats.auto_mastery')}:</span>
            <span className={`text-sm font-bold ${masteryTextColor(overallMastery)}`}>
              {overallMastery}%
            </span>
          </div>
        )}

        {/* Per-mode bars */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {t('stats.game_modes')}
          </p>
          {!hasData ? (
            <p className="text-sm text-gray-400">{t('stats.not_played')}</p>
          ) : (
            GAME_MODES.map(mode => {
              const prob = probs[mode.key]
              if (prob === undefined) return null
              const pct = probToMastery(prob)
              return (
                <div key={mode.key} className="flex items-center gap-2">
                  <span className="w-36 text-xs text-gray-600 dark:text-gray-300 shrink-0 flex gap-1 items-center">
                    <span>{mode.icon}</span>
                    <span className="truncate">{t(mode.tKey)}</span>
                    <span className="text-gray-400">{mode.dir}</span>
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${masteryBarColor(pct)} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-8 text-right ${masteryTextColor(pct)}`}>
                    {pct}%
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Reset card statistics */}
        {hasData && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t('stats.reset_card_title')}
            </p>
            {cardResetPending ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {cardResetPending.mode === 'all'
                    ? t('stats.reset_confirm_card_all')
                    : t('stats.reset_confirm_card_mode', { name: cardResetPending.name })}
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setCardResetPending(null)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('stats.reset_back')}
                  </button>
                  <button
                    onClick={handleCardReset}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                  >
                    {t('stats.reset_confirm_yes')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCardResetPending({ mode: 'all', name: t('stats.reset_all_modes') })}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs transition-colors"
                >
                  <svg viewBox="0 0 20 20" className="w-3 h-3 shrink-0" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {t('stats.reset_all_modes')}
                </button>
                {playedModes.map(mode => {
                  const name = `${t(mode.tKey)} ${mode.dir}`
                  return (
                    <button
                      key={mode.key}
                      onClick={() => setCardResetPending({ mode: mode.key, name })}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs transition-colors"
                    >
                      <span>{mode.icon}</span>
                      <span>{t(mode.tKey)}</span>
                      <span className="text-gray-400">{mode.dir}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CollectionStatsPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const colId = Number(id)
  const [selectedCard, setSelectedCard] = useState<Content | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)

  const { data: colData, isLoading: colLoading } = useCollectionWithContent(colId)
  const { data: probsMap = {} as CollectionProbs, isLoading: probsLoading } = useQuery({
    queryKey: ['collectionProbs', colId],
    queryFn: () => gamesApi.getCollectionProbs(colId),
    enabled: !!colId,
  })

  const isLoading = colLoading || probsLoading
  const colEntry = (colData as any)?.[0]
  const cards: Content[] = colEntry?.content ?? []
  const title: string = colEntry?.collection?.name ?? `#${id}`

  // helper: get probs for a card (key is string in the map)
  const cardProbs = (card: Content): CardProbs => probsMap[String(card.id)] ?? {}

  // ── Star distribution ──
  const starDist = [0, 1, 2, 3, 4, 5].map(s => ({
    star: s,
    count: cards.filter(c => (c.rate ?? 0) === s).length,
  }))
  const ratedCount = cards.filter(c => c.rate && c.rate > 0).length

  // ── Per-mode averages ──
  const modeAverages = GAME_MODES.map(mode => {
    const vals = cards
      .map(c => cardProbs(c)[mode.key])
      .filter((v): v is number => v !== undefined)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    return { ...mode, mastery: avg !== null ? probToMastery(avg) : null, count: vals.length }
  }).filter(m => m.mastery !== null)

  // ── Overall auto-mastery ──
  const allProbVals = cards.flatMap(c =>
    ALL_PROB_KEYS.map(k => cardProbs(c)[k]).filter((v): v is number => v !== undefined)
  )
  const overallAutoMastery = allProbVals.length
    ? Math.round(allProbVals.reduce((a, b) => a + probToMastery(b), 0) / allProbVals.length)
    : null
  const hasAnyGameData = allProbVals.length > 0

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('stats.title')}</p>
        </div>
        {!isLoading && hasAnyGameData && (
          <button
            onClick={() => setResetModalOpen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400 transition-colors"
            title={t('stats.reset_btn')}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">{t('stats.reset_btn')}</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Summary row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Star distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t('stats.user_ratings')}
              </p>
              {ratedCount === 0 ? (
                <p className="text-sm text-gray-400">{t('stats.no_ratings_yet')}</p>
              ) : (
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map(s => {
                    const cnt = starDist.find(d => d.star === s)?.count ?? 0
                    const pct = cards.length ? Math.round((cnt / cards.length) * 100) : 0
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <Stars rate={s} />
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-5 text-right">{cnt}</span>
                      </div>
                    )
                  })}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 w-[5.5rem] shrink-0">{t('stats.unrated')}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gray-300 dark:bg-gray-500 rounded-full"
                        style={{
                          width: `${cards.length ? Math.round((starDist[0].count / cards.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-5 text-right">{starDist[0].count}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Overall auto-mastery */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t('stats.auto_mastery')}
              </p>
              {!hasAnyGameData ? (
                <p className="text-sm text-gray-400">{t('stats.not_played')}</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <span className={`text-4xl font-bold ${masteryTextColor(overallAutoMastery!)}`}>
                      {overallAutoMastery}%
                    </span>
                    <span className="text-sm text-gray-400 pb-1">{t('stats.overall')}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${masteryBarColor(overallAutoMastery!)} transition-all`}
                      style={{ width: `${overallAutoMastery}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{t('stats.auto_mastery_hint')}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Per-mode averages ── */}
          {modeAverages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t('stats.game_modes')}
              </p>
              <div className="space-y-2.5">
                {modeAverages.map(mode => (
                  <div key={mode.key} className="flex items-center gap-3">
                    <span className="w-40 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1 shrink-0">
                      <span>{mode.icon}</span>
                      <span className="truncate">{t(mode.tKey)}</span>
                      <span className="text-gray-400 text-xs shrink-0">{mode.dir}</span>
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${masteryBarColor(mode.mastery!)}`}
                        style={{ width: `${mode.mastery}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold w-10 text-right ${masteryTextColor(mode.mastery!)}`}>
                      {mode.mastery}%
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                      {t('stats.n_cards', { count: mode.count })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Card list ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t('stats.card_list')}
              </p>
              <span className="text-xs text-gray-400">{t('stats.n_cards', { count: cards.length })}</span>
            </div>

            {cards.length === 0 ? (
              <p className="text-sm text-gray-400 p-4">{t('stats.no_cards')}</p>
            ) : (
              <>
                {/* Column headers — desktop */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                  <span className="flex-1 text-xs text-gray-400">{t('stats.question')}</span>
                  <span className="text-xs text-gray-400 w-[5.5rem]">{t('stats.user_ratings')}</span>
                  <span className="text-xs text-gray-400 flex gap-1">
                    {GAME_MODES.map(m => (
                      <span key={m.key} className="w-2.5 text-center" title={`${m.icon} ${m.dir}`}>·</span>
                    ))}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">{t('stats.auto_mastery')}</span>
                  <span className="w-4" />
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {cards.map(card => {
                    const probs = cardProbs(card)
                    const mastery = avgMastery(probs)
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 text-left transition-colors"
                      >
                        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate min-w-0">
                          {card.question}
                        </span>
                        <span className="shrink-0">
                          <Stars rate={card.rate} />
                        </span>
                        <span className="hidden sm:flex items-center gap-1 shrink-0">
                          {GAME_MODES.map(mode => (
                            <MasteryDot
                              key={mode.key}
                              pct={probs[mode.key] !== undefined ? probToMastery(probs[mode.key]) : null}
                              label={`${mode.icon} ${mode.dir}`}
                            />
                          ))}
                        </span>
                        {mastery !== null ? (
                          <span className={`text-xs font-semibold w-10 text-right shrink-0 ${masteryTextColor(mastery)}`}>
                            {mastery}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-600 w-10 text-right shrink-0">—</span>
                        )}
                        <svg
                          viewBox="0 0 20 20"
                          className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0"
                          fill="currentColor"
                        >
                          <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Card detail modal */}
      {selectedCard && (
        <CardStatsModal
          card={selectedCard}
          probs={cardProbs(selectedCard)}
          colId={colId}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* Reset collection stats modal */}
      <ResetCollectionStatsModal
        colId={colId}
        availableModeKeys={modeAverages.map(m => m.key)}
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  )
}
