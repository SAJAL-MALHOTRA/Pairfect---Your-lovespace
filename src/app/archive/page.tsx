"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import Link from "next/link";
import {
  Archive,
  Mail,
  Image as ImageIcon,
  Gift,
  Music,
  ArrowLeft,
  Loader2,
  Calendar,
  Lock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArchivePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [unlinkedPairs, setUnlinkedPairs] = useState<any[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"letters" | "memories" | "mixtapes" | "gratitude">("letters");
  const [loading, setLoading] = useState(true);

  const [letters, setLetters] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [mixtapes, setMixtapes] = useState<any[]>([]);
  const [gratitudeNotes, setGratitudeNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchUnlinkedPairs();
  }, [user]);

  const fetchUnlinkedPairs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all pairs (unlinked, archived, or active) user belonged to
      const { data, error } = await supabase
        .from("pairs")
        .select("*")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUnlinkedPairs(data);
        if (data.length > 0) {
          setSelectedPairId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load archive pairs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPairId) return;
    fetchArchiveData(selectedPairId);
  }, [selectedPairId]);

  const fetchArchiveData = async (pairId: string) => {
    try {
      const [lettersRes, memoriesRes, mixtapesRes, gratitudeRes] = await Promise.all([
        supabase.from("love_letters").select("*").eq("pair_id", pairId).order("created_at", { ascending: false }),
        supabase.from("shared_moments").select("*").eq("pair_id", pairId).order("moment_date", { ascending: false }),
        supabase.from("mixtapes").select("*").eq("relationship_id", pairId).order("created_at", { ascending: false }),
        supabase.from("gratitude_entries").select("*").eq("pair_id", pairId).order("created_at", { ascending: false }),
      ]);

      setLetters(lettersRes.data || []);
      setMoments(memoriesRes.data || []);
      setMixtapes(mixtapesRes.data || []);
      setGratitudeNotes(gratitudeRes.data || []);
    } catch (e) {
      console.error("Failed to fetch archive content:", e);
    }
  };

  const setMoments = (data: any[]) => setMemories(data);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-16 pb-36 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
          <div className="space-y-1">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-xs font-mono text-[var(--text-soft)] hover:text-[var(--burgundy)] transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
            </Link>
            <h1 className="font-heading font-semibold text-3xl text-[var(--text)] flex items-center gap-2.5">
              <Archive className="w-7 h-7 text-[var(--burgundy)]" /> Relationship Archive
            </h1>
            <p className="font-sans text-xs text-[var(--text-soft)]">
              Read-only vault of your past relationship letters, memories, mixtapes, and notes.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-xs font-mono text-[var(--text-soft)]">
            <Lock className="w-3.5 h-3.5 text-[var(--burgundy)]" /> Safe & Preserved
          </div>
        </div>

        {/* Pair selector dropdown if user has multiple relationships */}
        {unlinkedPairs.length > 1 && (
          <div className="flex items-center gap-3 bg-[var(--paper-warm)] p-3 rounded-2xl border border-[var(--border)]">
            <span className="text-xs font-mono text-[var(--text-soft)]">Select Relationship:</span>
            <select
              value={selectedPairId || ""}
              onChange={(e) => setSelectedPairId(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--border)] text-xs font-sans rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {unlinkedPairs.map((p, idx) => (
                <option key={p.id} value={p.id}>
                  Relationship #{unlinkedPairs.length - idx} ({p.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("letters")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold flex items-center gap-2 transition-all ${
              activeTab === "letters"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "text-[var(--text-soft)] hover:bg-[var(--paper-warm)]"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Letters ({letters.length})
          </button>

          <button
            onClick={() => setActiveTab("memories")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold flex items-center gap-2 transition-all ${
              activeTab === "memories"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "text-[var(--text-soft)] hover:bg-[var(--paper-warm)]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Memories ({memories.length})
          </button>

          <button
            onClick={() => setActiveTab("mixtapes")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold flex items-center gap-2 transition-all ${
              activeTab === "mixtapes"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "text-[var(--text-soft)] hover:bg-[var(--paper-warm)]"
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Mixtapes ({mixtapes.length})
          </button>

          <button
            onClick={() => setActiveTab("gratitude")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold flex items-center gap-2 transition-all ${
              activeTab === "gratitude"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "text-[var(--text-soft)] hover:bg-[var(--paper-warm)]"
            }`}
          >
            <Gift className="w-3.5 h-3.5" /> Gratitude ({gratitudeNotes.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Letters Tab */}
          {activeTab === "letters" && (
            <div>
              {letters.length === 0 ? (
                <div className="p-12 text-center text-xs font-sans text-[var(--text-soft)] italic bg-[var(--paper-warm)] rounded-3xl border border-[var(--border)]">
                  No preserved letters in this archive.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {letters.map((l) => (
                    <div
                      key={l.id}
                      className="p-5 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-[var(--text-soft)]">
                        <span>To: {l.recipient_name}</span>
                        <span>From: {l.sender_name}</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] font-handwriting text-sm text-[var(--text)] leading-relaxed">
                        {Array.isArray(l.content)
                          ? l.content.map((b: any, i: number) => b.value || "").join(" ")
                          : typeof l.content === "string"
                          ? l.content
                          : "Handwritten letter"}
                      </div>

                      <p className="text-[10px] font-mono text-[var(--ink-light)] text-right">
                        {new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Memories Tab */}
          {activeTab === "memories" && (
            <div>
              {memories.length === 0 ? (
                <div className="p-12 text-center text-xs font-sans text-[var(--text-soft)] italic bg-[var(--paper-warm)] rounded-3xl border border-[var(--border)]">
                  No preserved memories in this archive.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {memories.map((m) => (
                    <div key={m.id} className="polaroid rounded-2xl space-y-2">
                      <div className="aspect-square rounded-xl overflow-hidden bg-[var(--paper-mid)] flex items-center justify-center">
                        {m.photo_url?.startsWith("http") || m.photo_url?.startsWith("/") ? (
                          <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">{m.photo_url?.replace("emoji:", "") || "💖"}</span>
                        )}
                      </div>
                      <p className="font-handwriting text-xs text-[var(--text)] truncate text-center">{m.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mixtapes Tab */}
          {activeTab === "mixtapes" && (
            <div>
              {mixtapes.length === 0 ? (
                <div className="p-12 text-center text-xs font-sans text-[var(--text-soft)] italic bg-[var(--paper-warm)] rounded-3xl border border-[var(--border)]">
                  No preserved mixtapes in this archive.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mixtapes.map((mix) => (
                    <div key={mix.id} className="p-5 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] paper-grain space-y-2">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-[var(--burgundy)]" />
                        <h3 className="font-heading font-bold text-sm text-[var(--text)]">{mix.title}</h3>
                      </div>
                      {mix.dedication && <p className="font-handwriting text-xs text-[var(--text-soft)]">"{mix.dedication}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gratitude Notes Tab */}
          {activeTab === "gratitude" && (
            <div>
              {gratitudeNotes.length === 0 ? (
                <div className="p-12 text-center text-xs font-sans text-[var(--text-soft)] italic bg-[var(--paper-warm)] rounded-3xl border border-[var(--border)]">
                  No preserved gratitude notes in this archive.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gratitudeNotes.map((g) => (
                    <div key={g.id} className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-1 paper-grain">
                      <p className="font-handwriting text-sm text-[var(--text)]">"{g.content}"</p>
                      <p className="text-[10px] font-mono text-[var(--ink-light)] text-right">
                        {new Date(g.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
