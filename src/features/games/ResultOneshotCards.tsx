import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import type { Content } from "@/types";

export type RowVariant = "green" | "teal" | "orange" | "red";

export interface OneshotRow {
  cardId: number;
  label: string;
  variant: RowVariant;
}

interface Props {
  cards: Content[];
  rows: OneshotRow[];
}

const BG: Record<RowVariant, string> = {
  green:  "bg-green-50  dark:bg-green-900/20",
  teal:   "bg-teal-50   dark:bg-teal-900/20",
  orange: "bg-orange-50 dark:bg-orange-900/20",
  red:    "bg-red-50    dark:bg-red-900/20",
};

const TEXT: Record<RowVariant, string> = {
  green:  "text-green-600  dark:text-green-400",
  teal:   "text-teal-600   dark:text-teal-400",
  orange: "text-orange-600 dark:text-orange-400",
  red:    "text-red-600    dark:text-red-400",
};

export function ResultOneshotCards({ cards, rows }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]));

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {t("result_screen.results_btn")}
      </button>

      {show && (
        <Modal open={show} onClose={() => setShow(false)} title={t("result_screen.modal_title")} size="md">
          <div className="flex flex-col gap-1 max-h-96 overflow-y-auto mb-4">
            {rows.map((row) => {
              const card = cardMap[row.cardId];
              if (!card) return null;
              return (
                <div
                  key={row.cardId}
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg ${BG[row.variant]}`}>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{card.question}</span>
                  <span className={`text-xs font-semibold shrink-0 ${TEXT[row.variant]}`}>
                    {row.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShow(false)}>
              {t("result_screen.close")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
