import { useState } from "react";
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
          toast.success(`${selected.size} card${selected.size !== 1 ? "s" : ""} moved`);
          onClose();
        },
        onError: () => toast.error("Failed to move cards"),
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
          editCard.mutateAsync({ collectionId: card.collectionid, data: { id: card.id, question: card.answer, answer: card.question } }),
        ),
      );
      toast.success(`Swapped Q/A for ${selected.size} card${selected.size !== 1 ? "s" : ""}`);
      onClose();
    } catch {
      toast.error("Failed to swap some cards");
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

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium shrink-0">
          ← Back
        </button>
        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 rounded-lg p-1">
          <button onClick={() => setMode("move")} className={tabCls("move")}>
            Move to collection
          </button>
          <button onClick={() => setMode("swap")} className={tabCls("swap")}>
            Swap Q ⇄ A
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: card selector */}
        <div className="flex flex-col w-1/2 border-r border-gray-200 dark:border-gray-700 min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select cards ({selected.size} / {cards.length})
            </span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                All
              </button>
              <button onClick={clearAll} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                None
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Move to collection</span>
              </div>
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCollections.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                    {search ? "No collections match your search." : "No other collections."}
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
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 shrink-0">{col.cardCount} cards</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
              <div className="text-4xl">⇄</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Swap Question and Answer</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                For each selected card the question and answer texts will be swapped. This cannot be undone.
              </p>
              <Button
                onClick={handleSwap}
                loading={swapping}
                disabled={selected.size === 0}>
                Swap Q ⇄ A for {selected.size} card{selected.size !== 1 ? "s" : ""}
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
                ? `Move ${selected.size} card${selected.size !== 1 ? "s" : ""} to "${
                    otherCollections.find((c) => c.id === targetId)?.name ?? "..."
                  }"`
                : "Select cards and a destination collection"}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleMove}
                loading={moveCards.isPending}
                disabled={selected.size === 0 || targetId === null}>
                Move cards
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selected.size > 0
                ? `${selected.size} card${selected.size !== 1 ? "s" : ""} selected`
                : "Select cards to swap"}
            </p>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
