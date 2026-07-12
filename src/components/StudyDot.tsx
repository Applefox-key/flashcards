import { useTranslation } from "react-i18next";
import type { CollectionStats } from "@/types";

interface StudyDotProps {
  stats: CollectionStats | undefined;
  className?: string;
  /** Show a gray placeholder dot when stats are unavailable (e.g. in list rows before data loads) */
  showFallback?: boolean;
}

function getDotConfig(stats: CollectionStats | undefined, t: ReturnType<typeof useTranslation>["t"]) {
  if (!stats) return null;
  const total = stats.toLearn + stats.inProgress + stats.learned;
  if (total === 0) return null;
  if (stats.learned === total)
    return { color: "bg-green-400", label: t("collections.dot_fully_learned") };
  if (stats.learned > 0 || stats.inProgress > 0)
    return { color: "bg-amber-400", label: t("collections.dot_in_progress", { learned: stats.learned, total }) };
  return { color: "bg-gray-300 dark:bg-gray-500", label: t("collections.dot_not_studied") };
}

export function StudyDot({ stats, className = "", showFallback = false }: StudyDotProps) {
  const { t } = useTranslation();
  const dot = getDotConfig(stats, t) ?? (showFallback ? { color: "bg-gray-200 dark:bg-gray-600", label: t("collections.dot_no_data") } : null);
  if (!dot) return null;
  return <span title={dot.label} className={`rounded-full ${dot.color} ${className}`} />;
}
