import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowForward } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { collectionsApi } from "@/api";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useDemoStore } from "@/demo/demoStore";
import { useCategoriesWithCollections } from "@/hooks/useCategoryHooks";
import { useCollections, useCollectionsPaginated } from "@/hooks/useCollectionHooks";
import { useCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { useLibraryUiStore } from "@/store/libraryUiStore";
import { CollectionProgressBar } from "@/components/CollectionProgressBar";
import { StudyDot, getAccentBorderClass } from "@/components/StudyDot";
import { MobileFab } from "@/components/MobileFab";
import type { Collection, CollectionTag, CollectionStats } from "@/types";
import { PiShootingStarThin } from "react-icons/pi";
import { SideDrawer } from "@/components/SideDrawer";
import { CiImageOn } from "react-icons/ci";
import { HiOutlineBookmarkSquare } from "react-icons/hi2";
import { useRecentCollectionsStore } from "@/store/recentCollectionsStore";
import { MdAccessTime } from "react-icons/md";

const ALL_LIMIT = 30;

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-2 mt-0.5">
        <div className="grid grid-cols-2 gap-1">
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-auto pt-1">
        <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function CollectionCard({
  collection,
  search,
  tags,
  compact,
}: {
  collection: Collection;
  search: string;
  tags: CollectionTag[];
  compact: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isDemo = useIsDemo();
  const demoContent = useDemoStore((s) => s.content[collection.id]);
  const demoCardPreviews = (demoContent ?? [])
    .slice(0, 3)
    .map((c) => ({ id: c.id, question: c.question, answer: c.answer }));

  const { data, isLoading } = useQuery({
    queryKey: ["collections", collection.id, "preview"],
    queryFn: () => collectionsApi.getPreview(collection.id, 3),
    staleTime: 5 * 60 * 1000,
    enabled: !isDemo,
    select: (d) => {
      const raw = d as unknown as Array<{
        collection: { stats?: CollectionStats };
        content: { id: number; question: string; answer: string }[];
      }>;
      return {
        cards: raw[0]?.content ?? [],
        stats: raw[0]?.collection?.stats,
      };
    },
  });

  const preview = isDemo ? { cards: demoCardPreviews, stats: undefined } : data;

  if (!isDemo && isLoading) return <CollectionCardSkeleton />;

  const stats = preview?.stats;
  const cardCount = stats ? stats.toLearn + stats.inProgress + stats.learned : (collection.cardCount ?? 0);
  const learnedPct = stats && cardCount > 0 ? Math.round((stats.learned / cardCount) * 100) : null;

  return (
    <div
      onClick={() => navigate(`/collections/${collection.id}`)}
      className={`group bg-white relative dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-l-[5px] ${getAccentBorderClass(stats)} p-4 flex flex-col gap-2 cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/15 hover:scale-[1.025] hover:z-10 hover:ring-2 hover:ring-indigo-300/60 dark:hover:ring-indigo-600/50 transition-all duration-150`}>
      <StudyDot stats={stats} className="absolute top-3 right-3 w-3.5 h-3.5 shadow-sm" />

      {/* Name + count */}
      <div className="pr-6">
        <div className="font-semibold text-gray-800 dark:text-gray-100 text-md uppercase tracking-wide truncate">
          {highlight(collection.name, search)}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {t("collections.card_count", { count: cardCount })}
          </span>
          {!!collection.isFavorite && <span className="text-base text-rose-400">♥</span>}
          {!!collection.isPublic && <span className="text-sm leading-none">🔓</span>}
          {collection.layout === "document" && <span className="text-xs text-teal-500 dark:text-teal-400">📄</span>}
        </div>
      </div>

      {/* Progress bar with % */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <CollectionProgressBar stats={stats} variant="minimal" size="md" />
        </div>
        {learnedPct !== null && (
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 w-8 text-right">{learnedPct}%</span>
        )}
      </div>

      {/* Note */}
      {!compact && !!collection.note && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{collection.note}</p>
      )}

      {/* Hover popup: first 3 cards */}
      {!compact && preview && preview.cards.length > 0 && (
        <div className="absolute top-full left-0 mt-1.5 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 w-full pointer-events-none">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-700/70 shadow-xl shadow-indigo-500/15 dark:shadow-indigo-500/10 p-3">
            <div className="flex flex-col gap-1.5">
              {preview.cards.map((card) => (
                <div key={card.id} className="grid grid-cols-2 gap-2 text-xs">
                  <span className="truncate text-gray-700 dark:text-gray-200">
                    {card.question ? card.question : <CiImageOn />}
                  </span>
                  <span className="truncate text-gray-400 dark:text-gray-500">
                    {card.answer ? card.answer : <CiImageOn />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-0.5 text-xs bg-violet-50 dark:bg-violet-900/30 text-purple-600 dark:text-violet-400 px-1.5 py-1.5 rounded-full">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/play/${collection.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex justify-center items-center opacity-0 absolute bottom-0 text-center right-0 w-full group-hover:opacity-100 transition-opacity shrink-0 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-b-xl gap-1.5">
        <PiShootingStarThin className="w-4 h-4" /> {t("collections.practice_btn")}
      </Link>
    </div>
  );
}

function CollectionListRow({
  collection,
  search,
  tags,
}: {
  collection: Collection;
  search: string;
  tags: CollectionTag[];
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isDemo = useIsDemo();
  const demoContent = useDemoStore((s) => s.content[collection.id]);
  const demoCardPreviews = (demoContent ?? [])
    .slice(0, 3)
    .map((c) => ({ id: c.id, question: c.question, answer: c.answer }));

  const { data } = useQuery({
    queryKey: ["collections", collection.id, "preview"],
    queryFn: () => collectionsApi.getPreview(collection.id, 3),
    staleTime: 5 * 60 * 1000,
    enabled: !isDemo,
    select: (d) => {
      const raw = d as unknown as Array<{
        collection: { stats?: CollectionStats };
        content: { id: number; question: string; answer: string }[];
      }>;
      return {
        cards: raw[0]?.content ?? [],
        stats: raw[0]?.collection?.stats,
      };
    },
  });

  const preview = isDemo ? { cards: demoCardPreviews, stats: undefined } : data;

  return (
    <div
      onClick={() => navigate(`/collections/${collection.id}`)}
      className={`group relative sm:max-w-[1000px] flex flex-col  gap-0 px-4 py-2.5 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-gray-900 transition-colors first:rounded-t-xl last:rounded-b-xl rounded-l-xl border border-gray-100 dark:border-gray-700 border-l-[5px] ${getAccentBorderClass(preview?.stats)} last:border-b-0`}>
      <div className={`group relative flex items-center gap-3`}>
        <StudyDot stats={preview?.stats} showFallback className="hidden md:flex shrink-0 w-2 h-2" />
        <span className="flex-1 min-w-0 font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
          {highlight(collection.name, search)}
        </span>
        {tags.length > 0 && (
          <div className="hidden xl:flex gap-1 shrink-0">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400  px-1.5 py-1.5 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        )}
        {/* <div className="w-full shrink-0 absolute bottom-0 left-0">
          <CollectionProgressBar stats={preview?.stats} variant="minimal" />
        </div> */}
        <span className="shrink-0 w-28 flex items-center justify-end gap-1.5 text-xs text-gray-400 dark:text-gray-500 group-hover:opacity-0 transition-opacity">
          {!!collection.isFavorite && <span className="text-sm text-rose-400">♥</span>}
          {!!collection.isPublic && <span className="text-xs">🔓</span>}
          {collection.layout === "document" && (
            <span className="text-xs text-teal-500 dark:text-teal-400">📄</span>
          )}{" "}
          {t("collections.card_count", {
            count: preview?.stats
              ? preview.stats.toLearn + preview.stats.inProgress + preview.stats.learned
              : (collection.cardCount ?? 0),
          })}
        </span>
      </div>
      <div className="w-40 shrink-0 pl-5">
        <CollectionProgressBar stats={preview?.stats} variant="minimal" size="md" />
      </div>
      {preview && preview.cards.length > 0 && (
        <div className="pointer-events-none bg-white dark:bg-gray-900 absolute left-0 right-0 top-full z-10 pt-px  opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
          <div className="bg-indigo-50/50 dark:bg-gray-900/10 ring-1 ring-gray-200 dark:ring-gray-700 rounded-lg shadow-lg px-3 py-2.5">
            <div className="flex flex-col gap-1.5">
              {preview.cards.map((card) => (
                <div key={card.id} className="grid grid-cols-2 gap-3 text-xs">
                  {/* <span className="text-gray-700 dark:text-gray-300 truncate">{card.question}</span>
                  <span className="text-gray-400 dark:text-gray-500 truncate">{card.answer}</span> */}

                  <span className="truncate">{card.question ? card.question : <CiImageOn />}</span>
                  <span className="truncate text-gray-300 dark:text-gray-600">
                    {card.answer ? card.answer : <CiImageOn />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <Link
        to={`/play/${collection.id}`}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 inset-y-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-r-md whitespace-nowrap">
        <PiShootingStarThin className="w-4 h-4 mr-2" /> {t("collections.practice_btn")}
      </Link>
    </div>
  );
}

type VisibleEntry = { category: { id: number; name: string }; collections: Collection[] };

function ViewToggleBtn({ compact, onToggle }: { compact: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const btnBase = "p-1.5 rounded transition-colors";
  const active = "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400";
  const inactive = "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300";
  return (
    <div className="flex items-center gap-0.5 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 shrink-0">
      <button
        onClick={() => compact && onToggle()}
        title={t("collections.view_tiles")}
        className={`${btnBase} ${!compact ? active : inactive}`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="0" y="0" width="6" height="6" rx="1" />
          <rect x="8" y="0" width="6" height="6" rx="1" />
          <rect x="0" y="8" width="6" height="6" rx="1" />
          <rect x="8" y="8" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => !compact && onToggle()}
        title={t("collections.view_list")}
        className={`${btnBase} ${compact ? active : inactive}`}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round">
          <line x1="1" y1="2.5" x2="13" y2="2.5" />
          <line x1="1" y1="7" x2="13" y2="7" />
          <line x1="1" y1="11.5" x2="13" y2="11.5" />
        </svg>
      </button>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const showToggle = count > 15;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        {showToggle && (
          <button
            onClick={onToggle}
            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded">
            <IoIosArrowForward
              size={16}
              className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`}
            />
          </button>
        )}
      </div>
      {(!showToggle || !collapsed) && children}
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const push = (n: number | "...") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };
  push(1);
  if (current > 3) push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) push(i);
  if (current < total - 2) push("...");
  push(total);
  return pages;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);
  const btnBase = "h-8 min-w-8 px-2 text-sm rounded-lg border transition-colors";
  const btnInactive =
    "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800";
  const btnActive = "bg-indigo-600 border-indigo-600 text-white";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} ${btnInactive} ${page === 1 ? btnDisabled : ""} px-3`}>
        {t("public_library.prev")}
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="w-8 text-center text-gray-400 dark:text-gray-500 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`${btnBase} ${p === page ? btnActive : btnInactive}`}>
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} ${btnInactive} ${page === totalPages ? btnDisabled : ""} px-3`}>
        {t("public_library.next")}
      </button>
    </div>
  );
}

function AllCollectionsView({ search }: { search: string }) {
  const { t } = useTranslation();
  const { myLibrary, setMyLibrary } = useLibraryUiStore();
  const page = myLibrary.allPage ?? 1;
  const compact = myLibrary.compactCards ?? false;

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const isFavoriteFilter = myLibrary.activeFilter === "Favorites";
  const isPublicFilter = myLibrary.activeFilter === "Public";

  const { data, isLoading, isFetching } = useCollectionsPaginated(
    page,
    ALL_LIMIT,
    debouncedSearch || undefined,
    isFavoriteFilter || undefined,
    isPublicFilter || undefined,
    myLibrary.activeTagId ?? undefined,
  );

  const visible = data?.data ?? [];

  const totalPages = data ? Math.ceil(data.total / ALL_LIMIT) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={isFetching && !isLoading ? "opacity-60 transition-opacity duration-150" : "pb-[10rem] sm:pb-auto"}>
      <div className="hidden sm:flex items-center justify-between mb-2 sticky top-[72px] py-2 z-20 bg-gray-50 dark:bg-gray-900">
        {data && totalPages > 1 ? (
          <Pagination page={page} totalPages={totalPages} onChange={(p) => setMyLibrary({ allPage: p })} />
        ) : (
          <div />
        )}
        <ViewToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
      </div>
      {totalPages > 1 && (
        <div className="sm:hidden mb-3">
          <Pagination page={page} totalPages={totalPages} onChange={(p) => setMyLibrary({ allPage: p })} />
        </div>
      )}
      {compact && (
        <div className="border border-gray-200 dark:border-gray-600 border-l-0  dark:ring-gray-700 rounded-xl bg-white dark:bg-gray-800 sm:max-w-[1000px] sm:m-auto">
          {visible.map((col) => (
            <CollectionListRow key={col.id} collection={col} search={search} tags={col.tags ?? []} />
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
              {t("collections.no_collections")}
            </p>
          )}
        </div>
      )}

      <div
        className={`${compact ? "hidden " : ""}grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 content-start`}>
        {visible.map((col) => (
          <CollectionCard key={col.id} collection={col} search={search} tags={col.tags ?? []} compact={compact} />
        ))}
        {visible.length === 0 && (
          <p className="col-span-full text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
            {t("collections.no_collections")}
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="sm:hidden mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => {
              setMyLibrary({ allPage: p });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}

function CardsView({
  allCollections,
  visibleCategories,
  search,
  effectiveId,
  totalCollections,
}: {
  allCollections: Collection[];
  visibleCategories: VisibleEntry[];
  search: string;
  effectiveId: number | null;
  totalCollections: number;
}) {
  const { t } = useTranslation();
  const { myLibrary, setMyLibrary } = useLibraryUiStore();
  const recents = useRecentCollectionsStore((s) => s.recents);
  const compact = myLibrary.compactCards ?? false;
  const viewMode = myLibrary.viewMode ?? "recent";

  const selectedCollections =
    viewMode === "by-category" && effectiveId !== null
      ? (visibleCategories.find((e) => e.category.id === effectiveId)?.collections ?? [])
      : [];

  function switchToRecent() {
    setMyLibrary({ viewMode: "recent" });
  }

  function switchToAll() {
    setMyLibrary({ viewMode: "all", allPage: 1 });
  }

  function switchToCategory(id: number) {
    setMyLibrary({ viewMode: "by-category", selectedCategoryId: id });
  }

  return (
    <div className="flex gap-0 min-h-0">
      {/* Left: category list — desktop only */}
      <div className="hidden sm:flex flex-col w-60 shrink-0 gap-0.5 p-2 mr-4 self-start border-r ">
        {recents.length > 0 && (
          <button
            onClick={switchToRecent}
            className={`italic text-left flex items-center px-3  py-2 rounded-lg text-sm transition-colors ${
              viewMode === "recent"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-l-[5px] border-l-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}>
            <MdAccessTime /> <span className="ml-2 truncate">{t("collections.recent_nav")}</span>
          </button>
        )}

        <button
          onClick={switchToAll}
          className={`italic text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            viewMode === "all"
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-l-[5px] border-l-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="truncate">{t("collections.all_collections")}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({totalCollections})</span>
          </div>
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 my-1 mb-3" />

        {visibleCategories.map(({ category, collections }) => (
          <button
            key={category.id}
            onClick={() => switchToCategory(category.id)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === "by-category" && effectiveId === category.id
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-l-[5px] border-l-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 "
            }`}>
            <div className="flex items-center justify-between gap-1">
              <span className="truncate">{highlight(category.name, search)}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({collections.length})</span>
            </div>
          </button>
        ))}
      </div>

      {/* Right: content area */}
      <div className="flex-1 min-w-0">
        {viewMode === "all" ? (
          <AllCollectionsView search={search} />
        ) : viewMode === "recent" ? (
          <>
            <div className="hidden sm:flex justify-end mb-2 sticky top-[72px] py-2 z-20 bg-gray-50 dark:bg-gray-900">
              <ViewToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
            </div>
            <RecentView allCollections={allCollections} search={search} compact={compact} />
          </>
        ) : (
          <>
            <div className="hidden sm:flex justify-end mb-2 sticky top-[72px] py-2 z-20 bg-gray-50 dark:bg-gray-900 ">
              <ViewToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
            </div>

            {compact && (
              <div className="ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl bg-white dark:bg-gray-800 sm:max-w-[1000px] sm:m-auto">
                {selectedCollections.map((col) => (
                  <CollectionListRow key={col.id} collection={col} search={search} tags={col.tags ?? []} />
                ))}
                {selectedCollections.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                    {t("collections.no_collections")}
                  </p>
                )}
              </div>
            )}

            <div
              className={`${compact ? "hidden " : ""}grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 content-start`}>
              {selectedCollections.map((col) => (
                <CollectionCard key={col.id} collection={col} search={search} tags={col.tags ?? []} compact={compact} />
              ))}
              {selectedCollections.length === 0 && (
                <p className="col-span-full text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                  {t("collections.no_collections")}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecentView({
  allCollections,
  search,
  compact,
}: {
  allCollections: Collection[];
  search: string;
  compact: boolean;
}) {
  const { t } = useTranslation();
  const recents = useRecentCollectionsStore((s) => s.recents);

  const recentCollections = recents
    .map((r) => allCollections.find((c) => c.id === r.id))
    .filter((c): c is Collection => !!c)
    .filter((c) => !search || c.name.toLowerCase().includes(search));

  if (recentCollections.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t("collections.no_recents")}</p>;
  }

  if (compact) {
    return (
      <div className="ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl bg-white dark:bg-gray-800  sm:max-w-[1000px] sm:m-autos">
        {recentCollections.map((col) => (
          <CollectionListRow key={col.id} collection={col} search={search} tags={col.tags ?? []} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 content-start">
      {recentCollections.map((col) => (
        <CollectionCard key={col.id} collection={col} search={search} tags={col.tags ?? []} compact={false} />
      ))}
    </div>
  );
}

const FILTER_TAGS = ["All", "Favorites", "Public"] as const;
type FilterTag = (typeof FILTER_TAGS)[number];

const FILTER_TAG_ICONS: Record<FilterTag, React.ReactNode> = {
  All: null,
  Favorites: <span className="text-rose-400 leading-none">♥</span>,
  Public: <span className="leading-none">🔓</span>,
};

function LibraryTabsBar({
  search,
  onSearch,
  active,
  onChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  active: FilterTag;
  onChange: (tag: FilterTag) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-gray-200 dark:border-gray-700 mb-0">
      <div className="hidden sm:flex items-center sm:w-auto shrink-0">
        <span className="px-5 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px cursor-default select-none">
          {t("collections.my_library")}
        </span>
        <Link
          to="/library/public"
          className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent transition-colors">
          {t("collections.public_library")}
        </Link>
        <Link to="/collections/new" className="ml-auto pb-1 sm:hidden shrink-0">
          <Button size="sm">+</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap pb-2 w-full sm:w-auto sm:ml-auto">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("collections.search_placeholder")}
          className="hidden sm:block sm:w-52 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="hidden sm:flex items-center rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden text-xs shrink-0">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onChange(tag)}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors border-l first:border-l-0 border-gray-300 dark:border-gray-600 whitespace-nowrap ${
                active === tag
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              }`}>
              {FILTER_TAG_ICONS[tag]}
              {t(`collections.filter_${tag.toLowerCase()}`)}
            </button>
          ))}
        </div>
        <Link to="/collections/new" className="shrink-0 hidden sm:block">
          <Button size="sm">{t("collections.new_collection_btn")}</Button>
        </Link>
      </div>
    </div>
  );
}

export function CollectionsPage() {
  const { t } = useTranslation();
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const { myLibrary, setMyLibrary } = useLibraryUiStore();
  const activeFilter = myLibrary.activeFilter;
  const search = myLibrary.search;
  const activeTagId = myLibrary.activeTagId;
  const compact = myLibrary.compactCards ?? false;
  const viewMode = myLibrary.viewMode ?? "by-category";

  function setActiveFilter(v: FilterTag) {
    setMyLibrary({ activeFilter: v, allPage: 1 });
  }
  function setSearch(v: string) {
    setMyLibrary({ search: v, allPage: 1 });
  }
  function setActiveTagId(v: number | null) {
    setMyLibrary({ activeTagId: v, allPage: 1 });
  }

  const { data: categoriesRaw = [], isLoading } = useCategoriesWithCollections();
  const { data: allCollections = [] } = useCollections();
  const { data: allTags = [] } = useCollectionTags();

  const categorizedIds = new Set(categoriesRaw.flatMap((c) => c.collections.map((col) => col.id)));
  const uncategorized = allCollections.filter((col) => !categorizedIds.has(col.id));
  const categories =
    uncategorized.length > 0
      ? [...categoriesRaw, { id: 0, name: t("collections.uncategorized"), userid: 0, collections: uncategorized }]
      : categoriesRaw;

  const totalCollections = categories.reduce((sum, c) => sum + c.collections.length, 0);

  function applyTagFilter(collections: Collection[]) {
    let result = collections;
    if (activeFilter === "Favorites") result = result.filter((c) => c.isFavorite);
    if (activeFilter === "Public") result = result.filter((c) => c.isPublic);
    if (activeTagId !== null) {
      result = result.filter((c) => (c.tags ?? []).some((t) => t.id === activeTagId));
    }
    return result;
  }

  function getVisibleCollections(category: (typeof categories)[number]): Collection[] | null {
    const q = search.toLowerCase().trim();
    if (!q) {
      const filtered = applyTagFilter(category.collections);
      return filtered.length > 0 ? filtered : null;
    }
    const categoryMatches = category.name.toLowerCase().includes(q);
    if (categoryMatches) {
      const filtered = applyTagFilter(category.collections);
      return filtered.length > 0 ? filtered : null;
    }
    const byName = category.collections.filter((col) => col.name.toLowerCase().includes(q));
    const filtered = applyTagFilter(byName);
    return filtered.length > 0 ? filtered : null;
  }

  const visibleCategories = categories
    .map((category) => ({ category, collections: getVisibleCollections(category) }))
    .filter(
      (entry): entry is { category: typeof entry.category; collections: Collection[] } => entry.collections !== null,
    );

  const selectedId = myLibrary.selectedCategoryId;
  const validIds = new Set(visibleCategories.map((e) => e.category.id));
  const effectiveId =
    selectedId !== null && validIds.has(selectedId) ? selectedId : (visibleCategories[0]?.category.id ?? null);

  const hasNoResults = !isLoading && totalCollections > 0 && visibleCategories.length === 0 && viewMode !== "all";
  const showContent = !isLoading && totalCollections > 0;

  return (
    <div className="pb-2">
      {/* ── Sticky header block ── */}
      <div className="sticky top-0 pt-3 sm:-top-6 z-20 bg-gray-50 dark:bg-gray-900 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <LibraryTabsBar search={search} onSearch={setSearch} active={activeFilter} onChange={setActiveFilter} />

        {allTags.length > 0 && (
          <div className="hidden sm:flex gap-2 overflow-x-auto items-center border-b border-slate-200/80 dark:border-slate-700/80 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{t("collections.tags_label")}</span>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                className={`shrink-0 px-3 py-1 text-xs rounded-full border transition-colors ${
                  activeTagId === tag.id
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "border-transparent bg-gray-100 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400"
                }`}>
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: current category label + compact toggle */}
        {showContent && (
          <div className="sm:hidden ml-4 flex items-center gap-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilterOpen(true)}
              className="flex-1 min-w-0 flex items-center gap-1 px-1 text-left active:opacity-70 transition-opacity">
              <span className="truncate text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {viewMode === "all"
                  ? t("collections.all_collections_count", { count: totalCollections })
                  : (visibleCategories.find((e) => e.category.id === effectiveId)?.category.name ?? "")}
              </span>
              <IoIosArrowForward size={14} className="shrink-0 text-indigo-400 dark:text-indigo-500" />
            </button>

            <ViewToggleBtn compact={compact} onToggle={() => setMyLibrary({ compactCards: !compact })} />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="mt-4">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && totalCollections === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-lg mb-2">{t("collections.empty_title")}</p>
            <Link to="/collections/new">
              <Button size="sm">{t("collections.create_first_btn")}</Button>
            </Link>
          </div>
        )}

        {hasNoResults && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-lg mb-2">{t("collections.no_results", { search })}</p>
            <button
              onClick={() => setSearch("")}
              className="text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              {t("collections.clear_search")}
            </button>
          </div>
        )}

        {showContent && (
          <CardsView
            allCollections={allCollections}
            visibleCategories={visibleCategories}
            search={search.toLowerCase().trim()}
            effectiveId={effectiveId}
            totalCollections={totalCollections}
          />
        )}
      </div>

      <MobileFab to="/collections/new" label={t("collections.add_collection_fab")} />
      <SideDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onOpen={() => setFilterOpen(true)}
        tabLabel={
          viewMode === "all"
            ? `${t("collections.all_collections_count", { count: totalCollections })} `
            : viewMode === "recent"
              ? `${t("collections.recent_nav")} `
              : `${visibleCategories.find((e) => e.category.id === effectiveId)?.category.name ?? ""} `
        }
        tabIcon={<HiOutlineBookmarkSquare className="text-[22px]" strokeWidth="1.8" />}
        topValue="top-[102px] w-72 flex flex-row nowrap"
        title={t("collections.filters_title")}
        hasActiveIndicator={
          activeFilter !== "All" ||
          activeTagId !== null ||
          (viewMode === "by-category" && myLibrary.selectedCategoryId !== null)
        }>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t("collections.show_label")}
          </p>
          <div className="flex w-fit m-auto items-center rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden text-xs self-start">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`flex items-center gap-1 px-3 py-1.5 transition-colors border-l first:border-l-0 border-gray-300 dark:border-gray-600 whitespace-nowrap ${
                  activeFilter === tag
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}>
                {FILTER_TAG_ICONS[tag]}
                {t(`collections.filter_${tag.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>
        {showContent && (
          <CollapsibleSection
            title={t("collections.categories_section")}
            count={visibleCategories.length}
            collapsed={categoriesCollapsed}
            onToggle={() => setCategoriesCollapsed((v) => !v)}>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setMyLibrary({ viewMode: "recent" });
                  setFilterOpen(false);
                }}
                className={` text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center ${
                  viewMode === "recent"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-l-[5px] border-l-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                <MdAccessTime />
                <span className="italic ml-2 truncate">{t("collections.recent_nav")}</span>
              </button>
              <button
                onClick={() => {
                  setMyLibrary({ viewMode: "all", allPage: 1 });
                  setFilterOpen(false);
                }}
                className={`text-left italic px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === "all"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-l-[5px] border-l-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{t("collections.all_collections")}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({totalCollections})</span>
                </div>
              </button>{" "}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1 mb-3" />
              {visibleCategories.map(({ category, collections }) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setMyLibrary({ viewMode: "by-category", selectedCategoryId: category.id });
                    setFilterOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    viewMode === "by-category" && effectiveId === category.id
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border-l-[5px] border-l-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({collections.length})</span>
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}
        {allTags.length > 0 && (
          <CollapsibleSection
            title={t("collections.tags_section")}
            count={allTags.length}
            collapsed={tagsCollapsed}
            onToggle={() => setTagsCollapsed((v) => !v)}>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    activeTagId === tag.id
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300"
                  }`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </SideDrawer>
      {/* <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onOpen={() => setFilterOpen(true)}
        label=" "
        hasActiveFilters={
          activeFilter !== "All" ||
          activeTagId !== null ||
          (viewMode === "by-category" && myLibrary.selectedCategoryId !== null)
        }>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t("collections.show_label")}</p>
          <div className="flex w-fit m-auto items-center rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden text-xs self-start">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`flex items-center gap-1 px-3 py-1.5 transition-colors border-l first:border-l-0 border-gray-300 dark:border-gray-600 whitespace-nowrap ${
                  activeFilter === tag
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}>
                {FILTER_TAG_ICONS[tag]}
                {t(`collections.filter_${tag.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {showContent && (
          <CollapsibleSection
            title={t("collections.categories_section")}
            count={visibleCategories.length}
            collapsed={categoriesCollapsed}
            onToggle={() => setCategoriesCollapsed((v) => !v)}>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setMyLibrary({ viewMode: "all", allPage: 1 });
                  setFilterOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  viewMode === "all"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{t("collections.all_collections")}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({totalCollections})</span>
                </div>
              </button>
              {visibleCategories.map(({ category, collections }) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setMyLibrary({ viewMode: "by-category", selectedCategoryId: category.id });
                    setFilterOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    viewMode === "by-category" && effectiveId === category.id
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({collections.length})</span>
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {allTags.length > 0 && (
          <CollapsibleSection
            title={t("collections.tags_section")}
            count={allTags.length}
            collapsed={tagsCollapsed}
            onToggle={() => setTagsCollapsed((v) => !v)}>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    activeTagId === tag.id
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300"
                  }`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </FilterDrawer> */}
    </div>
  );
}
