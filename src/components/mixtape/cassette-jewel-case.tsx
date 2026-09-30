"use client";

import React from "react";
import { CASSETTE_PATTERNS } from "./cassette-patterns";

export interface CassetteSongItem {
  id?: string;
  title: string;
  artist?: string;
  duration?: string;
  youtube_url?: string;
}

interface CassetteJewelCaseProps {
  patternId?: string;
  title?: string;
  recipientName?: string;
  songs: CassetteSongItem[];
  activeSongIndex?: number;
  onSelectSong?: (index: number) => void;
  peekingNote?: string;
  onPeekingNoteClick?: () => void;
  className?: string;
}

export function CassetteJewelCase({
  patternId = "clover",
  title = "Our Mixtape",
  recipientName,
  songs = [],
  activeSongIndex,
  onSelectSong,
  peekingNote,
  onPeekingNoteClick,
  className = "",
}: CassetteJewelCaseProps) {
  const pattern = CASSETTE_PATTERNS.find((p) => p.id === patternId) || CASSETTE_PATTERNS[0];

  // Up to 4 lines for Side A J-Card
  const maxSlots = 4;
  const slots = Array.from({ length: maxSlots }, (_, i) => songs[i] || null);

  return (
    <div className={`relative mx-auto select-none ${className}`} style={{ maxWidth: 440, width: "100%" }}>
      {/* Optional Peeking Note behind/tucked in top */}
      {peekingNote && (
        <div
          onClick={onPeekingNoteClick}
          className="absolute -top-12 left-6 right-6 h-20 rounded-t-xl bg-[#FAF6EE] border-t-2 border-l-2 border-r-2 border-amber-200/80 shadow-md p-3 overflow-hidden cursor-pointer transition-transform hover:-translate-y-2"
          style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 19px, #BAE6FD 19px, #BAE6FD 20px)",
          }}
          title="Click to view note"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <p className="font-script text-base text-zinc-700 truncate">
              {peekingNote}
            </p>
          </div>
        </div>
      )}

      {/* Acrylic Clear Case Outer Shell */}
      <div className="relative rounded-[22px] p-3.5 bg-gradient-to-br from-white/70 via-white/30 to-white/10 backdrop-blur-md border-2 border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.18),inset_0_2px_8px_rgba(255,255,255,0.8),inset_0_-2px_8px_rgba(0,0,0,0.1)]">
        {/* Acrylic Edge / Hinge Highlights */}
        <div className="absolute top-0 bottom-0 left-0 w-3 rounded-l-[20px] bg-gradient-to-r from-white/80 via-white/30 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-2 rounded-r-[20px] bg-gradient-to-l from-white/60 to-transparent pointer-events-none" />
        
        {/* Glass Reflection Sheen Diagonal */}
        <div
          className="absolute inset-0 rounded-[20px] pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 80%)",
          }}
        />

        {/* J-Card Paper Insert */}
        <div className="relative rounded-xl overflow-hidden bg-[#FAF8F5] border border-amber-900/10 shadow-inner flex flex-col">
          {/* J-Card Spine Accent (Pattern preview strip on top/left) */}
          <div
            className="h-3 w-full border-b border-black/10 flex items-center px-3"
            style={{ backgroundColor: pattern.labelBg }}
          >
            <div className="w-full flex items-center justify-between text-[8px] font-mono tracking-widest text-zinc-500 uppercase">
              <span>STEREO • TYPE I NORMAL BIAS</span>
              <span>{pattern.name}</span>
            </div>
          </div>

          {/* J-Card Header */}
          <div className="px-5 pt-4 pb-3 border-b border-zinc-200/80 bg-[#FAF7F2]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Side A Badge */}
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  A
                </div>
                <div>
                  <h3 className="font-pixel text-[13px] tracking-wide text-zinc-900 uppercase">
                    {title || "FAVORITE TRACKS"}
                  </h3>
                  {recipientName && (
                    <p className="text-[11px] text-zinc-500 font-medium">
                      For: <span className="text-zinc-800">{recipientName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Noise Reduction / Tape Spec */}
              <div className="text-right text-[9px] font-mono text-zinc-500 leading-tight">
                <div>DATE / TIME</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span>NR:</span>
                  <span className="inline-flex items-center gap-0.5">
                    <span className="w-2 h-2 border border-zinc-400 rounded-sm inline-block bg-zinc-800" /> ON
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-zinc-400">
                    <span className="w-2 h-2 border border-zinc-300 rounded-sm inline-block" /> OFF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ruled Song Lines (Notebook Style) */}
          <div className="px-5 py-3 divide-y divide-blue-200/60 bg-[#FFFDF9]">
            {slots.map((song, idx) => {
              const isPlaying = activeSongIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => song && onSelectSong?.(idx)}
                  className={`relative py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    song ? "cursor-pointer hover:bg-amber-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Index Number */}
                    <span className="font-mono text-xs font-semibold text-zinc-400 w-4 text-right">
                      {idx + 1}.
                    </span>

                    {/* Track info or blank line */}
                    {song ? (
                      <div className="min-w-0 flex-1 flex items-baseline gap-2">
                        <span
                          className={`font-script text-xl truncate leading-none transition-colors ${
                            isPlaying
                              ? "text-emerald-700 font-bold"
                              : "text-zinc-800"
                          }`}
                        >
                          {song.title}
                        </span>
                        {song.artist && (
                          <span className="text-[11px] font-sans text-zinc-500 truncate">
                            {song.artist}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-script text-base text-zinc-300 italic">
                        (empty track line)
                      </span>
                    )}
                  </div>

                  {/* Playing Indicator or Duration */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        PLAYING
                      </span>
                    )}
                    {song?.duration && !isPlaying && (
                      <span className="text-[11px] font-mono text-zinc-400">
                        {song.duration}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* J-Card Bottom Fold Accent */}
          <div className="px-5 py-2 bg-[#F5F1E8] border-t border-amber-900/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>PAIRFECT RETRO CASSETTE</span>
            <span>SIDE A • MAX 4 TRACKS</span>
          </div>
        </div>

        {/* Acrylic Case Bottom Tab / Feet */}
        <div className="flex justify-between px-6 pt-2">
          <div className="w-6 h-1.5 rounded-full bg-white/50 border border-white/80 shadow-sm" />
          <div className="w-6 h-1.5 rounded-full bg-white/50 border border-white/80 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
