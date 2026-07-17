import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/api";
import { shuffle, weightedRandom } from "@/utils/gameUtils";
import { FlashCardFace } from "@/components/FlashCardFace";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useDemoStore } from "@/demo/demoStore";
import { useEditCard } from "@/hooks/useContentHooks";
import { useToast } from "@/hooks/useToast";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { useGameProbs } from "./useGameProbs";
import { ResultEndless } from "./ResultEndless";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  collectionId: number;
  answerFirst: boolean;
  isShuffled: boolean;
  mode: "normal" | "mastery";
}

const FADE_OUT = 300;
const FADE_IN = 300;
const MASTERY_THRESHOLD = 3;

// ── Main component ──────────────────────────────────────────────────

export function FlashcardGame({ cards: initialCards, collectionId, answerFirst, isShuffled, mode }: Props) {
  const { t } = useTranslation();
  const isDemo = useIsDemo();
  const demoStore = useDemoStore();
  const editCard = useEditCard();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<Content[]>(() => (isShuffled ? shuffle([...initialCards]) : [...initialCards]));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ratingMap, setRatingMap] = useState<Record<number, number>>(() => {
    const m: Record<number, number> = {};
    initialCards.forEach((c) => {
      if (c.rate) m[c.id] = c.rate;
    });
    return m;
  });

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editNote, setEditNote] = useState("");

  // Mastery probability tracking
  const { probs, setProb, resetProb, resetAllProbs, saveProbs } = useGameProbs(initialCards, answerFirst ? "mastery1" : "mastery0");

  const masteredCount = useMemo(
    () => initialCards.filter((c) => (probs[c.id] ?? 10) <= MASTERY_THRESHOLD).length,
    [initialCards, probs],
  );
  const probsLoaded = Object.keys(probs).length > 0;
  const allMastered = mode === "mastery" && probsLoaded && masteredCount === initialCards.length;

  const card = cards[index];

  const navigateTo = useCallback(
    (nextIndex: number) => {
      if (!visible) return;
      setVisible(false);
      setTimeout(() => {
        setFlipped(false);
        setIndex(nextIndex);
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
      if (editOpen) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (mode === "mastery") return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, editOpen, mode]);

  function handleMasteryGrade(grade: "again" | "hard" | "good" | "easy") {
    if (!card || isNavigating) return;
    const deltas: Record<string, number> = { again: 4, hard: 2, good: -1, easy: -3 };
    const currentProb = probs[card.id] ?? 10;
    const newProb = Math.max(1, Math.min(20, currentProb + deltas[grade]));
    setProb(card.id, newProb);

    const updatedProbs = { ...probs, [card.id]: newProb };
    const unmastered = cards.filter((c) => (updatedProbs[c.id] ?? 10) > MASTERY_THRESHOLD);

    if (unmastered.length === 0) {
      saveProbs();
      return; // allMastered derived from probs triggers completion screen
    }

    const weights = unmastered.map((c) => updatedProbs[c.id] ?? 10);
    const nextLocalIdx = weightedRandom(weights);
    const nextCard = unmastered[nextLocalIdx];
    const nextGlobalIdx = cards.findIndex((c) => c.id === nextCard.id);
    navigateTo(nextGlobalIdx);
  }

  function handleRate(cardId: number, star: number) {
    const newRate = ratingMap[cardId] === star ? 0 : star;
    setRatingMap((prev) => ({ ...prev, [cardId]: newRate }));
    if (isDemo) {
      demoStore.updateCardRate(cardId, collectionId, newRate);
    } else {
      const ratedCard = cards.find((c) => c.id === cardId);
      contentApi
        .edit({ id: cardId, rate: newRate, imgQ: ratedCard?.imgQ, imgA: ratedCard?.imgA })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["collections"] });
          queryClient.invalidateQueries({ queryKey: ["playlists"] });
        })
        .catch(() => {});
    }
  }

  function openEditModal() {
    if (!card) return;
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setEditNote(card.note ?? "");
    setEditOpen(true);
  }

  function handleEditSave() {
    if (!card || !editQuestion.trim() || !editAnswer.trim()) return;
    editCard.mutate(
      { collectionId, data: { id: card.id, question: editQuestion, answer: editAnswer, note: editNote || undefined, imgQ: card.imgQ, imgA: card.imgA } },
      {
        onSuccess: () => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id ? { ...c, question: editQuestion, answer: editAnswer, note: editNote || undefined } : c,
            ),
          );
          toast.success(t("collection_detail.card_updated"));
          setEditOpen(false);
        },
        onError: () => toast.error(t("collection_detail.card_update_error")),
      },
    );
  }

  if (!card) return <p className="text-gray-400 text-center py-16">{t("flashcard_game.no_cards")}</p>;

  const questionLabel = t("collection_detail.question_label");
  const answerLabel = t("collection_detail.answer_label");
  const frontLabel = answerFirst ? answerLabel : questionLabel;
  const backLabel = answerFirst ? questionLabel : answerLabel;
  const frontText = answerFirst ? card.answer : card.question;
  const backText = answerFirst ? card.question : card.answer;
  const frontImg = answerFirst ? card.imgA : card.imgQ;
  const backImg = answerFirst ? card.imgQ : card.imgA;

  const isNavigating = !visible;

  // Mastery completion screen
  if (allMastered) {
    return (
      <div className="mx-auto flex flex-col items-center gap-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {t("flashcard_game.mastery_complete_title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("flashcard_game.mastery_complete_subtitle")}
          </p>
        </div>
        <button
          onClick={() => resetAllProbs()}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
          {t("flashcard_game.mastery_reset")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex flex-col gap-4">
      {/* Card wrapper */}
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

      {/* Star rating — normal mode only */}
      {mode === "normal" && (
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
      )}

      {/* Bottom controls */}
      {mode === "normal" ? (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={index === 0 || isNavigating}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {t("flashcard_game.prev_btn")}
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
            {t("flashcard_game.next_btn")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Grade buttons appear only after flipping */}
          {flipped ? (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleMasteryGrade("again")}
                disabled={isNavigating}
                className="py-2.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-40 transition-colors">
                {t("flashcard_game.grade_again")}
              </button>
              <button
                onClick={() => handleMasteryGrade("hard")}
                disabled={isNavigating}
                className="py-2.5 rounded-lg text-sm font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 disabled:opacity-40 transition-colors">
                {t("flashcard_game.grade_hard")}
              </button>
              <button
                onClick={() => handleMasteryGrade("good")}
                disabled={isNavigating}
                className="py-2.5 rounded-lg text-sm font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 disabled:opacity-40 transition-colors">
                {t("flashcard_game.grade_good")}
              </button>
              <button
                onClick={() => handleMasteryGrade("easy")}
                disabled={isNavigating}
                className="py-2.5 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-40 transition-colors">
                {t("flashcard_game.grade_easy")}
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-1">
              {t("flashcard_game.mastery_flip_hint")}
            </p>
          )}

          {/* Mastery progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
              {t("flashcard_game.mastery_progress", { count: masteredCount, total: initialCards.length })}
            </span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 rounded-full h-full transition-all duration-500"
                style={{ width: `${initialCards.length > 0 ? (masteredCount / initialCards.length) * 100 : 0}%` }}
              />
            </div>
            <ResultEndless playableCards={initialCards} probs={probs} onResetCard={resetProb} />
          </div>
        </div>
      )}

      {/* Edit button */}
      <div className="flex justify-center">
        <button
          onClick={openEditModal}
          className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
            <path d="M11.5 1.5a1.5 1.5 0 0 1 2.121 2.121l-8.5 8.5a.5.5 0 0 1-.192.121l-3 1a.5.5 0 0 1-.636-.636l1-3a.5.5 0 0 1 .121-.192l8.5-8.5z" />
          </svg>
          {t("collection_detail.edit_card_title")}
        </button>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t("collection_detail.edit_card_title")} size="lg">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t("collection_detail.question_label")}</label>
            <textarea
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t("collection_detail.answer_label")}</label>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t("collection_detail.note_label")}</label>
            <input
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(false)}>
              {t("collection_detail.cancel_btn")}
            </Button>
            <Button
              size="sm"
              onClick={handleEditSave}
              loading={editCard.isPending}
              disabled={!editQuestion.trim() || !editAnswer.trim()}>
              {t("collection_detail.save_btn")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
