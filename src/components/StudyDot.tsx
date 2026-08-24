import { useTranslation } from "react-i18next";
import type { CollectionStats } from "@/types";

interface StudyDotProps {
  stats: CollectionStats | undefined;
  className?: string;
  /** Show a gray placeholder dot when stats are unavailable (e.g. in list rows before data loads) */
  showFallback?: boolean;
}

type StatusColor = "gray" | "orange" | "violet" | "teal" | "green";

export function getStatusColor(stats: CollectionStats | undefined): StatusColor {
  if (!stats) return "gray";
  const total = stats.toLearn + stats.inProgress + stats.learned;
  if (total === 0) return "gray";
  const pct = (stats.learned / total) * 100;
  if (pct === 0) return "gray";
  if (pct < 36) return "orange";
  if (pct < 70) return "violet";
  if (pct < 100) return "teal";
  return "green";
}

const DOT_COLOR: Record<StatusColor, string> = {
  gray: "bg-gray-300 dark:bg-gray-500",
  orange: "bg-orange-400",
  violet: "bg-violet-500",
  teal: "bg-teal-500",
  green: "bg-green-400",
};

const BORDER_COLOR: Record<StatusColor, string> = {
  gray: "border-l-gray-200 dark:border-l-gray-600",
  orange: "border-l-orange-200  dark:border-l-orange-200",
  violet: "border-l-violet-300  dark:border-l-violet-300",
  teal: "border-l-teal-300 dark:border-l-teal-300",
  green: "border-l-green-200 dark:border-l-green-200",
};

export function getAccentBorderClass(stats: CollectionStats | undefined): string {
  return BORDER_COLOR[getStatusColor(stats)];
}

function getDotConfig(stats: CollectionStats | undefined, t: ReturnType<typeof useTranslation>["t"]) {
  if (!stats) return null;
  const total = stats.toLearn + stats.inProgress + stats.learned;
  if (total === 0) return null;
  const color = DOT_COLOR[getStatusColor(stats)];
  const pct = Math.round((stats.learned / total) * 100);
  const label =
    pct === 0
      ? t("collections.dot_not_studied")
      : pct === 100
        ? t("collections.dot_fully_learned")
        : t("collections.dot_in_progress", { learned: stats.learned, total });
  return { color, label };
}

export function StudyDot({ stats, className = "", showFallback = false }: StudyDotProps) {
  const { t } = useTranslation();
  const dot =
    getDotConfig(stats, t) ??
    (showFallback ? { color: "bg-gray-200 dark:bg-gray-600", label: t("collections.dot_no_data") } : null);
  if (!dot) return null;
  return <span title={dot.label} className={`rounded-full ${dot.color} ${className}`} />;
}
