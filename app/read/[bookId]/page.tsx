"use client";

import { use, useMemo } from "react";
import { ReaderView } from "@/components/reader/ReaderView";
import { demoBook } from "@/lib/demo-book";
import { loadBooks } from "@/lib/storage";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReadPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const resolvedParams = use(params);
  const bookId = resolvedParams?.bookId;
  const isHydrated = useHydrated();
  const router = useRouter();

  const book = useMemo(() => {
    if (bookId === "demo") return demoBook;
    if (!isHydrated) return demoBook;
    const loaded = loadBooks();
    return loaded.find((b) => b.id === bookId) ?? demoBook;
  }, [bookId, isHydrated]);

  if (!book) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Book Not Found</h1>
        <p className="text-slate-600 max-w-md">
          The requested book could not be found in your library.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors text-sm shadow-sm"
        >
          ← Back to Book Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen">
      <ReaderView
        key={book.id}
        book={book}
        onSwitchBook={(id) => {
          if (id === "upload" || id === "catalog") {
            router.push("/");
          } else {
            router.push(`/read/${id}`);
          }
        }}
      />
    </div>
  );
}
