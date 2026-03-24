import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { useCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import type { Collection, CategoryWithCollections, CollectionTag } from "@/types";

function CollectionSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded flex-1 max-w-xs" />
      <div className="h-4 w-16 bg-gray-100 rounded-full" />
      <div className="h-4 w-12 bg-gray-100 rounded" />
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[1, 2].map((g) => (
        <div key={g}>
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
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
      <mark className="bg-yellow-100 text-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
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
      className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex items-center gap-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
      <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-gray-600">{highlight(collection.name, search)}</span>
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="text-xs bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full shrink-0">
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
        <span className="text-xs text-green-600 border border-green-300 px-1.5 py-0.5 rounded">public</span>
      )}
      <span className="text-xs text-gray-400">{collection.cardCount ?? 0} cards</span>
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
        className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 shrink-0"
      />

      {/* Filter chips + collapse button */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <span className="text-xs text-gray-500">Filter:</span>
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onChange(tag)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              active === tag
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-gray-300 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300"
            }`}>
            {tag}
          </button>
        ))}

        <button
          onClick={onToggleAll}
          className="ml-auto px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-500
                     hover:bg-gray-50 transition-colors flex items-center gap-1"
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
          className={`text-gray-400 text-xs transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-0"}`}
          style={{ display: "inline-block" }}>
          ▼
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {category.name}
        </span>
        <span className="text-xs text-gray-400">({collections.length})</span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-1.5 border-l-2 border-indigo-100 pl-3 ml-1">
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
  const { data: categories = [], isLoading } = useCategoriesWithCollections();
  const { data: allTags = [] } = useCollectionTags();

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
        <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
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
          <span className="text-xs text-gray-500">Tags:</span>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                activeTagId === tag.id
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-violet-50 hover:border-violet-300"
              }`}>
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && <LibrarySkeleton />}

      {!isLoading && totalCollections === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No collections yet</p>
          <Link to="/collections/new">
            <Button size="sm">Create your first collection</Button>
          </Link>
        </div>
      )}

      {hasNoResults && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No collections match "{search}"</p>
          <button
            onClick={() => setSearch("")}
            className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors">
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
