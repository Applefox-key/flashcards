import { useState } from "react";
import { Link } from "react-router-dom";
import { usePlaylists, useDeletePlaylist } from "@/hooks/usePlaylistHooks";

import { PlaylistModal } from "./PlaylistModal";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { Playlist } from "@/types";

function PlaylistCard({
  playlist,
  onEdit,
  onDelete,
}: {
  playlist: Playlist;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onEdit}
          className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left">
          {playlist.name}
        </button>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
            Delete
          </button>
        </div>
      </div>

      {/* Collection names */}
      {playlist.collections.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No collections — click Edit to add some</p>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
            {playlist.collections.length} {playlist.collections.length === 1 ? "collection" : "collections"}
          </span>
          {playlist.collections.map((col) => (
            <div key={col.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
              <span className="flex-1">{col.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Play button */}
      {playlist.collections.length > 0 && (
        <div className="pt-1 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <Link to={`/play/${playlist.id}?src=pl`}>
            <Button size="sm" variant="secondary">
              ▶ Practice
            </Button>
          </Link>
          <Link to={`/playlists/${playlist.id}/cards`}>
            <Button size="sm" variant="secondary">
              View cards
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3" />
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
        ))}
      </div>
    </div>
  );
}

export function PlaylistsPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Playlist | undefined>();
  const toast = useToast();
  const deletePlaylist = useDeletePlaylist();

  const { data: playlists = [], isLoading } = usePlaylists();

  const visible = playlists.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const openEdit = (playlist: Playlist) => {
    setEditTarget(playlist);
    setModalOpen(true);
  };

  const handleDelete = (playlist: Playlist) => {
    if (!window.confirm(`Delete playlist "${playlist.name}"?`)) return;
    deletePlaylist.mutate(playlist.id, {
      onSuccess: () => toast.success("Playlist deleted"),
      onError: () => toast.error("Failed to delete playlist"),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">Playlists</h1>
        <Button size="sm" onClick={openCreate}>
          + New set
        </Button>
      </div>

      {playlists.length > 0 && (
        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search playlists..."
            className="w-full max-w-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <PlaylistSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && playlists.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg mb-2">No playlists yet</p>
          <Button size="sm" onClick={openCreate}>
            Create your first playlist
          </Button>
        </div>
      )}

      {!isLoading && playlists.length > 0 && visible.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 py-8 text-center">No playlists match "{search}"</p>
      )}

      {!isLoading && visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onEdit={() => openEdit(playlist)}
              onDelete={() => handleDelete(playlist)}
            />
          ))}
        </div>
      )}

      <PlaylistModal
        key={editTarget?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editPlaylist={editTarget}
      />
    </div>
  );
}
