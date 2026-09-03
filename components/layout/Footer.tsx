import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src="/typeread-logo.png" alt="TypeRead" className="h-8 w-auto object-contain" />
            </Link>
            <p className="mt-2.5 text-xs text-slate-500 max-w-sm leading-relaxed">
              Read books sentence by sentence through tactile keystrokes. 100% private in your browser.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" aria-hidden="true" />
              Local-first storage
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">App</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/" className="text-slate-500 hover:text-blue-600 transition-colors">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-slate-500 hover:text-blue-600 transition-colors">
                  Library
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-slate-500 hover:text-blue-600 transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Resources</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="https://z-library.sk/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">
                  Z-Library ↗
                </a>
              </li>
              <li>
                <a href="https://digilibraries.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">
                  DigiLibraries ↗
                </a>
              </li>
              <li>
                <span className="text-slate-400">EPUB, PDF, TXT, MD</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} TypeRead. All rights reserved.</p>
          <p>Read by typing</p>
        </div>
      </div>
    </footer>
  );
}
