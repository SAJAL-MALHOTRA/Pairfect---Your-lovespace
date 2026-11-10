"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import { CASSETTE_PATTERNS, CassettePatternConfig } from "@/components/mixtape/cassette-patterns";
import { CassetteShell } from "@/components/mixtape/cassette-shell";
import { CassetteJewelCase, CassetteSongItem } from "@/components/mixtape/cassette-jewel-case";
import { NotebookNoteCard } from "@/components/mixtape/notebook-note-card";
import { RetroAudioPlayer, MixtapePlayerTrack, extractYouTubeId } from "@/components/mixtape/retro-audio-player";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Share2,
  Copy,
  Sparkles,
  Music,
  Loader2,
  ExternalLink,
  FolderHeart,
  RotateCcw,
  Heart,
  Disc,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SavedMixtape {
  id: string;
  pair_id?: string;
  title: string;
  cover_theme: string;
  created_by: string | null;
  created_at: string;
  songs?: MixtapeSongRow[];
}

interface MixtapeSongRow {
  id?: string;
  mixtape_id?: string;
  title: string;
  artist?: string | null;
  youtube_url?: string | null;
  position: number;
  story?: string | null;
  created_at?: string;
}

interface DraftTrack {
  title: string;
  artist: string;
  youtube_url: string;
  thumbnail_url?: string;
  duration?: string;
}

function MixtapeContent() {
  const { user, pair, partner, loading: authLoading } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode: "wizard" (creating/editing) vs "collection" vs "player" (listening to a tape)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showCollection, setShowCollection] = useState(false);
  const [savedTapes, setSavedTapes] = useState<SavedMixtape[]>([]);
  const [loadingTapes, setLoadingTapes] = useState(false);

  // Wizard state
  const [selectedPatternId, setSelectedPatternId] = useState<string>("clover");
  const [tapeTitle, setTapeTitle] = useState<string>("Late Night Drives");
  const [recipientName, setRecipientName] = useState<string>("");
  const [draftTracks, setDraftTracks] = useState<DraftTrack[]>([]);
  const [noteContent, setNoteContent] = useState<string>("Made with all my love, just for you.");

  // Track input state
  const [youtubeInput, setYoutubeInput] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");

  // Playback state
  const [activeSongIndex, setActiveSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Active / Loaded mixtape in player mode
  const [activeMixtape, setActiveMixtape] = useState<SavedMixtape | null>(null);
  const [savingMixtape, setSavingMixtape] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [showFullNoteModal, setShowFullNoteModal] = useState(false);

  // Hide global navigation on the dedicated mixtape studio
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("navigation-hide"));
    return () => {
      window.dispatchEvent(new CustomEvent("navigation-show"));
    };
  }, []);

  // Set default recipient to partner's name if available
  useEffect(() => {
    if (partner?.display_name && !recipientName) {
      setRecipientName(partner.display_name);
    }
  }, [partner, recipientName]);

  // Fetch couple's saved mixtapes
  const fetchMixtapes = useCallback(async () => {
    if (!pair) return;
    setLoadingTapes(true);
    try {
      const { data: tapes } = await supabase
        .from("mixtapes")
        .select("id, title, cover_theme, created_by, created_at, pair_id")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (tapes && tapes.length > 0) {
        const tapeIds = tapes.map((t: any) => t.id);
        const { data: songsData } = await supabase
          .from("mixtape_songs")
          .select("*")
          .in("mixtape_id", tapeIds)
          .order("position", { ascending: true });

        const enriched = tapes.map((t: any) => ({
          ...t,
          songs: songsData?.filter((s: any) => s.mixtape_id === t.id) || [],
        }));
        setSavedTapes(enriched);
      } else {
        setSavedTapes([]);
      }
    } catch (e) {
      console.error("Failed to fetch mixtapes:", e);
    } finally {
      setLoadingTapes(false);
    }
  }, [pair, supabase]);

  useEffect(() => {
    if (pair && !authLoading) {
      fetchMixtapes();
    }
  }, [pair, authLoading, fetchMixtapes]);

  // Handle direct share URL `?id=...`
  const sharedId = searchParams.get("id");
  useEffect(() => {
    if (!sharedId) return;

    async function loadSharedTape() {
      try {
        const { data: tape } = await supabase
          .from("mixtapes")
          .select("id, title, cover_theme, created_by, created_at, pair_id")
          .eq("id", sharedId)
          .single();

        if (tape) {
          const { data: songs } = await supabase
            .from("mixtape_songs")
            .select("*")
            .eq("mixtape_id", tape.id)
            .order("position", { ascending: true });

          const fullTape: SavedMixtape = { ...tape, songs: songs || [] };
          setActiveMixtape(fullTape);

          // Parse metadata
          try {
            const parsed = JSON.parse(tape.cover_theme);
            if (parsed.patternId) setSelectedPatternId(parsed.patternId);
            if (parsed.note) setNoteContent(parsed.note);
            if (parsed.recipientName) setRecipientName(parsed.recipientName);
          } catch {
            // fallback
          }
          setTapeTitle(tape.title);
          setDraftTracks(
            (songs || []).map((s: any) => ({
              title: s.title,
              artist: (s.artist || "").toLowerCase() === "unknown artist" ? "" : (s.artist || ""),
              youtube_url: s.youtube_url || "",
              thumbnail_url: s.story || "",
            }))
          );
          setCurrentStep(4);
        }
      } catch (err) {
        console.error("Failed to load shared mixtape:", err);
      }
    }

    loadSharedTape();
  }, [sharedId, supabase]);

  // YouTube Link metadata auto-fetcher
  const handleFetchYoutubeMeta = async () => {
    if (!youtubeInput.trim()) return;
    setFetchingMeta(true);
    try {
      const res = await fetch(`/api/youtube/meta?url=${encodeURIComponent(youtubeInput.trim())}`);
      const data = await res.json();
      if (data.title) {
        setManualTitle(data.title);
      }
      if (data.artist) {
        setManualArtist(data.artist);
      }
    } catch (e) {
      console.error("Meta fetch error:", e);
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleAddTrack = () => {
    if (!manualTitle.trim() && !youtubeInput.trim()) return;
    if (draftTracks.length >= 4) return;

    const videoId = extractYouTubeId(youtubeInput.trim());
    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";

    const newTrack: DraftTrack = {
      title: manualTitle.trim() || "Untitled Track",
      artist: manualArtist.trim().toLowerCase() === "unknown artist" ? "" : manualArtist.trim(),
      youtube_url: youtubeInput.trim(),
      thumbnail_url: thumb,
    };

    setDraftTracks((prev) => [...prev, newTrack]);
    setYoutubeInput("");
    setManualTitle("");
    setManualArtist("");
  };

  const handleRemoveTrack = (index: number) => {
    setDraftTracks((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Mixtape to Supabase
  const handleSaveAndShare = async () => {
    if (!user) {
      setCurrentStep(4);
      return;
    }
    setSavingMixtape(true);

    try {
      const themePayload = JSON.stringify({
        patternId: selectedPatternId,
        note: noteContent,
        recipientName: recipientName,
      });

      let tapeId = activeMixtape?.id;

      if (!tapeId) {
        const { data: newTape, error: tapeErr } = await supabase
          .from("mixtapes")
          .insert({
            pair_id: pair?.id || null,
            title: tapeTitle.trim() || "My Mixtape",
            cover_theme: themePayload,
            created_by: user.id,
          })
          .select("id, title, cover_theme, created_by, created_at, pair_id")
          .single();

        if (tapeErr || !newTape) throw tapeErr;
        tapeId = newTape.id;
        setActiveMixtape(newTape);
      } else {
        await supabase
          .from("mixtapes")
          .update({
            title: tapeTitle.trim() || "My Mixtape",
            cover_theme: themePayload,
          })
          .eq("id", tapeId);
      }

      // Re-insert songs
      await supabase.from("mixtape_songs").delete().eq("mixtape_id", tapeId);

      const songRows = draftTracks.map((tr, idx) => ({
        mixtape_id: tapeId,
        title: tr.title,
        artist: tr.artist || null,
        youtube_url: tr.youtube_url || null,
        position: idx,
        story: tr.thumbnail_url || null,
        added_by: user.id,
      }));

      if (songRows.length > 0) {
        await supabase.from("mixtape_songs").insert(songRows);
      }

      // Update URL query param quietly
      router.replace(`/mixtape?id=${tapeId}`);
      setCurrentStep(4);
      fetchMixtapes();
    } catch (err) {
      console.error("Save mixtape error:", err);
    } finally {
      setSavingMixtape(false);
    }
  };

  const handleCopyLink = () => {
    const tapeId = activeMixtape?.id || sharedId;
    const url = tapeId
      ? `${window.location.origin}/mixtape?id=${tapeId}`
      : window.location.href;

    navigator.clipboard.writeText(url);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleOpenSavedTape = (tape: SavedMixtape) => {
    setActiveMixtape(tape);
    setTapeTitle(tape.title);
    try {
      const parsed = JSON.parse(tape.cover_theme);
      if (parsed.patternId) setSelectedPatternId(parsed.patternId);
      if (parsed.note) setNoteContent(parsed.note);
      if (parsed.recipientName) setRecipientName(parsed.recipientName);
    } catch {
      // ignore
    }

    setDraftTracks(
      (tape.songs || []).map((s) => ({
        title: s.title,
        artist: (s.artist || "").toLowerCase() === "unknown artist" ? "" : (s.artist || ""),
        youtube_url: s.youtube_url || "",
        thumbnail_url: s.story || "",
      }))
    );
    setShowCollection(false);
    setCurrentStep(4);
  };

  const handleCreateNew = () => {
    setActiveMixtape(null);
    setDraftTracks([]);
    setTapeTitle("Late Night Drives");
    setNoteContent("Made with all my love, just for you.");
    setSelectedPatternId("clover");
    setCurrentStep(1);
    setShowCollection(false);
    router.replace("/mixtape");
  };

  const selectedPattern = useMemo(() => {
    return (
      CASSETTE_PATTERNS.find((p) => p.id === selectedPatternId) ||
      CASSETTE_PATTERNS[0]
    );
  }, [selectedPatternId]);

  const playerTracks: MixtapePlayerTrack[] = useMemo(() => {
    return draftTracks.map((t, idx) => ({
      id: `track-${idx}`,
      title: t.title,
      artist: t.artist,
      youtube_url: t.youtube_url,
      thumbnail_url: t.thumbnail_url,
    }));
  }, [draftTracks]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 pb-36 sm:pb-40">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FAF9F6]/95 border-b-2 border-stone-800 px-4 py-3 sm:px-8 shadow-[0px_2px_0px_0px_rgba(28,25,23,0.9)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-stone-800 hover:bg-stone-50 text-stone-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-transform active:translate-x-[1px] active:translate-y-[1px]"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <CoupleBeansMascot className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] sm:text-xs tracking-wider bg-rose-500 text-white px-2.5 sm:px-3 py-1 rounded-lg font-bold border border-stone-800 shadow-[1.5px_1.5px_0px_0px_rgba(28,25,23,0.9)] select-none">
                PAIRFECT
              </span>
              <h1 className="font-heading font-black text-sm sm:text-lg tracking-wider text-stone-900 uppercase">
                MIXTAPE
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCollection(!showCollection)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-xs font-mono font-bold text-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <FolderHeart className="w-3.5 h-3.5 text-rose-500" />
              <span>Our Tapes ({savedTapes.length})</span>
            </button>

            {currentStep === 4 && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800 transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mixtape Collection Drawer Modal */}
      <AnimatePresence>
        {showCollection && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto px-4 mt-4"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-xl p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]/50">
                <div className="flex items-center gap-2">
                  <FolderHeart className="w-5 h-5 text-[var(--burgundy)]" />
                  <h2 className="font-sans font-semibold text-[var(--text)] text-base">
                    Saved Mixtapes
                  </h2>
                </div>
                <button
                  onClick={() => setShowCollection(false)}
                  className="text-xs text-[var(--text-soft)] hover:text-[var(--text)]"
                >
                  Close
                </button>
              </div>

              {loadingTapes ? (
                <div className="py-8 flex justify-center items-center gap-2 text-[var(--text-soft)] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--burgundy)]" /> Loading your collection...
                </div>
              ) : savedTapes.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No mixtapes saved yet. Create your first one below!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {savedTapes.map((tape) => {
                    let patternId = "clover";
                    try {
                      const parsed = JSON.parse(tape.cover_theme);
                      if (parsed.patternId) patternId = parsed.patternId;
                    } catch {}

                    return (
                      <div
                        key={tape.id}
                        onClick={() => handleOpenSavedTape(tape)}
                        className="group relative p-3 rounded-xl bg-white border border-[var(--border)] shadow-xs hover:shadow-md hover:border-[var(--burgundy)] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Disc className="w-4 h-4 text-[var(--burgundy)] group-hover:rotate-45 transition-transform" />
                          <h4 className="font-semibold text-sm text-[var(--text)] truncate">
                            {tape.title}
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--text-soft)]">
                          {tape.songs?.length || 0} songs •{" "}
                          {new Date(tape.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8">
        {/* Stepper Navigation: Labeled Pill Buttons */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2.5 p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#F5CAD6]/80 shadow-xs max-w-full overflow-x-auto">
            {[
              { num: 1, label: "1. Cassette Style" },
              { num: 2, label: "2. Tracklist" },
              { num: 3, label: "3. Note" },
              { num: 4, label: "4. Case" },
            ].map((step) => {
              const isPassed = currentStep > step.num;
              const isActive = currentStep === step.num;

              return (
                <button
                  key={step.num}
                  onClick={() => {
                    if (step.num <= currentStep || activeMixtape) {
                      setCurrentStep(step.num as 1 | 2 | 3 | 4);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--burgundy)] text-white shadow-md shadow-rose-200/50"
                      : isPassed
                      ? "bg-rose-50 text-[var(--burgundy)] border border-rose-200/60 hover:bg-rose-100/50"
                      : "text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-white/60"
                  }`}
                >
                  {isPassed ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                  ) : null}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Title Header */}
        <div className="text-center mb-6">
          <motion.h2
            key={currentStep}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-pixel text-lg sm:text-2xl text-[var(--text)] uppercase tracking-wide"
          >
            {currentStep === 1 && "PICK CASSETTE COLOR"}
            {currentStep === 2 && "ADD YOUR SONGS"}
            {currentStep === 3 && "ADD A LITTLE NOTE"}
            {currentStep === 4 && "SHARE YOUR MIXTAPE"}
          </motion.h2>
          <p className="text-xs sm:text-sm text-[var(--text-soft)] mt-1 font-medium">
            {currentStep === 1 && "Choose from 18 vintage patterns for your physical cassette shell"}
            {currentStep === 2 && "Paste YouTube links to automatically add up to 4 romantic tracks"}
            {currentStep === 3 && "Handwrite a sweet message onto your spiral binder note card"}
            {currentStep === 4 && "Your retro mixtape is assembled. Listen together or share the link!"}
          </p>
        </div>

        {/* ── STEP 1: PICK CASSETTE COLOR & STUDIO DESK ── */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Studio Layout: 2 Columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Cassette Shell Preview & Patterns Palette (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Title & Recipient Bar */}
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-soft)] font-bold tracking-wider">
                      Mixtape Name
                    </label>
                    <input
                      type="text"
                      value={tapeTitle}
                      onChange={(e) => setTapeTitle(e.target.value)}
                      placeholder="e.g. Late Night Drives"
                      maxLength={40}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white border border-[var(--border)] text-xs sm:text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--burgundy)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-soft)] font-bold tracking-wider">
                      For (Recipient)
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. My Favorite Person"
                      maxLength={30}
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white border border-[var(--border)] text-xs sm:text-sm font-medium text-[var(--text)] outline-none focus:border-[var(--burgundy)] transition-colors"
                    />
                  </div>
                </div>

                {/* Cassette Shell Preview */}
                <div className="py-2 flex justify-center">
                  <CassetteShell
                    patternId={selectedPatternId}
                    tapeTitle={tapeTitle}
                    recipientName={recipientName}
                    isPlaying={isPlaying}
                    size="md"
                  />
                </div>

                {/* 18 Circular Swatches Grid */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold uppercase text-[var(--text-soft)] tracking-wider">
                      Selected Style: <span className="text-[var(--text)] font-bold">{selectedPattern.name}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-[var(--burgundy)] border border-rose-200 font-bold">
                      18 PATTERNS
                    </span>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 sm:gap-3 place-items-center">
                    {CASSETTE_PATTERNS.map((pattern) => {
                      const isSelected = pattern.id === selectedPatternId;

                      return (
                        <button
                          key={pattern.id}
                          onClick={() => setSelectedPatternId(pattern.id)}
                          title={pattern.name}
                          style={{
                            backgroundColor: pattern.swatchBg,
                            borderColor: isSelected ? "var(--burgundy)" : pattern.swatchBorder,
                          }}
                          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-transform shadow-xs hover:scale-110 active:scale-95 cursor-pointer ${
                            isSelected
                              ? "ring-2 ring-[var(--burgundy)] ring-offset-2 scale-110 shadow-md"
                              : ""
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--burgundy)]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Lined Stationery Tracklist Notepad Preview (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative rounded-2xl bg-[#FCFAF2] border-2 border-[#E9DFCE] shadow-[0_12px_32px_rgba(0,0,0,0.06)] p-5 overflow-hidden">
                  {/* Binder holes */}
                  <div className="absolute top-0 bottom-0 left-2.5 w-4 flex flex-col justify-around py-5 pointer-events-none">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full bg-[#E3D9C6] border border-[#CFC3AE]"
                      />
                    ))}
                  </div>
                  {/* Red margin line */}
                  <div className="absolute top-0 bottom-0 left-9 w-0.5 bg-red-300/80 pointer-events-none" />

                  <div className="pl-6">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500 font-bold block">
                          MIXTAPE TRACKLIST
                        </span>
                        <h4 className="font-heading font-bold text-sm text-stone-800 truncate">
                          {tapeTitle || "Late Night Drives"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100/70 text-amber-800 font-bold">
                        {draftTracks.length} / 4 TRACKS
                      </span>
                    </div>

                    {/* Tracklist Items */}
                    <div className="mt-3 space-y-2.5 text-xs">
                      {draftTracks.length > 0 ? (
                        draftTracks.map((tr, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1 border-b border-dashed border-stone-200"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="font-mono font-bold text-[var(--burgundy)]">
                                {i < 2 ? `A${i + 1}.` : `B${i - 1}.`}
                              </span>
                              <span className="font-medium text-stone-800 truncate">{tr.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400 shrink-0">
                              {tr.artist || "3:30"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-stone-200 text-stone-400 italic">
                            <span className="font-mono text-stone-400">A1.</span>
                            <span>(First Song - click below)</span>
                            <span className="font-mono text-[10px]">--:--</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-stone-200 text-stone-400 italic">
                            <span className="font-mono text-stone-400">A2.</span>
                            <span>(Second Song)</span>
                            <span className="font-mono text-[10px]">--:--</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-stone-200 text-stone-400 italic">
                            <span className="font-mono text-stone-400">B1.</span>
                            <span>(Third Song)</span>
                            <span className="font-mono text-[10px]">--:--</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-stone-200 text-stone-400 italic">
                            <span className="font-mono text-stone-400">B2.</span>
                            <span>(Fourth Song)</span>
                            <span className="font-mono text-[10px]">--:--</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick Button to Step 2 */}
                    <div className="mt-4 pt-2">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="w-full py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[var(--burgundy)]" />
                        <span>{draftTracks.length > 0 ? "Edit Tracklist" : "Add Songs to Tracklist"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hand-written Note Preview snippet */}
                <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[var(--border)] text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-mono text-[var(--text-soft)] uppercase block font-bold">
                      Attached Note
                    </span>
                    <p className="font-script text-base text-[var(--text)] truncate">
                      &quot;{noteContent}&quot;
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-semibold text-[var(--burgundy)] hover:underline shrink-0 cursor-pointer"
                  >
                    Edit Note
                  </button>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white font-medium text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>NEXT: ADD SONGS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: ADD YOUR SONGS ──────────────────────────────────────── */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Jewel Case Display showing tracks */}
            <div className="py-2">
              <CassetteJewelCase
                patternId={selectedPatternId}
                title={tapeTitle}
                recipientName={recipientName}
                songs={draftTracks}
              />
            </div>

            {/* YouTube Track Input Card */}
            <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[var(--border)] shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase text-[var(--text-soft)] tracking-wider">
                  Add From YouTube
                </span>
                <span className="text-xs font-mono font-medium text-[var(--text-soft)]">
                  {draftTracks.length} / 4 tracks
                </span>
              </div>

              {/* Paste URL */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    onBlur={handleFetchYoutubeMeta}
                    placeholder="Paste YouTube link (watch?v=...)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[var(--border)] text-sm font-sans text-[var(--text)] outline-none focus:border-[var(--burgundy)] transition-all"
                  />
                  {fetchingMeta && (
                    <div className="absolute right-3 top-2.5 text-[var(--burgundy)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleFetchYoutubeMeta}
                  disabled={!youtubeInput || fetchingMeta}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[var(--bg-secondary)] border border-[var(--border)] disabled:opacity-40 text-xs font-medium text-[var(--text)] transition-colors cursor-pointer"
                >
                  Fetch
                </button>
              </div>

              {/* Title & Artist fields (auto-filled or editable) */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Song Title"
                  className="px-3 py-2 rounded-xl bg-white border border-[var(--border)] text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--burgundy)]"
                />
                <input
                  type="text"
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                  placeholder="Artist"
                  className="px-3 py-2 rounded-xl bg-white border border-[var(--border)] text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--burgundy)]"
                />
              </div>

              {/* Add Song Button */}
              <button
                onClick={handleAddTrack}
                disabled={draftTracks.length >= 4 || (!manualTitle && !youtubeInput)}
                className="w-full py-2.5 rounded-xl bg-[var(--burgundy)] hover:bg-[#D13D68] disabled:opacity-40 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Track To J-Card</span>
              </button>

              {/* Track list pills with remove button */}
              {draftTracks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]/50">
                  {draftTracks.map((tr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs"
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <span className="font-mono text-[var(--burgundy)] font-bold">{idx + 1}.</span>
                        <span className="font-medium text-[var(--text)] truncate">{tr.title}</span>
                        {tr.artist && tr.artist.toLowerCase() !== "unknown artist" && (
                          <span className="text-[var(--text-soft)] truncate">({tr.artist})</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveTrack(idx)}
                        className="text-[var(--text-soft)] hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Remove track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back & Next Navigation */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 hover:bg-white text-[var(--text)] border border-[var(--border)] font-medium text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                disabled={draftTracks.length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] disabled:opacity-40 text-white font-medium text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>NEXT: ADD A NOTE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: ADD A LITTLE NOTE ───────────────────────────────────── */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Ruled Spiral Binder Index Card */}
            <div className="py-2">
              <NotebookNoteCard
                value={noteContent}
                onChange={setNoteContent}
                maxLength={280}
                placeholder="write a little note to your favorite person..."
                senderName={user?.user_metadata?.name || user?.email?.split("@")[0]}
              />
            </div>

            {/* Back & Next / Save Navigation */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 hover:bg-white text-[var(--text)] border border-[var(--border)] font-medium text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={handleSaveAndShare}
                disabled={savingMixtape}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] disabled:opacity-60 text-white font-medium text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {savingMixtape ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>SAVING MIXTAPE...</span>
                  </>
                ) : (
                  <>
                    <span>REVIEW & SHARE</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: SHARE & LISTEN TO YOUR MIXTAPE ───────────────────────── */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Jewel Case Display with Peeking Note */}
            <div className="relative pt-8">
              <CassetteJewelCase
                patternId={selectedPatternId}
                title={tapeTitle}
                recipientName={recipientName}
                songs={draftTracks}
                activeSongIndex={activeSongIndex}
                onSelectSong={(idx) => setActiveSongIndex(idx)}
                peekingNote={noteContent}
                onPeekingNoteClick={() => setShowFullNoteModal(true)}
              />
            </div>

            {/* Floating Retro-Modern Audio Player */}
            {playerTracks.length > 0 ? (
              <RetroAudioPlayer
                tracks={playerTracks}
                currentIndex={activeSongIndex}
                onTrackChange={(idx) => setActiveSongIndex(idx)}
                onPlaybackStateChange={(playing) => setIsPlaying(playing)}
              />
            ) : (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-white/90 border border-[var(--border)] text-center text-sm text-[var(--text-soft)]">
                No songs in this mixtape yet. Click &quot;Edit&quot; to add tracks!
              </div>
            )}

            {/* Action Buttons: Copy Share Link & Remix */}
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--burgundy)] hover:bg-[#D13D68] text-white font-medium text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {copyToast ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/90 hover:bg-white text-[var(--text)] font-medium text-sm shadow-xs border border-[var(--border)] transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[var(--text-soft)]" />
                <span>Edit Mixtape</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Full Handwritten Note Modal */}
        <AnimatePresence>
          {showFullNoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-lg w-full"
              >
                <button
                  onClick={() => setShowFullNoteModal(false)}
                  className="absolute -top-3 -right-3 z-30 p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-md transition-transform active:scale-90"
                  title="Close Note"
                >
                  <X className="w-4 h-4" />
                </button>
                <NotebookNoteCard
                  readOnly
                  value={noteContent}
                  senderName={recipientName ? `for ${recipientName}` : undefined}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function MixtapePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--burgundy)]" />
        </div>
      }
    >
      <MixtapeContent />
    </Suspense>
  );
}
