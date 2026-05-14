import { useState, useMemo, useEffect } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { collectionsApi } from "@/api";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { useCollections, useCollectionsPaginated } from "@/hooks/useCollectionHooks";
import { useCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { useLibraryUiStore } from "@/store/libraryUiStore";
import { FilterDrawer } from "@/features/collections/FilterDrawer";
import { CollectionProgressBar } from "@/components/CollectionProgressBar";
import { MobileFab } from "@/components/MobileFab";
import type { Collection, CollectionTag, CollectionStats } from "@/types";

const ALL_LIMIT = 20;

function highlight(text: string, query: string): React.ReactNode {
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

function CollectionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-2 mt-0.5">
        <div className="grid grid-cols-2 gap-1">
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-auto pt-1">
        <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  search,
  tags,
  compact,
}: {
  collection: Collection;
  search: string;
  tags: CollectionTag[];
  compact: boolean;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["collections", collection.id, "preview"],
    queryFn: () => collectionsApi.getPreview(collection.id, 3),
    staleTime: 5 * 60 * 1000,
    select: (d) => {
      const raw = d as unknown as Array<{
        collection: { stats?: CollectionStats };
        content: { id: number; question: string; answer: string }[];
      }>;
      return {
        cards: raw[0]?.content ?? [],
        stats: raw[0]?.collection?.stats,
      };
    },
  });

  if (isLoading) return <CollectionCardSkeleton />;

  return (
    <div
      onClick={() => navigate(`/collections/${collection.id}`)}
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-1 sm:p-4 flex flex-col gap-1 sm:gap-2 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all">
      <div className="font-medium text-gray-800 dark:text-gray-100 text-sm leading-snug">
        {highlight(collection.name, search)}
      </div>
      <CollectionProgressBar stats={data?.stats} variant="minimal" />
      {!compact && data && data.cards.length > 0 && (
        <div className="flex flex-col gap-0.5  border-gray-100 dark:border-gray-700 mt-0.5">
          {data.cards.map((card) => (
            <div key={card.id} className="grid grid-cols-2 gap-1 text-xs text-gray-400 dark:text-gray-500">
              <span className="truncate">{card.question}</span>
              <span className="truncate text-gray-300 dark:text-gray-600">{card.answer}</span>
            </div>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 px-1.5 py-0.5 rounded-full">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className={`flex items-center justify-between gap-2 mt-auto pt-1 ${!compact ? "border-t" : ""}`}>
        <div className="flex items-center gap-2 min-w-0">
          {!!collection.isFavorite && <span className="text-rose-400 shrink-0">♥</span>}
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{collection.cardCount ?? 0} cards</span>
          {!!collection.isPublic && (
            <span className="text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 px-1.5 py-0.5 rounded shrink-0">
              🔓 public
            </span>
          )}
        </div>
        <Link
          to={`/play/${collection.id}`}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg">
          Practice
        </Link>
      </div>
    </div>
  );
}

type VisibleEntry = { category: { id: number; name: string }; collections: Collection[] };

function CompactToggleBtn({ compact, onToggle }: { compact: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={compact ? "Show preview" : "Compact view"}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
        compact
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600"
      }`}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="0.75" y="0.75" width="11.5" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        {!compact && (
          <>
            <line x1="2.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1" />
            <line x1="2.5" y1="6.5" x2="10.5" y2="6.5" stroke="currentColor" strokeWidth="1" />
            <line x1="2.5" y1="8.5" x2="7.5" y2="8.5" stroke="currentColor" strokeWidth="1" />
          </>
        )}
      </svg>
      Compact
    </button>
  );
}

function CollapsibleSection({
  title,
  count,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const showToggle = count > 15;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        {showToggle && (
          <button
            onClick={onToggle}
            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded">
            <IoIosArrowForward
              size={16}
              className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`}
            />
          </button>
        )}
      </div>
      {(!showToggle || !collapsed) && children}
    </div>
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
        ← Prev
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
        Next →
      </button>
    </div>
  );
}

function AllCollectionsView({ search }: { search: string }) {
  const { myLibrary, setMyLibrary } = useLibraryUiStore();
  const page = myLibrary.allPage ?? 1;
  const compact = myLibrary.compactCards ?? false;

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useCollectionsPaginated(page, ALL_LIMIT, debouncedSearch || undefined);

  const visible = useMemo(() => {
    let cols = data?.data ?? [];
    if (myLibrary.activeFilter === "Favorites") cols = cols.filter((c) => c.isFavorite);
    if (myLibrary.activeFilter === "Public") cols = cols.filter((c) => c.isPublic);
    if (myLibrary.activeTagId !== null)
      cols = cols.filter((c) => (c.tags ?? []).some((t) => t.id === myLibrary.activeTagId));
    return cols;
  }, [data, myLibrary.activeFilter, myLibrary.activeTagId]);

  const totalPages = data ? Math.ceil(data.total / ALL_LIMIT) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={isFetching && !isLoading ? "opacity-60 transition-opacity duration-150" : ""}>
      <div className="hidden sm:flex items-center justify-between mb-2">
        {data && totalPages > 1 ? (
          <Pagination page={page} totalPages={totalPages} onChange={(p) => setMyLibrary({ allPage: p })} />
        ) : (
          <div />
        )}
        <CompactToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
      </div>
      {totalPages > 1 && (
        <div className="sm:hidden mb-3">
          <Pagination page={page} totalPages={totalPages} onChange={(p) => setMyLibrary({ allPage: p })} />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 content-start">
        {visible.map((col) => (
          <CollectionCard key={col.id} collection={col} search={search} tags={col.tags ?? []} compact={compact} />
        ))}
        {visible.length === 0 && (
          <p className="col-span-full text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No collections</p>
        )}
      </div>
    </div>
  );
}

function CardsView({
  visibleCategories,
  search,
  effectiveId,
  totalCollections,
}: {
  visibleCategories: VisibleEntry[];
  search: string;
  effectiveId: number | null;
  totalCollections: number;
}) {
  const { myLibrary, setMyLibrary } = useLibraryUiStore();
  const compact = myLibrary.compactCards ?? false;
  const viewMode = myLibrary.viewMode ?? "by-category";

  const selectedCollections =
    viewMode === "by-category" && effectiveId !== null
      ? (visibleCategories.find((e) => e.category.id === effectiveId)?.collections ?? [])
      : [];

  function switchToAll() {
    setMyLibrary({ viewMode: "all", allPage: 1 });
  }

  function switchToCategory(id: number) {
    setMyLibrary({ viewMode: "by-category", selectedCategoryId: id });
  }

  return (
    <div className="flex gap-0 min-h-0">
      {/* Left: category list — desktop only */}
      <div className="hidden sm:flex flex-col w-44 shrink-0 gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-2 mr-4">
        <button
          onClick={switchToAll}
          className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            viewMode === "all"
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="truncate">All collections</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({totalCollections})</span>
          </div>
        </button>

        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

        {visibleCategories.map(({ category, collections }) => (
          <button
            key={category.id}
            onClick={() => switchToCategory(category.id)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === "by-category" && effectiveId === category.id
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}>
            <div className="flex items-center justify-between gap-1">
              <span className="truncate">{highlight(category.name, search)}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({collections.length})</span>
            </div>
          </button>
        ))}
      </div>

      {/* Right: content area */}
      <div className="flex-1 min-w-0">
        {viewMode === "all" ? (
          <AllCollectionsView search={search} />
        ) : (
          <>
            <div className="hidden sm:flex justify-end mb-2">
              <CompactToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 content-start">
              {selectedCollections.map((col) => (
                <CollectionCard key={col.id} collection={col} search={search} tags={col.tags ?? []} compact={compact} />
              ))}
              {selectedCollections.length === 0 && (
                <p className="col-span-full text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                  No collections
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const FILTER_TAGS = ["All", "Favorites", "Public"] as const;
type FilterTag = (typeof FILTER_TAGS)[number];

function LibraryTabsBar({
  search,
  onSearch,
  active,
  onChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  active: FilterTag;
  onChange: (tag: FilterTag) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-gray-200 dark:border-gray-700 mb-0">
      <div className="hidden sm:flex items-center sm:w-auto shrink-0">
        <span className="px-5 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px cursor-default select-none">
          My Library
        </span>
        <Link
          to="/library/public"
          className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent transition-colors">
          Public Library
        </Link>
        <Link to="/collections/new" className="ml-auto pb-1 sm:hidden shrink-0">
          <Button size="sm">+</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap pb-2 w-full sm:w-auto sm:ml-auto">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-0 sm:w-52 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onChange(tag)}
            className={`hidden sm:block px-3 py-1 text-xs rounded-full border transition-colors ${
              active === tag
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600"
            }`}>
            {tag}
          </button>
        ))}
        <Link to="/collections/new" className="shrink-0 hidden sm:block">
          <Button size="sm">+ New Collection</Button>
        </Link>
      </div>
    </div>
  );
}

export function CollectionsPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const { myLibrary, setMyLibrary } = useLibraryUiStore();
  const activeFilter = myLibrary.activeFilter;
  const search = myLibrary.search;
  const activeTagId = myLibrary.activeTagId;
  const compact = myLibrary.compactCards ?? false;
  const viewMode = myLibrary.viewMode ?? "by-category";

  function setActiveFilter(v: FilterTag) {
    setMyLibrary({ activeFilter: v, allPage: 1 });
  }
  function setSearch(v: string) {
    setMyLibrary({ search: v, allPage: 1 });
  }
  function setActiveTagId(v: number | null) {
    setMyLibrary({ activeTagId: v, allPage: 1 });
  }

  const { data: categoriesRaw = [], isLoading } = useCategoriesWithCollections();
  const { data: allCollections = [] } = useCollections();
  const { data: allTags = [] } = useCollectionTags();

  const categorizedIds = new Set(categoriesRaw.flatMap((c) => c.collections.map((col) => col.id)));
  const uncategorized = allCollections.filter((col) => !categorizedIds.has(col.id));
  const categories =
    uncategorized.length > 0
      ? [...categoriesRaw, { id: 0, name: "Uncategorized", userid: 0, collections: uncategorized }]
      : categoriesRaw;

  const totalCollections = categories.reduce((sum, c) => sum + c.collections.length, 0);

  function applyTagFilter(collections: Collection[]) {
    let result = collections;
    if (activeFilter === "Favorites") result = result.filter((c) => c.isFavorite);
    if (activeFilter === "Public") result = result.filter((c) => c.isPublic);
    if (activeTagId !== null) {
      result = result.filter((c) => (c.tags ?? []).some((t) => t.id === activeTagId));
    }
    return result;
  }

  function getVisibleCollections(category: (typeof categories)[number]): Collection[] | null {
    const q = search.toLowerCase().trim();
    if (!q) {
      const filtered = applyTagFilter(category.collections);
      return filtered.length > 0 ? filtered : null;
    }
    const categoryMatches = category.name.toLowerCase().includes(q);
    if (categoryMatches) {
      const filtered = applyTagFilter(category.collections);
      return filtered.length > 0 ? filtered : null;
    }
    const byName = category.collections.filter((col) => col.name.toLowerCase().includes(q));
    const filtered = applyTagFilter(byName);
    return filtered.length > 0 ? filtered : null;
  }

  const visibleCategories = categories
    .map((category) => ({ category, collections: getVisibleCollections(category) }))
    .filter(
      (entry): entry is { category: typeof entry.category; collections: Collection[] } => entry.collections !== null,
    );

  const selectedId = myLibrary.selectedCategoryId;
  const validIds = new Set(visibleCategories.map((e) => e.category.id));
  const effectiveId =
    selectedId !== null && validIds.has(selectedId) ? selectedId : (visibleCategories[0]?.category.id ?? null);

  const hasNoResults = !isLoading && totalCollections > 0 && visibleCategories.length === 0 && viewMode !== "all";
  const showContent = !isLoading && totalCollections > 0;

  return (
    <div>
      {/* ── Sticky header block ── */}
      <div className="sticky -top-3 sm:-top-6 z-20 bg-gray-50 dark:bg-gray-900 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <LibraryTabsBar search={search} onSearch={setSearch} active={activeFilter} onChange={setActiveFilter} />

        {allTags.length > 0 && (
          <div className="hidden sm:flex gap-2 overflow-x-auto items-center border-b border-slate-200/80 dark:border-slate-700/80 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                  activeTagId === tag.id
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600"
                }`}>
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: current category label + compact toggle */}
        {showContent && (
          <div className="sm:hidden flex items-center gap-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="flex-1 truncate text-sm font-medium text-indigo-700 dark:text-indigo-300 px-1">
              {viewMode === "all"
                ? `All collections (${totalCollections})`
                : (visibleCategories.find((e) => e.category.id === effectiveId)?.category.name ?? "")}
            </span>
            <CompactToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="mt-4">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && totalCollections === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-lg mb-2">No collections yet</p>
            <Link to="/collections/new">
              <Button size="sm">Create your first collection</Button>
            </Link>
          </div>
        )}

        {hasNoResults && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-lg mb-2">No collections match "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Clear search
            </button>
          </div>
        )}

        {showContent && (
          <CardsView
            visibleCategories={visibleCategories}
            search={search.toLowerCase().trim()}
            effectiveId={effectiveId}
            totalCollections={totalCollections}
          />
        )}
      </div>

      <MobileFab to="/collections/new" label="Add collection" />

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onOpen={() => setFilterOpen(true)}
        hasActiveFilters={
          activeFilter !== "All" ||
          activeTagId !== null ||
          (viewMode === "by-category" && myLibrary.selectedCategoryId !== null)
        }>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Show</p>
          <div className="flex flex-wrap gap-2">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  activeFilter === tag
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {showContent && (
          <CollapsibleSection
            title="Categories"
            count={visibleCategories.length}
            collapsed={categoriesCollapsed}
            onToggle={() => setCategoriesCollapsed((v) => !v)}>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setMyLibrary({ viewMode: "all", allPage: 1 });
                  setFilterOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === "all"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">All collections</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({totalCollections})</span>
                </div>
              </button>
              {visibleCategories.map(({ category, collections }) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setMyLibrary({ viewMode: "by-category", selectedCategoryId: category.id });
                    setFilterOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    viewMode === "by-category" && effectiveId === category.id
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({collections.length})</span>
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {allTags.length > 0 && (
          <CollapsibleSection
            title="Tags"
            count={allTags.length}
            collapsed={tagsCollapsed}
            onToggle={() => setTagsCollapsed((v) => !v)}>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    activeTagId === tag.id
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300"
                  }`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </FilterDrawer>
    </div>
  );
}
