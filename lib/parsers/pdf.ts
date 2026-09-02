// Client-side PDF text extraction via pdfjs-dist
export async function parsePdfFile(file: File, onProgress?: (p: number) => void): Promise<string> {
  const pdfjs = (await import("pdfjs-dist")) as unknown as {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }> }> };
  };
  // pdfjs-dist v5 needs worker
  if (typeof window !== "undefined") {
    const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version ?? "5.4.149"}/build/pdf.worker.min.mjs`;
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    } catch {}
  }
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as { str?: unknown }[])
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);
    // pdfjs gives items with hasEOL flag; joining with space then newline per page is reasonable
    const pageText = strings.join(" ");
    fullText += pageText + "\n\n";
    onProgress?.(i / pdf.numPages);
  }
  if (!fullText.trim()) throw new Error("Could not extract text from PDF (scanned image?)");
  return fullText.trim();
}
