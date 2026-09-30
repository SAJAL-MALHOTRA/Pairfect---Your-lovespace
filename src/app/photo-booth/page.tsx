"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LensBoothView from "@/components/booth/lens-booth-view";
import { Loader2 } from "lucide-react";

function PhotoBoothContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || searchParams.get("code");

  return <LensBoothView initialSessionId={sessionId} />;
}

export default function PhotoBoothPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F8FA] booth-grid-canvas">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <PhotoBoothContent />
    </Suspense>
  );
}
