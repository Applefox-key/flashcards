import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCategories, useCreateCategory, useEditCategory, useDeleteCategory } from "@/hooks/useCategoryHooks";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/Button";

// ── Skeleton ─────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-xs" />
      <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded-full" />
      <div className="h-4 w-10 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export function CategoriesPage() {
  const toast = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const { data: withCollections = [] } = useCategoriesWithCollections();
  const createCategory = useCreateCategory();
  const editCategory = useEditCategory();
  const deleteCategory = useDeleteCategory();

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew) newInputRef.current?.focus();
  }, [addingNew]);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  function getCollectionCount(id: number) {
    return withCollections.find((c) => c.id === id)?.collections.length ?? 0;
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    createCategory.mutate(name, {
      onSuccess: () => {
        setNewName("");
        setAddingNew(false);
      },
    });
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || (e.key === "Enter" && e.ctrlKey)) handleAdd();
    if (e.key === "Escape") {
      setAddingNew(false);
      setNewName("");
    }
  }

  function startEdit(id: number, name: string) {
    setEditingId(id);
    setEditName(name);
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    editCategory.mutate(
      { id: editingId, name },
      {
        onSuccess: () => setEditingId(null),
      },
    );
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") setEditingId(null);
  }

  function handleDelete(id: number, name: string) {
    const count = getCollectionCount(id);
    const msg =
      count === 0
        ? `Delete category "${name}"?`
        : `Delete "${name}"?\nIts ${count} collection(s) will become uncategorized.`;
    if (!window.confirm(msg)) return;
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success("Category deleted"),
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        {!addingNew && (
          <Button size="sm" onClick={() => setAddingNew(true)}>
            + New category
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {addingNew && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-indigo-300 dark:border-indigo-600 px-4 py-3 flex items-center gap-3 mb-3 shadow-sm">
          <input
            ref={newInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="Category name"
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Button size="sm" onClick={handleAdd} disabled={createCategory.isPending || !newName.trim()}>
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
            <CategorySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categories.length === 0 && !addingNew && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg mb-2">No categories yet.</p>
          <p className="text-sm">Create your first one.</p>
        </div>
      )}

      {/* Category list */}
      {!isLoading && (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => {
            const count = getCollectionCount(cat.id);
            const isEditing = editingId === cat.id;

            return (
              <div
                key={cat.id}
                className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-600 transition-colors">
                {isEditing ? (
                  <>
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className="flex-1 text-sm outline-none border-b border-indigo-400 text-gray-900 dark:text-gray-100 bg-transparent pb-0.5"
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={editCategory.isPending || !editName.trim()}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors disabled:opacity-50">
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
                    <Link
                      to={`/categories/${cat.id}`}
                      className="flex-1 font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </Link>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{count} collections</span>
                    <button
                      onClick={() => startEdit(cat.id, cat.name)}
                      className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      Delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
