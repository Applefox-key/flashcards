import { useState, useEffect } from "react";
import { shuffle, normalizeText } from "@/utils/gameUtils";
import { ResultScreen } from "./ResultScreen";
import type { Content } from "@/types";

interface PairCell {
  cellId: string;
  cardId: number;
  text: string;
  matched: boolean;
}

interface Props {
  cards: Content[];
  onPlayAgain: () => void;
  onRetryMistakes?: (wrongIds: Set<number>) => void;
  onBack: () => void;
}

const BATCH_SIZE = 6;

function buildColumns(batch: Content[]): { questions: PairCell[]; answers: PairCell[] } {
  const questions: PairCell[] = shuffle(
    batch.map((c) => ({
      cellId: `q-${c.id}`,
      cardId: c.id,
      text: c.question,
      matched: false,
    })),
  );
  const answers: PairCell[] = shuffle(
    batch.map((c) => ({
      cellId: `a-${c.id}`,
      cardId: c.id,
      text: c.answer,
      matched: false,
    })),
  );
  return { questions, answers };
}

export function PairsGame({ cards: allCards, onPlayAgain, onRetryMistakes, onBack }: Props) {
  const [deck] = useState(() => shuffle(allCards));
  const [batchIndex, setBatchIndex] = useState(0);
  const [questions, setQuestions] = useState<PairCell[]>(() => buildColumns(deck.slice(0, BATCH_SIZE)).questions);
  const [answers, setAnswers] = useState<PairCell[]>(() => buildColumns(deck.slice(0, BATCH_SIZE)).answers);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 });
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const totalBatches = Math.ceil(deck.length / BATCH_SIZE);
  const allCells = [...questions, ...answers];
  const allMatched = allCells.length > 0 && allCells.every((c) => c.matched);

  function loadNextBatch(nextBatchIdx: number) {
    const start = nextBatchIdx * BATCH_SIZE;
    const batch = deck.slice(start, start + BATCH_SIZE);
    if (batch.length === 0) {
      setDone(true);
    } else {
      const { questions: q, answers: a } = buildColumns(batch);
      setQuestions(q);
      setAnswers(a);
      setSelected(null);
    }
  }

  // Check if current batch is complete
  useEffect(() => {
    if (!allMatched) return;
    const next = batchIndex + 1;
    if (next >= totalBatches) {
      setDone(true);
    } else {
      setTimeout(() => {
        setBatchIndex(next);
        loadNextBatch(next);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  function markMatchedCells(cellId1: string, cellId2: string) {
    setQuestions((prev) => prev.map((c) => (c.cellId === cellId1 || c.cellId === cellId2 ? { ...c, matched: true } : c)));
    setAnswers((prev) => prev.map((c) => (c.cellId === cellId1 || c.cellId === cellId2 ? { ...c, matched: true } : c)));
  }

  function isTextMatch(qCell: PairCell, aCell: PairCell): boolean {
    // Find the card for the question cell to get its expected answer text
    const card = deck.find((c) => c.id === qCell.cardId);
    if (!card) return false;
    return normalizeText(card.answer) === normalizeText(aCell.text);
  }

  function handleClick(cell: PairCell) {
    if (cell.matched || wrongPair) return;

    if (selected === null) {
      setSelected(cell.cellId);
      return;
    }

    if (selected === cell.cellId) {
      setSelected(null);
      return;
    }

    const firstCell = allCells.find((c) => c.cellId === selected)!;

    // Prevent selecting two questions or two answers
    const firstIsQuestion = firstCell.cellId.startsWith("q-");
    const secondIsQuestion = cell.cellId.startsWith("q-");
    if (firstIsQuestion === secondIsQuestion) {
      setSelected(cell.cellId);
      return;
    }

    const qCell = firstIsQuestion ? firstCell : cell;
    const aCell = firstIsQuestion ? cell : firstCell;

    if (isTextMatch(qCell, aCell)) {
      // Match!
      markMatchedCells(qCell.cellId, aCell.cellId);
      setScore((s) => ({ r: s.r + 1, w: s.w, t: s.t + 1 }));
      setSelected(null);
    } else {
      // Wrong
      setWrongPair([selected, cell.cellId]);
      setWrongCardIds((prev) => new Set([...prev, qCell.cardId]));
      setScore((s) => ({ r: s.r, w: s.w + 1, t: s.t + 1 }));
      setTimeout(() => {
        setWrongPair(null);
        setSelected(null);
      }, 700);
    }
  }

  function getCellClass(cell: PairCell): string {
    const isSelected = selected === cell.cellId;
    const isWrong = wrongPair?.includes(cell.cellId);
    if (cell.matched) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-500 dark:text-green-600 opacity-40 cursor-default";
    if (isWrong) return "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 animate-pulse";
    if (isSelected) return "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 scale-105";
    return "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20";
  }

  if (done) {
    return (
      <ResultScreen
        score={score}
        onPlayAgain={onPlayAgain}
        onRetryMistakes={onRetryMistakes && wrongCardIds.size > 0 ? () => onRetryMistakes(wrongCardIds) : undefined}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      {/* Score */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          Batch {batchIndex + 1} / {totalBatches}
        </span>
        <span>
          ✓ {score.r} &nbsp; ✗ {score.w}
        </span>
      </div>

      {/* Two-column layout: questions left, answers right */}
      <div className="grid grid-cols-2 gap-3">
        {/* Questions column */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-1">Questions</p>
          {questions.map((cell) => (
            <button
              key={cell.cellId}
              onClick={() => handleClick(cell)}
              disabled={cell.matched}
              className={`
                rounded-xl border-2 px-3 py-4 text-sm font-medium text-center
                transition-all duration-200 leading-tight min-h-[60px]
                ${getCellClass(cell)}
              `}>
              {cell.text}
            </button>
          ))}
        </div>

        {/* Answers column */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-1">Answers</p>
          {answers.map((cell) => (
            <button
              key={cell.cellId}
              onClick={() => handleClick(cell)}
              disabled={cell.matched}
              className={`
                rounded-xl border-2 px-3 py-4 text-sm font-medium text-center
                transition-all duration-200 leading-tight min-h-[60px]
                ${getCellClass(cell)}
              `}>
              {cell.text}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Select a question on the left, then its matching answer on the right
      </p>
    </div>
  );
}
