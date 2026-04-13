import { useState, useEffect, useCallback } from "react";
import { contentApi } from "@/api";
import { useCardImage } from "@/hooks/useCardImage";
import { shuffle } from "@/utils/gameUtils";
import { DifficultyFilter } from "./DifficultyFilter";
import { SpeakButton } from "@/components/SpeakButton";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useDemoStore } from "@/demo/demoStore";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  collectionId: number;
  rateFilter: number | null;
  onFilterChange: (val: number | null) => void;
}

// ── Card image ──────────────────────────────────────────────────────

function CardImg({
  filename,
  collectionId,
  dark = false,
}: {
  filename: string | undefined;
  collectionId: number;
  dark?: boolean;
}) {
  const src = useCardImage(filename, collectionId);
  if (!filename || filename === "null" || filename === "") return null;
  return (
    <div
      style={{
        width: "100%",
        height: 160,
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        overflow: "hidden",
        background: dark ? "rgba(255,255,255,0.1)" : "#f3f4f6",
        flexShrink: 0,
      }}>
      {src ? (
        <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            background: dark ? "rgba(255,255,255,0.15)" : "#e5e7eb",
            animation: "pulse 1.5s infinite",
          }}
        />
      )}
    </div>
  );
}

// Длительности анимации (ms)
const FADE_OUT = 300; // плавное исчезание
const FADE_IN = 300; // плавное появление

// ── Main component ──────────────────────────────────────────────────

export function FlashcardGame({ cards: initialCards, collectionId, rateFilter, onFilterChange }: Props) {
  const isDemo = useIsDemo();
  const demoStore = useDemoStore();
  const [cards, setCards] = useState<Content[]>(() => [...initialCards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [answerFirst, setAnswerFirst] = useState(false);
  // visible = true → карточка видна, false → невидима (между картами)
  const [visible, setVisible] = useState(true);
  const [ratingMap, setRatingMap] = useState<Record<number, number>>(() => {
    const m: Record<number, number> = {};
    initialCards.forEach((c) => {
      if (c.rate) m[c.id] = c.rate;
    });
    return m;
  });

  const card = cards[index];

  // Навигация: fade out → смена карточки → fade in
  const navigateTo = useCallback(
    (nextIndex: number) => {
      if (!visible) return; // уже в процессе анимации
      setVisible(false);
      setTimeout(() => {
        setFlipped(false);
        setIndex(nextIndex);
        // небольшая пауза чтобы React успел обновить контент
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setVisible(true);
          });
        });
      }, FADE_OUT);
    },
    [visible],
  );

  const goNext = useCallback(() => {
    if (index < cards.length - 1) navigateTo(index + 1);
  }, [index, cards.length, navigateTo]);

  const goPrev = useCallback(() => {
    if (index > 0) navigateTo(index - 1);
  }, [index, navigateTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  function toggleShuffle() {
    const next = !isShuffled;
    setIsShuffled(next);
    setCards(next ? shuffle([...initialCards]) : [...initialCards]);
    setIndex(0);
    setFlipped(false);
  }

  function toggleAnswerFirst() {
    setAnswerFirst((a) => !a);
    setFlipped(false);
    setIndex(0);
  }

  function handleRate(cardId: number, star: number) {
    const newRate = ratingMap[cardId] === star ? 0 : star;
    setRatingMap((prev) => ({ ...prev, [cardId]: newRate }));
    if (isDemo) {
      demoStore.updateCardRate(cardId, collectionId, newRate);
    } else {
      contentApi.edit({ id: cardId, rate: newRate }).catch(() => {});
    }
  }

  if (!card) return <p className="text-gray-400 text-center py-16">No cards to show.</p>;

  const frontLabel = answerFirst ? "Answer" : "Question";
  const backLabel = answerFirst ? "Question" : "Answer";
  const frontText = answerFirst ? card.answer : card.question;
  const backText = answerFirst ? card.question : card.answer;
  const frontImg = answerFirst ? card.imgA : card.imgQ;
  const backImg = answerFirst ? card.imgQ : card.imgA;

  const btnBase = "text-xs border rounded px-2 py-0.5 transition-colors";
  const btnActive =
    "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400";
  const btnInactive =
    "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500";

  const isNavigating = !visible;

  return (
    <div className="mx-auto flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={toggleAnswerFirst} className={`${btnBase} ${answerFirst ? btnActive : btnInactive}`}>
          {answerFirst ? "A → Q" : "Q → A"}
        </button>
        <button onClick={toggleShuffle} className={`${btnBase} ${isShuffled ? btnActive : btnInactive}`}>
          ⇄ Shuffle
        </button>
        <div className="ml-auto">
          <DifficultyFilter selected={rateFilter} onChange={onFilterChange} />
        </div>
      </div>

      {/* Card wrapper — только opacity и scale, никаких 3D трансформаций */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.97)",
          transition: `opacity ${visible ? FADE_IN : FADE_OUT}ms ease, transform ${visible ? FADE_IN : FADE_OUT}ms ease`,
        }}
        onClick={() => {
          if (!isNavigating) setFlipped((f) => !f);
        }}
        className="cursor-pointer select-none">
        {/* Perspective wrapper — только perspective, без других стилей */}
        <div style={{ perspective: "1200px" }}>
          {/* Rotating inner — preserve-3d, NO Tailwind visual classes */}
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
              className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col"
              style={{ backfaceVisibility: "hidden" }}>
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{frontLabel}</span>
                <SpeakButton text={frontText} />
              </div>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-3 px-6 py-2">
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">{frontText}</p>
                <CardImg filename={frontImg} collectionId={collectionId} dark={false} />
              </div>
              {/* Footer */}
              <div className="shrink-0 px-6 pt-1 pb-4 text-center">
                <span className="text-xs text-gray-300 dark:text-gray-600">Click to flip</span>
              </div>
            </div>

            {/* Back face */}
            <div
              className="absolute inset-0 rounded-2xl border border-indigo-500 bg-indigo-600 dark:bg-indigo-900/20 shadow-sm flex flex-col"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
                <span className="text-xs font-medium text-indigo-200 uppercase tracking-widest">{backLabel}</span>
                <SpeakButton text={backText} />
              </div>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-3 px-6 py-2">
                <p className="text-2xl font-semibold text-white text-center">{backText}</p>
                <CardImg filename={backImg} collectionId={collectionId} dark={true} />
                {card.note && (
                  <p className="text-sm text-indigo-200 italic text-center">{card.note}</p>
                )}
              </div>
              {/* Footer */}
              <div className="shrink-0 px-6 pt-1 pb-4 text-center">
                <span className="text-xs text-indigo-300">Click to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Star rating */}
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              handleRate(card.id, star);
            }}
            className={`text-2xl transition-colors ${
              (ratingMap[card.id] ?? 0) >= star
                ? "text-yellow-400"
                : "text-gray-200 dark:text-gray-600 hover:text-yellow-300"
            }`}>
            ★
          </button>
        ))}
      </div>

      {/* Navigation + progress */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={index === 0 || isNavigating}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ← Prev
        </button>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-gray-400 shrink-0">
            {index + 1} / {cards.length}
          </span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-indigo-500 rounded-full h-full transition-all duration-300"
              style={{ width: `${((index + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={goNext}
          disabled={index === cards.length - 1 || isNavigating}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}
