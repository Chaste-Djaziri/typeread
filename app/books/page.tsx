"use client";

import { useState, useMemo } from "react";
import { loadBooks, saveBooks, loadProgressMap, saveProgressMap } from "@/lib/storage";
import { demoBook } from "@/lib/demo-book";
import { useHydrated } from "@/hooks/useHydrated";
import { BookCard } from "@/components/books/BookCard";
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
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 selection:bg-blue-100 selection:text-blue-900">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Library</h1>
          <p className="text-xs text-slate-500 mt-1">All your imported books, saved locally.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true" />
            {books.length} book{books.length !== 1 ? "s" : ""}
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            ← Catalog
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((b) => (
          <BookCard
            key={b.id}
            book={b}
            isHydrated={isHydrated}
            onRemove={remove}
          />
        ))}
      </div>
    </div>
  );
}
