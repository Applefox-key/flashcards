import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { usePlaylist, usePlaylistContent } from "@/hooks/usePlaylistHooks";

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-28 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
    </div>
  );
}

export function PlaylistCardsPage() {
  const { id } = useParams<{ id: string }>();
  const playlistId = Number(id);

  const { data: playlistRaw, isLoading: playlistLoading } = usePlaylist(playlistId);
  const { data: cards = [], isLoading: cardsLoading } = usePlaylistContent(playlistId);

  const isLoading = playlistLoading || cardsLoading;

  // API may return array or object
  const playlist = Array.isArray(playlistRaw) ? playlistRaw[0] : playlistRaw;

  const sorted = useMemo(
    () =>
      [...cards].sort(
        (a, b) =>
          (a.collectionname ?? "").localeCompare(b.collectionname ?? "") ||
          a.question.localeCompare(b.question),
      ),
    [cards],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          to="/playlists"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0">
          ← Playlists
        </Link>
        {playlistLoading ? (
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{playlist?.name}</h1>
            {!isLoading && (
              <span className="text-sm text-gray-400 dark:text-gray-500">{sorted.length} cards</span>
            )}
          </>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-16">No cards in this playlist</p>
      )}

      {!isLoading && sorted.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-[38%]">
                    Question
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-[38%]">
                    Answer
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 w-[24%]">
                    Collection
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sorted.map((card) => (
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

          {/* Mobile: card list */}
          <div className="sm:hidden flex flex-col gap-2">
            {sorted.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">Question</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">{card.question}</p>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">Answer</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{card.answer}</p>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                  {card.collectionname ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
