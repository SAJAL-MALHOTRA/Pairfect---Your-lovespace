"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import { Loader2, Search, Heart, Camera, Mail, Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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

type MemoryType = "moment" | "photo" | "letter";

interface UnifiedMemory {
  id: string;
  type: MemoryType;
  sortDate: number;
  data: any;
  searchString: string;
}

export default function MomentsPage() {
  const { user, pair, loading } = useAuth();
  const supabase = createClient();
  
  const [memories, setMemories] = useState<UnifiedMemory[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "photos" | "letters" | "moments">("all");

  useEffect(() => {
    if (!pair || loading) return;

    let cancelled = false;

    const fetchMemories = async () => {
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
              searchString: `letter`, // Letters are encrypted or complex, limited search
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
    };

    fetchMemories();
    return () => {
      cancelled = true;
    };
  }, [pair?.id, loading, supabase]);

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  if (!pair) {
    return (
      <UnpairedPrompt 
        title="Your Memory Vault" 
        description="Connect with your partner to build a shared vault of all your favorite memories, photos, and letters."
      />
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center">
      <Navigation />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:pl-36 md:pr-12 py-24 pb-36 space-y-12">
        
        {/* Header section */}
        <div className="text-center md:text-left space-y-4">
          <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
            ♡ Memory Vault
          </div>
          <h1 className="text-4xl md:text-5xl font-display italic font-bold text-[var(--text)]">
            Every little thing, preserved forever.
          </h1>
          <p className="text-sm md:text-base text-[var(--text-soft)] max-w-xl mx-auto md:mx-0 font-sans">
            Every letter you've written, photostrip you've taken, and moment you've shared.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between z-10 relative">
          <div className="flex gap-2 p-1 bg-[var(--paper-warm)] border border-[var(--border)] rounded-full shadow-sm overflow-x-auto w-full md:w-auto scrollbar-hide">
            {(["all", "photos", "letters", "moments"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "bg-[var(--rose)]/20 text-[var(--burgundy)] font-bold shadow-xs"
                    : "text-[var(--text-soft)] hover:bg-black/5"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-soft)]" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--paper-warm)] border border-[var(--border)] rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[var(--rose)] shadow-sm placeholder:text-[var(--text-soft)] text-[var(--text)]"
            />
          </div>
        </div>

        {fetching ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 text-[var(--burgundy)] animate-spin" />
          </div>
        ) : (
          <>
            {filteredMemories.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-4 bg-[var(--paper-warm)] border border-[var(--border)] rounded-[20px] shadow-sm paper-grain max-w-2xl mx-auto space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--rose)]/15 flex items-center justify-center mx-auto text-[var(--burgundy)]">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display italic font-bold text-[var(--text)]">
                  The vault is empty.
                </h3>
                <p className="text-sm text-[var(--text-soft)] font-sans max-w-md mx-auto">
                  Start filling your shared sanctuary with moments, letters, and photos. Every memory you create will live here.
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Link href="/love-letter" className="btn-journal py-2 px-6 shadow-sm">
                    <Mail className="w-4 h-4 mr-2" /> Write a Letter
                  </Link>
                  <Link href="/photo-booth" className="btn-journal-ghost py-2 px-6">
                    <Camera className="w-4 h-4 mr-2" /> Take a Photo
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
                          <PhotoStripCard data={memory.data} />
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
      </main>
    </div>
  );
}

// --- Cards ---

function PhotoStripCard({ data }: { data: any }) {
  const images = data.photo_strip_images || [];
  const firstImg = images.sort((a: any, b: any) => a.position - b.position)[0];
  
  return (
    <div 
      className="bg-white p-3 pb-6 rounded-sm shadow-xl border border-black/5 flex flex-col gap-3 relative transform hover:rotate-1 transition-transform"
      style={{
        backgroundColor: data.frame_color || "#ffffff",
      }}
    >
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-yellow-900/10 rotate-[-2deg] shadow-sm mix-blend-multiply" />
      
      {firstImg ? (
        <div className="w-full aspect-[3/4] relative bg-black/10 overflow-hidden shadow-inner">
          <Image src={firstImg.url} alt="Photo strip preview" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        </div>
      ) : (
        <div className="w-full aspect-[3/4] bg-black/5 flex items-center justify-center text-black/30">
          <Camera className="w-8 h-8" />
        </div>
      )}
      
      <div className="text-center px-2 mt-2">
        <p className="font-handwriting text-2xl text-black/80 leading-tight">
          {data.caption || "Us"}
        </p>
        <p className="text-[10px] font-mono text-black/40 mt-1 uppercase">
          {new Date(data.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-2 text-center">
        <Link href={`/photo-booth`} className="text-[10px] font-mono uppercase tracking-wider text-black/50 hover:text-black/80 font-bold transition-colors">
          View Strip ▷
        </Link>
      </div>
    </div>
  );
}

function LetterCard({ data }: { data: any }) {
  const waxColor = data.wax_color || "var(--burgundy)";
  const excerpt = getLetterExcerpt(data.content);

  return (
    <Link href="/love-letter" className="block outline-none group">
      <div className="bg-[var(--paper-mid)] rounded-2xl border border-[var(--border)] p-6 shadow-md paper-grain relative overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1">
        {/* Envelope flap lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" fill="none">
          <path d="M 0 0 L 150 80 L 300 0" stroke="var(--border)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="relative z-10 flex flex-col items-center text-center space-y-4 pt-4 pb-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md mb-2 transition-transform group-hover:scale-110"
            style={{ backgroundColor: waxColor }}
          >
            <div className="w-[30px] h-[30px] rounded-full border border-white/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white/80 fill-white/80" />
            </div>
          </div>
          
          <div>
            <h4 className="font-display italic font-bold text-lg text-[var(--text)]">
              Love Letter
            </h4>
            <p className="text-[10px] font-mono uppercase text-[var(--text-soft)] mt-1 tracking-wider">
              {new Date(data.created_at).toLocaleDateString()}
            </p>
          </div>

          <p className="text-sm font-handwriting text-[var(--text-soft)] text-xl leading-relaxed italic">
            "{excerpt}"
          </p>
        </div>
      </div>
    </Link>
  );
}

function MomentCard({ data }: { data: any }) {
  return (
    <div className="bg-[var(--paper-warm)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-xl material-cotton group">
      {data.photo_url && (
        <div className="w-full aspect-[4/3] relative overflow-hidden">
          <Image 
            src={data.photo_url} 
            alt={data.title || "Memory"} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized 
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="text-[10px] font-mono text-[var(--text-soft)] uppercase tracking-wider mb-2 flex items-center gap-2">
          <Heart className="w-3 h-3 text-[var(--rose)] fill-[var(--rose)]" />
          {new Date(data.moment_date || data.created_at).toLocaleDateString()}
        </div>
        
        <h3 className="font-display italic font-bold text-xl text-[var(--text)] mb-2">
          {data.title || "A special moment"}
        </h3>
        
        {data.description && (
          <p className="text-sm font-sans text-[var(--text-soft)] leading-relaxed">
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}
