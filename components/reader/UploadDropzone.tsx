"use client";

import { useState, useCallback } from "react";
import type { Book } from "@/lib/types";
import { textToChapters } from "@/lib/parsers/chunk";

type Props = {
  onBookImported: (book: Book) => void;
};

export function UploadDropzone({ onBookImported }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        setError("File too large (max 50 MB)");
        return;
      }
      setLoading(true);
      setError(null);
      setProgress(null);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        let rawText = "";
        if (ext === "epub") {
          const { parseEpubFile } = await import("@/lib/parsers/epub");
          rawText = await parseEpubFile(file);
        } else if (ext === "pdf") {
          const { parsePdfFile } = await import("@/lib/parsers/pdf");
          rawText = await parsePdfFile(file, (p) => setProgress(Math.round(p * 100)));
        } else if (["txt", "md", "text"].includes(ext) || file.type.startsWith("text/")) {
          const { parseTextFile } = await import("@/lib/parsers/text");
          rawText = await parseTextFile(file);
        } else {
          // try as text fallback
          rawText = await file.text();
          if (!rawText.trim()) throw new Error("Unsupported file type. Use .epub, .pdf, .txt, .md");
        }

        const title = file.name.replace(/\.[^/.]+$/, "");
        const chaptersRaw = textToChapters(rawText, title);
        const book: Book = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          author: undefined,
          chapters: chaptersRaw.map((c, idx) => ({
            id: `ch-${idx}`,
            title: c.title,
            paragraphs: c.paragraphs,
          })),
          importedAt: Date.now(),
          sourceType: (ext === "epub" ? "epub" : ext === "pdf" ? "pdf" : ext === "md" ? "md" : "txt") as Book["sourceType"],
        };
        if (book.chapters.length === 0 || book.chapters.every((c) => c.paragraphs.length === 0)) {
          throw new Error("No text found in file");
        }
        onBookImported(book);
      } catch (e: any) {
        setError(e?.message ?? "Failed to parse file");
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [onBookImported]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
        dragOver ? "border-black bg-zinc-50 dark:border-white dark:bg-zinc-900" : "border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900"
      }`}
    >
      <input
        type="file"
        accept=".epub,.pdf,.txt,.md,text/plain,application/epub+zip,application/pdf"
        onChange={(e) => handleFiles(e.target.files)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={loading}
      />
      <div className="pointer-events-none space-y-2">
        <p className="text-sm font-semibold">Drop your book here or click to upload</p>
        <p className="text-xs text-zinc-500">EPUB, PDF (text), TXT, MD — max 50 MB · stays local</p>
        {loading && <p className="text-xs font-mono text-zinc-600">Parsing… {progress !== null ? `${progress}%` : ""}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
