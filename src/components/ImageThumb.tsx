import { useState } from "react";
import { useCardImage } from "@/hooks/useCardImage";

interface Props {
  filename: string | undefined;
  collectionId: number;
  className?: string;
}

export function ImageThumb({ filename, collectionId, className = "" }: Props) {
  const src = useCardImage(filename, collectionId);
  const [open, setOpen] = useState(false);

  if (!filename || filename === "null" || filename === "") return null;

  return (
    <>
      {src ? (
        <img
          src={src}
          alt=""
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className={`max-h-20 max-w-[120px] object-contain rounded cursor-zoom-in mx-auto mt-2 ${className}`}
        />
      ) : (
        <div className={`h-16 w-24 mx-auto mt-2 rounded bg-gray-100 dark:bg-gray-700 animate-pulse ${className}`} />
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setOpen(false)}>
          <img
            src={src}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
