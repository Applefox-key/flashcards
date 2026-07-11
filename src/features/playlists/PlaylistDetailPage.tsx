import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlaylist, useDeletePlaylist, useEditPlaylist } from "@/hooks/usePlaylistHooks";
import { PlaylistModal } from "./PlaylistModal";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/useToast";
import type { PlaylistCollection } from "@/types";
import { PiShootingStarThin } from "react-icons/pi";

export function PlaylistDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const playlistId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);

  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const deletePlaylist = useDeletePlaylist();
  const editPlaylist = useEditPlaylist();

  const handleRemoveCollection = (col: PlaylistCollection) => {
    if (!playlist) return;
    const newIds = playlist.collections.filter((c) => c.id !== col.id).map((c) => c.id);
    editPlaylist.mutate(
      { id: playlistId, data: { name: playlist.name, listIds: newIds } },
      {
        onSuccess: () => toast.success(t('playlists.detail_toast_removed', { name: col.name })),
        onError: () => toast.error(t('playlists.detail_toast_remove_error')),
      },
    );
  };

  const handleDelete = () => {
    if (!window.confirm(t('playlists.detail_confirm_delete'))) return;
    deletePlaylist.mutate(playlistId, {
      onSuccess: () => {
        toast.success(t('playlists.detail_toast_deleted'));
        navigate("/playlists");
      },
      onError: () => toast.error(t('playlists.detail_toast_delete_error')),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white rounded-lg border border-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div>
        <p className="text-gray-500">{t('playlists.detail_not_found')}</p>
        <Link to="/playlists" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          {t('playlists.detail_back_to_all')}
        </Link>
      </div>
    );
  }

  const colCount = playlist.collections.length;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate("/playlists")} className="text-sm text-gray-500 hover:text-gray-700">
            {t('playlists.detail_back')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{playlist.name}</h1>
          <span className="text-sm text-gray-400">
            {t(colCount === 1 ? 'playlists.detail_collections_singular' : 'playlists.detail_collections_plural', { count: colCount })}
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            {t('playlists.detail_edit_btn')}
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete} loading={deletePlaylist.isPending}>
            {t('playlists.detail_delete_btn')}
          </Button>
        </div>
      </div>

      {/* Game launch bar */}
      {playlist.collections.length > 0 && (
        <div className="mb-6">
          <Link to={`/play/${playlistId}?src=pl`}>
            <Button size="sm">
              <PiShootingStarThin className="w-4 h-4 mr-2" /> {t('playlists.detail_practice_btn')}
            </Button>
          </Link>
        </div>
      )}

      {/* Collections list */}
      {playlist.collections.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">{t('playlists.detail_empty_no_cols')}</p>
          <button onClick={() => setEditOpen(true)} className="text-sm text-indigo-600 hover:underline">
            {t('playlists.detail_add_collections')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {playlist.collections.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 group">
              <Link
                to={`/collections/${col.id}`}
                className="font-medium text-gray-900 flex-1 hover:text-indigo-600 transition-colors">
                {col.name}
              </Link>
              {col.isMy === 0 && (
                <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                  {t('playlists.detail_shared')}
                </span>
              )}
              <button
                onClick={() => handleRemoveCollection(col)}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xl leading-none w-6 text-center"
                title={t('playlists.detail_remove_title')}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <PlaylistModal open={editOpen} onClose={() => setEditOpen(false)} editPlaylist={playlist} />
    </div>
  );
}
