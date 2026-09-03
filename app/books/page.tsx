"use client";

import { useState, useMemo } from "react";
import { loadBooks, saveBooks, loadProgressMap, saveProgressMap } from "@/lib/storage";
import { getTotalParagraphs, demoBook } from "@/lib/demo-book";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";

export default function BooksPage() {
  const isHydrated = useHydrated();
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const books = useMemo(() => {
    if (!isHydrated) return [demoBook];
    return loadBooks().filter((b) => !removedIds.includes(b.id));
  }, [isHydrated, removedIds]);

  const remove = (id: string) => {
    if (id === "demo") return;
    setRemovedIds((prev) => [...prev, id]);
    const next = books.filter((b) => b.id !== id);
    saveBooks(next);
    const map = loadProgressMap();
    delete map[id];
    saveProgressMap(map);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 bg-white min-h-screen">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Books</h1>
        <Link href="/" className="px-4 py-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 text-sm font-medium transition-colors shadow-sm">
          Go to Reader →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((b) => {
          const total = getTotalParagraphs(b);
          const map = isHydrated ? loadProgressMap() : {};
          const prog = map[b.id];
          const done = prog ? prog.completed.length + prog.skipped.length : 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight line-clamp-2 text-slate-900">{b.title}</h3>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{b.sourceType}</span>
              </div>
              {b.author && <p className="text-xs text-slate-500">{b.author}</p>}
              <p className="text-xs text-slate-500">
                {b.chapters.length} chapter{b.chapters.length !== 1 ? "s" : ""} · {total} paragraphs
              </p>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs font-mono text-slate-500">{done} / {total} · {pct}%</p>
              <div className="mt-auto flex gap-2 pt-2">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-medium transition-colors"
                >
                  Read
                </Link>
                {b.id !== "demo" && (
                  <button
                    onClick={() => remove(b.id)}
                    className="px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
