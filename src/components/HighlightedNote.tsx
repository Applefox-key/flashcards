export function HighlightedNote({ note, question, answer }: { note: string; question: string; answer: string }) {
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
