"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import {
  Loader2,
  Search,
  Heart,
  Camera,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  Share2,
  Check,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import { EncryptedMemoryImage } from "@/components/ui/encrypted-memory-image";
import { CoupleBeansMascot } from "@/components/couple-mascot";

// Helper to extract plain text from letter content
function getLetterExcerpt(text: any, maxLen = 60): string {
  if (!text) return "";
  let raw = "";
  if (typeof text === "string") raw = text;
  else if (Array.isArray(text)) {
    const textObj = text.find((item: any) => item && item.type === "text" && item.value);
    if (textObj && textObj.value) raw = String(textObj.value);
    else raw = text.map((b: any) => (typeof b === "string" ? b : b?.value || "")).join(" ");
  } else if (typeof text === "object") {
    raw = text.content || text.text || "";
  }

  if (!raw || raw.startsWith("enc:")) {
    return "Encrypted letter ♡";
  }
  return raw.slice(0, maxLen) + (raw.length > maxLen ? "..." : "");
}

function formatMemoryDate(val: any, fallback = "Special Memory"): string {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : d.toLocaleDateString();
}

type MemoryType = "moment" | "photo" | "letter";

interface UnifiedMemory {
  id: string;
  type: MemoryType;
  sortDate: number;
  data: any;
  searchString: string;
}

export default function MomentsPage() {
  const { user, pair, partner, loading } = useAuth();
  const { isPlus } = useSubscription();
  const supabase = createClient();

  const [memories, setMemories] = useState<UnifiedMemory[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "photos" | "letters" | "moments">("all");
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const share = params.get("share") || params.get("pair") || (params.get("demo") === "true" ? "demo" : null);
      if (share) setShareId(share.trim());
    }
  }, []);

  const handleCopyShareLink = () => {
    const targetId = pair?.id || shareId || "demo";
    const shareUrl = `${window.location.origin}/moments?share=${targetId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchMemories = async () => {
      // 1. Authenticated couple vault
      if (pair?.id) {
        setFetching(true);
        try {
          const [momentsRes, stripsRes, lettersRes] = await Promise.all([
            supabase.from("shared_moments").select("*").eq("pair_id", pair.id),
            supabase.from("photo_strips").select("*, photo_strip_images(*)").eq("pair_id", pair.id),
            supabase.from("love_letters").select("*").eq("pair_id", pair.id)
          ]);

          if (cancelled) return;

          const unified: UnifiedMemory[] = [];

          if (momentsRes.data) {
            momentsRes.data.forEach((m: any) => {
              const date = new Date(m.created_at).getTime();
              unified.push({
                id: `m_${m.id}`,
                type: "moment",
                sortDate: date,
                data: m,
                searchString: `${m.title || ""} ${m.description || ""}`.toLowerCase(),
              });
            });
          }

          if (stripsRes.data) {
            stripsRes.data.forEach((s: any) => {
              const date = new Date(s.created_at).getTime();
              unified.push({
                id: `p_${s.id}`,
                type: "photo",
                sortDate: date,
                data: s,
                searchString: `${s.title || ""} ${s.caption || ""}`.toLowerCase(),
              });
            });
          }

          if (lettersRes.data) {
            lettersRes.data.forEach((l: any) => {
              const date = new Date(l.created_at).getTime();
              unified.push({
                id: `l_${l.id}`,
                type: "letter",
                sortDate: date,
                data: l,
                searchString: "letter",
              });
            });
          }

          unified.sort((a, b) => b.sortDate - a.sortDate);
          setMemories(unified);
        } catch (err) {
          console.error("Error fetching memories:", err);
        } finally {
          if (!cancelled) setFetching(false);
        }
        return;
      }

      // 2. Public shared / demo memory wall
      if (!pair && shareId) {
        setFetching(true);
        try {
          const res = await fetch(`/api/moments/public?pairId=${encodeURIComponent(shareId)}`);
          if (!res.ok) throw new Error("Failed to load shared moments");
          const data = await res.json();

          if (cancelled) return;

          const unified: UnifiedMemory[] = [];
          if (data.moments) {
            data.moments.forEach((m: any) => {
              const date = new Date(m.created_at || m.moment_date || Date.now()).getTime();
              unified.push({
                id: `m_${m.id}`,
                type: "moment",
                sortDate: date,
                data: m,
                searchString: `${m.title || ""} ${m.description || ""}`.toLowerCase(),
              });
            });
          }

          if (data.photoStrips) {
            data.photoStrips.forEach((s: any) => {
              const date = new Date(s.created_at || Date.now()).getTime();
              unified.push({
                id: `p_${s.id}`,
                type: "photo",
                sortDate: date,
                data: s,
                searchString: `${s.title || ""} ${s.caption || ""}`.toLowerCase(),
              });
            });
          }

          unified.sort((a, b) => b.sortDate - a.sortDate);
          setMemories(unified);
        } catch (err) {
          console.error("Error fetching public memories:", err);
        } finally {
          if (!cancelled) setFetching(false);
        }
        return;
      }

      if (!loading) {
        setFetching(false);
      }
    };

    fetchMemories();
    return () => {
      cancelled = true;
    };
  }, [pair?.id, shareId, loading, supabase]);

  const handleRemoveItem = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.data?.id !== id));
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      if (activeFilter === "photos" && m.type !== "photo") return false;
      if (activeFilter === "letters" && m.type !== "letter") return false;
      if (activeFilter === "moments" && m.type !== "moment") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!m.searchString.includes(q)) return false;
      }

      return true;
    });
  }, [memories, activeFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Navigation />
        <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
      </div>
    );
  }

  if (!pair && !shareId) {
    return (
      <div className="relative min-h-screen flex flex-col justify-center bg-[#FAF9F6] text-stone-900">
        <Navigation />
        <UnpairedPrompt
          title="Your Living Memory Vault"
          description="Connect with your partner to build a shared sanctuary of all your favorite memories, photo strips, and letters."
        />
        <div className="text-center pb-12">
          <Link
            href="/moments?demo=true"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-800 bg-white hover:bg-stone-50 text-xs font-mono font-bold text-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span>Explore Demo Memory Wall ✨</span>
          </Link>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col items-center">
      <Navigation />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:pl-36 md:pr-12 pt-20 sm:pt-24 pb-36 space-y-8">
        {/* Living Archive Sanctuary Hero Card */}
        <div className="w-full bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative">
          {/* Coral Washi Tape */}
          <div className="absolute -top-3.5 left-6 sm:left-8 -rotate-1 shadow-xs">
            <span className="bg-rose-500 text-white font-mono uppercase text-[10px] sm:text-[11px] font-black tracking-wider px-3 sm:px-3.5 py-1 rounded-sm border border-stone-800">
              OUR LIVING ARCHIVE · MEMORY VAULT
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
            <div className="space-y-3 text-center md:text-left max-w-2xl">
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-xs font-mono font-bold text-stone-500 uppercase tracking-wider flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                  <span>{memories.length} Keepsakes Preserved</span>
                </span>
                <span>·</span>
                <span className="text-emerald-700 font-bold">End-to-End Encrypted</span>
              </div>

              <h1 className="font-heading font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
                Every little thing, preserved forever.
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed max-w-xl">
                Every heartfelt letter you&apos;ve written, photostrip you&apos;ve captured, and memory you&apos;ve pinned. Beautifully archived in your private couple sanctuary.
              </p>

              {/* Quick Actions Bar inside Hero */}
              <div className="flex items-center gap-2.5 pt-1 justify-center md:justify-start flex-wrap">
                <Link
                  href="/love-letter"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Write Letter</span>
                </Link>

                <Link
                  href="/photo-booth"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Photo Booth</span>
                </Link>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-stone-600" />}
                  <span>{copiedShareLink ? "Link Copied!" : "Share Wall"}</span>
                </button>
              </div>
            </div>

            {/* Signature Standardized Couple Mascot */}
            <div className="flex-shrink-0">
              <CoupleBeansMascot className="w-28 h-20 sm:w-32 sm:h-24" />
            </div>
          </div>
        </div>

        {/* Public Shared / Guest Header Banner */}
        {shareId && !pair && (
          <div className="rounded-3xl border-2 border-stone-800 bg-white p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border-2 border-stone-800 text-rose-600 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">
                  Shared Couple Living Archive &amp; Keepsake Wall
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  You are viewing a public shared vault of date night certificates, appreciation notes, and playful courtroom verdicts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleCopyShareLink}
                className="px-4 py-2 rounded-xl bg-white border-2 border-stone-800 hover:bg-stone-50 text-stone-900 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-stone-600" />}
                <span>{copiedShareLink ? "Link Copied!" : "Copy Link"}</span>
              </button>
              <Link
                href="/onboarding"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold uppercase tracking-wider border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Start Yours ▷
              </Link>
            </div>
          </div>
        )}

        {/* Permanent Memory Wall Plus Banner */}
        {!isPlus && (
          <div className="rounded-3xl border-2 border-stone-800 bg-[#FFFDF9] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 border-2 border-stone-800 text-amber-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)]">
                <Sparkles className="w-5 h-5 text-amber-600 fill-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">
                  Free Plan: 30-Day Memory Wall Archive
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  With Pairfect Plus, your photos, photostrips, and love letters stay pinned to your Memory Wall forever with print-quality downloads.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaywallOpen(true)}
              className="py-2.5 px-5 text-xs font-mono font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 w-full sm:w-auto cursor-pointer transition-all"
            >
              <span>Keep Forever with Plus ▷</span>
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between z-10 relative">
          <div className="flex gap-2 p-1.5 bg-stone-100 border-2 border-stone-800 rounded-2xl shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] overflow-x-auto w-full md:w-auto scrollbar-none">
            {(["all", "photos", "letters", "moments"] as const).map((filter) => {
              const count = memories.filter((m) => {
                if (filter === "all") return true;
                if (filter === "photos") return m.type === "photo";
                if (filter === "letters") return m.type === "letter";
                if (filter === "moments") return m.type === "moment";
                return true;
              }).length;

              const isSelected = activeFilter === filter;

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] border-2 border-stone-800"
                      : "text-stone-700 hover:bg-white/60 border-2 border-transparent"
                  }`}
                >
                  <span>{filter}</span>
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded ${isSelected ? "bg-black/20 text-white" : "bg-stone-200 text-stone-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[2.5]" />
            <input
              type="text"
              placeholder="Search memories, letters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-stone-800 rounded-2xl text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-stone-400 text-stone-900 transition-all"
            />
          </div>
        </div>

        {fetching ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          </div>
        ) : (
          <>
            {filteredMemories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 px-6 bg-white border-2 border-dashed border-stone-800 rounded-3xl shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] max-w-xl mx-auto space-y-5"
              >
                <div className="flex justify-center mb-2">
                  <CoupleBeansMascot className="w-24 h-16 sm:w-28 sm:h-20" />
                </div>
                <h3 className="font-heading font-black text-2xl text-stone-900">
                  The memory vault is quiet.
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 font-sans max-w-md mx-auto">
                  Start filling your shared sanctuary with moments, love letters, and photostrips. Every memory you preserve will live here forever.
                </p>
                <div className="flex flex-wrap gap-3 justify-center pt-3">
                  <Link
                    href="/love-letter"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 stroke-[2.5]" />
                    <span>Write a Letter</span>
                  </Link>
                  <Link
                    href="/photo-booth"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-xs font-bold border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>Take a Photo</span>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
              >
                <AnimatePresence>
                  {filteredMemories.map((memory) => {
                    if (memory.type === "photo") {
                      return (
                        <motion.div key={memory.id} variants={itemVariants} layout className="break-inside-avoid">
                          <PhotoStripCard data={memory.data} onDelete={handleRemoveItem} />
                        </motion.div>
                      );
                    }
                    if (memory.type === "letter") {
                      return (
                        <motion.div key={memory.id} variants={itemVariants} layout className="break-inside-avoid">
                          <LetterCard data={memory.data} />
                        </motion.div>
                      );
                    }
                    if (memory.type === "moment") {
                      return (
                        <motion.div key={memory.id} variants={itemVariants} layout className="break-inside-avoid">
                          <MomentCard data={memory.data} />
                        </motion.div>
                      );
                    }
                    return null;
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}

        <PlusPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          featureTitle="Permanent Memory Wall"
          featureDescription="Keep all your photos, photo strips, and letters on your Memory Wall forever."
        />
      </main>
    </div>
  );
}

// Cards Components

function PhotoStripCard({ data, onDelete }: { data: any; onDelete?: (id: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  const images = data.photo_strip_images || [];
  const firstImg = images.sort((a: any, b: any) => a.position - b.position)[0];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("Delete this photo strip and its encrypted files permanently?");
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      // 1. Delete encrypted storage objects
      const storagePaths = images
        .map((img: any) => img.url)
        .filter((u: string) => u && !u.startsWith("data:") && !u.startsWith("http"));
      if (storagePaths.length > 0) {
        await supabase.storage.from("memories").remove(storagePaths);
      }
      // 2. Delete database records
      await supabase.from("photo_strips").delete().eq("id", data.id);
      onDelete?.(data.id);
    } catch (err) {
      console.error("Failed to delete photo strip:", err);
      alert("Failed to delete photo strip.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="bg-white p-4 pb-6 rounded-3xl border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] flex flex-col gap-3 relative transition-all group"
      style={{
        backgroundColor: data.frame_color || "#ffffff",
      }}
    >
      {/* Washi Tape Pin on Top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100/95 text-stone-800 border border-stone-800 text-[10px] font-mono font-bold px-3 py-0.5 rounded-sm -rotate-2 shadow-xs select-none">
        PHOTOBOOTH STRIP
      </div>

      {firstImg ? (
        <div className="w-full aspect-[3/4] relative bg-stone-100 rounded-2xl border-2 border-stone-800 overflow-hidden shadow-inner mt-1">
          <EncryptedMemoryImage
            src={firstImg.url}
            pairId={data.pair_id}
            stripId={data.id}
            position={firstImg.position ?? 0}
            alt="Photo strip preview"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full relative"
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/4] bg-stone-100 rounded-2xl border-2 border-stone-800 flex items-center justify-center text-stone-400 mt-1">
          <Camera className="w-10 h-10" />
        </div>
      )}

      <div className="text-center px-2 mt-1">
        <p className="font-heading font-black text-xl text-stone-900 leading-tight">
          {data.caption || "Us"}
        </p>
        <p className="text-xs font-mono font-bold text-stone-500 mt-1 uppercase">
          {formatMemoryDate(data.created_at)}
        </p>
      </div>

      <div className="mt-1 text-center flex items-center justify-between px-2 pt-2 border-t-2 border-stone-200">
        <Link
          href={`/photo-booth`}
          className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 hover:text-rose-600 transition-colors"
        >
          View Strip ▷
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-stone-400 hover:text-red-600 transition-colors p-1 cursor-pointer disabled:opacity-40"
          title="Delete photo strip and encrypted files"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>
      </div>
    </div>
  );
}

function LetterCard({ data }: { data: any }) {
  const waxColor = data.wax_color || "#E11D48";
  const excerpt = getLetterExcerpt(data.content);

  return (
    <Link href="/love-letter" className="block outline-none group">
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-stone-800 p-6 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] relative overflow-hidden transition-all">
        {/* Envelope flap lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" fill="none">
          <path d="M 0 0 L 150 80 L 300 0" stroke="#1C1917" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="relative z-10 flex flex-col items-center text-center space-y-3.5 pt-2 pb-1">
          {/* Wax Seal Stamp */}
          <div
            className="w-12 h-12 rounded-full border-2 border-stone-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(28,25,23,0.9)] transition-transform group-hover:scale-105"
            style={{ backgroundColor: waxColor }}
          >
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 border border-stone-800 text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider mb-1">
              LOVE LETTER
            </div>
            <h4 className="font-heading font-black text-lg text-stone-900">
              {data.title || "A Letter For You"}
            </h4>
            <p className="text-xs font-mono font-bold text-stone-500 mt-0.5">
              {formatMemoryDate(data.created_at, "Recent Love Letter")}
            </p>
          </div>

          <p className="font-serif italic text-stone-700 text-base leading-relaxed px-2">
            &ldquo;{excerpt}&rdquo;
          </p>

          <span className="text-xs font-mono font-bold text-rose-600 group-hover:underline pt-1">
            Read Letter ▷
          </span>
        </div>
      </div>
    </Link>
  );
}

function MomentCard({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-stone-800 overflow-hidden shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] transition-all group">
      {data.photo_url && (
        <div className="w-full aspect-[4/3] relative overflow-hidden border-b-2 border-stone-800">
          <EncryptedMemoryImage
            src={data.photo_url}
            pairId={data.pair_id}
            stripId={data.id}
            position={0}
            alt={data.title || "Memory"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            containerClassName="w-full h-full relative"
          />
        </div>
      )}

      <div className="p-6 space-y-2">
        <div className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>{formatMemoryDate(data.moment_date || data.created_at)}</span>
        </div>

        <h3 className="font-heading font-black text-xl text-stone-900">
          {data.title || "A special moment"}
        </h3>

        {data.description && (
          <p className="text-xs sm:text-sm font-sans text-stone-600 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}
