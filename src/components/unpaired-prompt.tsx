"use client";

import React from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Heart, UserPlus, ArrowRight, Sparkles } from "lucide-react";

interface UnpairedPromptProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionText?: string;
  actionHref?: string;
}

export function UnpairedPrompt({
  title,
  description,
  icon: Icon = Heart,
  actionText = "Connect Your Partner ▷",
  actionHref = "/onboarding",
}: UnpairedPromptProps) {
  const { user, pair } = useAuth();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center p-8 sm:p-10 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl relative overflow-hidden paper-grain">
          {/* Top washi tape accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-2.5 bg-[var(--rose)]/30 rounded-b-md" />

          {/* Feature Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--rose)]/15 text-[var(--burgundy)] border border-[var(--rose)]/30 flex items-center justify-center mb-5 shadow-xs">
            <Icon className="w-8 h-8" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose)]/15 text-[var(--burgundy)] text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3" />
            <span>Built For Two</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display italic font-bold text-[var(--text)] mb-3">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed mb-6 font-sans">
            {description ||
              `${title} is designed exclusively for two people. Connect with your partner or share your room invite code to unlock this ritual together.`}
          </p>

          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  href={actionHref}
                  className="btn-journal py-3 px-6 text-xs font-mono font-bold justify-center w-full shadow-md"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {actionText}
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-journal-ghost py-2.5 px-6 text-xs font-mono font-bold justify-center w-full"
                >
                  Back to Sanctuary
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-journal py-3 px-6 text-xs font-mono font-bold justify-center w-full shadow-md"
                >
                  Sign In to Your Room ▷
                </Link>
                <Link
                  href="/signup"
                  className="btn-journal-ghost py-2.5 px-6 text-xs font-mono font-bold justify-center w-full"
                >
                  Create a New Sanctuary Room
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
