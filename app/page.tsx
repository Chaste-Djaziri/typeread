"use client";

import { useState, useMemo } from "react";
import type { Book } from "@/lib/types";
import { loadBooks, saveBooks, loadProgressMap, saveProgressMap } from "@/lib/storage";
import { getTotalParagraphs, demoBook } from "@/lib/demo-book";
import { UploadDropzone } from "@/components/reader/UploadDropzone";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";

import { HeroSection } from "@/components/home/HeroSection";
import { BookCard } from "@/components/books/BookCard";

export default function CatalogPage() {
  const isHydrated = useHydrated();
  const [showUpload, setShowUpload] = useState(false);
  const [customBooks, setCustomBooks] = useState<Book[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const books = useMemo(() => {
    if (!isHydrated) return [demoBook];
    const loaded = loadBooks();
    const merged = [...loaded, ...customBooks];
    const unique = merged.filter((b, idx, arr) => arr.findIndex((x) => x.id === b.id) === idx);
    const active = unique.filter((b) => !deletedIds.includes(b.id));
    return active.find((b) => b.id === "demo") ? active : [demoBook, ...active];
  }, [isHydrated, customBooks, deletedIds]);

  const handleImported = (book: Book) => {
    const next = [book, ...books.filter((b) => b.id !== book.id)];
    setCustomBooks(next);
    saveBooks(next);
    setShowUpload(false);
  };

  const removeBook = (id: string) => {
    if (id === "demo") return;
    setDeletedIds((prev) => [...prev, id]);
    const next = books.filter((b) => b.id !== id);
    saveBooks(next);
    const map = loadProgressMap();
    delete map[id];
    saveProgressMap(map);
  };

  // Overall catalog metrics
  const stats = useMemo(() => {
    if (!isHydrated) return { completedBooks: 0, totalParagraphs: 0, completedParagraphs: 0, avgWpm: 0 };
    const map = loadProgressMap();
    let totalP = 0;
    let completedP = 0;
    let completedB = 0;
    const allWpms: number[] = [];

    books.forEach((b) => {
      const bTotal = getTotalParagraphs(b);
      totalP += bTotal;
      const prog = map[b.id];
      if (prog) {
        const done = prog.completed.length + prog.skipped.length;
        completedP += done;
        if (bTotal > 0 && done >= bTotal) completedB++;
        Object.values(prog.paragraphStats).forEach((s) => {
          if (s.mode === "typed" && s.wpm > 0) allWpms.push(s.wpm);
        });
      }
    });

    const avgWpm = allWpms.length ? Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length) : 0;
    return { completedBooks: completedB, totalParagraphs: totalP, completedParagraphs: completedP, avgWpm };
  }, [books, isHydrated]);

  return (
    <div className="bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <main className="flex-1 flex flex-col">
        {/* HERO */}
        <HeroSection
          books={books}
          stats={stats}
          onUploadClick={() => setShowUpload(true)}
        />

        {/* FEATURES STRIP: Concise & Unified Blue */}
        <section className="bg-slate-50/70 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                📚
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Any Format</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  EPUB, PDF, TXT, or MD — saved 100% locally.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                ⌨️
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tactile Audio</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Synthesized mechanical clicks and live WPM.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                📊
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Saved Progress</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Resume instantly. Chapter and paragraph tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LIBRARY CATALOG */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Library</h2>
              <p className="text-xs text-slate-500 mt-1">Pick a book or upload to start typing.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true" />
                {books.length} book{books.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                + Add Book
              </button>
            </div>
          </div>

          {/* BOOK CARDS GRID */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                isHydrated={isHydrated}
                onRemove={removeBook}
              />
            ))}
          </div>

          {/* RECOMMENDED RESOURCES: Simple, to the point, blue themed */}
          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-700 font-bold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                  Free Books
                </span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
                  Where to Get EPUBs
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Download any free <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded">.epub</code> file and drop it into TypeRead.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <a
                href="https://z-library.sk/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      Z-Library
                    </h4>
                    <span className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors">↗</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Millions of books across all genres with direct EPUB downloads.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-blue-600 shrink-0 group-hover:underline">
                  Visit →
                </span>
              </a>

              <a
                href="https://digilibraries.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      DigiLibraries
                    </h4>
                    <span className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors">↗</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Free digital source for classics, poetry, history, and literature.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-blue-600 shrink-0 group-hover:underline">
                  Visit →
                </span>
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📚</span> Import Book
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Upload EPUB, PDF, TXT, or MD files. Books stay 100% local on your device.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between gap-2">
              <span className="text-slate-500">Need free books?</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <a
                  href="https://z-library.sk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Z-Library ↗
                </a>
                <span className="text-slate-300">·</span>
                <a
                  href="https://digilibraries.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  DigiLibraries ↗
                </a>
              </div>
            </div>

            <UploadDropzone onBookImported={handleImported} />
          </div>
        </div>
      )}
    </div>
  );
}
