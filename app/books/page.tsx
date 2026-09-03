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
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Library</h1>
          <p className="text-sm text-slate-600 mt-1">All your imported books — progress is saved locally.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-500" aria-hidden="true" />
            {books.length} book{books.length !== 1 ? "s" : ""}
          </span>
          <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-semibold shadow-sm transition-colors">
            ← Back to Catalog
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((b) => {
          const total = getTotalParagraphs(b);
          const map = isHydrated ? loadProgressMap() : {};
          const prog = map[b.id];
          const done = prog ? prog.completed.length + prog.skipped.length : 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const isFinished = total > 0 && done >= total;
          const isStarted = pct > 0 && !isFinished;
          return (
            <article
              key={b.id}
              className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-36 bg-gradient-to-br from-slate-50 via-white to-slate-100 border-b border-slate-200 p-4 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-50/60 via-transparent to-transparent" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600 shadow-sm">
                    {b.sourceType}
                  </span>
                  {isFinished ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold shadow-sm">✓ Completed</span>
                  ) : isStarted ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-semibold shadow-sm">● In progress</span>
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
                      {b.chapters.length} ch · {total} para
                    </p>
                    <p className="text-xs font-medium text-slate-900 truncate">{b.author || "Unknown author"}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4 flex-1">
                <div>
                  <h3 className="font-semibold text-[16px] leading-tight text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2 min-h-[3rem]">{b.title}</h3>
                  {b.author && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{b.author}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-mono text-slate-900">
                      {pct}% <span className="text-slate-500 font-normal">· {done}/{total}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5">
                    <div className={`h-full rounded-full transition-all duration-500 ${isFinished ? "bg-emerald-500" : isStarted ? "bg-cyan-500" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFinished ? "bg-emerald-500" : isStarted ? "bg-cyan-500 animate-pulse" : "bg-slate-300"}`} aria-hidden="true" />
                    {isFinished ? "Completed" : isStarted ? "Continue reading" : "Ready to start"}
                  </div>
                </div>
                <div className="mt-auto pt-3 flex items-center gap-2 border-t border-slate-100">
                  <Link
                    href={`/read/${b.id}`}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-sm font-semibold transition-all shadow-sm ${isFinished ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : isStarted ? "bg-slate-900 hover:bg-black text-white" : "bg-cyan-500 hover:bg-cyan-600 text-white"}`}
                  >
                    <span>{isFinished ? "Review" : pct > 0 ? "Continue" : "Start Typing"}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  {b.id !== "demo" && (
                    <button
                      type="button"
                      onClick={() => remove(b.id)}
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
    </div>
  );
}
