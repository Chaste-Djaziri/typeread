export function textToParagraphs(raw: string): string[] {
  // Normalize line endings, split on double newlines or single newlines that separate paragraphs
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Split by 2+ newlines OR treat each non-empty line as paragraph if no double newline present
  // Heuristic: if document contains \n\n, use that, otherwise split by \n
  const hasDouble = normalized.includes("\n\n");
  let parts: string[];
  if (hasDouble) {
    parts = normalized.split(/\n\s*\n/);
  } else {
    parts = normalized.split(/\n/);
  }
  return parts
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
}

export function textToChapters(raw: string, title: string): { title: string; paragraphs: string[] }[] {
  // Try to detect chapters via headings like "Chapter", "CHAPTER", "# ", etc.
  const lines = raw.split("\n");
  const chapters: { title: string; paragraphs: string[] }[] = [];
  let currentTitle = title || "Chapter 1";
  let currentText = "";

  const chapterRegex = /^(chapter\s+\d+|chapter\s+[ivx]+|#\s+.*|\d+\.\s+[A-Z].*)$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 80 && chapterRegex.test(trimmed)) {
      // flush previous
      if (currentText.trim()) {
        chapters.push({ title: currentTitle, paragraphs: textToParagraphs(currentText) });
        currentText = "";
      }
      currentTitle = trimmed;
    } else {
      currentText += line + "\n";
    }
  }
  if (currentText.trim()) {
    chapters.push({ title: currentTitle, paragraphs: textToParagraphs(currentText) });
  }
  if (chapters.length === 0) {
    chapters.push({ title: title || "Chapter 1", paragraphs: textToParagraphs(raw) });
  }
  // Filter empty chapters
  return chapters.filter((c) => c.paragraphs.length > 0);
}
