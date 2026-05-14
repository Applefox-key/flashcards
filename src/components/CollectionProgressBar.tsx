import type { CollectionStats } from "@/types";

interface Props {
  stats?: CollectionStats | null;
  variant?: "minimal" | "full";
  className?: string;
}

const EMPTY_BAR = (className: string) => (
  <div className={`rounded-full h-1.5 bg-gray-200 dark:bg-gray-700 ${className}`} />
);

export function CollectionProgressBar({ stats, variant = "minimal", className = "" }: Props) {
  const total = stats ? stats.toLearn + stats.inProgress + stats.learned : 0;
  if (!stats || total === 0) {
    return variant === "minimal" ? (
      EMPTY_BAR(className)
    ) : (
      <div className="flex flex-col gap-1.5">{EMPTY_BAR(className)}</div>
    );
  }

  const segments = [
    stats.learned > 0 && {
      width: (stats.learned / total) * 100,
      color: "bg-green-500 dark:bg-green-400",
      label: `${stats.learned} learned`,
    },
    stats.inProgress > 0 && {
      width: (stats.inProgress / total) * 100,
      color: "bg-amber-400 dark:bg-amber-500",
      label: `${stats.inProgress} in progress`,
    },
    stats.toLearn > 0 && {
      width: (stats.toLearn / total) * 100,
      color: "bg-gray-300 dark:bg-gray-600",
      label: `${stats.toLearn} to learn`,
    },
  ].filter(Boolean) as { width: number; color: string; label: string }[];

  const bar = (
    <div className={`flex h-[1px] sm:h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full ${className}`}>
      {segments.map((seg, i) => (
        <div
          key={seg.label}
          className={`relative group/seg h-full ${seg.color}${i === 0 ? " rounded-l-full" : ""}${i === segments.length - 1 ? " rounded-r-full" : ""}`}
          style={{ width: `${seg.width}%` }}>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-xs bg-gray-800 dark:bg-gray-600 text-white rounded whitespace-nowrap opacity-0 group-hover/seg:opacity-100 pointer-events-none transition-opacity z-10">
            {seg.label}
          </div>
        </div>
      ))}
    </div>
  );

  if (variant === "minimal") return bar;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 shrink-0" />
          {stats.learned} learned
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 shrink-0" />
          {stats.inProgress} in progress
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
          {stats.toLearn} to learn
        </span>
      </div>
      {bar}
    </div>
  );
}
