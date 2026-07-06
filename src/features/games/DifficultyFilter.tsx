interface Props {
  selected: number[];
  onChange: (val: number[]) => void;
}

const STARS = ["★", "★★", "★★★", "★★★★"];

export function DifficultyFilter({ selected, onChange }: Props) {
  function toggle(val: number) {
    if (selected.includes(val)) {
      const next = selected.filter((v) => v !== val);
      onChange(next);
    } else {
      onChange([...selected, val]);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-gray-400 mr-1">Filter:</span>
      <button
        onClick={() => onChange([])}
        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
          selected.length === 0
            ? "bg-indigo-100 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400"
            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
        }`}>
        All
      </button>
      {STARS.map((stars, i) => (
        <button
          key={i}
          onClick={() => toggle(i + 1)}
          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
            selected.includes(i + 1)
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"
              : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}>
          {stars}
        </button>
      ))}
    </div>
  );
}
