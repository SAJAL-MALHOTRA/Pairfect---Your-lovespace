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
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-[#FAF9F6] border-2 border-stone-800 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] p-6 sm:p-7 overflow-hidden flex flex-col text-stone-900">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
              <Radio className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-stone-900 leading-tight">
                Whisper Guide &amp; Airwaves
              </h3>
              <p className="text-xs font-mono text-stone-500">
                Browse stored notes and couple stations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2.5 pt-4 pb-3">
          <button
            onClick={() => {
              playRadioClick();
              setActiveTab("notes");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border-2 border-stone-800 ${
              activeTab === "notes"
                ? "bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                : "bg-white text-stone-800 hover:bg-stone-50 shadow-none"
            }`}
          >
            Voice Notes ({whispers.length})
          </button>

          <button
            onClick={() => {
              playRadioClick();
              setActiveTab("stations");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border-2 border-stone-800 ${
              activeTab === "stations"
                ? "bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                : "bg-white text-stone-800 hover:bg-stone-50 shadow-none"
            }`}
          >
            Station Guide ({PRESET_STATIONS.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-3">
          {activeTab === "notes" ? (
            whispers.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-500">
                <Radio className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="font-bold text-stone-800">The airwaves are quiet right now.</p>
                <p className="text-xs text-stone-500 mt-1">Press the red button on the radio to drop your first whisper!</p>
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
                    className={`p-4 rounded-2xl border-2 border-stone-800 transition-all ${
                      isTunedIn
                        ? "bg-amber-50 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]"
                        : "bg-white hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs bg-stone-900 text-white px-2 py-0.5 rounded-md border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)]">
                            {noteFreq.toFixed(1)} FM
                          </span>

                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-stone-800">
                            {moodInfo.icon} {moodInfo.label}
                          </span>

                          {w.listened_at && (
                            <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                              <Heart className="w-3 h-3 fill-current" />
                              <span>Heard</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading font-black text-sm text-stone-900 truncate">
                          {w.title}
                        </h4>

                        <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mt-1">
                          <span>By <strong className="text-stone-800">{w.sender_name || "Partner"}</strong></span>
                          <span>·</span>
                          <span>{w.duration ? `${Math.floor(Number(w.duration))}s` : "Voice Note"}</span>
                          <span>·</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Action Button: Tune In */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            playRadioClick();
                            onTuneToFrequency(noteFreq);
                            onClose();
                          }}
                          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                            isTunedIn
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-500 hover:bg-rose-600 text-white"
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                          <span>{isTunedIn ? "Listening" : "Tune In"}</span>
                        </button>

                        {isOwn && onDeleteWhisper && (
                          <button
                            onClick={() => onDeleteWhisper(w.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2.5]" />
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
                  className={`p-4 rounded-2xl border-2 border-stone-800 transition-all ${
                    isCurrent
                      ? "bg-amber-50 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]"
                      : "bg-white hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono font-black text-xs bg-stone-900 text-white px-2 py-0.5 rounded-md border border-stone-800 shadow-[1px_1px_0px_0px_rgba(28,25,23,0.9)]">
                          {station.frequency.toFixed(1)} FM
                        </span>
                        <span className="font-heading font-black text-sm text-stone-900">
                          {station.name}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 font-sans leading-relaxed">
                        {station.description}
                      </p>

                      <div className="text-[11px] font-mono font-bold text-stone-500 mt-1.5">
                        {matchingNotes.length} voice note{matchingNotes.length !== 1 ? "s" : ""} on this frequency
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playRadioClick();
                        onTuneToFrequency(station.frequency);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-800 text-xs font-bold text-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex-shrink-0"
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
