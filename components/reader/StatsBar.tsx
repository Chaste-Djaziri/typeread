"use client";

type Props = {
  wpm: number;
  accuracy: number;
  progress: string; // e.g. "3 / 16"
  progressPercent: number;
  elapsedLabel: string;
};

export function StatsBar({ wpm, accuracy, progress, progressPercent, elapsedLabel }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="hidden sm:flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-slate-500">WPM</span>
          <span className="font-mono font-semibold min-w-[2ch]">{wpm}</span>
        </span>
        <span className="w-px h-4 bg-slate-200" />
        <span className="inline-flex items-center gap-1.5">
          <span className="text-slate-500">Acc</span>
          <span className="font-mono font-semibold">{accuracy}%</span>
        </span>
        <span className="w-px h-4 bg-slate-200" />
        <span className="inline-flex items-center gap-1.5">
          <span className="text-slate-500">Time</span>
          <span className="font-mono">{elapsedLabel}</span>
        </span>
      </div>
      <div className="sm:hidden flex items-center gap-2 font-mono text-xs">
        <span>{wpm} WPM</span>
        <span>·</span>
        <span>{accuracy}%</span>
      </div>
      <div className="hidden md:flex items-center gap-2 ml-1">
        <span className="text-slate-500">{progress}</span>
        <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-cyan-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
