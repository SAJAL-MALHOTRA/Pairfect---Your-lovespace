"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { moodDetails } from "@/app/dashboard/page";
import { Music, AlertCircle, Heart, ArrowLeft, Loader2 } from "lucide-react";

const fallbackTracks = [
  { id: "1", name: "Cozy Coffee", artist: "Lo-Fi Lullabies", albumArt: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=80&h=80&fit=crop" },
  { id: "2", name: "Rainy Sunday", artist: "Acoustic Dreams", albumArt: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=80&h=80&fit=crop" },
  { id: "3", name: "Warm Hugs", artist: "Sweet Melodies", albumArt: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=80&h=80&fit=crop" },
  { id: "4", name: "Starlight Dance", artist: "Vibe Selector", albumArt: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=80&h=80&fit=crop" },
];

export default function CheckinPage() {
  const { user, pair, profile, loading } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState("");
  const [cozyTracks, setCozyTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setCozyTracks(fallbackTracks);
  }, []);

  // Adaptive navigation hide listener
  useEffect(() => {
    if (isTyping) {
      window.dispatchEvent(new CustomEvent("navigation-hide"));
    } else {
      window.dispatchEvent(new CustomEvent("navigation-show"));
    }
  }, [isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) {
      setError("Please select a vibe first.");
      return;
    }
    if (!pair) {
      setError("You are not paired yet. Please complete onboarding first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase
        .from("mood_logs")
        .insert({
          pair_id: pair.id,
          user_id: user!.id,
          mood: selectedMood as any,
          mood_intensity: intensity,
          note: note.trim() || null,
          spotify_track_id: selectedTrack?.id || null,
          spotify_track_name: selectedTrack?.name || null,
          spotify_artist_name: selectedTrack?.artist || null,
          spotify_album_art: selectedTrack?.albumArt || null,
        });

      if (insertErr) throw insertErr;

      window.dispatchEvent(new CustomEvent("navigation-show"));
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log today's mood check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5] flex flex-col justify-between pb-32">
      {/* Hide navigation dock while note is focused/editing */}
      {!isTyping && <Navigation />}

      <main className="max-w-2xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-start animate-fade-in select-none">
        {/* Back header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("navigation-show"));
              router.back();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#8A7B6E] hover:text-[#2E2A25] uppercase cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-[#8A7B6E] uppercase">
            Journal entry
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
              Daily check-in
            </span>
            <h1 className="text-4xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5]">
              How is your heart today?
            </h1>
          </div>

          {/* Luxury Notebook Pad & Lined Note */}
          <div className="paper-sheet-lined rounded-2xl border border-[#EAE3D5] dark:border-amber-950/20 p-8 md:p-10 shadow-sm relative space-y-8 bg-[#FAF5EB] dark:bg-[#201A15]">
            
            {/* Lined Notebook Header: Mood Pills Row */}
            <div className="space-y-3 not-italic">
              <label className="text-[10px] font-mono font-bold text-[#8A7B6E] uppercase tracking-wider block">
                1. Select vibe pill
              </label>
              
              <div className="flex gap-2 flex-wrap pb-4 border-b border-[#EAE3D5]/60 dark:border-amber-900/10">
                {Object.entries(moodDetails).map(([key, value]) => {
                  const isSelected = selectedMood === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedMood(key);
                        setError(null);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#802030] border-[#802030] text-white shadow-sm"
                          : "border-[#EAE3D5] bg-[#FCFBF9] text-[#7C7267] hover:bg-[#FAF6EE] dark:bg-[#1C1713]/40 dark:border-[#3E352E] dark:text-[#A59B8E]"
                      }`}
                    >
                      <span className="mr-1">{value.emoji}</span>
                      <span>{value.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note text entry representing lined paper */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#8A7B6E]">
                <span>2. Log notes</span>
                <span>{note.length} / 280</span>
              </div>
              <textarea
                maxLength={280}
                value={note}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write down details or feelings (e.g. coffee dates, study stress, cozy evening)..."
                className="block w-full h-32 bg-transparent focus:outline-none text-[#2E2A25] dark:text-[#E8E2D5] text-sm leading-7 font-sans placeholder-[#8A7B6E]/30 resize-none border-none p-0"
              />
            </div>
          </div>

          {/* Mood Intensity Control */}
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#8A7B6E] uppercase tracking-wider">
              <span>Intensity</span>
              <span>Level {intensity} of 5</span>
            </div>
            
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#EAE3D5] dark:bg-[#3E352E] rounded-chip appearance-none cursor-pointer accent-[#802030]"
            />
          </div>

          {/* Cozy Track Attachment */}
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#8A7B6E] uppercase tracking-wider">
              <span>Song of the moment</span>
              {selectedTrack && (
                <button
                  type="button"
                  onClick={() => setSelectedTrack(null)}
                  className="text-[9px] text-[#802030] hover:underline cursor-pointer font-bold"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedTrack ? (
              <div className="flex items-center space-x-4 bg-[#FAF6EE] dark:bg-[#28221D] border border-[#EAE3D5] dark:border-[#3E352E] p-4 rounded-2xl shadow-sm">
                <img
                  src={selectedTrack.albumArt}
                  alt={selectedTrack.name}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-[#2E2A25] dark:text-[#E8E2D5] truncate">
                    {selectedTrack.name}
                  </p>
                  <p className="text-[10px] text-[#8A7B6E] truncate">
                    {selectedTrack.artist}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cozyTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setSelectedTrack(track)}
                    className="flex items-center space-x-3 p-2 rounded-xl border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] hover:bg-[#FAF6EE]/50 text-left transition-all cursor-pointer group"
                  >
                    <img
                      src={track.albumArt}
                      alt={track.name}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#2E2A25] dark:text-[#E8E2D5] truncate group-hover:text-[#802030]">
                        {track.name}
                      </p>
                      <p className="text-[9px] text-[#8A7B6E] truncate">
                        {track.artist}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={submitting || !selectedMood}
              className="btn-primary py-3 px-12 text-xs uppercase font-bold tracking-wider cursor-pointer"
            >
              {submitting ? (
                <span>Publishing Check-in...</span>
              ) : (
                <span>Publish Entry</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
