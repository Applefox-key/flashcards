import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { useCollections } from "@/hooks/useCollectionHooks";
import { useCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import type { Collection, CategoryWithCollections, CollectionTag } from "@/types";

function CollectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-xs" />
      <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
      <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[1, 2].map((g) => (
        <div key={g}>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <CollectionSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

function CollectionRow({
  collection,
  search,
  tags,
}: {
  collection: Collection;
  search: string;
  tags: CollectionTag[];
}) {
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-3 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all">
      <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-gray-600 dark:text-gray-200">{highlight(collection.name, search)}</span>
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 px-1.5 py-0.5 rounded-full shrink-0">
            {tag.name}
          </span>
        ))}
      </div>
      {!!collection.isFavorite && (
        <span className="text-yellow-400" title="Favorite">
          ★
        </span>
      )}
      {!!collection.isPublic && (
        <span className="text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 px-1.5 py-0.5 rounded">
          public
        </span>
      )}
      <span className="text-xs text-gray-400 dark:text-gray-500">{collection.cardCount ?? 0} cards</span>
    </Link>
  );
}

const FILTER_TAGS = ["All", "Favorites", "Public"] as const;
type FilterTag = (typeof FILTER_TAGS)[number];

function SearchFilterBar({
  search,
  onSearch,
  active,
  onChange,
  allCollapsed,
  onToggleAll,
}: {
  search: string;
  onSearch: (v: string) => void;
  active: FilterTag;
  onChange: (tag: FilterTag) => void;
  allCollapsed: boolean;
  onToggleAll: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
      {/* Search — short fixed width on large screens, full width on mobile */}
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search..."
        className="w-full sm:max-w-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 shrink-0"
      />

      {/* Filter chips + collapse button */}
      <div className="flex justify-start sm:justify-end items-center gap-2 flex-wrap flex-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">Filter:</span>
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onChange(tag)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              active === tag
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600"
            }`}>
            {tag}
          </button>
        ))}

        <button
          onClick={onToggleAll}
          className="ml-auto sm:ml-4 px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
          title={allCollapsed ? "Expand all categories" : "Collapse all categories"}>
          <span>{allCollapsed ? "▶▶" : "▼▼"}</span>
          <span className="hidden sm:inline">{allCollapsed ? "Expand all" : "Collapse all"}</span>
        </button>
      </div>
    </div>
  );
}

function CategoryGroup({
  category,
  collections,
  collapsed,
  onToggle,
  search,
}: {
  category: CategoryWithCollections;
  collections: Collection[];
  collapsed: boolean;
  onToggle: () => void;
  search: string;
}) {
  return (
    <div className="mb-6">
      <button onClick={onToggle} className="w-full flex items-center gap-2 mb-2 py-1 px-1">
        <span
          className={`text-gray-400 dark:text-gray-500 text-xs transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-0"}`}
          style={{ display: "inline-block" }}>
          ▼
        </span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {category.name}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">({collections.length})</span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-1.5 border-l-2 border-indigo-100 dark:border-indigo-900 pl-3 ml-1">
          {collections.map((col) => (
            <CollectionRow key={col.id} collection={col} search={search} tags={col.tags ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CollectionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTag>("All");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const { data: categoriesRaw = [], isLoading } = useCategoriesWithCollections();
  const { data: allCollections = [] } = useCollections();
  const { data: allTags = [] } = useCollectionTags();

  // Append a virtual "Uncategorized" group for collections not in any category
  const categorizedIds = new Set(categoriesRaw.flatMap((c) => c.collections.map((col) => col.id)));
  const uncategorized = allCollections.filter((col) => !categorizedIds.has(col.id));
  const categories =
    uncategorized.length > 0
      ? [...categoriesRaw, { id: 0, name: "Uncategorized", userid: 0, collections: uncategorized }]
      : categoriesRaw;

  const totalCollections = categories.reduce((sum, c) => sum + c.collections.length, 0);
  const allCollapsed = expanded.size === 0;

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

  function toggleCategory(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allCollapsed) {
      setExpanded(new Set(categories.map((c) => c.id)));
    } else {
      setExpanded(new Set());
    }
  }

  const visibleCategories = categories
    .map((category) => ({ category, collections: getVisibleCollections(category) }))
    .filter(
      (entry): entry is { category: typeof entry.category; collections: Collection[] } => entry.collections !== null,
    );

  const hasNoResults = !isLoading && totalCollections > 0 && visibleCategories.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="test-base sm:text-2xl font-bold text-gray-900 dark:text-white">My Library</h1>
        <div className="flex gap-2">
          <Link to="/library/public">
            <Button variant="secondary" size="sm">
              Public Library
            </Button>
          </Link>
          <Link to="/collections/new">
            <Button size="sm">+ New Collection</Button>
          </Link>
        </div>
      </div>

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        active={activeFilter}
        onChange={setActiveFilter}
        allCollapsed={allCollapsed}
        onToggleAll={toggleAll}
      />

      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center mb-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">Tags:</span>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                activeTagId === tag.id
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600"
              }`}>
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && <LibrarySkeleton />}

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

      {!isLoading &&
        visibleCategories.map(({ category, collections }) => (
          <CategoryGroup
            key={category.id}
            category={category}
            collections={collections}
            collapsed={!expanded.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            search={search.toLowerCase().trim()}
          />
        ))}
    </div>
  );
}
