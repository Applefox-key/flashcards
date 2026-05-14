import { useState, useEffect, useCallback } from "react";
import { contentApi } from "@/api";
import { shuffle } from "@/utils/gameUtils";
import { FlashCardFace } from "@/components/FlashCardFace";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useDemoStore } from "@/demo/demoStore";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  collectionId: number;
  rateFilter: number | null;
  onFilterChange: (val: number | null) => void;
  answerFirst: boolean;
  isShuffled: boolean;
}

// Длительности анимации (ms)
const FADE_OUT = 300; // плавное исчезание
const FADE_IN = 300; // плавное появление

// ── Main component ──────────────────────────────────────────────────

export function FlashcardGame({ cards: initialCards, collectionId, rateFilter: _rateFilter, onFilterChange: _onFilterChange, answerFirst, isShuffled }: Props) {
  const isDemo = useIsDemo();
  const demoStore = useDemoStore();
  const [cards] = useState<Content[]>(() => isShuffled ? shuffle([...initialCards]) : [...initialCards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
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

  const isNavigating = !visible;

  return (
    <div className="mx-auto flex flex-col gap-4">
      {/* Card wrapper — opacity + scale fade, click to flip */}
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
        <FlashCardFace
          frontLabel={frontLabel}
          backLabel={backLabel}
          frontText={frontText}
          backText={backText}
          frontImg={frontImg}
          backImg={backImg}
          note={card.note}
          collectionId={collectionId}
          flipped={flipped}
          animated={visible}
        />
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
