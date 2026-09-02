"use client";

import { useState, useMemo } from "react";
import { ReaderView } from "@/components/reader/ReaderView";
import { UploadDropzone } from "@/components/reader/UploadDropzone";
import type { Book } from "@/lib/types";
import { demoBook } from "@/lib/demo-book";
import { loadBooks, saveBooks } from "@/lib/storage";
import { useHydrated } from "@/hooks/useHydrated";

export default function Home() {
  const isHydrated = useHydrated();
  const [activeId, setActiveId] = useState<string>("demo");
  const [showUpload, setShowUpload] = useState(false);
  const [customBooks, setCustomBooks] = useState<Book[]>([]);

  const books = useMemo(() => {
    if (!isHydrated) return [demoBook];
    const loaded = loadBooks();
    const merged = [...loaded, ...customBooks];
    const unique = merged.filter((b, idx, arr) => arr.findIndex((x) => x.id === b.id) === idx);
    return unique.find((b) => b.id === "demo") ? unique : [demoBook, ...unique];
  }, [isHydrated, customBooks]);

  const activeBook = books.find((b) => b.id === activeId) ?? demoBook;

  const handleImported = (book: Book) => {
    const next = [book, ...books.filter((b) => b.id !== book.id)];
    setCustomBooks(next);
    saveBooks(next);
    setActiveId(book.id);
    setShowUpload(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0e1118] min-h-screen">
      {/* Upload modal if triggered */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141824] border border-[#232a3b] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Import Book</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <UploadDropzone onBookImported={handleImported} />
          </div>
        </div>
      )}

      {/* Reader View full-bleed */}
      <ReaderView
        key={activeBook.id}
        book={activeBook}
        onSwitchBook={(id) => {
          if (id === "upload") {
            setShowUpload(true);
          } else {
            setActiveId(id);
          }
        }}
      />
    </div>
  );
}
