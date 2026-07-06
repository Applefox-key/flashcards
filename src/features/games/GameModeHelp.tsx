import { useState } from "react";
import { FiHelpCircle } from "react-icons/fi";
import { Modal } from "@/components/Modal";

interface ModeInfo {
  name: string;
  description: string;
}

interface GameHelpContent {
  intro?: string;
  modes: ModeInfo[];
}

const GAME_HELP: Record<string, GameHelpContent> = {
  flashcard: {
    modes: [
      { name: "Q → A", description: "See the question first, then flip to reveal the answer." },
      { name: "A → Q", description: "See the answer first and try to recall the question." },
      { name: "Shuffle", description: "Cards are presented in a randomised order each session." },
    ],
  },
  timed: {
    modes: [
      { name: "Q → A", description: "See the question first, then the answer is revealed automatically." },
      { name: "A → Q", description: "See the answer first and recall the question before it is revealed." },
      {
        name: "Delay",
        description: "Controls how long the answer stays visible before the next card appears (0.5 – 5 seconds).",
      },
    ],
  },
  pairs: {
    modes: [
      {
        name: "Match",
        description: "Flip tiles to find matching question-answer pairs. Clear the board to finish.",
      },
    ],
  },
  test: {
    modes: [
      { name: "Q → A", description: "Choose the correct answer from four options given a question." },
      { name: "A → Q", description: "Choose the correct question from four options given an answer." },
      { name: "One Shot", description: "Every card appears exactly once. Harder cards (based on your history) come first." },
      { name: "Endless", description: "Cards repeat without limit. Cards you struggle with appear more often; cards you know well appear less often." },
      { name: "Endless ✓", description: "Same as Endless, but cards you have fully mastered (100%) are removed from the pool. The session ends automatically once all remaining cards reach 100%." },
    ],
  },
  write: {
    modes: [
      { name: "Q → A", description: "Type the answer from memory when shown a question." },
      { name: "A → Q", description: "Type the question from memory when shown an answer." },
      { name: "One Shot", description: "Every card appears exactly once. Harder cards (based on your history) come first." },
      { name: "Endless", description: "Cards repeat without limit. Cards you struggle with appear more often; cards you know well appear less often." },
      { name: "Endless ✓", description: "Same as Endless, but cards you have fully mastered (100%) are removed from the pool. The session ends automatically once all remaining cards reach 100%." },
    ],
  },
  parts: {
    intro: "Assemble the correct answer by tapping word parts in order.",
    modes: [
      {
        name: "One Shot",
        description:
          "Every card appears exactly once. Harder cards (based on your history) come first.",
      },
      {
        name: "Endless",
        description:
          "Cards repeat without limit. Cards you struggle with appear more often; cards you know well appear less often.",
      },
      {
        name: "Endless ✓",
        description:
          "Same as Endless, but cards you have fully mastered (100%) are removed from the pool. The session ends automatically once all remaining cards reach 100%.",
      },
    ],
  },
};

interface Props {
  type: string;
}

export function GameModeHelp({ type }: Props) {
  const [open, setOpen] = useState(false);
  const help = GAME_HELP[type];

  if (!help) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="How modes work"
        className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
        <FiHelpCircle size={15} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Game Modes" size="md">
        <div className="flex flex-col gap-1">
          {help.intro && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{help.intro}</p>}
          {help.modes.map((m) => (
            <div
              key={m.name}
              className="flex flex-col gap-0.5 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{m.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{m.description}</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
