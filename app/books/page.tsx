"use client";

import { useState } from "react";
import type { Book } from "@/lib/types";
import { loadBooks, saveBooks, loadProgressMap, saveProgressMap } from "@/lib/storage";
import { getTotalParagraphs } from "@/lib/demo-book";
import Link from "next/link";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>(() => {
    if (typeof window === "undefined") return [];
    return loadBooks();
  });

  const remove = (id: string) => {
    if (id === "demo") return;
    const next = books.filter((b) => b.id !== id);
    setBooks(next);
    saveBooks(next);
    const map = loadProgressMap();
    delete map[id];
    saveProgressMap(map);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <Link href="/" className="px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">
          Go to Reader →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((b) => {
          const total = getTotalParagraphs(b);
          const map = typeof window !== "undefined" ? loadProgressMap() : {};
          const prog = map[b.id];
          const done = prog ? prog.completed.length + prog.skipped.length : 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={b.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight line-clamp-2">{b.title}</h3>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">{b.sourceType}</span>
              </div>
              {b.author && <p className="text-xs text-zinc-500">{b.author}</p>}
              <p className="text-xs text-zinc-500">
                {b.chapters.length} chapter{b.chapters.length !== 1 ? "s" : ""} · {total} paragraphs
              </p>
              <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs font-mono text-zinc-500">{done} / {total} · {pct}%</p>
              <div className="mt-auto flex gap-2 pt-2">
                <Link
                  href="/"
                  onClick={() => {
                    // we use main page selector; just navigate home
                  }}
                  className="flex-1 text-center px-3 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium"
                >
                  Read
                </Link>
                {b.id !== "demo" && (
                  <button onClick={() => remove(b.id)} className="px-3 py-2 rounded-full border border-black/10 dark:border-white/15 text-sm">
                    Remove
                  </button>
                )}
              </div>
              {b.id === "demo" && <p className="text-[11px] text-zinc-400">Tutorial — cannot be removed</p>}
            </div>
          );
        })}
      </div>

      {books.length === 0 && <p className="text-sm text-zinc-500 text-center py-16">No books yet. Upload one from the Reader.</p>}

      <div className="mt-8 rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-6 text-center bg-white dark:bg-zinc-900">
        <p className="text-sm font-medium">Want to add more books?</p>
        <p className="text-xs text-zinc-500 mt-1">Go to the Reader and use “+ Upload book” — EPUB, PDF, TXT, MD supported. Files stay local.</p>
        <Link href="/" className="inline-block mt-3 px-4 py-2 rounded-full border border-black/10 dark:border-white/15 text-sm">
          Upload in Reader
        </Link>
      </div>
    </div>
  );
}
