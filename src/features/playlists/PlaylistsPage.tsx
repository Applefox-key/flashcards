import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlaylists, useDeletePlaylist, useEditPlaylist, usePlaylistContent } from "@/hooks/usePlaylistHooks";
import { useCollections } from "@/hooks/useCollectionHooks";
import { PlaylistModal } from "./PlaylistModal";
import { Button } from "@/components/Button";
import { MobileFab } from "@/components/MobileFab";
import { CollectionPicker } from "@/components/CollectionPicker";
import { useToast } from "@/hooks/useToast";
import { useLibraryUiStore } from "@/store/libraryUiStore";
import type { Playlist, PlaylistCollection, Collection } from "@/types";
import { PiShootingStarThin } from "react-icons/pi";
import { StudyDot } from "@/components/StudyDot";

const MAX_SLOTS = 10;

// ── Skeleton ──────────────────────────────────────────────────────────────

function PlaylistSkeleton() {
  return (
    <div className="animate-pulse flex gap-0 min-h-0">
      <div className="hidden sm:flex flex-col w-52 shrink-0 gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: MAX_SLOTS }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Left panel item ───────────────────────────────────────────────────────

function PlaylistListItem({
  playlist,
  selected,
  onClick,
}: {
  playlist: Playlist;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const count = playlist.collections.length;
  return (
    <button
      onClick={onClick}
      className={`text-left w-full px-3 py-2.5 rounded-lg transition-colors ${
        selected
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}>
      <div className="font-medium text-sm leading-snug truncate">{playlist.name}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {count === 0
          ? t("playlists.item_no_collections")
          : t(count === 1 ? "playlists.item_collections_singular" : "playlists.item_collections_plural", { count })}
      </div>
    </button>
  );
}

// ── Tiles ─────────────────────────────────────────────────────────────────

function ViewTile({
  col,
  index,
  onEmptyClick,
  resolveStats,
}: {
  col?: PlaylistCollection;
  index: number;
  onEmptyClick: () => void;
  resolveStats: (id: number) => Collection["stats"];
}) {
  const navigate = useNavigate();

  if (col) {
    return (
      <div
        onClick={() => navigate(`/collections/${col.id}`)}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3
                   flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1
                   cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all sm:min-h-[5rem]">
        <div className="flex items-center justify-between gap-1.5 sm:flex-none min-w-0 sm:w-full">
          <span className="text-xs text-gray-300 dark:text-gray-600 select-none shrink-0 w-5 sm:w-auto text-right sm:text-left">
            {index + 1}
          </span>
          <StudyDot stats={resolveStats(col.id)} showFallback className="w-2 h-2 shrink-0" />
        </div>
        <div className="flex items-center gap-1.5 flex-1 sm:flex-none min-w-0">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug ">{col.name}</span>
        </div>
        {col.isMy === 0 && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 sm:mt-auto">shared</span>}
      </div>
    );
  }

  return (
    <div
      onClick={onEmptyClick}
      className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3
                 flex items-center gap-2 sm:flex-col sm:items-center sm:justify-center sm:gap-1
                 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all sm:min-h-[5rem]">
      <span className="text-xs text-gray-300 dark:text-gray-600 select-none shrink-0 w-5 sm:w-auto text-right sm:text-center">
        {index + 1}
      </span>
      <span className="text-base sm:text-xl leading-none text-gray-200 dark:text-gray-700">+</span>
    </div>
  );
}

function EditTile({
  id,
  index,
  isActive,
  resolveName,
  resolveStats,
  onRemove,
  onActivate,
}: {
  id?: number;
  index: number;
  isActive: boolean;
  resolveName: (id: number) => string;
  resolveStats: (id: number) => Collection["stats"];
  onRemove: () => void;
  onActivate: () => void;
}) {
  if (id != null) {
    return (
      <div
        className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3
                      flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1 sm:min-h-[5rem]">
        <span className="text-xs text-gray-300 dark:text-gray-600 select-none shrink-0 w-5 sm:w-auto text-right sm:text-left">
          {index + 1}
        </span>
        <div className="flex items-center gap-1.5 flex-1 sm:flex-none min-w-0 pr-5 sm:pr-5">
          <StudyDot stats={resolveStats(id)} showFallback className="w-2 h-2 shrink-0" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug truncate">
            {resolveName(id)}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-2 sm:top-2 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors text-lg leading-none w-6 text-center">
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onActivate}
      className={`rounded-xl border-2 border-dashed px-3 py-2 sm:py-3
                  flex items-center gap-2 sm:flex-col sm:items-center sm:justify-center sm:gap-1
                  cursor-pointer transition-all sm:min-h-[5rem] ${
                    isActive
                      ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                  }`}>
      <span
        className={`text-xs select-none shrink-0 w-5 sm:w-auto text-right sm:text-center ${isActive ? "text-indigo-400" : "text-gray-300 dark:text-gray-600"}`}>
        {index + 1}
      </span>
      <span
        className={`text-base sm:text-xl leading-none ${isActive ? "text-indigo-400" : "text-gray-200 dark:text-gray-700"}`}>
        +
      </span>
    </div>
  );
}

// ── Right panel — holds all edit state, reset via key prop ────────────────

function PlaylistPanel({
  playlist,
  allCollections,
  onDelete,
  deleteLoading,
  onClose,
}: {
  playlist: Playlist;
  allCollections: Collection[];
  onDelete: () => void;
  deleteLoading: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<"collections" | "cards">("collections");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [localIds, setLocalIds] = useState<(number | undefined)[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const editPlaylistMutation = useEditPlaylist();
  const { data: cards = [], isLoading: cardsLoading } = usePlaylistContent(playlist.id);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handler(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setMobileMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  function enterEditMode(slot?: number) {
    setEditName(playlist.name);
    const ids: (number | undefined)[] = Array.from({ length: MAX_SLOTS });
    playlist.collections.forEach((c, i) => {
      ids[i] = c.id;
    });
    setLocalIds(ids);
    setIsEditing(true);
    if (slot !== undefined) setActiveSlot(slot);
  }

  function exitEditMode() {
    setIsEditing(false);
    setActiveSlot(null);
  }

  function handleSave() {
    if (!editName.trim()) return;
    const listIds = localIds.filter((id): id is number => id != null);
    editPlaylistMutation.mutate(
      { id: playlist.id, data: { name: editName.trim(), listIds } },
      {
        onSuccess: () => {
          toast.success(t("playlists.panel_toast_saved"));
          exitEditMode();
        },
        onError: () => toast.error(t("playlists.panel_toast_save_error")),
      },
    );
  }

  function removeSlot(i: number) {
    setLocalIds((prev) => {
      const next = [...prev];
      next[i] = undefined;
      return next;
    });
  }

  function pickCollection(id: number) {
    if (activeSlot === null) return;
    const next = [...localIds];
    next[activeSlot] = id;
    setLocalIds(next);
    let nextEmpty = -1;
    for (let i = activeSlot + 1; i < MAX_SLOTS; i++) {
      if (next[i] == null) {
        nextEmpty = i;
        break;
      }
    }
    setActiveSlot(nextEmpty !== -1 ? nextEmpty : null);
  }

  function resolveCollectionName(id: number): string {
    const col = allCollections.find((c) => c.id === id) ?? playlist.collections.find((c) => c.id === id);
    return col?.name ?? `Collection #${id}`;
  }

  function resolveCollectionStats(id: number): Collection["stats"] {
    return allCollections.find((c) => c.id === id)?.stats;
  }

  const filledCount = localIds.filter(Boolean).length;

  const sortedCards = useMemo(
    () =>
      [...cards].sort(
        (a, b) =>
          (a.collectionname ?? "").localeCompare(b.collectionname ?? "") || a.question.localeCompare(b.question),
      ),
    [cards],
  );

  return (
    <>
      {!isEditing && (
        <>
          <div className="sticky -top-3 sm:-top-6 z-10 bg-gray-50 dark:bg-gray-900 -mx-3 px-3 sm:-mx-6 sm:px-6 py-2 mb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            {/* Practice — always visible when collections exist */}
            {playlist.collections.length > 0 && (
              <Link to={`/play/${playlist.id}?src=pl`}>
                <Button size="sm" variant="primary">
                  <PiShootingStarThin className="w-4 h-4 mr-2" /> {t("playlists.panel_practice")}
                </Button>
              </Link>
            )}
            {/* Desktop: Edit */}
            <Button size="sm" variant="secondary" onClick={() => enterEditMode()} className="hidden sm:inline-flex">
              {t("playlists.panel_edit")}
            </Button>
            {/* Desktop: Delete */}
            <Button
              size="sm"
              variant="danger"
              onClick={onDelete}
              loading={deleteLoading}
              className="hidden sm:inline-flex">
              {t("playlists.panel_delete")}
            </Button>
            {/* Desktop: Close */}
            <Button size="sm" variant="secondary" onClick={onClose} className="hidden sm:inline-flex">
              {t("playlists.panel_close")}
            </Button>
            {/* View toggle */}
            <div className="ml-auto flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setView("collections")}
                className={`px-3 py-1.5 transition-colors ${
                  view === "collections"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                {t("playlists.panel_view_collections")}
              </button>
              <button
                onClick={() => setView("cards")}
                className={`px-3 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${
                  view === "cards"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                {t("playlists.panel_view_cards")}
                {!cardsLoading && cards.length > 0 && <span className="ml-1 opacity-70">{cards.length}</span>}
              </button>
            </div>
            {/* Mobile: "..." context menu */}
            <div ref={mobileMenuRef} className="relative sm:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none">
                ···
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 top-9 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      enterEditMode();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    {t("playlists.panel_edit")}
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    {t("playlists.panel_delete")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {view === "collections" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                <ViewTile
                  key={i}
                  col={playlist.collections[i]}
                  index={i}
                  onEmptyClick={() => enterEditMode(i)}
                  resolveStats={resolveCollectionStats}
                />
              ))}
            </div>
          )}

          {view === "cards" && (
            <>
              {cardsLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="w-24 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {!cardsLoading && sortedCards.length === 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 py-16">{t("playlists.panel_no_cards")}</p>
              )}

              {!cardsLoading && sortedCards.length > 0 && (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-[38%]">
                            {t("playlists.panel_col_question")}
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-[38%]">
                            {t("playlists.panel_col_answer")}
                          </th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-[24%]">
                            {t("playlists.panel_col_collection")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedCards.map((card) => (
                          <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100 align-top">{card.question}</td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 align-top">{card.answer}</td>
                            <td className="px-4 py-3 align-top">
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {card.collectionname ?? "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="sm:hidden flex flex-col gap-2">
                    {sortedCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                          {t("playlists.panel_col_question")}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">{card.question}</p>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                          {t("playlists.panel_col_answer")}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{card.answer}</p>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                          {card.collectionname ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {isEditing && (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={t("playlists.panel_name_placeholder")}
              className="flex-1 min-w-0 sm:max-w-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <Button size="sm" onClick={handleSave} loading={editPlaylistMutation.isPending} disabled={!editName.trim()}>
              {t("playlists.panel_save")}
            </Button>
            <Button size="sm" variant="secondary" onClick={exitEditMode}>
              {t("playlists.panel_cancel")}
            </Button>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                filledCount === MAX_SLOTS
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
              }`}>
              {filledCount} / {MAX_SLOTS}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: MAX_SLOTS }).map((_, i) => (
              <EditTile
                key={i}
                id={localIds[i]}
                index={i}
                isActive={activeSlot === i}
                resolveName={resolveCollectionName}
                resolveStats={resolveCollectionStats}
                onRemove={() => removeSlot(i)}
                onActivate={() => setActiveSlot(i)}
              />
            ))}
          </div>

          {activeSlot !== null && (
            <div className="relative mt-5">
              <CollectionPicker
                activeSlot={activeSlot}
                selectedIds={localIds}
                allCollections={allCollections}
                onPick={pickCollection}
                onClose={() => setActiveSlot(null)}
                searchRef={searchRef}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function PlaylistsPage() {
  const { t } = useTranslation();
  const { playlists: playlistsUi, setPlaylists } = useLibraryUiStore();
  const selectedId = playlistsUi.selectedId;
  const setSelectedId = (id: number | null) => setPlaylists({ selectedId: id });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const toast = useToast();
  const deletePlaylist = useDeletePlaylist();

  const { data: playlists = [], isLoading } = usePlaylists();
  const { data: allCollections = [] } = useCollections();

  const effectiveId = selectedId !== null && playlists.some((p) => p.id === selectedId) ? selectedId : null;

  const selected = playlists.find((p) => p.id === effectiveId) ?? null;

  const handleDelete = (playlist: Playlist) => {
    if (!window.confirm(t("playlists.confirm_delete", { name: playlist.name }))) return;
    deletePlaylist.mutate(playlist.id, {
      onSuccess: () => {
        toast.success(t("playlists.toast_deleted"));
        setSelectedId(null);
      },
      onError: () => toast.error(t("playlists.toast_delete_error")),
    });
  };

  return (
    <div>
      <div className="hidden sm:flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("playlists.title")}</h1>
        {selected ? (
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 truncate max-w-xs">{selected.name}</h1>
        ) : (
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            {t("playlists.new_btn")}
          </Button>
        )}
      </div>

      {isLoading && <PlaylistSkeleton />}

      {!isLoading && playlists.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg mb-2">{t("playlists.empty_title")}</p>
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            {t("playlists.create_first_btn")}
          </Button>
        </div>
      )}

      {!isLoading && playlists.length > 0 && (
        <>
          {/* Mobile dropdown */}
          <div className="sm:hidden pt-3 mb-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
              {t("playlists.mobile_label")}
            </span>
            <select
              value={effectiveId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:[color-scheme:dark]">
              {effectiveId === null && (
                <option value="" disabled>
                  {t("playlists.mobile_placeholder")}
                </option>
              )}
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.collections.length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-0 min-h-0">
            {/* Left: playlist list */}
            <div className="hidden sm:flex flex-col w-52 shrink-0 gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-2 mr-4">
              {playlists.map((p) => (
                <PlaylistListItem
                  key={p.id}
                  playlist={p}
                  selected={p.id === effectiveId}
                  onClick={() => setSelectedId(p.id)}
                />
              ))}
            </div>

            {/* Right: panel (key resets edit state on playlist switch) */}
            <div className="flex-1 min-w-0">
              {selected ? (
                <PlaylistPanel
                  key={selected.id}
                  playlist={selected}
                  allCollections={allCollections}
                  onDelete={() => handleDelete(selected)}
                  deleteLoading={deletePlaylist.isPending}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-8 py-12">
                  <div className="text-4xl mb-4 select-none">🎵</div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("playlists.select_hint_title")}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed">
                    {t("playlists.select_hint_desc")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <MobileFab onClick={() => setCreateModalOpen(true)} label={t("playlists.fab_label")} />
      <PlaylistModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}
