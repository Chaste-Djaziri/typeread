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
      <div className="min-h-screen bg-[#0e1118] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Book Not Found</h1>
        <p className="text-zinc-400 max-w-md">
          The requested book could not be found in your library.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors text-sm"
        >
          ← Back to Book Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0e1118] min-h-screen">
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
