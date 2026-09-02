import type { Book } from "./types";

export const demoBook: Book = {
  id: "demo",
  title: "Welcome to TypeRead",
  author: "TypeRead Tutorial",
  sourceType: "demo",
  importedAt: Date.now(),
  chapters: [
    {
      id: "ch1",
      title: "Chapter 1: The Art of Typing",
      paragraphs: [
        "Hi! Start typing this chapter. Press Enter to finish the paragraph.",
        "Typing Mode, which you are currently in, allows you to enjoy books while practicing touch typing.",
        "After each completed paragraph, your progress is saved, and the timer is paused allowing you to rest.",
        "If too many mistakes interrupt your flow, you can restart the current paragraph by pressing Tab. Try it in the next section.",
        "Make some mistakes and reset this paragraph.",
        "If you encounter foreign characters that are not easily typed on your keyboard, you can press any character (including Space bar) to mark them as typed. Try it now with the Japanese hello: こんにちは",
        "Remember to always fix your mistakes, as they have a big impact on your final score and overall progress as a typist.",
      ],
    },
    {
      id: "ch2",
      title: "Chapter 2: The Joy of Reading",
      paragraphs: [
        "Stop typing and read the following paragraphs.",
        "While you are still in Typing Mode, you can mark a paragraph as read, by pressing Shift + Enter. Try it now two times.",
        "Yay! If you did this correctly, the previous paragraphs are now completed, without the need to type them out! It's great for when your fingers are tired, but you want to continue reading a fascinating story.",
        "If there are more than a couple paragraphs that you want to read instead of type, the more convenient way is to switch to Reading Mode. You can do that by toggling the switch next to your stats in the top right corner. Try it now.",
        "While you are in Reading Mode, you can mark the current paragraph as read by pressing Enter, or mark your reading progress to any paragraph by clicking it. These paragraphs count toward the overall progress of the chapter, but won't be included in the typing statistics.",
        "You can switch between modes at any moment. You can choose to either read or type out the following (last) chapter.",
      ],
    },
    {
      id: "ch3",
      title: "Chapter 3: Make It Your Own",
      paragraphs: [
        "Now that you are familiar with the core functionality of the app, we encourage you to customize your experience! You can tweak the look of each mode separately. Choose your favorite fonts, adjust sizes and spacing, set up your screen keyboard, mark your favorite genres, and many more.",
        "All is conveniently arranged in separate sections on the Settings page. You can enter the settings by clicking the gear icon in the menu after finishing this chapter.",
        "After going through the available options, go into the Books section, choose your first novel, and start your adventure. Good luck!",
      ],
    },
  ],
};

export function getTotalParagraphs(book: Book): number {
  return book.chapters.reduce((acc, c) => acc + c.paragraphs.length, 0);
}

export function getParagraph(book: Book, chapterIndex: number, paragraphIndex: number): string | null {
  const ch = book.chapters[chapterIndex];
  if (!ch) return null;
  return ch.paragraphs[paragraphIndex] ?? null;
}

export function flattenParagraphs(book: Book): { chapterIndex: number; paragraphIndex: number; text: string; chapterTitle: string }[] {
  const out: { chapterIndex: number; paragraphIndex: number; text: string; chapterTitle: string }[] = [];
  book.chapters.forEach((ch, ci) => {
    ch.paragraphs.forEach((p, pi) => {
      out.push({ chapterIndex: ci, paragraphIndex: pi, text: p, chapterTitle: ch.title });
    });
  });
  return out;
}
