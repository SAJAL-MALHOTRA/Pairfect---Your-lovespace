"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LensBoothView from "@/components/booth/lens-booth-view";
import { Loader2 } from "lucide-react";

function PhotoBoothContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || searchParams.get("code");
  const mode = searchParams.get("mode") as "solo" | "duo" | "lobby" | null;

  return <LensBoothView initialSessionId={sessionId} initialMode={mode} />;
}

export default function PhotoBoothPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] booth-grid-canvas paper-grain">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <PhotoBoothContent />
    </Suspense>
  );
}
