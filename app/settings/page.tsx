"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/types";
import { defaultSettings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/storage";

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(defaultSettings);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-zinc-500 mt-1">Tweak the look of each mode separately. Changes save automatically (local only).</p>

      <div className="mt-8 space-y-6">
        {/* Typing mode */}
        <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Typing Mode</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Font</span>
              <select
                value={s.typingFont}
                onChange={(e) => update({ typingFont: e.target.value as Settings["typingFont"] })}
                className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="mono">Mono (Geist Mono)</option>
                <option value="sans">Sans (Geist)</option>
                <option value="serif">Serif (Georgia)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Size {s.typingFontSize}px</span>
              <input type="range" min={14} max={28} value={s.typingFontSize} onChange={(e) => update({ typingFontSize: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Line height {s.typingLineHeight}</span>
              <input type="range" min={1.2} max={2.4} step={0.1} value={s.typingLineHeight} onChange={(e) => update({ typingLineHeight: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Letter spacing {s.typingLetterSpacing}em</span>
              <input type="range" min={0} max={0.08} step={0.01} value={s.typingLetterSpacing} onChange={(e) => update({ typingLetterSpacing: Number(e.target.value) })} className="w-full" />
            </label>
          </div>
          <div
            className="rounded-xl border border-black/5 dark:border-white/10 p-4 bg-zinc-50 dark:bg-zinc-800/50"
            style={{
              fontFamily: s.typingFont === "mono" ? "var(--font-geist-mono)" : s.typingFont === "serif" ? "Georgia, serif" : "var(--font-geist-sans)",
              fontSize: s.typingFontSize,
              lineHeight: s.typingLineHeight,
              letterSpacing: `${s.typingLetterSpacing}em`,
            }}
          >
            Preview — The quick brown fox jumps over the lazy dog. こんにちは
          </div>
        </section>

        {/* Reading mode */}
        <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Reading Mode</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Font</span>
              <select
                value={s.readingFont}
                onChange={(e) => update({ readingFont: e.target.value as Settings["readingFont"] })}
                className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="serif">Serif (Georgia)</option>
                <option value="sans">Sans (Geist)</option>
                <option value="mono">Mono (Geist Mono)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Size {s.readingFontSize}px</span>
              <input type="range" min={14} max={28} value={s.readingFontSize} onChange={(e) => update({ readingFontSize: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Line height {s.readingLineHeight}</span>
              <input type="range" min={1.2} max={2.4} step={0.1} value={s.readingLineHeight} onChange={(e) => update({ readingLineHeight: Number(e.target.value) })} className="w-full" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Letter spacing {s.readingLetterSpacing}em</span>
              <input type="range" min={0} max={0.08} step={0.01} value={s.readingLetterSpacing} onChange={(e) => update({ readingLetterSpacing: Number(e.target.value) })} className="w-full" />
            </label>
          </div>
          <div
            className="rounded-xl border border-black/5 dark:border-white/10 p-4 bg-zinc-50 dark:bg-zinc-800/50"
            style={{
              fontFamily: s.readingFont === "serif" ? "Georgia, serif" : s.readingFont === "mono" ? "var(--font-geist-mono)" : "var(--font-geist-sans)",
              fontSize: s.readingFontSize,
              lineHeight: s.readingLineHeight,
              letterSpacing: `${s.readingLetterSpacing}em`,
            }}
          >
            Preview — While you are in Reading Mode, you can mark the current paragraph as read by pressing Enter, or click any paragraph.
          </div>
        </section>

        {/* Keyboard */}
        <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Screen Keyboard (coming soon)</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.showKeyboard} onChange={(e) => update({ showKeyboard: e.target.checked })} />
            Show on-screen keyboard in Typing Mode
          </label>
          <label className="space-y-1 block max-w-xs">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Layout</span>
            <select
              value={s.keyboardLayout}
              onChange={(e) => update({ keyboardLayout: e.target.value as Settings["keyboardLayout"] })}
              className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="qwerty">QWERTY</option>
              <option value="qwertz">QWERTZ</option>
              <option value="azerty">AZERTY</option>
            </select>
          </label>
          <p className="text-xs text-zinc-500">Visual keyboard highlight will appear under the typing area when enabled.</p>
        </section>

        <section className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-5 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            All settings are stored locally in your browser. Switch between Typing and Reading modes in the Reader — each uses its own typography.
          </p>
        </section>
      </div>
    </div>
  );
}
