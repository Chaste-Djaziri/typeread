"use client";

import { useState, useEffect } from "react";

export function MobileOverlay() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("typeread:mobile-overlay-dismissed");
    if (stored === "1") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("typeread:mobile-overlay-dismissed", "1");
    setDismissed(true);
  };

  if (!mounted || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Desktop only notice"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white shadow-xl p-8 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-sm">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M3 7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            <path d="M8 11h8M8 15h5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Desktop Only</h2>
          <p className="text-sm font-medium text-slate-900">Please use a PC</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            TypeRead is designed for a physical keyboard. Open this site on a desktop or laptop for the best typing experience — paragraphs, live WPM and the visual keyboard are optimized for larger screens.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Tip</p>
          <p className="mt-1">For mobile, we recommend using a Bluetooth keyboard on a tablet, or switch to a PC.</p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-semibold transition-colors"
          >
            Continue anyway
          </button>
          <p className="text-[11px] text-slate-500">You can still try on phone, but typing will be limited.</p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500">TypeRead — Read by Typing · v1.34.0</p>
    </div>
  );
}
