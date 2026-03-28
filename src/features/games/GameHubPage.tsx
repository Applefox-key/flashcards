import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useGameCards } from "./useGameCards";

const ACTIVITIES = [
  {
    type: "flashcard",
    label: "Flashcards",
    description: "Flip through cards at your own pace. Rate how well you know each one.",
    icon: "🃏",
    minCards: 1,
    color: "indigo",
  },
  {
    type: "test",
    label: "Multiple choice",
    description: "Pick the correct answer from 4 options. Harder cards appear more often.",
    icon: "✓",
    minCards: 4,
    color: "green",
  },
  {
    type: "write",
    label: "Write the answer",
    description: "Type the answer from memory. Use the hint button if you get stuck.",
    icon: "✏️",
    minCards: 1,
    color: "blue",
  },
  {
    type: "pairs",
    label: "Match pairs",
    description: "Find matching question and answer cards. Works in batches of 6.",
    icon: "⇄",
    minCards: 2,
    color: "purple",
  },
  {
    type: "timed",
    label: "Timed cards",
    description: "Flashcards that auto-advance. Great for quick review.",
    icon: "⏱",
    minCards: 1,
    color: "amber",
  },
  {
    type: "parts",
    label: "Word puzzle",
    description: "Reconstruct the answer by tapping words in the correct order.",
    icon: "🔤",
    minCards: 1,
    color: "coral",
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-700", icon: "text-indigo-500 dark:text-indigo-400", text: "text-indigo-700 dark:text-indigo-400" },
  green:  { bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-200 dark:border-green-700",   icon: "text-green-500 dark:text-green-400",   text: "text-green-700 dark:text-green-400"   },
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-700",     icon: "text-blue-500 dark:text-blue-400",     text: "text-blue-700 dark:text-blue-400"     },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-700", icon: "text-purple-500 dark:text-purple-400", text: "text-purple-700 dark:text-purple-400" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/20",   border: "border-amber-200 dark:border-amber-700",   icon: "text-amber-500 dark:text-amber-400",   text: "text-amber-700 dark:text-amber-400"   },
  coral:  { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-700", icon: "text-orange-500 dark:text-orange-400", text: "text-orange-700 dark:text-orange-400" },
};

export function GameHubPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPlaylist = searchParams.get("src") === "pl";
  const { cards, title, isLoading, isError } = useGameCards();

  function handleSelect(type: string) {
    const base = `/play/${type}/${id}`;
    navigate(isPlaylist ? `${base}?src=pl` : base);
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-red-500">
        <p>Failed to load.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-2 underline">
          Go back
        </button>
      </div>
    );
  }

  if (!isLoading && cards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No cards in this collection.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-500 hover:text-indigo-700 mt-2 underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
          </svg>
        </button>
        {isLoading ? (
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title || `Set #${id}`}</h1>
        )}
        {!isLoading && <span className="text-xs text-gray-400 ml-1">{cards.length} cards</span>}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 ml-8 mb-6">Choose an activity</p>

      {/* Activity grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 animate-pulse h-24" />
            ))
          : ACTIVITIES.map((activity) => {
              const enough = cards.length >= activity.minCards;
              const c = COLOR_MAP[activity.color];
              return (
                <div
                  key={activity.type}
                  onClick={() => enough && handleSelect(activity.type)}
                  className={`rounded-xl border-2 p-4 transition-shadow ${
                    enough
                      ? `${c.bg} ${c.border} cursor-pointer hover:shadow-sm`
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                  }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className={`font-semibold text-sm ${enough ? c.text : "text-gray-600 dark:text-gray-400"}`}>
                        {activity.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{activity.description}</span>
                      {!enough && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Needs at least {activity.minCards} cards</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
