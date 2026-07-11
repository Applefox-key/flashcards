import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { collectionsApi } from "@/api";
import { useMoveCards, useEditCard } from "./hooks/useContent";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Content } from "@/types";

type Mode = "move" | "swap";

interface Props {
  cards: Content[];
  collectionId: number;
  onClose: () => void;
}

export function Reorganizer({ cards, collectionId, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const moveCards = useMoveCards();
  const editCard = useEditCard();

  const [mode, setMode] = useState<Mode>("move");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetId, setTargetId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [swapping, setSwapping] = useState(false);

  const { data: allCollections = [] } = useQuery({
    queryKey: ["collections"],
    queryFn: collectionsApi.getAll,
  });

  const otherCollections = allCollections.filter((c) => c.id !== collectionId);
  const filteredCollections = otherCollections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(cards.map((c) => c.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleMove() {
    if (selected.size === 0 || targetId === null) return;
    moveCards.mutate(
      {
        data: { contentIds: Array.from(selected), newCollectionId: targetId },
        sourceCollectionId: collectionId,
      },
      {
        onSuccess: () => {
          toast.success(
            selected.size === 1
              ? t("reorganize.toast_moved_singular", { count: selected.size })
              : t("reorganize.toast_moved_plural", { count: selected.size }),
          );
          onClose();
        },
        onError: () => toast.error(t("reorganize.toast_move_error")),
      },
    );
  }

  async function handleSwap() {
    if (selected.size === 0) return;
    setSwapping(true);
    const selectedCards = cards.filter((c) => selected.has(c.id));
    try {
      await Promise.all(
        selectedCards.map((card) =>
          editCard.mutateAsync({ collectionId: card.collectionid, data: { id: card.id, question: card.answer, answer: card.question, imgQ: card.imgQ, imgA: card.imgA } }),
        ),
      );
      toast.success(
        selected.size === 1
          ? t("reorganize.toast_swapped_singular", { count: selected.size })
          : t("reorganize.toast_swapped_plural", { count: selected.size }),
      );
      onClose();
    } catch {
      toast.error(t("reorganize.toast_swap_error"));
    } finally {
      setSwapping(false);
    }
  }

  const tabCls = (m: Mode) =>
    `text-sm font-medium px-3 py-1.5 rounded transition-colors cursor-pointer ${
      mode === m
        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    }`;

  const targetName = otherCollections.find((c) => c.id === targetId)?.name ?? "...";

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium shrink-0">
          {t("reorganize.back_btn")}
        </button>
        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 rounded-lg p-1">
          <button onClick={() => setMode("move")} className={tabCls("move")}>
            {t("reorganize.tab_move")}
          </button>
          <button onClick={() => setMode("swap")} className={tabCls("swap")}>
            {t("reorganize.tab_swap")}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: card selector */}
        <div className="flex flex-col w-1/2 border-r border-gray-200 dark:border-gray-700 min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("reorganize.select_cards", { selected: selected.size, total: cards.length })}
            </span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                {t("reorganize.select_all")}
              </button>
              <button onClick={clearAll} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                {t("reorganize.select_none")}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {cards.map((card) => (
              <label
                key={card.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  selected.has(card.id)
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                }`}>
                <input
                  type="checkbox"
                  checked={selected.has(card.id)}
                  onChange={() => toggle(card.id)}
                  className="mt-0.5 shrink-0 accent-indigo-600"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{card.question}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.answer}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col w-1/2 min-h-0">
          {mode === "move" ? (
            <>
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("reorganize.move_panel_title")}
                </span>
              </div>
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("reorganize.search_placeholder")}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCollections.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                    {search ? t("reorganize.no_match") : t("reorganize.no_collections")}
                  </p>
                ) : (
                  filteredCollections.map((col) => (
                    <label
                      key={col.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        targetId === col.id
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}>
                      <input
                        type="radio"
                        name="target"
                        checked={targetId === col.id}
                        onChange={() => setTargetId(col.id)}
                        className="accent-indigo-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{col.name}</p>
                        {col.category && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{col.category.name}</p>
                        )}
                      </div>
                      {col.cardCount !== undefined && (
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          {t("collections.card_count", { count: col.cardCount })}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
              <div className="text-4xl">⇄</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("reorganize.swap_title")}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">{t("reorganize.swap_desc")}</p>
              <Button onClick={handleSwap} loading={swapping} disabled={selected.size === 0}>
                {selected.size === 1
                  ? t("reorganize.swap_btn_singular", { count: selected.size })
                  : t("reorganize.swap_btn_plural", { count: selected.size })}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {mode === "move" ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selected.size > 0 && targetId
                ? selected.size === 1
                  ? t("reorganize.move_hint_singular", { count: selected.size, name: targetName })
                  : t("reorganize.move_hint_plural", { count: selected.size, name: targetName })
                : t("reorganize.move_hint_select")}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                {t("reorganize.cancel_btn")}
              </Button>
              <Button
                onClick={handleMove}
                loading={moveCards.isPending}
                disabled={selected.size === 0 || targetId === null}>
                {t("reorganize.move_btn")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selected.size > 0
                ? selected.size === 1
                  ? t("reorganize.swap_selected_singular", { count: selected.size })
                  : t("reorganize.swap_selected_plural", { count: selected.size })
                : t("reorganize.swap_hint_select")}
            </p>
            <Button variant="secondary" onClick={onClose}>
              {t("reorganize.cancel_btn")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
