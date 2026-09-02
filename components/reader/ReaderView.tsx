"use client";

import { useEffect, useMemo, useRef, useReducer, useState, useCallback } from "react";
import { defaultSettings, type Book, type Mode, type ParagraphStat, type Progress, type Settings } from "@/lib/types";
import { createTypingState, typingReducer, calculateMetrics } from "@/lib/engine/typing-engine";
import { soundEngine } from "@/lib/engine/audio";
import { ModeToggle } from "./ModeToggle";
import { VisualKeyboard } from "./VisualKeyboard";
import { ChapterTransitionModal } from "./ChapterTransitionModal";
import { keyFor, loadProgressMap, saveProgressMap, makeProgress, loadSettings, saveSettings } from "@/lib/storage";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";

export function ReaderView({
  book,
  onSwitchBook,
}: {
  book: Book;
  onSwitchBook?: (bookId: string) => void;
}) {
  const isHydrated = useHydrated();
  const [mode, setMode] = useState<Mode>("typing");
  const [userSettings, setUserSettings] = useState<Settings | null>(null);
  const [userProgress, setUserProgress] = useState<Progress | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Inter-chapter transition screen state
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [transitionCompletedChapter, setTransitionCompletedChapter] = useState(0);
  const [transitionNextChapter, setTransitionNextChapter] = useState(1);

  // Active key pressed on physical keyboard (for visual feedback)
  const [activePhysicalKey, setActivePhysicalKey] = useState<string | null>(null);

  // Chapter slide animation state
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);

  // Computed settings: default on server, loaded on client
  const settings = useMemo(() => {
    if (userSettings) return userSettings;
    if (!isHydrated) return defaultSettings;
    return loadSettings();
  }, [userSettings, isHydrated]);

  const soundEnabled = settings.soundFeedback ?? true;
  const showKeyboard = settings.showKeyboard ?? true;

  // Computed progress: default on server, loaded on client
  const progress = useMemo(() => {
    if (userProgress) return userProgress;
    if (!isHydrated) return makeProgress(book.id);
    const map = loadProgressMap();
    return map[book.id] ?? makeProgress(book.id);
  }, [userProgress, isHydrated, book.id]);

  const setProgress = useCallback(
    (updater: Progress | ((prev: Progress) => Progress)) => {
      setUserProgress((prev) => {
        const base = prev ?? (isHydrated ? (loadProgressMap()[book.id] ?? makeProgress(book.id)) : makeProgress(book.id));
        const next = typeof updater === "function" ? updater(base) : updater;
        if (isHydrated) {
          const map = loadProgressMap();
          map[book.id] = next;
          saveProgressMap(map);
        }
        return next;
      });
    },
    [book.id, isHydrated]
  );

  // Sync settings sound engine
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    soundEngine.setVolume(settings.soundVolume ?? 0.35);
  }, [soundEnabled, settings.soundVolume]);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundEngine.setEnabled(next);
    const newSettings = { ...settings, soundFeedback: next };
    setUserSettings(newSettings);
    saveSettings(newSettings);
  };

  const toggleKeyboard = () => {
    const next = !showKeyboard;
    const newSettings = { ...settings, showKeyboard: next };
    setUserSettings(newSettings);
    saveSettings(newSettings);
  };


  // Chapter and paragraph indexes
  const currentChapterIdx = progress.chapterIndex ?? 0;
  const currentChapter = book.chapters[currentChapterIdx] ?? book.chapters[0];
  const currentParagraphIdx = progress.paragraphIndex ?? 0;

  // Active paragraph text
  const activeParagraphText = currentChapter?.paragraphs[currentParagraphIdx] ?? "";
  const activeKey = keyFor(currentChapterIdx, currentParagraphIdx);
  const isActiveCompleted =
    progress.completed.includes(activeKey) || progress.skipped.includes(activeKey);

  // Typing state for active paragraph
  const [typingState, dispatch] = useReducer(
    typingReducer,
    activeParagraphText,
    createTypingState
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const activeParagraphRef = useRef<HTMLDivElement>(null);

  // Reset typing state on paragraph change
  useEffect(() => {
    if (activeParagraphText) {
      dispatch({ type: "reset", text: activeParagraphText });
    }
    // Auto-focus typing container
    containerRef.current?.focus();
  }, [currentChapterIdx, currentParagraphIdx, activeParagraphText]);

  // Keep active paragraph smoothly scrolled into view
  useEffect(() => {
    if (activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentParagraphIdx, currentChapterIdx]);

  // Timer for live stats
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const liveMetrics = useMemo(() => {
    return calculateMetrics(typingState, now);
  }, [typingState, now]);

  // Aggregated stats for the book
  const totalBookParagraphs = useMemo(
    () => book.chapters.reduce((acc, c) => acc + c.paragraphs.length, 0),
    [book]
  );
  const completedCount = progress.completed.length + progress.skipped.length;
  const progressPercent = totalBookParagraphs
    ? Math.round((completedCount / totalBookParagraphs) * 100)
    : 0;

  const aggStats = useMemo(() => {
    const stats = Object.values(progress.paragraphStats);
    const typed = stats.filter((s) => s.mode === "typed");
    const avgWpm = typed.length
      ? Math.round(typed.reduce((a, s) => a + s.wpm, 0) / typed.length)
      : liveMetrics.wpm;
    const avgAcc = typed.length
      ? Math.round(typed.reduce((a, s) => a + s.accuracy, 0) / typed.length)
      : liveMetrics.accuracy;
    return { avgWpm, avgAcc, typedCount: typed.length };
  }, [progress.paragraphStats, liveMetrics]);

  // Next expected character for the visual keyboard
  const nextChar = useMemo(() => {
    if (mode !== "typing" || isActiveCompleted) return null;
    if (typingState.cursor < typingState.chars.length) {
      return typingState.chars[typingState.cursor];
    }
    if (typingState.completed) {
      return "\n"; // Next is Enter to finish paragraph
    }
    return null;
  }, [mode, isActiveCompleted, typingState]);

  // Save completed paragraph stat
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
    [setProgress]
  );

  // Advance to next paragraph or next chapter
  const advance = useCallback(() => {
    if (!currentChapter) return;
    if (currentParagraphIdx + 1 < currentChapter.paragraphs.length) {
      // Advance to next paragraph in this chapter
      setProgress((prev) => ({
        ...prev,
        paragraphIndex: currentParagraphIdx + 1,
      }));
    } else if (currentChapterIdx + 1 < book.chapters.length) {
      // Show chapter completion stats modal before moving to next chapter!
      setTransitionCompletedChapter(currentChapterIdx);
      setTransitionNextChapter(currentChapterIdx + 1);
      setShowChapterTransition(true);
    } else {
      // Completed all chapters and paragraphs in the book!
      setShowCompletionModal(true);
    }
  }, [currentChapter, currentParagraphIdx, currentChapterIdx, book.chapters.length, setProgress]);

  // Handle continue from chapter transition modal
  const handleContinueChapter = useCallback(() => {
    setShowChapterTransition(false);
    setSlideDirection("next");
    setTimeout(() => {
      setProgress((prev) => ({
        ...prev,
        chapterIndex: transitionNextChapter,
        paragraphIndex: 0,
      }));
      setSlideDirection(null);
    }, 150);
  }, [transitionNextChapter, setProgress]);

  // Chapter slide navigation
  const goToChapter = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= book.chapters.length) return;
      setSlideDirection(targetIdx > currentChapterIdx ? "next" : "prev");
      setTimeout(() => {
        setProgress((prev) => ({
          ...prev,
          chapterIndex: targetIdx,
          paragraphIndex: 0,
        }));
        setSlideDirection(null);
      }, 150);
    },
    [book.chapters.length, currentChapterIdx, setProgress]
  );

  // Jump directly to a paragraph
  const jumpToParagraph = useCallback(
    (pIdx: number) => {
      setProgress((prev) => ({ ...prev, paragraphIndex: pIdx }));
      containerRef.current?.focus();
    },
    [setProgress]
  );

  // Physical keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!currentChapter) return;

      setActivePhysicalKey(e.code || e.key);

      // Tab: restart current paragraph
      if (e.key === "Tab") {
        e.preventDefault();
        soundEngine.playKey("Tab");
        if (mode === "typing") {
          dispatch({ type: "restart" });
        }
        return;
      }

      // Shift+Enter: skip paragraph / mark as read
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        soundEngine.playKey("Enter");
        const k = keyFor(currentChapterIdx, currentParagraphIdx);
        if (!progress.completed.includes(k) && !progress.skipped.includes(k)) {
          const stat: ParagraphStat = {
            wpm: 0,
            accuracy: 100,
            errors: 0,
            timeMs: 0,
            typedChars: 0,
            mode: "skipped",
            timestamp: Date.now(),
          };
          markCompleted(k, stat);
        }
        advance();
        return;
      }

      // Enter key
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        soundEngine.playKey("Enter");

        if (mode === "reading") {
          const k = keyFor(currentChapterIdx, currentParagraphIdx);
          if (!progress.completed.includes(k) && !progress.skipped.includes(k)) {
            const stat: ParagraphStat = {
              wpm: 0,
              accuracy: 100,
              errors: 0,
              timeMs: 0,
              typedChars: 0,
              mode: "read",
              timestamp: Date.now(),
            };
            markCompleted(k, stat);
          }
          advance();
          return;
        }

        if (mode === "typing") {
          if (typingState.completed || isActiveCompleted) {
            if (!isActiveCompleted) {
              const m = calculateMetrics(typingState, Date.now());
              const k = keyFor(currentChapterIdx, currentParagraphIdx);
              const stat: ParagraphStat = {
                wpm: m.wpm,
                accuracy: m.accuracy,
                errors: m.misses,
                timeMs: m.elapsedMs,
                typedChars: m.typedChars,
                mode: "typed",
                timestamp: Date.now(),
              };
              markCompleted(k, stat);
            }
            advance();
          }
          return;
        }
      }

      // Backspace
      if (e.key === "Backspace") {
        if (mode === "typing" && !isActiveCompleted) {
          e.preventDefault();
          soundEngine.playKey("Backspace");
          dispatch({ type: "backspace", ts: Date.now() });
        }
        return;
      }

      // Modifier and function keys to ignore
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (["Shift", "CapsLock", "Control", "Alt", "Meta", "Escape", "ArrowUp", "ArrowDown"].includes(e.key)) return;

      // Arrow navigation between paragraphs
      if (e.key === "ArrowLeft") {
        if (currentParagraphIdx > 0) jumpToParagraph(currentParagraphIdx - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        if (currentParagraphIdx + 1 < currentChapter.paragraphs.length) jumpToParagraph(currentParagraphIdx + 1);
        return;
      }

      // Typing input
      if (mode === "typing" && !isActiveCompleted) {
        if (e.key.length === 1 || e.key === " ") {
          e.preventDefault();
          const expected = typingState.chars[typingState.cursor];
          const isError = expected !== undefined && e.key !== expected && e.key !== " ";
          soundEngine.playKey(e.key, isError);
          dispatch({ type: "char", char: e.key, ts: Date.now() });
        }
      }
    },
    [
      currentChapter,
      currentChapterIdx,
      currentParagraphIdx,
      mode,
      isActiveCompleted,
      typingState,
      progress.completed,
      progress.skipped,
      markCompleted,
      advance,
      jumpToParagraph,
    ]
  );

  const handleKeyUp = useCallback(() => {
    setActivePhysicalKey(null);
  }, []);

  // Handle on-screen keyboard click
  const handleVirtualKeyPress = useCallback(
    (key: string) => {
      if (mode !== "typing" || isActiveCompleted) return;
      if (key === "return") {
        if (typingState.completed) {
          soundEngine.playKey("Enter");
          const m = calculateMetrics(typingState, Date.now());
          const k = keyFor(currentChapterIdx, currentParagraphIdx);
          const stat: ParagraphStat = {
            wpm: m.wpm,
            accuracy: m.accuracy,
            errors: m.misses,
            timeMs: m.elapsedMs,
            typedChars: m.typedChars,
            mode: "typed",
            timestamp: Date.now(),
          };
          markCompleted(k, stat);
          advance();
        }
        return;
      }
      if (key === "delete") {
        soundEngine.playKey("Backspace");
        dispatch({ type: "backspace", ts: Date.now() });
        return;
      }
      if (key.length === 1 || key === " ") {
        const expected = typingState.chars[typingState.cursor];
        const isError = expected !== undefined && key !== expected && key !== " ";
        soundEngine.playKey(key, isError);
        dispatch({ type: "char", char: key, ts: Date.now() });
      }
      containerRef.current?.focus();
    },
    [mode, isActiveCompleted, typingState, currentChapterIdx, currentParagraphIdx, markCompleted, advance]
  );

  // Status badge (PAUSED / TYPING / READING)
  const isTypingActive =
    mode === "typing" && !isActiveCompleted && typingState.startedAt && !typingState.completed;
  const statusLabel = mode === "reading" ? "READING" : isTypingActive ? "TYPING" : "PAUSED";

  // Active WPM & Acc
  const displayWpm =
    mode === "typing" && isTypingActive
      ? liveMetrics.wpm
      : aggStats.avgWpm > 0
      ? aggStats.avgWpm
      : "-";
  const displayAcc =
    mode === "typing" && isTypingActive
      ? liveMetrics.accuracy
      : aggStats.avgAcc > 0
      ? aggStats.avgAcc
      : "-";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className="outline-none min-h-screen flex flex-col bg-[#0e1118] text-[#e6edf3] select-none selection:bg-cyan-500/30 selection:text-white relative"
      aria-label="Book reader and touch typing practice"
    >
      {/* 1. TOP BAR matching the screenshot */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#0e1118]/90 border-b border-[#1c2333]">
        <div className="w-full px-4 sm:px-8 h-12 flex items-center justify-between gap-2">
          {/* Breadcrumb: Catalog Link + Book Title / Chapter Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden text-xs sm:text-sm">
            <Link
              href="/"
              className="px-2.5 py-1 rounded-full bg-[#161a25] hover:bg-[#202738] text-zinc-300 hover:text-white border border-[#262e40] text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              title="Return to Book Catalog"
            >
              <span>←</span>
              <span>Catalog</span>
            </Link>
            <button
              onClick={() => setShowBookModal(true)}
              className="text-cyan-400 italic hover:text-cyan-300 transition-colors truncate font-medium cursor-pointer"
              title="Click to switch book"
            >
              {book.title}
            </button>
            <span className="text-zinc-600 italic">/</span>
            <span className="text-zinc-300 font-medium truncate">
              {currentChapter?.title ?? `Chapter ${currentChapterIdx + 1}`}
            </span>
          </div>

          {/* Right badges & toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* PAUSED / TYPING badge */}
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border transition-colors ${
                statusLabel === "PAUSED"
                  ? "bg-[#251b0f] text-[#f59e0b] border-[#92400e]/80"
                  : statusLabel === "TYPING"
                  ? "bg-[#0c2918] text-emerald-400 border-emerald-600/80 animate-pulse"
                  : "bg-[#112433] text-cyan-400 border-cyan-600/80"
              }`}
            >
              {statusLabel}
            </span>

            {/* % Done pill */}
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#161a25] text-zinc-300 border border-[#252c3e]">
              {progressPercent}% done
            </span>

            {/* WPM pill */}
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#161a25] text-zinc-300 border border-[#252c3e]">
              {displayWpm} wpm
            </span>

            {/* Acc pill */}
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#161a25] text-zinc-300 border border-[#252c3e]">
              {displayAcc}
              {typeof displayAcc === "number" ? "%" : ""} acc
            </span>

            {/* Green Switch Toggle matching screenshot */}
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        </div>

        {/* Thin glowing progress line across the top edge */}
        <div className="h-[2px] w-full bg-[#181f2f] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 shadow-[0_0_8px_rgba(45,212,191,0.7)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* 2. MAIN CONTAINER WITH LEFT TOOLBAR AND MULTI-PARAGRAPH VIEW */}
      <div className="flex-1 w-full flex relative px-2 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto">
        {/* Left Floating Utility Dock */}
        <aside className="hidden md:flex flex-col items-center gap-4 fixed left-4 top-28 z-20">
          {/* Sound / Volume button */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? "Mechanical sound click enabled (click to mute)" : "Sound muted (click to enable)"}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? "bg-[#102a1d] text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-[#151924] text-zinc-500 border-[#242c3d] hover:text-zinc-300"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {soundEnabled && (
                <>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              )}
            </svg>
          </button>

          {/* On-screen visual keyboard toggle */}
          <button
            type="button"
            onClick={toggleKeyboard}
            title={showKeyboard ? "Hide on-screen keyboard" : "Show on-screen keyboard"}
            className={`p-2 rounded-xl border transition-all ${
              showKeyboard
                ? "bg-[#102a1d] text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-[#151924] text-zinc-500 border-[#242c3d] hover:text-zinc-300"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="8" x2="6" y2="8" />
              <line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" />
              <line x1="18" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="18" y2="12" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
          </button>

          {/* Volume quick slider / audio toggle icon */}
          <button
            type="button"
            onClick={() => soundEngine.playKey(" ")}
            title="Test mechanical keypress click"
            className="p-2 rounded-xl border bg-[#151924] text-zinc-400 border-[#242c3d] hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </button>

          {/* Crown / Stats button */}
          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            title="View typing performance stats"
            className="p-2 rounded-xl border bg-[#151924] text-amber-400/80 border-[#242c3d] hover:text-amber-300 hover:border-amber-500/40 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
            </svg>
          </button>

          {/* Help / Shortcuts button */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            title="Keyboard shortcuts & instructions"
            className="p-2 rounded-xl border bg-[#151924] text-zinc-400 border-[#242c3d] hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </aside>

        {/* 3. MULTI-PARAGRAPH TYPING CANVAS */}
        <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center">
          {/* Centered Chapter Header with Slide Controls */}
          <div className="w-full flex items-center justify-between my-6 px-4">
            <button
              onClick={() => goToChapter(currentChapterIdx - 1)}
              disabled={currentChapterIdx <= 0}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-cyan-300 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Previous chapter"
            >
              ← Prev
            </button>
            <h1 className="text-sm sm:text-base font-medium tracking-wide text-zinc-400">
              {currentChapter?.title ?? "Chapter"}
            </h1>
            <button
              onClick={() => goToChapter(currentChapterIdx + 1)}
              disabled={currentChapterIdx >= book.chapters.length - 1}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-cyan-300 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Next chapter"
            >
              Next →
            </button>
          </div>

          {/* Multi-Paragraph Container with Slide Transition */}
          <div
            className={`w-full flex flex-col gap-8 sm:gap-10 pb-64 transition-all ${
              slideDirection === "next" ? "slide-next" : slideDirection === "prev" ? "slide-prev" : ""
            }`}
          >
            {currentChapter?.paragraphs.map((paraText, pIdx) => {
              const k = keyFor(currentChapterIdx, pIdx);
              const isCompletedPara =
                progress.completed.includes(k) || progress.skipped.includes(k);
              const isActivePara = pIdx === currentParagraphIdx;
              const pStat = progress.paragraphStats[k];

              return (
                <div
                  key={k}
                  ref={isActivePara ? activeParagraphRef : undefined}
                  onClick={() => {
                    if (!isActivePara) jumpToParagraph(pIdx);
                  }}
                  className={`group relative flex items-start w-full transition-opacity cursor-pointer ${
                    isActivePara
                      ? "opacity-100"
                      : isCompletedPara
                      ? "opacity-90 hover:opacity-100"
                      : "opacity-45 hover:opacity-75"
                  }`}
                >
                  {/* Left Gutter: Stats (e.g. Ω 37 97) matching reference */}
                  <div className="w-16 sm:w-24 shrink-0 text-right pr-3 sm:pr-5 flex items-center justify-end gap-1.5 font-mono text-[11px] sm:text-xs pt-1 select-none">
                    {pStat && pStat.mode === "typed" ? (
                      <span className="inline-flex items-center gap-1.5 text-cyan-400/90 font-medium">
                        <span className="text-zinc-500 font-serif text-[11px]">Ω</span>
                        <span>{pStat.wpm}</span>
                        <span className="text-zinc-400 font-normal">{pStat.accuracy}</span>
                      </span>
                    ) : pStat?.mode === "read" || pStat?.mode === "skipped" ? (
                      <span className="text-zinc-500 text-[10px]">✓</span>
                    ) : isActivePara ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-ping" />
                    ) : null}
                  </div>

                  {/* Paragraph Content */}
                  <div
                    className="flex-1 font-mono text-base sm:text-[18px] leading-[1.8] sm:leading-[1.9] tracking-[0.02em] break-words whitespace-pre-wrap"
                    style={{
                      fontFamily:
                        settings.typingFont === "mono"
                          ? "var(--font-geist-mono), monospace"
                          : settings.typingFont === "serif"
                          ? "Georgia, serif"
                          : "var(--font-geist-sans), sans-serif",
                    }}
                  >
                    {isActivePara && mode === "typing" && !isCompletedPara ? (
                      // Live typing view with character-by-character coloring & cursor
                      <div className="inline">
                        {typingState.chars.map((char, cIdx) => {
                          const state = typingState.display[cIdx];
                          const isCursor = cIdx === typingState.cursor;

                          let charClass = "text-[#8d9ab5]"; // pending character color
                          if (state === "correct" || state === "corrected" || state === "foreign") {
                            charClass = "text-[#ffffff] font-medium"; // typed correctly
                          } else if (state === "incorrect") {
                            charClass =
                              "text-red-400 bg-red-950/60 underline decoration-red-500 decoration-2"; // typo
                          }

                          return (
                            <span key={cIdx} className="relative inline">
                              {isCursor && (
                                <span className="inline-block w-[2px] sm:w-[2.5px] h-[1.15em] bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] align-[-0.15em] mr-[-2px] animate-caret z-10" />
                              )}
                              <span className={charClass}>{char}</span>
                            </span>
                          );
                        })}

                        {/* Cursor at the end of text */}
                        {typingState.cursor === typingState.chars.length && (
                          <span className="inline-block w-[2px] sm:w-[2.5px] h-[1.15em] bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] align-[-0.15em] ml-[1px] animate-caret z-10" />
                        )}

                        {/* Return symbol ↵ at end of active paragraph */}
                        <span
                          className={`ml-1 text-sm font-sans transition-colors ${
                            typingState.completed
                              ? "text-cyan-400 font-bold animate-pulse"
                              : "text-zinc-600"
                          }`}
                          title="Press Enter to finish paragraph"
                        >
                          ↵
                        </span>
                      </div>
                    ) : (
                      // Completed or Upcoming Paragraph View
                      <div className="inline">
                        <span
                          className={
                            isCompletedPara
                              ? "text-[#d6dfed]"
                              : isActivePara
                              ? "text-white font-medium"
                              : "text-[#58647c]"
                          }
                        >
                          {paraText}
                        </span>

                        {/* Return symbol ↵ at end of paragraph */}
                        <span className="ml-1 text-sm font-sans text-zinc-600">
                          ↵
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. ON-SCREEN VISUAL KEYBOARD AT THE BOTTOM */}
          {showKeyboard && mode === "typing" && (
            <div className="w-full sticky bottom-3 z-20 pt-4 pb-2">
              <VisualKeyboard
                activeKey={activePhysicalKey}
                nextChar={nextChar}
                onKeyPress={handleVirtualKeyPress}
              />
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: STATS DRAWER / MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141824] border border-[#232a3b] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🏆</span> Typing Statistics
              </h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47]">
                <p className="text-xs text-zinc-400">Average WPM</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{aggStats.avgWpm}</p>
              </div>
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47]">
                <p className="text-xs text-zinc-400">Accuracy</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{aggStats.avgAcc}%</p>
              </div>
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47]">
                <p className="text-xs text-zinc-400">Completed</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {completedCount} / {totalBookParagraphs}
                </p>
              </div>
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47]">
                <p className="text-xs text-zinc-400">Progress</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{progressPercent}%</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-full text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HELP / SHORTCUTS MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141824] border border-[#232a3b] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>💡</span> Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              <li className="flex items-center justify-between">
                <span>Finish paragraph & advance</span>
                <kbd className="px-2 py-1 bg-[#232a3b] rounded text-xs font-mono text-cyan-300">Enter</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Restart current paragraph</span>
                <kbd className="px-2 py-1 bg-[#232a3b] rounded text-xs font-mono text-cyan-300">Tab</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Skip paragraph without typing</span>
                <kbd className="px-2 py-1 bg-[#232a3b] rounded text-xs font-mono text-cyan-300">Shift + Enter</kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Jump directly to any paragraph</span>
                <span className="text-xs text-zinc-400">Click paragraph</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Switch between Typing and Reading mode</span>
                <span className="text-xs text-zinc-400">Top-right toggle</span>
              </li>
            </ul>
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-full text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BOOK SWITCHER MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141824] border border-[#232a3b] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232a3b] pb-3">
              <h2 className="text-lg font-semibold text-white">Library</h2>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Select a book to read or upload your own files (EPUB, PDF, TXT, MD).
            </p>
            <div className="flex flex-col gap-2 pt-2 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onSwitchBook?.("demo");
                  setShowBookModal(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  book.id === "demo"
                    ? "bg-[#1f283d] text-cyan-300 border-cyan-500/50"
                    : "bg-[#1d2436] hover:bg-[#252e45] text-zinc-200 border-[#2d3852]"
                }`}
              >
                Welcome to TypeRead (Tutorial)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSwitchBook?.("upload");
                  setShowBookModal(false);
                }}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-medium transition-colors"
              >
                + Upload New Book
              </button>
              <Link
                href="/books"
                className="w-full text-center px-4 py-2.5 rounded-xl bg-[#1d2436] hover:bg-[#252e45] text-zinc-300 text-sm font-medium border border-[#2d3852] transition-colors"
              >
                Manage All Books →
              </Link>
              <Link
                href="/settings"
                className="w-full text-center px-4 py-2.5 rounded-xl bg-[#1d2436] hover:bg-[#252e45] text-zinc-400 text-sm font-medium border border-[#2d3852] transition-colors"
              >
                Settings & Typography →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: BOOK COMPLETED CELEBRATION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141824] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 text-black flex items-center justify-center text-3xl mx-auto shadow-lg shadow-cyan-500/20">
              🎉
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 inline-block mb-2">
                Book Finished!
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {book.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2">
                Congratulations! You typed through all {book.chapters.length} chapter{book.chapters.length !== 1 ? "s" : ""} and completed the entire book.
              </p>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-center pt-2">
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47]">
                <p className="text-[10px] uppercase text-zinc-500">Average WPM</p>
                <p className="text-2xl font-bold text-cyan-400 mt-0.5">{aggStats.avgWpm || liveMetrics.wpm || "-"}</p>
              </div>
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47]">
                <p className="text-[10px] uppercase text-zinc-500">Accuracy</p>
                <p className="text-2xl font-bold text-emerald-400 mt-0.5">{aggStats.avgAcc}%</p>
              </div>
              <div className="p-3 bg-[#191f30] rounded-xl border border-[#252f47] col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase text-zinc-500">Paragraphs</p>
                <p className="text-2xl font-bold text-white mt-0.5">{totalBookParagraphs}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="w-full sm:w-auto flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
              >
                Find Other Books in Catalog →
              </Link>
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="w-full sm:w-auto px-4 py-3 rounded-full border border-[#2d3852] text-zinc-400 hover:text-white text-xs font-medium transition-colors"
              >
                Stay Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CHAPTER TRANSITION & STATS MODAL */}
      <ChapterTransitionModal
        isOpen={showChapterTransition}
        book={book}
        completedChapterIdx={transitionCompletedChapter}
        nextChapterIdx={transitionNextChapter}
        progress={progress}
        onContinue={handleContinueChapter}
        onOpenContents={() => {
          setShowChapterTransition(false);
          setShowBookModal(true);
        }}
        onClose={() => setShowChapterTransition(false)}
      />
    </div>
  );
}
