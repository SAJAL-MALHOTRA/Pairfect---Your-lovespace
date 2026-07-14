"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { moodDetails } from "@/app/dashboard/page";
import { Music, AlertCircle, Heart, ArrowLeft, Loader2, Sparkles, Search } from "lucide-react";

// Mock popular cozy tracks to let users test music attachments instantly
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
  const [musicLoading, setMusicLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setCozyTracks(fallbackTracks);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) {
      setError("Please select a mood that represents your state.");
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
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />

      <Navigation />

      <main className="max-w-xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10">
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase font-mono tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-sans font-black text-foreground tracking-tight">
            How are you feeling, {profile?.display_name}?
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose your emotional rhythm and optionally write a short log for your partner.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-accent/40 border border-border/60 text-primary text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Mood Selector Grid */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-foreground">
              1. Select Mood
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                    className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all active:scale-[0.96] cursor-pointer ${
                      isSelected
                        ? `${value.color} ring-2 ring-primary scale-[1.03] shadow-sm`
                        : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-3xl mb-1.5 select-none">{value.emoji}</span>
                    <span className="text-xs font-semibold">{value.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                2. MOOD INTENSITY
              </label>
              <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Level {intensity} / 5
              </span>
            </div>
            
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-2 bg-border/60 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
              <span>Very Low</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Strong</span>
              <span>Peak</span>
            </div>
          </div>

          {/* Note Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                3. ADD A SHORT NOTE (OPTIONAL)
              </label>
              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                {note.length} / 280
              </span>
            </div>
            <textarea
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What is making you feel this way? (e.g. coffee dates, study stress, cozy evening...)"
              className="block w-full h-24 p-4 border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm placeholder:text-muted-foreground/30 transition-all resize-none"
            />
          </div>

          {/* Cozy Song Attachment */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Music className="w-3.5 h-3.5 text-primary" />
                <span>4. SONG OF THE MOMENT (OPTIONAL)</span>
              </label>
              {selectedTrack && (
                <button
                  type="button"
                  onClick={() => setSelectedTrack(null)}
                  className="text-xs text-primary hover:underline font-bold cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedTrack ? (
              <div className="flex items-center space-x-4 bg-muted/40 border border-border p-4 rounded-md">
                <img
                  src={selectedTrack.albumArt}
                  alt={selectedTrack.name}
                  className="w-12 h-12 rounded object-cover shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {selectedTrack.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedTrack.artist}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select a cozy track to attach to this mood check-in:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {cozyTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedTrack(track)}
                      className="flex items-center space-x-3 p-2.5 rounded-md border border-border bg-card hover:bg-muted text-left transition-all group cursor-pointer"
                    >
                      <img
                        src={track.albumArt}
                        alt={track.name}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {track.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {track.artist}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedMood}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer shadow-md shadow-pink-500/10 dark:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Check-in...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white stroke-white animate-pulse" />
                <span>Publish Today's Vibe</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
