"use client";

import type { Mode } from "@/lib/types";

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 dark:border-white/15 p-1 bg-white dark:bg-zinc-900 shadow-sm">
      <button
        onClick={() => onChange("typing")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          mode === "typing"
            ? "bg-black text-white dark:bg-white dark:text-black shadow"
            : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
        }`}
        aria-pressed={mode === "typing"}
      >
        Typing
      </button>
      <button
        onClick={() => onChange("reading")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          mode === "reading"
            ? "bg-black text-white dark:bg-white dark:text-black shadow"
            : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
        }`}
        aria-pressed={mode === "reading"}
      >
        Reading
      </button>
    </div>
  );
}
