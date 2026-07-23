export function stripHtml(html: string): string {
  if (!html) return "";
  if (!isHtmlContent(html)) return html;
  // Preserve paragraph/line breaks before stripping tags
  const withBreaks = html
    .replace(/<\/p>/gi, "</p>\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "</div>\n")
    .replace(/<\/li>/gi, "</li>\n");
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = withBreaks;
    return (el.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
  }
  return withBreaks.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function isHtmlContent(str: string): boolean {
  return str.trimStart().startsWith("<");
}
