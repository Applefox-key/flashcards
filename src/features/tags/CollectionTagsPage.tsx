import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import {
  useCollectionTags,
  useCreateCollectionTag,
  useEditCollectionTag,
  useDeleteCollectionTag,
  useSetCollectionTags,
} from "@/features/collections/hooks/useCollectionTags";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import type { Collection } from "@/types";

function TagSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded flex-1 max-w-xs" />
      <div className="h-4 w-10 bg-gray-100 rounded" />
      <div className="h-4 w-12 bg-gray-100 rounded" />
    </div>
  );
}

interface AssignPanelProps {
  tagId: number;
  onClose: () => void;
}

function AssignPanel({ tagId, onClose }: AssignPanelProps) {
  const toast = useToast();
  const setCollectionTags = useSetCollectionTags();
  const { data: categoriesData = [] } = useCategoriesWithCollections();

  // Build flat list of all collections with their tags
  const allCollections: Collection[] = categoriesData.flatMap((cat) => cat.collections ?? []);

  // Initial checked state: collections that already have this tag
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(allCollections.filter((c) => c.tags?.some((t) => t.id === tagId)).map((c) => c.id)),
  );
  const [saving, setSaving] = useState(false);

  function toggle(colId: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const changed = allCollections.filter((col) => {
        const hadTag = col.tags?.some((t) => t.id === tagId) ?? false;
        const hasTag = checked.has(col.id);
        return hadTag !== hasTag;
      });
      await Promise.all(
        changed.map((col) => {
          const currentIds = col.tags?.map((t) => t.id) ?? [];
          const newIds = checked.has(col.id) ? [...currentIds, tagId] : currentIds.filter((id) => id !== tagId);
          return setCollectionTags.mutateAsync({ collectionId: col.id, tagIds: newIds });
        }),
      );
      toast.success("Assignments saved");
      onClose();
    } catch {
      toast.error("Failed to save assignments");
    } finally {
      setSaving(false);
    }
  }

  const hasCollections = allCollections.length > 0;

  return (
    <div className="bg-white border border-violet-200 rounded-lg p-3 mt-1 mb-2">
      {!hasCollections ? (
        <p className="text-sm text-gray-400 py-2">No collections found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categoriesData.map((cat) => {
            const cols = cat.collections ?? [];
            if (cols.length === 0) return null;
            return (
              <div key={cat.id}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{cat.name}</p>
                <div className="flex flex-col gap-1">
                  {cols.map((col) => (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked.has(col.id)}
                        onChange={() => toggle(col.id)}
                        className="accent-violet-500"
                      />
                      <span className="text-sm text-gray-800">{col.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-end gap-3 mt-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Cancel
        </button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </div>
    </div>
  );
}

export function CollectionTagsPage() {
  const toast = useToast();
  const { data: tags = [], isLoading } = useCollectionTags();
  const createTag = useCreateCollectionTag();
  const editTag = useEditCollectionTag();
  const deleteTag = useDeleteCollectionTag();

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [assigningTagId, setAssigningTagId] = useState<number | null>(null);

  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew) newInputRef.current?.focus();
  }, [addingNew]);
  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    createTag.mutate(name, {
      onSuccess: () => {
        setNewName("");
        setAddingNew(false);
      },
    });
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    editTag.mutate(
      { id: editingId, name },
      {
        onSuccess: () => setEditingId(null),
      },
    );
  }

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete tag "${name}"? It will be removed from all collections.`)) return;
    deleteTag.mutate(id, {
      onSuccess: () => toast.success("Tag deleted"),
    });
  }

  function handleAssign(tagId: number) {
    setAssigningTagId((prev) => (prev === tagId ? null : tagId));
    setEditingId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-gray-900">Tags</h1>
        {!addingNew && (
          <Button size="sm" onClick={() => setAddingNew(true)}>
            + New tag
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {addingNew && (
        <div className="bg-white rounded-lg border border-violet-300 px-4 py-3 flex items-center gap-3 mb-3 shadow-sm">
          <input
            ref={newInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setAddingNew(false);
                setNewName("");
              }
            }}
            placeholder="Tag name"
            className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
          />
          <Button size="sm" onClick={handleAdd} disabled={createTag.isPending || !newName.trim()}>
            Add
          </Button>
          <button
            onClick={() => {
              setAddingNew(false);
              setNewName("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <TagSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tags.length === 0 && !addingNew && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">No tags yet.</p>
          <p className="text-sm">Create tags to organise your collections.</p>
        </div>
      )}

      {/* Tag list */}
      {!isLoading && (
        <div className="flex flex-col gap-0.5">
          {tags.map((tag) => {
            const isEditing = editingId === tag.id;
            const isAssigning = assigningTagId === tag.id;
            return (
              <div key={tag.id}>
                <div
                  className={`group flex items-center gap-3 px-4 py-3 bg-white rounded-lg border transition-colors ${
                    isAssigning ? "border-violet-300" : "border-gray-200 hover:border-violet-200"
                  }`}>
                  {isEditing ? (
                    <>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 text-sm outline-none border-b border-violet-400 text-gray-900 bg-transparent pb-0.5"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={editTag.isPending || !editName.trim()}
                        className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors disabled:opacity-50">
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-900 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                        {tag.name}
                      </span>
                      <button
                        onClick={() => handleAssign(tag.id)}
                        className="text-xs text-gray-400 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                        Assign
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditName(tag.name);
                          setAssigningTagId(null);
                        }}
                        className="text-xs text-gray-400 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id, tag.name)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        Delete
                      </button>
                    </>
                  )}
                </div>
                {isAssigning && <AssignPanel tagId={tag.id} onClose={() => setAssigningTagId(null)} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
