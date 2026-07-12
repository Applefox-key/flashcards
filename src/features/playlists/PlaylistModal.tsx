import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { collectionsApi } from "@/api";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { StudyDot } from "@/components/StudyDot";
import { CollectionPicker } from "@/components/CollectionPicker";
import { useToast } from "@/hooks/useToast";
import { useCreatePlaylist, useEditPlaylist } from "@/hooks/usePlaylistHooks";
import { useCollections } from "@/hooks/useCollectionHooks";
import { useIsDemo } from "@/hooks/useIsDemo";
import type { Playlist } from "@/types";

const MAX_SLOTS = 10;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass to edit an existing playlist; omit to create a new one */
  editPlaylist?: Playlist;
}

export function PlaylistModal({ open, onClose, editPlaylist }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<(number | undefined)[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const createPlaylist = useCreatePlaylist();
  const editPlaylistMutation = useEditPlaylist();

  // Sync form when target changes (or modal opens)
  useEffect(() => {
    setName(editPlaylist?.name ?? "");
    setSelectedIds(editPlaylist?.collections.map((c) => c.id) ?? []);
    setActiveSlot(null);
  }, [editPlaylist, open]);

  const isDemo = useIsDemo();
  const demoCollections = useCollections();
  const realCollections = useQuery({
    queryKey: ["collections"],
    queryFn: collectionsApi.getAll,
    enabled: open && !isDemo,
  });
  const allCollections = useMemo(
    () => (isDemo ? (demoCollections.data ?? []) : (realCollections.data ?? [])),
    [isDemo, demoCollections.data, realCollections.data],
  );

  const handleSave = () => {
    if (!name.trim()) return;
    const listIds = selectedIds.filter(Boolean) as number[];
    if (editPlaylist) {
      editPlaylistMutation.mutate(
        { id: editPlaylist.id, data: { name: name.trim(), listIds } },
        {
          onSuccess: () => {
            toast.success(t("playlists.modal_toast_saved"));
            onClose();
          },
          onError: () => toast.error(t("playlists.modal_toast_save_error")),
        },
      );
    } else {
      createPlaylist.mutate(
        { name: name.trim(), listIds },
        {
          onSuccess: () => {
            toast.success(t("playlists.modal_toast_created"));
            onClose();
          },
          onError: () => toast.error(t("playlists.modal_toast_create_error")),
        },
      );
    }
  };

  const isPending = createPlaylist.isPending || editPlaylistMutation.isPending;
  const filledCount = selectedIds.filter(Boolean).length;

  function removeSlot(i: number) {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[i] = undefined;
      return next;
    });
  }

  function pickCollection(id: number) {
    if (activeSlot === null) return;
    const next = [...selectedIds];
    next[activeSlot] = id;
    setSelectedIds(next);
    // Find next empty slot after current
    let nextEmpty = -1;
    for (let i = activeSlot + 1; i < MAX_SLOTS; i++) {
      if (next[i] == null) {
        nextEmpty = i;
        break;
      }
    }
    setActiveSlot(nextEmpty !== -1 ? nextEmpty : null);
  }

  function resolveCollection(id: number) {
    return allCollections.find((c) => c.id === id);
  }

  function resolveCollectionName(id: number): string {
    return (
      resolveCollection(id)?.name ?? editPlaylist?.collections.find((c) => c.id === id)?.name ?? `Collection #${id}`
    );
  }

  const slotRows = Array.from({ length: MAX_SLOTS }, (_, i) => {
    const id = selectedIds[i];
    const isFilled = id != null;
    const isActive = activeSlot === i;

    if (isFilled) {
      return (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
          <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
          <StudyDot stats={resolveCollection(id)?.stats} showFallback className="w-2 h-2 shrink-0" />
          <span className="flex-1 text-gray-800 dark:text-gray-200">{resolveCollectionName(id)}</span>
          <button
            onClick={() => removeSlot(i)}
            className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none w-6 text-center">
            ×
          </button>
        </div>
      );
    }
    return (
      <div
        key={i}
        onClick={() => setActiveSlot(i)}
        className={
          isActive
            ? "flex items-center gap-3 px-3 py-2 rounded-lg border border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-sm cursor-pointer"
            : "flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        }>
        <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
        <span className="text-sm text-gray-400 dark:text-gray-500 italic">{t("playlists.modal_slot_add")}</span>
      </div>
    );
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editPlaylist ? t("playlists.modal_title_edit") : t("playlists.modal_title_create")}
      size={activeSlot !== null ? "xl" : "lg"}>
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("playlists.modal_name_label")} <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder={t("playlists.modal_name_placeholder")}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Collections */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("playlists.modal_collections_label")}
            </label>
            <span
              className={
                filledCount === MAX_SLOTS
                  ? "text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium"
                  : "text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium"
              }>
              {filledCount} / {MAX_SLOTS}
            </span>
          </div>

          <div className="relative">
            <div
              className={
                activeSlot !== null ? "grid grid-cols-1 sm:grid-cols-2 gap-4 items-start" : "grid grid-cols-1"
              }>
              {/* Left column: slots list */}
              <div className="flex flex-col gap-1.5">{slotRows}</div>

              {/* Right column on desktop / mobile overlay */}
              {activeSlot !== null && (
                <CollectionPicker
                  activeSlot={activeSlot}
                  selectedIds={selectedIds}
                  allCollections={allCollections}
                  onPick={pickCollection}
                  onClose={() => setActiveSlot(null)}
                  searchRef={searchRef}
                />
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t("playlists.modal_max_hint", { max: MAX_SLOTS })}
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button onClick={handleSave} loading={isPending} disabled={!name.trim()}>
            {editPlaylist ? t("playlists.modal_save_btn") : t("playlists.modal_create_btn")}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t("playlists.modal_cancel_btn")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
