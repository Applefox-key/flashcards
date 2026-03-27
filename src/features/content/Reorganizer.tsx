import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { collectionsApi } from "@/api";
import { useMoveCards } from "./hooks/useContent";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Content } from "@/types";

interface Props {
  cards: Content[];
  collectionId: number;
  onClose: () => void;
}

export function Reorganizer({ cards, collectionId, onClose }: Props) {
  const toast = useToast();
  const moveCards = useMoveCards();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetId, setTargetId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
          ← Back
        </button>
        <h2 className="text-base font-semibold text-gray-900">Move cards to another collection</h2>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: card selector */}
        <div className="flex flex-col w-1/2 border-r border-gray-200 min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              Select cards ({selected.size} / {cards.length})
            </span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-indigo-600 hover:underline">
                All
              </button>
              <button onClick={clearAll} className="text-xs text-gray-500 hover:underline">
                None
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {cards.map((card) => (
              <label
                key={card.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selected.has(card.id) ? "bg-indigo-50" : ""
                }`}>
                <input
                  type="checkbox"
                  checked={selected.has(card.id)}
                  onChange={() => toggle(card.id)}
                  className="mt-0.5 shrink-0 accent-indigo-600"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{card.question}</p>
                  <p className="text-xs text-gray-500 truncate">{card.answer}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Right: collection selector */}
        <div className="flex flex-col w-1/2 min-h-0">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Move to collection</span>
          </div>
          <div className="px-4 py-2 border-b border-gray-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections..."
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredCollections.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {search ? "No collections match your search." : "No other collections."}
              </p>
            ) : (
              filteredCollections.map((col) => (
                <label
                  key={col.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    targetId === col.id ? "bg-indigo-50" : ""
                  }`}>
                  <input
                    type="radio"
                    name="target"
                    checked={targetId === col.id}
                    onChange={() => setTargetId(col.id)}
                    className="accent-indigo-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{col.name}</p>
                    {col.category && <p className="text-xs text-gray-400 truncate">{col.category.name}</p>}
                  </div>
                  {col.cardCount !== undefined && (
                    <span className="ml-auto text-xs text-gray-400 shrink-0">{col.cardCount} cards</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">
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
      </div>
    </div>
  );
}
