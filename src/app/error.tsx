"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Pairfect Error Boundary Catch]:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="max-w-md w-full p-8 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-[var(--burgundy)] mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="font-heading font-bold text-xl text-[var(--burgundy)]">
            Something went sideways ♡
          </h2>
          <p className="font-sans text-xs text-[var(--text-soft)] leading-relaxed">
            We ran into an unexpected hiccup loading this memory or screen.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
