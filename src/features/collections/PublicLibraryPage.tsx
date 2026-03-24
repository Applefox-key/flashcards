import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { pbcollectionsApi } from "@/api";
import { useCopyCollection } from "@/features/collections/hooks/useCollections";
import { useCollections } from "@/hooks/useCollectionHooks";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Collection } from "@/types";

function groupByCategory(collections: Collection[]) {
  const groups = new Map<string, Collection[]>();
  for (const col of collections) {
    const key = col.category?.name ?? "Uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(col);
  }
  return groups;
}

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

export function PublicLibraryPage() {
  const [search, setSearch] = useState("");
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());
  const toast = useToast();
  const copyCollection = useCopyCollection();
  const { data: myCollections = [] } = useCollections();
  const myCollectionIds = new Set(myCollections.map((c) => c.id));

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["pbcollections", "count"],
    queryFn: pbcollectionsApi.getAllWithCount,
  });

  const filtered = collections.filter((col) => col.name.toLowerCase().includes(search.toLowerCase()));
  const groups = groupByCategory(filtered);

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
          <h1 className="text-2xl font-bold text-gray-900">Public Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse and copy collections shared by other users</p>
        </div>
        <Link to="/library">
          <Button variant="secondary" size="sm">
            ← My Library
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search public collections..."
          className="w-full max-w-sm border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-8">
          {[1, 2].map((g) => (
            <div key={g}>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <RowSkeleton key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-16">
          {search ? `No collections match "${search}"` : "No public collections yet"}
        </p>
      )}

      {/* Category groups */}
      {!isLoading &&
        Array.from(groups.entries()).map(([categoryName, cols]) => (
          <div key={categoryName} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {categoryName}
              <span className="ml-2 text-gray-400 font-normal normal-case">({cols.length})</span>
            </h2>
            <div className="flex flex-col gap-2">
              {cols.map((col) => (
                <div
                  key={col.id}
                  className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
                  <Link
                    to={`/library/public/${col.id}`}
                    className="font-medium text-gray-900 flex-1 hover:text-indigo-600 transition-colors">
                    {col.name}
                  </Link>
                  {col.category && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {col.category.name}
                    </span>
                  )}
                  {col.cardCount !== undefined && <span className="text-xs text-gray-400">{col.cardCount} cards</span>}
                  {myCollectionIds.has(col.id) ? (
                    <span className="text-xs text-indigo-400 font-medium px-2">Your collection</span>
                  ) : copiedIds.has(col.id) ? (
                    <span className="text-xs text-green-600 font-medium px-2">✓ Copied</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopy(col)}
                      loading={copyCollection.isPending}>
                      Copy
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
