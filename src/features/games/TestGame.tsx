import { useState, useMemo, useEffect } from "react";
import { shuffle, buildTestOptions, weightedRandom, adjustProb } from "@/utils/gameUtils";
import { useGameProbs } from "./useGameProbs";
import { ResultScreen } from "./ResultScreen";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  onPlayAgain: () => void;
  onRetryMistakes?: (wrongIds: Set<number>) => void;
  onBack: () => void;
  answerFirst?: boolean;
}

type AnswerState = "idle" | "correct" | "wrong";

export function TestGame({ cards, onPlayAgain, onRetryMistakes, onBack, answerFirst = false }: Props) {
  const { probs, updateProb, saveProbs } = useGameProbs(cards, "test0");

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

  // Initialize once probs are loaded (probs starts empty, fills after API call)
  useEffect(() => {
    if (initialized || Object.keys(probs).length === 0) return;
    setInitialized(true);
    const sorted = [...deck].sort((a, b) => (probs[b.id] ?? 10) - (probs[a.id] ?? 10));
    setCurrent(sorted[0]);
    setRemaining(sorted.slice(1));
    setOptions(buildTestOptions(deck, sorted[0]));
  }, [probs, deck, initialized]);

  function pickNext(rem: Content[], currentProbs: Record<number, number>) {
    if (rem.length === 0) {
      setDone(true);
      saveProbs();
      return;
    }
    const probList = rem.map((c) => currentProbs[c.id] ?? 10);
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
    setChosen(opt.id);
    const correct = opt.id === current.id;
    setAnswerState(correct ? "correct" : "wrong");
    updateProb(current.id, correct);
    const nextProbs = { ...probs, [current.id]: adjustProb(probs[current.id] ?? 10, correct) };
    setScore((s) => ({
      r: s.r + (correct ? 1 : 0),
      w: s.w + (correct ? 0 : 1),
      t: s.t + 1,
    }));
    if (!correct) setWrongCardIds((prev) => new Set([...prev, current.id]));
    // Capture remaining in closure to avoid stale state
    const rem = remaining;
    setTimeout(() => pickNext(rem, nextProbs), 1000);
  }

  if (!initialized || !current) {
    return (
      <div className="flex flex-col gap-4 max-w-lg mx-auto animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (done) {
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
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {score.t + 1} / {cards.length}
        </span>
        <span>
          ✓ {score.r} &nbsp; ✗ {score.w}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${(score.t / cards.length) * 100}%` }}
        />
      </div>

      {/* Prompt card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{answerFirst ? "Answer" : "Question"}</p>
        <p className="text-lg font-medium text-gray-900">{answerFirst ? current.answer : current.question}</p>
        {(answerFirst ? current.imgA : current.imgQ) && (
          <img
            src={answerFirst ? current.imgA : current.imgQ}
            alt=""
            className="max-h-28 mx-auto mt-3 object-contain rounded"
          />
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isChosen = chosen === opt.id;
          const isCorrect = opt.id === current.id;
          let cls = "bg-white border-2 border-gray-200 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50";
          if (answerState !== "idle") {
            if (isCorrect) cls = "bg-green-50 border-green-400 text-green-800";
            else if (isChosen) cls = "bg-red-50 border-red-400 text-red-800";
            else cls = "bg-white border-gray-100 text-gray-400 opacity-60";
          }
          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt)}
              disabled={answerState !== "idle"}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-left transition-all duration-200 ${cls}`}>
              {answerFirst ? opt.question : opt.answer}
            </button>
          );
        })}
      </div>

      {answerState !== "idle" && current.note && (
        <p className="text-sm text-gray-500 text-center italic">{current.note}</p>
      )}
    </div>
  );
}
