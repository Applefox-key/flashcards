import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { contentApi } from "@/api";
import { shuffle } from "@/utils/gameUtils";
import { FlashCardFace } from "@/components/FlashCardFace";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useDemoStore } from "@/demo/demoStore";
import { useEditCard } from "@/hooks/useContentHooks";
import { useToast } from "@/hooks/useToast";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  collectionId: number;
  answerFirst: boolean;
  isShuffled: boolean;
}

// Длительности анимации (ms)
const FADE_OUT = 300; // плавное исчезание
const FADE_IN = 300; // плавное появление

// ── Main component ──────────────────────────────────────────────────

export function FlashcardGame({ cards: initialCards, collectionId, answerFirst, isShuffled }: Props) {
  const { t } = useTranslation();
  const isDemo = useIsDemo();
  const demoStore = useDemoStore();
  const editCard = useEditCard();
  const toast = useToast();
  const [cards, setCards] = useState<Content[]>(() => (isShuffled ? shuffle([...initialCards]) : [...initialCards]));
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

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editNote, setEditNote] = useState("");

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
      if (editOpen) return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, editOpen]);

  function handleRate(cardId: number, star: number) {
    const newRate = ratingMap[cardId] === star ? 0 : star;
    setRatingMap((prev) => ({ ...prev, [cardId]: newRate }));
    if (isDemo) {
      demoStore.updateCardRate(cardId, collectionId, newRate);
    } else {
      const ratedCard = cards.find((c) => c.id === cardId);
      contentApi.edit({ id: cardId, rate: newRate, imgQ: ratedCard?.imgQ, imgA: ratedCard?.imgA }).catch(() => {});
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
