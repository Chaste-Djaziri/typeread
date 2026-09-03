"use client";

import type { Mode } from "@/lib/types";

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const isTyping = mode === "typing";

  return (
    <div className="relative group">
      <button
        onClick={() => onChange(isTyping ? "reading" : "typing")}
        className={`relative flex items-center justify-between w-14 h-7 px-1 rounded-full transition-colors border shadow-sm ${
          isTyping
            ? "bg-emerald-50 border-emerald-300"
            : "bg-slate-100 border-slate-300"
        }`}
        aria-label={isTyping ? "Switch to reading mode" : "Switch to typing mode"}
        title={isTyping ? "Click to switch to reading mode" : "Click to switch to typing mode"}
      >
        {/* Keyboard icon */}
        <span className={`text-[11px] leading-none transition-opacity ${isTyping ? "opacity-100 text-emerald-600" : "opacity-40 text-slate-400"}`}>
          ⌨️
        </span>

        {/* Book icon */}
        <span className={`text-[11px] leading-none transition-opacity ${!isTyping ? "opacity-100 text-blue-600" : "opacity-40 text-slate-400"}`}>
          📖
        </span>

        {/* Sliding dot */}
        <span
          className={`absolute top-0.5 bottom-0.5 w-6 rounded-full transition-transform duration-200 flex items-center justify-center shadow-md ${
            isTyping
              ? "left-0.5 translate-x-0 bg-emerald-500"
              : "left-0.5 translate-x-7 bg-blue-600"
          }`}
        />
      </button>

      {/* Tooltip matching screenshot */}
      <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1 text-[11px] font-mono rounded bg-white text-slate-700 border border-slate-200 shadow-xl pointer-events-none">
        {isTyping ? "Click to switch to reading mode" : "Click to switch to typing mode"}
      </div>
    </div>
  );
}
