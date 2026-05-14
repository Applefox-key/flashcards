import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { useGameCards } from "./useGameCards";
import { DifficultyFilter } from "./DifficultyFilter";
import { FlashcardGame } from "./FlashcardGame";
import { TimedGame } from "./TimedGame";
import { PairsGame } from "./PairsGame";
import { TestGame } from "./TestGame";
import { WriteGame } from "./WriteGame";
import { PartsGame } from "./PartsGame";
import { SideDrawer } from "@/components/SideDrawer";
import type { Content } from "@/types";

const GAME_LABELS: Record<string, string> = {
  flashcard: "Flashcard",
  timed: "Timed",
  pairs: "Pairs",
  test: "Multiple Choice",
  write: "Write",
  parts: "Word Puzzle",
};

export function GamePage() {
  const { type = "flashcard", id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { cards, title, isLoading, isError } = useGameCards();
  const collectionId = Number(id);

  const [rateFilter, setRateFilter] = useState<number | null>(null);
  const [mistakeIds, setMistakeIds] = useState<Set<number> | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [answerFirst, setAnswerFirst] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [timedDelay, setTimedDelay] = useState(2);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filtered = useMemo<Content[]>(() => {
    if (mistakeIds) return cards.filter((c) => mistakeIds.has(c.id));
    if (rateFilter !== null) return cards.filter((c) => (c.rate ?? 0) === rateFilter);
    return cards;
  }, [cards, rateFilter, mistakeIds]);

  const activeCards = filtered.length > 0 ? filtered : cards;

  function handleFilterChange(val: number | null) {
    setRateFilter(val);
    setMistakeIds(null);
    setGameKey((k) => k + 1);
  }

  function handleToggleAnswerFirst() {
    setAnswerFirst((a) => !a);
    setGameKey((k) => k + 1);
  }

  function handleToggleShuffle() {
    setIsShuffled((s) => !s);
    setGameKey((k) => k + 1);
  }

  function handlePlayAgain() {
    setMistakeIds(null);
    setGameKey((k) => k + 1);
  }

  function handleRetryMistakes(wrongIds: Set<number>) {
    setMistakeIds(wrongIds);
    setGameKey((k) => k + 1);
  }

  function handleBack() {
    navigate(-1);
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto animate-pulse flex flex-col gap-4 pt-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (isError || cards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-2">{isError ? "Failed to load cards." : "No cards to play."}</p>
        <button onClick={handleBack} className="text-sm text-indigo-600 hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  const gameLabel = GAME_LABELS[type] ?? type;

  const commonProps = {
    cards: activeCards,
    onPlayAgain: handlePlayAgain,
    onBack: handleBack,
    onRetryMistakes: handleRetryMistakes,
  };

  const btnBase = "text-xs border rounded px-2.5 py-1 transition-colors";
  const btnActive =
    "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400";
  const btnInactive =
    "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500";

  const hasActiveSettings = answerFirst || isShuffled || rateFilter !== null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{gameLabel}</p>
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h1>
        {mistakeIds && (
          <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
            Retrying {mistakeIds.size} mistake{mistakeIds.size !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Desktop inline controls — hidden on mobile (shown in drawer) */}
      {!isLoading && (
        <div className="hidden sm:flex mb-5 items-center gap-3 flex-wrap">
          {type !== "pairs" && (
            <button onClick={handleToggleAnswerFirst} className={`${btnBase} ${answerFirst ? btnActive : btnInactive}`}>
              {answerFirst ? "A → Q" : "Q → A"}
            </button>
          )}
          {type === "flashcard" && (
            <button onClick={handleToggleShuffle} className={`${btnBase} ${isShuffled ? btnActive : btnInactive}`}>
              ⇄ Shuffle
            </button>
          )}
          {type === "timed" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Delay: {timedDelay}s</span>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={timedDelay}
                onChange={(e) => setTimedDelay(Number(e.target.value))}
                className="w-32 accent-indigo-500"
              />
            </div>
          )}
          <div className="ml-auto">
            <DifficultyFilter selected={rateFilter} onChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* Game dispatcher */}
      {type === "flashcard" && (
        <FlashcardGame
          key={gameKey}
          cards={activeCards}
          collectionId={collectionId}
          rateFilter={rateFilter}
          onFilterChange={handleFilterChange}
          answerFirst={answerFirst}
          isShuffled={isShuffled}
        />
      )}
      {type === "timed" && <TimedGame key={gameKey} {...commonProps} answerFirst={answerFirst} delay={timedDelay} />}
      {type === "pairs" && <PairsGame key={gameKey} {...commonProps} />}
      {type === "test" && <TestGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}
      {type === "write" && <WriteGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}
      {type === "parts" && <PartsGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}

      {/* Settings drawer */}
      <SideDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpen={() => setSettingsOpen(true)}
        side="right"
        tabLabel="SETTINGS"
        tabIcon={<FiSettings size={14} />}
        title="Game Settings"
        hasActiveIndicator={hasActiveSettings}
>

        {/* Direction */}
        {type !== "pairs" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Direction
            </p>
            <button
              onClick={handleToggleAnswerFirst}
              className={`${btnBase} ${answerFirst ? btnActive : btnInactive}`}>
              {answerFirst ? "A → Q" : "Q → A"}
            </button>
          </div>
        )}

        {/* Difficulty */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Difficulty
          </p>
          <DifficultyFilter selected={rateFilter} onChange={handleFilterChange} />
        </div>

        {/* Shuffle — flashcard only */}
        {type === "flashcard" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Card Order
            </p>
            <button
              onClick={handleToggleShuffle}
              className={`${btnBase} ${isShuffled ? btnActive : btnInactive}`}>
              ⇄ Shuffle
            </button>
          </div>
        )}

        {/* Speed — timed only */}
        {type === "timed" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Speed
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap w-12">
                {timedDelay}s
              </span>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={timedDelay}
                onChange={(e) => setTimedDelay(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
