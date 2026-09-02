import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TypeRead — Read by Typing",
  description: "Improve touch typing while reading your favorite books. Upload EPUB, PDF, TXT or MD and type paragraph by paragraph.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-black/80 border-b border-black/5 dark:border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono text-sm font-bold">TR</span>
              <span className="font-semibold tracking-tight">TypeRead</span>
              <span className="hidden sm:inline text-xs text-zinc-500 ml-1">Read by Typing</span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                Reader
              </Link>
              <Link href="/books" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                Books
              </Link>
              <Link href="/settings" className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/15 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-black/5 dark:border-white/10 py-6 text-center text-xs text-zinc-500">
          TypeRead — local only · your books never leave your device
        </footer>
      </body>
    </html>
  );
}
