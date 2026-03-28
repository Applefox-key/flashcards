import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { CardPreviewTable } from "./CardPreviewTable";
import { parseDelimited, parseTwoLists, parseAlternating } from "@/utils/parseCards";
import { useBulkAddCards } from "./hooks/useContent";
import { useToast } from "@/hooks/useToast";
import type { ParsedCard } from "@/utils/parseCards";

type Mode = "delimited" | "two-lists" | "alternating";

const MODE_LABELS: Record<Mode, string> = {
  delimited: "Delimiter",
  "two-lists": "Two lists",
  alternating: "Alternating lines",
};

const MODE_HINTS: Record<Mode, string> = {
  delimited: "Each line: question ; answer ; note (optional)",
  "two-lists": "Questions in first box, answers in second box — matched by line",
  alternating: "Line 1 = question, line 2 = answer, repeat",
};

interface Props {
  open: boolean;
  onClose: () => void;
  collectionId: number;
}

export function PasteCardsModal({ open, onClose, collectionId }: Props) {
  const toast = useToast();
  const bulkAdd = useBulkAddCards();

  const [mode, setMode] = useState<Mode>("delimited");
  const [sep, setSep] = useState(";");
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [cards, setCards] = useState<ParsedCard[]>([]);
  const [parsed, setParsed] = useState(false);

  function handleParse() {
    let result: ParsedCard[] = [];
    if (mode === "delimited") result = parseDelimited(text, sep);
    else if (mode === "two-lists") result = parseTwoLists(text, text2);
    else result = parseAlternating(text);

    if (result.length === 0) {
      toast.error("No valid cards found. Check your format.");
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
      toast.error("No valid cards to save.");
      return;
    }

    bulkAdd.mutate(
      { collectionId, list },
      {
        onSuccess: () => {
          toast.success(`${list.length} card${list.length !== 1 ? "s" : ""} added`);
          handleClose();
        },
        onError: () => toast.error("Failed to add cards"),
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
    <Modal open={open} onClose={handleClose} title="Paste cards" size="xl">
      {!parsed ? (
        <div className="flex flex-col gap-4">
          {/* Mode tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  mode === m
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">{MODE_HINTS[mode]}</p>

          {/* Delimiter config */}
          {mode === "delimited" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Separator:</span>
              {[";", "\t", ","].map((s) => (
                <button
                  key={s}
                  onClick={() => setSep(s)}
                  className={`px-2 py-0.5 rounded text-sm border ${
                    sep === s
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  {s === "\t" ? "Tab" : s}
                </button>
              ))}
              <input
                value={[";", "\t", ","].includes(sep) ? "" : sep}
                onChange={(e) => e.target.value && setSep(e.target.value)}
                placeholder="custom"
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
            placeholder={mode === "two-lists" ? "Questions (one per line)..." : "Paste your content here..."}
            rows={mode === "two-lists" ? 6 : 10}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono resize-none
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {mode === "two-lists" && (
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="Answers (one per line)..."
              rows={6}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono resize-none
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleParse} disabled={!text.trim()}>
              Preview →
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
              ← Back to edit
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={bulkAdd.isPending} disabled={cards.length === 0}>
                Save {cards.length} card{cards.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
