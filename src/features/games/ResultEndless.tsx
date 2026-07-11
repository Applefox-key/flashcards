import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import type { Content } from "@/types";
import { useState } from "react";

interface Props {
  playableCards: Content[];
  probs: Record<number, number>;
  onResetCard?: (cardId: number) => void;
}

export function ResultEndless({ playableCards, probs, onResetCard }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="ml-auto text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
        {t('result_screen.results_btn')}
      </button>
      {show && (
        <Modal open={show} onClose={() => setShow(false)} title={t('result_screen.modal_title')} size="md">
          <div>
            <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
              {playableCards.map((c) => {
                const prob = Math.round(Math.max(0, (10 - (probs[c.id] ?? 10)) / (10 - 1)) * 100);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 py-2 px-1 ${prob > 50 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                    <span className="flex-1 text-sm truncate">{c.question}</span>
                    <span className="text-sm font-medium shrink-0 w-10 text-right">{prob}%</span>
                    {onResetCard && (
                      <button
                        onClick={() => onResetCard(c.id)}
                        title={t('result_screen.reset_rating')}
                        className="shrink-0 text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-red-300 hover:text-red-400 dark:hover:border-red-700 dark:hover:text-red-400 transition-colors">
                        ↺
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShow(false)}>
                {t('result_screen.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
