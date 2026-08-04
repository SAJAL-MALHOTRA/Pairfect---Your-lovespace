export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--burgundy)]/25 border-t-[var(--burgundy)] animate-spin" />
        <span className="font-mono text-xs text-[var(--text-soft)] uppercase tracking-wider">
          Loading Pairfect...
        </span>
      </div>
    </div>
  );
}
