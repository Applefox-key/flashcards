import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useCollectionWithContent,
  useToggleFavorite,
  useTogglePublic,
  useDeleteCollection,
  useDeleteAllCards,
} from "@/hooks/useCollectionHooks";
import { useDeleteCard, useEditCard, useAddCard, useAddCardWithImage } from "@/hooks/useContentHooks";
import { useSetCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { collectionTagsApi } from "@/api";
import { PasteCardsModal } from "@/features/content/PasteCardsModal";
import { FileImportModal } from "@/features/content/FileImportModal";
import { Reorganizer } from "@/features/content/Reorganizer";
import { Button } from "@/components/Button";
import { TagSelect } from "@/components/TagSelect";
import { useToast } from "@/hooks/useToast";
import { useCardImage } from "@/hooks/useCardImage";
import type { Content, Collection, CardEditRequest } from "@/types";

interface CollectionContentResponse {
  collection: Collection;
  content: Content[];
}

// ── Card image component (view only) ────────────────────────────────

function CardImg({ filename, collectionId, alt }: { filename: string | undefined; collectionId: number; alt: string }) {
  const src = useCardImage(filename, collectionId);
  const hasFile = !!filename && filename !== "null" && filename !== "";
  if (!hasFile) return null;
  if (!src) return <div className="w-full bg-gray-100 rounded animate-pulse mt-2" style={{ height: "6rem" }} />;
  return <img src={src} alt={alt} className="mt-2 max-h-40 object-contain rounded border border-gray-100" />;
}

// ── Image upload field ───────────────────────────────────────────────

function ImageUploadField({
  label,
  currentFilename,
  collectionId,
  file,
  onFileChange,
  onClear,
}: {
  label: string;
  currentFilename?: string;
  collectionId: number;
  file: File | null;
  onFileChange: (f: File | null) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const existingSrc = useCardImage(!file && currentFilename ? currentFilename : undefined, collectionId);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const hasExisting = !!currentFilename && currentFilename !== "null" && currentFilename !== "" && !file;

  return (
    <div className="flex flex-col gap-1 mt-2">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      {file && previewUrl ? (
        <div className="flex items-center gap-2">
          <img src={previewUrl} alt="" className="max-h-24 object-contain rounded border border-gray-100" />
          <button
            type="button"
            onClick={() => {
              onFileChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs text-red-400 hover:text-red-600">
            × Cancel
          </button>
        </div>
      ) : hasExisting ? (
        <div className="flex items-center gap-2">
          {existingSrc && (
            <img src={existingSrc} alt="" className="max-h-24 object-contain rounded border border-gray-100" />
          )}
          <div className="flex flex-col gap-1">
            <button type="button" onClick={onClear} className="text-xs text-red-400 hover:text-red-600">
              × Remove
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-indigo-400 hover:text-indigo-600">
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-indigo-300 transition-colors text-xs text-gray-400">
          Click to add image
        </div>
      )}
    </div>
  );
}

// ── Add card form ───────────────────────────────────────────────────

function AddCardForm({ collectionId, onDone }: { collectionId: number; onDone: () => void }) {
  const toast = useToast();
  const addCard = useAddCard();
  const addCardWithImage = useAddCardWithImage();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState("");
  const [imgQFile, setImgQFile] = useState<File | null>(null);
  const [imgAFile, setImgAFile] = useState<File | null>(null);

  function handleSave() {
    if (!question.trim() || !answer.trim()) return;
    if (imgQFile || imgAFile) {
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          note: note.trim() || undefined,
        }),
      );
      if (imgQFile) fd.append("imgQfile", imgQFile);
      if (imgAFile) fd.append("imgAfile", imgAFile);
      addCardWithImage.mutate(
        { collectionId, formData: fd },
        {
          onSuccess: () => {
            toast.success("Card added");
            setQuestion("");
            setAnswer("");
            setNote("");
            setImgQFile(null);
            setImgAFile(null);
          },
          onError: () => toast.error("Failed to add card"),
        },
      );
    } else {
      addCard.mutate(
        { collectionId, card: { question: question.trim(), answer: answer.trim(), note: note.trim() || undefined } },
        {
          onSuccess: () => {
            toast.success("Card added");
            setQuestion("");
            setAnswer("");
            setNote("");
          },
          onError: () => toast.error("Failed to add card"),
        },
      );
    }
  }

  const isPending = addCard.isPending || addCardWithImage.isPending;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col gap-3 mb-4">
      <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">New card</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
            }}
            placeholder="Enter question..."
            rows={2}
            autoFocus
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
          />
          <ImageUploadField
            label="Question image"
            collectionId={collectionId}
            file={imgQFile}
            onFileChange={setImgQFile}
            onClear={() => setImgQFile(null)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
            }}
            placeholder="Enter answer..."
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
          />
          <ImageUploadField
            label="Answer image"
            collectionId={collectionId}
            file={imgAFile}
            onFileChange={setImgAFile}
            onClear={() => setImgAFile(null)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </div>
      <div className="flex gap-2 justify-end items-center">
        <span className="text-xs text-gray-400 mr-auto">Ctrl+Enter to save</span>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} loading={isPending} disabled={!question.trim() || !answer.trim()}>
          Add card
        </Button>
      </div>
    </div>
  );
}

// ── Card item ───────────────────────────────────────────────────────

function CardItem({
  card,
  collectionId,
  onDelete,
}: {
  card: Content;
  collectionId: number;
  onDelete: (id: number) => void;
}) {
  const toast = useToast();
  const editCard = useEditCard();
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [note, setNote] = useState(card.note ?? "");
  const [imgQFile, setImgQFile] = useState<File | null>(null);
  const [imgAFile, setImgAFile] = useState<File | null>(null);
  const [clearImgQ, setClearImgQ] = useState(false);
  const [clearImgA, setClearImgA] = useState(false);

  function handleSave() {
    const hasImageChange = imgQFile || imgAFile || clearImgQ || clearImgA;
    if (hasImageChange) {
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          id: card.id,
          question,
          answer,
          note: note || undefined,
          collectionid: collectionId,
          ...(clearImgQ ? { imgQ: "" } : {}),
          ...(clearImgA ? { imgA: "" } : {}),
        }),
      );
      if (imgQFile) fd.append("imgQfile", imgQFile);
      if (imgAFile) fd.append("imgAfile", imgAFile);
      editCard.mutate(
        { collectionId, data: fd as unknown as CardEditRequest },
        {
          onSuccess: () => {
            toast.success("Card updated");
            setEditing(false);
          },
          onError: () => toast.error("Failed to update card"),
        },
      );
    } else {
      editCard.mutate(
        { collectionId, data: { id: card.id, question, answer, note: note || undefined } },
        {
          onSuccess: () => {
            toast.success("Card updated");
            setEditing(false);
          },
          onError: () => toast.error("Failed to update card"),
        },
      );
    }
  }

  function handleCancel() {
    setQuestion(card.question);
    setAnswer(card.answer);
    setNote(card.note ?? "");
    setImgQFile(null);
    setImgAFile(null);
    setClearImgQ(false);
    setClearImgA(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-300 rounded-lg p-4 flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <ImageUploadField
            label="Question image"
            currentFilename={clearImgQ ? undefined : card.imgQ}
            collectionId={collectionId}
            file={imgQFile}
            onFileChange={setImgQFile}
            onClear={() => {
              setClearImgQ(true);
              setImgQFile(null);
            }}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <ImageUploadField
            label="Answer image"
            currentFilename={clearImgA ? undefined : card.imgA}
            collectionId={collectionId}
            file={imgAFile}
            onFileChange={setImgAFile}
            onClear={() => {
              setClearImgA(true);
              setImgAFile(null);
            }}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={editCard.isPending}
            disabled={!question.trim() || !answer.trim()}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  const [hoverRate, setHoverRate] = useState(0);
  const displayRate = hoverRate || card.rate || 0;

  function handleRate(star: number) {
    const newRate = card.rate === star ? 0 : star;
    editCard.mutate(
      {
        collectionId,
        data: { id: card.id, question: card.question, answer: card.answer, note: card.note, rate: newRate },
      },
      { onError: () => toast.error("Failed to update rating") },
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 hover:border-indigo-200 transition-colors group">
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
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5" onMouseLeave={() => setHoverRate(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRate(star)}
              disabled={editCard.isPending}
              className={`text-base leading-none transition-colors disabled:opacity-40 ${
                star <= displayRate ? "text-yellow-400" : "text-gray-200 hover:text-yellow-300"
              }`}>
              ★
            </button>
          ))}
        </div>
        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors">
            Edit
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────

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

// ── Main page ───────────────────────────────────────────────────────

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collectionId = Number(id);
  const toast = useToast();

  const { data: rawData, isLoading, isError } = useCollectionWithContent(collectionId);
  const deleteCard = useDeleteCard();
  const toggleFavorite = useToggleFavorite();
  const togglePublic = useTogglePublic();
  const deleteCollection = useDeleteCollection();
  const deleteAllCards = useDeleteAllCards();

  const [search, setSearch] = useState("");
  const [addingCard, setAddingCard] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [reorgMode, setReorgMode] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [pendingTagIds, setPendingTagIds] = useState<number[]>([]);
  const tagPopoverRef = useRef<HTMLDivElement>(null);

  const setCollectionTags = useSetCollectionTags();
  const { data: collectionTags = [] } = useQuery({
    queryKey: ["collection-tags", "collection", collectionId],
    queryFn: () => collectionTagsApi.getByCollection(collectionId),
    enabled: !!collectionId,
  });

  useEffect(() => {
    setPendingTagIds(collectionTags.map((t) => t.id));
  }, [collectionTags]);

  useEffect(() => {
    if (!editingTags) return;
    function handleClick(e: MouseEvent) {
      if (tagPopoverRef.current && !tagPopoverRef.current.contains(e.target as Node)) {
        setEditingTags(false);
        setPendingTagIds(collectionTags.map((t) => t.id));
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editingTags, collectionTags]);

  const parsed = rawData as unknown as CollectionContentResponse[] | undefined;
  const collectionData = parsed?.[0];
  const collection = collectionData?.collection;
  const cards: Content[] = collectionData?.content ?? [];

  const filtered = cards.filter(
    (c) =>
      c.question?.toLowerCase().includes(search.toLowerCase()) ||
      c.answer?.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDelete(cardId: number) {
    if (!confirm("Delete this card?")) return;
    deleteCard.mutate({ cardId, collectionId }, { onError: () => toast.error("Failed to delete card") });
  }

  function handleDeleteAllCards() {
    if (!confirm(`Delete all ${cards.length} card(s) from "${collection?.name}"? This cannot be undone.`)) return;
    deleteAllCards.mutate(collectionId, {
      onSuccess: () => toast.success("All cards deleted"),
      onError: () => toast.error("Failed to delete cards"),
    });
  }

  function handleDeleteCollection() {
    if (!confirm(`Delete collection "${collection?.name}"? All its cards will be permanently removed.`)) return;
    deleteCollection.mutate(collectionId, {
      onSuccess: () => {
        toast.success("Collection deleted");
        navigate("/library");
      },
      onError: () => toast.error("Failed to delete collection"),
    });
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-red-500">
        <p>Failed to load collection.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  if (reorgMode) {
    return <Reorganizer cards={cards} collectionId={collectionId} onClose={() => setReorgMode(false)} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          {isLoading ? (
            <span className="inline-block h-6 w-48 bg-gray-200 rounded animate-pulse" />
          ) : (
            (collection?.name ?? `Collection #${id}`)
          )}
        </h1>
        <Link to={`/collections/${id}/edit`}>
          <Button variant="secondary" size="sm">
            Edit collection
          </Button>
        </Link>
        {!isLoading && cards.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAllCards}
            loading={deleteAllCards.isPending}
            className="text-red-400 hover:text-red-600">
            Clear cards
          </Button>
        )}
        {!isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteCollection}
            loading={deleteCollection.isPending}
            className="text-red-400 hover:text-red-600">
            Delete
          </Button>
        )}
        <Link to={`/play/${id}`}>
          <Button size="sm">▶ Practice</Button>
        </Link>
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
                ? (collection.category as Category).name
                : (collection.category as unknown as string)}
            </span>
          )}
          <button
            onClick={() =>
              toggleFavorite.mutate(
                { id: collectionId, isFavorite: !collection?.isFavorite },
                { onError: () => toast.error("Failed to update favorite") },
              )
            }
            disabled={toggleFavorite.isPending}
            title={collection?.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`border-l border-gray-200 pl-3 transition-colors disabled:opacity-40 ${
              collection?.isFavorite ? "text-yellow-400 hover:text-yellow-300" : "text-gray-300 hover:text-yellow-400"
            }`}>
            ★ {collection?.isFavorite ? "favorite" : "add to favorites"}
          </button>
          <button
            onClick={() =>
              togglePublic.mutate(
                { id: collectionId, isPublic: !collection?.isPublic },
                { onError: () => toast.error("Failed to update visibility") },
              )
            }
            disabled={togglePublic.isPending}
            title={collection?.isPublic ? "Make private" : "Make public"}
            className={`border-l border-gray-200 pl-3 transition-colors disabled:opacity-40 ${
              collection?.isPublic ? "text-green-500 hover:text-red-400" : "text-gray-300 hover:text-green-500"
            }`}>
            {collection?.isPublic ? "public" : "private"}
          </button>

          {/* Tags */}
          <div className="border-l border-gray-200 pl-3 relative" ref={tagPopoverRef}>
            <div className="flex items-center gap-2 flex-wrap">
              {collectionTags.length > 0 ? (
                collectionTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full">
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-300 text-xs">no tags</span>
              )}
              <button
                onClick={() => setEditingTags(true)}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                Edit tags
              </button>
            </div>

            {editingTags && (
              <div className="absolute left-0 top-6 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[280px] max-w-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Edit tags</span>
                  <button
                    onClick={() => {
                      setEditingTags(false);
                      setPendingTagIds(collectionTags.map((t) => t.id));
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none">
                    ×
                  </button>
                </div>
                <TagSelect value={pendingTagIds} onChange={setPendingTagIds} />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() =>
                      setCollectionTags.mutate(
                        { collectionId, tagIds: pendingTagIds },
                        {
                          onSuccess: () => {
                            toast.success("Tags updated");
                            setEditingTags(false);
                          },
                          onError: () => toast.error("Failed to update tags"),
                        },
                      )
                    }
                    disabled={setCollectionTags.isPending}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      {!isLoading && cards.length > 4 && (
        <input
          type="search"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      )}

      {/* Actions bar */}
      {!isLoading && !addingCard && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button size="sm" onClick={() => setAddingCard(true)}>
            + Add card
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPasteOpen(true)}>
            + Paste list
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setFileOpen(true)}>
            + Import file
          </Button>
          {cards.length > 1 && (
            <Button variant="secondary" size="sm" onClick={() => setReorgMode(true)}>
              Reorganize
            </Button>
          )}
        </div>
      )}

      {/* Inline add form */}
      {addingCard && <AddCardForm collectionId={collectionId} onDone={() => setAddingCard(false)} />}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && !addingCard && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-4">No cards yet</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button size="sm" onClick={() => setAddingCard(true)}>
              Add card
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPasteOpen(true)}>
              Paste list
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setFileOpen(true)}>
              Import file
            </Button>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((card) => (
            <CardItem key={card.id} card={card} collectionId={collectionId} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* No search results */}
      {!isLoading && cards.length > 0 && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">No cards match your search.</p>
      )}

      {/* Modals */}
      <PasteCardsModal open={pasteOpen} onClose={() => setPasteOpen(false)} collectionId={collectionId} />
      <FileImportModal open={fileOpen} onClose={() => setFileOpen(false)} collectionId={collectionId} />
    </div>
  );
}
