import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const PB_LIMIT = 20;
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { pbcollectionsApi } from "@/api";
import { useCopyCollection } from "@/features/collections/hooks/useCollections";
import { useCollections } from "@/hooks/useCollectionHooks";
import { useLibraryUiStore } from "@/store/libraryUiStore";
import { FilterDrawer } from "@/features/collections/FilterDrawer";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Collection } from "@/types";
import { PiShootingStarThin } from "react-icons/pi";

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="flex flex-wrap gap-1 mt-1">
        <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
        <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mt-auto pt-2">
        <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function getCategoryName(col: Collection): string | undefined {
  if (!col.category) return undefined;
  if (typeof col.category === "object") return (col.category as { name?: string }).name;
  if (typeof col.category === "string") return col.category || undefined;
  return undefined;
}

function getTagNames(col: Collection): string[] {
  return (col.tags ?? [])
    .map((t): string => {
      if (typeof t === "string") return t;
      if (typeof t === "object" && t !== null) return (t as { name?: string }).name ?? "";
      return "";
    })
    .filter(Boolean);
}

function highlight(text: string | undefined, query: string): React.ReactNode {
  if (!text) return text ?? "";
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const push = (n: number | "...") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };
  push(1);
  if (current > 3) push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) push(i);
  if (current < total - 2) push("...");
  push(total);
  return pages;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);
  const btnBase = "h-8 min-w-8 px-2 text-sm rounded-lg border transition-colors";
  const btnInactive =
    "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800";
  const btnActive = "bg-indigo-600 border-indigo-600 text-white";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} ${btnInactive} ${page === 1 ? btnDisabled : ""} px-3`}>
        {t("public_library.prev")}
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="w-8 text-center text-gray-400 dark:text-gray-500 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`${btnBase} ${p === page ? btnActive : btnInactive}`}>
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} ${btnInactive} ${page === totalPages ? btnDisabled : ""} px-3`}>
        {t("public_library.next")}
      </button>
    </div>
  );
}

interface CardProps {
  col: Collection;
  search: string;
  isMine: boolean;
  isCopied: boolean;
  onCopy: (col: Collection) => void;
  copyPending: boolean;
}

function PublicCollectionCard({ col, search, isMine, isCopied, onCopy, copyPending }: CardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const categoryName = getCategoryName(col);
  const tagNames = getTagNames(col);

  return (
    <div
      onClick={() => navigate(`/library/public/${col.id}`)}
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-1 px-4 sm:p-4 flex flex-col gap-1 sm:gap-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all">
      <div className="font-medium text-gray-800 dark:text-gray-100 text-sm leading-snug">
        {highlight(col.name, search)}
      </div>

      {(categoryName || tagNames.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {categoryName && (
            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700 px-1.5 sm:py-0.5 rounded-full">
              {highlight(categoryName, search)}
            </span>
          )}
          {tagNames.map((name) => (
            <span
              key={name}
              className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 px-1.5 py-0.5 rounded-full">
              {highlight(name, search)}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto sm:pt-1">
        {" "}
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{t("collections.card_count", { count: col.cardCount ?? 0 })}</span>
        <div className="flex items-center gap-2 min-w-0">
          {" "}
          <Link
            to={`/play/flashcard/${col.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg">
            <PiShootingStarThin className="w-4 h-4 mr-2" /> {t("collections.practice_btn")}
          </Link>
          {isMine ? (
            <span className="text-xs text-indigo-400 dark:text-indigo-500 font-medium shrink-0">{t("public_library.your_collection")}</span>
          ) : isCopied ? (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">{t("public_library.copied")}</span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(col);
              }}
              loading={copyPending}
              className="border-none text-xs text-indigo-400 hover:text-indigo-600 transition-colors">
              {t("public_library.copy")}
            </Button>
          )}{" "}
        </div>
      </div>
    </div>
  );
}

function LibraryTabsBar({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-gray-200 dark:border-gray-700 mb-0">
      <div className="hidden sm:flex shrink-0">
        <Link
          to="/library"
          className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent transition-colors">
          {t("collections.my_library")}
        </Link>
        <span className="px-5 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px cursor-default select-none">
          {t("collections.public_library")}
        </span>
      </div>

      <div className="hidden sm:block sm:w-auto sm:ml-auto pb-2">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("public_library.search_placeholder")}
          className="w-full sm:w-64 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}

export function PublicLibraryPage() {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const { publicLibrary, setPublicLibrary } = useLibraryUiStore();
  const search = publicLibrary.search;
  const activeTag = publicLibrary.activeTag;
  const page = publicLibrary.page ?? 1;
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());
  const toast = useToast();
  const copyCollection = useCopyCollection();
  const { data: myCollections = [] } = useCollections();
  const myCollectionIds = new Set(myCollections.map((c) => c.id));

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["pbcollections", "count"],
    queryFn: pbcollectionsApi.getAllWithCount,
  });

  const allTagNames = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const col of collections) {
      for (const name of getTagNames(col)) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [collections]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return collections.filter((col) => {
      if (activeTag !== null && !getTagNames(col).includes(activeTag)) return false;
      if (!q) return true;
      if (col.name?.toLowerCase().includes(q)) return true;
      if (getCategoryName(col)?.toLowerCase().includes(q)) return true;
      if (getTagNames(col).some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [collections, search, activeTag]);

  const totalPages = Math.ceil(filtered.length / PB_LIMIT);
  const paged = filtered.slice((page - 1) * PB_LIMIT, page * PB_LIMIT);

  const handleCopy = (col: Collection) => {
    copyCollection.mutate(col.id, {
      onSuccess: () => {
        setCopiedIds((prev) => new Set([...prev, col.id]));
        toast.success(t("public_library.toast_copied", { name: col.name }));
      },
      onError: () => toast.error(t("public_library.toast_copy_error")),
    });
  };

  return (
    <div>
      {/* ── Sticky header block ── */}
      <div className="sticky top-0 pt-3 sm:-top-6 z-20 bg-gray-50 dark:bg-gray-900 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <LibraryTabsBar search={search} onSearch={(v) => setPublicLibrary({ search: v, activeTag: null, page: 1 })} />

        {allTagNames.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1.5 py-2 border-b border-gray-200 dark:border-gray-700">
            {allTagNames.map((tag) => (
              <button
                key={tag}
                onClick={() => setPublicLibrary({ activeTag: activeTag === tag ? null : tag, search: "", page: 1 })}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  activeTag === tag
                    ? "bg-violet-100 text-violet-700 border-violet-300"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-16">
            {search || activeTag !== null ? t("public_library.no_results_search") : t("public_library.no_results_empty")}
          </p>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            {totalPages > 1 && (
              <div className="hidden sm:flex justify-center mb-3">
                <Pagination page={page} totalPages={totalPages} onChange={(p) => setPublicLibrary({ page: p })} />
              </div>
            )}
            {totalPages > 1 && (
              <div className="sm:hidden mb-3">
                <Pagination page={page} totalPages={totalPages} onChange={(p) => setPublicLibrary({ page: p })} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
              {paged.map((col) => (
                <PublicCollectionCard
                  key={col.id}
                  col={col}
                  search={search}
                  isMine={myCollectionIds.has(col.id)}
                  isCopied={copiedIds.has(col.id)}
                  onCopy={handleCopy}
                  copyPending={copyCollection.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* mt-4 */}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onOpen={() => setFilterOpen(true)}
        hasActiveFilters={activeTag !== null}>
        {allTagNames.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t("collections.tags_section")}</p>
            <div className="flex flex-wrap gap-1.5">
              {allTagNames.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPublicLibrary({ activeTag: activeTag === tag ? null : tag, search: "" })}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    activeTag === tag
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </FilterDrawer>
    </div>
  );
}
