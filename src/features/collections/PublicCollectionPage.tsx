import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { pbcollectionsApi } from "@/api";
import { useCopyCollection } from "@/features/collections/hooks/useCollections";
import { useCardImage } from "@/hooks/useCardImage";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/Button";
import type { Content, Collection } from "@/types";

interface CollectionContentResponse {
  collection: Collection;
  content: Content[];
}

// ── Card image ────────────────────────────────────────────────────────

function CardImg({ filename, collectionId, alt }: { filename: string | undefined; collectionId: number; alt: string }) {
  const src = useCardImage(filename, collectionId);
  const hasFile = !!filename && filename !== "null" && filename !== "";
  if (!hasFile) return null;
  if (!src) return <div className="w-full bg-gray-100 rounded animate-pulse mt-2" style={{ height: "6rem" }} />;
  return <img src={src} alt={alt} className="mt-2 max-h-40 object-contain rounded border border-gray-100" />;
}

// ── Read-only card ────────────────────────────────────────────────────

function CardItem({ card, collectionId }: { card: Content; collectionId: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div>
        <p className="text-xs text-gray-400 mb-1">Question</p>
        <p className="font-medium text-gray-900">{card.question}</p>
        <CardImg filename={card.imgQ} collectionId={collectionId} alt="question" />
      </div>
      <div className="border-t border-gray-100" />
      <div>
        <p className="text-xs text-gray-400 mb-1">Answer</p>
        <p className="text-gray-800">{card.answer}</p>
        <CardImg filename={card.imgA} collectionId={collectionId} alt="answer" />
        {card.note && <p className="text-xs text-gray-400 mt-1 italic">{card.note}</p>}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="border-t border-gray-100 mb-3" />
      <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export function PublicCollectionPage() {
  const { id } = useParams<{ id: string }>();
  const collectionId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const copyCollection = useCopyCollection();
  const [copied, setCopied] = useState(false);

  const {
    data: rawData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pbcollections", collectionId, "content"],
    queryFn: () => pbcollectionsApi.getWithContent(collectionId),
    enabled: !!collectionId,
  });

  const parsed = rawData as unknown as CollectionContentResponse[] | undefined;
  const collection = parsed?.[0]?.collection;
  const cards: Content[] = parsed?.[0]?.content ?? [];

  function handleCopy() {
    copyCollection.mutate(collectionId, {
      onSuccess: () => {
        setCopied(true);
        toast.success(`"${collection?.name ?? "Collection"}" added to your library`);
      },
      onError: () => toast.error("Failed to copy collection"),
    });
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-red-500">
        <p>Failed to load collection.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/library/public")} className="mt-4">
          Back to Public Library
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate("/library/public")}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 5L2 12l9 7v-4h11V9H11V5z" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          {isLoading ? (
            <span className="inline-block h-6 w-48 bg-gray-200 rounded animate-pulse" />
          ) : (
            (collection?.name ?? `Collection #${id}`)
          )}
        </h1>
        {!isLoading && (
          <>
            {copied ? (
              <span className="text-sm text-green-600 font-medium px-3">✓ Copied</span>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleCopy} loading={copyCollection.isPending}>
                Copy to my library
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(`/play/${collectionId}`)}>
              ▶ Practice
            </Button>
          </>
        )}
      </div>

      {/* Meta */}
      {!isLoading && (
        <div className="flex gap-3 ml-8 mb-6 text-sm text-gray-400">
          <span>
            {cards.length} {cards.length === 1 ? "card" : "cards"}
          </span>
          {collection?.category && (
            <span className="border-l border-gray-200 pl-3">
              {typeof collection.category === "object"
                ? (collection.category as { name: string }).name
                : String(collection.category)}
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No cards in this collection.</p>
        </div>
      )}

      {/* Cards grid */}
      {!isLoading && cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} collectionId={collectionId} />
          ))}
        </div>
      )}
    </div>
  );
}
