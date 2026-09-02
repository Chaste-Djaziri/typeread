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
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <Link href="/" className="px-4 py-2 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 text-sm font-medium transition-colors">
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
            <div key={b.id} className="rounded-2xl border border-[#232a3b] bg-[#141824] p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight line-clamp-2 text-white">{b.title}</h3>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-[#1b2234] text-zinc-300 border border-[#2d3852]">{b.sourceType}</span>
              </div>
              {b.author && <p className="text-xs text-zinc-400">{b.author}</p>}
              <p className="text-xs text-zinc-400">
                {b.chapters.length} chapter{b.chapters.length !== 1 ? "s" : ""} · {total} paragraphs
              </p>
              <div className="h-1.5 rounded-full bg-[#1b2234] overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs font-mono text-zinc-400">{done} / {total} · {pct}%</p>
              <div className="mt-auto flex gap-2 pt-2">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                >
                  Read
                </Link>
                {b.id !== "demo" && (
                  <button
                    onClick={() => remove(b.id)}
                    className="px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
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
