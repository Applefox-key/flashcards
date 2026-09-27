import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-xs" />
      <div className="h-4 w-10 bg-gray-100 dark:bg-gray-700 rounded" />
      <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  );
}

interface AssignModalProps {
  tagId: number;
  tagName: string;
  onClose: () => void;
}

function AssignModal({ tagId, tagName, onClose }: AssignModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const setCollectionTags = useSetCollectionTags();
  const { data: categoriesData = [] } = useCategoriesWithCollections();

  const allCollections: Collection[] = categoriesData.flatMap((cat) => cat.collections ?? []);

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
      toast.success(t("tags_page.toast_assignments_saved"));
      onClose();
    } catch {
      toast.error(t("tags_page.toast_assignments_error"));
    } finally {
      setSaving(false);
    }
  }

  const hasCollections = allCollections.length > 0;

  return (
    <Modal open onClose={onClose} size="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("tags_page.assign_modal_title")}
          </h2>
          <p className="text-sm text-violet-500 dark:text-violet-400 font-medium mt-0.5">{tagName}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">
          ×
        </button>
      </div>

      {/* Scrollable list — fixed max-height so footer stays visible */}
      <div className="max-h-[55vh] overflow-y-auto -mx-6 px-6">
        {!hasCollections ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4">{t("tags_page.assign_no_collections")}</p>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
            {categoriesData.map((cat) => {
              const cols = cat.collections ?? [];
              if (cols.length === 0) return null;
              return (
                <div key={cat.id}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{cat.name}</p>
                  <div className="flex flex-col gap-1">
                    {cols.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked.has(col.id)}
                          onChange={() => toggle(col.id)}
                          className="accent-violet-500 w-4 h-4 shrink-0"
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200">{col.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — always visible below the list */}
      <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5">
          {t("tags_page.assign_cancel_btn")}
        </button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? t("tags_page.assign_saving_btn") : t("tags_page.assign_save_btn")}
        </Button>
      </div>
    </Modal>
  );
}

export function CollectionTagsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: tags = [], isLoading } = useCollectionTags();
  const createTag = useCreateCollectionTag();
  const editTag = useEditCollectionTag();
  const deleteTag = useDeleteCollectionTag();

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [assigningTag, setAssigningTag] = useState<{ id: number; name: string } | null>(null);

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
    if (!window.confirm(t("tags_page.confirm_delete", { name }))) return;
    deleteTag.mutate(id, {
      onSuccess: () => toast.success(t("tags_page.toast_deleted")),
    });
  }

  function handleAssign(tagId: number, tagName: string) {
    setAssigningTag({ id: tagId, name: tagName });
    setEditingId(null);
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="sticky sm:-top-6 z-20 bg-gray-200 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 px-5 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{t("tags_page.title")}</h1>
        {!addingNew && (
          <Button size="sm" onClick={() => setAddingNew(true)}>
            {t("tags_page.new_btn")}
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Inline add form */}
        {addingNew && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-violet-300 dark:border-violet-700 px-4 py-3 flex items-center gap-3 mb-3 shadow-sm">
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
              placeholder={t("tags_page.name_placeholder")}
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <Button size="sm" onClick={handleAdd} disabled={createTag.isPending || !newName.trim()}>
              {t("tags_page.add_btn")}
            </Button>
            <button
              onClick={() => {
                setAddingNew(false);
                setNewName("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {t("tags_page.cancel_btn")}
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
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-lg mb-1">{t("tags_page.empty_title")}</p>
            <p className="text-sm">{t("tags_page.empty_subtitle")}</p>
          </div>
        )}

        {/* Tag list */}
        {!isLoading && (
          <div className="flex flex-col gap-0.5">
            {tags.map((tag) => {
              const isEditing = editingId === tag.id;
              return (
                <div key={tag.id}>
                  <div className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-l-[5px] transition-all duration-150 border-gray-200 dark:border-gray-700 border-l-violet-200 dark:border-l-violet-800 hover:border-violet-200 dark:hover:border-violet-700 hover:border-l-violet-400 dark:hover:border-l-violet-500 hover:shadow-md hover:shadow-violet-500/10 hover:scale-[1.01]">
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
                          className="flex-1 text-sm outline-none border-b border-violet-400 text-gray-900 dark:text-gray-100 bg-transparent pb-0.5"
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={editTag.isPending || !editName.trim()}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium transition-colors disabled:opacity-50">
                          {t("tags_page.save_btn")}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                          {t("tags_page.cancel_btn")}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                          {tag.name}
                        </span>
                        <button
                          onClick={() => handleAssign(tag.id, tag.name)}
                          className="text-xs text-gray-400 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                          {t("tags_page.assign_btn")}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(tag.id);
                            setEditName(tag.name);
                          }}
                          className="text-xs text-gray-400 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                          {t("tags_page.edit_btn")}
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id, tag.name)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          {t("tags_page.delete_btn")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign modal — rendered outside the list */}
      {assigningTag && (
        <AssignModal
          tagId={assigningTag.id}
          tagName={assigningTag.name}
          onClose={() => setAssigningTag(null)}
        />
      )}
    </div>
  );
}
