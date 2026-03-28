import { Link, useNavigate } from 'react-router-dom'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { useAuthStore } from '@/store/authStore'

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

export function AboutPage() {
  const { isAuthenticated, isDemo } = useAuthStore()
  const navigate = useNavigate()

  function handleDemo() {
    useAuthStore.getState().enterDemo()
    navigate('/library')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 flex flex-col gap-6 sm:gap-10 py-6 sm:py-10">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          {isAuthenticated ? (
            <Link to="/library" className="text-lg font-bold sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              ← Back to app
            </Link>
          ) : (
            <span />
          )}
          <DarkModeToggle />
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-600">FlashMinds</h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            A flashcard learning app to help you memorize anything
          </p>
          <div className="flex gap-3 mt-2">
            <Link
              to="/login"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Log in
            </Link>
            <Link
              to="/login"
              state={{ tab: "register" }}
              className="px-5 py-2 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm font-medium rounded-lg transition-colors">
              Sign up
            </Link>
          </div>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Activities</h2>
            {!isAuthenticated && !isDemo && (
              <button
                onClick={handleDemo}
                className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors px-3 py-1 rounded-full font-medium">
                ▶ Try Demo
              </button>
            )}
          </div>
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

        {/* Bottom CTA */}
        <div className="flex flex-col items-center gap-3 pt-2 pb-4">
          <Link
            to="/login"
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            Get started
          </Link>
          <p className="text-xs text-gray-400 dark:text-gray-500">Made with ♥ as a personal learning project</p>
        </div>

      </div>
    </div>
  );
}
