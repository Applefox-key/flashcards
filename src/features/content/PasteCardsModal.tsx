import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { CardPreviewTable } from "./CardPreviewTable";
import { parseDelimited, parseBlocks, parseTwoLists, parseAlternating } from "@/utils/parseCards";
import { useBulkAddCards } from "./hooks/useContent";
import { useToast } from "@/hooks/useToast";
import type { ParsedCard } from "@/utils/parseCards";

type Mode = "delimited" | "block" | "two-lists" | "alternating";

interface Props {
  open: boolean;
  onClose: () => void;
  collectionId: number;
}

export function PasteCardsModal({ open, onClose, collectionId }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const bulkAdd = useBulkAddCards();

  const modeLabels: Record<Mode, string> = {
    delimited: t("paste_cards.mode_delimited"),
    block: t("paste_cards.mode_block"),
    "two-lists": t("paste_cards.mode_two_lists"),
    alternating: t("paste_cards.mode_alternating"),
  };

  const modeHints: Record<Mode, string> = {
    delimited: t("paste_cards.hint_delimited"),
    block: t("paste_cards.hint_block"),
    "two-lists": t("paste_cards.hint_two_lists"),
    alternating: t("paste_cards.hint_alternating"),
  };

  const [mode, setMode] = useState<Mode>("delimited");
  const [sep, setSep] = useState(";");
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [cards, setCards] = useState<ParsedCard[]>([]);
  const [parsed, setParsed] = useState(false);

  function handleParse() {
    let result: ParsedCard[] = [];
    if (mode === "delimited") result = parseDelimited(text, sep);
    else if (mode === "block") result = parseBlocks(text, sep);
    else if (mode === "two-lists") result = parseTwoLists(text, text2);
    else result = parseAlternating(text);

    if (result.length === 0) {
      toast.error(t("paste_cards.toast_no_cards"));
      return;
    }
    setCards(result);
    setParsed(true);
  }

  function handleBack() {
    setParsed(false);
    setCards([]);
  }

  function handleSave() {
    const list = cards
      .filter((c) => c.question.trim() && c.answer.trim())
      .map(({ question, answer, note }) => ({ question, answer, note: note || undefined }));

    if (list.length === 0) {
      toast.error(t("paste_cards.toast_nothing_to_save"));
      return;
    }

    bulkAdd.mutate(
      { collectionId, list },
      {
        onSuccess: () => {
          toast.success(
            list.length === 1
              ? t("paste_cards.toast_added_singular", { count: list.length })
              : t("paste_cards.toast_added_plural", { count: list.length }),
          );
          handleClose();
        },
        onError: () => toast.error(t("paste_cards.toast_error")),
      },
    );
  }

  function handleClose() {
    onClose();
    setText("");
    setText2("");
    setCards([]);
    setParsed(false);
    setMode("delimited");
    setSep(";");
  }

  return (
    <Modal open={open} onClose={handleClose} title={t("paste_cards.title")} size="xl">
      {!parsed ? (
        <div className="flex flex-col gap-4">
          {/* Mode tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {(Object.keys(modeLabels) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  mode === m
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                {modeLabels[m]}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">{modeHints[mode]}</p>

          {/* Delimiter config */}
          {(mode === "delimited" || mode === "block") && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t("paste_cards.separator_label")}</span>
              {[";", "\t", ","].map((s) => (
                <button
                  key={s}
                  onClick={() => setSep(s)}
                  className={`px-2 py-0.5 rounded text-sm border ${
                    sep === s
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  {s === "\t" ? t("paste_cards.tab_btn") : s}
                </button>
              ))}
              <input
                value={[";", "\t", ","].includes(sep) ? "" : sep}
                onChange={(e) => e.target.value && setSep(e.target.value)}
                placeholder={t("paste_cards.custom_placeholder")}
                maxLength={3}
                className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-sm
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                           focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          )}

          {/* Text inputs */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "two-lists"
                ? t("paste_cards.questions_placeholder")
                : mode === "block"
                  ? t("paste_cards.block_placeholder")
                  : t("paste_cards.paste_placeholder")
            }
            rows={mode === "two-lists" ? 6 : 10}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono resize-none
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {mode === "two-lists" && (
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder={t("paste_cards.answers_placeholder")}
              rows={6}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono resize-none
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {t("paste_cards.cancel_btn")}
            </Button>
            <Button onClick={handleParse} disabled={!text.trim()}>
              {t("paste_cards.preview_btn")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <CardPreviewTable cards={cards} onChange={setCards} />
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              {t("paste_cards.back_btn")}
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                {t("paste_cards.cancel_btn")}
              </Button>
              <Button onClick={handleSave} loading={bulkAdd.isPending} disabled={cards.length === 0}>
                {cards.length === 1
                  ? t("paste_cards.save_btn_singular", { count: cards.length })
                  : t("paste_cards.save_btn_plural", { count: cards.length })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
