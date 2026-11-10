"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Smile,
  Search,
  X,
  Mail,
  Gift,
  Lock,
  Download,
  Share2,
  Check,
  Flower2,
  Sparkles,
  Heart,
  Send,
  Calendar,
  Sparkle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import { exportLetterToPNG } from "@/lib/love-letter/export-letter";
import { decryptText, encryptText, getPairKey } from "@/lib/crypto/e2ee";
import { CoupleBeansMascot } from "@/components/couple-mascot";

// Giphy block renderer
function GiphyRenderer({ giphyId }: { giphyId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/giphy/resolve?id=${encodeURIComponent(giphyId)}`)
      .then((r) => r.json())
      .then((d) => setUrl(d.url || null))
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [giphyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
      </div>
    );
  }
  if (!url) {
    return (
      <p className="text-[10px] text-stone-400 font-mono text-center py-3">
        Sticker unavailable
      </p>
    );
  }
  return (
    <img
      src={url}
      alt="Sticker"
      className="rounded-xl max-h-44 object-contain w-full"
    />
  );
}

// Typewriter Audio Engine
let audioCtxSingleton: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtxSingleton) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxSingleton = new AudioContextClass();
    }
  }
  if (audioCtxSingleton && audioCtxSingleton.state === "suspended") {
    audioCtxSingleton.resume().catch(() => {});
  }
  return audioCtxSingleton;
};

const playTypewriterClick = (char?: string) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1600 + Math.random() * 500;
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = "triangle";
    thud.frequency.setValueAtTime(130 + Math.random() * 30, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.035);

    thudGain.gain.setValueAtTime(0.18, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    thud.start(now);
    thud.stop(now + 0.04);

    if (char && (char === "." || char === "!" || char === "?" || char === "\n")) {
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = "sine";
      bell.frequency.setValueAtTime(1250, now + 0.01);
      bellGain.gain.setValueAtTime(0.1, now + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      bell.connect(bellGain);
      bellGain.connect(ctx.destination);
      bell.start(now + 0.01);
      bell.stop(now + 0.23);
    }
  } catch (e) {
    // Silent catch if audio blocked
  }
};

function TypewriterText({
  text,
  speed = 30,
  sound = true,
}: {
  text: string;
  speed?: number;
  sound?: boolean;
}) {
  const [shown, setShown] = useState("");
  const i = useRef(0);

  useEffect(() => {
    setShown("");
    i.current = 0;
  }, [text]);

  useEffect(() => {
    let t: any;
    const type = () => {
      if (i.current < text.length) {
        const ch = text[i.current];
        setShown((p) => p + ch);
        i.current++;
        if (sound && ch.trim()) playTypewriterClick(ch);
        t = setTimeout(type, speed + Math.random() * 12);
      }
    };
    t = setTimeout(type, speed);
    return () => clearTimeout(t);
  }, [text, speed, sound]);

  return <>{shown}</>;
}

// Envelope pocket fold diagrams
function EnvelopePocketFolds({ dark = false }: { dark?: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.15)" : "#1C1917";
  const fillSide = dark ? "#1E293B" : "#FFF8F0";
  const fillBottom = dark ? "#0F172A" : "#FEEEDD";
  return (
    <svg
      viewBox="0 0 400 260"
      className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xs"
      preserveAspectRatio="none"
      fill="none"
    >
      <path d="M0,0 L180,140 L0,260 Z" fill={fillSide} stroke={stroke} strokeWidth="1.8" />
      <path d="M400,0 L220,140 L400,260 Z" fill={fillSide} stroke={stroke} strokeWidth="1.8" />
      <path d="M0,260 L200,125 L400,260 Z" fill={fillBottom} stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function EnvelopeTopFlap({ dark = false }: { dark?: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.2)" : "#1C1917";
  const fill = dark ? "#334155" : "#FFF4E8";
  return (
    <svg
      viewBox="0 0 400 130"
      className="w-full h-full drop-shadow-md"
      preserveAspectRatio="none"
      fill="none"
    >
      <path d="M 0 0 L 200 120 L 400 0 Z" fill={fill} stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

// Interactive Wax Seal Button
function WaxSealButton({
  onPress,
  shattering,
}: {
  onPress: () => void;
  shattering: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {shattering ? (
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 rounded-full bg-rose-600 border-2 border-stone-800 flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </motion.div>
      ) : (
        <motion.button
          type="button"
          onClick={onPress}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="w-20 h-20 rounded-full bg-rose-600 border-2 border-stone-800 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] cursor-pointer group transition-all"
        >
          <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center">
            <Heart className="w-7 h-7 text-white fill-white/30 group-hover:scale-110 transition-transform" />
          </div>
        </motion.button>
      )}
    </div>
  );
}

// Envelope Styles
const STYLES: Record<
  string,
  { name: string; bg: string; foldDark: boolean; badgeColor: string }
> = {
  classic: {
    name: "Warm Parchment",
    bg: "linear-gradient(160deg,#FFFDF7,#F8EED8)",
    foldDark: false,
    badgeColor: "bg-rose-500",
  },
  velvet: {
    name: "Velvet Rose",
    bg: "linear-gradient(160deg,#FFF1F2,#FFE4E6)",
    foldDark: false,
    badgeColor: "bg-pink-500",
  },
  midnight: {
    name: "Midnight Sky",
    bg: "linear-gradient(160deg,#1E293B,#0F172A)",
    foldDark: true,
    badgeColor: "bg-indigo-600",
  },
  kraft: {
    name: "Botanical Kraft",
    bg: "linear-gradient(160deg,#FEF3C7,#FDE68A)",
    foldDark: false,
    badgeColor: "bg-amber-600",
  },
};

// Heartfelt Occasion Starters
const OCCASIONS = [
  {
    label: "Anniversary",
    icon: "💖",
    prompt:
      "Happy Anniversary, my love. Every moment by your side feels like home. Looking back on where we began and where we are now, I fall more in love with you with each passing day.",
  },
  {
    label: "Birthday",
    icon: "🎂",
    prompt:
      "Happy Birthday to my favorite human in the entire universe! You bring so much light and joy into my days. May this year give you every ounce of happiness you give to others.",
  },
  {
    label: "Missing You",
    icon: "🌙",
    prompt:
      "I was looking up at the night sky and thinking of your smile. Distance might keep us apart for now, but my heart is right where you are. Counting down the moments until I hold you again.",
  },
  {
    label: "Gratitude",
    icon: "✨",
    prompt:
      "I just wanted to take a moment to say thank you for being you. Thank you for your warmth, your patience, and the gentle way you support me even on the hardest days.",
  },
  {
    label: "Just Because",
    icon: "💌",
    prompt:
      "No special occasion or reason, just a random reminder that I love you endlessly. You crossed my mind today and I could not stop smiling.",
  },
  {
    label: "Gentle Apology",
    icon: "🕊️",
    prompt:
      "I am truly sorry. You mean the entire world to me, and our bond is the most precious thing in my life. I want to listen and make this right.",
  },
];

export default function LoveLetterPage() {
  const { user, pair, partner, loading } = useAuth();
  const { isPlus } = useSubscription();
  const supabase = createClient();

  const [lettersList, setLettersList] = useState<any[]>([]);
  const [activeLetter, setActiveLetter] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Compose state
  const [isWriting, setIsWriting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [blocks, setBlocks] = useState<any[]>([{ type: "text", value: "" }]);
  const [style, setStyle] = useState("classic");
  const [toName, setToName] = useState("");
  const [fromName, setFromName] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [stickers, setStickers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [scheduleUnseal, setScheduleUnseal] = useState(false);
  const [unsealDate, setUnsealDate] = useState<string>("");

  // Read state
  const [readPhase, setReadPhase] = useState<
    "sealed" | "shattering" | "unsealing" | "open"
  >("sealed");
  const [revealCount, setRevealCount] = useState(0);
  const [typewriter, setTypewriter] = useState(false);
  const [typeSound, setTypeSound] = useState(false);

  // URL query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const writeParam = params.get("write");
    if (writeParam === "true") {
      setIsWriting(true);
    }

    const shareData = params.get("share");
    if (shareData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(shareData))));
        if (decoded && (decoded.blocks || decoded.content)) {
          setActiveLetter({
            id: "shared-" + Date.now(),
            recipient_name:
              decoded.toName || decoded.recipient_name || "My Love",
            sender_name:
              decoded.fromName || decoded.sender_name || "Always Yours",
            content:
              decoded.blocks || decoded.content || [{ type: "text", value: "" }],
            envelope_style:
              decoded.style ||
              decoded.envelopeStyle ||
              decoded.envelope_style ||
              "classic",
            sent_at: decoded.sent_at || new Date().toISOString(),
            is_opened: false,
            isShared: true,
          });
          setReadPhase("sealed");
          setRevealCount(0);
        }
      } catch (e) {
        console.error("Failed to decode shared love letter:", e);
      }
    }
  }, []);

  const fetchLetters = useCallback(async () => {
    if (!pair) return;
    try {
      const r = await fetch(`/api/love-letters?pairId=${pair.id}`);
      const d = await r.json();
      if (r.ok) setLettersList(d || []);
    } catch {
    } finally {
      setFetching(false);
    }
  }, [pair]);

  useEffect(() => {
    if (!loading && pair) {
      fetchLetters();
      const ch = supabase
        .channel(`letters-${pair.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "love_letters",
            filter: `pair_id=eq.${pair.id}`,
          },
          fetchLetters
        )
        .subscribe();
      return () => {
        supabase.removeChannel(ch);
      };
    } else if (!loading && !pair) {
      setFetching(false);
    }
  }, [loading, pair, fetchLetters, supabase]);

  // Deep-link letter ID loading
  useEffect(() => {
    if (typeof window === "undefined" || !lettersList.length) return;
    const letterId = new URLSearchParams(window.location.search).get("id");
    if (letterId && !activeLetter) {
      const found = lettersList.find((l) => l.id === letterId);
      if (found) handleUnseal(found);
    }
  }, [lettersList, activeLetter]);

  // Auto-fill names
  useEffect(() => {
    if (partner?.display_name && !toName) {
      setToName(partner.display_name);
    }
    if (user?.user_metadata?.name && !fromName) {
      setFromName(user.user_metadata.name);
    }
  }, [user, partner, toName, fromName]);

  // Draft persistence
  useEffect(() => {
    if (!pair) return;
    const saved = localStorage.getItem(`pairfect-letter-draft-${pair.id}`);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.blocks) setBlocks(p.blocks);
        if (p.style) setStyle(p.style);
        if (p.toName) setToName(p.toName);
        if (p.fromName) setFromName(p.fromName);
      } catch {}
    }
  }, [pair]);

  useEffect(() => {
    if (!pair || !isWriting) return;
    const hasContent = blocks.some((b) => b.type === "cat" || b.value.trim());
    if (hasContent || toName.trim() || fromName.trim()) {
      localStorage.setItem(
        `pairfect-letter-draft-${pair.id}`,
        JSON.stringify({ blocks, style, toName, fromName })
      );
    }
  }, [blocks, style, toName, fromName, pair, isWriting]);

  const searchStickers = async (q: string) => {
    setSearching(true);
    try {
      const r = await fetch(
        `/api/giphy/search?q=${encodeURIComponent(
          q.trim() ? `cat ${q}` : "cat happy"
        )}`
      );
      const d = await r.json();
      setStickers(d.data || []);
    } catch {
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (galleryOpen) searchStickers(searchQ);
  }, [galleryOpen, searchQ]);

  const handleApplyOccasion = (promptText: string) => {
    if (blocks.length === 1 && blocks[0].type === "text" && !blocks[0].value.trim()) {
      setBlocks([{ type: "text", value: promptText }]);
    } else {
      setBlocks([...blocks, { type: "text", value: promptText }]);
    }
  };

  const getShareUrl = () => {
    const clean = blocks.filter((b) => b.type === "cat" || b.value.trim());
    const payload = {
      toName: toName.trim() || "My Love",
      fromName: fromName.trim() || "Always Yours",
      blocks: clean.length > 0 ? clean : [{ type: "text", value: "" }],
      style,
      sent_at: new Date().toISOString(),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.pairfect.site";
    return `${origin}/love-letter?share=${b64}`;
  };

  const handleCopyShareLink = async () => {
    try {
      const url = getShareUrl();
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      alert("Please copy URL from the browser address bar.");
    }
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      if (activeLetter) {
        await exportLetterToPNG({
          recipientName: activeLetter.recipient_name,
          senderName: activeLetter.sender_name,
          content: Array.isArray(activeLetter.content)
            ? activeLetter.content
            : [{ type: "text", value: String(activeLetter.content || "") }],
          envelopeStyle: activeLetter.envelope_style,
          dateStr: activeLetter.sent_at
            ? format(parseISO(activeLetter.sent_at), "MMMM d, yyyy")
            : undefined,
        });
      } else {
        const clean = blocks.filter((b) => b.type === "cat" || b.value.trim());
        await exportLetterToPNG({
          recipientName: toName.trim() || "My Love",
          senderName: fromName.trim() || "Always Yours",
          content: clean.length > 0 ? clean : [{ type: "text", value: "" }],
          envelopeStyle: style,
        });
      }
    } catch (e: any) {
      console.error("Export error:", e);
      alert("Failed to export letter image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSend = async () => {
    if (!pair || !user || sending) return;
    const clean = blocks.filter((b) => b.type === "cat" || b.value.trim());
    if (!clean.length || !toName.trim()) return;
    setSending(true);
    try {
      const vaultKey = await getPairKey(pair.id);
      if (!vaultKey) {
        throw new Error("Your private key is unavailable on this device. Restore your vault key before sending.");
      }
      const encryptedContent = `enc:v1:${await encryptText(JSON.stringify(clean), vaultKey)}`;
      const r = await fetch("/api/love-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: pair.id,
          recipientName: toName.trim(),
          senderName: fromName.trim() || "Me",
          content: encryptedContent,
          envelopeStyle: style,
          unseal_at:
            scheduleUnseal && unsealDate
              ? new Date(unsealDate).toISOString()
              : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      const partnerId =
        pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
      if (partnerId) {
        await supabase.from("notifications").insert({
          pair_id: pair.id,
          recipient_id: partnerId,
          sender_id: user.id,
          type: "letter_sent",
          title: `${fromName.trim() || "Your partner"} sent you a love letter 💌`,
          body: "Unseal it to read their handwritten words.",
        });
      }
      await supabase.rpc("record_pair_activity", { p_pair_id: pair.id });

      setBlocks([{ type: "text", value: "" }]);
      setToName("");
      setFromName("");
      setStyle("classic");
      setScheduleUnseal(false);
      setUnsealDate("");
      setIsWriting(false);
      setStep(1);
      fetchLetters();
      if (pair) localStorage.removeItem(`pairfect-letter-draft-${pair.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  const handleUnseal = async (letter: any) => {
    let readableLetter = letter;
    if (typeof letter.content === "string" && letter.content.startsWith("enc:v1:")) {
      try {
        if (!pair?.id) throw new Error("This letter needs its paired vault key.");
        const key = await getPairKey(pair.id);
        if (!key) throw new Error("Your private key is unavailable on this device. Restore your vault key to read this letter.");
        const plaintext = await decryptText(letter.content.slice("enc:v1:".length), key);
        readableLetter = { ...letter, content: JSON.parse(plaintext) };
      } catch (error) {
        alert(error instanceof Error ? error.message : "Could not decrypt this letter.");
        return;
      }
    }
    setActiveLetter(readableLetter);
    if (readableLetter.is_opened) {
      setReadPhase("open");
      setRevealCount((readableLetter.content?.length || 0) + 1);
      return;
    }
    setReadPhase("sealed");
    setRevealCount(0);
  };

  const breakSeal = async () => {
    if (!activeLetter) return;
    setReadPhase("shattering");
    await new Promise((r) => setTimeout(r, 650));
    setReadPhase("unsealing");
    await new Promise((r) => setTimeout(r, 1100));
    setReadPhase("open");

    const count = activeLetter.content?.length || 0;
    for (let i = 0; i <= count; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setRevealCount(i + 1);
    }

    if (!activeLetter.isShared && user?.id && user.id !== activeLetter.sender_id) {
      await supabase
        .from("love_letters")
        .update({ is_opened: true, opened_at: new Date().toISOString() })
        .eq("id", activeLetter.id);
    }
  };

  if (loading || (pair && fetching)) {
    return (
      <div className="min-h-screen bg-[#FFF9F6] flex items-center justify-center">
        <Navigation />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          <span className="font-mono text-xs text-stone-500">Unlocking letter vault...</span>
        </div>
      </div>
    );
  }

  // ─── 1. COMPOSE VIEW ───
  if (isWriting) {
    return (
      <div
        className="min-h-screen bg-[#FFF9F6] text-stone-900 py-10 px-4 selection:bg-rose-100 selection:text-rose-900"
        style={{
          backgroundImage: "radial-gradient(#d6d3d1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <main className="max-w-xl mx-auto space-y-6">
          {/* Top Header & Step Tracker */}
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => {
                setIsWriting(false);
                setStep(1);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inbox</span>
            </button>

            {/* Step indicator pills */}
            <div className="flex items-center gap-1.5" aria-label={`Step ${step} of 3`}>
              {[1, 2, 3].map((stepNum) => (
                <span
                  key={stepNum}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === stepNum
                      ? "w-6 bg-stone-900"
                      : step > stepNum
                      ? "w-2 bg-stone-400"
                      : "w-2 bg-stone-200"
                  }`}
                />
              ))}
            </div>

            <Link
              href="/bouquet"
              className="text-xs font-mono font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Flower2 className="w-3.5 h-3.5" />
              <span>Bouquet</span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Compose Letter Content */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative space-y-6"
              >
                <div className="absolute -top-3.5 left-8 -rotate-1 shadow-xs">
                  <span className="bg-rose-500 text-white font-mono uppercase text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
                    STEP 1 · WRITE FROM THE HEART
                  </span>
                </div>

                <div className="pt-2">
                  <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
                    Write Your Love Letter
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-stone-600 font-sans">
                    Pour your thoughts onto vintage parchment. Add stickers or pick an occasion starter.
                  </p>
                </div>

                {/* Inspiration Starter Pills */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Sparkle className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Inspiration Starters</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((occ) => (
                      <button
                        key={occ.label}
                        type="button"
                        onClick={() => handleApplyOccasion(occ.prompt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-stone-300 bg-[#FFFDFB] hover:bg-rose-50 hover:border-rose-400 text-stone-800 cursor-pointer transition-all shadow-xs"
                      >
                        <span>{occ.icon}</span>
                        <span>{occ.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parchment Lined Paper Container */}
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-[#FFFDFB] p-5 sm:p-6 space-y-4">
                  {blocks.map((block, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          if (blocks.length === 1 && blocks[0].type === "text") {
                            setBlocks([{ type: "text", value: "" }]);
                            return;
                          }
                          setBlocks(blocks.filter((_, j) => j !== idx));
                        }}
                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded-full bg-white border border-stone-200 cursor-pointer transition-all z-10"
                        title="Remove block"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {block.type === "text" ? (
                        <textarea
                          value={block.value}
                          onChange={(e) => {
                            const u = [...blocks];
                            u[idx].value = e.target.value;
                            setBlocks(u);
                          }}
                          placeholder={idx === 0 ? "My love,\n\nI was just thinking about you today..." : "Continue your thoughts..."}
                          rows={6}
                          className="w-full bg-transparent resize-none text-base text-stone-900 placeholder:text-stone-400 focus:outline-none leading-relaxed font-sans"
                        />
                      ) : (
                        <div className="rounded-2xl overflow-hidden border border-stone-200 max-w-xs p-2 bg-white">
                          <GiphyRenderer giphyId={block.giphy_id} />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-3 pt-3 border-t border-stone-200 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setBlocks([...blocks, { type: "text", value: "" }])}
                      className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Paragraph</span>
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setGalleryOpen(true)}
                      className="inline-flex items-center gap-1 text-stone-600 hover:text-rose-600 cursor-pointer"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>Add Sticker</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={blocks.every((b) => b.type === "text" && !b.value.trim())}
                  className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  Choose Envelope Wrap →
                </button>
              </motion.div>
            )}

            {/* STEP 2: Envelope Outer Wrap & Styling */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative space-y-6"
              >
                <div className="absolute -top-3.5 left-8 -rotate-1 shadow-xs">
                  <span className="bg-amber-400 text-stone-900 font-mono uppercase text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
                    STEP 2 · ENVELOPE &amp; WAX
                  </span>
                </div>

                <div className="pt-2">
                  <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
                    Select Outer Envelope
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-stone-600 font-sans">
                    Pick the aesthetic wrapping and digital wax seal for your delivery.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {Object.entries(STYLES).map(([key, cfg]) => {
                    const sel = style === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStyle(key)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                          sel
                            ? "border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] scale-[1.02]"
                            : "border-stone-300 opacity-70 hover:opacity-100"
                        }`}
                        style={{ background: cfg.bg }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-heading font-black ${
                              cfg.foldDark ? "text-white" : "text-stone-900"
                            }`}
                          >
                            {cfg.name}
                          </span>
                          {sel && (
                            <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-rose-600 border border-stone-800" />
                          <span
                            className={`text-[10px] font-mono ${
                              cfg.foldDark ? "text-stone-300" : "text-stone-600"
                            }`}
                          >
                            Wax Seal
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-mono font-bold text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-stone-900 hover:bg-stone-800 text-white py-3 px-6 rounded-full font-heading font-bold text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    Address &amp; Deliver →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Address & Deliver */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative space-y-6"
              >
                <div className="absolute -top-3.5 left-8 -rotate-1 shadow-xs">
                  <span className="bg-emerald-500 text-white font-mono uppercase text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
                    STEP 3 · SEAL &amp; DELIVER
                  </span>
                </div>

                <div className="pt-2">
                  <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight">
                    Address Your Envelope
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-stone-600 font-sans">
                    Address who this is for and choose instant or time-capsule delivery.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      To (Partner&apos;s Name)
                    </label>
                    <input
                      type="text"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      placeholder="My Love"
                      className="w-full px-4 py-3 text-sm border-2 border-stone-800 rounded-2xl bg-[#FFFBF8] text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      From (Your Name)
                    </label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Always Yours"
                      className="w-full px-4 py-3 text-sm border-2 border-stone-800 rounded-2xl bg-[#FFFBF8] text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {/* Scheduled Unseal Date Option */}
                  {pair && (
                    <div className="p-4 rounded-2xl bg-[#FFFDFB] border-2 border-dashed border-stone-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={scheduleUnseal}
                            onChange={(e) => {
                              if (!isPlus) {
                                setIsPaywallOpen(true);
                                return;
                              }
                              setScheduleUnseal(e.target.checked);
                            }}
                            className="rounded border-stone-800 text-rose-600 focus:ring-rose-400 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-rose-600" />
                            <span>Schedule future unseal date</span>
                          </span>
                        </label>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          PLUS
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                        Lock with digital wax that only breaks on an upcoming anniversary, birthday, or milestone.
                      </p>
                      {scheduleUnseal && (
                        <input
                          type="date"
                          value={unsealDate}
                          onChange={(e) => setUnsealDate(e.target.value)}
                          min={format(new Date(Date.now() + 86400000), "yyyy-MM-dd")}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white"
                        />
                      )}
                    </div>
                  )}

                  {/* Download PNG card keepsake */}
                  <button
                    type="button"
                    onClick={handleExportPNG}
                    disabled={isExporting}
                    className="w-full p-3.5 rounded-2xl border-2 border-stone-800 bg-[#FFFDFB] hover:bg-stone-50 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="text-xs font-mono font-bold text-stone-900 block">
                          Download Keepsake PNG
                        </span>
                        <span className="text-[10px] text-stone-500 font-sans">
                          High-resolution calligraphy card to keep forever.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      {isExporting ? "Rendering..." : "300 DPI"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-mono font-bold text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  {pair ? (
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !toName.trim()}
                      className="bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white py-3.5 px-8 rounded-full font-heading font-bold text-sm tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Send to Partner 💌</span>
                    </button>
                  ) : (
                    <Link
                      href="/onboarding"
                      className="bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-6 rounded-full font-heading font-bold text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                    >
                      Connect Partner to Send 💌
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Giphy sticker modal */}
        <AnimatePresence>
          {galleryOpen && (
            <motion.div
              key="giphy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white border-2 border-stone-800 rounded-3xl max-w-sm w-full max-h-[70vh] flex flex-col overflow-hidden shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)]">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-stone-900">
                    Pick a Sticker
                  </span>
                  <button
                    onClick={() => setGalleryOpen(false)}
                    className="p-1 rounded-lg text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 border-b border-stone-200">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQ}
                      onChange={(e) => {
                        setSearchQ(e.target.value);
                        searchStickers(e.target.value);
                      }}
                      placeholder="Search stickers..."
                      className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-xl text-xs bg-[#FFFDFB] focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                  </div>
                </div>
                <div className="p-3 overflow-y-auto flex-1">
                  {searching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                    </div>
                  ) : stickers.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {stickers.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setBlocks([...blocks, { type: "cat", giphy_id: s.id }]);
                            setGalleryOpen(false);
                          }}
                          className="rounded-xl border border-stone-200 bg-[#FFFDFB] p-1 cursor-pointer hover:border-rose-400 transition-all h-20 flex items-center justify-center"
                        >
                          <img
                            src={s.images?.fixed_height_small?.url || s.images?.fixed_height?.url}
                            alt="Sticker"
                            className="max-h-16 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-stone-400 text-center py-8">
                      No stickers found
                    </p>
                  )}
                </div>
                <div className="p-2 border-t border-stone-200 text-center">
                  <span className="text-[9px] font-mono text-stone-400">
                    Powered by GIPHY
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PlusPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          featureTitle="Time-Capsule Love Letters"
          featureDescription="Write and seal notes now with digital wax that only open on a future date or anniversary."
        />
      </div>
    );
  }

  // ─── 2. READ / UNSEAL LETTER VIEW ───
  if (activeLetter) {
    const cfg = STYLES[activeLetter.envelope_style] || STYLES.classic;

    return (
      <div
        className="relative min-h-screen bg-[#FFF9F6] text-stone-900 py-10 px-4 selection:bg-rose-100 selection:text-rose-900"
        style={{
          backgroundImage: "radial-gradient(#d6d3d1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => {
                setActiveLetter(null);
                setReadPhase("sealed");
                setRevealCount(0);
                fetchLetters();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inbox</span>
            </button>

            {readPhase === "open" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypewriter((p) => !p)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-colors ${
                    typewriter
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-600 border-stone-300"
                  }`}
                >
                  Typewriter {typewriter ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="p-1.5 rounded-full border border-stone-300 bg-white text-stone-700 hover:text-stone-900"
                  title="Download Keepsake PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* SEALED STAGE: Interactive Wax Envelope */}
            {(readPhase === "sealed" ||
              readPhase === "shattering" ||
              readPhase === "unsealing") && (
              <motion.div
                key="sealed-envelope"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center justify-center min-h-[65vh] gap-6"
              >
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Sparkle className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  <span>A HANDWRITTEN LETTER AWAITS YOU</span>
                </div>

                {/* 3D Envelope Container */}
                <div className="relative w-full max-w-md aspect-[1.45/1] rounded-3xl border-2 border-stone-800 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden" style={{ background: cfg.bg }}>
                  {/* Rising paper preview on unseal */}
                  <motion.div
                    className="absolute inset-x-5 top-5 bottom-5 rounded-2xl bg-white border border-stone-300 p-5 flex flex-col justify-between"
                    animate={
                      readPhase === "unsealing"
                        ? { y: -120, opacity: 1, scale: 1.02 }
                        : { y: 6, opacity: 0.95 }
                    }
                    transition={{ duration: 0.9 }}
                    style={{ zIndex: 10 }}
                  >
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                        Personal &amp; Confidential
                      </span>
                      <p className="font-heading font-black text-lg text-stone-900">
                        Dearest {activeLetter.recipient_name},
                      </p>
                      <div className="h-1.5 w-3/4 rounded-full bg-stone-200" />
                      <div className="h-1.5 w-1/2 rounded-full bg-stone-200" />
                    </div>
                    <span className="text-right text-xs font-mono text-stone-500">
                      With love, {activeLetter.sender_name}
                    </span>
                  </motion.div>

                  {/* Envelope pocket */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
                    <EnvelopePocketFolds dark={cfg.foldDark} />
                  </div>

                  {/* Top Flap */}
                  <motion.div
                    className="absolute inset-x-0 top-0 h-[50%] pointer-events-none"
                    style={{ transformOrigin: "top center", zIndex: readPhase === "unsealing" ? 8 : 20 }}
                    animate={readPhase === "unsealing" ? { rotateX: 180 } : { rotateX: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <EnvelopeTopFlap dark={cfg.foldDark} />
                  </motion.div>

                  {/* Wax Seal Button */}
                  {readPhase !== "unsealing" && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30 }}>
                      <WaxSealButton onPress={breakSeal} shattering={readPhase === "shattering"} />
                    </div>
                  )}
                </div>

                <p className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">
                  {readPhase === "sealed" && "Tap the wax seal to unseal"}
                  {readPhase === "shattering" && "Breaking wax seal..."}
                  {readPhase === "unsealing" && "Unfolding parchment..."}
                </p>
              </motion.div>
            )}

            {/* OPENED STAGE: Parchment Letter */}
            {readPhase === "open" && (
              <motion.div
                key="open-letter"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.9)] relative space-y-6"
              >
                <div className="absolute -top-3.5 left-8 -rotate-1 shadow-xs">
                  <span className="bg-rose-500 text-white font-mono uppercase text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
                    SEALED FOR YOU
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-b border-stone-200 pb-4 text-xs font-mono text-stone-500">
                  <span>To: {activeLetter.recipient_name}</span>
                  <span>{format(parseISO(activeLetter.sent_at), "MMMM d, yyyy")}</span>
                </div>

                {/* Letter Body */}
                <div className="space-y-4">
                  {Array.isArray(activeLetter.content) ? (
                    activeLetter.content.map((block: any, idx: number) => {
                      if (revealCount <= idx) return null;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          {block.type === "text" ? (
                            <p className="text-base sm:text-lg leading-relaxed text-stone-900 font-sans whitespace-pre-wrap">
                              {typewriter ? (
                                <TypewriterText text={block.value || ""} sound={typeSound} />
                              ) : (
                                block.value || ""
                              )}
                            </p>
                          ) : (
                            <div className="rounded-2xl overflow-hidden border border-stone-200 max-w-xs p-2 bg-[#FFFDFB]">
                              <GiphyRenderer giphyId={block.giphy_id} />
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-base sm:text-lg leading-relaxed text-stone-900 font-sans whitespace-pre-wrap">
                      {typeof activeLetter.content === "string"
                        ? activeLetter.content
                        : "A handwritten letter for you ♡"}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="font-heading font-black text-xl text-stone-900">
                    With love, {activeLetter.sender_name}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportPNG}
                      disabled={isExporting}
                      className="px-4 py-2 rounded-full border-2 border-stone-800 text-xs font-mono font-bold text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      {isExporting ? "Saving..." : "Save Keepsake"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsWriting(true);
                        setStep(1);
                        setToName(activeLetter.sender_name || "");
                        setBlocks([{ type: "text", value: "" }]);
                        setActiveLetter(null);
                      }}
                      className="px-5 py-2 rounded-full bg-stone-900 text-white text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>Write a Reply</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── 3. INBOX / ARCHIVE VAULT VIEW ───
  const unread = lettersList.filter(
    (l) => l.sender_id !== user?.id && !l.is_opened
  );
  const read = lettersList.filter(
    (l) => !(l.sender_id !== user?.id && !l.is_opened)
  );

  return (
    <div
      className="relative min-h-screen bg-[#FFF9F6] text-stone-900 selection:bg-rose-100 selection:text-rose-900"
      style={{
        backgroundImage: "radial-gradient(#d6d3d1 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <Navigation />

      <main className="max-w-2xl mx-auto px-5 md:pl-28 md:pr-10 py-16 pb-36 space-y-8">
        {/* Top Header Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.8)]">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-stone-900 text-white">
              💌 Letters
            </span>
            <Link
              href="/bouquet"
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1"
            >
              <span>💐</span>
              <span>Bouquets</span>
            </Link>
          </div>

          <button
            onClick={() => {
              setIsWriting(true);
              setStep(1);
            }}
            className="bg-stone-900 hover:bg-stone-800 text-white py-2.5 px-5 rounded-full font-heading font-bold text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write Letter</span>
          </button>
        </div>

        {/* Hero Header Card */}
        <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] relative">
          <div className="absolute -top-3.5 left-8 -rotate-1 shadow-xs">
            <span className="bg-rose-500 text-white font-mono uppercase text-[11px] font-black tracking-wider px-3.5 py-1 rounded-sm border border-stone-800">
              WAX-SEALED VAULT
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-stone-900 tracking-tight">
                Love Letters
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-sans">
                Written from the heart, sealed with digital wax, encrypted on your device, and kept forever.
              </p>
            </div>
            <CoupleBeansMascot className="w-24 h-18 shrink-0" />
          </div>
        </div>

        {/* If unpaired */}
        {!pair ? (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] text-center space-y-4">
            <CoupleBeansMascot className="w-28 h-20" />
            <h2 className="font-heading font-black text-xl text-stone-900">
              Link Your Couple Sanctuary
            </h2>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Connect your partner to send sealed wax letters directly to each other&apos;s private vaults.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsWriting(true);
                  setStep(1);
                }}
                className="bg-stone-900 text-white px-5 py-2.5 rounded-full font-heading font-bold text-xs"
              >
                Write Draft
              </button>
              <Link
                href="/onboarding"
                className="border-2 border-stone-800 text-stone-900 px-5 py-2.5 rounded-full font-heading font-bold text-xs hover:bg-stone-50"
              >
                Connect Partner
              </Link>
            </div>
          </div>
        ) : lettersList.length === 0 ? (
          <div className="bg-white border-2 border-stone-800 rounded-3xl p-8 shadow-[4px_4px_0px_0px_rgba(28,25,23,0.9)] text-center space-y-4">
            <CoupleBeansMascot className="w-28 h-20" />
            <h2 className="font-heading font-black text-xl text-stone-900">
              The Letterbox is Quiet
            </h2>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Surprise your partner with their first sealed wax letter. Write a quick note of love or appreciation.
            </p>
            <button
              onClick={() => {
                setIsWriting(true);
                setStep(1);
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-full font-heading font-bold text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]"
            >
              Write First Letter 💌
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unread Letters Section */}
            {unread.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Waiting to be Unsealed ({unread.length})
                </span>

                {unread.map((l) => {
                  const isLocked = l.unseal_at && new Date(l.unseal_at) > new Date();
                  return (
                    <button
                      key={l.id}
                      onClick={() => !isLocked && handleUnseal(l)}
                      className={`w-full text-left bg-white border-2 border-stone-800 rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(28,25,23,0.9)] hover:translate-y-[-2px] transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isLocked ? "opacity-80" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-stone-800 text-rose-600 flex items-center justify-center shrink-0">
                          {isLocked ? <Lock className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="font-heading font-black text-base text-stone-900 block">
                            From {l.sender_name}
                          </span>
                          <span className="text-[11px] font-mono text-stone-500">
                            {isLocked
                              ? `Locked until ${format(parseISO(l.unseal_at), "MMMM d, yyyy")}`
                              : `Sealed on ${format(parseISO(l.sent_at), "MMM d, yyyy")}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-stone-900">
                          {isLocked ? "Locked" : "Unseal →"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Read / Archive Letters Section */}
            {read.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  Archive &amp; Keepsakes ({read.length})
                </span>

                {read.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleUnseal(l)}
                    className="w-full text-left bg-white border-2 border-stone-800 rounded-2xl p-4 sm:p-5 shadow-[2px_2px_0px_0px_rgba(28,25,23,0.8)] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-300 text-stone-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-sm text-stone-900 block truncate">
                          {l.sender_id === user?.id ? `To ${l.recipient_name}` : `From ${l.sender_name}`}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {format(parseISO(l.sent_at), "MMMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-stone-600 hover:text-stone-900 shrink-0">
                      Read Again →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <PlusPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          featureTitle="Time-Capsule Love Letters"
          featureDescription="Write and seal notes now with digital wax that only open on a future date or anniversary."
        />
      </main>
    </div>
  );
}
