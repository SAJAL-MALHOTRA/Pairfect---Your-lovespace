"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import PhysicalCassetteTape, { CassettePattern, CassetteSticker } from "@/components/cassette-tape";
import {
  Loader2, Plus, X, ArrowLeft, ChevronUp, ChevronDown,
  Trash2, Music, Heart, Moon, Sun, Guitar, Sparkles,
  Play, MapPin, Calendar as CalendarIcon, ExternalLink,
  List, Clock, Disc, Smile, Check, Share2, CornerDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Handmade Cassette Shell Options ─────────────────────────────────────────
const CASSETTE_PATTERNS: { key: CassettePattern; label: string; icon: string }[] = [
  { key: "gingham",  label: "Rose Gingham", icon: "🌸" },
  { key: "clover",   label: "Wildflower",   icon: "🌿" },
  { key: "grid",     label: "Vintage Grid", icon: "🏷️" },
  { key: "midnight", label: "Midnight",     icon: "🌙" },
  { key: "velvet",   label: "Golden Velvet",icon: "📜" },
  { key: "classic",  label: "Classic Cream",icon: "☕" },
];

// ── Sticker Decals ──────────────────────────────────────────────────────────
const DECAL_OPTIONS: { key: CassetteSticker; label: string; icon: string }[] = [
  { key: "eucalyptus", label: "Eucalyptus", icon: "🌿" },
  { key: "daisy",      label: "Daisies",    icon: "🌼" },
  { key: "ribbon",     label: "Gingham Bow",icon: "🎀" },
  { key: "seal",       label: "Wax Seal",   icon: "📜" },
  { key: "heart",      label: "Love Heart", icon: "💖" },
];

// ── Pookie Emojis for song thumbnails ───────────────────────────────────────
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

// ── Embed Helpers ────────────────────────────────────────────────────────────
function getSpotifyEmbedUrl(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return m ? `https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0` : null;
}

function getAppleMusicEmbedUrl(url: string): string | null {
  if (url.includes("music.apple.com")) {
    return url.replace("music.apple.com", "embed.music.apple.com");
  }
  return null;
}

// ── Main Page Component ─────────────────────────────────────────────────────
export default function MixtapePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // Navigation View State
  type View = "list" | "create" | "detail";
  const [view, setView] = useState<View>("list");
  const [createStep, setCreateStep] = useState(1);
  const [detailMode, setDetailMode] = useState<"tracklist" | "timeline">("tracklist");

  // Data
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [fetching, setFetching] = useState(true);

  // Creation Wizard State
  const [newTitle, setNewTitle] = useState("");
  const [newPattern, setNewPattern] = useState<CassettePattern>("gingham");
  const [selectedStickers, setSelectedStickers] = useState<CassetteSticker[]>(["eucalyptus"]);
  const [notebookNote, setNotebookNote] = useState("Made with love, just for you ♡");
  const [draftSongs, setDraftSongs] = useState<DraftSong[]>([]);
  const [currentDraft, setCurrentDraft] = useState<DraftSong>({ ...EMPTY_DRAFT });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detail View State
  const [selectedMixtape, setSelectedMixtape] = useState<Mixtape | null>(null);
  const [detailSongs, setDetailSongs] = useState<Song[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [embedType, setEmbedType] = useState<"spotify" | "apple">("spotify");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reaction state
  const [reactions, setReactions] = useState<Record<string, number>>({});

  // Adding song in detail
  const [addingSongInDetail, setAddingSongInDetail] = useState(false);
  const [detailDraft, setDetailDraft] = useState<DraftSong>({ ...EMPTY_DRAFT });
  const [detailShowEmojiPicker, setDetailShowEmojiPicker] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);

  // Navigation Hide/Show listener
  useEffect(() => {
    if (view === "create" || view === "detail") {
      window.dispatchEvent(new CustomEvent("navigation-hide"));
    } else {
      window.dispatchEvent(new CustomEvent("navigation-show"));
    }
  }, [view]);

  // ── Fetch Mixtapes + All Songs for Statistics ─────────────────────────────
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
        const tapeIds = tapes.map((t: any) => t.id);
        const { data: songsData } = await supabase
          .from("mixtape_songs")
          .select("*")
          .in("mixtape_id", tapeIds)
          .order("created_at", { ascending: true });

        setAllSongs(songsData || []);

        const withCounts = tapes.map((t: any) => {
          const count = songsData?.filter((s: any) => s.mixtape_id === t.id).length || 0;
          return { ...t, song_count: count };
        });
        setMixtapes(withCounts);
      } else {
        setMixtapes([]);
        setAllSongs([]);
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

  // ── Emotional Statistics Calculation ──────────────────────────────────────
  const stats = useMemo(() => {
    if (allSongs.length === 0) return null;

    // Most added artist
    const artistCounts: Record<string, number> = {};
    allSongs.forEach(s => {
      if (s.artist) {
        const a = s.artist.trim();
        artistCounts[a] = (artistCounts[a] || 0) + 1;
      }
    });

    let topArtist = "—";
    let maxCount = 0;
    Object.entries(artistCounts).forEach(([art, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topArtist = art;
      }
    });

    // Oldest memory song
    const withDates = allSongs.filter(s => s.date_memory);
    let oldestDateStr = "—";
    if (withDates.length > 0) {
      withDates.sort((a, b) => new Date(a.date_memory!).getTime() - new Date(b.date_memory!).getTime());
      try {
        oldestDateStr = new Date(withDates[0].date_memory!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } catch { oldestDateStr = "—"; }
    }

    // Latest addition
    const sortedLatest = [...allSongs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let latestStr = "Recently";
    if (sortedLatest.length > 0 && sortedLatest[0].created_at) {
      latestStr = new Date(sortedLatest[0].created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    return {
      topArtist,
      oldestDateStr,
      latestStr,
      totalSongs: allSongs.length,
    };
  }, [allSongs]);

  // ── Fetch Detail Songs ────────────────────────────────────────────────────
  const openDetail = useCallback(async (mixtape: Mixtape) => {
    setSelectedMixtape(mixtape);
    setView("detail");
    setDetailLoading(true);
    setEmbedUrl(null);
    setIsPlaying(false);
    try {
      const { data } = await supabase
        .from("mixtape_songs")
        .select("*")
        .eq("mixtape_id", mixtape.id)
        .order("position", { ascending: true });
      setDetailSongs(data || []);
    } catch (e) {
      console.error("Failed to fetch detail songs:", e);
    } finally {
      setDetailLoading(false);
    }
  }, [supabase]);

  // ── Draft Helpers ─────────────────────────────────────────────────────────
  const toggleSticker = (key: CassetteSticker) => {
    setSelectedStickers(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const addDraftSong = () => {
    if (!currentDraft.title.trim()) return;
    setDraftSongs(prev => [...prev, { ...currentDraft }]);
    setCurrentDraft({ ...EMPTY_DRAFT });
    setShowEmojiPicker(false);
  };

  const removeDraftSong = (idx: number) => {
    setDraftSongs(prev => prev.filter((_, i) => i !== idx));
  };

  const moveDraftSong = (idx: number, dir: -1 | 1) => {
    setDraftSongs(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  // ── Save Mixtape ──────────────────────────────────────────────────────────
  const saveMixtape = async () => {
    if (!pair || !user || !newTitle.trim() || draftSongs.length === 0) return;
    setSaving(true);
    try {
      // Store pattern + stickers in cover_theme as JSON
      const themeConfig = JSON.stringify({ pattern: newPattern, stickers: selectedStickers, note: notebookNote });

      const { data: tape, error: tapeErr } = await supabase
        .from("mixtapes")
        .insert({
          pair_id: pair.id,
          title: newTitle.trim(),
          cover_theme: themeConfig,
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

      // Reset
      setNewTitle("");
      setNewPattern("gingham");
      setSelectedStickers(["eucalyptus"]);
      setNotebookNote("Made with love, just for you ♡");
      setDraftSongs([]);
      setCurrentDraft({ ...EMPTY_DRAFT });
      setCreateStep(1);

      openDetail({ ...tape, song_count: draftSongs.length });
      fetchMixtapes();
    } catch (e) {
      console.error("Failed to save mixtape:", e);
    } finally {
      setSaving(false);
    }
  };

  // ── Add Song from Detail View ──────────────────────────────────────────────
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

  // ── Delete Mixtape ────────────────────────────────────────────────────────
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

  // ── Play Song Player Helper ───────────────────────────────────────────────
  const playSong = (song: Song) => {
    if (song.spotify_url) {
      const url = getSpotifyEmbedUrl(song.spotify_url);
      if (url) {
        setEmbedUrl(url);
        setEmbedType("spotify");
        setIsPlaying(true);
        return;
      }
    }
    if (song.apple_music_url) {
      const url = getAppleMusicEmbedUrl(song.apple_music_url);
      if (url) {
        setEmbedUrl(url);
        setEmbedType("apple");
        setIsPlaying(true);
        return;
      }
    }
    if (song.youtube_url) {
      window.open(song.youtube_url, "_blank", "noopener");
    }
  };

  // ── Toggle Heart Reaction ─────────────────────────────────────────────────
  const handleReaction = (songId: string) => {
    setReactions(prev => ({ ...prev, [songId]: (prev[songId] || 0) + 1 }));
  };

  // ── Parse Cover Theme JSON helper ─────────────────────────────────────────
  const parseTheme = (coverThemeStr?: string): { pattern: CassettePattern; stickers: CassetteSticker[]; note: string } => {
    if (!coverThemeStr) return { pattern: "classic", stickers: [], note: "" };
    try {
      if (coverThemeStr.startsWith("{")) {
        return JSON.parse(coverThemeStr);
      }
    } catch {}
    const p = (CASSETTE_PATTERNS.find((t: any) => t.key === coverThemeStr)?.key || "classic") as CassettePattern;
    return { pattern: p, stickers: ["eucalyptus"], note: "Mixtape for you ♡" };
  };

  // ── Timeline grouping helper ──────────────────────────────────────────────
  const timelineGroups = useMemo(() => {
    const groups: Record<string, Song[]> = {};
    detailSongs.forEach(song => {
      let key = "Memories";
      if (song.date_memory) {
        try {
          key = new Date(song.date_memory).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } catch {}
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    });
    return groups;
  }, [detailSongs]);

  const partnerName = partner?.display_name || "Partner";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--burgundy)]" />
      </div>
    );
  }

  // ── Form Renderer (Reused in Create Step 3 & Detail view) ────────────────
  const renderSongForm = (
    draft: DraftSong,
    setDraft: (d: DraftSong) => void,
    emojiOpen: boolean,
    setEmojiOpen: (v: boolean) => void,
    onAdd: () => void,
    isSaving: boolean,
    label: string,
  ) => (
    <div className="space-y-3 p-4 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">{label}</p>

      {/* Title & Artist */}
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

      {/* Guided Memory Prompt Question */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-[var(--burgundy)] font-bold block">
          Why does this song matter?
        </label>
        <textarea
          placeholder="You played this after our first fight because you knew I'd smile."
          value={draft.story}
          onChange={(e) => setDraft({ ...draft, story: e.target.value })}
          maxLength={1000}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm font-quote italic text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30 resize-none"
        />
      </div>

      {/* Streaming URLs */}
      <div className="space-y-2">
        <input
          type="url" placeholder="Spotify Link (optional)"
          value={draft.spotify_url}
          onChange={(e) => setDraft({ ...draft, spotify_url: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="url" placeholder="YouTube Link (optional)"
            value={draft.youtube_url}
            onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })}
            className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
          />
          <input
            type="url" placeholder="Apple Music Link (optional)"
            value={draft.apple_music_url}
            onChange={(e) => setDraft({ ...draft, apple_music_url: e.target.value })}
            className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
          />
        </div>
      </div>

      {/* Photo Emoji + Date + Location */}
      <div className="grid grid-cols-3 gap-2">
        {/* Emoji picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOpen(!emojiOpen)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-center cursor-pointer hover:border-[var(--burgundy)]/40 transition-colors"
          >
            {draft.photo_emoji ? <span className="text-lg">{draft.photo_emoji}</span> : <span className="text-[10px] font-mono text-[var(--ink-light)]">📸 Emoji</span>}
          </button>
          <AnimatePresence>
            {emojiOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-0 mb-2 z-40 p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-lg grid grid-cols-6 gap-1.5 w-56"
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
          title="When did this happen?"
        />

        {/* Location */}
        <input
          type="text" placeholder="Where? (e.g. Shimla)"
          value={draft.location_text}
          onChange={(e) => setDraft({ ...draft, location_text: e.target.value })}
          maxLength={200}
          className="px-2 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
        />
      </div>

      <button
        type="button"
        disabled={!draft.title.trim() || isSaving}
        onClick={onAdd}
        className="btn-primary w-full py-2.5 text-sm"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Song Memory
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // RENDER MAIN APP
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <Navigation />

      <AnimatePresence mode="wait">

        {/* ══════════════ LIST VIEW (TODAY'S SOUNDTRACK HERO) ══════════════ */}
        {view === "list" && (
          <motion.main
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto px-5 py-20 pb-36"
          >
            {/* Header Title */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2 mb-6"
            >
              <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Pairfect Audio Scrapbook</p>
              <h1 className="font-heading font-bold text-3xl text-[var(--text)] flex items-center justify-center gap-2">
                Today&apos;s soundtrack <span className="text-[var(--burgundy)] font-normal">♡</span>
              </h1>
              <p className="font-quote italic text-sm text-[var(--text-soft)]">
                Songs & memories that belong to both of you
              </p>
            </motion.div>

            {/* Hero Featured Cassette Stack */}
            {mixtapes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-6 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-md flex flex-col items-center text-center space-y-4"
              >
                {(() => {
                  const featured = mixtapes[0];
                  const tConf = parseTheme(featured.cover_theme);
                  return (
                    <>
                      <PhysicalCassetteTape
                        pattern={tConf.pattern}
                        stickers={tConf.stickers}
                        noteText={tConf.note || "Today's featured memory ♡"}
                        tapeTitle={featured.title}
                        size="md"
                      />
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[var(--burgundy)]/10 text-[var(--burgundy)]">
                          Featured Tape
                        </span>
                        <h2 className="font-heading font-bold text-xl text-[var(--text)] pt-1">{featured.title}</h2>
                        <p className="font-quote italic text-xs text-[var(--text-soft)]">
                          {featured.song_count || 0} songs · Created by {featured.created_by === user?.id ? "You" : partnerName}
                        </p>
                      </div>
                      <button
                        onClick={() => openDetail(featured)}
                        className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Continue Mixtape →
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Emotional Statistics Bar */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-2 mb-8 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-center shadow-xs"
              >
                <div className="space-y-0.5 p-1">
                  <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Top Artist</p>
                  <p className="font-sans font-bold text-xs text-[var(--burgundy)] truncate">{stats.topArtist}</p>
                </div>
                <div className="space-y-0.5 p-1 border-x border-[var(--border)]">
                  <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Oldest Memory</p>
                  <p className="font-sans font-bold text-xs text-[var(--text)] truncate">{stats.oldestDateStr}</p>
                </div>
                <div className="space-y-0.5 p-1">
                  <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Latest Addition</p>
                  <p className="font-sans font-bold text-xs text-[var(--text)] truncate">{stats.latestStr}</p>
                </div>
              </motion.div>
            )}

            {/* Mixtape Collection List */}
            {fetching ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--burgundy)]" />
              </div>
            ) : mixtapes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-4"
              >
                <PhysicalCassetteTape pattern="gingham" stickers={["eucalyptus", "heart"]} noteText="Start your story..." tapeTitle="Mixtape #1" size="sm" />
                <p className="font-heading text-lg text-[var(--text)]">Your mixtape shelf is empty</p>
                <p className="font-quote italic text-xs text-[var(--text-soft)]">Build your first handmade tape with {partnerName}</p>
                <button
                  onClick={() => { setView("create"); setCreateStep(1); }}
                  className="btn-primary px-6 py-2.5 text-sm mx-auto"
                >
                  <Plus className="w-4 h-4" /> Create a Mixtape
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] px-1">All Mixtapes</p>
                {mixtapes.map((tape, i) => {
                  const tConf = parseTheme(tape.cover_theme);
                  return (
                    <motion.button
                      key={tape.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => openDetail(tape)}
                      className="w-full p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-4 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all cursor-pointer text-left"
                    >
                      <PhysicalCassetteTape pattern={tConf.pattern} stickers={tConf.stickers} tapeTitle={tape.title} size="sm" showCase={false} className="py-0" />
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

            {/* FAB button */}
            {mixtapes.length > 0 && (
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={() => { setView("create"); setCreateStep(1); }}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-lg z-30"
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            )}
          </motion.main>
        )}

        {/* ══════════════ 4-STEP PHYSICAL CREATION STEPPER ══════════════ */}
        {view === "create" && (
          <motion.main
            key="create"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto px-5 py-20 pb-36"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  if (createStep > 1) setCreateStep(createStep - 1);
                  else { setView("list"); setCreateStep(1); }
                }}
                className="flex items-center gap-1 text-sm font-sans text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {createStep > 1 ? "Back" : "Cancel"}
              </button>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--ink-light)]">
                Step {createStep} of 4
              </span>
            </div>

            {/* Live Cassette Preview */}
            <div className="mb-6 flex justify-center">
              <PhysicalCassetteTape
                pattern={newPattern}
                stickers={selectedStickers}
                noteText={notebookNote}
                tapeTitle={newTitle || "My Mixtape"}
                size="md"
              />
            </div>

            <AnimatePresence mode="wait">

              {/* ── STEP 1: CASSETTE SHELL PATTERN ── */}
              {createStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-2xl text-[var(--text)]">Pick Cassette Shell</h2>
                    <p className="font-quote italic text-xs text-[var(--text-soft)]">Select a warm handmade paper pattern</p>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block">Mixtape Title</label>
                    <input
                      type="text" placeholder="e.g. Late Night Drives"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] font-heading text-lg text-[var(--text)] placeholder:font-sans placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30"
                    />
                  </div>

                  {/* Pattern Picker Swatches */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {CASSETTE_PATTERNS.map((p) => {
                      const isSel = newPattern === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setNewPattern(p.key)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSel ? "bg-[var(--paper-warm)] border-[var(--burgundy)] ring-1 ring-[var(--burgundy)] shadow-xs" : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--rose)]"
                          }`}
                        >
                          <span className="text-xl block mb-1">{p.icon}</span>
                          <span className={`text-[10px] font-mono block ${isSel ? "font-bold text-[var(--burgundy)]" : "text-[var(--text-soft)]"}`}>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={!newTitle.trim()}
                    onClick={() => setCreateStep(2)}
                    className="btn-primary w-full py-3 text-sm mt-4"
                  >
                    Next — Add Stickers & Decals →
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: STICKERS & DECALS ── */}
              {createStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-2xl text-[var(--text)]">Add Keepsakes & Decals</h2>
                    <p className="font-quote italic text-xs text-[var(--text-soft)]">Tap stickers to place them on your acrylic cassette case</p>
                  </div>

                  <div className="grid grid-cols-5 gap-2 p-3 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)]">
                    {DECAL_OPTIONS.map((d) => {
                      const isSelected = selectedStickers.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleSticker(d.key)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected ? "bg-[var(--rose)]/20 border-[var(--burgundy)] scale-105" : "bg-[var(--bg)] border-[var(--border)] hover:scale-102"
                          }`}
                        >
                          <span className="text-2xl">{d.icon}</span>
                          <span className="text-[9px] font-mono text-[var(--text-soft)]">{d.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => setCreateStep(3)} className="btn-primary w-full py-3 text-sm">
                    Next — Add Songs & Memories →
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3: ADD SONGS & GUIDED MEMORY PROMPT ── */}
              {createStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-2xl text-[var(--text)]">Add Songs & Memories</h2>
                    <p className="font-quote italic text-xs text-[var(--text-soft)]">Answer why each song matters to you both</p>
                  </div>

                  {/* Draft Songs List */}
                  {draftSongs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Tracklist ({draftSongs.length})</p>
                      {draftSongs.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                          <span className="w-6 h-6 rounded-md bg-[var(--paper-warm)] flex items-center justify-center text-xs font-bold text-[var(--burgundy)]">{s.photo_emoji || (i + 1)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-sans font-bold text-xs text-[var(--text)] truncate">{s.title}</p>
                            {s.story && <p className="font-quote italic text-[10px] text-[var(--text-soft)] truncate">&ldquo;{s.story}&rdquo;</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveDraftSong(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => moveDraftSong(i, 1)} disabled={i === draftSongs.length - 1} className="p-1 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => removeDraftSong(i)} className="p-1 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Song Form */}
                  {renderSongForm(currentDraft, setCurrentDraft, showEmojiPicker, setShowEmojiPicker, addDraftSong, false, "Add Song to Tape")}

                  <button
                    disabled={draftSongs.length === 0}
                    onClick={() => setCreateStep(4)}
                    className="btn-primary w-full py-3 text-sm mt-4"
                  >
                    Next — Handwritten Note →
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4: HANDWRITTEN NOTEBOOK NOTE & FINISH ── */}
              {createStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-heading font-bold text-2xl text-[var(--text)]">Handwritten Note</h2>
                    <p className="font-quote italic text-xs text-[var(--text-soft)]">Write a short note on the notebook card for {partnerName}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block">Notebook Message</label>
                    <textarea
                      value={notebookNote}
                      onChange={(e) => setNotebookNote(e.target.value)}
                      maxLength={150}
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--paper-warm)] dark:bg-[var(--paper-warm)] border border-[var(--border)] dark:border-[var(--border)] font-handwriting text-base text-[var(--text)] dark:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30 resize-none shadow-xs"
                    />
                  </div>

                  <button
                    disabled={saving || draftSongs.length === 0}
                    onClick={saveMixtape}
                    className="btn-primary w-full py-3.5 text-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create Mixtape · ${draftSongs.length} song${draftSongs.length !== 1 ? "s" : ""}`}
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.main>
        )}

        {/* ══════════════ DETAIL / PLAYBACK VIEW (TRACKLIST vs TIMELINE) ══════════════ */}
        {view === "detail" && selectedMixtape && (
          <motion.main
            key="detail"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto px-5 py-20 pb-36"
          >
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { setView("list"); setSelectedMixtape(null); setEmbedUrl(null); setIsPlaying(false); }}
                className="flex items-center gap-1.5 text-sm font-sans text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Collection
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Physical Cassette Jewel Case Showcase */}
            {(() => {
              const tConf = parseTheme(selectedMixtape.cover_theme);
              return (
                <div className="flex justify-center mb-6">
                  <PhysicalCassetteTape
                    pattern={tConf.pattern}
                    stickers={tConf.stickers}
                    noteText={tConf.note}
                    tapeTitle={selectedMixtape.title}
                    isPlaying={isPlaying}
                    size="lg"
                  />
                </div>
              );
            })()}

            {/* Embed Player */}
            <AnimatePresence>
              {embedUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden rounded-[var(--radius-card)]"
                >
                  <div className="relative">
                    <button
                      onClick={() => { setEmbedUrl(null); setIsPlaying(false); }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
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
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode Switcher: Tracklist vs Relationship Memory Timeline */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setDetailMode("tracklist")}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all ${
                    detailMode === "tracklist" ? "bg-[var(--burgundy)] text-white font-bold shadow-xs" : "bg-[var(--bg-secondary)] text-[var(--text-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> Tracklist
                </button>
                <button
                  onClick={() => setDetailMode("timeline")}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all ${
                    detailMode === "timeline" ? "bg-[var(--burgundy)] text-white font-bold shadow-xs" : "bg-[var(--bg-secondary)] text-[var(--text-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Memory Timeline
                </button>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-soft)]">{detailSongs.length} songs</span>
            </div>

            {/* ── TRACKLIST MODE ── */}
            {detailMode === "tracklist" && (
              <div className="space-y-3">
                {detailSongs.map((song, i) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-sm">
                        {song.photo_emoji || (i + 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-sm text-[var(--text)] truncate">{song.title}</p>
                        {song.artist && <p className="text-[10px] font-mono text-[var(--text-soft)] mt-0.5">{song.artist}</p>}
                      </div>
                      {(song.spotify_url || song.apple_music_url || song.youtube_url) && (
                        <button
                          onClick={() => playSong(song)}
                          className="w-8 h-8 rounded-full bg-[var(--burgundy)]/10 text-[var(--burgundy)] flex items-center justify-center hover:bg-[var(--burgundy)]/20 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </button>
                      )}
                    </div>

                    {/* Guided Prompt Answer */}
                    {song.story && (
                      <div className="p-3 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)]">
                        <p className="text-[9px] font-mono text-[var(--burgundy)] uppercase tracking-wider font-bold mb-1">Why this song matters</p>
                        <p className="font-quote italic text-xs text-[var(--text)] leading-relaxed">
                          &ldquo;{song.story}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Metadata line */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-light)] pt-1">
                      <div className="flex items-center gap-3">
                        {song.date_memory && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 text-[var(--rose)]" />
                            {new Date(song.date_memory).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {song.location_text && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--rose)]" />
                            {song.location_text}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleReaction(song.id)}
                        className="flex items-center gap-1 text-[var(--rose)] hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{reactions[song.id] || 0}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── RELATIONSHIP MEMORY TIMELINE MODE ── */}
            {detailMode === "timeline" && (
              <div className="relative pl-6 space-y-8 border-l-2 border-[var(--rose)]/30 ml-2">
                {Object.entries(timelineGroups).map(([monthYear, groupSongs]) => (
                  <div key={monthYear} className="relative space-y-4">
                    {/* Timeline Node Badge */}
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[var(--burgundy)] border-2 border-[var(--bg)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-[var(--burgundy)] flex items-center gap-2">
                      {monthYear} <span className="text-[var(--rose)] text-xs font-normal">♡</span>
                    </h3>

                    {/* Songs in month */}
                    <div className="space-y-3">
                      {groupSongs.map((song) => (
                        <motion.div
                          key={song.id}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain space-y-2 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-sans font-bold text-sm text-[var(--text)]">{song.title}</p>
                              {song.artist && <p className="text-[10px] font-mono text-[var(--text-soft)]">{song.artist}</p>}
                            </div>
                            {song.photo_emoji && <span className="text-xl">{song.photo_emoji}</span>}
                          </div>

                          {song.story && (
                            <p className="font-quote italic text-xs text-[var(--text-soft)] leading-relaxed pt-1">
                              &ldquo;{song.story}&rdquo;
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-light)] pt-2 border-t border-[var(--border)]">
                            <span className="flex items-center gap-1">
                              {song.location_text ? <><MapPin className="w-3 h-3 text-[var(--burgundy)]" /> {song.location_text}</> : "Memory"}
                            </span>
                            {(song.spotify_url || song.apple_music_url || song.youtube_url) && (
                              <button onClick={() => playSong(song)} className="text-[var(--burgundy)] font-bold flex items-center gap-1 hover:underline">
                                <Play className="w-3 h-3 fill-current" /> Play
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add song in detail */}
            <div className="mt-8">
              {addingSongInDetail ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">Add Song to Tape</p>
                    <button onClick={() => setAddingSongInDetail(false)} className="text-[var(--text-soft)] hover:text-[var(--text)]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {renderSongForm(detailDraft, setDetailDraft, detailShowEmojiPicker, setDetailShowEmojiPicker, addSongFromDetail, detailSaving, "New Song Memory")}
                </motion.div>
              ) : (
                <button
                  onClick={() => setAddingSongInDetail(true)}
                  className="btn-secondary w-full py-3 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Song Memory
                </button>
              )}
            </div>

            {/* Delete Modal */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg)] p-6 rounded-[var(--radius-card)] border border-[var(--border)] max-w-xs w-full text-center space-y-4 shadow-xl">
                    <h3 className="font-heading font-bold text-lg text-[var(--text)]">Delete Mixtape?</h3>
                    <p className="text-xs text-[var(--text-soft)] font-sans">This will permanently delete &ldquo;{selectedMixtape.title}&rdquo; and all memory tracks.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                      <button onClick={deleteMixtape} disabled={deleting} className="btn-primary flex-1 py-2 text-xs">{deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}</button>
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
