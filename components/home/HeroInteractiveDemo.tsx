"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { soundEngine } from "@/lib/engine/audio";

interface QuoteItem {
  id: string;
  book: string;
  author: string;
  chapter: string;
  text: string;
}

const DEMO_QUOTES: QuoteItem[] = [
  {
    id: "gatsby",
    book: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    chapter: "Chapter 1",
    text: "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.",
  },
  {
    id: "alice",
    book: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    chapter: "Chapter 1",
    text: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.",
  },
  {
    id: "pride",
    book: "Pride and Prejudice",
    author: "Jane Austen",
    chapter: "Chapter 1",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  },
];

export function HeroInteractiveDemo() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const currentQuote = DEMO_QUOTES[quoteIndex];
  const targetText = currentQuote.text;

  // Mode: "auto" (animating demo) or "user" (user is typing)
  const [mode, setMode] = useState<"auto" | "user">("auto");
  const [cursorIndex, setCursorIndex] = useState(0);
  const [userErrors, setUserErrors] = useState<number>(0);
  const [userKeystrokes, setUserKeystrokes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number>(72);
  const [accuracy, setAccuracy] = useState<number>(99);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound engine enabled state
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setEnabled(next);
    if (next) {
      soundEngine.playKey(" ");
    }
  };

  // Reset to auto demo
  const resetDemo = useCallback((newQuoteIdx?: number) => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    if (newQuoteIdx !== undefined) {
      setQuoteIndex(newQuoteIdx);
    }
    setMode("auto");
    setCursorIndex(0);
    setStartTime(null);
    setWpm(68);
    setAccuracy(100);
    setUserErrors(0);
    setUserKeystrokes(0);
  }, []);

  // Switch quotes
  const nextQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (quoteIndex + 1) % DEMO_QUOTES.length;
    resetDemo(nextIdx);
  };

  // Auto-typing animation loop
  useEffect(() => {
    if (mode !== "auto") return;

    if (cursorIndex >= targetText.length) {
      // Finished sentence in auto demo — wait 3.5s then loop
      autoTimeoutRef.current = setTimeout(() => {
        setCursorIndex(0);
        setWpm(70);
      }, 3500);
      return () => {
        if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      };
    }

    // Realistic human cadence: slight pause on space or comma, otherwise 70-130ms
    const nextChar = targetText[cursorIndex];
    let delay = Math.floor(Math.random() * 55) + 65; // 65 - 120ms
    if (nextChar === " ") delay += 60;
    if (nextChar === "," || nextChar === ".") delay += 140;

    autoTimeoutRef.current = setTimeout(() => {
      setCursorIndex((prev) => prev + 1);

      // Play soft mechanical sound if sound is turned on
      if (soundEnabled) {
        soundEngine.playKey(nextChar);
      }

      // Slightly fluctuate simulated WPM (66 - 78 WPM)
      const currentSimulatedWpm = Math.min(84, Math.max(62, Math.round(72 + Math.sin(cursorIndex * 0.4) * 6)));
      setWpm(currentSimulatedWpm);
      setAccuracy(100);
    }, delay);

    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, [mode, cursorIndex, targetText, soundEnabled]);

  // Handle user starting to type / focusing the interactive box
  const handleContainerClick = () => {
    if (mode === "auto") {
      setMode("user");
      setCursorIndex(0);
      setStartTime(Date.now());
      setWpm(0);
      setAccuracy(100);
      setUserErrors(0);
      setUserKeystrokes(0);
    }
    inputRef.current?.focus();
    setIsFocused(true);
  };

  // Handle live user keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mode !== "user") {
      setMode("user");
      setCursorIndex(0);
      setStartTime(Date.now());
    }

    if (e.key === "Tab") {
      e.preventDefault();
      resetDemo();
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (cursorIndex > 0) {
        setCursorIndex((prev) => prev - 1);
        if (soundEnabled) soundEngine.playKey("Backspace");
      }
      return;
    }

    // Ignore modifier keys
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
      return;
    }

    e.preventDefault();
    const typedChar = e.key;
    const expectedChar = targetText[cursorIndex];

    const now = Date.now();
    const effectiveStart = startTime || now;
    if (!startTime) setStartTime(now);

    const nextKeystrokes = userKeystrokes + 1;
    setUserKeystrokes(nextKeystrokes);

    if (typedChar === expectedChar) {
      // Correct keystroke
      if (soundEnabled) soundEngine.playKey(typedChar, false);
      const nextIndex = cursorIndex + 1;
      setCursorIndex(nextIndex);

      // Compute live WPM and accuracy
      const elapsedMin = Math.max(0.01, (now - effectiveStart) / 60000);
      const calculatedWpm = Math.round(nextIndex / 5 / elapsedMin);
      setWpm(Math.min(180, calculatedWpm));

      const acc = Math.round(((nextKeystrokes - userErrors) / nextKeystrokes) * 100);
      setAccuracy(Math.max(0, acc));
    } else {
      // Error keystroke
      if (soundEnabled) soundEngine.playKey(typedChar, true);
      const nextErrors = userErrors + 1;
      setUserErrors(nextErrors);

      const acc = Math.round(((nextKeystrokes - nextErrors) / nextKeystrokes) * 100);
      setAccuracy(Math.max(0, acc));
    }
  };

  const progressPct = Math.min(100, Math.round((cursorIndex / targetText.length) * 100));
  const isFinished = cursorIndex >= targetText.length;

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative w-full max-w-xl mx-auto rounded-[2rem] bg-white border transition-all duration-300 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] cursor-pointer group select-none ${
        isFocused ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-200/90 hover:border-slate-300"
      }`}
    >
      {/* Hidden input to capture user keystrokes anywhere in the card */}
      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label="Interactive typing trial"
      />

      {/* Decorative ambient backdrop glow */}
      <div
        className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-tr from-blue-200/30 via-indigo-100/20 to-blue-100/30 blur-2xl -z-10 opacity-70 group-hover:opacity-100 transition-opacity"
        aria-hidden="true"
      />

      {/* 1. Header Bar: Book Title, Chapter & Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-3.5 bg-slate-50/60 rounded-t-[2rem]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-700 shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{currentQuote.book}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentQuote.author} · <span className="font-mono">{currentQuote.chapter}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              soundEnabled
                ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-2xs"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
            title={soundEnabled ? "Mute mechanical sounds" : "Enable mechanical typing sounds"}
          >
            {soundEnabled ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-mono">Sound ON</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <span className="hidden sm:inline">Audio</span>
              </>
            )}
          </button>

          {/* Next Quote button */}
          <button
            type="button"
            onClick={nextQuote}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Switch book excerpt"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Interactive Passage Body */}
      <div className="p-6 sm:p-7 min-h-[160px] flex flex-col justify-between">
        <div className="font-mono text-[17px] sm:text-[19px] leading-[1.85] tracking-[0.015em] text-slate-800 break-words whitespace-pre-wrap">
          {/* Typed characters */}
          <span className="text-slate-900 font-medium">
            {targetText.slice(0, cursorIndex)}
          </span>

          {/* Glowing Caret */}
          {!isFinished && (
            <span className="inline-block w-[2.5px] h-[1.15em] bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.7)] align-[-0.15em] mx-[1px] animate-caret" />
          )}

          {/* Remaining upcoming characters */}
          <span className="text-slate-400 font-normal">
            {targetText.slice(cursorIndex)}
          </span>

          {/* Completed Return Symbol */}
          {isFinished && (
            <span className="inline-flex items-center gap-1.5 ml-2 text-xs font-sans font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
              ✓ Paragraph Completed!
            </span>
          )}
        </div>

        {/* Action Hint / Status Indicator */}
        <div className="mt-5 pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            {mode === "auto" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Live Demo · Click anywhere to type
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Typing Live · Press keys or Backspace
              </span>
            )}
          </div>

          {mode === "user" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetDemo();
              }}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-800 transition-colors"
            >
              Reset ↺
            </button>
          ) : (
            <span className="text-[11px] font-mono text-slate-400">
              {progressPct}% typed
            </span>
          )}
        </div>
      </div>

      {/* 3. Bottom Tactile Dashboard (WPM, Accuracy, Progress) */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem] p-3 text-center">
        <div className="px-3 py-1.5">
          <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">Pace</p>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-bold font-mono text-slate-900">{wpm}</span>
            <span className="text-[10px] font-mono text-slate-500">WPM</span>
          </div>
        </div>

        <div className="px-3 py-1.5">
          <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">Accuracy</p>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-xl font-bold font-mono text-slate-900">{accuracy}</span>
            <span className="text-[10px] font-mono text-slate-500">%</span>
          </div>
        </div>

        <div className="px-3 py-1.5">
          <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">Progress</p>
          <div className="mt-2 w-full max-w-[80px] mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
