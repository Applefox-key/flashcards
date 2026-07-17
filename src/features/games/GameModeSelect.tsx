import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface ModeOption<T extends string> {
  value: T;
  labelKey: string;
  descKey: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ModeOption<T>[];
  prefixKey: string;
  inline?: boolean;
}

export function GameModeSelect<T extends string>({ value, onChange, options, prefixKey, inline }: Props<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const optionList = options.map((opt) => (
    <button
      key={opt.value}
      onClick={() => { onChange(opt.value); if (!inline) setOpen(false); }}
      className={`w-full text-left px-3 py-2.5 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
        opt.value === value
          ? "bg-indigo-50/60 dark:bg-indigo-900/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-700/60"
      }`}>
      <p className={`text-xs font-semibold ${
        opt.value === value ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200"
      }`}>
        {t(opt.labelKey)}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
        {t(opt.descKey)}
      </p>
    </button>
  ));

  if (inline) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {optionList}
      </div>
    );
  }

  const current = options.find((o) => o.value === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs border rounded px-2.5 py-1 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 transition-colors">
        <span className="text-indigo-400 dark:text-indigo-500 font-normal">
          {t(prefixKey)}:
        </span>
        {t(current.labelKey)}
        <svg
          viewBox="0 0 16 16"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          {optionList}
        </div>
      )}
    </div>
  );
}

export const PRACTICE_MODE_OPTIONS = [
  { value: "oneshot" as const, labelKey: "game_page.one_shot", descKey: "game_mode_help.oneshot_desc" },
  { value: "endless" as const, labelKey: "game_page.endless", descKey: "game_mode_help.endless_desc" },
  { value: "endless-skip" as const, labelKey: "game_page.endless_skip", descKey: "game_mode_help.endless_skip_desc" },
];

export const FLASHCARD_MODE_OPTIONS = [
  { value: "normal" as const, labelKey: "flashcard_game.mode_normal", descKey: "flashcard_game.mode_normal_desc" },
  { value: "mastery" as const, labelKey: "flashcard_game.mode_mastery", descKey: "flashcard_game.mode_mastery_desc" },
];
