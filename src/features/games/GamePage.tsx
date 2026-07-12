import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiSettings } from "react-icons/fi";
import { useGameCards } from "./useGameCards";
import { DifficultyFilter, type RateFilter } from "./DifficultyFilter";
import { FlashcardGame } from "./FlashcardGame";
import { TimedGame } from "./TimedGame";
import { PairsGame } from "./PairsGame";
import { TestGame } from "./TestGame";
import { WriteGame } from "./WriteGame";
import { PartsGame } from "./PartsGame";
import { SideDrawer } from "@/components/SideDrawer";
import { GameModeHelp } from "./GameModeHelp";
import type { Content } from "@/types";

export function GamePage() {
  const { t } = useTranslation();
  const { type = "flashcard", id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { cards, title, isLoading, isError } = useGameCards();
  const collectionId = Number(id);

  const [rateFilter, setRateFilter] = useState<RateFilter>(null);
  const [mistakeIds, setMistakeIds] = useState<Set<number> | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [answerFirst, setAnswerFirst] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [timedDelay, setTimedDelay] = useState(2);
  const [partsMode, setPartsMode] = useState<"oneshot" | "endless" | "endless-skip">("oneshot");
  const [writeMode, setWriteMode] = useState<"oneshot" | "endless" | "endless-skip">("oneshot");
  const [testMode, setTestMode] = useState<"oneshot" | "endless" | "endless-skip">("oneshot");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filtered = useMemo<Content[]>(() => {
    if (mistakeIds) return cards.filter((c) => mistakeIds.has(c.id));

    if (rateFilter !== null) {
      return cards.filter((c) =>
        rateFilter === "not5" ? (c.rate ?? 0) < 5 : (c.rate ?? 0) === rateFilter
      );
    }
    return cards;
  }, [cards, rateFilter, mistakeIds]);

  const activeCards = filtered.length > 0 ? filtered : [];

  function handleFilterChange(val: RateFilter) {
    setRateFilter(val);
    setMistakeIds(null);
    setGameKey((k) => k + 1);
  }

  function handleToggleAnswerFirst() {
    setAnswerFirst((a) => !a);
    // Endless modes handle direction changes internally without a full remount
    if (
      !(type === "parts" && partsMode !== "oneshot") &&
      !(type === "write" && writeMode !== "oneshot") &&
      !(type === "test" && testMode !== "oneshot")
    ) {
      setGameKey((k) => k + 1);
    }
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
        <p className="text-lg mb-2">{isError ? t("game_page.failed_to_load") : t("game_page.no_cards_to_play")}</p>
        <button onClick={handleBack} className="text-sm text-indigo-600 hover:underline">
          ← {t("game_hub.go_back")}
        </button>
      </div>
    );
  }

  const gameLabel = t(`game_page.label_${type}`, { defaultValue: type });

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

  const hasActiveSettings =
    answerFirst ||
    isShuffled ||
    rateFilter !== null ||
    (type === "parts" && partsMode !== "oneshot") ||
    (type === "write" && writeMode !== "oneshot") ||
    (type === "test" && testMode !== "oneshot");

  const directionLabel = answerFirst ? t("game_page.direction_a_to_q") : t("game_page.direction_q_to_a");

  return (
    <div className="max-w-2xl md:max-w-2lg   mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
          </svg>
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{gameLabel}</p>
          <GameModeHelp type={type} />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h1>
        {mistakeIds && (
          <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
            {mistakeIds.size === 1
              ? t("game_page.retrying_singular", { count: mistakeIds.size })
              : t("game_page.retrying_plural", { count: mistakeIds.size })}
          </span>
        )}
      </div>

      {/* Desktop inline controls — hidden on mobile (shown in drawer) */}
      {!isLoading && (
        <div className="hidden sm:flex mb-5 items-center gap-3 flex-wrap">
          {type !== "pairs" && (
            <button onClick={handleToggleAnswerFirst} className={`${btnBase} ${answerFirst ? btnActive : btnInactive}`}>
              {directionLabel}
            </button>
          )}
          {type === "flashcard" && (
            <button onClick={handleToggleShuffle} className={`${btnBase} ${isShuffled ? btnActive : btnInactive}`}>
              {t("game_page.shuffle")}
            </button>
          )}
          {type === "parts" && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setPartsMode("oneshot");
                  setGameKey((k) => k + 1);
                }}
                className={`${btnBase} ${partsMode === "oneshot" ? btnActive : btnInactive}`}>
                {t("game_page.one_shot")}
              </button>
              <button
                onClick={() => {
                  setPartsMode("endless");
                  setGameKey((k) => k + 1);
                }}
                className={`${btnBase} ${partsMode === "endless" ? btnActive : btnInactive}`}>
                {t("game_page.endless")}
              </button>
              <button
                onClick={() => {
                  setPartsMode("endless-skip");
                  setGameKey((k) => k + 1);
                }}
                className={`${btnBase} ${partsMode === "endless-skip" ? btnActive : btnInactive}`}>
                {t("game_page.endless_skip")}
              </button>
            </div>
          )}
          {type === "write" && (
            <div className="flex gap-1">
              <button
                onClick={() => { setWriteMode("oneshot"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${writeMode === "oneshot" ? btnActive : btnInactive}`}>
                {t("game_page.one_shot")}
              </button>
              <button
                onClick={() => { setWriteMode("endless"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${writeMode === "endless" ? btnActive : btnInactive}`}>
                {t("game_page.endless")}
              </button>
              <button
                onClick={() => { setWriteMode("endless-skip"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${writeMode === "endless-skip" ? btnActive : btnInactive}`}>
                {t("game_page.endless_skip")}
              </button>
            </div>
          )}
          {type === "test" && (
            <div className="flex gap-1">
              <button
                onClick={() => { setTestMode("oneshot"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${testMode === "oneshot" ? btnActive : btnInactive}`}>
                {t("game_page.one_shot")}
              </button>
              <button
                onClick={() => { setTestMode("endless"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${testMode === "endless" ? btnActive : btnInactive}`}>
                {t("game_page.endless")}
              </button>
              <button
                onClick={() => { setTestMode("endless-skip"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${testMode === "endless-skip" ? btnActive : btnInactive}`}>
                {t("game_page.endless_skip")}
              </button>
            </div>
          )}
          {type === "timed" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {t("game_page.delay", { value: timedDelay })}
              </span>
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
            <DifficultyFilter value={rateFilter} onChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* Game dispatcher */}

      {!activeCards.length ? (
        <p className="text-gray-400 text-center py-16">{t("flashcard_game.no_cards")}</p>
      ) : (
        <>
          {type === "flashcard" && (
            <FlashcardGame
              key={gameKey}
              cards={activeCards}
              collectionId={collectionId}
              answerFirst={answerFirst}
              isShuffled={isShuffled}
            />
          )}
          {type === "timed" && (
            <TimedGame key={gameKey} {...commonProps} answerFirst={answerFirst} delay={timedDelay} />
          )}
          {type === "pairs" && <PairsGame key={gameKey} {...commonProps} />}
          {type === "test" && <TestGame key={gameKey} {...commonProps} answerFirst={answerFirst} mode={testMode} />}
          {type === "write" && <WriteGame key={gameKey} {...commonProps} answerFirst={answerFirst} mode={writeMode} />}
          {type === "parts" && <PartsGame key={gameKey} {...commonProps} answerFirst={answerFirst} mode={partsMode} />}
        </>
      )}

      {/* Settings drawer */}
      <SideDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpen={() => setSettingsOpen(true)}
        side="right"
        topValue="bottom-0"
        tabLabel={t("game_page.settings_tab")}
        tabIcon={<FiSettings size={14} />}
        title={t("game_page.settings_title")}
        hasActiveIndicator={hasActiveSettings}>
        {/* Direction */}
        {type !== "pairs" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t("game_page.section_direction")}
            </p>
            <button onClick={handleToggleAnswerFirst} className={`${btnBase} ${answerFirst ? btnActive : btnInactive}`}>
              {directionLabel}
            </button>
          </div>
        )}

        {/* Difficulty */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t("game_page.section_difficulty")}
          </p>
          <DifficultyFilter value={rateFilter} onChange={handleFilterChange} />
        </div>

        {/* Mode — parts / write / test */}
        {type === "parts" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t("game_page.section_mode")}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setPartsMode("oneshot");
                  setGameKey((k) => k + 1);
                }}
                className={`${btnBase} ${partsMode === "oneshot" ? btnActive : btnInactive}`}>
                {t("game_page.one_shot")}
              </button>
              <button
                onClick={() => {
                  setPartsMode("endless");
                  setGameKey((k) => k + 1);
                }}
                className={`${btnBase} ${partsMode === "endless" ? btnActive : btnInactive}`}>
                {t("game_page.endless")}
              </button>
              <button
                onClick={() => {
                  setPartsMode("endless-skip");
                  setGameKey((k) => k + 1);
                }}
                className={`${btnBase} ${partsMode === "endless-skip" ? btnActive : btnInactive}`}>
                {t("game_page.endless_skip")}
              </button>
            </div>
          </div>
        )}

        {type === "write" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t("game_page.section_mode")}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setWriteMode("oneshot"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${writeMode === "oneshot" ? btnActive : btnInactive}`}>
                {t("game_page.one_shot")}
              </button>
              <button
                onClick={() => { setWriteMode("endless"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${writeMode === "endless" ? btnActive : btnInactive}`}>
                {t("game_page.endless")}
              </button>
              <button
                onClick={() => { setWriteMode("endless-skip"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${writeMode === "endless-skip" ? btnActive : btnInactive}`}>
                {t("game_page.endless_skip")}
              </button>
            </div>
          </div>
        )}
        {type === "test" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t("game_page.section_mode")}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setTestMode("oneshot"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${testMode === "oneshot" ? btnActive : btnInactive}`}>
                {t("game_page.one_shot")}
              </button>
              <button
                onClick={() => { setTestMode("endless"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${testMode === "endless" ? btnActive : btnInactive}`}>
                {t("game_page.endless")}
              </button>
              <button
                onClick={() => { setTestMode("endless-skip"); setGameKey((k) => k + 1); }}
                className={`${btnBase} ${testMode === "endless-skip" ? btnActive : btnInactive}`}>
                {t("game_page.endless_skip")}
              </button>
            </div>
          </div>
        )}

        {/* Shuffle — flashcard only */}
        {type === "flashcard" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t("game_page.section_card_order")}
            </p>
            <button onClick={handleToggleShuffle} className={`${btnBase} ${isShuffled ? btnActive : btnInactive}`}>
              {t("game_page.shuffle")}
            </button>
          </div>
        )}

        {/* Speed — timed only */}
        {type === "timed" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t("game_page.section_speed")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap w-12">{timedDelay}s</span>
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
