"use client";

import Link from "next/link";
import type { Book } from "@/lib/types";
import { getTotalParagraphs } from "@/lib/demo-book";
import { loadProgressMap } from "@/lib/storage";

interface BookCardProps {
  book: Book;
  isHydrated: boolean;
  onRemove?: (id: string) => void;
}

export function BookCard({ book, isHydrated, onRemove }: BookCardProps) {
  const total = getTotalParagraphs(book);
  const map = isHydrated ? loadProgressMap() : {};
  const prog = map[book.id];
  const done = prog ? prog.completed.length + prog.skipped.length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isFinished = total > 0 && done >= total;
  const isStarted = pct > 0 && !isFinished;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-200 overflow-hidden">
      {/* Top Banner & Metadata */}
      <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
            {book.sourceType}
          </span>

          {isFinished ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
              ✓ Done
            </span>
          ) : isStarted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {pct}%
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
              New
            </span>
          )}
        </div>

        {/* Title & Author */}
        <h3 className="font-bold text-[16px] leading-snug text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.6rem]">
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 truncate mt-1">
          {book.author || "Unknown author"} · {book.chapters.length} ch
        </p>
      </div>

      {/* Body: Progress & Status */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-4">
        {/* Progress Bar & Telemetry */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Reading progress</span>
            <span className="font-mono text-slate-700">
              {done}/{total} <span className="text-slate-400 font-normal">paras</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFinished ? "bg-blue-600" : isStarted ? "bg-blue-600" : "bg-slate-200"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            href={`/read/${book.id}`}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
              isFinished
                ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                : isStarted
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow"
                : "bg-slate-900 hover:bg-black text-white shadow-xs"
            }`}
          >
            <span>{isFinished ? "Review" : isStarted ? "Continue" : "Start Typing"}</span>
            <span aria-hidden="true">→</span>
          </Link>

          {book.id !== "demo" && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(book.id)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
              title="Delete book"
              aria-label={`Delete ${book.title}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
