"use client";

import { useState, useMemo } from "react";
import type { Book } from "@/lib/types";
import { loadBooks, saveBooks, loadProgressMap, saveProgressMap } from "@/lib/storage";
import { getTotalParagraphs, demoBook } from "@/lib/demo-book";
import { UploadDropzone } from "@/components/reader/UploadDropzone";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#0e1118] text-[#e6edf3] flex flex-col selection:bg-cyan-500/30 selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#0e1118]/90 border-b border-[#1c2333]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 text-black flex items-center justify-center font-mono text-sm font-black shadow-md shadow-cyan-500/20">
              TR
            </span>
            <span className="font-bold text-base tracking-tight text-white">TypeRead</span>
            <span className="hidden sm:inline text-xs text-zinc-500">Read by Typing</span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#182030] text-cyan-300 border border-cyan-500/40"
            >
              Book Catalog
            </Link>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-black transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>+</span> Upload Book
            </button>
            <Link
              href="/settings"
              className="p-2 rounded-full border border-[#232a3b] bg-[#141824] hover:bg-[#1a2030] text-zinc-400 hover:text-white transition-colors"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a1.65 1.65 0 0 0 1-1.51A1.65 1.65 0 0 0 9 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 13.5 4a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 4 0v.49a1.65 1.65 0 0 0 1 1.51c.6.26 1.3.1 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1 1.51V13a1.65 1.65 0 0 0-1 1.51Z" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Banner / Overview */}
        <section className="rounded-3xl border border-[#232a3b] bg-gradient-to-br from-[#141824] via-[#10131d] to-[#0c0e17] p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 mb-3">
              Library & Reading Catalog
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Type your way through stories, articles, and books.
            </h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Choose any book below to enter the full-screen typing interface with mechanical click sound feedback and live guidance.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1e2538] font-mono text-center">
            <div className="p-3 bg-[#161c2b]/70 rounded-xl border border-[#232d44]">
              <p className="text-[11px] text-zinc-500">Books Available</p>
              <p className="text-xl font-bold text-white mt-0.5">{books.length}</p>
            </div>
            <div className="p-3 bg-[#161c2b]/70 rounded-xl border border-[#232d44]">
              <p className="text-[11px] text-zinc-500">Completed Books</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.completedBooks}</p>
            </div>
            <div className="p-3 bg-[#161c2b]/70 rounded-xl border border-[#232d44]">
              <p className="text-[11px] text-zinc-500">Paragraphs Typed</p>
              <p className="text-xl font-bold text-cyan-400 mt-0.5">
                {stats.completedParagraphs} <span className="text-xs font-normal text-zinc-500">/ {stats.totalParagraphs}</span>
              </p>
            </div>
            <div className="p-3 bg-[#161c2b]/70 rounded-xl border border-[#232d44]">
              <p className="text-[11px] text-zinc-500">Overall Avg WPM</p>
              <p className="text-xl font-bold text-purple-400 mt-0.5">{stats.avgWpm || "-"}</p>
            </div>
          </div>
        </section>

        {/* Catalog Grid Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white tracking-tight">Available Books</h2>
          <span className="text-xs text-zinc-500">{books.length} book{books.length !== 1 ? "s" : ""}</span>
        </div>

        {/* 3. BOOK CARDS GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((b) => {
            const totalP = getTotalParagraphs(b);
            const map = isHydrated ? loadProgressMap() : {};
            const prog = map[b.id];
            const done = prog ? prog.completed.length + prog.skipped.length : 0;
            const pct = totalP ? Math.round((done / totalP) * 100) : 0;
            const isFinished = totalP > 0 && done >= totalP;

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-[#232a3b] bg-[#141824] hover:border-cyan-500/40 p-5 flex flex-col gap-4 shadow-lg transition-all group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1b2234] text-zinc-400 border border-[#2c364e]">
                      {b.sourceType}
                    </span>
                    <h3 className="font-semibold text-base text-white group-hover:text-cyan-300 transition-colors mt-2 line-clamp-2">
                      {b.title}
                    </h3>
                  </div>
                  {isFinished && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 text-[10px] font-mono font-medium">
                      ✓ Completed
                    </span>
                  )}
                </div>

                {b.author && <p className="text-xs text-zinc-400 line-clamp-1">{b.author}</p>}

                {/* Chapters and paragraphs summary */}
                <p className="text-xs text-zinc-500">
                  {b.chapters.length} chapter{b.chapters.length !== 1 ? "s" : ""} · {totalP} paragraphs
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>Progress</span>
                    <span>{pct}% ({done} / {totalP})</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1e2538] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFinished ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-cyan-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-[#1e2538]">
                  <Link
                    href={`/read/${b.id}`}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>{pct > 0 ? "Continue" : "Start Typing"}</span>
                    <span>→</span>
                  </Link>

                  {b.id !== "demo" && (
                    <button
                      type="button"
                      onClick={() => removeBook(b.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete book"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommended EPUB Sources Section */}
        <section className="mt-12 rounded-3xl border border-[#232a3b] bg-[#141824] p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                Recommended Resources
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-2">
                Where to Get Free Books (EPUB format recommended)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Download any book in <code className="text-cyan-300 font-mono">.epub</code> format and click <span className="text-white font-medium">+ Upload Book</span> above to start typing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {/* Source 1: Z-Library */}
            <a
              href="https://z-library.sk/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl border border-[#262f44] bg-[#171d2c] hover:bg-[#1c2438] hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                    <span>Z-Library</span>
                    <span className="text-xs text-zinc-500 group-hover:text-cyan-400 transition-colors">↗</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                    Millions of Books
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  One of the largest free online shadow libraries. Offers extensive collections of fiction, non-fiction, academic literature, and bestsellers with direct EPUB download.
                </p>
              </div>
              <div className="text-[11px] font-mono text-cyan-400 group-hover:underline">
                Visit z-library.sk →
              </div>
            </a>

            {/* Source 2: DigiLibraries */}
            <a
              href="https://digilibraries.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl border border-[#262f44] bg-[#171d2c] hover:bg-[#1c2438] hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <span>DigiLibraries</span>
                    <span className="text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">↗</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                    Free Digital Library
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Free digital source of eBooks across dozens of genres including classics, history, poetry, and arts. Clean and direct downloads in EPUB and PDF formats.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 group-hover:underline">
                Visit digilibraries.com →
              </div>
            </a>
          </div>
        </section>
      </main>

      {/* 4. UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141824] border border-[#232a3b] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📚</span> Import Book
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Upload EPUB, PDF, TXT, or Markdown files. Your books stay 100% local on your device.
            </p>

            {/* Quick links to download EPUBs */}
            <div className="p-3 bg-[#171d2c] border border-[#252f44] rounded-xl text-xs text-zinc-300 flex items-center justify-between gap-2">
              <span className="text-zinc-400">Need free EPUB books?</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <a
                  href="https://z-library.sk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Z-Library ↗
                </a>
                <span className="text-zinc-600">·</span>
                <a
                  href="https://digilibraries.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  DigiLibraries ↗
                </a>
              </div>
            </div>

            <UploadDropzone onBookImported={handleImported} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1c2333] py-6 text-center text-xs text-zinc-500">
        TypeRead — local only · your books never leave your device
      </footer>
    </div>
  );
}
