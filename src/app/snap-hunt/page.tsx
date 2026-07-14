"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Camera, Check, X, Loader2, AlertCircle, 
  Trophy, Sparkles, Lock, Unlock, 
  ArrowLeft, Timer, Image, Plus, RefreshCw, Upload, Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function SnapHuntPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [hunts, setHunts] = useState<any[]>([]);
  const [activeHunt, setActiveHunt] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Form & Upload states
  const [initiatingHunt, setInitiatingHunt] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Game states
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<any>(null);
  const [partnerEntry, setPartnerEntry] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [judging, setJudging] = useState(false);
  
  const [myEntrySignedUrl, setMyEntrySignedUrl] = useState<string | null>(null);
  const [partnerEntrySignedUrl, setPartnerEntrySignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  // 1. Fetch Scavenger Hunts List
  const fetchHunts = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data, error: err } = await supabase
        .from("snap_hunts")
        .select(`
          *,
          snap_hunt_results (
            id,
            winner_user_id,
            reasoning
          )
        `)
        .eq("pair_id", pair.id)
        .order("started_at", { ascending: false });

      if (err) throw err;
      setHunts(data || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load snap hunts.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchHunts();

      // Realtime subscription for list updates
      const huntsChan = supabase
        .channel(`hunts-list-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "snap_hunts", filter: `pair_id=eq.${pair.id}` },
          () => fetchHunts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(huntsChan);
      };
    }
  }, [loading, pair]);

  // 2. Fetch specific hunt details & entries
  const loadHuntDetails = async (huntId: string) => {
    try {
      const { data: hunt } = await supabase
        .from("snap_hunts")
        .select("*")
        .eq("id", huntId)
        .single();

      if (!hunt) return;

      const { data: entries } = await supabase
        .from("snap_hunt_entries")
        .select("*")
        .eq("hunt_id", huntId);

      const mine = entries?.find((e: any) => e.user_id === user?.id);
      const partnerE = entries?.find((e: any) => e.user_id === partner?.id);

      setMyEntry(mine || null);
      setPartnerEntry(partnerE || null);
      setSelectedFile(null);
      setImagePreview(null);

      // Sign URLs for previewing images safely
      if (mine) {
        const { data: sData } = await supabase.storage.from("memories").createSignedUrl(mine.photo_url, 3600);
        setMyEntrySignedUrl(sData?.signedUrl || null);
      } else {
        setMyEntrySignedUrl(null);
      }

      if (partnerE) {
        const { data: sData } = await supabase.storage.from("memories").createSignedUrl(partnerE.photo_url, 3600);
        setPartnerEntrySignedUrl(sData?.signedUrl || null);
      } else {
        setPartnerEntrySignedUrl(null);
      }

      if (hunt.status === "judged") {
        const { data: res } = await supabase
          .from("snap_hunt_results")
          .select("*")
          .eq("hunt_id", huntId)
          .single();
        setResult(res || null);
      } else {
        setResult(null);
      }

      setActiveHunt(hunt);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Realtime subscription to active hunt
  useEffect(() => {
    if (!activeHunt || !user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`hunt-${activeHunt.id}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "snap_hunt_entries", filter: `hunt_id=eq.${activeHunt.id}` },
        async (payload: any) => {
          const newEntry = payload.new;
          const { data: sData } = await supabase.storage.from("memories").createSignedUrl(newEntry.photo_url, 3600);

          if (newEntry.user_id === user.id) {
            setMyEntry(newEntry);
            setMyEntrySignedUrl(sData?.signedUrl || null);
          } else {
            setPartnerEntry(newEntry);
            setPartnerEntrySignedUrl(sData?.signedUrl || null);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "snap_hunt_results", filter: `hunt_id=eq.${activeHunt.id}` },
        (payload: any) => {
          setResult(payload.new);
          setJudging(false);
          setActiveHunt((prev: any) => ({ ...prev, status: "judged" }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "snap_hunts", filter: `id=eq.${activeHunt.id}` },
        (payload: any) => {
          setActiveHunt(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHunt, user]);

  // 4. Timer Sync Logic (Unified Server Countdown)
  useEffect(() => {
    if (!activeHunt || activeHunt.status === "judged") {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const startMs = parseISO(activeHunt.started_at).getTime();
      const nowMs = new Date().getTime();
      const elapsed = Math.floor((nowMs - startMs) / 1000);
      const remaining = activeHunt.duration_seconds - elapsed;

      if (remaining <= 0) {
        setSecondsRemaining(0);
        // Force judging block once time is zero
      } else {
        setSecondsRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeHunt]);

  // 5. File Selection Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 6. Submit Snap Entry
  const handleSubmitSnap = async () => {
    if (!activeHunt || !selectedFile || uploading || myEntry || !user || !pair) return;
    setUploading(true);
    setError(null);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filename = `snap-hunt-${activeHunt.id}-${user.id}-${Date.now()}.${fileExt}`;
      const storagePath = `${pair.id}/${filename}`;

      // Upload file to Supabase memories bucket
      const { error: uploadErr } = await supabase.storage
        .from("memories")
        .upload(storagePath, selectedFile);

      if (uploadErr) throw uploadErr;

      // Insert database entry
      const { data, error: insertErr } = await supabase
        .from("snap_hunt_entries")
        .insert({
          hunt_id: activeHunt.id,
          user_id: user.id,
          photo_url: storagePath
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setMyEntry(data);
      const { data: sData } = await supabase.storage.from("memories").createSignedUrl(data.photo_url, 3600);
      setMyEntrySignedUrl(sData?.signedUrl || null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to upload photo snap.");
    } finally {
      setUploading(false);
    }
  };

  // 7. Trigger Gemini Vision Judging
  useEffect(() => {
    const triggerJudging = async () => {
      // Trigger judging only if both submitted, or time is up and we have at least one or two submissions
      const bothSubmitted = myEntry && partnerEntry;
      const isExpired = secondsRemaining === 0;

      if (!activeHunt || activeHunt.status === "judged" || judging) return;
      if (!bothSubmitted && !isExpired) return; // wait until both submit or time finishes

      // To judge we need at least 2 entries submitted
      if (bothSubmitted) {
        setJudging(true);
        try {
          const res = await fetch("/api/snaps/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ huntId: activeHunt.id })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Judging failed");
        } catch (e: any) {
          console.error("Judging error:", e);
        }
      }
    };

    triggerJudging();
  }, [activeHunt, myEntry, partnerEntry, secondsRemaining, judging]);

  // 8. Start Hunt
  const handleStartHunt = async () => {
    if (!pair || initiatingHunt) return;
    setInitiatingHunt(true);
    setError(null);

    try {
      // A. Call API to get clue
      const clueRes = await fetch("/api/snaps/clue", { method: "POST" });
      const clueData = await clueRes.json();
      if (!clueRes.ok) throw new Error(clueData.error || "Failed to generate clue.");

      // B. Create database hunt row
      const { data, error: err } = await supabase
        .from("snap_hunts")
        .insert({
          pair_id: pair.id,
          clue: clueData.clue,
          status: "active",
          duration_seconds: 90
        })
        .select()
        .single();

      if (err) throw err;

      loadHuntDetails(data.id);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to initiate snap hunt.");
    } finally {
      setInitiatingHunt(false);
    }
  };

  if (loading || !user || !pair) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const partnerName = partner?.display_name || "Partner";

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground transition-colors duration-300">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background: "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* LOBBY / HISTORIC HUNTS VIEW */}
        {!activeHunt && (
          <div className="space-y-8">
            <div className="border-b border-border/40 pb-6 space-y-2">
              <h1 className="text-3xl font-sans font-black tracking-tight text-foreground flex items-center space-x-2.5">
                <Camera className="w-7 h-7 text-primary" />
                <span>Snap Hunt</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Start a scavenger hunt! Gemini generates a vague home clue, you both get 90 seconds to find it and snap a photo, and Gemini Vision decides the most creative winner.
              </p>
            </div>

            {/* Start New Hunt Panel */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Ready for a scavenger race?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Make sure your partner is online and ready to race!
                </p>
              </div>

              <button
                onClick={handleStartHunt}
                disabled={initiatingHunt}
                className="inline-flex items-center justify-center space-x-1.5 py-3 px-6 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                {initiatingHunt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span>Start Hunt 🚀</span>
              </button>
            </div>

            {/* List of past hunts */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Image className="w-4 h-4 text-primary" />
                <span>Snap Hunt History</span>
              </h2>

              {fetching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                </div>
              ) : hunts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/45 p-12 text-center text-muted-foreground">
                  No hunts started yet! Launch your first scavenger hunt above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hunts.map((h: any) => {
                    const resultDetails = h.snap_hunt_results?.[0];
                    const isWinnerMe = resultDetails?.winner_user_id === user.id;

                    return (
                      <div
                        key={h.id}
                        onClick={() => loadHuntDetails(h.id)}
                        className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              h.status === "judged" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                            }`}>
                              {h.status}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {format(parseISO(h.started_at), "MMM d, h:mm a")}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-foreground leading-normal line-clamp-2">
                            "{h.clue}"
                          </h3>

                          {h.status === "judged" && resultDetails && (
                            <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                              "{resultDetails.reasoning}"
                            </p>
                          )}
                        </div>

                        {h.status === "judged" && (
                          <div className="mt-4 pt-3 border-t border-border/40 flex items-center space-x-1.5 text-xs">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="font-bold text-foreground">
                              {resultDetails?.winner_user_id ? (isWinnerMe ? "You Won! 🏆" : `${partnerName} Won 🏆`) : "Draw Result 🤝"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE SCAVENGER HUNT OR REVEAL VIEW */}
        {activeHunt && (
          <div className="max-w-2xl w-full mx-auto space-y-6">
            
            {/* Header Details */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <button
                onClick={() => {
                  setActiveHunt(null);
                  fetchHunts();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Hunts Lobby</span>
              </button>

              <span className="bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-primary/20">
                Hunt Status: {activeHunt.status}
              </span>
            </div>

            {/* Active hunt display board */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-center">
              
              {/* The Clue */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                  Scavenger Clue
                </p>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-foreground leading-snug max-w-xl mx-auto">
                  "{activeHunt.clue}"
                </h2>
              </div>

              {/* Countdown Timer */}
              {secondsRemaining !== null && secondsRemaining > 0 && activeHunt.status !== "judged" && (
                <div className="flex items-center justify-center space-x-2 py-1">
                  <Timer className={`w-6 h-6 ${secondsRemaining < 20 ? "text-red-500 animate-pulse" : "text-primary"}`} />
                  <span className="text-2xl font-mono font-black text-foreground">{secondsRemaining}s remaining</span>
                </div>
              )}

              {/* Submit Photo Form */}
              {!myEntry && activeHunt.status !== "judged" && (
                <div className="max-w-md mx-auto space-y-6">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="aspect-square w-full max-w-xs mx-auto border border-border rounded-2xl overflow-hidden relative shadow-inner">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleSubmitSnap}
                          disabled={uploading}
                          className="flex-1 max-w-[200px] flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>Upload Snap 📸</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreview(null);
                          }}
                          disabled={uploading}
                          className="flex-1 max-w-[200px] flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-foreground border border-border bg-background hover:bg-muted active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 space-y-3 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Camera className="w-10 h-10 text-muted-foreground/50" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">Find the item & Snap a Photo</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Click or drag a file to select your snapshot</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Waiting screen once user submitted */}
              {myEntry && !partnerEntry && activeHunt.status !== "judged" && (
                <div className="py-8 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Your hunt photo has been uploaded!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Waiting for {partnerName} to submit their snap. Gemini Vision will judge both images side-by-side once the timer runs out or both files are received!
                  </p>
                  {myEntrySignedUrl && (
                    <div className="aspect-square w-28 border border-border rounded-xl overflow-hidden shadow-sm">
                      <img src={myEntrySignedUrl} alt="Your find" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Judging loader block */}
              {myEntry && partnerEntry && activeHunt.status !== "judged" && (
                <div className="py-10 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full border-4 border-dashed border-primary animate-spin flex items-center justify-center" />
                  <p className="text-sm font-bold text-foreground animate-pulse">
                    Gemini Vision is currently evaluating your photos...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Comparing creativity, humor, and match accuracy of both items!
                  </p>
                </div>
              )}

              {/* Results Reveal View */}
              {activeHunt.status === "judged" && result && (
                <div className="space-y-8 animate-fade-in text-left">
                  
                  {/* Result Detail Card */}
                  <div className="rounded-xl border border-primary/20 bg-pink-500/5 p-6 space-y-4">
                    <h3 className="text-sm font-mono font-bold text-primary uppercase tracking-widest flex items-center space-x-1.5">
                      <Trophy className="w-4 h-4" />
                      <span>Hunt Results</span>
                    </h3>

                    <div className="space-y-2">
                      <p className="text-xl font-bold text-foreground">
                        Winner: {result.winner_user_id === user.id ? "You Won! 🏆" : (result.winner_user_id === partner?.id ? `${partnerName} Wins 🏆` : "Draw Result 🤝")}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed italic">
                        "{result.reasoning}"
                      </p>
                    </div>
                  </div>

                  {/* Photos comparison columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
                    
                    {/* Your Photo */}
                    <div className="bg-[#faf9f6] p-4 border border-stone-200 shadow-md rotate-[-1deg] text-center flex flex-col justify-between">
                      <div className="aspect-square bg-stone-100 border border-stone-300 overflow-hidden relative">
                        {myEntrySignedUrl ? (
                          <img src={myEntrySignedUrl} alt="Your submission" className="w-full h-full object-cover" />
                        ) : (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-3.5">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                          Your Find
                        </p>
                      </div>
                    </div>

                    {/* Partner's Photo */}
                    <div className="bg-[#faf9f6] p-4 border border-stone-200 shadow-md rotate-[1deg] text-center flex flex-col justify-between">
                      <div className="aspect-square bg-stone-100 border border-stone-300 overflow-hidden relative">
                        {partnerEntrySignedUrl ? (
                          <img src={partnerEntrySignedUrl} alt="Partner submission" className="w-full h-full object-cover" />
                        ) : (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-3.5">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                          {partnerName}'s Find
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
