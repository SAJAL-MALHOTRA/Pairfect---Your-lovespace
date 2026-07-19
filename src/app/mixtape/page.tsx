"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Loader2, Plus, X, ArrowLeft, ChevronUp, ChevronDown,
  Trash2, Music, Heart, Moon, Sun, Guitar, Sparkles,
  Play, MapPin, Calendar as CalendarIcon, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Cover Theme Definitions ─────────────────────────────────────────────────
const COVER_THEMES: { key: string; icon: any; label: string }[] = [
  { key: "music", icon: Music, label: "Classic" },
  { key: "heart", icon: Heart, label: "Romantic" },
  { key: "moon", icon: Moon, label: "Late Night" },
  { key: "sun", icon: Sun, label: "Summer" },
  { key: "guitar", icon: Guitar, label: "Acoustic" },
  { key: "sparkles", icon: Sparkles, label: "Magic" },
];

function getCoverIcon(themeKey: string) {
  return COVER_THEMES.find((t) => t.key === themeKey)?.icon || Music;
}

// ── Pookie Emojis for song thumbnails (matches Moments) ─────────────────────
const POOKIE_EMOJIS = [
  "💖", "🥰", "💘", "💝", "💗", "💓", "💞", "💕",
  "💌", "🧸", "🌹", "✨", "👩‍❤️‍👨", "🌅", "🍰", "🍷",
  "🕯️", "💍", "🥐", "☕", "🎡", "🏖️", "🚗", "🌌",
  "🎀", "🐣", "🍓", "📸", "💐", "⭐",
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Mixtape {
  id: string;
  title: string;
  cover_theme: string;
  created_by: string | null;
  created_at: string;
  song_count?: number;
}

interface Song {
  id: string;
  mixtape_id: string;
  title: string;
  artist: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  apple_music_url: string | null;
  photo_emoji: string | null;
  date_memory: string | null;
  location_text: string | null;
  added_by: string | null;
  position: number;
  story: string | null;
  created_at: string;
}

interface DraftSong {
  title: string;
  artist: string;
  spotify_url: string;
  youtube_url: string;
  apple_music_url: string;
  story: string;
  photo_emoji: string;
  date_memory: string;
  location_text: string;
}

const EMPTY_DRAFT: DraftSong = {
  title: "", artist: "", spotify_url: "", youtube_url: "", apple_music_url: "",
  story: "", photo_emoji: "", date_memory: "", location_text: "",
};

// ── Spotify / Apple Music embed helpers ─────────────────────────────────────
function getSpotifyEmbedUrl(url: string): string | null {
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh → embed url
  const m = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return m ? `https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0` : null;
}

function getAppleMusicEmbedUrl(url: string): string | null {
  // https://music.apple.com/us/album/song/123?i=456 → embed url
  if (url.includes("music.apple.com")) {
    return url.replace("music.apple.com", "embed.music.apple.com");
  }
  return null;
}

// ── Cassette SVG Illustration ───────────────────────────────────────────────
function CassetteIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden>
      {/* Body */}
      <rect x="10" y="12" width="100" height="56" rx="8" stroke="var(--burgundy)" strokeWidth="2" fill="none" />
      {/* Window */}
      <rect x="30" y="22" width="60" height="24" rx="4" stroke="var(--rose)" strokeWidth="1.5" fill="none" />
      {/* Left reel */}
      <circle cx="48" cy="34" r="8" stroke="var(--burgundy)" strokeWidth="1.5" fill="none" />
      <circle cx="48" cy="34" r="3" fill="var(--rose)" opacity="0.4" />
      {/* Right reel */}
      <circle cx="72" cy="34" r="8" stroke="var(--burgundy)" strokeWidth="1.5" fill="none" />
      <circle cx="72" cy="34" r="3" fill="var(--rose)" opacity="0.4" />
      {/* Tape line */}
      <path d="M40 34 C44 42, 56 26, 60 34 C64 42, 76 26, 80 34" stroke="var(--rose)" strokeWidth="1" opacity="0.5" />
      {/* Label area */}
      <rect x="36" y="50" width="48" height="10" rx="2" stroke="var(--border)" strokeWidth="1" fill="none" />
      {/* Screws */}
      <circle cx="18" cy="20" r="2" stroke="var(--border)" strokeWidth="1" fill="none" />
      <circle cx="102" cy="20" r="2" stroke="var(--border)" strokeWidth="1" fill="none" />
      <circle cx="18" cy="60" r="2" stroke="var(--border)" strokeWidth="1" fill="none" />
      <circle cx="102" cy="60" r="2" stroke="var(--border)" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function MixtapePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // View state
  type View = "list" | "create" | "detail";
  const [view, setView] = useState<View>("list");
  const [createStep, setCreateStep] = useState(1);

  // Data
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([]);
  const [fetching, setFetching] = useState(true);

  // Create flow state
  const [newTitle, setNewTitle] = useState("");
  const [newCoverTheme, setNewCoverTheme] = useState("music");
  const [draftSongs, setDraftSongs] = useState<DraftSong[]>([]);
  const [currentDraft, setCurrentDraft] = useState<DraftSong>({ ...EMPTY_DRAFT });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detail view state
  const [selectedMixtape, setSelectedMixtape] = useState<Mixtape | null>(null);
  const [detailSongs, setDetailSongs] = useState<Song[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [embedType, setEmbedType] = useState<"spotify" | "apple">("spotify");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Adding song from detail view
  const [addingSongInDetail, setAddingSongInDetail] = useState(false);
  const [detailDraft, setDetailDraft] = useState<DraftSong>({ ...EMPTY_DRAFT });
  const [detailShowEmojiPicker, setDetailShowEmojiPicker] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);

  // Nav hide/show
  useEffect(() => {
    if (view === "create" || view === "detail") {
      window.dispatchEvent(new CustomEvent("navigation-hide"));
    } else {
      window.dispatchEvent(new CustomEvent("navigation-show"));
    }
  }, [view]);

  // ── Fetch mixtapes ──────────────────────────────────────────────────────
  const fetchMixtapes = useCallback(async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data: tapes } = await supabase
        .from("mixtapes")
        .select("id, title, cover_theme, created_by, created_at")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (tapes && tapes.length > 0) {
        // Get song counts per mixtape
        const withCounts = await Promise.all(
          tapes.map(async (t: any) => {
            const { count } = await supabase
              .from("mixtape_songs")
              .select("id", { count: "exact", head: true })
              .eq("mixtape_id", t.id);
            return { ...t, song_count: count || 0 };
          })
        );
        setMixtapes(withCounts);
      } else {
        setMixtapes([]);
      }
    } catch (e) {
      console.error("Failed to fetch mixtapes:", e);
    } finally {
      setFetching(false);
    }
  }, [pair, supabase]);

  useEffect(() => {
    if (pair && !loading) fetchMixtapes();
  }, [pair, loading, fetchMixtapes]);

  // ── Fetch detail songs ──────────────────────────────────────────────────
  const openDetail = useCallback(async (mixtape: Mixtape) => {
    setSelectedMixtape(mixtape);
    setView("detail");
    setDetailLoading(true);
    setEmbedUrl(null);
    try {
      const { data } = await supabase
        .from("mixtape_songs")
        .select("*")
        .eq("mixtape_id", mixtape.id)
        .order("position", { ascending: true });
      setDetailSongs(data || []);
    } catch (e) {
      console.error("Failed to fetch songs:", e);
    } finally {
      setDetailLoading(false);
    }
  }, [supabase]);

  // ── Create flow handlers ────────────────────────────────────────────────
  const addDraftSong = () => {
    if (!currentDraft.title.trim()) return;
    setDraftSongs((prev) => [...prev, { ...currentDraft }]);
    setCurrentDraft({ ...EMPTY_DRAFT });
    setShowEmojiPicker(false);
  };

  const removeDraftSong = (idx: number) => {
    setDraftSongs((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveDraftSong = (idx: number, dir: -1 | 1) => {
    setDraftSongs((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const saveMixtape = async () => {
    if (!pair || !user || !newTitle.trim() || draftSongs.length === 0) return;
    setSaving(true);
    try {
      const { data: tape, error: tapeErr } = await supabase
        .from("mixtapes")
        .insert({
          pair_id: pair.id,
          title: newTitle.trim(),
          cover_theme: newCoverTheme,
          created_by: user.id,
        })
        .select("id, title, cover_theme, created_by, created_at")
        .single();

      if (tapeErr || !tape) throw tapeErr;

      const songRows = draftSongs.map((s, i) => ({
        mixtape_id: tape.id,
        title: s.title.trim(),
        artist: s.artist.trim() || null,
        spotify_url: s.spotify_url.trim() || null,
        youtube_url: s.youtube_url.trim() || null,
        apple_music_url: s.apple_music_url.trim() || null,
        story: s.story.trim() || null,
        photo_emoji: s.photo_emoji || null,
        date_memory: s.date_memory || null,
        location_text: s.location_text.trim() || null,
        added_by: user.id,
        position: i,
      }));

      await supabase.from("mixtape_songs").insert(songRows);

      // Reset create state
      setNewTitle("");
      setNewCoverTheme("music");
      setDraftSongs([]);
      setCurrentDraft({ ...EMPTY_DRAFT });
      setCreateStep(1);

      // Open the new mixtape
      openDetail({ ...tape, song_count: draftSongs.length });
      fetchMixtapes();
    } catch (e) {
      console.error("Failed to save mixtape:", e);
    } finally {
      setSaving(false);
    }
  };

  // ── Add song from detail view ───────────────────────────────────────────
  const addSongFromDetail = async () => {
    if (!selectedMixtape || !user || !detailDraft.title.trim()) return;
    setDetailSaving(true);
    try {
      const newPos = detailSongs.length;
      await supabase.from("mixtape_songs").insert({
        mixtape_id: selectedMixtape.id,
        title: detailDraft.title.trim(),
        artist: detailDraft.artist.trim() || null,
        spotify_url: detailDraft.spotify_url.trim() || null,
        youtube_url: detailDraft.youtube_url.trim() || null,
        apple_music_url: detailDraft.apple_music_url.trim() || null,
        story: detailDraft.story.trim() || null,
        photo_emoji: detailDraft.photo_emoji || null,
        date_memory: detailDraft.date_memory || null,
        location_text: detailDraft.location_text.trim() || null,
        added_by: user.id,
        position: newPos,
      });
      setDetailDraft({ ...EMPTY_DRAFT });
      setAddingSongInDetail(false);
      setDetailShowEmojiPicker(false);
      // Re-fetch songs
      const { data } = await supabase
        .from("mixtape_songs")
        .select("*")
        .eq("mixtape_id", selectedMixtape.id)
        .order("position", { ascending: true });
      setDetailSongs(data || []);
      fetchMixtapes();
    } catch (e) {
      console.error("Failed to add song:", e);
    } finally {
      setDetailSaving(false);
    }
  };

  // ── Delete mixtape ──────────────────────────────────────────────────────
  const deleteMixtape = async () => {
    if (!selectedMixtape) return;
    setDeleting(true);
    try {
      await supabase.from("mixtape_songs").delete().eq("mixtape_id", selectedMixtape.id);
      await supabase.from("mixtapes").delete().eq("id", selectedMixtape.id);
      setShowDeleteConfirm(false);
      setSelectedMixtape(null);
      setView("list");
      fetchMixtapes();
    } catch (e) {
      console.error("Failed to delete mixtape:", e);
    } finally {
      setDeleting(false);
    }
  };

  // ── Embed player ────────────────────────────────────────────────────────
  const playSong = (song: Song) => {
    if (song.spotify_url) {
      const url = getSpotifyEmbedUrl(song.spotify_url);
      if (url) { setEmbedUrl(url); setEmbedType("spotify"); return; }
    }
    if (song.apple_music_url) {
      const url = getAppleMusicEmbedUrl(song.apple_music_url);
      if (url) { setEmbedUrl(url); setEmbedType("apple"); return; }
    }
    // Fallback: open YouTube
    if (song.youtube_url) {
      window.open(song.youtube_url, "_blank", "noopener");
    }
  };

  // ── Loading / Auth gate ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--burgundy)]" />
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Navigation />
        <div className="text-center max-w-xs space-y-3 px-6">
          <CassetteIllustration className="w-24 h-16 mx-auto opacity-60" />
          <p className="font-heading text-lg text-[var(--text)]">Link with your partner first</p>
          <p className="text-xs text-[var(--text-soft)] font-sans">Create a pair to start building mixtapes together</p>
        </div>
      </div>
    );
  }

  const partnerName = partner?.display_name || "Partner";

  // ── Song Form (reused in Create step 2 and Detail add-song) ─────────
  const renderSongForm = (
    draft: DraftSong,
    setDraft: (d: DraftSong) => void,
    emojiOpen: boolean,
    setEmojiOpen: (v: boolean) => void,
    onAdd: () => void,
    isSaving: boolean,
    label: string,
  ) => (
    <div className="space-y-3 p-4 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">{label}</p>

      {/* Title + Artist */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text" placeholder="Song title *"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
        <input
          type="text" placeholder="Artist"
          value={draft.artist}
          onChange={(e) => setDraft({ ...draft, artist: e.target.value })}
          className="px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
      </div>

      {/* Streaming URLs */}
      <div className="space-y-2">
        <input
          type="url" placeholder="Spotify URL (optional)"
          value={draft.spotify_url}
          onChange={(e) => setDraft({ ...draft, spotify_url: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
        <input
          type="url" placeholder="YouTube URL (optional)"
          value={draft.youtube_url}
          onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
        <input
          type="url" placeholder="Apple Music URL (optional)"
          value={draft.apple_music_url}
          onChange={(e) => setDraft({ ...draft, apple_music_url: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
      </div>

      {/* Story */}
      <textarea
        placeholder="Why does this song matter to you? (optional)"
        value={draft.story}
        onChange={(e) => setDraft({ ...draft, story: e.target.value })}
        maxLength={1000}
        rows={2}
        className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm font-quote italic text-[var(--text)] placeholder:text-[var(--ink-light)] placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30 resize-none"
      />

      {/* Photo Emoji + Date + Location row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Emoji picker trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOpen(!emojiOpen)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-center cursor-pointer hover:border-[var(--burgundy)]/40 transition-colors"
          >
            {draft.photo_emoji ? (
              <span className="text-lg">{draft.photo_emoji}</span>
            ) : (
              <span className="text-[10px] font-mono text-[var(--ink-light)]">🎵 Emoji</span>
            )}
          </button>
          <AnimatePresence>
            {emojiOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-0 mb-2 z-30 p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-lg grid grid-cols-6 gap-1.5 w-56"
              >
                {POOKIE_EMOJIS.map((e) => (
                  <button
                    key={e} type="button"
                    onClick={() => { setDraft({ ...draft, photo_emoji: e }); setEmojiOpen(false); }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-[var(--bg-secondary)] transition-colors ${draft.photo_emoji === e ? "bg-[var(--rose)]/20 ring-1 ring-[var(--burgundy)]/30" : ""}`}
                  >
                    {e}
                  </button>
                ))}
                {draft.photo_emoji && (
                  <button
                    type="button"
                    onClick={() => { setDraft({ ...draft, photo_emoji: "" }); setEmojiOpen(false); }}
                    className="col-span-6 text-[10px] font-mono text-[var(--burgundy)] py-1 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date */}
        <input
          type="date"
          value={draft.date_memory}
          onChange={(e) => setDraft({ ...draft, date_memory: e.target.value })}
          className="px-2 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
          title="When did this song matter?"
        />

        {/* Location */}
        <input
          type="text" placeholder="Where?"
          value={draft.location_text}
          onChange={(e) => setDraft({ ...draft, location_text: e.target.value })}
          maxLength={200}
          className="px-2 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
      </div>

      {/* Add button */}
      <button
        type="button"
        disabled={!draft.title.trim() || isSaving}
        onClick={onAdd}
        className="btn-primary w-full py-2.5 text-sm"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Song
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <Navigation />

      <AnimatePresence mode="wait">
        {/* ══════════════ LIST VIEW ══════════════ */}
        {view === "list" && (
          <motion.main
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto px-5 py-20 pb-36"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 mb-8"
            >
              <CassetteIllustration className="w-28 h-20 mx-auto" />
              <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Your Collection</p>
              <h1 className="font-heading font-bold text-3xl text-[var(--text)]">Mixtape Studio</h1>
              <p className="font-quote italic text-sm text-[var(--text-soft)]">Songs that tell your story</p>
            </motion.div>

            {/* Mixtape grid */}
            {fetching ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--burgundy)]" />
              </div>
            ) : mixtapes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-4 py-12"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                  <Music className="w-7 h-7 text-[var(--rose)]" />
                </div>
                <p className="font-sans text-sm text-[var(--text-soft)]">No mixtapes yet</p>
                <p className="font-quote italic text-xs text-[var(--ink-light)]">
                  Create your first mixtape with {partnerName}
                </p>
                <button
                  onClick={() => { setView("create"); setCreateStep(1); }}
                  className="btn-primary px-6 py-2.5 text-sm mx-auto"
                >
                  <Plus className="w-4 h-4" /> New Mixtape
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {mixtapes.map((tape, i) => {
                  const Icon = getCoverIcon(tape.cover_theme);
                  return (
                    <motion.button
                      key={tape.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => openDetail(tape)}
                      className="w-full p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-4 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[var(--burgundy)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-bold text-base text-[var(--text)] truncate">{tape.title}</p>
                        <p className="text-[10px] font-mono text-[var(--text-soft)] mt-0.5">
                          {tape.song_count || 0} song{(tape.song_count || 0) !== 1 ? "s" : ""} · {new Date(tape.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <Play className="w-4 h-4 text-[var(--rose)] flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* FAB */}
            {mixtapes.length > 0 && (
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
                onClick={() => { setView("create"); setCreateStep(1); }}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-lg z-30"
                aria-label="Create new mixtape"
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            )}
          </motion.main>
        )}

        {/* ══════════════ CREATE VIEW ══════════════ */}
        {view === "create" && (
          <motion.main
            key="create"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto px-5 py-20 pb-36"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  if (createStep === 2) setCreateStep(1);
                  else { setView("list"); setNewTitle(""); setNewCoverTheme("music"); setDraftSongs([]); setCreateStep(1); }
                }}
                className="flex items-center gap-1.5 text-sm font-sans text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {createStep === 2 ? "Back" : "Cancel"}
              </button>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--ink-light)]">
                Step {createStep} / 2
              </span>
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step 1: Details ── */}
              {createStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-heading font-bold text-2xl text-[var(--text)]">Create a Mixtape</h2>
                    <p className="font-quote italic text-sm text-[var(--text-soft)] mt-1">Give your collection a name and vibe</p>
                  </div>

                  {/* Title input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                      Mixtape Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Songs That Remind Me of You"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] text-base font-heading text-[var(--text)] placeholder:text-[var(--ink-light)] placeholder:font-sans placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
                    />
                  </div>

                  {/* Cover theme picker */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                      Cover Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {COVER_THEMES.map((theme) => {
                        const Icon = theme.icon;
                        const isSelected = newCoverTheme === theme.key;
                        return (
                          <button
                            key={theme.key}
                            type="button"
                            onClick={() => setNewCoverTheme(theme.key)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-card)] border transition-all ${
                              isSelected
                                ? "bg-[var(--paper-warm)] border-[var(--burgundy)]/40 shadow-md"
                                : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--rose)] hover:shadow-sm"
                            }`}
                          >
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                                isSelected ? "bg-[var(--burgundy)]/10" : "bg-[var(--bg-secondary)]"
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${isSelected ? "text-[var(--burgundy)]" : "text-[var(--text-soft)]"}`} />
                            </div>
                            <span className={`text-[10px] font-mono ${isSelected ? "text-[var(--burgundy)] font-bold" : "text-[var(--text-soft)]"}`}>
                              {theme.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next button */}
                  <button
                    type="button"
                    disabled={!newTitle.trim()}
                    onClick={() => setCreateStep(2)}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    Next — Add Songs
                  </button>
                </motion.div>
              )}

              {/* ── Step 2: Add Songs ── */}
              {createStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-heading font-bold text-2xl text-[var(--text)]">{newTitle}</h2>
                    <p className="font-quote italic text-sm text-[var(--text-soft)] mt-1">
                      Add songs that tell your story — at least one to save
                    </p>
                  </div>

                  {/* Existing draft songs */}
                  {draftSongs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                        Tracklist ({draftSongs.length})
                      </p>
                      {draftSongs.map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
                        >
                          {/* Emoji or number */}
                          <div className="w-8 h-8 rounded-lg bg-[var(--paper-warm)] flex items-center justify-center flex-shrink-0 text-sm">
                            {s.photo_emoji || (i + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-sm text-[var(--text)] font-semibold truncate">{s.title}</p>
                            {s.artist && <p className="text-[10px] text-[var(--text-soft)] font-mono truncate">{s.artist}</p>}
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button onClick={() => moveDraftSong(i, -1)} disabled={i === 0}
                              className="p-1 rounded hover:bg-[var(--paper-warm)] disabled:opacity-30 transition-colors">
                              <ChevronUp className="w-3.5 h-3.5 text-[var(--text-soft)]" />
                            </button>
                            <button onClick={() => moveDraftSong(i, 1)} disabled={i === draftSongs.length - 1}
                              className="p-1 rounded hover:bg-[var(--paper-warm)] disabled:opacity-30 transition-colors">
                              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-soft)]" />
                            </button>
                            <button onClick={() => removeDraftSong(i)}
                              className="p-1 rounded hover:bg-[var(--rose)]/10 transition-colors ml-1">
                              <Trash2 className="w-3.5 h-3.5 text-[var(--rose)]" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Song form */}
                  {renderSongForm(currentDraft, setCurrentDraft, showEmojiPicker, setShowEmojiPicker, addDraftSong, false, "Add a Song")}

                  {/* Save mixtape */}
                  <button
                    type="button"
                    disabled={draftSongs.length === 0 || saving}
                    onClick={saveMixtape}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : (
                      <>Save Mixtape · {draftSongs.length} song{draftSongs.length !== 1 ? "s" : ""}</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        )}

        {/* ══════════════ DETAIL VIEW ══════════════ */}
        {view === "detail" && selectedMixtape && (
          <motion.main
            key="detail"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto px-5 py-20 pb-36"
          >
            {/* Back button */}
            <button
              onClick={() => { setView("list"); setSelectedMixtape(null); setEmbedUrl(null); setAddingSongInDetail(false); }}
              className="flex items-center gap-1.5 text-sm font-sans text-[var(--text-soft)] hover:text-[var(--text)] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Mixtapes
            </button>

            {/* Header card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="relative p-6 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-sm mb-6"
            >
              <div className="flex items-start gap-4">
                {(() => { const Icon = getCoverIcon(selectedMixtape.cover_theme); return (
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-[var(--burgundy)]" />
                  </div>
                ); })()}
                <div className="min-w-0 flex-1">
                  <h1 className="font-heading font-bold text-2xl text-[var(--text)] leading-tight">{selectedMixtape.title}</h1>
                  <p className="text-[10px] font-mono text-[var(--text-soft)] mt-1.5">
                    {selectedMixtape.song_count || detailSongs.length} song{(selectedMixtape.song_count || detailSongs.length) !== 1 ? "s" : ""} · Created {new Date(selectedMixtape.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--rose)]/10 transition-colors"
                aria-label="Delete mixtape"
              >
                <Trash2 className="w-4 h-4 text-[var(--rose)]" />
              </button>
            </motion.div>

            {/* Embed player */}
            <AnimatePresence>
              {embedUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden rounded-[var(--radius-card)]"
                >
                  <div className="relative">
                    <button
                      onClick={() => setEmbedUrl(null)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height={embedType === "spotify" ? 152 : 175}
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-[var(--radius-card)]"
                      style={{ borderRadius: "var(--radius-card)" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Song list */}
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--burgundy)]" />
              </div>
            ) : detailSongs.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm text-[var(--text-soft)] font-sans">No songs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Tracklist</p>
                {detailSongs.map((song, i) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3 shadow-sm"
                  >
                    {/* Song header row */}
                    <div className="flex items-start gap-3">
                      {/* Track number / emoji */}
                      <div className="w-9 h-9 rounded-lg bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        {song.photo_emoji ? (
                          <span className="text-lg">{song.photo_emoji}</span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-[var(--burgundy)]">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-sm text-[var(--text)] truncate">{song.title}</p>
                        {song.artist && <p className="text-[10px] font-mono text-[var(--text-soft)] mt-0.5">{song.artist}</p>}
                      </div>
                      {/* Play button */}
                      {(song.spotify_url || song.apple_music_url || song.youtube_url) && (
                        <button
                          onClick={() => playSong(song)}
                          className="w-8 h-8 rounded-full bg-[var(--burgundy)]/10 flex items-center justify-center flex-shrink-0 hover:bg-[var(--burgundy)]/20 transition-colors"
                          title="Play"
                        >
                          <Play className="w-3.5 h-3.5 text-[var(--burgundy)] ml-0.5" />
                        </button>
                      )}
                    </div>

                    {/* Story */}
                    {song.story && (
                      <p className="font-quote italic text-xs text-[var(--text-soft)] leading-relaxed pl-12">
                        &ldquo;{song.story}&rdquo;
                      </p>
                    )}

                    {/* Date + Location */}
                    {(song.date_memory || song.location_text) && (
                      <div className="flex items-center gap-3 pl-12 text-[10px] font-mono text-[var(--ink-light)]">
                        {song.date_memory && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(song.date_memory).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                        {song.location_text && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {song.location_text}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Streaming links */}
                    <div className="flex items-center gap-2 pl-12">
                      {song.spotify_url && (
                        <a href={song.spotify_url} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--burgundy)] hover:border-[var(--burgundy)]/30 transition-colors flex items-center gap-1">
                          Spotify <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {song.youtube_url && (
                        <a href={song.youtube_url} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--burgundy)] hover:border-[var(--burgundy)]/30 transition-colors flex items-center gap-1">
                          YouTube <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {song.apple_music_url && (
                        <a href={song.apple_music_url} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--burgundy)] hover:border-[var(--burgundy)]/30 transition-colors flex items-center gap-1">
                          Apple Music <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add song from detail */}
            <div className="mt-6">
              {addingSongInDetail ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Add Another Song</p>
                    <button onClick={() => { setAddingSongInDetail(false); setDetailDraft({ ...EMPTY_DRAFT }); }}
                      className="text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {renderSongForm(detailDraft, setDetailDraft, detailShowEmojiPicker, setDetailShowEmojiPicker, addSongFromDetail, detailSaving, "New Song")}
                </motion.div>
              ) : (
                <button
                  onClick={() => setAddingSongInDetail(true)}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Song
                </button>
              )}
            </div>

            {/* Delete confirmation modal */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ y: 30, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 30, opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="bg-[var(--bg)] rounded-[var(--radius-card)] p-6 max-w-xs w-full border border-[var(--border)] shadow-xl space-y-4"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[var(--rose)]/10 flex items-center justify-center mx-auto">
                        <Trash2 className="w-5 h-5 text-[var(--rose)]" />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-[var(--text)]">Delete Mixtape?</h3>
                      <p className="text-xs text-[var(--text-soft)] font-sans">
                        This will permanently delete &ldquo;{selectedMixtape.title}&rdquo; and all its songs. This cannot be undone.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="btn-secondary flex-1 py-2.5 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={deleteMixtape}
                        disabled={deleting}
                        className="btn-primary flex-1 py-2.5 text-sm"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
