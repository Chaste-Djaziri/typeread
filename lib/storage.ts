import type { Book, Progress, Settings } from "./types";
import { defaultSettings } from "./types";
import { demoBook } from "./demo-book";

const BOOKS_KEY = "typeread_books_v1";
const PROGRESS_KEY = "typeread_progress_v1";
const SETTINGS_KEY = "typeread_settings_v1";

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function loadBooks(): Book[] {
  if (typeof window === "undefined") return [demoBook];
  const raw = localStorage.getItem(BOOKS_KEY);
  const books = safeJsonParse<Book[] | null>(raw, null);
  if (!books || books.length === 0) return [demoBook];
  // ensure demo always present
  if (!books.find((b) => b.id === "demo")) return [demoBook, ...books];
  return books;
}

export function saveBooks(books: Book[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function loadProgressMap(): Record<string, Progress> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PROGRESS_KEY);
  return safeJsonParse(raw, {});
}

export function saveProgressMap(map: Record<string, Progress>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  return safeJsonParse(raw, defaultSettings);
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function makeProgress(bookId: string): Progress {
  return {
    bookId,
    chapterIndex: 0,
    paragraphIndex: 0,
    completed: [],
    skipped: [],
    paragraphStats: {},
    totalTypedChars: 0,
    totalCorrectChars: 0,
    totalTimeMs: 0,
  };
}

export function keyFor(ch: number, p: number) {
  return `${ch}-${p}`;
}

export function parseKey(k: string): { ch: number; p: number } {
  const [a, b] = k.split("-").map(Number);
  return { ch: a, p: b };
}
