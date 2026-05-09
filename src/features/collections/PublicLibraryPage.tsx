import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { pbcollectionsApi } from "@/api";
import { useCopyCollection } from "@/features/collections/hooks/useCollections";
import { useCollections } from "@/hooks/useCollectionHooks";
import { useLibraryUiStore } from "@/store/libraryUiStore";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Collection } from "@/types";

function RowSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-xs" />
      <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
      <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="h-7 w-14 bg-gray-100 dark:bg-gray-700 rounded" />
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
      <mark className="bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-start gap-3 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/library/public/${col.id}`}
            className="font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {highlight(col.name, search)}
          </Link>
          {categoryName && (
            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700 px-1.5 py-0.5 rounded-full">
              {highlight(categoryName, search)}
            </span>
          )}
          {tagNames.length > 0 && (
            <>
              {tagNames.map((name) => (
                <span
                  key={name}
                  className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 px-1.5 py-0.5 rounded-full">
                  {highlight(name, search)}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 mt-0.5">
        {col.cardCount !== undefined && <span className="text-xs text-gray-400 dark:text-gray-500">{col.cardCount} cards</span>}
        {isMine ? (
          <span className="text-xs text-indigo-400 dark:text-indigo-500 font-medium px-2">Your collection</span>
        ) : isCopied ? (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2">✓ Copied</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => onCopy(col)} loading={copyPending}>
            Copy
          </Button>
        )}
      </div>
    </div>
  );
}

function LibraryTabsBar({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-gray-200 dark:border-gray-700 mb-4">
      {/* Tabs */}
      <div className="flex shrink-0">
        <Link
          to="/library"
          className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent transition-colors">
          My Library
        </Link>
        <span className="px-5 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px cursor-default select-none">
          Public Library
        </span>
      </div>

      {/* Search */}
      <div className="ml-auto pb-2">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, category or tag…"
          className="w-40 sm:w-64 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}

export function PublicLibraryPage() {
  const { publicLibrary, setPublicLibrary } = useLibraryUiStore();
  const search = publicLibrary.search;
  const activeTag = publicLibrary.activeTag;
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
      <LibraryTabsBar
        search={search}
        onSearch={(v) => setPublicLibrary({ search: v, activeTag: null })}
      />

      {allTagNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {allTagNames.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setPublicLibrary({ activeTag: activeTag === tag ? null : tag, search: "" });
              }}
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

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-16">
          {search || activeTag !== null ? "No collections match your search" : "No public collections yet"}
        </p>
      )}

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
