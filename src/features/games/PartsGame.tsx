import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { shuffle, formatParts, weightedRandom } from "@/utils/gameUtils";
import { useGameProbs } from "./useGameProbs";
import { ResultScreen } from "./ResultScreen";
import { ImageThumb } from "@/components/ImageThumb";
import type { Content } from "@/types";
import { ResultEndless } from "./ResultEndless";
import { ResultOneshotCards } from "./ResultOneshotCards";

interface Props {
  cards: Content[];
  onPlayAgain: () => void;
  onRetryMistakes?: (wrongIds: Set<number>) => void;
  onBack: () => void;
  answerFirst?: boolean;
  mode?: "oneshot" | "endless" | "endless-skip";
}

/** Starting probability for a card with no history */
const DEFAULT_PROB = 10;

export function PartsGame({
  cards: allCards,
  onPlayAgain,
  onRetryMistakes,
  onBack,
  answerFirst = false,
  mode = "oneshot",
}: Props) {
  const { t } = useTranslation();
  const playableCards = useMemo(
    () => allCards.filter((c) => formatParts(answerFirst ? c.question : c.answer).length > 0),
    [allCards, answerFirst],
  );

  const { probs, updateProb, resetProb, saveProbs } = useGameProbs(playableCards, "parts0");

  const deck = useMemo(() => shuffle(playableCards), [playableCards]);
  const initializedRef = useRef(false);
  const [remaining, setRemaining] = useState<Content[]>([]);

  const [current, setCurrent] = useState<Content | null>(null);
  const currentRef = useRef<Content | null>(null);
  const [correctParts, setCorrectParts] = useState<string[]>([]);
  const [shuffledParts, setShuffledParts] = useState<string[]>([]);
  const [clicked, setClicked] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [noMistake, setNoMistake] = useState(true);
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 });
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const answerFirstRef = useRef(answerFirst);
  const remainingRef = useRef<Content[]>([]);
  const probsRef = useRef<Record<number, number>>(probs);
  const playableCardsRef = useRef<Content[]>(playableCards);

  useEffect(() => {
    playableCardsRef.current = playableCards;
  }, [playableCards]);

  function loadCard(card: Content) {
    currentRef.current = card;
    const text = answerFirstRef.current ? card.question : card.answer;
    const parts = formatParts(text);
    setCurrent(card);
    setCorrectParts(parts);
    setShuffledParts(shuffle([...parts]));
    setClicked([]);
    setUsedIndices(new Set());
    setWrongIndex(null);
    setNoMistake(true);
  }

  // In endless modes, when direction changes reload the current card in-place
  // instead of remounting the whole game (which would change the card pool).
  useEffect(() => {
    answerFirstRef.current = answerFirst;
    if (!initializedRef.current || !currentRef.current) return;
    if (mode !== "endless" && mode !== "endless-skip") return;

    const card = currentRef.current;
    const text = answerFirst ? card.question : card.answer;
    const pool =
      mode === "endless-skip"
        ? playableCardsRef.current.filter((c) => (probsRef.current[c.id] ?? DEFAULT_PROB) > 1)
        : playableCardsRef.current;

    if (formatParts(text).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCard(card);
    } else if (pool.length > 0) {
      // Current card has no parts in this direction — pick a valid one
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCard(pool[weightedRandom(pool.map((c) => probsRef.current[c.id] ?? DEFAULT_PROB))]);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      saveProbs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerFirst]);

  useEffect(() => {
    if (initializedRef.current || Object.keys(probs).length === 0) return;
    initializedRef.current = true;
    if (mode === "endless" || mode === "endless-skip") {
      const pool =
        mode === "endless-skip" ? playableCards.filter((c) => (probs[c.id] ?? DEFAULT_PROB) > 1) : playableCards;
      if (pool.length === 0) {
        setDone(true);
        return;
      }
      const allProbs = pool.map((c) => probs[c.id] ?? DEFAULT_PROB);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCard(pool[weightedRandom(allProbs)]);
    } else {
      // One-shot: show hardest cards first so the user doesn't finish on the ones they know.
      const sorted = [...deck].sort((a, b) => (probs[b.id] ?? DEFAULT_PROB) - (probs[a.id] ?? DEFAULT_PROB));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCard(sorted[0]);
      setRemaining(sorted.slice(1));
      remainingRef.current = sorted.slice(1);
    }
  }, [probs, deck]);

  useEffect(() => {
    probsRef.current = probs;
  }, [probs]);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  function pickNext(wasCorrect: boolean) {
    if (mode === "endless" || mode === "endless-skip") {
      if (!wasCorrect) {
        // Re-show the same card immediately until the user answers without mistakes.
        if (currentRef.current) loadCard(currentRef.current);
        return;
      }
      const pool =
        mode === "endless-skip"
          ? playableCards.filter((c) => (probsRef.current[c.id] ?? DEFAULT_PROB) > 1)
          : playableCards;
      if (pool.length === 0) {
        setDone(true);
        saveProbs();
        return;
      }
      const allProbs = pool.map((c) => probsRef.current[c.id] ?? DEFAULT_PROB);
      const nextIdx = weightedRandom(allProbs);
      loadCard(pool[nextIdx]);
      return;
    }

    // One-shot: consume the remaining queue
    const rem = remainingRef.current;
    const currentProbs = probsRef.current;
    if (rem.length === 0) {
      setDone(true);
      saveProbs();
      return;
    }
    const probList = rem.map((c) => currentProbs[c.id] ?? 10);
    const nextIdx = weightedRandom(probList);
    const next = rem[nextIdx];
    const newRem = rem.filter((_, i) => i !== nextIdx);
    setRemaining(newRem);
    remainingRef.current = newRem;
    loadCard(next);
  }

  function handlePartClick(part: string, index: number) {
    if (wrongIndex !== null || !current) return;
    const position = clicked.length;
    const expected = correctParts[position];

    if (part === expected) {
      const next = [...clicked, part];
      setClicked(next);
      setUsedIndices((prev) => new Set([...prev, index]));

      if (next.length === correctParts.length) {
        const correct = noMistake;
        updateProb(current.id, correct);
        setScore((s) => ({
          r: s.r + (correct ? 1 : 0),
          w: s.w + (correct ? 0 : 1),
          t: s.t + 1,
        }));
        if (!correct) setWrongCardIds((prev) => new Set([...prev, current.id]));
        setTimeout(() => pickNext(correct), 600);
      }
    } else {
      setClicked((prev) => [...prev, part]);
      setUsedIndices((prev) => new Set([...prev, index]));
      setWrongIndex(clicked.length);
      setNoMistake(false);
      setTimeout(() => {
        setClicked((prev) => prev.slice(0, -1));
        setUsedIndices((prev) => {
          const s = new Set(prev);
          s.delete(index);
          return s;
        });
        setWrongIndex(null);
      }, 700);
    }
  }

  function handleUndo() {
    if (clicked.length === 0 || wrongIndex !== null) return;
    const lastPart = clicked[clicked.length - 1];
    const lastIdx = [...usedIndices].reverse().find((i) => shuffledParts[i] === lastPart);
    setClicked((prev) => prev.slice(0, -1));
    if (lastIdx !== undefined) {
      setUsedIndices((prev) => {
        const s = new Set(prev);
        s.delete(lastIdx);
        return s;
      });
    }
  }

  function handleHint() {
    if (wrongIndex !== null || !current) return;
    const expected = correctParts[clicked.length];
    if (!expected) return;
    const idx = shuffledParts.findIndex((p, i) => p === expected && !usedIndices.has(i));
    if (idx === -1) return;
    handlePartClick(expected, idx);
  }

  function handleFinish() {
    setDone(true);
    saveProbs();
  }

  if (playableCards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>{t("parts_game.no_cards")}</p>
        <p className="text-sm mt-2">{t("parts_game.no_cards_hint")}</p>
      </div>
    );
  }

  if (done) {
    if (score.t === 0) {
      return (
        <div className="text-center py-16 flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <p className="text-4xl">🎉</p>
          <p className="text-base font-medium text-gray-700 dark:text-gray-200">{t("parts_game.all_learned_title")}</p>
          <p className="text-sm">{t("parts_game.all_learned_desc")}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={onPlayAgain}
              className="text-sm px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              {t("parts_game.play_endless_btn")}
            </button>
            <button
              onClick={onBack}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {t("parts_game.go_back_btn")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <ResultScreen
          score={score}
          onPlayAgain={onPlayAgain}
          onRetryMistakes={onRetryMistakes && wrongCardIds.size > 0 ? () => onRetryMistakes(wrongCardIds) : undefined}
          onBack={onBack}
        />
        {mode === "oneshot" && (
          <div className="flex justify-center pb-8">
            <ResultOneshotCards
              cards={playableCards}
              rows={playableCards.map((c) =>
                wrongCardIds.has(c.id)
                  ? { cardId: c.id, label: "✗", variant: "red" as const }
                  : { cardId: c.id, label: "✓", variant: "green" as const },
              )}
            />
          </div>
        )}
      </>
    );
  }

  if (!current) {
    return (
      <div className="max-w-lg mx-auto animate-pulse flex flex-col gap-4">
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const progressCounter = (
    <div className="flex items-center justify-between ps-5 text-sm text-gray-500 dark:text-gray-400">
      {mode !== "oneshot" ? (
        <span>
          {Math.round(Math.max(0, (DEFAULT_PROB - (probs[current.id] ?? DEFAULT_PROB)) / (DEFAULT_PROB - 1)) * 100)}%
        </span>
      ) : (
        <span>
          {score.t + 1} / {playableCards.length}
        </span>
      )}
      <span>
        ✓ {score.r} &nbsp; ✗ {score.w}
      </span>
    </div>
  );

  const progressBar = (
    <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full">
      <div
        className={`h-full rounded-full transition-all ${mode !== "oneshot" ? "bg-emerald-500" : "bg-indigo-500"}`}
        style={{
          width:
            mode !== "oneshot"
              ? `${Math.max(0, (DEFAULT_PROB - (probs[current.id] ?? DEFAULT_PROB)) / (DEFAULT_PROB - 1)) * 100}%`
              : `${(score.t / playableCards.length) * 100}%`,
        }}
      />
    </div>
  );

  const controls = (
    <div className="flex justify-between gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleUndo}
          disabled={clicked.length === 0 || wrongIndex !== null}
          className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30">
          {t("parts_game.undo_btn")}
        </button>
        <button
          onClick={handleHint}
          disabled={wrongIndex !== null}
          className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30">
          {t("parts_game.hint_btn")}
        </button>
      </div>
      {mode !== "oneshot" && (
        <div className="flex gap-2">
          <ResultEndless playableCards={playableCards} probs={probs} onResetCard={resetProb} />
          <button
            onClick={handleFinish}
            className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t("parts_game.finish_btn")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-lg mx-0 sm:mx-auto flex flex-col flex-1 min-h-0">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-4 sm:px-0 py-0">
        {/* Progress — desktop only */}
        <div className="hidden sm:block">{progressCounter}</div>
        <div className="hidden sm:block">{progressBar}</div>

        {/* Prompt */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 border-t-4 border-t-indigo-500 dark:border-t-indigo-400 rounded-xl p-6 text-center shadow-lg">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
            {answerFirst ? t("parts_game.label_answer") : t("parts_game.label_question")}
          </p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {answerFirst ? current.answer : current.question}
          </p>
          <ImageThumb filename={answerFirst ? current.imgA : current.imgQ} collectionId={current.collectionid} />
        </div>

        {/* Build area */}
        <div className="min-h-[52px] bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center flex-wrap gap-1">
          {clicked.length === 0 ? (
            <span className="text-sm text-gray-300 dark:text-gray-600">{t("parts_game.build_placeholder")}</span>
          ) : (
            clicked.map((part, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-lg text-2xl font-medium transition-colors ${
                  wrongIndex === i
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700"
                    : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                }`}>
                {part === " " ? "⎵" : part}
              </span>
            ))
          )}
        </div>

        {/* Part buttons */}
        <div className="flex flex-wrap gap-3">
          {shuffledParts.map((part, i) => {
            const isUsed = usedIndices.has(i);
            return (
              <button
                key={`${part}-${i}`}
                onClick={() => handlePartClick(part, i)}
                disabled={isUsed || wrongIndex !== null}
                className={`px-5 py-3 rounded-xl border-2 text-3xl md:text-lg font-medium transition-all duration-150 ${
                  isUsed
                    ? "border-gray-100 dark:border-gray-700 text-gray-50 dark:text-gray-900 bg-gray-50 dark:bg-gray-900/50 cursor-default"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}>
                {part === " " ? "⎵" : part}
              </button>
            );
          })}
        </div>

        {/* Controls — desktop only */}
        <div className="hidden sm:block">{controls}</div>

        {current.note && <p className="text-xs text-gray-400 italic text-center">{current.note}</p>}
      </div>

      {/* Fixed bottom panel — mobile only */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sm:border-t-0 sm:bg-transparent sm:dark:bg-transparent flex flex-col gap-2 px-4 py-3 sm:px-0 sm:py-0 sm:mt-2">
        <div className="sm:hidden">{progressCounter}</div>
        <div className="sm:hidden">{progressBar}</div>
        <div className="sm:hidden">{controls}</div>
      </div>
    </div>
  );
}
