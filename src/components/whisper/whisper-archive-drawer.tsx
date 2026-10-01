"use client";

import React, { useState } from "react";
import { X, Radio, Play, Trash2, Heart, Clock, Sparkles, Volume2 } from "lucide-react";
import { WhisperNote, PRESET_STATIONS, MOOD_TAG_LABELS } from "@/lib/whisper/types";
import { playRadioClick } from "@/lib/whisper/audio-fx";

interface WhisperArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  whispers: WhisperNote[];
  currentFrequency: number;
  onTuneToFrequency: (freq: number) => void;
  onDeleteWhisper?: (id: string) => void;
  currentUserId?: string;
}

export function WhisperArchiveDrawer({
  isOpen,
  onClose,
  whispers,
  currentFrequency,
  onTuneToFrequency,
  onDeleteWhisper,
  currentUserId,
}: WhisperArchiveDrawerProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "stations">("notes");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-[#FFF5F8] border-2 border-[var(--border)] shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col text-[var(--text)]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/70">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[var(--burgundy)]" />
            <h3 className="font-heading font-bold text-lg text-[var(--text)]">
              Whisper Guide & Airwaves
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[var(--text-soft)] hover:text-[var(--text)] border border-[var(--border)] shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 pb-2">
          <button
            onClick={() => {
              playRadioClick();
              setActiveTab("notes");
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "notes"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "bg-white text-[var(--text-soft)] hover:bg-rose-50 border border-[var(--border)]"
            }`}
          >
            Voice Notes ({whispers.length})
          </button>

          <button
            onClick={() => {
              playRadioClick();
              setActiveTab("stations");
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "stations"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "bg-white text-[var(--text-soft)] hover:bg-rose-50 border border-[var(--border)]"
            }`}
          >
            Station Guide ({PRESET_STATIONS.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-2.5">
          {activeTab === "notes" ? (
            whispers.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--text-soft)]">
                <Radio className="w-8 h-8 text-[var(--burgundy)]/40 mx-auto mb-2" />
                <p className="font-medium">The airwaves are quiet right now.</p>
                <p className="text-xs text-zinc-400 mt-1">Press the red button on the radio to drop your first whisper!</p>
              </div>
            ) : (
              whispers.map((w) => {
                const noteFreq = typeof w.frequency === "number" && !isNaN(w.frequency) ? w.frequency : parseFloat(String(w.frequency)) || 91.7;
                const isTunedIn = Math.abs(noteFreq - currentFrequency) < 0.05;
                const moodInfo = (w.mood_tag && MOOD_TAG_LABELS[w.mood_tag]) ? MOOD_TAG_LABELS[w.mood_tag] : MOOD_TAG_LABELS.romantic;
                const isOwn = currentUserId && w.sender_id === currentUserId;
                const formattedDate = w.created_at ? new Date(w.created_at).toLocaleDateString() : "Recent";

                return (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isTunedIn
                        ? "bg-white border-[var(--burgundy)] ring-2 ring-[var(--burgundy)]/20 shadow-sm"
                        : "bg-white/80 border-[var(--border)] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xs bg-[#1A1F24] text-emerald-400 px-2 py-0.5 rounded-md">
                            {noteFreq.toFixed(1)} FM
                          </span>

                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${moodInfo.color}`}>
                            {moodInfo.icon} {moodInfo.label}
                          </span>

                          {w.listened_at && (
                            <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              <span>Heard</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-sans font-semibold text-sm text-[var(--text)] truncate">
                          {w.title}
                        </h4>

                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-soft)] mt-0.5">
                          <span>By {w.sender_name || "Partner"}</span>
                          <span>•</span>
                          <span>{w.duration ? `${Math.floor(Number(w.duration))}s` : "Voice Note"}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Action Button: Tune In */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            playRadioClick();
                            onTuneToFrequency(noteFreq);
                            onClose();
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer ${
                            isTunedIn
                              ? "bg-emerald-600 text-white"
                              : "bg-[var(--burgundy)] hover:bg-[#D13D68] text-white"
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                          <span>{isTunedIn ? "Listening" : "Tune In"}</span>
                        </button>

                        {isOwn && onDeleteWhisper && (
                          <button
                            onClick={() => onDeleteWhisper(w.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            PRESET_STATIONS.map((station) => {
              const isCurrent = Math.abs(station.frequency - currentFrequency) < 0.05;
              const matchingNotes = whispers.filter((w) => Math.abs(w.frequency - station.frequency) < 0.05);

              return (
                <div
                  key={station.frequency}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-white border-[var(--burgundy)] ring-2 ring-[var(--burgundy)]/20 shadow-sm"
                      : "bg-white/80 border-[var(--border)] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs bg-[#1A1F24] text-white px-2 py-0.5 rounded-md">
                          {station.frequency.toFixed(1)} FM
                        </span>
                        <span className="font-sans font-bold text-sm text-[var(--text)]">
                          {station.name}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                        {station.description}
                      </p>

                      <div className="text-[11px] font-mono text-zinc-400 mt-1">
                        {matchingNotes.length} voice note{matchingNotes.length !== 1 ? "s" : ""} on this frequency
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playRadioClick();
                        onTuneToFrequency(station.frequency);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-[var(--border)] text-xs font-semibold text-[var(--text)] shadow-xs transition-transform active:scale-95 cursor-pointer flex-shrink-0"
                    >
                      Tune Here
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
