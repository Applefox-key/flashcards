import type { ParsedCard } from "@/utils/parseCards";

interface Props {
  cards: ParsedCard[];
  onChange: (cards: ParsedCard[]) => void;
}

export function CardPreviewTable({ cards, onChange }: Props) {
  function update(id: string, field: keyof ParsedCard, value: string) {
    onChange(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function remove(id: string) {
    onChange(cards.filter((c) => c.id !== id));
  }

  if (cards.length === 0) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-0 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-3 py-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Question</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Answer</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Note</span>
        <span />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
        {cards.map((card) => (
          <div key={card.id} className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-1 px-3 py-1.5 items-center bg-white dark:bg-gray-800">
            <input
              value={card.question}
              onChange={(e) => update(card.id, "question", e.target.value)}
              className="text-sm border border-transparent rounded px-1 py-0.5 focus:border-indigo-300 dark:focus:border-indigo-500 focus:outline-none w-full bg-transparent text-gray-900 dark:text-gray-100"
            />
            <input
              value={card.answer}
              onChange={(e) => update(card.id, "answer", e.target.value)}
              className="text-sm border border-transparent rounded px-1 py-0.5 focus:border-indigo-300 dark:focus:border-indigo-500 focus:outline-none w-full bg-transparent text-gray-900 dark:text-gray-100"
            />
            <input
              value={card.note}
              onChange={(e) => update(card.id, "note", e.target.value)}
              placeholder="optional"
              className="text-sm border border-transparent rounded px-1 py-0.5 focus:border-indigo-300 dark:focus:border-indigo-500 focus:outline-none w-full bg-transparent text-gray-400 dark:text-gray-500"
            />
            <button
              onClick={() => remove(card.id)}
              className="text-gray-300 hover:text-red-500 text-lg leading-none text-center"
              title="Remove">
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500">
        {cards.length} card{cards.length !== 1 ? "s" : ""} — click any cell to edit
      </div>
    </div>
  );
}
