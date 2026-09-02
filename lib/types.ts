export type Mode = "typing" | "reading";

export type Book = {
  id: string;
  title: string;
  author?: string;
  chapters: Chapter[];
  importedAt: number;
  sourceType: "epub" | "pdf" | "txt" | "md" | "demo";
};

export type Chapter = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type Progress = {
  bookId: string;
  chapterIndex: number;
  paragraphIndex: number;
  // per-book sets stored as arrays for JSON
  completed: string[]; // "cIdx-pIdx"
  skipped: string[];
  // typing stats per paragraph
  paragraphStats: Record<string, ParagraphStat>;
  totalTypedChars: number;
  totalCorrectChars: number;
  totalTimeMs: number;
  startedAt?: number;
};

export type ParagraphStat = {
  wpm: number;
  accuracy: number; // 0-100
  errors: number;
  timeMs: number;
  typedChars: number;
  mode: "typed" | "skipped" | "read";
  timestamp: number;
};

export type Settings = {
  typingFont: string;
  readingFont: string;
  typingFontSize: number;
  readingFontSize: number;
  typingLineHeight: number;
  readingLineHeight: number;
  typingLetterSpacing: number;
  readingLetterSpacing: number;
  showKeyboard: boolean;
  keyboardLayout: "qwerty" | "qwertz" | "azerty";
  theme: "light" | "dark" | "sepia" | "auto";
};

export const defaultSettings: Settings = {
  typingFont: "mono",
  readingFont: "serif",
  typingFontSize: 18,
  readingFontSize: 18,
  typingLineHeight: 1.8,
  readingLineHeight: 1.7,
  typingLetterSpacing: 0.02,
  readingLetterSpacing: 0.01,
  showKeyboard: false,
  keyboardLayout: "qwerty",
  theme: "auto",
};

export type CharState = "pending" | "correct" | "incorrect" | "corrected" | "foreign";

export type TypingState = {
  text: string;
  chars: string[];
  cursor: number;
  display: CharState[];
  typed: (string | null)[];
  firstAttempts: ("hit" | "miss" | null)[];
  errorCount: number;
  startedAt: number | null;
  completed: boolean;
  // for timer pausing
  paused: boolean;
};
