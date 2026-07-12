import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Collection, Category } from "@/types";

interface CategoryFilterProps {
  allCollections: Collection[];
  value: number | null;
  onChange: (id: number | null) => void;
  className?: string;
}

export function CategoryFilter({ allCollections, value, onChange, className = "" }: CategoryFilterProps) {
  const { t } = useTranslation();

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const col of allCollections) {
      if (col.categoryid == null || !col.category) continue;
      const cat = col.category as unknown;
      const name = typeof cat === "string" ? cat : (cat as Category).name;
      if (name) map.set(col.categoryid, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCollections]);

  if (categories.length === 0) return null;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={`w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:[color-scheme:dark] ${className}`}>
      <option value="">{t("playlists.picker_category_all")}</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}

export function getCategoryDisplayName(category: Collection["category"]): string | null {
  if (!category) return null;
  const cat = category as unknown;
  if (typeof cat === "string") return cat || null;
  return (cat as Category).name || null;
}
