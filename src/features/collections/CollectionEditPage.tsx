import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const [layout, setLayout] = useState<"standard" | "document">("standard");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

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
      setLayout(collection.layout ?? "standard");
    }
  }, [collection]);

  useEffect(() => {
    setTagIds(existingTags.map((t) => t.id));
  }, [existingTags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    editCollection.mutate(
      { id: colId, data: { name: name.trim(), note: note.trim() || undefined, categoryid, layout } },
      {
        onSuccess: () => {
          setCollectionTags.mutate(
            { collectionId: colId, tagIds },
            {
              onSuccess: () => {
                toast.success(t("edit_collection.toast_saved"));
                navigate(`/collections/${colId}`, { replace: true });
              },
              onError: () => toast.error(t("edit_collection.toast_tags_error")),
            },
          );
        },
        onError: () => toast.error(t("edit_collection.toast_save_error")),
      },
    );
  };

  const handleDeleteAllCards = () => {
    if (!window.confirm(t("edit_collection.confirm_clear_cards"))) return;
    deleteAllCards.mutate(colId, {
      onSuccess: () => toast.success(t("edit_collection.toast_cards_cleared")),
      onError: () => toast.error(t("edit_collection.toast_cards_error")),
    });
  };

  const handleDeleteCollection = () => {
    if (!window.confirm(t("edit_collection.confirm_delete_collection"))) return;
    deleteCollection.mutate(colId, {
      onSuccess: () => {
        toast.success(t("edit_collection.toast_collection_deleted"));
        navigate("/library");
      },
      onError: () => toast.error(t("edit_collection.toast_delete_error")),
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
    return <p className="text-gray-500 dark:text-gray-400">{t("edit_collection.not_found")}</p>;
  }

  return (
    <div className="max-w-lg m-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          {t("edit_collection.back")}
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("edit_collection.title")}</h1>
      </div>

      {/* Edit form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("edit_collection.title_label")} <span className="text-red-500">*</span>
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("edit_collection.note_label")}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("edit_collection.note_placeholder")}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("edit_collection.category_label")}
          </label>
          <CategorySelect value={categoryid} onChange={setCategoryid} />
        </div>

        <div className="flex flex-col gap-0">
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors w-fit">
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${advancedOpen ? "rotate-90" : ""}`}>
              <polyline points="4,2 8,6 4,10" />
            </svg>
            {t("edit_collection.advanced_settings")}
          </button>

          {advancedOpen && (
            <div className="flex flex-col gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("edit_collection.tags_label")}
                </label>
                <TagSelect value={tagIds} onChange={setTagIds} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("edit_collection.layout_label")}
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {(["standard", "document"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLayout(val)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                        layout === val
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}>
                      {val === "standard" ? (
                        <svg
                          width="48"
                          height="30"
                          viewBox="0 0 48 30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className={layout === val ? "text-indigo-500" : "text-gray-400"}>
                          <rect x="1" y="1" width="46" height="28" rx="4" />
                          <line x1="8" y1="10" x2="40" y2="10" />
                          <line x1="8" y1="16" x2="32" y2="16" />
                        </svg>
                      ) : (
                        <svg
                          width="28"
                          height="40"
                          viewBox="0 0 28 40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className={layout === val ? "text-indigo-500" : "text-gray-400"}>
                          <rect x="1" y="1" width="26" height="38" rx="4" />
                          <line x1="5" y1="9" x2="23" y2="9" />
                          <line x1="5" y1="15" x2="23" y2="15" />
                          <line x1="5" y1="21" x2="19" y2="21" />
                          <line x1="5" y1="27" x2="23" y2="27" />
                          <line x1="5" y1="33" x2="17" y2="33" />
                        </svg>
                      )}
                      <span
                        className={`font-medium text-xs ${layout === val ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
                        {t(`edit_collection.layout_${val}`)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {t(`edit_collection.layout_${val}_desc`)}
                      </span>
                    </button>
                  ))}
                </div>
                {layout === "document" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {t("edit_collection.layout_document_note")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={editCollection.isPending} disabled={!name.trim()}>
            {t("edit_collection.save_btn")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t("edit_collection.cancel_btn")}
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 p-5">
        <button
          type="button"
          onClick={() => setDangerOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors w-full text-left">
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 shrink-0 ${dangerOpen ? "rotate-90" : ""}`}>
            <polyline points="4,2 8,6 4,10" />
          </svg>
          {t("edit_collection.danger_zone")}
        </button>

        {dangerOpen && (
          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-red-100 dark:border-red-900/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {t("edit_collection.delete_cards_title")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("edit_collection.delete_cards_desc")}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAllCards}
                loading={deleteAllCards.isPending}
                type="button">
                {t("edit_collection.delete_cards_btn")}
              </Button>
            </div>
            <div className="border-t border-red-100 dark:border-red-900/40 pt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {t("edit_collection.delete_collection_title")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("edit_collection.delete_collection_desc")}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteCollection}
                loading={deleteCollection.isPending}
                type="button">
                {t("edit_collection.delete_btn")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
