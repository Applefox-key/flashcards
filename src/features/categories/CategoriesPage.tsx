import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCategories, useCreateCategory, useEditCategory, useDeleteCategory } from "@/hooks/useCategoryHooks";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/Button";
import { MobileFab } from "@/components/MobileFab";
import { categoriesApi, collectionsApi } from "@/api";

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
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const { data: withCollections = [] } = useCategoriesWithCollections();
  const createCategory = useCreateCategory();
  const editCategory = useEditCategory();
  const deleteCategory = useDeleteCategory();

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

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
        ? t('categories_page.confirm_delete_no_collections', { name })
        : t('categories_page.confirm_delete_with_collections', { name, count });
    if (!window.confirm(msg)) return;
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success(t('categories_page.toast_deleted')),
    });
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error(t('categories_page.toast_invalid_json'));
      return;
    }

    const data = parsed as { version?: number; categoryName?: string; collections?: { name: string; note?: string; cards: { question: string; answer: string; note?: string }[] }[] };
    if (!data.categoryName || !Array.isArray(data.collections)) {
      toast.error(t('categories_page.toast_invalid_format'));
      return;
    }

    if (!window.confirm(t('categories_page.confirm_restore', { name: data.categoryName, count: data.collections.length }))) return;

    setIsRestoring(true);
    try {
      const { id: categoryId } = await categoriesApi.create(data.categoryName);
      for (const col of data.collections) {
        await collectionsApi.createWithCards({
          name: col.name,
          note: col.note,
          categoryid: categoryId,
          content: col.cards ?? [],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t('categories_page.toast_restored', { name: data.categoryName, count: data.collections.length }));
    } catch {
      toast.error(t('categories_page.toast_restore_failed'));
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="pt-3 sm:pt-0">
      {/* Header */}
      <div className="hidden sm:flex items-center sticky sm:-top-6 z-20 bg-gray-50 dark:bg-gray-900 justify-between mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">{t('categories_page.title')}</h1>
        <div className="flex items-center gap-2">
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleRestoreFile}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => restoreInputRef.current?.click()}
            disabled={isRestoring}>
            {isRestoring ? t('categories_page.restoring') : t('categories_page.restore_btn')}
          </Button>
          {!addingNew && (
            <Button size="sm" onClick={() => setAddingNew(true)}>
              {t('categories_page.new_btn')}
            </Button>
          )}
        </div>
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
            placeholder={t('categories_page.name_placeholder')}
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Button size="sm" onClick={handleAdd} disabled={createCategory.isPending || !newName.trim()}>
            {t('categories_page.add_btn')}
          </Button>
          <button
            onClick={() => {
              setAddingNew(false);
              setNewName("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {t('categories_page.cancel_btn')}
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
          <p className="text-lg mb-2">{t('categories_page.empty_title')}</p>
          <p className="text-sm">{t('categories_page.empty_subtitle')}</p>
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
                      {t('categories_page.save_btn')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      {t('categories_page.cancel_btn')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/categories/${cat.id}`}
                      className="flex-1 font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </Link>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {t('categories_page.count_collections', { count })}
                    </span>
                    <button
                      onClick={() => startEdit(cat.id, cat.name)}
                      className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
                      {t('categories_page.edit_btn')}
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      {t('categories_page.delete_btn')}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <MobileFab onClick={() => setAddingNew(true)} label={t('categories_page.fab_label')} />
    </div>
  );
}
