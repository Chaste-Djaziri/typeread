import type { CharState, TypingState } from "../types";

// Foreign chars: anything non-ASCII printable or specifically CJK etc.
// Spec: "If you encounter foreign characters that are not easily typed ... you can press any character (including Space) to mark them as typed."
// We detect them as code points that are not easily typable: non-ASCII or beyond basic latin
export function isForeignChar(char: string): boolean {
  if (!char) return false;
  const cp = char.codePointAt(0) ?? 0;
  // Basic latin printable except excluded: 32-126 is typable
  // But we treat CJK, extended latin with diacritics not on US keyboard as foreign
  // Heuristic: > 126 or char outside [32-126]
  if (cp < 32 || cp > 126) return true;
  return false;
}

export function createTypingState(text: string): TypingState {
  const chars = Array.from(text);
  return {
    text,
    chars,
    cursor: 0,
    display: chars.map(() => "pending" as CharState),
    typed: chars.map(() => null),
    firstAttempts: chars.map(() => null),
    errorCount: 0,
    startedAt: null,
    completed: false,
    paused: false,
  };
}

export type TypingAction =
  | { type: "char"; char: string; ts: number }
  | { type: "backspace"; ts: number }
  | { type: "restart" }
  | { type: "reset"; text: string };

export function isCompleted(state: TypingState): boolean {
  if (state.cursor !== state.chars.length) return false;
  return state.display.every((s) => s === "correct" || s === "corrected" || s === "foreign");
}

export function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "reset":
      return createTypingState(action.text);
    case "restart":
      return createTypingState(state.text);
    case "backspace": {
      if (state.cursor === 0) return state;
      const cursor = state.cursor - 1;
      const display = [...state.display];
      const prev = display[cursor];
      // if was incorrect, decrement errorCount visually but keep firstAttempts
      // display goes back to pending
      display[cursor] = "pending";
      const typed = [...state.typed];
      typed[cursor] = null;
      // Note: we keep firstAttempts as is (first miss stays)
      const completed = false;
      return { ...state, cursor, display, typed, completed };
    }
    case "char": {
      const { char, ts } = action;
      if (state.cursor >= state.chars.length) return state;
      // if already completed, ignore further typing until Enter
      if (state.completed) return state;

      const idx = state.cursor;
      const expected = state.chars[idx];
      const isForeign = isForeignChar(expected);
      const display = [...state.display];
      const typed = [...state.typed];
      const firstAttempts = [...state.firstAttempts];
      let errorCount = state.errorCount;
      let cursor = state.cursor;

      typed[idx] = char;

      if (isForeign) {
        // any key counts as correct for foreign
        display[idx] = "foreign";
        if (firstAttempts[idx] === null) firstAttempts[idx] = "hit";
        cursor++;
      } else if (char === expected) {
        // correct
        if (display[idx] === "incorrect") {
          display[idx] = "corrected";
        } else {
          display[idx] = "correct";
        }
        if (firstAttempts[idx] === null) firstAttempts[idx] = "hit";
        cursor++;
      } else {
        // incorrect - stay on same? spec says must fix mistakes
        // But also says you can make mistakes and continue typing, then backspace to fix
        // Common tutor: advance even on error but mark incorrect and require backspace before completion
        display[idx] = "incorrect";
        if (firstAttempts[idx] === null) {
          firstAttempts[idx] = "miss";
          errorCount++;
        }
        cursor++;
      }

      const startedAt = state.startedAt ?? ts;
      const next: TypingState = {
        ...state,
        display,
        typed,
        firstAttempts,
        errorCount,
        cursor,
        startedAt,
        completed: false,
      };
      // check completion
      if (cursor === next.chars.length) {
        const allGood = next.display.every((s) => s === "correct" || s === "corrected" || s === "foreign");
        if (allGood) {
          next.completed = true;
        }
      }
      return next;
    }
    default:
      return state;
  }
}

// Metrics
export function calculateMetrics(state: TypingState, now: number) {
  const elapsedMs = state.startedAt ? now - state.startedAt : 0;
  const elapsedMin = elapsedMs / 60000;
  const firstAttempts = state.firstAttempts.filter((x) => x !== null);
  const hits = firstAttempts.filter((x) => x === "hit").length;
  const misses = firstAttempts.filter((x) => x === "miss").length;
  const typedChars = state.cursor; // chars attempted
  // WPM: (correct chars / 5) / minutes , or typed chars /5
  // Use standard: WPM = (hits / 5) / minutes  (net)
  // If no time, 0
  const wpm = elapsedMin > 0 ? Math.round((hits / 5) / elapsedMin) : 0;
  const grossWpm = elapsedMin > 0 ? Math.round((typedChars / 5) / elapsedMin) : 0;
  const accuracy = firstAttempts.length > 0 ? Math.round((hits / firstAttempts.length) * 100) : 100;
  // allow capping wpm to reasonable
  return { wpm, grossWpm, accuracy, hits, misses, elapsedMs, typedChars, totalChars: state.chars.length };
}
