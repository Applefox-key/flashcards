import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useCardImage } from "@/hooks/useCardImage";
import { SpeakButton } from "@/components/SpeakButton";
import { RichTextDisplay } from "@/components/RichTextDisplay";
import { stripHtml } from "@/utils/htmlUtils";

function CardImg({
  filename,
  collectionId,
  dark = false,
}: {
  filename?: string;
  collectionId: number;
  dark?: boolean;
}) {
  const src = useCardImage(filename, collectionId);
  const [open, setOpen] = useState(false);

  if (!filename || filename === "null" || filename === "") return null;
  return (
    <>
      {src ? (
        <img
          src={src}
          alt=""
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", borderRadius: 8, cursor: "zoom-in" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            background: dark ? "rgba(255,255,255,0.15)" : "#e5e7eb",
            animation: "pulse 1.5s infinite",
          }}
        />
      )}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}>
            <img
              src={src}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function CardContent({
  text,
  imgFilename,
  collectionId,
  dark = false,
  textClass,
  alignClass,
}: {
  text: string;
  imgFilename?: string;
  collectionId: number;
  dark?: boolean;
  textClass: string;
  alignClass?: string;
}) {
  const plainText = stripHtml(text);
  const hasText = plainText.trim() !== "";
  const hasImg = !!imgFilename && imgFilename !== "null" && imgFilename !== "";
  const autoAlign = alignClass ?? (plainText.length > 100 ? "text-left" : "text-center");

  if (hasText && hasImg) {
    return (
      <div className="w-full flex flex-col md:flex-row items-center gap-4">
        <div style={{ width: "35%", flexShrink: 0 }}>
          <CardImg filename={imgFilename} collectionId={collectionId} dark={dark} />
        </div>
        <RichTextDisplay html={text} className={`flex-1 ${textClass} ${autoAlign}`} />
      </div>
    );
  }

  if (hasImg) {
    return <CardImg filename={imgFilename} collectionId={collectionId} dark={dark} />;
  }

  return <RichTextDisplay html={text} className={`w-full ${textClass} ${autoAlign}`} />;
}

interface FlashCardFaceProps {
  frontLabel: string;
  backLabel: string;
  frontText: string;
  backText: string;
  frontImg?: string;
  backImg?: string;
  note?: string;
  collectionId: number;
  flipped: boolean;
  /** Whether the flip transition should animate. Default true. */
  animated?: boolean;
  layout?: "standard" | "document";
  /** Show both sides flat (no flip). Only for preview, not game. */
  showBothSides?: boolean;
}

function highlightNote(note: string, question: string, answer: string) {
  const terms = [stripHtml(question), stripHtml(answer)].map((t) => t.trim()).filter(Boolean);
  if (!terms.length) return <>{note}</>;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = note.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <strong className="underline" key={i}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
export function FlashCardFace({
  frontLabel,
  backLabel,
  frontText,
  backText,
  frontImg,
  backImg,
  note,
  collectionId,
  flipped,
  animated = true,
  layout = "standard",
  showBothSides = false,
}: FlashCardFaceProps) {
  const { t } = useTranslation();

  const isDoc = layout === "document";

  if (showBothSides) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 border-t-4 border-t-indigo-500 dark:border-t-indigo-400 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{frontLabel}</span>
          <SpeakButton text={stripHtml(frontText)} />
        </div>
        <div className="px-6 pb-2">
          <CardContent
            text={frontText}
            imgFilename={frontImg}
            collectionId={collectionId}
            textClass="text-base font-normal text-gray-800 dark:text-gray-100 leading-relaxed"
            alignClass="text-left"
          />
        </div>

        <hr className="mx-6 border-gray-200 dark:border-gray-700" />

        <div className="shrink-0 flex items-center justify-between px-6 pt-3 pb-2">
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{backLabel}</span>
          <SpeakButton text={stripHtml(backText)} />
        </div>
        <div className="px-6 pb-4">
          <CardContent
            text={backText}
            imgFilename={backImg}
            collectionId={collectionId}
            textClass="text-base font-normal text-gray-800 dark:text-gray-100 leading-relaxed"
            alignClass="text-left"
          />
          {note && (
            <p className="text-sm text-indigo-400 dark:text-indigo-300 italic text-left mt-3">
              {highlightNote(note, frontText, backText)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ perspective: "1200px" }}>
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: animated ? "transform 0.5s ease" : "none",
          position: "relative",
          minHeight: isDoc ? 520 : 340,
        }}>
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-gray-700 border-t-4 border-t-indigo-500 dark:border-t-indigo-400 bg-white dark:bg-gray-800 shadow-lg flex flex-col"
          style={{ backfaceVisibility: "hidden" }}>
          <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{frontLabel}</span>
            <SpeakButton text={stripHtml(frontText)} />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-2 pt-0">
            <div className={`${isDoc ? "w-full pt-1" : "my-auto w-full flex flex-col items-center gap-3 max-h-[90%]"}`}>
              <CardContent
                text={frontText}
                imgFilename={frontImg}
                collectionId={collectionId}
                textClass={isDoc ? "text-base font-normal text-gray-800 dark:text-gray-100 leading-relaxed" : "text-2xl font-semibold text-gray-900 dark:text-gray-100"}
                alignClass={isDoc ? "text-left" : undefined}
              />
            </div>
          </div>
          <div className="shrink-0 px-6 pt-1 pb-4 text-center">
            <span className="text-xs text-gray-300 dark:text-gray-600">{t("collection_detail.flip_hint")}</span>
          </div>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-500 bg-indigo-500 dark:bg-indigo-900/20 shadow-lg flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
            <span className="text-xs font-medium text-indigo-200 uppercase tracking-widest">{backLabel}</span>
            <SpeakButton text={stripHtml(backText)} />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-2 pt-0">
            <div className={`${isDoc ? "w-full pt-1" : "my-auto w-full flex flex-col items-center gap-3"}`}>
              <CardContent
                text={backText}
                imgFilename={backImg}
                collectionId={collectionId}
                dark
                textClass={isDoc ? "text-base font-normal text-white leading-relaxed" : "text-2xl font-semibold text-white"}
                alignClass={isDoc ? "text-left" : undefined}
              />
              {note && (
                <p className={`text-sm text-indigo-200 italic ${isDoc ? "text-left mt-3" : "text-center"}`}>
                  {highlightNote(note, frontText, backText)}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 px-6 pt-1 pb-4 text-center">
            <span className="text-xs text-indigo-300">{t("collection_detail.flip_back_hint")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
