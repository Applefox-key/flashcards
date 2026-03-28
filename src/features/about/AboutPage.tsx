const ACTIVITIES = [
  { icon: "🃏", name: "Flashcards", description: "Flip through cards at your own pace" },
  { icon: "✓", name: "Multiple choice", description: "Pick the right answer from 4 options" },
  { icon: "✏️", name: "Write", description: "Type the answer from memory" },
  { icon: "⇄", name: "Match pairs", description: "Connect questions with their answers" },
  { icon: "⏱", name: "Timed", description: "Auto-advancing flashcards for quick review" },
  { icon: "🔤", name: "Word puzzle", description: "Reconstruct the answer word by word" },
];

const FEATURES = [
  "Create and organize collections by category",
  "Add images to cards (question and answer)",
  "Import cards from .txt or .xlsx files",
  "Share collections publicly with other users",
  "Copy public collections to your own library",
  "Group collections into sets for combined practice",
  "Track your memory progress with star ratings",
  "Filter practice by difficulty (star rating)",
];

// const STACK = [
//   "React 18",
//   "TypeScript",
//   "Vite",
//   "Tailwind CSS",
//   "TanStack Query",
//   "Zustand",
//   "React Router v6",
//   "Node.js",
//   "SQLite",
// ];

export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 sm:gap-10 py-2 sm:py-4">
      {/* Back link */}
      <div>
        <a href="/library" className="text-lg font-bold sm:text-sm text-indigo-600 hover:underline">
          ← Back to app
        </a>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center gap-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-600">FlashMinds</h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
          A flashcard learning app to help you memorize anything
        </p>
      </div>

      {/* What is this */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">What is FlashMinds?</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          FlashMinds is a personal flashcard learning tool. Create collections of cards on any topic, organize them into
          categories, group collections into sets (playlists), and practice with different activities designed to
          strengthen memory.
        </p>
      </div>

      {/* Activities */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Activities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACTIVITIES.map((a) => (
            <div
              key={a.name}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{a.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex gap-2">
              <span className="text-indigo-500 shrink-0">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      {/* <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map((tech) => (
            <span key={tech} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </div> */}

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center mt-8">Made with ♥ as a personal learning project</p>
    </div>
  );
}
