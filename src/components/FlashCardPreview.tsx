import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlashCardFace } from "@/components/FlashCardFace";
import type { Content } from "@/types";

interface Props {
  card: Content;
  collectionId: number;
  layout?: "standard" | "document";
}

export function FlashCardPreview({ card, collectionId, layout }: Props) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const isDoc = layout === "document";

  return (
    <div onClick={isDoc ? undefined : () => setFlipped((f) => !f)} className={isDoc ? undefined : "cursor-pointer select-none"}>
      <FlashCardFace
        frontLabel={t("collection_detail.question_label")}
        backLabel={t("collection_detail.answer_label")}
        frontText={card.question}
        backText={card.answer}
        frontImg={card.imgQ}
        backImg={card.imgA}
        note={card.note}
        collectionId={collectionId}
        flipped={flipped}
        layout={layout}
        showBothSides={isDoc}
      />
    </div>
  );
}
