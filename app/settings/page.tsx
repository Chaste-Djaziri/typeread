"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import { defaultSettings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/storage";
import { soundEngine } from "@/lib/engine/audio";
import Link from "next/link";

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    return loadSettings();
  });

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
    if (patch.soundFeedback !== undefined) {
      soundEngine.setEnabled(patch.soundFeedback);
    }
    if (patch.soundVolume !== undefined) {
      soundEngine.setVolume(patch.soundVolume);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">Configure your typing sounds, visual keyboard, and typography.</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors shadow-2xs"
        >
          Back to Reader →
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        {/* Sound Feedback */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <span>Audio & Sound Feedback</span>
          </h2>
          <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={s.soundFeedback}
              onChange={(e) => {
                update({ soundFeedback: e.target.checked });
                if (e.target.checked) soundEngine.playKey(" ");
              }}
              className="w-4 h-4 rounded text-blue-600 accent-blue-600"
            />
            <span>Enable mechanical keyboard click sound feedback on keystrokes</span>
          </label>
          <div className="max-w-xs space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Volume</span>
              <span>{Math.round(s.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={s.soundVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                update({ soundVolume: vol });
                soundEngine.playKey(" ");
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </section>

        {/* Keyboard Settings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">On-Screen Visual Keyboard</h2>
          <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={s.showKeyboard}
              onChange={(e) => update({ showKeyboard: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 accent-blue-600"
            />
            <span>Show on-screen visual keyboard in Typing Mode</span>
          </label>
          <label className="space-y-1 block max-w-xs">
            <span className="text-xs font-medium text-slate-600">Keyboard Layout</span>
            <select
              value={s.keyboardLayout}
              onChange={(e) => update({ keyboardLayout: e.target.value as Settings["keyboardLayout"] })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="qwerty">QWERTY</option>
              <option value="qwertz">QWERTZ</option>
              <option value="azerty">AZERTY</option>
            </select>
          </label>
        </section>

        {/* Typing mode typography */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Typing Mode Typography</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Font</span>
              <select
                value={s.typingFont}
                onChange={(e) => update({ typingFont: e.target.value as Settings["typingFont"] })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="mono">Mono (Geist Mono)</option>
                <option value="sans">Sans (Geist)</option>
                <option value="serif">Serif (Georgia)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Font size ({s.typingFontSize}px)</span>
              <input
                type="range"
                min="14"
                max="32"
                value={s.typingFontSize}
                onChange={(e) => update({ typingFontSize: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Line height ({s.typingLineHeight})</span>
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={s.typingLineHeight}
                onChange={(e) => update({ typingLineHeight: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Letter spacing ({s.typingLetterSpacing}em)</span>
              <input
                type="range"
                min="-0.02"
                max="0.1"
                step="0.01"
                value={s.typingLetterSpacing}
                onChange={(e) => update({ typingLetterSpacing: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </label>
          </div>
        </section>

        {/* Reading mode typography */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Reading Mode Typography</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Font</span>
              <select
                value={s.readingFont}
                onChange={(e) => update({ readingFont: e.target.value as Settings["readingFont"] })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="serif">Serif (Georgia)</option>
                <option value="sans">Sans (Geist)</option>
                <option value="mono">Mono (Geist Mono)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Font size ({s.readingFontSize}px)</span>
              <input
                type="range"
                min="14"
                max="32"
                value={s.readingFontSize}
                onChange={(e) => update({ readingFontSize: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Line height ({s.readingLineHeight})</span>
              <input
                type="range"
                min="1.2"
                max="2.5"
                step="0.1"
                value={s.readingLineHeight}
                onChange={(e) => update({ readingLineHeight: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Letter spacing ({s.readingLetterSpacing}em)</span>
              <input
                type="range"
                min="-0.02"
                max="0.1"
                step="0.01"
                value={s.readingLetterSpacing}
                onChange={(e) => update({ readingLetterSpacing: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
