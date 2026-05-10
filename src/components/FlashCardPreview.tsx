import { useState } from "react";
import { FlashCardFace } from "@/components/FlashCardFace";
import type { Content } from "@/types";

interface Props {
  card: Content;
  collectionId: number;
}

export function FlashCardPreview({ card, collectionId }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div onClick={() => setFlipped((f) => !f)} className="cursor-pointer select-none">
      <FlashCardFace
        frontLabel="Question"
        backLabel="Answer"
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
