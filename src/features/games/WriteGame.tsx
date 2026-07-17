import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { shuffle, normalizeText, weightedRandom } from "@/utils/gameUtils";
import { useGameProbs } from "./useGameProbs";
import { ResultScreen } from "./ResultScreen";
import { ResultEndless } from "./ResultEndless";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { ImageThumb } from "@/components/ImageThumb";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  onPlayAgain: () => void;
  onRetryMistakes?: (wrongIds: Set<number>) => void;
  onBack: () => void;
  answerFirst?: boolean;
  mode?: "oneshot" | "endless" | "endless-skip";
}

type Phase = "input" | "revealed";

const DEFAULT_PROB = 10;

export function WriteGame({ cards, onPlayAgain, onRetryMistakes, onBack, answerFirst = false, mode = "oneshot" }: Props) {
  const { t } = useTranslation();
  const { probs, updateProb, resetProb, saveProbs } = useGameProbs(cards, "write0");

  const deck = useMemo(() => shuffle(cards), [cards]);
  const [initialized, setInitialized] = useState(false);
  const [remaining, setRemaining] = useState<Content[]>([]);

  const [current, setCurrent] = useState<Content | null>(null);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 });
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const remainingRef = useRef<Content[]>([]);
  const probsRef = useRef<Record<number, number>>(probs);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

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
      setCurrent(pool[weightedRandom(allProbs)]);
    } else {
      const sorted = [...deck].sort((a, b) => (probs[b.id] ?? DEFAULT_PROB) - (probs[a.id] ?? DEFAULT_PROB));
      setCurrent(sorted[0]);
      setRemaining(sorted.slice(1));
      remainingRef.current = sorted.slice(1);
    }
  }, [probs, deck, initialized]);

  useEffect(() => {
    probsRef.current = probs;
  }, [probs]);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (phase === "input") inputRef.current?.focus();
    else nextRef.current?.focus();
  }, [current, phase]);

  function pickNext() {
    if (mode === "endless" || mode === "endless-skip") {
      if (!isCorrect) {
        setInput("");
        setHint("");
        setPhase("input");
        return;
      }
      const pool =
        mode === "endless-skip"
          ? cards.filter((c) => (probsRef.current[c.id] ?? DEFAULT_PROB) > 1)
          : cards;
      if (pool.length === 0) {
        setDone(true);
        saveProbs();
        return;
      }
      const allProbs = pool.map((c) => probsRef.current[c.id] ?? DEFAULT_PROB);
      setCurrent(pool[weightedRandom(allProbs)]);
      setInput("");
      setHint("");
      setPhase("input");
      return;
    }

    const rem = remainingRef.current;
    const currentProbs = probsRef.current;
    if (rem.length === 0) {
      setDone(true);
      saveProbs();
      return;
    }
    const probList = rem.map((c) => currentProbs[c.id] ?? DEFAULT_PROB);
    const nextIdx = weightedRandom(probList);
    const next = rem[nextIdx];
    const newRem = rem.filter((_, i) => i !== nextIdx);
    setRemaining(newRem);
    remainingRef.current = newRem;
    setCurrent(next);
    setInput("");
    setHint("");
    setPhase("input");
  }

  function handleCheck() {
    if (!current || phase !== "input") return;
    const correctAnswer = answerFirst ? current.question : current.answer;
    const correct = normalizeText(input) === normalizeText(correctAnswer);
    setIsCorrect(correct);
    setPhase("revealed");
    updateProb(current.id, correct);
    setScore((s) => ({
      r: s.r + (correct ? 1 : 0),
      w: s.w + (correct ? 0 : 1),
      t: s.t + 1,
    }));
    if (!correct) setWrongCardIds((prev) => new Set([...prev, current.id]));
  }

  function handleHint() {
    if (!current || phase !== "input") return;
    const correctAnswer = answerFirst ? current.question : current.answer;
    const next = correctAnswer.slice(0, hint.length + 1);
    setHint(next);
    setInput(next);
  }

  function handleFinish() {
    setDone(true);
    saveProbs();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (phase === "input") handleCheck();
      else pickNext();
    }
  }

  if (!initialized || !current) {
    return (
      <div className="max-w-lg mx-auto animate-pulse flex flex-col gap-4">
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (done) {
    if (score.t === 0) {
      return (
        <div className="text-center py-16 flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <p className="text-4xl">🎉</p>
          <p className="text-base font-medium text-gray-700 dark:text-gray-200">{t("write_game.all_learned_title")}</p>
          <p className="text-sm">{t("write_game.all_learned_desc")}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={onPlayAgain}
              className="text-sm px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              {t("write_game.play_endless_btn")}
            </button>
            <button
              onClick={onBack}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {t("write_game.go_back_btn")}
            </button>
          </div>
        </div>
      );
    }
    return (
      <ResultScreen
        score={score}
        onPlayAgain={onPlayAgain}
        onRetryMistakes={onRetryMistakes && wrongCardIds.size > 0 ? () => onRetryMistakes(wrongCardIds) : undefined}
        onBack={onBack}
      />
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
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
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
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{answerFirst ? t("write_game.label_answer") : t("write_game.label_question")}</p>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{answerFirst ? current.answer : current.question}</p>
        <ImageThumb filename={answerFirst ? current.imgA : current.imgQ} collectionId={current.collectionid} />
      </div>

      {/* Input phase */}
      {phase === "input" && (
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("write_game.input_placeholder")}
            rows={3}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleHint}
              className="text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t("write_game.hint_btn")}
            </button>
            <VoiceInputButton
              onResult={setInput}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            />
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors">
              {t("write_game.check_btn")}
            </button>
          </div>
        </div>
      )}

      {/* Revealed phase */}
      {phase === "revealed" && (
        <div
          className={`border-2 rounded-xl p-5 flex flex-col gap-2 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"}`}>
          <p className={`font-semibold text-sm ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
            {isCorrect ? t("write_game.result_correct") : t("write_game.result_wrong")}
          </p>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t("write_game.your_answer")}</p>
            <p className={`text-sm ${isCorrect ? "text-green-800 dark:text-green-300" : "text-red-700 dark:text-red-400 line-through"}`}>
              {input || t("write_game.empty")}
            </p>
          </div>
          {!isCorrect && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{t("write_game.correct_answer")}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{answerFirst ? current.question : current.answer}</p>
              <ImageThumb filename={answerFirst ? current.imgQ : current.imgA} collectionId={current.collectionid} />
            </div>
          )}
          {current.note && <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">{current.note}</p>}
          <button
            ref={nextRef}
            onClick={pickNext}
            className="mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            {t("write_game.next_btn")}
          </button>
        </div>
      )}

      {/* Endless controls */}
      {mode !== "oneshot" && (
        <div className="flex justify-end gap-2">
          <ResultEndless playableCards={cards} probs={probs} onResetCard={resetProb} />
          <button
            onClick={handleFinish}
            className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t("write_game.finish_btn")}
          </button>
        </div>
      )}
    </div>
  );
}
