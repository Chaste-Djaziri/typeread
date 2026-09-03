"use client";

import { useState, useMemo } from "react";
import type { Book } from "@/lib/types";
import { loadBooks, saveBooks, loadProgressMap, saveProgressMap } from "@/lib/storage";
import { getTotalParagraphs, demoBook } from "@/lib/demo-book";
import { UploadDropzone } from "@/components/reader/UploadDropzone";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";

import { HeroSection } from "@/components/home/HeroSection";

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
    <div className="bg-slate-50 text-slate-900 flex flex-col selection:bg-cyan-100 selection:text-cyan-900">
      {/* MAIN CONTENT - Header/Footer via global layout */}
      <main className="flex-1 flex flex-col">
        {/* HERO SECTION */}
        <HeroSection
          books={books}
          stats={stats}
          onUploadClick={() => setShowUpload(true)}
        />

        {/* FEATURES HIGHLIGHT STRIP */}
        <section className="bg-slate-50/70 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 text-lg">
                📚
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Any Book, Any Format</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  EPUB, PDF, TXT, or Markdown. Stored 100% locally and privately in your browser storage.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 text-lg">
                ⌨️
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tactile Live Feedback</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Synthesized mechanical clicks, on-screen keyboard guide, and real-time WPM & accuracy meters.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-lg">
                📊
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Persistent Progress</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Seamlessly resume where you left off. Track completion rate across chapters, books, and speed runs.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* CATALOG HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Library</h2>
            <p className="text-sm text-slate-600 mt-1">Pick a book to continue where you left off — or upload a new one.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-500" aria-hidden="true" />
              {books.length} book{books.length !== 1 ? "s" : ""} available
            </span>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              + Add Book
            </button>
          </div>
        </div>

        {/* BOOK CARDS GRID - Professional design */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => {
            const totalP = getTotalParagraphs(b);
            const map = isHydrated ? loadProgressMap() : {};
            const prog = map[b.id];
            const done = prog ? prog.completed.length + prog.skipped.length : 0;
            const pct = totalP ? Math.round((done / totalP) * 100) : 0;
            const isFinished = totalP > 0 && done >= totalP;
            const isStarted = pct > 0 && !isFinished;

            return (
              <article
                key={b.id}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Cover */}
                <div className="relative h-36 bg-gradient-to-br from-slate-50 via-white to-slate-100 border-b border-slate-200 p-4 flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-50/60 via-transparent to-transparent" aria-hidden="true" />
                  <div className="relative flex items-start justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600 shadow-sm">
                      {b.sourceType}
                    </span>
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold shadow-sm">
                        ✓ Completed
                      </span>
                    ) : isStarted ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-semibold shadow-sm">
                        ● In progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold shadow-sm">New</span>
                    )}
                  </div>
                  <div className="relative flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-500">
                        {b.chapters.length} ch · {totalP} para
                      </p>
                      <p className="text-xs font-medium text-slate-900 truncate">{b.author || "Unknown author"}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div>
                    <h3 className="font-semibold text-[16px] leading-tight text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2 min-h-[3rem]">
                      {b.title}
                    </h3>
                    {b.author && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{b.author}</p>}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-mono text-slate-900">
                        {pct}% <span className="text-slate-500 font-normal">· {done}/{totalP}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isFinished ? "bg-emerald-500" : isStarted ? "bg-cyan-500" : "bg-slate-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${isFinished ? "bg-emerald-500" : isStarted ? "bg-cyan-500 animate-pulse" : "bg-slate-300"}`} aria-hidden="true" />
                      {isFinished ? "Completed" : isStarted ? "Continue reading" : "Ready to start"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-3 flex items-center gap-2 border-t border-slate-100">
                    <Link
                      href={`/read/${b.id}`}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-semibold transition-all shadow-sm ${
                        isFinished
                          ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          : isStarted
                            ? "bg-slate-900 hover:bg-black text-white"
                            : "bg-cyan-500 hover:bg-cyan-600 text-white"
                      }`}
                    >
                      <span>{isFinished ? "Review" : pct > 0 ? "Continue" : "Start Typing"}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    {b.id !== "demo" && (
                      <button
                        type="button"
                        onClick={() => removeBook(b.id)}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
                        title="Delete book"
                        aria-label={`Delete ${b.title}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Recommended EPUB Sources Section */}
        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                Recommended Resources
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-2">
                Where to Get Free Books (EPUB format recommended)
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Download any book in <code className="text-cyan-700 font-mono bg-cyan-50 px-1 py-0.5 rounded">.epub</code> format and click <span className="text-slate-900 font-medium">+ Upload Book</span> above to start typing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {/* Source 1: Z-Library */}
            <a
              href="https://z-library.sk/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-cyan-300 transition-all flex flex-col justify-between gap-3 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-cyan-700 transition-colors flex items-center gap-1.5">
                    <span>Z-Library</span>
                    <span className="text-xs text-slate-400 group-hover:text-cyan-600 transition-colors">↗</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                    Millions of Books
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  One of the largest free online shadow libraries. Offers extensive collections of fiction, non-fiction, academic literature, and bestsellers with direct EPUB download.
                </p>
              </div>
              <div className="text-[11px] font-mono text-cyan-600 group-hover:underline">
                Visit z-library.sk →
              </div>
            </a>

            {/* Source 2: DigiLibraries */}
            <a
              href="https://digilibraries.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between gap-3 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                    <span>DigiLibraries</span>
                    <span className="text-xs text-slate-400 group-hover:text-emerald-600 transition-colors">↗</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Free Digital Library
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Free digital source of eBooks across dozens of genres including classics, history, poetry, and arts. Clean and direct downloads in EPUB and PDF formats.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-600 group-hover:underline">
                Visit digilibraries.com →
              </div>
            </a>
          </div>
        </section>
        </div>
      </main>

      {/* 4. UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span>📚</span> Import Book
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Upload EPUB, PDF, TXT, or Markdown files. Your books stay 100% local on your device.
            </p>

            {/* Quick links to download EPUBs */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between gap-2">
              <span className="text-slate-500">Need free EPUB books?</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <a
                  href="https://z-library.sk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline"
                >
                  Z-Library ↗
                </a>
                <span className="text-slate-300">·</span>
                <a
                  href="https://digilibraries.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
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
