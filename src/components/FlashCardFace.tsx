import { useCardImage } from "@/hooks/useCardImage";
import { SpeakButton } from "@/components/SpeakButton";

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
  if (!filename || filename === "null" || filename === "") return null;
  return (
    <>
      {src ? (
        <img src={src} alt="" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", borderRadius: 8 }} />
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
    </>
  );
}

function CardContent({
  text,
  imgFilename,
  collectionId,
  dark = false,
  textClass,
}: {
  text: string;
  imgFilename?: string;
  collectionId: number;
  dark?: boolean;
  textClass: string;
}) {
  const hasText = text.trim() !== "";
  const hasImg = !!imgFilename && imgFilename !== "null" && imgFilename !== "";

  if (hasText && hasImg) {
    return (
      <div className="w-full flex flex-col md:flex-row items-center gap-4">
        <div style={{ width: "35%", flexShrink: 0 }}>
          <CardImg filename={imgFilename} collectionId={collectionId} dark={dark} />
        </div>
        <p className={`flex-1 ${textClass} text-center whitespace-pre-line`}>{text}</p>
      </div>
    );
  }

  if (hasImg) {
    return <CardImg filename={imgFilename} collectionId={collectionId} dark={dark} />;
  }

  return <p className={`w-full ${textClass} text-center whitespace-pre-line`}>{text}</p>;
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
}

function highlightNote(note: string, question: string, answer: string) {
  const terms = [question, answer].map((t) => t.trim()).filter(Boolean);
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
}: FlashCardFaceProps) {
  return (
    <div style={{ perspective: "1200px" }}>
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: animated ? "transform 0.5s ease" : "none",
          position: "relative",
          minHeight: 340,
        }}>
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col"
          style={{ backfaceVisibility: "hidden" }}>
          <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{frontLabel}</span>
            <SpeakButton text={frontText} />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-2 pt-0">
            <div className="my-auto w-full flex flex-col items-center gap-3">
              <CardContent
                text={frontText}
                imgFilename={frontImg}
                collectionId={collectionId}
                textClass="text-2xl font-semibold text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="shrink-0 px-6 pt-1 pb-4 text-center">
            <span className="text-xs text-gray-300 dark:text-gray-600">Click to flip</span>
          </div>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-500 bg-indigo-600 dark:bg-indigo-900/20 shadow-sm flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
            <span className="text-xs font-medium text-indigo-200 uppercase tracking-widest">{backLabel}</span>
            <SpeakButton text={backText} />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-2 pt-0">
            <div className="my-auto w-full flex flex-col items-center gap-3">
              <CardContent
                text={backText}
                imgFilename={backImg}
                collectionId={collectionId}
                dark
                textClass="text-2xl font-semibold text-white"
              />
              {note && (
                <p className="text-sm text-indigo-200 italic text-center">{highlightNote(note, frontText, backText)}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 px-6 pt-1 pb-4 text-center">
            <span className="text-xs text-indigo-300">Click to flip back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
