import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { CategorySelect } from "@/components/CategorySelect";
import { TagSelect } from "@/components/TagSelect";
import {
  useCollectionWithContent,
  useEditCollection,
  useDeleteCollection,
  useDeleteAllCards,
} from "@/hooks/useCollectionHooks";
import { useSetCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { collectionTagsApi } from "@/api";
import { useToast } from "@/hooks/useToast";
import type { Collection } from "@/types";

interface CollectionContentResponse {
  collection: Collection;
  content: unknown[];
}

export function CollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const colId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const { data: rawData, isLoading } = useCollectionWithContent(colId);
  const collection = (rawData as unknown as CollectionContentResponse[] | undefined)?.[0]?.collection;
  const editCollection = useEditCollection();
  const deleteCollection = useDeleteCollection();
  const deleteAllCards = useDeleteAllCards();

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [categoryid, setCategoryid] = useState<number | undefined>();
  const [tagIds, setTagIds] = useState<number[]>([]);

  const setCollectionTags = useSetCollectionTags();
  const { data: existingTags = [] } = useQuery({
    queryKey: ["collection-tags", "collection", colId],
    queryFn: () => collectionTagsApi.getByCollection(colId),
    enabled: !!colId,
  });

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setNote(collection.note ?? "");
      setCategoryid(collection.categoryid);
    }
  }, [collection]);

  useEffect(() => {
    setTagIds(existingTags.map((t) => t.id));
  }, [existingTags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    editCollection.mutate(
      { id: colId, data: { name: name.trim(), note: note.trim() || undefined, categoryid } },
      {
        onSuccess: () => {
          setCollectionTags.mutate(
            { collectionId: colId, tagIds },
            {
              onSuccess: () => {
                toast.success("Collection saved");
                navigate(`/collections/${colId}`);
              },
              onError: () => toast.error("Failed to save tags"),
            },
          );
        },
        onError: () => toast.error("Failed to save collection"),
      },
    );
  };

  const handleDeleteAllCards = () => {
    if (!window.confirm("Delete all cards in this collection? This cannot be undone.")) return;
    deleteAllCards.mutate(colId, {
      onSuccess: () => toast.success("All cards deleted"),
      onError: () => toast.error("Failed to delete cards"),
    });
  };

  const handleDeleteCollection = () => {
    if (!window.confirm("Delete this collection and all its cards? This cannot be undone.")) return;
    deleteCollection.mutate(colId, {
      onSuccess: () => {
        toast.success("Collection deleted");
        navigate("/library");
      },
      onError: () => toast.error("Failed to delete collection"),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-lg animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return <p className="text-gray-500 dark:text-gray-400">Collection not found.</p>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Collection</h1>
      </div>

      {/* Edit form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional description"
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
          <CategorySelect value={categoryid} onChange={setCategoryid} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
          <TagSelect value={tagIds} onChange={setTagIds} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={editCollection.isPending} disabled={!name.trim()}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 p-5">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">Danger zone</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Delete all cards</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Removes all cards but keeps the collection</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAllCards}
              loading={deleteAllCards.isPending}
              type="button">
              Delete cards
            </Button>
          </div>
          <div className="border-t border-red-100 dark:border-red-900/40 pt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Delete collection</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Permanently removes the collection and all its cards</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteCollection}
              loading={deleteCollection.isPending}
              type="button">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
