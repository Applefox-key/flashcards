import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle } from "@/utils/gameUtils";
import { ResultScreen } from "./ResultScreen";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  onPlayAgain: () => void;
  onBack: () => void;
  answerFirst?: boolean;
}

const FADE_OUT = 300;
const FADE_IN = 300;

export function TimedGame({ cards: initialCards, onPlayAgain, onBack, answerFirst = false }: Props) {
  const [cards] = useState(() => shuffle(initialCards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [running, setRunning] = useState(false);
  const [delay, setDelay] = useState(2); // seconds per side
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function clearFadeTimer() {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
  }

  // Fade out → switch card → fade in
  const goToCard = useCallback((nextIndex: number) => {
    setVisible(false);
    clearFadeTimer();
    fadeTimerRef.current = setTimeout(() => {
      setIndex(nextIndex);
      setFlipped(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    }, FADE_OUT);
  }, []);

  useEffect(() => {
    return clearFadeTimer;
  }, []);

  useEffect(() => {
    if (!running) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!flipped) {
        setFlipped(true);
      } else {
        const next = index + 1;
        if (next >= cards.length) {
          setRunning(false);
          setDone(true);
        } else {
          goToCard(next);
        }
      }
    }, delay * 1000);
    return clearTimer;
  }, [running, flipped, index, delay, cards.length, goToCard]);

  const card = cards[index];

  if (done) {
    return (
      <ResultScreen score={{ r: cards.length, w: 0, t: cards.length }} onPlayAgain={onPlayAgain} onBack={onBack} />
    );
  }

  if (!card) return null;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {index + 1} / {cards.length}
        </span>
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.97)",
          transition: `opacity ${visible ? FADE_IN : FADE_OUT}ms ease, transform ${visible ? FADE_IN : FADE_OUT}ms ease`,
        }}
        className="cursor-pointer select-none"
        onClick={() => {
          if (!running) setFlipped((f) => !f);
        }}>
        <div style={{ perspective: "1200px" }}>
          <div
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: visible ? "transform 0.5s ease" : "none",
              position: "relative",
              minHeight: 340,
            }}>
            {/* Front face */}
            <div
              className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col p-8"
              style={{ backfaceVisibility: "hidden", overflowY: "auto" }}>
              <div className="m-auto flex flex-col items-center gap-3 w-full">
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                  {answerFirst ? "Answer" : "Question"}
                </span>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
                  {answerFirst ? card.answer : card.question}
                </p>
              </div>
            </div>

            {/* Back face */}
            <div
              className="absolute inset-0 rounded-2xl border border-indigo-500 bg-indigo-600 dark:bg-indigo-900/20 shadow-sm flex flex-col p-8"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", overflowY: "auto" }}>
              <div className="m-auto flex flex-col items-center gap-3 w-full">
                <span className="text-xs font-medium text-indigo-200 uppercase tracking-widest">
                  {answerFirst ? "Question" : "Answer"}
                </span>
                <p className="text-2xl font-semibold text-white text-center">
                  {answerFirst ? card.question : card.answer}
                </p>
                {card.note && <p className="text-sm text-indigo-200 mt-2 italic text-center">{card.note}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
            running
              ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}>
          {running ? "⏸ Pause" : "▶ Start"}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Delay: {delay}s</span>
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
            onClick={() => goToCard(Math.max(0, index - 1))}
            disabled={index === 0}
            className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30">
            ← Prev
          </button>
          <button
            onClick={() => {
              if (index + 1 >= cards.length) setDone(true);
              else goToCard(index + 1);
            }}
            disabled={index === cards.length - 1}
            className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
