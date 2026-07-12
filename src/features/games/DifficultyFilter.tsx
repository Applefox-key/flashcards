import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export type RateFilter = null | 0 | 1 | 2 | 3 | 4 | 5 | "not5";

interface Props {
  value: RateFilter;
  onChange: (val: RateFilter) => void;
}

const OPTIONS = [null, "not5", 0, 5, 4, 3, 2, 1] as const;

export function DifficultyFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={t("difficulty_filter.label")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
          value !== null
            ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
        }`}>
        <span className="text-sm leading-none">★</span>
        {value === null && <span className="hidden sm:inline">{t("difficulty_filter.label")}</span>}
        {value === 0 && <span>—</span>}
        {value === "not5" && <span>≠5★</span>}
        {typeof value === "number" && value > 0 && <span>{value}★</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[180px] py-1">
          {OPTIONS.map((opt, i) => (
            <div key={String(opt)}>
              {i === 2 && <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />}
              {i === 3 && <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />}
              <button
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex items-center gap-1.5 w-full px-3 py-2 text-sm transition-colors ${
                  value === opt
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                {opt === null && t("collection_detail.filter_all")}
                {opt === "not5" && (
                  <>
                    <span className="text-yellow-400">★★★★</span>
                    <span className="text-gray-300 dark:text-gray-600">★</span>
                    <span className="ml-1">{t("collection_detail.filter_not_mastered")}</span>
                  </>
                )}
                {opt === 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">★★★★★</span>
                    <span className="ml-1">{t("collection_detail.filter_not_rated")}</span>
                  </>
                )}
                {typeof opt === "number" && opt > 0 && (
                  <>
                    <span className="text-yellow-400">{"★".repeat(opt)}</span>
                    <span className="text-gray-300 dark:text-gray-600">{"★".repeat(5 - opt)}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
