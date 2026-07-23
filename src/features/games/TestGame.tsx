import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { shuffle, buildTestOptions, weightedRandom, adjustProb } from "@/utils/gameUtils";
import { useGameProbs } from "./useGameProbs";
import { ResultScreen } from "./ResultScreen";
import { ResultEndless } from "./ResultEndless";
import { ResultOneshotCards } from "./ResultOneshotCards";
import { ImageThumb } from "@/components/ImageThumb";
import { RichTextDisplay } from "@/components/RichTextDisplay";
import { stripHtml } from "@/utils/htmlUtils";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  onPlayAgain: () => void;
  onRetryMistakes?: (wrongIds: Set<number>) => void;
  onBack: () => void;
  answerFirst?: boolean;
  mode?: "oneshot" | "endless" | "endless-skip";
}

type AnswerState = "idle" | "correct" | "wrong";

const DEFAULT_PROB = 10;

export function TestGame({ cards, onPlayAgain, onRetryMistakes, onBack, answerFirst = false, mode = "oneshot" }: Props) {
  const { t } = useTranslation();
  const { probs, updateProb, resetProb, saveProbs } = useGameProbs(cards, answerFirst ? "test1" : "test0");

  const deck = useMemo(() => shuffle(cards), [cards]);
  const [initialized, setInitialized] = useState(false);
  const [remaining, setRemaining] = useState<Content[]>([]);

  const [current, setCurrent] = useState<Content | null>(null);
  const [options, setOptions] = useState<Content[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 });
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (initialized || Object.keys(probs).length === 0) return;
    setInitialized(true);
    if (mode === "endless" || mode === "endless-skip") {
      const pool =
        mode === "endless-skip" ? cards.filter((c) => (probs[c.id] ?? DEFAULT_PROB) > 1) : cards;
      if (pool.length === 0) {
        setDone(true);
        return;
      }
      const allProbs = pool.map((c) => probs[c.id] ?? DEFAULT_PROB);
      const next = pool[weightedRandom(allProbs)];
      setCurrent(next);
      setOptions(buildTestOptions(deck, next));
    } else {
      const sorted = [...deck].sort((a, b) => (probs[b.id] ?? DEFAULT_PROB) - (probs[a.id] ?? DEFAULT_PROB));
      setCurrent(sorted[0]);
      setRemaining(sorted.slice(1));
      setOptions(buildTestOptions(deck, sorted[0]));
    }
  }, [probs, deck, initialized]);

  function pickNext(rem: Content[], currentProbs: Record<number, number>) {
    if (mode !== "oneshot") {
      const pool =
        mode === "endless-skip"
          ? cards.filter((c) => (currentProbs[c.id] ?? DEFAULT_PROB) > 1)
          : cards;
      if (pool.length === 0) {
        setDone(true);
        saveProbs();
        return;
      }
      const allProbs = pool.map((c) => currentProbs[c.id] ?? DEFAULT_PROB);
      const nextIdx = weightedRandom(allProbs);
      const next = pool[nextIdx];
      setCurrent(next);
      setOptions(buildTestOptions(deck, next));
      setChosen(null);
      setAnswerState("idle");
      return;
    }

    if (rem.length === 0) {
      setDone(true);
      saveProbs();
      return;
    }
    const probList = rem.map((c) => currentProbs[c.id] ?? DEFAULT_PROB);
    const nextIdx = weightedRandom(probList);
    const next = rem[nextIdx];
    setCurrent(next);
    setRemaining(rem.filter((_, i) => i !== nextIdx));
    setOptions(buildTestOptions(deck, next));
    setChosen(null);
    setAnswerState("idle");
  }

  function handleAnswer(opt: Content) {
    if (answerState !== "idle" || !current) return;
    const capturedCurrent = current;
    const correctText = (answerFirst ? current.question : current.answer).trim();
    const correct = (answerFirst ? opt.question : opt.answer).trim() === correctText;
    setChosen(opt.id);
    setAnswerState(correct ? "correct" : "wrong");
    updateProb(current.id, correct);
    const nextProbs = { ...probs, [current.id]: adjustProb(probs[current.id] ?? DEFAULT_PROB, correct) };
    setScore((s) => ({
      r: s.r + (correct ? 1 : 0),
      w: s.w + (correct ? 0 : 1),
      t: s.t + 1,
    }));
    if (!correct) setWrongCardIds((prev) => new Set([...prev, current.id]));
    const rem = remaining;
    setTimeout(() => {
      if (mode !== "oneshot" && !correct) {
        setOptions(buildTestOptions(deck, capturedCurrent));
        setChosen(null);
        setAnswerState("idle");
        return;
      }
      pickNext(rem, nextProbs);
    }, 1000);
  }

  function handleFinish() {
    setDone(true);
    saveProbs();
  }

  if (!initialized || !current) {
    return (
      <div className="flex flex-col gap-4 max-w-lg mx-auto animate-pulse">
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (done) {
    if (score.t === 0) {
      return (
        <div className="text-center py-16 flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <p className="text-4xl">🎉</p>
          <p className="text-base font-medium text-gray-700 dark:text-gray-200">{t("test_game.all_learned_title")}</p>
          <p className="text-sm">{t("test_game.all_learned_desc")}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={onPlayAgain}
              className="text-sm px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              {t("test_game.play_endless_btn")}
            </button>
            <button
              onClick={onBack}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {t("test_game.go_back_btn")}
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
              cards={cards}
              rows={cards.map((c) =>
                wrongCardIds.has(c.id)
                  ? { cardId: c.id, label: "✗", variant: "red" as const }
                  : { cardId: c.id, label: "✓", variant: "green" as const }
              )}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        {mode !== "oneshot" ? (
          <span>
            {Math.round(Math.max(0, (DEFAULT_PROB - (probs[current.id] ?? DEFAULT_PROB)) / (DEFAULT_PROB - 1)) * 100)}%
          </span>
        ) : (
          <span>
            {score.t + 1} / {cards.length}
          </span>
        )}
        <span>
          ✓ {score.r} &nbsp; ✗ {score.w}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full">
        <div
          className={`h-full rounded-full transition-all ${mode !== "oneshot" ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{
            width:
              mode !== "oneshot"
                ? `${Math.max(0, (DEFAULT_PROB - (probs[current.id] ?? DEFAULT_PROB)) / (DEFAULT_PROB - 1)) * 100}%`
                : `${(score.t / cards.length) * 100}%`,
          }}
        />
      </div>

      {/* Prompt card */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 border-t-4 border-t-indigo-500 dark:border-t-indigo-400 rounded-xl p-6 text-center shadow-lg">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{answerFirst ? t("test_game.label_answer") : t("test_game.label_question")}</p>
        <RichTextDisplay html={answerFirst ? current.answer : current.question} className="text-lg font-medium text-gray-900 dark:text-gray-100" />
        <ImageThumb filename={answerFirst ? current.imgA : current.imgQ} collectionId={current.collectionid} />
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isChosen = chosen === opt.id;
          const correctText = stripHtml(answerFirst ? current.question : current.answer).trim();
          const isCorrectOpt = stripHtml(answerFirst ? opt.question : opt.answer).trim() === correctText;
          let cls =
            "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20";
          if (answerState !== "idle") {
            if (isCorrectOpt)
              cls = "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 text-green-800 dark:text-green-400";
            else if (isChosen)
              cls = "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-800 dark:text-red-400";
            else cls = "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 opacity-60";
          }
          const optImg = answerFirst ? opt.imgQ : opt.imgA;
          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt)}
              disabled={answerState !== "idle"}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${optImg ? "flex flex-col items-center gap-1 text-center" : "text-left"} ${cls}`}>
              {optImg && <ImageThumb filename={optImg} collectionId={opt.collectionid} />}
              <RichTextDisplay html={answerFirst ? opt.question : opt.answer} inline />
            </button>
          );
        })}
      </div>

      {answerState !== "idle" && current.note && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center italic">{current.note}</p>
      )}

      {/* Endless controls */}
      {mode !== "oneshot" && (
        <div className="flex justify-end gap-2">
          <ResultEndless playableCards={cards} probs={probs} onResetCard={resetProb} />
          <button
            onClick={handleFinish}
            className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t("test_game.finish_btn")}
          </button>
        </div>
      )}
    </div>
  );
}
