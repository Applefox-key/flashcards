import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { Button } from "@/components/Button";
import type { Collection, CollectionTag } from "@/types";

// ── Skeleton ─────────────────────────────────────────────────────────

function CollectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-xs" />
      <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
      <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  );
}

// ── Collection row (same style as CollectionsPage) ────────────────────

function CollectionRow({ collection }: { collection: Collection }) {
  const tags: CollectionTag[] = collection.tags ?? [];
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all">
      <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-gray-900 dark:text-gray-100">{collection.name}</span>
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

// ── Filter bar ────────────────────────────────────────────────────────

const FILTER_TAGS = ["All", "Favorites", "Public"] as const;
type FilterTag = (typeof FILTER_TAGS)[number];

function TagFilterBar({ active, onChange }: { active: FilterTag; onChange: (t: FilterTag) => void }) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap items-center">
      <span className="text-xs text-gray-500">Filter:</span>
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
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export function CategoryCollectionsPage() {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTag>("All");

  const { data: categories = [], isLoading } = useCategoriesWithCollections();
  const categoryData = categories.find((c) => c.id === categoryId);

  function filterCollections(collections: Collection[]) {
    if (activeFilter === "Favorites") return collections.filter((c) => c.isFavorite);
    if (activeFilter === "Public") return collections.filter((c) => c.isPublic);
    return collections;
  }

  const collections = categoryData?.collections ?? [];
  const visible = filterCollections(collections);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/categories")}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
            <span className="hidden sm:inline">
              {" "}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
              </svg>
            </span>
            <span className="sm:hidden">
              {" "}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
              </svg>
            </span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white min-w-0 truncate">
            Category:{" "}
            {isLoading ? (
              <span className="inline-block h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              (categoryData?.name ?? "Category")
            )}
          </h1>
          {!isLoading && (
            <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">
              <span className="hidden sm:inline">{collections.length} collections</span>
              <span className="sm:hidden">{collections.length}</span>
            </span>
          )}
        </div>
        <Link to="/collections/new" className="shrink-0 ml-3">
          <Button size="sm">
            <span className="hidden sm:inline">+ New Collection</span>
            <span className="sm:hidden">+ New</span>
          </Button>
        </Link>
      </div>

      <TagFilterBar active={activeFilter} onChange={setActiveFilter} />

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <CollectionSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && visible.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">
            {collections.length === 0 ? "No collections in this category." : "No collections match the current filter."}
          </p>
        </div>
      )}

      {/* Collections */}
      {!isLoading && (
        <div className="flex flex-col gap-2">
          {visible.map((col) => (
            <CollectionRow key={col.id} collection={col} />
          ))}
        </div>
      )}
    </div>
  );
}
