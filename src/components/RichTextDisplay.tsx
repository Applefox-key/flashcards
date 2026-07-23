import DOMPurify from "dompurify";
import { isHtmlContent } from "@/utils/htmlUtils";

interface Props {
  html: string;
  className?: string;
  inline?: boolean;
}

export function RichTextDisplay({ html, className, inline = false }: Props) {
  if (!isHtmlContent(html)) {
    if (inline) {
      return <span className={`whitespace-pre-line ${className ?? ""}`}>{html}</span>;
    }
    return <div className={`whitespace-pre-line ${className ?? ""}`}>{html}</div>;
  }
  const clean = DOMPurify.sanitize(html);
  if (inline) {
    return <span className={`rte-display ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: clean }} />;
  }
  return <div className={`rte-display ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
