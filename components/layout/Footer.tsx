import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src="/typeread-logo.png" alt="TypeRead" className="h-8 w-auto object-contain" />
            </Link>
            <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
              Read by typing. Improve your touch typing while enjoying great books. Upload EPUB, PDF or TXT and type paragraph by paragraph with live WPM and accuracy.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Local only — your books never leave your device
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Product</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">
                  Book Catalog
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-slate-600 hover:text-slate-900 transition-colors">
                  My Library
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-slate-600 hover:text-slate-900 transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="https://z-library.sk/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-cyan-700 transition-colors">
                  Z-Library ↗
                </a>
              </li>
              <li>
                <a href="https://digilibraries.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-emerald-700 transition-colors">
                  DigiLibraries ↗
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-500">EPUB, PDF, TXT, MD — max 50 MB</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TypeRead. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built for learners <span aria-hidden="true">·</span> v1.34.0
          </p>
        </div>
      </div>
    </footer>
  );
}
