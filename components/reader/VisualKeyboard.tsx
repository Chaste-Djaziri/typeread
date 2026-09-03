"use client";

import { useMemo } from "react";

type KeyDef = {
  id: string;
  label: string;
  shiftLabel?: string;
  char?: string;
  shiftChar?: string;
  width?: string; // flex grow or fixed width class
  isModifier?: boolean;
  hasBump?: boolean; // f and j tactile bump
  align?: "center" | "left" | "right";
};

type Props = {
  activeKey?: string | null; // currently pressed physical key or clicked key
  nextChar?: string | null; // character next to type in current paragraph
  onKeyPress?: (key: string) => void;
  className?: string;
};

export function VisualKeyboard({ activeKey, nextChar, onKeyPress, className = "" }: Props) {
  // Determine which key ID corresponds to nextChar
  const targetKeyId = useMemo(() => {
    if (!nextChar) return null;
    if (nextChar === " ") return "Space";
    if (nextChar === "\n") return "Enter";

    const lower = nextChar.toLowerCase();
    // Letters
    if (lower >= "a" && lower <= "z") return `Key${lower.toUpperCase()}`;
    // Numbers
    if (nextChar >= "0" && nextChar <= "9") return `Digit${nextChar}`;

    // Common symbols
    const symbolMap: Record<string, string> = {
      "!": "Digit1",
      "@": "Digit2",
      "#": "Digit3",
      $: "Digit4",
      "%": "Digit5",
      "^": "Digit6",
      "&": "Digit7",
      "*": "Digit8",
      "(": "Digit9",
      ")": "Digit0",
      "-": "Minus",
      _: "Minus",
      "=": "Equal",
      "+": "Equal",
      "[": "BracketLeft",
      "{": "BracketLeft",
      "]": "BracketRight",
      "}": "BracketRight",
      "\\": "Backslash",
      "|": "Backslash",
      ";": "Semicolon",
      ":": "Semicolon",
      "'": "Quote",
      '"': "Quote",
      ",": "Comma",
      "<": "Comma",
      ".": "Period",
      ">": "Period",
      "/": "Slash",
      "?": "Slash",
      "`": "Backquote",
      "~": "Backquote",
    };
    return symbolMap[nextChar] ?? null;
  }, [nextChar]);

  const rows: KeyDef[][] = useMemo(
    () => [
      // Row 1
      [
        { id: "Backquote", label: "`", shiftLabel: "~", char: "`", shiftChar: "~" },
        { id: "Digit1", label: "1", shiftLabel: "!", char: "1", shiftChar: "!" },
        { id: "Digit2", label: "2", shiftLabel: "@", char: "2", shiftChar: "@" },
        { id: "Digit3", label: "3", shiftLabel: "#", char: "3", shiftChar: "#" },
        { id: "Digit4", label: "4", shiftLabel: "$", char: "4", shiftChar: "$" },
        { id: "Digit5", label: "5", shiftLabel: "%", char: "5", shiftChar: "%" },
        { id: "Digit6", label: "6", shiftLabel: "^", char: "6", shiftChar: "^" },
        { id: "Digit7", label: "7", shiftLabel: "&", char: "7", shiftChar: "&" },
        { id: "Digit8", label: "8", shiftLabel: "*", char: "8", shiftChar: "*" },
        { id: "Digit9", label: "9", shiftLabel: "(", char: "9", shiftChar: "(" },
        { id: "Digit0", label: "0", shiftLabel: ")", char: "0", shiftChar: ")" },
        { id: "Minus", label: "-", shiftLabel: "_", char: "-", shiftChar: "_" },
        { id: "Equal", label: "=", shiftLabel: "+", char: "=", shiftChar: "+" },
        { id: "Backspace", label: "delete", width: "w-[56px] sm:w-[68px]", align: "right" },
      ],
      // Row 2
      [
        { id: "Tab", label: "tab", width: "w-[48px] sm:w-[58px]", align: "left" },
        { id: "KeyQ", label: "q", char: "q", shiftChar: "Q" },
        { id: "KeyW", label: "w", char: "w", shiftChar: "W" },
        { id: "KeyE", label: "e", char: "e", shiftChar: "E" },
        { id: "KeyR", label: "r", char: "r", shiftChar: "R" },
        { id: "KeyT", label: "t", char: "t", shiftChar: "T" },
        { id: "KeyY", label: "y", char: "y", shiftChar: "Y" },
        { id: "KeyU", label: "u", char: "u", shiftChar: "U" },
        { id: "KeyI", label: "i", char: "i", shiftChar: "I" },
        { id: "KeyO", label: "o", char: "o", shiftChar: "O" },
        { id: "KeyP", label: "p", char: "p", shiftChar: "P" },
        { id: "BracketLeft", label: "[", shiftLabel: "{", char: "[", shiftChar: "{" },
        { id: "BracketRight", label: "]", shiftLabel: "}", char: "]", shiftChar: "}" },
        { id: "Backslash", label: "\\", shiftLabel: "|", char: "\\", shiftChar: "|" },
      ],
      // Row 3
      [
        { id: "CapsLock", label: "caps lock", width: "w-[58px] sm:w-[72px]", align: "left" },
        { id: "KeyA", label: "a", char: "a", shiftChar: "A" },
        { id: "KeyS", label: "s", char: "s", shiftChar: "S" },
        { id: "KeyD", label: "d", char: "d", shiftChar: "D" },
        { id: "KeyF", label: "f", char: "f", shiftChar: "F", hasBump: true },
        { id: "KeyG", label: "g", char: "g", shiftChar: "G" },
        { id: "KeyH", label: "h", char: "h", shiftChar: "H" },
        { id: "KeyJ", label: "j", char: "j", shiftChar: "J", hasBump: true },
        { id: "KeyK", label: "k", char: "k", shiftChar: "K" },
        { id: "KeyL", label: "l", char: "l", shiftChar: "L" },
        { id: "Semicolon", label: ";", shiftLabel: ":", char: ";", shiftChar: ":" },
        { id: "Quote", label: "'", shiftLabel: '"', char: "'", shiftChar: '"' },
        { id: "Enter", label: "return", width: "w-[62px] sm:w-[76px]", align: "right" },
      ],
      // Row 4
      [
        { id: "ShiftLeft", label: "shift", width: "w-[72px] sm:w-[88px]", align: "left" },
        { id: "KeyZ", label: "z", char: "z", shiftChar: "Z" },
        { id: "KeyX", label: "x", char: "x", shiftChar: "X" },
        { id: "KeyC", label: "c", char: "c", shiftChar: "C" },
        { id: "KeyV", label: "v", char: "v", shiftChar: "V" },
        { id: "KeyB", label: "b", char: "b", shiftChar: "B" },
        { id: "KeyN", label: "n", char: "n", shiftChar: "N" },
        { id: "KeyM", label: "m", char: "m", shiftChar: "M" },
        { id: "Comma", label: ",", shiftLabel: "<", char: ",", shiftChar: "<" },
        { id: "Period", label: ".", shiftLabel: ">", char: ".", shiftChar: ">" },
        { id: "Slash", label: "/", shiftLabel: "?", char: "/", shiftChar: "?" },
        { id: "ShiftRight", label: "shift", width: "w-[72px] sm:w-[88px]", align: "right" },
      ],
      // Row 5
      [
        { id: "fn", label: "fn", isModifier: true, width: "w-[34px] sm:w-[40px]" },
        { id: "ControlLeft", label: "Ctrl", isModifier: true, width: "w-[38px] sm:w-[46px]" },
        { id: "AltLeft", label: "⌥", isModifier: true, width: "w-[38px] sm:w-[46px]" },
        { id: "MetaLeft", label: "⌘", isModifier: true, width: "w-[44px] sm:w-[52px]" },
        { id: "Space", label: "", width: "flex-1 min-w-[140px] sm:min-w-[200px]" },
        { id: "MetaRight", label: "⌘", isModifier: true, width: "w-[44px] sm:w-[52px]" },
        { id: "AltRight", label: "⌥", isModifier: true, width: "w-[38px] sm:w-[46px]" },
        { id: "ArrowLeft", label: "◀", width: "w-[30px] sm:w-[36px]" },
        { id: "ArrowUpDown", label: "▲▼", width: "w-[30px] sm:w-[36px]" },
        { id: "ArrowRight", label: "▶", width: "w-[30px] sm:w-[36px]" },
      ],
    ],
    []
  );

  const normalizeActive = (activeKey ?? "").toLowerCase();

  return (
    <div
      className={`select-none mx-auto p-2 sm:p-3 rounded-2xl bg-white border border-slate-200 shadow-xl backdrop-blur-md max-w-[680px] w-full ${className}`}
      aria-label="On-screen visual keyboard"
    >
      <div className="flex flex-col gap-1 sm:gap-1.5 w-full">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 sm:gap-1.5 w-full justify-between items-center">
            {row.map((key) => {
              const isTarget = targetKeyId === key.id;
              const isPressed =
                normalizeActive === key.id.toLowerCase() ||
                (key.char && normalizeActive === key.char.toLowerCase()) ||
                (key.label && normalizeActive === key.label.toLowerCase()) ||
                (key.id === "Space" && normalizeActive === " ");

              // Key alignment & sizing
              const widthClass = key.width || "flex-1 min-w-[24px] sm:min-w-[32px] max-w-[42px]";
              const alignClass =
                key.align === "left"
                  ? "justify-between text-left pl-1.5"
                  : key.align === "right"
                  ? "justify-between text-right pr-1.5"
                  : "justify-center text-center";

              return (
                <button
                  key={key.id}
                  type="button"
                  onClick={() => onKeyPress?.(key.char || key.label || (key.id === "Space" ? " " : ""))}
                  tabIndex={-1}
                  className={`
                    relative h-8 sm:h-10 ${widthClass} rounded-[5px] sm:rounded-[6px] 
                    flex flex-col ${alignClass} items-center
                    text-[10px] sm:text-[11px] font-mono transition-all duration-75 cursor-default
                    border 
                    ${
                      isPressed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-400 shadow-sm scale-[0.96] translate-y-0.5"
                        : isTarget
                        ? "bg-cyan-50 text-cyan-700 border-cyan-400 shadow-sm ring-1 ring-cyan-300"
                        : "bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-white shadow-sm"
                    }
                  `}
                >
                  {/* Shift label / secondary symbol */}
                  {key.shiftLabel && (
                    <span className="text-[8px] sm:text-[9px] opacity-60 leading-none mt-0.5">
                      {key.shiftLabel}
                    </span>
                  )}
                  {/* Main label */}
                  <span className={`leading-none ${key.shiftLabel ? "mb-0.5" : "my-auto"} ${isTarget ? "font-bold text-cyan-700" : ""}`}>
                    {key.label}
                  </span>

                  {/* Tactile bump on F and J keys */}
                  {key.hasBump && (
                    <span className="absolute bottom-1 w-2.5 h-[1.5px] bg-slate-400 rounded-full" />
                  )}

                  {/* Caps Lock indicator line */}
                  {key.id === "CapsLock" && (
                    <span className="absolute bottom-1 left-2 w-3 h-[2px] bg-slate-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
