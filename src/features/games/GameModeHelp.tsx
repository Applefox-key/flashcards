import { useState } from "react";
import { useTranslation } from "react-i18next";
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

interface Props {
  type: string;
}

export function GameModeHelp({ type }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const dirQA = t("game_page.direction_q_to_a");
  const dirAQ = t("game_page.direction_a_to_q");
  const oneShot = t("game_page.one_shot");
  const endless = t("game_page.endless");
  const endlessSkip = t("game_page.endless_skip");

  const GAME_HELP: Record<string, GameHelpContent> = {
    flashcard: {
      modes: [
        { name: dirQA, description: t("game_mode_help.flashcard_q_to_a") },
        { name: dirAQ, description: t("game_mode_help.flashcard_a_to_q") },
        { name: t("game_mode_help.shuffle_name"), description: t("game_mode_help.shuffle_desc") },
      ],
    },
    timed: {
      modes: [
        { name: dirQA, description: t("game_mode_help.timed_q_to_a") },
        { name: dirAQ, description: t("game_mode_help.timed_a_to_q") },
        { name: t("game_mode_help.delay_name"), description: t("game_mode_help.delay_desc") },
      ],
    },
    pairs: {
      modes: [{ name: t("game_mode_help.match_name"), description: t("game_mode_help.match_desc") }],
    },
    test: {
      modes: [
        { name: dirQA, description: t("game_mode_help.test_q_to_a") },
        { name: dirAQ, description: t("game_mode_help.test_a_to_q") },
        { name: oneShot, description: t("game_mode_help.oneshot_desc") },
        { name: endless, description: t("game_mode_help.endless_desc") },
        { name: endlessSkip, description: t("game_mode_help.endless_skip_desc") },
      ],
    },
    write: {
      modes: [
        { name: dirQA, description: t("game_mode_help.write_q_to_a") },
        { name: dirAQ, description: t("game_mode_help.write_a_to_q") },
        { name: oneShot, description: t("game_mode_help.oneshot_desc") },
        { name: endless, description: t("game_mode_help.endless_desc") },
        { name: endlessSkip, description: t("game_mode_help.endless_skip_desc") },
      ],
    },
    parts: {
      intro: t("game_mode_help.parts_intro"),
      modes: [
        { name: oneShot, description: t("game_mode_help.oneshot_desc") },
        { name: endless, description: t("game_mode_help.endless_desc") },
        { name: endlessSkip, description: t("game_mode_help.endless_skip_desc") },
      ],
    },
  };

  const help = GAME_HELP[type];
  if (!help) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t("game_mode_help.button_title")}
        className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
        <FiHelpCircle className="text-xl " />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("game_mode_help.modal_title")} size="md">
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
