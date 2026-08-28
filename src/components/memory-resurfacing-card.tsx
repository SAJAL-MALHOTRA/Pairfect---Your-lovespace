"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Mail, Image as ImageIcon, Gift, Music, Smile, Camera, Flower2 } from "lucide-react";
import Link from "next/link";

interface OnThisDayMemory {
  memory_type: string;
  memory_id: string;
  preview_text: string;
  image_url: string | null;
  years_ago: number;
  memory_date: string;
}

const MEMORY_CONFIG: Record<string, { icon: typeof Heart; label: string; href: string; color: string }> = {
  moment:      { icon: ImageIcon, label: "Memory",       href: "/moments",       color: "text-sky-600" },
  letter:      { icon: Mail,      label: "Love Letter",  href: "/love-letter",   color: "text-rose-600" },
  gratitude:   { icon: Heart,     label: "Gratitude",    href: "/gratitude-jar", color: "text-emerald-600" },
  polaroid:    { icon: Camera,    label: "Polaroid",     href: "/photo-booth",   color: "text-violet-600" },
  photo_strip: { icon: Camera,    label: "Photo Strip",  href: "/photo-booth",   color: "text-indigo-600" },
  bouquet:     { icon: Flower2,   label: "Bouquet",      href: "/bouquet",       color: "text-pink-600" },
  mixtape:     { icon: Music,     label: "Mixtape",      href: "/mixtape",       color: "text-amber-600" },
  mood:        { icon: Smile,     label: "Mood Note",    href: "/checkin",       color: "text-blue-600" },
};

function getCacheKey(): string {
  const d = new Date();
  return `pairfect_otd_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

export default function MemoryResurfacingCard({ pairId }: { pairId?: string }) {
  const [memories, setMemories] = useState<OnThisDayMemory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!pairId) return;

    const cacheKey = getCacheKey();

    // Check localStorage date-key cache first
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setMemories(parsed);
          setLoaded(true);
          return;
        }
      }
    } catch {
      // Ignore cache read errors
    }

    // Fetch from API
    (async () => {
      try {
        const res = await fetch("/api/on-this-day");
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const data = await res.json();
        const mems = data.memories || [];
        setMemories(mems);

        // Cache for this day
        try {
          // Clean old cache keys
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("pairfect_otd_") && key !== cacheKey) {
              localStorage.removeItem(key);
            }
          }
          localStorage.setItem(cacheKey, JSON.stringify(mems));
        } catch {
          // Ignore cache write errors
        }
      } catch {
        // Silently fail — this is a bonus feature
      } finally {
        setLoaded(true);
      }
    })();
  }, [pairId]);

  // Don't render anything until loaded, and render nothing if no memories
  if (!loaded || memories.length === 0) return null;

  const topMemory = memories[0];
  const config = MEMORY_CONFIG[topMemory.memory_type] || MEMORY_CONFIG.moment;
  const Icon = config.icon;
  const hasMore = memories.length > 1;

  const yearsLabel = topMemory.years_ago === 1 ? "1 year ago today" : `${topMemory.years_ago} years ago today`;

  const memoryDate = new Date(topMemory.memory_date);
  const dateStr = memoryDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-gradient-to-br from-[var(--paper-warm)] via-[var(--card)] to-[var(--bg-secondary)] shadow-sm"
      >
        {/* Subtle sparkle grain overlay */}
        <div className="absolute inset-0 paper-grain opacity-40 pointer-events-none" />

        <div className="relative p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--rose)]/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--burgundy)]" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                  On This Day
                </p>
                <p className="font-heading font-bold text-sm text-[var(--burgundy)] leading-tight">
                  {yearsLabel} ♥
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-[var(--text-soft)]">
              {dateStr}
            </span>
          </div>

          {/* Primary Memory Card */}
          <Link
            href={config.href}
            className="block p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xs transition-all hover:shadow-md hover:translate-y-[-1px] cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--rose)]/10 text-[var(--burgundy)]">
                    {config.label}
                  </span>
                </div>
                <p className="font-quote italic text-xs text-[var(--text)] line-clamp-2 leading-relaxed">
                  &ldquo;{topMemory.preview_text || "A special moment between you two"}&rdquo;
                </p>
              </div>
            </div>
          </Link>

          {/* "View more" — only if multiple matches */}
          {hasMore && (
            <div className="space-y-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--burgundy)] hover:text-[var(--rose)] transition-colors cursor-pointer py-1"
              >
                {expanded ? "Show less" : `+ ${memories.length - 1} more from this day`}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {memories.slice(1).map((mem) => {
                      const mc = MEMORY_CONFIG[mem.memory_type] || MEMORY_CONFIG.moment;
                      const MIcon = mc.icon;
                      const yLabel = mem.years_ago === 1 ? "1 yr ago" : `${mem.years_ago} yrs ago`;
                      return (
                        <Link
                          key={mem.memory_id}
                          href={mc.href}
                          className="block p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-3 transition-all hover:shadow-xs cursor-pointer"
                        >
                          <div className={`w-7 h-7 rounded-full bg-[var(--card)] flex items-center justify-center flex-shrink-0 ${mc.color}`}>
                            <MIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-quote italic text-[11px] text-[var(--text)] truncate">
                              &ldquo;{mem.preview_text || "A special moment"}&rdquo;
                            </p>
                          </div>
                          <span className="text-[8px] font-mono text-[var(--text-soft)] flex-shrink-0">
                            {yLabel}
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
