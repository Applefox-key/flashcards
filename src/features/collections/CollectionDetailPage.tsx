import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useCollectionWithContent,
  useToggleFavorite,
  useTogglePublic,
  useDeleteCollection,
  useDeleteAllCards,
} from "@/hooks/useCollectionHooks";
import { useDeleteCard, useEditCard, useAddCard, useAddCardWithImage } from "@/hooks/useContentHooks";
import { useSetCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { collectionTagsApi } from "@/api";
import { PasteCardsModal } from "@/features/content/PasteCardsModal";
import { FileImportModal } from "@/features/content/FileImportModal";
import { Reorganizer } from "@/features/content/Reorganizer";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { TranslateButton } from "@/components/TranslateButton";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { FlashCardPreview } from "@/components/FlashCardPreview";
import { TagSelect } from "@/components/TagSelect";
import { useToast } from "@/hooks/useToast";
import { useCardImage } from "@/hooks/useCardImage";
import { CollectionProgressBar } from "@/components/CollectionProgressBar";
import type { Content, Collection, CardEditRequest, Category } from "@/types";
import { PiListBold, PiShootingStarThin } from "react-icons/pi";
import { IoTrashBinOutline } from "react-icons/io5";
import { BsGridFill, BsGrid } from "react-icons/bs";
import { SideDrawer } from "@/components/SideDrawer";
import { FaInfo } from "react-icons/fa6";
import { BiImageAdd } from "react-icons/bi";

interface CollectionContentResponse {
  collection: Collection;
  content: Content[];
}

// ── Card image component (view only) ────────────────────────────────

function CardImg({ filename, collectionId, alt }: { filename: string | undefined; collectionId: number; alt: string }) {
  const src = useCardImage(filename, collectionId);
  const hasFile = !!filename && filename !== "null" && filename !== "";
  if (!hasFile) return null;
  if (!src)
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-2" style={{ height: "6rem" }} />
    );
  return <img src={src} alt={alt} className="mt-2 max-h-40 object-contain rounded border border-gray-100" />;
}

// ── Image upload field ───────────────────────────────────────────────

function ImageUploadField({
  currentFilename,
  collectionId,
  file,
  onFileChange,
  onClear,
}: {
  currentFilename?: string;
  collectionId: number;
  file: File | null;
  onFileChange: (f: File | null) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const existingSrc = useCardImage(!file && currentFilename ? currentFilename : undefined, collectionId);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const hasExisting = !!currentFilename && currentFilename !== "null" && currentFilename !== "" && !file;

  return (
    <div className="flex flex-col gap-1 sm:mt-2">
      {/* <span className="text-xs text-gray-400 md:hidden">{label}</span> */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      {file && previewUrl ? (
        <div className="flex items-center gap-2 flex-row md:flex-col md:items-center">
          <img src={previewUrl} alt="" className="max-h-24 object-contain rounded border border-gray-100" />
          <button
            type="button"
            onClick={() => {
              onFileChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs text-red-400 hover:text-red-600">
            {t("collection_detail.img_cancel")}
          </button>
        </div>
      ) : hasExisting ? (
        <div className="flex items-center gap-2  md:flex-col md:items-start w-[103px]">
          {existingSrc && (
            <img src={existingSrc} alt="" className="max-h-24 object-contain rounded border border-gray-100" />
          )}
          <div className="flex flex-col gap-1 md:flex-row md:items-center">
            <button type="button" onClick={onClear} className="text-xs text-red-400 hover:text-red-600">
              {t("collection_detail.img_remove")}
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-indigo-400 hover:text-indigo-600">
              {t("collection_detail.img_replace")}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-3 text-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors text-xs text-gray-400 dark:text-gray-500">
          <BiImageAdd className="text-xl sm:text-2xl absolute bottom-0 left-0 sm:right-0 sm:left-unset" />{" "}
          {t("collection_detail.img_click_to_add")}
        </div>
      )}
    </div>
  );
}

// ── Edit card modal ─────────────────────────────────────────────────

function EditCardModal({
  card,
  collectionId,
  open,
  onClose,
  layout = "standard",
}: {
  card: Content;
  collectionId: number;
  open: boolean;
  onClose: () => void;
  layout?: "standard" | "document";
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const { speechLangs } = useUserSettings();
  const editCard = useEditCard();
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [note, setNote] = useState(card.note ?? "");
  const [imgQFile, setImgQFile] = useState<File | null>(null);
  const [imgAFile, setImgAFile] = useState<File | null>(null);
  const [clearImgQ, setClearImgQ] = useState(false);
  const [clearImgA, setClearImgA] = useState(false);
  const validLangs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code) && l.code !== "");
  const initQLang = validLangs[0]?.code ?? ("en-US" as LangCode);
  const initALang = validLangs[1]?.code ?? validLangs[0]?.code ?? ("en-US" as LangCode);
  const [questionLang, setQuestionLang] = useState<LangCode>(initQLang);
  const [answerLang, setAnswerLang] = useState<LangCode>(initALang);

  useEffect(() => {
    if (open) {
      setQuestion(card.question);
      setAnswer(card.answer);
      setNote(card.note ?? "");
      setImgQFile(null);
      setImgAFile(null);
      setClearImgQ(false);
      setClearImgA(false);
    }
  }, [open, card]);

  function handleSave() {
    const hasImageChange = imgQFile || imgAFile || clearImgQ || clearImgA;
    if (hasImageChange) {
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          id: card.id,
          question,
          answer,
          note: note || undefined,
          collectionid: collectionId,
          ...(clearImgQ ? { imgQ: "" } : {}),
          ...(clearImgA ? { imgA: "" } : {}),
        }),
      );
      if (imgQFile) fd.append("imgQfile", imgQFile);
      if (imgAFile) fd.append("imgAfile", imgAFile);
      editCard.mutate(
        { collectionId, data: fd as unknown as CardEditRequest },
        {
          onSuccess: () => {
            toast.success(t("collection_detail.card_updated"));
            onClose();
          },
          onError: () => toast.error(t("collection_detail.card_update_error")),
        },
      );
    } else {
      editCard.mutate(
        {
          collectionId,
          data: { id: card.id, question, answer, note: note || undefined, imgQ: card.imgQ, imgA: card.imgA },
        },
        {
          onSuccess: () => {
            toast.success(t("collection_detail.card_updated"));
            onClose();
          },
          onError: () => toast.error(t("collection_detail.card_update_error")),
        },
      );
    }
  }

  const isDoc = layout === "document";

  return (
    <Modal open={open} onClose={onClose} title={t("collection_detail.edit_card_title")} size={isDoc ? "xl" : "lg"}>
      <div className="flex flex-col gap-3">
        <div className="border-2 border-gray-200 dark:border-gray-600 rounded-b-lg p-1">
          <div className="flex items-center justify-between mb-1 bg-gray-100 dark:bg-gray-600/30">
            <label className="text-xs text-gray-400">{t("collection_detail.question_label")}</label>
            <VoiceInputButton onResult={setQuestion} onLangChange={setQuestionLang} speakText={question} />
          </div>
          <div className={`flex gap-2 ${isDoc ? "flex-col" : "flex-col-reverse md:flex-row"}`}>
            {!isDoc && (
              <ImageUploadField
                currentFilename={clearImgQ ? undefined : card.imgQ}
                collectionId={collectionId}
                file={imgQFile}
                onFileChange={setImgQFile}
                onClear={() => {
                  setClearImgQ(true);
                  setImgQFile(null);
                }}
              />
            )}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={isDoc ? 3 : 2}
              autoFocus
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 leading-relaxed"
            />
          </div>
        </div>
        <div className="border-2 border-gray-200 dark:border-gray-600 rounded-b-lg p-1">
          <div className="flex items-center justify-between mb-1 bg-gray-100 dark:bg-gray-600/30">
            <label className="text-xs text-gray-400">{t("collection_detail.answer_label")}</label>
            <div className="flex items-center gap-1">
              <TranslateButton
                sourceText={question}
                srcLang={questionLang}
                tgtLang={answerLang}
                onResult={setAnswer}
                onError={(m) => toast.error(m)}
              />
              <VoiceInputButton
                onResult={setAnswer}
                defaultLang={initALang}
                onLangChange={setAnswerLang}
                speakText={answer}
              />
            </div>
          </div>
          <div className={`flex gap-2 ${isDoc ? "flex-col" : "flex-col-reverse md:flex-row"}`}>
            {!isDoc && (
              <ImageUploadField
                currentFilename={clearImgA ? undefined : card.imgA}
                collectionId={collectionId}
                file={imgAFile}
                onFileChange={setImgAFile}
                onClear={() => {
                  setClearImgA(true);
                  setImgAFile(null);
                }}
              />
            )}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={isDoc ? 7 : 2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 leading-relaxed"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1 bg-gray-100 dark:bg-gray-600/30">
            {t("collection_detail.note_label")}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("collection_detail.cancel_btn")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={editCard.isPending}
            disabled={!question.trim() || !answer.trim()}>
            {t("collection_detail.save_btn")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add card form ───────────────────────────────────────────────────

function AddCardForm({
  collectionId,
  onDone,
  layout = "standard",
}: {
  collectionId: number;
  onDone: () => void;
  layout?: "standard" | "document";
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const { speechLangs } = useUserSettings();
  const validLangs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code) && l.code !== "");
  const initQLang = validLangs[0]?.code ?? ("en-US" as LangCode);
  const initALang = validLangs[1]?.code ?? validLangs[0]?.code ?? ("en-US" as LangCode);
  const addCard = useAddCard();
  const addCardWithImage = useAddCardWithImage();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionLang, setQuestionLang] = useState<LangCode>(initQLang);
  const [answerLang, setAnswerLang] = useState<LangCode>(initALang);
  const [note, setNote] = useState("");
  const [imgQFile, setImgQFile] = useState<File | null>(null);
  const [imgAFile, setImgAFile] = useState<File | null>(null);

  function handleSave() {
    if (!question.trim() || !answer.trim()) return;
    if (imgQFile || imgAFile) {
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          note: note.trim() || undefined,
        }),
      );
      if (imgQFile) fd.append("imgQfile", imgQFile);
      if (imgAFile) fd.append("imgAfile", imgAFile);
      addCardWithImage.mutate(
        { collectionId, formData: fd },
        {
          onSuccess: () => {
            toast.success(t("collection_detail.card_added"));
            setQuestion("");
            setAnswer("");
            setNote("");
            setImgQFile(null);
            setImgAFile(null);
          },
          onError: () => toast.error(t("collection_detail.card_add_error")),
        },
      );
    } else {
      addCard.mutate(
        { collectionId, card: { question: question.trim(), answer: answer.trim(), note: note.trim() || undefined } },
        {
          onSuccess: () => {
            toast.success(t("collection_detail.card_added"));
            setQuestion("");
            setAnswer("");
            setNote("");
          },
          onError: () => toast.error(t("collection_detail.card_add_error")),
        },
      );
    }
  }

  const isPending = addCard.isPending || addCardWithImage.isPending;
  const isDoc = layout === "document";

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 flex flex-col gap-3 mb-4">
      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
        {t("collection_detail.new_card_heading")}
      </p>
      <div className={isDoc ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4 gap-3"}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("collection_detail.question_label")}</label>
            <VoiceInputButton onResult={setQuestion} onLangChange={setQuestionLang} speakText={question} />
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
            }}
            placeholder={t("collection_detail.question_placeholder")}
            rows={isDoc ? 3 : 2}
            autoFocus
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 leading-relaxed"
          />
          {!isDoc && (
            <ImageUploadField
              collectionId={collectionId}
              file={imgQFile}
              onFileChange={setImgQFile}
              onClear={() => setImgQFile(null)}
            />
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">{t("collection_detail.answer_label")}</label>
            <div className="flex items-center gap-1">
              <TranslateButton
                sourceText={question}
                srcLang={questionLang}
                tgtLang={answerLang}
                onResult={setAnswer}
                onError={(m) => toast.error(m)}
              />
              <VoiceInputButton
                onResult={setAnswer}
                defaultLang={initALang}
                onLangChange={setAnswerLang}
                speakText={answer}
              />
            </div>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
            }}
            placeholder={t("collection_detail.answer_placeholder")}
            rows={isDoc ? 8 : 2}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 leading-relaxed"
          />
          {!isDoc && (
            <ImageUploadField
              collectionId={collectionId}
              file={imgAFile}
              onFileChange={setImgAFile}
              onClear={() => setImgAFile(null)}
            />
          )}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
          {t("collection_detail.note_label")}
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("collection_detail.note_placeholder")}
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="flex gap-2 justify-end items-center">
        <span className="text-xs text-gray-400 mr-auto">{t("collection_detail.ctrl_enter_hint")}</span>
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t("collection_detail.cancel_btn")}
        </Button>
        <Button size="sm" onClick={handleSave} loading={isPending} disabled={!question.trim() || !answer.trim()}>
          {t("collection_detail.add_card_btn")}
        </Button>
      </div>
    </div>
  );
}

// ── Card item ───────────────────────────────────────────────────────

function highlightNote(note: string, question: string, answer: string) {
  const terms = [question, answer].map((t) => t.trim()).filter(Boolean);
  if (!terms.length) return <>{note}</>;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = note.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <strong className="underline" key={i}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

function CardListRow({
  card,
  collectionId,
  index,
  onView,
  onDelete,
  layout,
}: {
  card: Content;
  collectionId: number;
  index: number;
  onView: (card: Content) => void;
  onDelete: (id: number) => void;
  layout?: "standard" | "document";
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [rowMenuOpen, setRowMenuOpen] = useState(false);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        setRowMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [rowMenuOpen]);

  return (
    <>
      <EditCardModal
        card={card}
        collectionId={collectionId}
        open={editing}
        onClose={() => setEditing(false)}
        layout={layout}
      />
      <div className="group bg-white dark:bg-gray-800 px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xs text-gray-300 dark:text-gray-600 font-mono mt-0.5 w-5 shrink-0 text-right">
            {index}
          </span>
          <div className="flex sm:flex-1 flex-col sm:flex-row min-w-0 sm:grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{card.question}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{card.answer}</span>
            {card.note && (
              <span className="sm:col-span-2 text-xs text-gray-400 truncate bg-amber-100 dark:bg-gray-900 dark:text-grey-400 w-fit max-w-full truncate italic">
                {highlightNote(card.note, card.question, card.answer)}
              </span>
            )}
          </div>
        </div>
        {/* Desktop: hover buttons */}
        <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onView(card)}
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
            {t("collection_detail.view_btn")}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
            {t("collection_detail.edit_btn")}
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            {t("collection_detail.delete_btn")}
          </button>
        </div>
        {/* Mobile: ··· kebab menu */}
        <div className="relative sm:hidden shrink-0" ref={rowMenuRef}>
          <button
            onClick={() => setRowMenuOpen((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none">
            •••
          </button>
          {rowMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[140px] py-1">
              <button
                onClick={() => {
                  setRowMenuOpen(false);
                  onView(card);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t("collection_detail.view_btn")}
              </button>
              <button
                onClick={() => {
                  setRowMenuOpen(false);
                  setEditing(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t("collection_detail.edit_btn")}
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
              <button
                onClick={() => {
                  setRowMenuOpen(false);
                  onDelete(card.id);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                {t("collection_detail.delete_btn")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CardItem({
  card,
  collectionId,
  onView,
  onDelete,
  layout,
}: {
  card: Content;
  collectionId: number;
  onView: (card: Content) => void;
  onDelete: (id: number) => void;
  layout?: "standard" | "document";
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const editCard = useEditCard();
  const [editing, setEditing] = useState(false);
  const [hoverRate, setHoverRate] = useState(0);

  const displayRate = hoverRate || card.rate || 0;

  function handleRate(star: number) {
    const newRate = card.rate === star ? 0 : star;
    editCard.mutate(
      {
        collectionId,
        data: {
          id: card.id,
          question: card.question,
          answer: card.answer,
          note: card.note,
          rate: newRate,
          imgQ: card.imgQ,
          imgA: card.imgA,
        },
      },
      { onError: () => toast.error(t("collection_detail.rating_update_error")) },
    );
  }

  return (
    <>
      <EditCardModal
        card={card}
        collectionId={collectionId}
        open={editing}
        onClose={() => setEditing(false)}
        layout={layout}
      />
      <div className="justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-3 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
        <div>
          <p className="text-xs text-gray-400 mb-1">{t("collection_detail.question_label")}</p>
          <p className="font-medium text-gray-900 bg-gray-100 dark:text-gray-100 dark:bg-gray-900 whitespace-pre-line">
            {card.question}
          </p>
          <CardImg filename={card.imgQ} collectionId={collectionId} alt="question" />
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700" />
        <div>
          <p className="text-xs text-gray-400 mb-1">{t("collection_detail.answer_label")}</p>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{card.answer}</p>
          <CardImg filename={card.imgA} collectionId={collectionId} alt="answer" />
          {card.note && (
            <p className="text-xs text-gray-400 mt-1 italic">{highlightNote(card.note, card.question, card.answer)}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5" onMouseLeave={() => setHoverRate(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRate(star)}
                disabled={editCard.isPending}
                className={`text-base leading-none transition-colors disabled:opacity-40 ${
                  star <= displayRate ? "text-yellow-400" : "text-gray-200 dark:text-gray-600 hover:text-yellow-300"
                }`}>
                ★
              </button>
            ))}
          </div>
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView(card)}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              {t("collection_detail.view_btn")}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors">
              {t("collection_detail.edit_btn")}
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors">
              {t("collection_detail.delete_btn")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Compact card item ───────────────────────────────────────────────

function CardItemCompact({
  card,
  collectionId,
  onView,
  onDelete,
  layout,
}: {
  card: Content;
  collectionId: number;
  onView: (card: Content) => void;
  onDelete: (id: number) => void;
  layout?: "standard" | "document";
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const editCard = useEditCard();
  const [editing, setEditing] = useState(false);
  const [hoverRate, setHoverRate] = useState(0);

  const displayRate = hoverRate || card.rate || 0;

  function handleRate(star: number) {
    const newRate = card.rate === star ? 0 : star;
    editCard.mutate(
      {
        collectionId,
        data: {
          id: card.id,
          question: card.question,
          answer: card.answer,
          note: card.note,
          rate: newRate,
          imgQ: card.imgQ,
          imgA: card.imgA,
        },
      },
      { onError: () => toast.error(t("collection_detail.rating_update_error")) },
    );
  }

  return (
    <>
      <EditCardModal
        card={card}
        collectionId={collectionId}
        open={editing}
        onClose={() => setEditing(false)}
        layout={layout}
      />
      <div className="justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{t("collection_detail.question_label")}</p>
          <p className="font-medium text-sm text-gray-900 bg-gray-100 dark:text-gray-100 dark:bg-gray-900 line-clamp-2 whitespace-pre-line min-h-[2.625rem]">
            {card.question}
          </p>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700" />
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{t("collection_detail.answer_label")}</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 whitespace-pre-line min-h-[2.625rem]">
            {card.answer}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5" onMouseLeave={() => setHoverRate(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRate(star)}
                disabled={editCard.isPending}
                className={`text-base leading-none transition-colors disabled:opacity-40 ${
                  star <= displayRate ? "text-yellow-400" : "text-gray-200 dark:text-gray-600 hover:text-yellow-300"
                }`}>
                ★
              </button>
            ))}
          </div>
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView(card)}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              {t("collection_detail.view_btn")}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors">
              {t("collection_detail.edit_btn")}
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors">
              {t("collection_detail.delete_btn")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
      <div className="border-t border-gray-100 dark:border-gray-700 mb-3" />
      <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────

export function CollectionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collectionId = Number(id);
  const toast = useToast();

  const { data: rawData, isLoading, isError } = useCollectionWithContent(collectionId);
  const deleteCard = useDeleteCard();
  const toggleFavorite = useToggleFavorite();
  const togglePublic = useTogglePublic();
  const deleteCollection = useDeleteCollection();
  const deleteAllCards = useDeleteAllCards();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("grid");
  const [sortField, setSortField] = useState<"question" | "answer" | "note" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [viewCard, setViewCard] = useState<Content | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [reorgMode, setReorgMode] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editedTagIds, setEditedTagIds] = useState<number[] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [addCardDropdownOpen, setAddCardDropdownOpen] = useState(false);
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const [rateFilter, setRateFilter] = useState<null | 0 | 1 | 2 | 3 | 4 | 5 | "not5">(null);
  const [rateFilterOpen, setRateFilterOpen] = useState(false);
  const tagPopoverMobileRef = useRef<HTMLDivElement>(null);
  const tagPopoverDesktopRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const addCardDropdownRef = useRef<HTMLDivElement>(null);
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const rateFilterRef = useRef<HTMLDivElement>(null);

  const setCollectionTags = useSetCollectionTags();
  const { data: collectionTags = [] } = useQuery({
    queryKey: ["collection-tags", "collection", collectionId],
    queryFn: () => collectionTagsApi.getByCollection(collectionId),
    enabled: !!collectionId,
  });

  const serverTagIds = useMemo(() => collectionTags.map((t) => t.id), [collectionTags]);
  const pendingTagIds = editedTagIds ?? serverTagIds;

  useEffect(() => {
    if (!editingTags) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inMobile = tagPopoverMobileRef.current?.contains(target);
      const inDesktop = tagPopoverDesktopRef.current?.contains(target);
      if (!inMobile && !inDesktop) {
        setEditingTags(false);
        setEditedTagIds(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editingTags, collectionTags]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!addCardDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (addCardDropdownRef.current && !addCardDropdownRef.current.contains(e.target as Node)) {
        setAddCardDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addCardDropdownOpen]);

  useEffect(() => {
    if (!editDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setEditDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editDropdownOpen]);

  useEffect(() => {
    if (!rateFilterOpen) return;
    function handleClick(e: MouseEvent) {
      if (rateFilterRef.current && !rateFilterRef.current.contains(e.target as Node)) {
        setRateFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [rateFilterOpen]);

  const parsed = rawData as unknown as CollectionContentResponse[] | undefined;
  const collectionData = parsed?.[0];
  const collection = collectionData?.collection;
  const cards: Content[] = collectionData?.content ?? [];

  const filtered = cards.filter((c) => {
    const matchesSearch =
      c.question?.toLowerCase().includes(search.toLowerCase()) ||
      c.answer?.toLowerCase().includes(search.toLowerCase());
    const matchesRate =
      rateFilter === null ? true : rateFilter === "not5" ? (c.rate ?? 0) < 5 : (c.rate ?? 0) === rateFilter;
    return matchesSearch && matchesRate;
  });

  const sorted = sortField
    ? [...filtered].sort((a, b) => {
        const va = (a[sortField] ?? "").toLowerCase();
        const vb = (b[sortField] ?? "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      })
    : filtered;

  function handleDelete(cardId: number) {
    if (!confirm(t("collection_detail.confirm_delete_card"))) return;
    deleteCard.mutate(
      { cardId, collectionId },
      { onError: () => toast.error(t("collection_detail.toast_delete_card_error")) },
    );
  }

  function handleDeleteAllCards() {
    if (!confirm(t("collection_detail.confirm_clear_cards", { count: cards.length, name: collection?.name }))) return;
    deleteAllCards.mutate(collectionId, {
      onSuccess: () => toast.success(t("collection_detail.toast_cards_cleared")),
      onError: () => toast.error(t("collection_detail.toast_cards_clear_error")),
    });
  }

  function handleDeleteCollection() {
    if (!confirm(t("collection_detail.confirm_delete_collection", { name: collection?.name }))) return;
    deleteCollection.mutate(collectionId, {
      onSuccess: () => {
        toast.success(t("collection_detail.toast_collection_deleted"));
        navigate("/library");
      },
      onError: () => toast.error(t("collection_detail.toast_collection_delete_error")),
    });
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-red-500">
        <p>{t("collection_detail.load_error")}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mt-4">
          {t("collection_detail.go_back")}
        </Button>
      </div>
    );
  }

  function handleExport() {
    const name = collection?.name ?? `collection_${collectionId}`;
    const rows = cards.map((c) => [c.question, c.answer, c.note ?? ""].join(";"));
    const blob = new Blob([rows.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (reorgMode) {
    return <Reorganizer cards={cards} collectionId={collectionId} onClose={() => setReorgMode(false)} />;
  }

  return (
    <div>
      {/* ── Sticky header + action bar ── */}
      <div className="sticky top-0 sm:-top-6 z-20 bg-gray-50 dark:bg-gray-900 -mx-3 px-3 sm:-mx-6 sm:px-6 border-b border-gray-200 dark:border-gray-700 mb-2">
        <div className="mb-2">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 min-w-0 truncate flex-1">
              {isLoading ? (
                <span className="inline-block h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <Link
                  to={`/collections/${id}/edit`}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                  {collection?.name ?? `Collection #${id}`}
                </Link>
              )}
            </h1>{" "}
            {/* ── Search — desktop only  ──*/}
            <div className="hidden sm:flex items-center gap-2 flex-wrap ml-8">
              {/* Search — desktop only */}
              {cards.length > 4 && (
                <input
                  type="search"
                  placeholder={t("collection_detail.search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="hidden sm:block flex-1 min-w-[300px] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              )}
            </div>
            {/* menu... button — mobile only */}
            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base leading-none">
                •••
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[220px] py-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/collections/${id}/edit`);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-xs text-gray-400">✏</span> {t("collection_detail.edit_collection_btn")}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/collections/${id}/stats`);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="currentColor">
                      <path d="M3 3h2v18H3V3zm4 9h2v9H7v-9zm4-5h2v14h-2V7zm4 3h2v11h-2V10zm4-6h2v17h-2V4z" />
                    </svg>
                    {t("stats.title")}
                  </button>
                  {cards.length > 1 && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setReorgMode(true);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <span className="text-xs text-gray-400">⇅</span> {t("collection_detail.reorganize_btn")}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPasteOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-xs text-gray-400">⎘</span> {t("collection_detail.paste_list_btn")}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setFileOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-xs text-gray-400">↑</span> {t("collection_detail.import_file_btn")}
                  </button>
                  {cards.length > 0 && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleExport();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <span className="text-xs text-gray-400">↓</span> {t("collection_detail.export_cards_btn")}
                    </button>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  {cards.length > 0 && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleDeleteAllCards();
                      }}
                      disabled={deleteAllCards.isPending}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <span className="text-xs text-red-300">✕</span> {t("collection_detail.clear_cards_btn")}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleDeleteCollection();
                    }}
                    disabled={deleteCollection.isPending}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                    <span className="text-xs text-red-300">
                      <IoTrashBinOutline />
                    </span>{" "}
                    {t("collection_detail.delete_collection_btn")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Meta row— desktop only (sm and above) */}
          {!isLoading && (
            <div>
              <div className="hidden sm:flex gap-3 ml-8 mb-2 text-sm text-gray-400">
                <div className="flex items-center flex-rows gap-1.5 justify-center">
                  <span>{t("collection_detail.card", { count: cards.length })}</span>
                  {collection?.category && (
                    <span className="border-l border-gray-200 dark:border-gray-700 pl-3">
                      {typeof collection.category === "object"
                        ? (collection.category as Category).name
                        : (collection.category as unknown as string)}
                    </span>
                  )}
                </div>
                <div className="border-l ms-3 flex flex-rows gap-1.5 justify-center items-center">
                  <button
                    onClick={() =>
                      toggleFavorite.mutate(
                        { id: collectionId, isFavorite: !collection?.isFavorite },
                        { onError: () => toast.error(t("collection_detail.toast_fav_error")) },
                      )
                    }
                    disabled={toggleFavorite.isPending}
                    title={
                      collection?.isFavorite
                        ? t("collection_detail.fav_remove_title")
                        : t("collection_detail.fav_add_title")
                    }
                    className={`border-gray-200 dark:border-gray-700 pl-3 transition-colors disabled:opacity-40 ${
                      collection?.isFavorite
                        ? "text-rose-400 hover:text-rose-300"
                        : "text-gray-300 dark:text-gray-600 hover:text-rose-400"
                    }`}>
                    ♥ {collection?.isFavorite ? t("collection_detail.fav_label") : t("collection_detail.fav_add_label")}
                  </button>
                  <button
                    onClick={() =>
                      togglePublic.mutate(
                        { id: collectionId, isPublic: !collection?.isPublic },
                        { onError: () => toast.error(t("collection_detail.toast_visibility_error")) },
                      )
                    }
                    disabled={togglePublic.isPending}
                    title={
                      collection?.isPublic
                        ? t("collection_detail.make_private_title")
                        : t("collection_detail.make_public_title")
                    }
                    className={`border-l border-gray-200 dark:border-gray-700 pl-3 transition-colors disabled:opacity-40 ${
                      collection?.isPublic
                        ? "text-green-500 hover:text-red-400"
                        : "text-gray-300 dark:text-gray-600 hover:text-green-500"
                    }`}>
                    {collection?.isPublic
                      ? `🔓 ${t("collection_detail.public_label")}`
                      : `🔒 ${t("collection_detail.private_label")}`}
                  </button>
                  {collection?.layout === "document" && (
                    <span className="border-l border-gray-200 dark:border-gray-700 pl-3 text-teal-600 dark:text-teal-400 text-sm">
                      📄 {t("collection_detail.layout_document_badge")}
                    </span>
                  )}
                </div>
                {/* Tags */}
                <div
                  className="border-l ms-3 flex border-gray-200 dark:border-gray-700 pl-3 relative"
                  ref={tagPopoverDesktopRef}>
                  <div className="flex items-center gap-2 flex-wrap ">
                    {collectionTags.length > 0 ? (
                      collectionTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 px-1.5 py-0.5 rounded-full">
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">{t("collection_detail.no_tags")}</span>
                    )}
                    <button
                      onClick={() => setEditingTags(true)}
                      title={t("collection_detail.edit_tags_title")}
                      className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                      ✏️
                    </button>
                  </div>
                  {editingTags && (
                    <div className="absolute left-0 top-6 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 min-w-[280px] max-w-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          {t("collection_detail.edit_tags_heading")}
                        </span>
                        <button
                          onClick={() => {
                            setEditingTags(false);
                            setEditedTagIds(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 text-lg leading-none">
                          ×
                        </button>
                      </div>
                      <TagSelect value={pendingTagIds} onChange={setEditedTagIds} />
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() =>
                            setCollectionTags.mutate(
                              { collectionId, tagIds: pendingTagIds },
                              {
                                onSuccess: () => {
                                  toast.success(t("collection_detail.toast_tags_updated"));
                                  setEditingTags(false);
                                },
                                onError: () => toast.error(t("collection_detail.toast_tags_error")),
                              },
                            )
                          }
                          disabled={setCollectionTags.isPending}
                          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                          {t("collection_detail.save_btn")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Actions + search + view toggle (sticky on mobile) */}
        {!isLoading && (
          //    {/* Desktop action buttons */}
          <div className="flex items-center gap-2 py-2">
            <div className="hidden sm:flex items-center gap-2 flex-wrap ml-6">
              {/* ── DESKTOP Practice──*/}
              <Link to={`/play/${id}`}>
                <Button className="rounded-lg" size="sm">
                  <PiShootingStarThin className="w-4 h-4 mr-2" /> {t("collection_detail.practice_btn")}
                </Button>
              </Link>
              {!addingCard && (
                <>
                  {/* Split button: left = Add card, right = dropdown arrow */}
                  <div className="relative hidden sm:flex" ref={addCardDropdownRef}>
                    <div className="flex rounded-lg overflow-visible">
                      <button
                        onClick={() => setAddingCard(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-l-lg border border-indigo-600">
                        {t("collection_detail.add_card_btn_short")}
                      </button>
                      <button
                        onClick={() => setAddCardDropdownOpen((v) => !v)}
                        className="inline-flex items-center px-2 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-r-lg border-l border-indigo-500">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path
                            d="M2 4l4 4 4-4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </button>
                    </div>
                    {addCardDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[160px] py-1">
                        <button
                          onClick={() => {
                            setAddCardDropdownOpen(false);
                            setPasteOpen(true);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <span className="text-gray-400">⎘</span> {t("collection_detail.paste_list_btn")}
                        </button>
                        <button
                          onClick={() => {
                            setAddCardDropdownOpen(false);
                            setFileOpen(true);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <span className="text-gray-400">↑</span> {t("collection_detail.import_file_btn")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Split button: left = Edit collection, right = dropdown */}
              <Link to={`/collections/${id}/stats`} title={t("stats.title")}>
                <Button className="rounded-lg" size="sm" variant="secondary">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mr-1.5" fill="currentColor">
                    <path d="M3 3h2v18H3V3zm4 9h2v9H7v-9zm4-5h2v14h-2V7zm4 3h2v11h-2V10zm4-6h2v17h-2V4z" />
                  </svg>
                  {t("stats.title")}
                </Button>
              </Link>{" "}
              <div className="relative flex" ref={editDropdownRef}>
                <div className="flex">
                  <button
                    onClick={() => navigate(`/collections/${id}/edit`)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-l-lg">
                    {t("collection_detail.edit_collection_btn")}
                  </button>
                  <button
                    onClick={() => setEditDropdownOpen((v) => !v)}
                    className="inline-flex items-center px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-l-0 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-r-lg">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path
                        d="M2 4l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>
                </div>
                {editDropdownOpen && !isLoading && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[170px] py-1">
                    {cards.length > 0 && (
                      <button
                        onClick={() => {
                          setEditDropdownOpen(false);
                          setReorgMode(true);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-gray-400">⇅</span> {t("collection_detail.reorganize_btn")}
                      </button>
                    )}
                    {cards.length > 0 && (
                      <button
                        onClick={() => {
                          setEditDropdownOpen(false);
                          handleExport();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-gray-400">↓</span> {t("collection_detail.export_btn")}
                      </button>
                    )}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
                    {cards.length > 0 && (
                      <button
                        onClick={() => {
                          setEditDropdownOpen(false);
                          handleDeleteAllCards();
                        }}
                        disabled={deleteAllCards.isPending}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
                        <span className="text-red-300">✕</span> {t("collection_detail.clear_cards_btn")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditDropdownOpen(false);
                        handleDeleteCollection();
                      }}
                      disabled={deleteCollection.isPending}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
                      <span className="text-red-300">
                        <IoTrashBinOutline />
                      </span>{" "}
                      {t("collection_detail.delete_btn_short")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Search — mobile only */}
            {cards.length > 4 && (
              <input
                type="search"
                placeholder="Search cards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:hidden ml-12 flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            )}
            {cards.length > 0 && (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                {/* Sort button */}
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setSortMenuOpen((v) => !v)}
                    title="Sort cards"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                      sortField
                        ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M1 3h11M3 6.5h7M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {sortField ? (
                      <span>
                        {sortField === "question" ? "Q" : sortField === "answer" ? "A" : "N"}{" "}
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    ) : (
                      <span className="hidden lg:inline">{t("collection_detail.sort_btn")}</span>
                    )}
                  </button>
                  {sortMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[160px] py-1">
                      {(["question", "answer", "note"] as const).map((field) => (
                        <button
                          key={field}
                          onClick={() => {
                            setSortField(field);
                            setSortMenuOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
                            sortField === field
                              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}>
                          <span className="capitalize">{t(`collection_detail.sort_${field}`)}</span>
                          {sortField === field && <span className="text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
                      <button
                        onClick={() => {
                          setSortDir("asc");
                          setSortMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                          sortDir === "asc"
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}>
                        {t("collection_detail.sort_asc")}
                      </button>
                      <button
                        onClick={() => {
                          setSortDir("desc");
                          setSortMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                          sortDir === "desc"
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}>
                        {t("collection_detail.sort_desc")}
                      </button>
                      {sortField && (
                        <>
                          <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
                          <button
                            onClick={() => {
                              setSortField(null);
                              setSortMenuOpen(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            {t("collection_detail.sort_clear")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Rate filter button */}
                <div className="relative" ref={rateFilterRef}>
                  <button
                    onClick={() => setRateFilterOpen((v) => !v)}
                    title="Filter by rating"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                      rateFilter !== null
                        ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <span className="text-sm leading-none">★</span>
                    {rateFilter === null && (
                      <span className="hidden lg:inline">{t("collection_detail.filter_btn")}</span>
                    )}
                    {rateFilter === 0 && <span>—</span>}
                    {rateFilter === "not5" && <span>≠5</span>}
                    {typeof rateFilter === "number" && rateFilter > 0 && <span>{rateFilter}★</span>}
                  </button>
                  {rateFilterOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[170px] py-1">
                      {([null, "not5", 0, 5, 4, 3, 2, 1] as const).map((opt, i) => (
                        <div key={String(opt)}>
                          {i === 2 && <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />}
                          {i === 3 && <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />}
                          <button
                            onClick={() => {
                              setRateFilter(opt);
                              setRateFilterOpen(false);
                            }}
                            className={`flex items-center gap-1.5 w-full px-3 py-2 text-sm transition-colors ${
                              rateFilter === opt
                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}>
                            {opt === null && t("collection_detail.filter_all")}
                            {opt === "not5" && (
                              <>
                                <span className="text-yellow-400">★★★★</span>
                                <span className="text-gray-300 dark:text-gray-600">★</span>
                                <span className="ml-1">{t("collection_detail.filter_not_mastered")}</span>
                              </>
                            )}
                            {opt === 0 && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">★★★★★</span>
                                <span className="ml-1">{t("collection_detail.filter_not_rated")}</span>
                              </>
                            )}
                            {typeof opt === "number" && opt > 0 && (
                              <>
                                <span className="text-yellow-400">{"★".repeat(opt)}</span>
                                <span className="text-gray-300 dark:text-gray-600">{"★".repeat(5 - opt)}</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* View toggle */}
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-xs">
                  <button
                    onClick={() => setViewMode("list")}
                    title="List view"
                    className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
                      viewMode === "list"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <PiListBold className="text-[18px]" />{" "}
                    <span className="hidden lg:inline">{t("collection_detail.view_list")}</span>
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    title="Compact cards view"
                    className={`px-2.5 py-1 flex items-center gap-1 transition-colors border-l border-gray-300 dark:border-gray-600 ${
                      viewMode === "compact"
                        ? "bg-indigo-600 text-white border-l-indigo-600"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <BsGrid className="text-[15px]" />
                    <span className="hidden lg:inline">{t("collection_detail.view_compact")}</span>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Cards view"
                    className={`px-2.5 py-1 flex items-center gap-1 transition-colors border-l border-gray-300 dark:border-gray-600 ${
                      viewMode === "grid"
                        ? "bg-indigo-600 text-white border-l-indigo-600"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <BsGridFill className="text-[15px]" />
                    <span className="hidden lg:inline">{t("collection_detail.view_cards")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}{" "}
        {/* Progress bar */}
        {!isLoading && cards.length > 0 && (
          <div className="mb-4">
            <CollectionProgressBar stats={collection?.stats} variant="full" />
          </div>
        )}
      </div>

      {/* Inline add form */}
      {addingCard && (
        <AddCardForm collectionId={collectionId} onDone={() => setAddingCard(false)} layout={collection?.layout} />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && !addingCard && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-4">{t("collection_detail.empty_title")}</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button size="sm" onClick={() => setAddingCard(true)}>
              {t("collection_detail.add_card_btn")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPasteOpen(true)}>
              {t("collection_detail.paste_list_btn")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setFileOpen(true)}>
              {t("collection_detail.import_file_btn")}
            </Button>
          </div>
        </div>
      )}

      {/* Cards */}
      {!isLoading && sorted.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4 gap-3 pb-36 sm:pb-0">
          {sorted.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              collectionId={collectionId}
              onView={setViewCard}
              onDelete={handleDelete}
              layout={collection?.layout}
            />
          ))}
        </div>
      )}
      {!isLoading && sorted.length > 0 && viewMode === "compact" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4 gap-3 pb-36 sm:pb-0">
          {sorted.map((card) => (
            <CardItemCompact
              key={card.id}
              card={card}
              collectionId={collectionId}
              onView={setViewCard}
              onDelete={handleDelete}
              layout={collection?.layout}
            />
          ))}
        </div>
      )}
      {!isLoading && sorted.length > 0 && viewMode === "list" && (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden pb-36 sm:pb-0">
          {sorted.map((card, idx) => (
            <CardListRow
              key={card.id}
              card={card}
              collectionId={collectionId}
              index={idx + 1}
              onView={setViewCard}
              onDelete={handleDelete}
              layout={collection?.layout}
            />
          ))}
        </div>
      )}

      {/* No search/filter results */}
      {!isLoading && cards.length > 0 && filtered.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p>
            {search && rateFilter !== null
              ? t("collection_detail.no_search_filter_results")
              : search
                ? t("collection_detail.no_search_results")
                : t("collection_detail.no_filter_results")}
          </p>
          {rateFilter !== null && (
            <button
              onClick={() => setRateFilter(null)}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-600 transition-colors">
              {t("collection_detail.filter_clear")}
            </button>
          )}
        </div>
      )}

      {/* Collection info drawer — mobile only */}

      <SideDrawer
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onOpen={() => setInfoOpen(true)}
        topValue="top-[125px]"
        tabLabel="info"
        tabIcon={<FaInfo />}
        title={collection?.name ?? `Collection #${id}`}>
        {!isLoading && (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t("collection_detail.drawer_details")}
              </p>
              <div className="flex flex-col flex-wrap gap-2">
                {collection?.category && (
                  <span className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5">
                    {" "}
                    {typeof collection.category === "object"
                      ? (collection.category as Category).name
                      : (collection.category as unknown as string)}
                  </span>
                )}{" "}
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5">
                  {t("collection_detail.card", { count: cards.length })}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    collection?.layout === "document"
                      ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  {collection?.layout === "document"
                    ? `📄 ${t("collection_detail.layout_document_badge")}`
                    : `🃏 ${t("collection_detail.layout_standard_badge")}`}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t("collection_detail.drawer_settings")}
              </p>
              <div className="flex flex-wrap gap-2 flex-col">
                <button
                  onClick={() =>
                    togglePublic.mutate(
                      { id: collectionId, isPublic: !collection?.isPublic },
                      { onError: () => toast.error(t("collection_detail.toast_visibility_error")) },
                    )
                  }
                  disabled={togglePublic.isPending}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${
                    collection?.isPublic
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600"
                  }`}>
                  {collection?.isPublic
                    ? `🔓 ${t("collection_detail.public_collection")}`
                    : `🔒 ${t("collection_detail.private_collection")}`}
                </button>
                <button
                  onClick={() =>
                    toggleFavorite.mutate(
                      { id: collectionId, isFavorite: !collection?.isFavorite },
                      { onError: () => toast.error(t("collection_detail.toast_fav_error")) },
                    )
                  }
                  disabled={toggleFavorite.isPending}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${
                    collection?.isFavorite
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600"
                  }`}>
                  {collection?.isFavorite
                    ? `♥ ${t("collection_detail.fav_label")}`
                    : `♥ ${t("collection_detail.fav_add_label")}`}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("collection_detail.drawer_tags")}
                </p>
                {!editingTags && (
                  <button
                    onClick={() => setEditingTags(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors">
                    {t("collection_detail.edit_btn")}
                  </button>
                )}
              </div>
              {!editingTags ? (
                <div className="flex flex-wrap gap-1.5">
                  {collectionTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 px-1.5 py-0.5 rounded-full">
                      {tag.name}
                    </span>
                  ))}
                  {collectionTags.length === 0 && (
                    <span className="text-xs text-gray-300 dark:text-gray-600">{t("collection_detail.no_tags")}</span>
                  )}
                </div>
              ) : (
                <div ref={tagPopoverMobileRef}>
                  <TagSelect value={pendingTagIds} onChange={setEditedTagIds} />
                  <div className="mt-3 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditingTags(false);
                        setEditedTagIds(null);
                      }}
                      className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {t("collection_detail.cancel_btn")}
                    </button>
                    <button
                      onClick={() =>
                        setCollectionTags.mutate(
                          { collectionId, tagIds: pendingTagIds },
                          {
                            onSuccess: () => {
                              toast.success(t("collection_detail.toast_tags_updated"));
                              setEditingTags(false);
                            },
                            onError: () => toast.error(t("collection_detail.toast_tags_error")),
                          },
                        )
                      }
                      disabled={setCollectionTags.isPending}
                      className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {t("collection_detail.save_btn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SideDrawer>

      {/* Modals */}
      <PasteCardsModal open={pasteOpen} onClose={() => setPasteOpen(false)} collectionId={collectionId} />
      <FileImportModal open={fileOpen} onClose={() => setFileOpen(false)} collectionId={collectionId} />

      {/* Card preview modal */}
      <Modal open={!!viewCard} onClose={() => setViewCard(null)} size="xxl">
        {viewCard && <FlashCardPreview card={viewCard} collectionId={collectionId} layout={collection?.layout} />}
      </Modal>

      {/* Practice bar — mobile only, fixed above bottom nav */}
      {!isLoading && (
        <div className="sm:hidden fixed bottom-10 left-0 right-0 z-40 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
          <Link to={`/play/${id}`} className="block">
            <Button className="w-full  rounded-none justify-center" size="md">
              <PiShootingStarThin className="w-8 h-8 mr-2" /> {t("collection_detail.practice_btn").toUpperCase()}
            </Button>
          </Link>
        </div>
      )}

      {/* FAB — mobile only */}
      {!isLoading && !addingCard && (
        <button
          onClick={() => {
            setAddingCard(true);
            document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="fixed bottom-[100px] right-2 z-50 sm:hidden w-14 h-14 rounded-full bg-indigo-600 text-white font-light shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
          </svg>
        </button>
      )}
    </div>
  );
}
