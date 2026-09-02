"use client";

import { useState } from "react";
import { ReaderView } from "@/components/reader/ReaderView";
import { UploadDropzone } from "@/components/reader/UploadDropzone";
import type { Book } from "@/lib/types";
import { demoBook } from "@/lib/demo-book";
import { loadBooks, saveBooks } from "@/lib/storage";
import Link from "next/link";

export default function Home() {
  const [books, setBooks] = useState<Book[]>(() => {
    if (typeof window === "undefined") return [demoBook];
    const loaded = loadBooks();
    if (!loaded.find((b) => b.id === "demo")) return [demoBook, ...loaded];
    return loaded;
  });
  const [activeId, setActiveId] = useState<string>("demo");
  const [showUpload, setShowUpload] = useState(false);

  const activeBook = books.find((b) => b.id === activeId) ?? demoBook;

  const handleImported = (book: Book) => {
    const next = [book, ...books.filter((b) => b.id !== book.id)];
    setBooks(next);
    saveBooks(next);
    setActiveId(book.id);
    setShowUpload(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-black">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Book selector */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {books.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveId(b.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeId === b.id
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                  : "bg-white dark:bg-zinc-900 border-black/10 dark:border-white/15 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {b.title}
              {b.id === "demo" && <span className="ml-1 text-[10px] opacity-70">tutorial</span>}
            </button>
          ))}
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="px-3 py-1.5 rounded-full text-sm border border-dashed border-black/20 dark:border-white/20 hover:bg-white dark:hover:bg-zinc-900"
          >
            + Upload book
          </button>
          <Link href="/books" className="ml-auto text-xs text-zinc-500 hover:text-black dark:hover:text-white">
            Manage books →
          </Link>
        </div>

        {showUpload && (
          <div className="mb-6">
            <UploadDropzone onBookImported={handleImported} />
          </div>
        )}

        <ReaderView key={activeBook.id} book={activeBook} />
      </div>
    </div>
  );
}
