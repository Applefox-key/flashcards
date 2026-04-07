import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { CategorySelect } from "@/components/CategorySelect";
import { TagSelect } from "@/components/TagSelect";
import { useCreateCollection } from "@/features/collections/hooks/useCollections";
import { useSetCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { useToast } from "@/hooks/useToast";

export function CollectionCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createCollection = useCreateCollection();
  const setCollectionTags = useSetCollectionTags();

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [categoryid, setCategoryid] = useState<number | undefined>();
  const [tagIds, setTagIds] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const col = await createCollection.mutateAsync(
        { name: name.trim(), note: note.trim() || undefined, categoryid },
      );
      if (tagIds.length > 0) {
        await setCollectionTags.mutateAsync({ collectionId: col.id, tagIds });
      }
      toast.success("Collection created");
      navigate(`/collections/${col.id}`);
    } catch {
      toast.error("Failed to create collection");
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Collection</h1>
      </div>

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
            placeholder="e.g. English verbs"
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
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
          <Button type="submit" loading={createCollection.isPending} disabled={!name.trim()}>
            Create collection
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
