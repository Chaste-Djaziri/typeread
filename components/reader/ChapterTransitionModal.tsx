"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Book, Progress } from "@/lib/types";
import { keyFor } from "@/lib/storage";

type Props = {
  isOpen: boolean;
  book: Book;
  completedChapterIdx: number;
  nextChapterIdx: number;
  progress: Progress;
  onContinue: () => void;
  onOpenContents: () => void;
  onClose: () => void;
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s} s`;
  if (s === 0) return `${m} m`;
  return `${m} m ${s} s`;
}

export function ChapterTransitionModal({
  isOpen,
  book,
  completedChapterIdx,
  nextChapterIdx,
  progress,
  onContinue,
  onOpenContents,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"chapter" | "book">("chapter");
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: pressing Enter or Space triggers Continue, Esc closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onContinue, onClose]);

  const currentChapter = book.chapters[completedChapterIdx];
  const nextChapter = book.chapters[nextChapterIdx];

  // Calculate Chapter Stats
  const chapterStats = useMemo(() => {
    if (!currentChapter) {
      return { speed: 0, accuracy: 100, consistency: 100, timeMs: 0, wordsTyped: 0, fastestWpm: 0 };
    }

    const typedStats = currentChapter.paragraphs
      .map((_, pIdx) => progress.paragraphStats[keyFor(completedChapterIdx, pIdx)])
      .filter((s) => s && s.mode === "typed");

    if (typedStats.length === 0) {
      return { speed: 0, accuracy: 100, consistency: 100, timeMs: 0, wordsTyped: 0, fastestWpm: 0 };
    }

    const speeds = typedStats.map((s) => s.wpm);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const avgAcc = typedStats.reduce((a, b) => a + b.accuracy, 0) / typedStats.length;
    const totalTimeMs = typedStats.reduce((a, b) => a + b.timeMs, 0);
    const totalChars = typedStats.reduce((a, b) => a + b.typedChars, 0);
    const wordsTyped = Math.round(totalChars / 5);
    const fastestWpm = Math.max(...speeds);

    // Consistency formula based on standard deviation
    let consistency = 100;
    if (speeds.length > 1 && avgSpeed > 0) {
      const variance = speeds.reduce((acc, val) => acc + Math.pow(val - avgSpeed, 2), 0) / speeds.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgSpeed;
      consistency = Math.max(0, Math.min(100, Math.round((1 - cv * 0.5) * 100 * 100) / 100));
    }

    return {
      speed: Math.round(avgSpeed * 100) / 100,
      accuracy: Math.round(avgAcc * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      timeMs: totalTimeMs,
      wordsTyped,
      fastestWpm: Math.round(fastestWpm * 100) / 100,
    };
  }, [currentChapter, completedChapterIdx, progress.paragraphStats]);

  // Calculate Book Stats
  const bookStats = useMemo(() => {
    const allTypedStats = Object.values(progress.paragraphStats).filter((s) => s && s.mode === "typed");
    if (allTypedStats.length === 0) {
      return chapterStats;
    }

    const speeds = allTypedStats.map((s) => s.wpm);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const avgAcc = allTypedStats.reduce((a, b) => a + b.accuracy, 0) / allTypedStats.length;
    const totalTimeMs = progress.totalTimeMs || allTypedStats.reduce((a, b) => a + b.timeMs, 0);
    const totalChars = progress.totalTypedChars || allTypedStats.reduce((a, b) => a + b.typedChars, 0);
    const wordsTyped = Math.round(totalChars / 5);
    const fastestWpm = Math.max(...speeds);

    let consistency = 100;
    if (speeds.length > 1 && avgSpeed > 0) {
      const variance = speeds.reduce((acc, val) => acc + Math.pow(val - avgSpeed, 2), 0) / speeds.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgSpeed;
      consistency = Math.max(0, Math.min(100, Math.round((1 - cv * 0.5) * 100 * 100) / 100));
    }

    return {
      speed: Math.round(avgSpeed * 100) / 100,
      accuracy: Math.round(avgAcc * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      timeMs: totalTimeMs,
      wordsTyped,
      fastestWpm: Math.round(fastestWpm * 100) / 100,
    };
  }, [progress, chapterStats]);

  const currentDisplay = activeTab === "chapter" ? chapterStats : bookStats;

  // Copy / Share stats
  const handleShare = useCallback(() => {
    const text = `📖 TypeRead - ${book.title}\nChapter: ${currentChapter?.title}\nSpeed: ${currentDisplay.speed} WPM | Accuracy: ${currentDisplay.accuracy}% | Consistency: ${currentDisplay.consistency}%\nTyping Time: ${formatDuration(currentDisplay.timeMs)} | Words: ${currentDisplay.wordsTyped}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [book.title, currentChapter?.title, currentDisplay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121622] border border-[#262f44] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Next chapter preview header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Next chapter
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {nextChapter?.title ?? `Chapter ${nextChapterIdx + 1}`}
          </h2>
        </div>

        {/* Action Buttons matching reference: [CONTENTS] [CONTINUE] */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <button
            type="button"
            onClick={onOpenContents}
            className="py-2.5 px-4 rounded-xl border border-[#2b354d] bg-[#171d2c] hover:bg-[#1f273b] text-zinc-300 hover:text-white text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            CONTENTS
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1"
          >
            <span>CONTINUE</span>
            <span className="text-[10px] opacity-70">↵</span>
          </button>
        </div>

        {/* Tabs: Chapter Stats | Book Stats */}
        <div className="flex border-b border-[#232b3f] text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("chapter")}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === "chapter"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Chapter Stats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("book")}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === "book"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Book Stats
          </button>
        </div>

        {/* Stats Table / Grid matching prompt specification */}
        <div className="divide-y divide-[#1e2638] text-sm font-mono">
          <div className="py-2 flex items-center justify-between">
            <span className="text-zinc-400">Speed</span>
            <span className="font-semibold text-cyan-300">{currentDisplay.speed.toFixed(2)} wpm</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-zinc-400">Accuracy</span>
            <span className="font-semibold text-emerald-400">{currentDisplay.accuracy.toFixed(2)} %</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-zinc-400">Consistency</span>
            <span className="font-semibold text-purple-300">{currentDisplay.consistency.toFixed(2)} %</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-zinc-400">Typing Time</span>
            <span className="font-semibold text-white">{formatDuration(currentDisplay.timeMs)}</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-zinc-400">Words typed</span>
            <span className="font-semibold text-white">{currentDisplay.wordsTyped}</span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-zinc-400">Fastest paragraph</span>
            <span className="font-semibold text-amber-300">{currentDisplay.fastestWpm.toFixed(2)} wpm</span>
          </div>
        </div>

        {/* Share & Skip Controls */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            type="button"
            onClick={handleShare}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-mono"
          >
            <span>{copied ? "✓ Copied!" : "Share as Image"}</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
          >
            Skip to next chapter →
          </button>
        </div>

        {/* Footer info matching Entertrained */}
        <div className="pt-3 border-t border-[#1e2638] text-[10px] text-zinc-500 text-center space-y-1">
          <p>© 2026 TypeRead · Current version: 1.34.0</p>
          <p>
            Press <kbd className="px-1.5 py-0.5 bg-[#1b2234] text-zinc-300 rounded border border-[#2d3852]">Enter</kbd> to continue to next chapter
          </p>
        </div>
      </div>
    </div>
  );
}
