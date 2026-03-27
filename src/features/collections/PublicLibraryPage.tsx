import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { pbcollectionsApi } from "@/api";
import { useCopyCollection } from "@/features/collections/hooks/useCollections";
import { useCollections } from "@/hooks/useCollectionHooks";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Collection } from "@/types";

function RowSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded flex-1 max-w-xs" />
      <div className="h-4 w-16 bg-gray-100 rounded-full" />
      <div className="h-4 w-12 bg-gray-100 rounded" />
      <div className="h-7 w-14 bg-gray-100 rounded" />
    </div>
  );
}

// The public API may return category as a string (name) or object
function getCategoryName(col: Collection): string | undefined {
  if (!col.category) return undefined;
  if (typeof col.category === "object") return (col.category as { name?: string }).name;
  if (typeof col.category === "string") return col.category || undefined;
  return undefined;
}

// Tags may come back as strings or { id, name } objects
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
      <mark className="bg-yellow-100 text-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface RowProps {
  col: Collection;
  search: string;
  isMine: boolean;
  isCopied: boolean;
  onCopy: (col: Collection) => void;
  copyPending: boolean;
}

function CollectionRow({ col, search, isMine, isCopied, onCopy, copyPending }: RowProps) {
  const categoryName = getCategoryName(col);
  const tagNames = getTagNames(col);
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-start gap-3 hover:border-indigo-200 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/library/public/${col.id}`}
            className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
            {highlight(col.name, search)}
          </Link>
          {categoryName && (
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full">
              {highlight(categoryName, search)}
            </span>
          )}
          {tagNames.length > 0 && (
            <>
              {tagNames.map((name) => (
                <span
                  key={name}
                  className="text-xs bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full">
                  {highlight(name, search)}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 mt-0.5">
        {col.cardCount !== undefined && <span className="text-xs text-gray-400">{col.cardCount} cards</span>}
        {isMine ? (
          <span className="text-xs text-indigo-400 font-medium px-2">Your collection</span>
        ) : isCopied ? (
          <span className="text-xs text-green-600 font-medium px-2">✓ Copied</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => onCopy(col)} loading={copyPending}>
            Copy
          </Button>
        )}
      </div>
    </div>
  );
}

export function PublicLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());
  const toast = useToast();
  const copyCollection = useCopyCollection();
  const { data: myCollections = [] } = useCollections();
  const myCollectionIds = new Set(myCollections.map((c) => c.id));

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["pbcollections", "count"],
    queryFn: pbcollectionsApi.getAllWithCount,
  });

  // Collect all unique tag name strings across public collections
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

  const handleCopy = (col: Collection) => {
    copyCollection.mutate(col.id, {
      onSuccess: () => {
        setCopiedIds((prev) => new Set([...prev, col.id]));
        toast.success(`"${col.name}" added to your library`);
      },
      onError: () => toast.error("Failed to copy collection"),
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="test-base sm:text-2xl font-bold text-gray-900">Public Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse and copy collections shared by other users</p>
        </div>
        <Link to="/library">
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            ← My Library
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveTag(null);
          }}
          placeholder="Search by name, category or tag…"
          className="w-full max-w-sm border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tag chips */}
      {allTagNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {allTagNames.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setActiveTag(activeTag === tag ? null : tag);
                setSearch("");
              }}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                activeTag === tag
                  ? "bg-violet-100 text-violet-700 border-violet-300"
                  : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
              }`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-16">
          {search || activeTag !== null ? "No collections match your search" : "No public collections yet"}
        </p>
      )}

      {/* Flat list */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((col) => (
            <CollectionRow
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
      )}
    </div>
  );
}
