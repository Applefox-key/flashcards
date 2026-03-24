import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameCards } from "./useGameCards";
import { DifficultyFilter } from "./DifficultyFilter";
import { FlashcardGame } from "./FlashcardGame";
import { TimedGame } from "./TimedGame";
import { PairsGame } from "./PairsGame";
import { TestGame } from "./TestGame";
import { WriteGame } from "./WriteGame";
import { PartsGame } from "./PartsGame";
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
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{gameLabel}</p>
          <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        </div>
        {mistakeIds && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            Retrying {mistakeIds.size} mistake{mistakeIds.size !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Difficulty filter + Q→A toggle — shown for all game types except flashcard */}
      {type !== "flashcard" && (
        <div className="mb-5 flex items-center gap-3">
          {type !== "pairs" && (
            <button
              onClick={() => {
                setAnswerFirst((a) => !a);
                setGameKey((k) => k + 1);
              }}
              className={`text-xs border rounded px-2 py-0.5 transition-colors ${answerFirst ? "bg-indigo-50 border-indigo-300 text-indigo-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
              {answerFirst ? "A → Q" : "Q → A"}
            </button>
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
        />
      )}
      {type === "timed" && <TimedGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}
      {type === "pairs" && <PairsGame key={gameKey} {...commonProps} />}
      {type === "test" && <TestGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}
      {type === "write" && <WriteGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}
      {type === "parts" && <PartsGame key={gameKey} {...commonProps} answerFirst={answerFirst} />}
    </div>
  );
}
