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
  // Determine the best initial book to link to
  const primaryBook = books[0];
  const primaryHref = primaryBook ? `/read/${primaryBook.id}` : "/books";
  const hasReadingHistory = stats.completedParagraphs > 0;

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
      {/* Subtle background ambient gradients and grid */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-50"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Clear, Focused Editorial Storytelling */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Minimal Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100/90 border border-slate-200/90 text-slate-700 shadow-xs mb-6">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" aria-hidden="true" />
              <span>Read literature by typing</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Type your way
              <br />
              <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                through stories.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Turn any EPUB, PDF or TXT into a tactile, distraction-free reading experience. Absorb books sentence by sentence with live pace metrics and mechanical audio feedback — 100% private in your browser.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <Link
                href={primaryHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <span>{hasReadingHistory ? "Continue Reading" : "Start Typing Free"}</span>
                <span aria-hidden="true" className="text-slate-300">→</span>
              </Link>

              <button
                type="button"
                onClick={onUploadClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold border border-slate-200 shadow-xs hover:border-slate-300 transition-all active:scale-[0.98]"
              >
                <span className="text-slate-400 font-normal">+</span>
                <span>Upload Book</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  .epub · .pdf
                </span>
              </button>
            </div>

            {/* Reassurance & Value Strip */}
            <div className="mt-10 pt-6 border-t border-slate-200/70 w-full flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 text-sm">🔒</span>
                <span>100% Local & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-600 text-sm">⌨️</span>
                <span>Mechanical Sound Synthesizer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-sm">⚡</span>
                <span>Zero Latency</span>
              </div>
              {hasReadingHistory && (
                <div className="flex items-center gap-2 text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200/70 font-mono text-[11px]">
                  <span>{stats.completedParagraphs} paragraphs typed · {stats.avgWpm} WPM</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Unique Interactive Kinetic Reader Demo */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
            <HeroInteractiveDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
