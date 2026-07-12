import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StudyDot } from "@/components/StudyDot";
import { CategoryFilter, getCategoryDisplayName } from "@/components/CategoryFilter";
import type { Collection } from "@/types";

interface CollectionPickerProps {
  activeSlot: number;
  selectedIds: (number | undefined)[];
  allCollections: Collection[];
  onPick: (id: number) => void;
  onClose: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}

export function CollectionPicker({
  activeSlot,
  selectedIds,
  allCollections,
  onPick,
  onClose,
  searchRef,
}: CollectionPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  // Autofocus search input on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const allTagNames = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const col of allCollections) {
      for (const tag of col.tags ?? []) set.add(tag.name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allCollections]);

  const pickerCollections = useMemo(
    () =>
      allCollections
        .filter((c) => !selectedIds.includes(c.id))
        .filter((c) => !tagFilter || (c.tags ?? []).some((t) => t.name === tagFilter))
        .filter((c) => !categoryFilter || c.categoryid === categoryFilter)
        .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allCollections, selectedIds, tagFilter, categoryFilter, search],
  );

  const content = (listClassName: string) => (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {t("playlists.picker_filling_slot", { n: activeSlot + 1 })}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none w-6 text-center">
          ×
        </button>
      </div>
      <input
        ref={searchRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("playlists.picker_search_placeholder")}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <CategoryFilter
        allCollections={allCollections}
        value={categoryFilter}
        onChange={setCategoryFilter}
        className="mt-1.5"
      />
      {allTagNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {allTagNames.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                tagFilter === tag
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600"
                  : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400"
              }`}>
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className={listClassName}>
        {pickerCollections.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            {search || tagFilter || categoryFilter
              ? t("playlists.picker_no_matches")
              : t("playlists.picker_no_collections")}
          </p>
        ) : (
          pickerCollections.map((col) => (
            <div
              key={col.id}
              onClick={() => onPick(col.id)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer text-sm rounded">
              <StudyDot stats={col.stats} showFallback className="w-2 h-2 shrink-0" />
              <span className="flex-1 text-gray-800 dark:text-gray-200">{col.name}</span>
              {getCategoryDisplayName(col.category) && (
                <span className="text-xs text-indigo-400 shrink-0">{getCategoryDisplayName(col.category)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop inline panel */}
      <div className="hidden sm:block border border-indigo-200 dark:border-indigo-700 rounded-xl p-3 bg-indigo-50 dark:bg-indigo-900/20 sticky top-0">
        {content("max-h-64 overflow-y-auto mt-2")}
      </div>
      {/* Mobile overlay */}
      <div className="sm:hidden fixed left-2 right-2 sm:bottom-4 z-[60] max-h-[40vh] sm:max-h-[70vh] bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-700 p-3 flex flex-col shadow-xl">
        {content("flex-1 min-h-0 overflow-y-auto mt-2")}
      </div>
    </>
  );
}
