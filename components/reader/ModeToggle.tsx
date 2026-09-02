"use client";

import type { Mode } from "@/lib/types";

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const isTyping = mode === "typing";

  return (
    <div className="relative group">
      <button
        onClick={() => onChange(isTyping ? "reading" : "typing")}
        className={`relative flex items-center justify-between w-14 h-7 px-1 rounded-full transition-colors border ${
          isTyping
            ? "bg-[#183d28] border-emerald-500/60"
            : "bg-[#1e293b] border-cyan-500/60"
        }`}
        aria-label={isTyping ? "Switch to reading mode" : "Switch to typing mode"}
        title={isTyping ? "Click to switch to reading mode" : "Click to switch to typing mode"}
      >
        {/* Keyboard icon */}
        <span className={`text-[11px] leading-none transition-opacity ${isTyping ? "opacity-100 text-emerald-300" : "opacity-40 text-zinc-400"}`}>
          ⌨️
        </span>

        {/* Book icon */}
        <span className={`text-[11px] leading-none transition-opacity ${!isTyping ? "opacity-100 text-cyan-300" : "opacity-40 text-zinc-400"}`}>
          📖
        </span>

        {/* Sliding dot */}
        <span
          className={`absolute top-0.5 bottom-0.5 w-6 rounded-full transition-transform duration-200 flex items-center justify-center shadow-md ${
            isTyping
              ? "left-0.5 translate-x-0 bg-emerald-400"
              : "left-0.5 translate-x-7 bg-cyan-400"
          }`}
        />
      </button>

      {/* Tooltip matching screenshot */}
      <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1 text-[11px] font-mono rounded bg-[#161a25] text-zinc-200 border border-[#2b3347] shadow-xl pointer-events-none">
        {isTyping ? "Click to switch to reading mode" : "Click to switch to typing mode"}
      </div>
    </div>
  );
}
