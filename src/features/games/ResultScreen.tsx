import { Button } from "@/components/Button";

export interface GameScore {
  r: number;
  w: number;
  t: number;
}

interface Props {
  score: GameScore;
  onPlayAgain: () => void;
  onRetryMistakes?: () => void;
  onBack: () => void;
}

export function ResultScreen({ score, onPlayAgain, onRetryMistakes, onBack }: Props) {
  const pct = score.t > 0 ? Math.round((score.r / score.t) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div>
        <p className="text-5xl font-bold text-gray-900 dark:text-white">{pct}%</p>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {score.r} correct · {score.w} wrong · {score.t} total
        </p>
      </div>

      {/* Score bar */}
      <div className="w-full max-w-xs h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {onRetryMistakes && score.w > 0 && (
          <Button onClick={onRetryMistakes}>
            Retry {score.w} mistake{score.w !== 1 ? "s" : ""}
          </Button>
        )}
        <Button variant="secondary" onClick={onPlayAgain}>
          Play again
        </Button>
        <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-1">
          ← Back
        </button>
      </div>
    </div>
  );
}
