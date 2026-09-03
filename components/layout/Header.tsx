"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Book } from "@/lib/types";
import { saveBooks } from "@/lib/storage";
import { UploadDropzone } from "@/components/reader/UploadDropzone";

const navItems = [
  { href: "/", label: "Catalog", exact: true },
  { href: "/books", label: "My Books" },
  { href: "/settings", label: "Settings" },
];

export function Header() {
  const pathname = usePathname();
  const [showUpload, setShowUpload] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleImported = (book: Book) => {
    // Save to storage; catalog and books pages read from storage
    try {
      const raw = localStorage.getItem("typeread:books");
      const existing: Book[] = raw ? JSON.parse(raw) : [];
      const next = [book, ...existing.filter((b) => b.id !== book.id)];
      saveBooks(next);
    } catch {
      saveBooks([book]);
    }
    setShowUpload(false);
    // Notify other components and navigate to catalog if not already there
    window.dispatchEvent(new Event("typeread:books-updated"));
    if (pathname !== "/") {
      window.location.href = "/";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          {/* Left: Brand + Primary Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center shrink-0 group">
              <img src="/typeread-logo.png" alt="TypeRead" className="h-11 sm:h-12 w-auto object-contain" />
            </Link>
            <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "px-4 py-2 rounded-full text-sm font-semibold bg-slate-900 text-white shadow-sm"
                        : "px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-900 hover:bg-black text-white shadow-sm hover:shadow transition-all"
            >
              <span className="text-base leading-none">+</span> Upload Book
            </button>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a1.65 1.65 0 0 0 1-1.51A1.65 1.65 0 0 0 9 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 13.5 4a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 4 0v.49a1.65 1.65 0 0 0 1 1.51c.6.26 1.3.1 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1 1.51V13a1.65 1.65 0 0 0-1 1.51Z" />
              </svg>
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white shadow-sm"
              aria-label="Upload Book"
            >
              <span className="text-lg leading-none">+</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-700"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      active
                        ? "px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white"
                        : "px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Upload Modal - Global */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span>📚</span> Import Book
              </h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-700 text-sm">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">Upload EPUB, PDF, TXT, or Markdown files. Your books stay 100% local on your device.</p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between gap-2">
              <span className="text-slate-500">Need free EPUB books?</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <a href="https://z-library.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Z-Library ↗
                </a>
                <span className="text-slate-300">·</span>
                <a href="https://digilibraries.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  DigiLibraries ↗
                </a>
              </div>
            </div>
            <UploadDropzone onBookImported={handleImported} />
          </div>
        </div>
      )}
    </>
  );
}
