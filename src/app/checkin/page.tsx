"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { moodDetails } from "@/app/dashboard/page";
import { Music, AlertCircle, Heart, ArrowLeft, Loader2, Sparkles, Search } from "lucide-react";

// Mock popular cozy tracks if Spotify is not linked, to let users test music attachments instantly
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
  const [spotifyTracks, setSpotifyTracks] = useState<any[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchTracks = async () => {
      if (!profile) return;
      setSpotifyLoading(true);
      try {
        if (profile.spotify_connected) {
          const res = await fetch("/api/spotify/tracks");
          if (res.ok) {
            const data = await res.json();
            if (data.error === "revoked") {
              setSpotifyTracks(fallbackTracks);
            } else {
              setSpotifyTracks(data.recentlyPlayed || []);
              if (data.currentlyPlaying) {
                setCurrentlyPlaying(data.currentlyPlaying);
                setSelectedTrack(data.currentlyPlaying); // auto-select currently playing
              }
            }
          } else {
            setSpotifyTracks(fallbackTracks);
          }
        } else {
          setSpotifyTracks(fallbackTracks);
        }
      } catch (err) {
        console.error("Failed to load tracks:", err);
        setSpotifyTracks(fallbackTracks);
      } finally {
        setSpotifyLoading(false);
      }
    };

    if (!loading) {
      fetchTracks();
    }
  }, [profile, loading]);

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
          <Loader2 className="w-8 h-8 text-brand-rose-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-peach-50/20 via-background to-background">
      <Navigation />

      <main className="max-w-xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start">
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            How are you feeling, {profile?.display_name}?
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your emotional rhythm and optionally write a short log for your partner.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
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
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all active:scale-[0.96] ${
                      isSelected
                        ? `${value.color} ring-2 ring-brand-rose-400 scale-[1.03] shadow-md`
                        : "border-card-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground"
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
          <div className="space-y-4 bg-white/40 dark:bg-[#1e1a19]/40 border border-card-border p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">
                2. Mood Intensity
              </label>
              <span className="text-xs font-bold text-brand-rose-500 bg-brand-rose-50 dark:bg-brand-rose-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
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
              className="w-full h-2 bg-card-border rounded-lg appearance-none cursor-pointer accent-brand-rose-500 dark:accent-brand-rose-600"
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
              <label className="text-sm font-bold text-foreground">
                3. Add a short note (Optional)
              </label>
              <span className="text-xs text-muted-foreground font-medium">
                {note.length} / 280
              </span>
            </div>
            <textarea
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What is making you feel this way? (e.g. coffee dates, study stress, cozy evening...)"
              className="block w-full h-24 p-4 border border-card-border rounded-2xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-rose-300 dark:focus:ring-brand-rose-800 text-foreground text-sm placeholder:text-muted-foreground/40 transition-all resize-none"
            />
          </div>

          {/* Spotify Song Attachment */}
          <div className="space-y-3 bg-white/40 dark:bg-[#1e1a19]/40 border border-card-border p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground flex items-center space-x-1.5">
                <Music className="w-4 h-4 text-brand-sage-500 fill-brand-sage-500/10" />
                <span>4. Song of the Moment (Optional)</span>
              </label>
              {selectedTrack && (
                <button
                  type="button"
                  onClick={() => setSelectedTrack(null)}
                  className="text-xs text-brand-rose-500 hover:text-brand-rose-600 font-semibold"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedTrack ? (
              <div className="flex items-center space-x-4 bg-brand-sage-50/20 border border-brand-sage-200/40 p-4 rounded-2xl">
                <img
                  src={selectedTrack.albumArt}
                  alt={selectedTrack.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-sm flex-shrink-0"
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
                {spotifyLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 text-brand-sage-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* A. Currently Playing Section */}
                    {currentlyPlaying && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-brand-sage-600 uppercase tracking-widest flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span>Currently Playing</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedTrack(currentlyPlaying)}
                          className="w-full flex items-center space-x-3 p-3 rounded-2xl border-2 border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-left transition-all group"
                        >
                          <img
                            src={currentlyPlaying.albumArt}
                            alt={currentlyPlaying.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-brand-sage-600 transition-colors">
                              {currentlyPlaying.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {currentlyPlaying.artist}
                            </p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* B. Recently Played Section */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {profile?.spotify_connected ? "Recently Played History" : "Cozy Lo-Fi Defaults"}
                      </p>
                      
                      {spotifyTracks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic pl-1">No recently played tracks found.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {spotifyTracks.map((track) => (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => setSelectedTrack(track)}
                              className="flex items-center space-x-3 p-2.5 rounded-xl border border-card-border bg-background/30 hover:bg-background/80 hover:border-brand-sage-300/40 text-left transition-all group"
                            >
                              <img
                                src={track.albumArt}
                                alt={track.name}
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate group-hover:text-brand-rose-500 transition-colors">
                                  {track.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {track.artist}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-muted-foreground/60 italic text-center border-t border-card-border/50 pt-2.5">
                  {profile?.spotify_connected 
                    ? "Spotify connected. Loading live playback information." 
                    : "Using default tracks. Connect your personal Spotify account inside Settings."}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedMood}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 border border-transparent rounded-2xl shadow-md text-base font-bold text-white bg-brand-rose-500 hover:bg-brand-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-rose-400 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publishing Check-in...</span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white stroke-white animate-pulse" />
                <span>Publish Today's Vibe</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
