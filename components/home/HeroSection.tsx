"use client";

import Link from "next/link";
import type { Book } from "@/lib/types";
import { HeroInteractiveDemo } from "./HeroInteractiveDemo";

interface HeroSectionProps {
  books: Book[];
  stats: {
    completedBooks: number;
    totalParagraphs: number;
    completedParagraphs: number;
    avgWpm: number;
  };
  onUploadClick: () => void;
}

export function HeroSection({ books, stats, onUploadClick }: HeroSectionProps) {
  const primaryBook = books[0];
  const primaryHref = primaryBook ? `/read/${primaryBook.id}` : "/books";
  const hasReadingHistory = stats.completedParagraphs > 0;

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
      {/* Unified blue ambient background */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-40"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Direct, focused copy */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Minimal Blue Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200/80 text-blue-700 shadow-2xs mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" aria-hidden="true" />
              <span>Read by typing</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Type your way
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                through books.
              </span>
            </h1>

            {/* Subheading: Concise & to the point */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Turn any EPUB, PDF, or text into a tactile typing workout. Read paragraph by paragraph with live WPM, mechanical sound, and local progress saving.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href={primaryHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98]"
              >
                <span>{hasReadingHistory ? "Continue Reading" : "Start Typing Free"}</span>
                <span aria-hidden="true" className="text-blue-200">→</span>
              </Link>

              <button
                type="button"
                onClick={onUploadClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold border border-slate-200 shadow-2xs hover:border-slate-300 transition-all active:scale-[0.98]"
              >
                <span>+ Upload Book</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  .epub · .pdf
                </span>
              </button>
            </div>

            {/* Value Highlights */}
            <div className="mt-10 pt-6 border-t border-slate-200/70 w-full flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>100% Local & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Mechanical Audio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Zero Latency</span>
              </div>
              {hasReadingHistory && (
                <div className="flex items-center gap-2 text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-mono text-[11px]">
                  <span>{stats.completedParagraphs} paragraphs typed · {stats.avgWpm} WPM</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Kinetic Typist Demo */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
            <HeroInteractiveDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
