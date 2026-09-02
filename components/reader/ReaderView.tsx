"use client";

import { useEffect, useMemo, useRef, useReducer, useState, useCallback } from "react";
import type { Book, Mode, ParagraphStat, Progress, Settings } from "@/lib/types";
import { createTypingState, typingReducer, calculateMetrics, isForeignChar } from "@/lib/engine/typing-engine";
import { ModeToggle } from "./ModeToggle";
import { StatsBar } from "./StatsBar";
import { keyFor, loadProgressMap, saveProgressMap, makeProgress, loadSettings } from "@/lib/storage";
import Link from "next/link";

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function ReaderView({ book }: { book: Book }) {
  const [mode, setMode] = useState<Mode>("typing");
  const [settings] = useState<Settings>(() => loadSettings());
  const [progress, setProgress] = useState<Progress>(() => {
    if (typeof window === "undefined") return makeProgress(book.id);
    const map = loadProgressMap();
    return map[book.id] ?? makeProgress(book.id);
  });

  // sync progress to storage
  useEffect(() => {
    const map = loadProgressMap();
    map[book.id] = progress;
    saveProgressMap(map);
  }, [progress, book.id]);

  // flatten chapters for easy nav
  const flat = useMemo(() => {
    const arr: { ch: number; p: number; text: string; title: string }[] = [];
    book.chapters.forEach((c, ci) => c.paragraphs.forEach((t, pi) => arr.push({ ch: ci, p: pi, text: t, title: c.title })));
    return arr;
  }, [book]);

  const totalParagraphs = flat.length;
  const currentFlatIndex = useMemo(() => {
    const idx = flat.findIndex((f) => f.ch === progress.chapterIndex && f.p === progress.paragraphIndex);
    return idx >= 0 ? idx : 0;
  }, [flat, progress.chapterIndex, progress.paragraphIndex]);

  const current = flat[currentFlatIndex];
  const currentKey = current ? keyFor(current.ch, current.p) : "";
  const isCompleted = current ? progress.completed.includes(currentKey) || progress.skipped.includes(currentKey) : false;

  // typing state for current paragraph
  const [typingState, dispatch] = useReducer(typingReducer, current?.text ?? "", createTypingState);
  const containerRef = useRef<HTMLDivElement>(null);

  // reset typing state when paragraph changes
  useEffect(() => {
    if (current) dispatch({ type: "reset", text: current.text });
    containerRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.text]);

  // focus container on mode change
  useEffect(() => {
    containerRef.current?.focus();
  }, [mode]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const metrics = useMemo(() => calculateMetrics(typingState, now), [typingState, now]);

  // aggregated stats
  const agg = useMemo(() => {
    const stats = Object.values(progress.paragraphStats);
    const typedStats = stats.filter((s) => s.mode === "typed");
    const avgWpm = typedStats.length ? Math.round(typedStats.reduce((a, s) => a + s.wpm, 0) / typedStats.length) : metrics.wpm;
    const avgAcc = typedStats.length ? Math.round(typedStats.reduce((a, s) => a + s.accuracy, 0) / typedStats.length) : metrics.accuracy;
    const totalTime = progress.totalTimeMs + (typingState.startedAt ? now - typingState.startedAt : 0);
    return { avgWpm, avgAcc, totalTime, typedCount: typedStats.length };
  }, [progress, metrics, typingState.startedAt, now]);

  const elapsedMs = typingState.startedAt ? now - typingState.startedAt : 0;

  const goTo = useCallback(
    (flatIdx: number) => {
      const item = flat[flatIdx];
      if (!item) return;
      setProgress((prev) => ({ ...prev, chapterIndex: item.ch, paragraphIndex: item.p }));
    },
    [flat]
  );

  const markCompleted = useCallback(
    (key: string, stat: ParagraphStat) => {
      setProgress((prev) => {
        if (prev.completed.includes(key) || prev.skipped.includes(key)) return prev;
        const isSkipped = stat.mode !== "typed";
        return {
          ...prev,
          completed: isSkipped ? prev.completed : [...prev.completed, key],
          skipped: isSkipped ? [...prev.skipped, key] : prev.skipped,
          paragraphStats: { ...prev.paragraphStats, [key]: stat },
          totalTimeMs: prev.totalTimeMs + stat.timeMs,
          totalTypedChars: prev.totalTypedChars + stat.typedChars,
        };
      });
    },
    []
  );

  const advance = useCallback(() => {
    if (currentFlatIndex + 1 < flat.length) {
      goTo(currentFlatIndex + 1);
    }
  }, [currentFlatIndex, flat.length, goTo]);

  // keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!current) return;

      // Tab: restart paragraph (only in typing mode, and paragraph not already finished)
      if (e.key === "Tab") {
        e.preventDefault();
        if (mode === "typing" && !isCompleted) {
          dispatch({ type: "restart" });
        }
        return;
      }

      // Shift+Enter: mark as read/skip (typing mode spec: "mark a paragraph as read by pressing Shift+Enter. Try it now two times.")
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (mode === "typing") {
          const key = keyFor(current.ch, current.p);
          if (!progress.completed.includes(key) && !progress.skipped.includes(key)) {
            const stat: ParagraphStat = {
              wpm: 0,
              accuracy: 100,
              errors: 0,
              timeMs: 0,
              typedChars: 0,
              mode: "skipped",
              timestamp: Date.now(),
            };
            markCompleted(key, stat);
          }
          advance();
        }
        return;
      }

      // Enter handling
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (mode === "reading") {
          // mark current as read
          const key = keyFor(current.ch, current.p);
          if (!progress.completed.includes(key) && !progress.skipped.includes(key)) {
            const stat: ParagraphStat = {
              wpm: 0,
              accuracy: 100,
              errors: 0,
              timeMs: 0,
              typedChars: 0,
              mode: "read",
              timestamp: Date.now(),
            };
            markCompleted(key, stat);
          }
          advance();
          return;
        }
        if (mode === "typing") {
          // finish paragraph only if completed (all chars typed correctly)
          if (typingState.completed || isForeignChar(current.text.slice(-1))) {
            // Actually need typingState.completed check; allow Enter to complete
            if (typingState.completed) {
              const m = calculateMetrics(typingState, Date.now());
              const key = keyFor(current.ch, current.p);
              const stat: ParagraphStat = {
                wpm: m.wpm,
                accuracy: m.accuracy,
                errors: m.misses,
                timeMs: m.elapsedMs,
                typedChars: m.typedChars,
                mode: "typed",
                timestamp: Date.now(),
              };
              if (!progress.completed.includes(key) && !progress.skipped.includes(key)) {
                markCompleted(key, stat);
              }
              advance();
            }
            // if not completed, Enter does nothing (must fix errors)
          } else {
            // Require correction: shake hint? do nothing
            // Could optionally require exact complete
            if (typingState.completed) {
              const m = calculateMetrics(typingState, Date.now());
              const key = keyFor(current.ch, current.p);
              const stat: ParagraphStat = {
                wpm: m.wpm,
                accuracy: m.accuracy,
                errors: m.misses,
                timeMs: m.elapsedMs,
                typedChars: m.typedChars,
                mode: "typed",
                timestamp: Date.now(),
              };
              markCompleted(key, stat);
              advance();
            }
          }
          return;
        }
      }

      // Typing mode character input
      if (mode === "typing" && !isCompleted) {
        if (e.key === "Backspace") {
          e.preventDefault();
          dispatch({ type: "backspace", ts: Date.now() });
          return;
        }
        // Ignore modifiers, arrows, etc.
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (["Shift", "CapsLock", "Control", "Alt", "Meta", "Dead", "Process"].includes(e.key)) return;
        if (e.key.length === 1 || e.key === " ") {
          // This includes Space, punctuation, and for foreign paragraph any key will be "hit" via isForeignChar logic
          e.preventDefault();
          dispatch({ type: "char", char: e.key, ts: Date.now() });
          return;
        }
        // For IME composition, ignore
        if ((e as unknown as { isComposing?: boolean }).isComposing) return;
      }
    },
    [current, mode, isCompleted, typingState, progress.completed, progress.skipped, markCompleted, advance]
  );

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold">No paragraphs found</h2>
        <p className="text-sm text-zinc-500">This book appears empty.</p>
      </div>
    );
  }

  const progressPercent = totalParagraphs ? Math.round(((progress.completed.length + progress.skipped.length) / totalParagraphs) * 100) : 0;

  // For display: if paragraph completed, show as completed; otherwise show typing overlay
  const showTypingOverlay = mode === "typing" && !isCompleted;

  // Chapter header for current
  const chapterTitle = book.chapters[current.ch]?.title ?? "";

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[70vh]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-white/80 dark:bg-black/80 backdrop-blur border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
        <ModeToggle mode={mode} onChange={setMode} />
        <StatsBar
          wpm={mode === "typing" && !isCompleted ? metrics.wpm : agg.avgWpm}
          accuracy={mode === "typing" && !isCompleted ? metrics.accuracy : agg.avgAcc}
          progress={`${progress.completed.length + progress.skipped.length} / ${totalParagraphs}`}
          progressPercent={progressPercent}
          elapsedLabel={mode === "typing" && !isCompleted ? formatMs(elapsedMs) : formatMs(agg.totalTime)}
        />
        <Link href="/settings" className="p-2 rounded-full border border-black/10 dark:border-white/15 hover:bg-zinc-50 dark:hover:bg-zinc-900" aria-label="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a1.65 1.65 0 0 0 1-1.51A1.65 1.65 0 0 0 9 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 13.5 4a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 4 0v.49a1.65 1.65 0 0 0 1 1.51c.6.26 1.3.1 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1 1.51V13a1.65 1.65 0 0 0-1 1.51Z" />
          </svg>
        </Link>
      </div>

      {/* Progress thin bar */}
      <div className="h-1 bg-black/5 dark:bg-white/10 w-full">
        <div className="h-full bg-black dark:bg-white transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Chapter label */}
      <div className="mt-6 mb-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{chapterTitle}</p>
      </div>

      {/* Main typing/reading area */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/20 rounded-xl p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 min-h-[280px] flex flex-col justify-center"
        aria-label={mode === "typing" ? "Typing area" : "Reading area"}
      >
        {/* Hint bar */}
        <div className="mb-4 flex flex-wrap gap-2 text-[11px] leading-none">
          {mode === "typing" && !isCompleted && (
            <>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono">
                Enter <span className="text-zinc-500">finish</span>
              </span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono">
                Tab <span className="text-zinc-500">restart</span>
              </span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono">
                Shift+Enter <span className="text-zinc-500">skip</span>
              </span>
            </>
          )}
          {mode === "reading" && (
            <>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono">
                Enter <span className="text-zinc-500">mark read</span>
              </span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono">
                Click <span className="text-zinc-500">jump</span>
              </span>
            </>
          )}
          {isCompleted && <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">Completed — timer paused. Press Enter for next.</span>}
        </div>

        {showTypingOverlay ? (
          <div
            className="leading-relaxed break-words whitespace-pre-wrap select-none"
            style={{
              fontFamily: settings.typingFont === "mono" ? "var(--font-geist-mono)" : settings.typingFont === "serif" ? "Georgia, serif" : "var(--font-geist-sans)",
              fontSize: settings.typingFontSize,
              lineHeight: settings.typingLineHeight,
              letterSpacing: `${settings.typingLetterSpacing}em`,
            }}
          >
            {typingState.chars.map((ch, idx) => {
              const state = typingState.display[idx];
              const isCursor = idx === typingState.cursor;
              let cls = "";
              if (state === "pending") cls = "text-zinc-400 dark:text-zinc-500";
              else if (state === "correct" || state === "corrected" || state === "foreign") cls = "text-black dark:text-white bg-green-50 dark:bg-green-950/30";
              else if (state === "incorrect") cls = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 underline decoration-red-500 decoration-2";
              return (
                <span key={idx} className={`${cls} ${isCursor ? "ring-1 ring-black/20 dark:ring-white/30" : ""} rounded-[2px] px-[1px]`}>
                  {ch}
                  {isCursor && <span className="inline-block w-[2px] h-[1.1em] bg-black dark:bg-white align-[-0.15em] ml-[1px] animate-pulse" />}
                </span>
              );
            })}
            {typingState.cursor === typingState.chars.length && typingState.completed && (
              <span className="ml-1 text-green-600 dark:text-green-400 text-sm font-mono">✓ Press Enter</span>
            )}
          </div>
        ) : (
          // Completed view or reading mode preview of current paragraph
          <p
            className="leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: mode === "typing" ? (settings.typingFont === "mono" ? "var(--font-geist-mono)" : settings.typingFont === "serif" ? "Georgia, serif" : "var(--font-geist-sans)") : settings.readingFont === "serif" ? "Georgia, serif" : "var(--font-geist-sans)",
              fontSize: mode === "typing" ? settings.typingFontSize : settings.readingFontSize,
              lineHeight: mode === "typing" ? settings.typingLineHeight : settings.readingLineHeight,
              letterSpacing: `${mode === "typing" ? settings.typingLetterSpacing : settings.readingLetterSpacing}em`,
            }}
          >
            {current.text}
            {isCompleted && <span className="ml-2 text-xs font-mono text-green-600">✓</span>}
          </p>
        )}

        {!showTypingOverlay && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => advance()}
              className="px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium"
            >
              Next paragraph →
            </button>
            {mode === "typing" && (
              <button
                onClick={() => {
                  // if typing mode but paragraph completed, allow re-type? Reset to allow re-typing?
                  // Remove completion to allow retype
                  const k = keyFor(current.ch, current.p);
                  setProgress((prev) => ({
                    ...prev,
                    completed: prev.completed.filter((x) => x !== k),
                    skipped: prev.skipped.filter((x) => x !== k),
                    paragraphStats: Object.fromEntries(Object.entries(prev.paragraphStats).filter(([kk]) => kk !== k)),
                  }));
                  // will show typing overlay after state update via isCompleted false
                }}
                className="px-3 py-2 rounded-full border border-black/10 dark:border-white/15 text-sm"
              >
                Retype
              </button>
            )}
          </div>
        )}
      </div>

      {/* Paragraph list / chapter navigation */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Chapter progress</h3>
          <span className="text-xs text-zinc-500">
            {progress.completed.length + progress.skipped.length} / {totalParagraphs} completed
          </span>
        </div>

        <div className="space-y-6">
          {book.chapters.map((ch, ci) => {
            const chParagraphs = ch.paragraphs.map((_, pi) => {
              const k = keyFor(ci, pi);
              const globalIdx = flat.findIndex((f) => f.ch === ci && f.p === pi);
              const isActive = ci === current.ch && pi === current.p;
              const done = progress.completed.includes(k) || progress.skipped.includes(k);
              const stat = progress.paragraphStats[k];
              return { k, pi, globalIdx, isActive, done, stat, text: ch.paragraphs[pi] };
            });
            const chDone = chParagraphs.filter((p) => p.done).length;
            return (
              <div key={ch.id} className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 border-b border-black/5 dark:border-white/10">
                  <p className="text-sm font-semibold">{ch.title}</p>
                  <span className="text-xs font-mono text-zinc-500">
                    {chDone} / {ch.paragraphs.length}
                  </span>
                </div>
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {chParagraphs.map(({ k, pi, globalIdx, isActive, done, stat, text }) => (
                    <button
                      key={k}
                      onClick={() => goTo(globalIdx)}
                      className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isActive ? "bg-amber-50 dark:bg-amber-950/20 ring-inset ring-1 ring-amber-200 dark:ring-amber-800" : ""}`}
                    >
                      <span
                        className={`mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono border ${
                          done
                            ? stat?.mode === "typed"
                              ? "bg-green-500 text-white border-green-600"
                              : "bg-zinc-400 text-white border-zinc-500"
                            : isActive
                            ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                            : "bg-white dark:bg-zinc-900 border-black/10 dark:border-white/15 text-zinc-500"
                        }`}
                      >
                        {done ? "✓" : pi + 1}
                      </span>
                      <span className={`text-sm leading-relaxed line-clamp-2 ${done ? "text-zinc-500" : isActive ? "text-black dark:text-white font-medium" : "text-zinc-700 dark:text-zinc-300"}`}>{text}</span>
                      {stat && (
                        <span className="ml-auto hidden sm:inline-flex flex-col items-end text-[11px] font-mono shrink-0">
                          <span className={stat.mode === "typed" ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                            {stat.mode === "typed" ? `${stat.wpm} WPM · ${stat.accuracy}%` : stat.mode === "skipped" ? "skipped" : "read"}
                          </span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Book-level stats */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Avg WPM (typed)</p>
          <p className="text-xl font-mono font-semibold">{agg.avgWpm}</p>
        </div>
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Avg Accuracy</p>
          <p className="text-xl font-mono font-semibold">{agg.avgAcc}%</p>
        </div>
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Time</p>
          <p className="text-xl font-mono font-semibold">{formatMs(agg.totalTime)}</p>
        </div>
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Progress</p>
          <p className="text-xl font-mono font-semibold">{progressPercent}%</p>
        </div>
      </div>

      {/* Nav */}
      <div className="mt-6 flex gap-2">
        <Link href="/books" className="px-4 py-2 rounded-full border border-black/10 dark:border-white/15 text-sm">
          ← Books
        </Link>
        <Link href="/settings" className="px-4 py-2 rounded-full border border-black/10 dark:border-white/15 text-sm">
          Settings
        </Link>
        {currentFlatIndex === totalParagraphs - 1 && isCompleted && (
          <Link href="/books" className="ml-auto px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm font-medium">
            Finish chapter →
          </Link>
        )}
      </div>
    </div>
  );
}
