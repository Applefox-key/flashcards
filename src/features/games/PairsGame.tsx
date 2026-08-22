import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { shuffle } from "@/utils/gameUtils";
import { ResultScreen } from "./ResultScreen";
import { ImageThumb } from "@/components/ImageThumb";
import type { Content } from "@/types";

interface PairCell {
  cellId: string;
  cardId: number;
  text: string;
  img?: string;
  collectionId: number;
  matched: boolean;
}

interface MatchedPair {
  id: string;
  q: PairCell;
  a: PairCell;
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
      img: c.imgQ,
      collectionId: c.collectionid,
      matched: false,
    })),
  );
  const answers: PairCell[] = shuffle(
    batch.map((c) => ({
      cellId: `a-${c.id}`,
      cardId: c.id,
      text: c.answer,
      img: c.imgA,
      collectionId: c.collectionid,
      matched: false,
    })),
  );
  return { questions, answers };
}

export function PairsGame({ cards: allCards, onPlayAgain, onRetryMistakes, onBack }: Props) {
  const { t } = useTranslation();
  const [deck] = useState(() => shuffle(allCards));
  const [batchIndex, setBatchIndex] = useState(0);
  const [questions, setQuestions] = useState<PairCell[]>(() => buildColumns(deck.slice(0, BATCH_SIZE)).questions);
  const [answers, setAnswers] = useState<PairCell[]>(() => buildColumns(deck.slice(0, BATCH_SIZE)).answers);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [score, setScore] = useState({ r: 0, w: 0, t: 0 });
  const [wrongCardIds, setWrongCardIds] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [matchedPairsList, setMatchedPairsList] = useState<MatchedPair[]>([]);

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
      setMatchedPairsList([]);
    }
  }

  useEffect(() => {
    if (!allMatched) return;
    const next = batchIndex + 1;
    if (next >= totalBatches) {
      setTimeout(() => setDone(true), 800);
    } else {
      setTimeout(() => {
        setBatchIndex(next);
        loadNextBatch(next);
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  function markMatchedCells(cellId1: string, cellId2: string, qSnap: PairCell, aSnap: PairCell) {
    setQuestions((prev) =>
      prev.map((c) => (c.cellId === cellId1 || c.cellId === cellId2 ? { ...c, matched: true } : c)),
    );
    setAnswers((prev) =>
      prev.map((c) => (c.cellId === cellId1 || c.cellId === cellId2 ? { ...c, matched: true } : c)),
    );

    setTimeout(() => {
      setQuestions((prev) => prev.filter((c) => c.cellId !== cellId1 && c.cellId !== cellId2));
      setAnswers((prev) => prev.filter((c) => c.cellId !== cellId1 && c.cellId !== cellId2));
      setMatchedPairsList((prev) => [...prev, { id: `${cellId1}-${Date.now()}`, q: qSnap, a: aSnap }]);
    }, 350);
  }

  function isTextMatch(qCell: PairCell, aCell: PairCell): boolean {
    const card = deck.find((c) => c.id === qCell.cardId);
    if (!card) return false;
    return card.answer.trim() === aCell.text.trim();
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

    const firstIsQuestion = firstCell.cellId.startsWith("q-");
    const secondIsQuestion = cell.cellId.startsWith("q-");
    if (firstIsQuestion === secondIsQuestion) {
      setSelected(cell.cellId);
      return;
    }

    const qCell = firstIsQuestion ? firstCell : cell;
    const aCell = firstIsQuestion ? cell : firstCell;

    if (isTextMatch(qCell, aCell)) {
      markMatchedCells(qCell.cellId, aCell.cellId, qCell, aCell);
      setScore((s) => ({ r: s.r + 1, w: s.w, t: s.t + 1 }));
      setSelected(null);
    } else {
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
    if (cell.matched)
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-500 dark:text-green-600 cursor-default";
    if (isWrong)
      return "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 animate-pulse";
    if (isSelected)
      return "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 scale-105";
    return "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 [@media(hover:hover)]:hover:border-indigo-300 dark:[@media(hover:hover)]:hover:border-indigo-600 [@media(hover:hover)]:hover:bg-indigo-50 dark:[@media(hover:hover)]:hover:bg-indigo-900/20";
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

  const scoreBar = (
    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>{t("pairs_game.batch", { current: batchIndex + 1, total: totalBatches })}</span>
      <span>
        ✓ {score.r} &nbsp; ✗ {score.w}
      </span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-[1rem] sm:mx-auto flex flex-col flex-1 min-h-0">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pt-5 ">
        {/* Score — desktop only */}
        <div className="hidden sm:block">{scoreBar}</div>

        {/* Two-column layout: questions left, answers right */}
        <div className="grid grid-cols-2 gap-3">
          {/* Questions column */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-1">
              {t("pairs_game.col_questions")}
            </p>
            <AnimatePresence>
              {questions.map((cell) => (
                <motion.div
                  key={cell.cellId}
                  layout
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.28, ease: "easeInOut" } }}
                  transition={{ layout: { type: "spring", stiffness: 400, damping: 30 }, duration: 0.28, ease: "easeInOut" }}>
                  <button
                    onClick={() => handleClick(cell)}
                    disabled={cell.matched}
                    className={`
                      w-full rounded-xl border-2 border-t-4 border-t-indigo-500 dark:border-t-indigo-400 px-3 py-4 text-sm font-medium text-center
                      transition-all duration-200 leading-tight min-h-[60px] shadow-sm
                      ${getCellClass(cell)}
                    `}>
                    {cell.img && <ImageThumb filename={cell.img} collectionId={cell.collectionId} className="mb-1" />}
                    {cell.text}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Answers column */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-1">
              {t("pairs_game.col_answers")}
            </p>
            <AnimatePresence>
              {answers.map((cell) => (
                <motion.div
                  key={cell.cellId}
                  layout
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.28, ease: "easeInOut" } }}
                  transition={{ layout: { type: "spring", stiffness: 400, damping: 30 }, duration: 0.28, ease: "easeInOut" }}>
                  <button
                    onClick={() => handleClick(cell)}
                    disabled={cell.matched}
                    className={`
                      w-full rounded-xl border-2 border-t-4 border-t-orange-400 dark:border-t-orange-400 px-3 py-4 text-sm font-medium text-center
                      transition-all duration-200 leading-tight min-h-[60px] shadow-sm
                      ${getCellClass(cell)}
                    `}>
                    {cell.img && <ImageThumb filename={cell.img} collectionId={cell.collectionId} className="mb-1" />}
                    {cell.text}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Hint — desktop only */}
        <p className="hidden sm:block text-xs text-gray-400 text-center">{t("pairs_game.hint")}</p>

        {/* Matched pairs tray */}
        <AnimatePresence>
          {matchedPairsList.length > 0 && (
            <motion.div
              key="tray"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-gray-100 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-2">
                {t("pairs_game.matched_pairs", { count: matchedPairsList.length })}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <AnimatePresence>
                  {matchedPairsList.map((pair) => (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, scale: 0.6, y: -16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-2.5 py-1.5 text-xs text-green-700 dark:text-green-300 max-w-full">
                      <span className="font-medium truncate max-w-[120px]">{pair.q.text}</span>
                      <span className="text-green-400 dark:text-green-500 shrink-0">→</span>
                      <span className="truncate max-w-[120px]">{pair.a.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom panel — mobile only */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sm:border-t-0 sm:bg-transparent sm:dark:bg-transparent px-4 py-3 sm:px-0 sm:py-0 sm:mt-2">
        <div className="sm:hidden flex flex-col gap-1.5">
          {scoreBar}
          <p className="text-xs text-gray-400 text-center">{t("pairs_game.hint")}</p>
        </div>
      </div>
    </div>
  );
}
