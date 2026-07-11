import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlashCardFace } from "@/components/FlashCardFace";
import type { Content } from "@/types";

interface Props {
  card: Content;
  collectionId: number;
}

export function FlashCardPreview({ card, collectionId }: Props) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  return (
    <div onClick={() => setFlipped((f) => !f)} className="cursor-pointer select-none">
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
      />
    </div>
  );
}
