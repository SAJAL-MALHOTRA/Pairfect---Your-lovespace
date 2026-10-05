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
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { WritingLetters } from "@/components/cozy-illustrations";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import { exportLetterToPNG } from "@/lib/love-letter/export-letter";

// Giphy block
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
  if (loading)
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--ink-light)]" />
      </div>
    );
  if (!url)
    return (
      <p className="text-[10px] text-[var(--ink-light)] font-mono text-center py-3">
        Sticker unavailable
      </p>
    );
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

export const playTypewriterClick = (char?: string) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Key mechanical strike (filtered white noise burst)
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

    // 2. Low mechanical body thump
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

    // 3. Carriage bell ding on sentence endings
    if (
      char &&
      (char === "." || char === "!" || char === "?" || char === "\n")
    ) {
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
    // Silent catch if audio not allowed
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

// Envelope SVG fold diagram
function EnvelopeFolds({ dark = false }: { dark?: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.06)" : "rgba(160,130,90,0.28)";
  const fill = dark ? "rgba(255,255,255,0.03)" : "rgba(200,175,135,0.14)";
  return (
    <svg
      viewBox="0 0 400 260"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        d="M0,0 L200,120 L400,0"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
      />
      <path d="M0,260 L140,145" stroke={stroke} strokeWidth="1" />
      <path d="M400,260 L260,145" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

// Physical envelope pocket (sides and bottom)
function EnvelopePocketFolds({ dark = false }: { dark?: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.08)" : "rgba(160,130,90,0.3)";
  const fillSide = dark ? "rgba(255,255,255,0.04)" : "rgba(200,175,135,0.18)";
  const fillBottom = dark ? "rgba(255,255,255,0.07)" : "rgba(215,190,150,0.28)";
  return (
    <svg
      viewBox="0 0 400 260"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Left pocket flap */}
      <path
        d="M0,0 L180,140 L0,260 Z"
        fill={fillSide}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* Right pocket flap */}
      <path
        d="M400,0 L220,140 L400,260 Z"
        fill={fillSide}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* Bottom pocket fold */}
      <path
        d="M0,260 L200,125 L400,260 Z"
        fill={fillBottom}
        stroke={stroke}
        strokeWidth="1.2"
      />
    </svg>
  );
}

// Physical envelope top triangular flap
function EnvelopeTopFlap({ dark = false }: { dark?: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.12)" : "rgba(160,130,90,0.35)";
  const fill = dark ? "rgba(42,32,24,0.95)" : "rgba(242,228,204,0.96)";
  return (
    <svg
      viewBox="0 0 400 130"
      className="w-full h-full pointer-events-none drop-shadow-sm"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        d="M0,0 L200,126 L400,0 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
      />
    </svg>
  );
}

// Botanical corner sprig
function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 120" className={className} fill="none" aria-hidden>
      <path
        d="M35 118 C35 92 33 68 36 48 C38 33 35 18 33 4"
        stroke="#C4A882"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M35 98 C27 90 18 87 11 78"
        stroke="#C4A882"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M35 78 C26 70 18 66 10 57"
        stroke="#C4A882"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M35 88 C43 80 52 77 59 68"
        stroke="#C4A882"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M35 68 C44 60 52 56 60 47"
        stroke="#C4A882"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="11" cy="78" r="2.1" fill="#C4A882" opacity="0.7" />
      <circle cx="10" cy="57" r="1.8" fill="#C4A882" opacity="0.64" />
      <circle cx="59" cy="68" r="2.1" fill="#C4A882" opacity="0.7" />
      <circle cx="60" cy="47" r="1.8" fill="#C4A882" opacity="0.64" />
      <circle cx="33" cy="4" r="2.5" fill="#C4A882" opacity="0.76" />
    </svg>
  );
}

// WaxSeal button: animated with physical fragment shatter
function WaxSealButton({
  onPress,
  shattering,
}: {
  onPress: () => void;
  shattering: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Golden sparkle dust burst on crack */}
      {shattering && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-xs"
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.4, 0],
                x: Math.cos((i / 14) * Math.PI * 2) * 80,
                y: Math.sin((i / 14) * Math.PI * 2) * 80,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {/* Wax seal body: fractures into 4 flying shards when shattering */}
      {shattering ? (
        <div className="relative w-18 h-18 pointer-events-none">
          {/* Top-Left Shard */}
          <motion.div
            className="absolute top-0 left-0 w-9 h-9 overflow-hidden"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: -28, y: -28, rotate: -25, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="w-18 h-18 rounded-full bg-[var(--seal-red)] shadow-md" />
          </motion.div>
          {/* Top-Right Shard */}
          <motion.div
            className="absolute top-0 right-0 w-9 h-9 overflow-hidden"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: 28, y: -28, rotate: 25, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="w-18 h-18 rounded-full bg-[var(--seal-red)] -ml-9 shadow-md" />
          </motion.div>
          {/* Bottom-Left Shard */}
          <motion.div
            className="absolute bottom-0 left-0 w-9 h-9 overflow-hidden"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: -28, y: 28, rotate: -35, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="w-18 h-18 rounded-full bg-[var(--seal-red)] -mt-9 shadow-md" />
          </motion.div>
          {/* Bottom-Right Shard */}
          <motion.div
            className="absolute bottom-0 right-0 w-9 h-9 overflow-hidden"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: 28, y: 28, rotate: 35, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="w-18 h-18 rounded-full bg-[var(--seal-red)] -ml-9 -mt-9 shadow-md" />
          </motion.div>
        </div>
      ) : (
        <motion.button
          key="seal"
          aria-label="Break the seal to read the letter"
          onClick={onPress}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          style={{
            filter: "drop-shadow(0 4px 14px rgba(128,32,48,0.38))",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" fill="var(--seal-red)" />
            <circle
              cx="28"
              cy="28"
              r="21.5"
              fill="none"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="1"
            />
            <path
              d="M22 20 L22 36 M22 20 L28 20 C31.3 20 33 21.6 33 24 C33 26.4 31.3 28 28 28 L22 28"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

// Envelope Styles
const STYLES: Record<
  string,
  { name: string; bg: string; foldDark: boolean; sealColor: string }
> = {
  classic: {
    name: "Parchment",
    bg: "linear-gradient(160deg,#F8EED8,#EDE0C4)",
    foldDark: false,
    sealColor: "var(--burgundy)",
  },
  velvet: {
    name: "Velvet Rose",
    bg: "linear-gradient(160deg,#FDF0F2,#F5D8DC)",
    foldDark: false,
    sealColor: "#9B2E4B",
  },
  midnight: {
    name: "Midnight",
    bg: "linear-gradient(160deg,#16202E,#0E1520)",
    foldDark: true,
    sealColor: "#4F46E5",
  },
  kraft: {
    name: "Kraft",
    bg: "linear-gradient(160deg,#EDE4D0,#DDD0B8)",
    foldDark: false,
    sealColor: "#6B4F2C",
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

// Main Component
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
  const [step, setStep] = useState(1);
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
  const [candle, setCandle] = useState(false);

  // Nav management
  useEffect(() => {
    if (isWriting || activeLetter)
      window.dispatchEvent(new CustomEvent("navigation-hide"));
    else window.dispatchEvent(new CustomEvent("navigation-show"));
  }, [isWriting, activeLetter]);

  // URL query params: unlisted link decoding & writing mode
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
  }, [loading, pair, fetchLetters]);

  // Deep-link letter ID loading
  useEffect(() => {
    if (typeof window === "undefined" || !lettersList.length) return;
    const letterId = new URLSearchParams(window.location.search).get("id");
    if (letterId && !activeLetter) {
      const found = lettersList.find((l) => l.id === letterId);
      if (found) handleUnseal(found);
    }
  }, [lettersList]);

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
  }, [galleryOpen]);

  // Apply occasion starter prompt
  const handleApplyOccasion = (promptText: string) => {
    if (blocks.length === 1 && blocks[0].type === "text" && !blocks[0].value.trim()) {
      setBlocks([{ type: "text", value: promptText }]);
    } else {
      setBlocks([...blocks, { type: "text", value: promptText }]);
    }
  };

  // Generate unlisted base64 shareable link
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

  // Download Keepsake PNG card
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
      const r = await fetch("/api/love-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: pair.id,
          recipientName: toName.trim(),
          senderName: fromName.trim() || "Me",
          content: clean,
          envelopeStyle: style,
          unseal_at:
            scheduleUnseal && unsealDate
              ? new Date(unsealDate).toISOString()
              : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      // Trigger partner notification & soft streak activity record
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
    setActiveLetter(letter);
    if (letter.is_opened) {
      setReadPhase("open");
      setRevealCount((letter.content?.length || 0) + 1);
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
    // Reveal blocks one at a time
    const count = activeLetter.content?.length || 0;
    for (let i = 0; i <= count; i++) {
      await new Promise((r) => setTimeout(r, 500));
      setRevealCount(i + 1);
    }
    // Mark as opened in Supabase only if it is a paired DB letter
    if (
      !activeLetter.isShared &&
      user?.id &&
      user.id !== activeLetter.sender_id
    ) {
      await supabase
        .from("love_letters")
        .update({ is_opened: true, opened_at: new Date().toISOString() })
        .eq("id", activeLetter.id);
    }
  };

  if (loading || (pair && fetching)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  // COMPOSE: The blank lined paper
  if (isWriting) {
    const cfg = STYLES[style] || STYLES.classic;
    return (
      <div
        className="min-h-screen relative"
        style={{ background: "var(--paper-warm)" }}
      >
        <main className="max-w-lg mx-auto px-5 py-12 pb-32">
          {/* Top Switcher & Cancel */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileTap={{ x: -2 }}
              onClick={() => {
                setIsWriting(false);
                setStep(1);
              }}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--ink-mid)] hover:text-[var(--ink-dark)] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel
            </motion.button>

            <div className="flex items-center gap-3">
              <Link
                href="/bouquet"
                className="text-[10px] font-mono uppercase tracking-widest text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <Flower2 className="w-3.5 h-3.5" /> Digital Bouquet ▷
              </Link>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">
                {step} / 3
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: The paper & occasion starters */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">
                    Compose
                  </h1>
                  <p className="text-xs text-[var(--ink-mid)] font-mono mt-1">
                    Write what is in your heart, or pick an occasion starter.
                  </p>
                </div>

                {/* Heartfelt Occasion Starters */}
                <div className="space-y-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Inspiration Starters</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((occ) => (
                      <button
                        key={occ.label}
                        type="button"
                        onClick={() => handleApplyOccasion(occ.prompt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border border-[var(--border-warm)] bg-white/70 hover:bg-white hover:border-[var(--seal-red)] text-[var(--ink-dark)] cursor-pointer transition-all shadow-xs hover:scale-102"
                      >
                        <span>{occ.icon}</span>
                        <span>{occ.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* The lined paper */}
                <div
                  className="relative rounded-3xl overflow-hidden paper-grain"
                  style={{
                    background:
                      "linear-gradient(180deg,#FFFDF5 0%,#FBF6EA 100%)",
                    border: "1px solid var(--border-warm)",
                    backgroundImage:
                      "linear-gradient(180deg,#FFFDF5 0%,#FBF6EA 100%),linear-gradient(transparent calc(32px - 1px),rgba(196,168,130,0.22) calc(32px - 1px),rgba(196,168,130,0.22) 32px,transparent 32px)",
                    backgroundSize: "100%,100% 32px",
                    boxShadow:
                      "0 8px 40px rgba(60,40,20,0.1),0 2px 8px rgba(60,40,20,0.06)",
                  }}
                >
                  {/* Washi tape strip */}
                  <div
                    className="absolute top-3 right-8 w-16 h-5 pointer-events-none"
                    style={{
                      background: "var(--washi-warm)",
                      transform: "rotate(-2deg)",
                    }}
                  />
                  <Sprig className="absolute bottom-3 right-3 w-10 h-16 opacity-40 pointer-events-none" />

                  <div className="px-8 pt-10 pb-6">
                    {blocks.map((block, idx) => (
                      <div key={idx} className="relative group mb-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (
                              blocks.length === 1 &&
                              blocks[0].type === "text"
                            ) {
                              setBlocks([{ type: "text", value: "" }]);
                              return;
                            }
                            setBlocks(blocks.filter((_, j) => j !== idx));
                          }}
                          className="absolute -right-3 top-0 opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-light)] hover:text-red-500 rounded cursor-pointer transition-all z-10"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                        {block.type === "text" ? (
                          <textarea
                            value={block.value}
                            onChange={(e) => {
                              const u = [...blocks];
                              u[idx].value = e.target.value;
                              setBlocks(u);
                            }}
                            placeholder={idx === 0 ? "Dearest..." : "Continue..."}
                            rows={5}
                            className="input-warm w-full resize-none"
                            style={{
                              lineHeight: "32px",
                              fontFamily:
                                "var(--font-handwriting),cursive",
                              color: "var(--ink-dark)",
                            }}
                          />
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-[var(--border-warm)] max-w-xs p-2 bg-white/70">
                            <GiphyRenderer giphyId={block.giphy_id} />
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-4 pt-2 border-t border-[var(--border-warm)]/50">
                      <button
                        onClick={() =>
                          setBlocks([...blocks, { type: "text", value: "" }])
                        }
                        className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-[var(--ink-dark)] inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Paragraph
                      </button>
                      <button
                        onClick={() => setGalleryOpen(true)}
                        className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-[var(--seal-red)] inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Smile className="w-3 h-3" /> Sticker
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setStep(2)}
                    disabled={blocks.every(
                      (b) => b.type === "text" && !b.value.trim()
                    )}
                    className="btn-primary py-3 px-10 text-[10px] uppercase tracking-widest disabled:opacity-40 cursor-pointer"
                  >
                    Choose Envelope →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Envelope */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">
                    Envelope
                  </h1>
                  <p className="text-xs text-[var(--ink-mid)] font-mono mt-1">
                    Choose the outer wrapping and wax seal.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(STYLES).map(([key, cfg]) => {
                    const sel = style === key;
                    return (
                      <motion.button
                        key={key}
                        onClick={() => setStyle(key)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative rounded-2xl h-32 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border ${
                          sel
                            ? "border-[var(--seal-red)] shadow-[0_0_0_3px_rgba(128,32,48,0.12)]"
                            : "border-[var(--border-mid)] opacity-70"
                        }`}
                        style={{ background: cfg.bg }}
                      >
                        {sel && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--seal-red)] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                        <p
                          className="text-xs font-bold text-center leading-tight px-3"
                          style={{
                            color: cfg.foldDark
                              ? "rgba(255,255,255,0.8)"
                              : "#3A2E22",
                          }}
                        >
                          {cfg.name}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn-primary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    Address & Share →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Seal & Share */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">
                    Seal & Deliver
                  </h1>
                  <p className="text-xs text-[var(--ink-mid)] font-mono mt-1">
                    Address your letter and pick how you want to send it.
                  </p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-mid)] rounded-3xl p-6 space-y-4 paper-grain">
                  {[
                    {
                      label: "To",
                      val: toName,
                      set: setToName,
                      placeholder: "My Love",
                    },
                    {
                      label: "From",
                      val: fromName,
                      set: setFromName,
                      placeholder: "Your name",
                    },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">
                        {f.label}
                      </label>
                      <input
                        type="text"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        className="input-warm w-full"
                        style={{
                          fontFamily: "var(--font-handwriting),cursive",
                        }}
                      />
                    </div>
                  ))}

                  {/* Future lock date option (if paired) */}
                  {pair && (
                    <div className="pt-2 border-t border-[var(--border-warm)]/50">
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
                            className="rounded border-[var(--border-mid)] text-[var(--seal-red)] focus:ring-[var(--seal-red)] w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-[var(--ink-dark)] flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-[var(--burgundy)]" />
                            <span>Schedule future unseal date</span>
                          </span>
                        </label>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#E8527D] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          PLUS
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--ink-light)] mt-1 ml-6">
                        Seal a letter with digital wax that only opens on an
                        upcoming anniversary, birthday, or milestone.
                      </p>
                      {scheduleUnseal && (
                        <div className="mt-3 ml-6">
                          <input
                            type="date"
                            value={unsealDate}
                            onChange={(e) => setUnsealDate(e.target.value)}
                            min={format(
                              new Date(Date.now() + 86400000),
                              "yyyy-MM-dd"
                            )}
                            max={format(
                              new Date(Date.now() + 10 * 365 * 86400000),
                              "yyyy-MM-dd"
                            )}
                            className="input-warm w-full text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Delivery Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Option 1: Secret Link */}
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="p-4 rounded-2xl border border-[var(--border-warm)] bg-white/80 hover:bg-white text-left transition-all shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-[var(--ink-dark)] flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-rose-600" />
                        <span>Copy Secret Link</span>
                      </span>
                      {copiedLink ? (
                        <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Copied!
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[var(--ink-light)] group-hover:text-[var(--seal-red)]">
                          Click to copy
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ink-mid)] font-sans">
                      Anyone with this secret link can open, break the wax seal, and read your letter.
                    </p>
                  </button>

                  {/* Option 2: Download Keepsake Image */}
                  <button
                    type="button"
                    onClick={handleExportPNG}
                    disabled={isExporting}
                    className="p-4 rounded-2xl border border-[var(--border-warm)] bg-white/80 hover:bg-white text-left transition-all shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-[var(--ink-dark)] flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-amber-600" />
                        <span>Download Keepsake PNG</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--ink-light)]">
                        {isExporting ? "Rendering..." : "300 DPI"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-mid)] font-sans">
                      Generate an authentic high-resolution calligraphy letter image to save or print.
                    </p>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-secondary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    ← Back
                  </button>

                  {pair ? (
                    <button
                      onClick={handleSend}
                      disabled={sending || !toName.trim()}
                      className="btn-primary py-2.5 px-8 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Send to Partner 💌"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleCopyShareLink}
                      className="btn-primary py-2.5 px-8 text-[10px] uppercase tracking-widest cursor-pointer"
                    >
                      {copiedLink ? "✓ Link Copied!" : "Copy Unlisted Link 💌"}
                    </button>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 36 }}
                className="bg-[var(--bg)] rounded-3xl max-w-sm w-full max-h-[70vh] flex flex-col border border-[var(--border-mid)] overflow-hidden shadow-2xl"
              >
                <div className="p-4 border-b border-[var(--border-mid)] flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--ink-dark)]">
                    Pick a sticker
                  </p>
                  <button
                    onClick={() => setGalleryOpen(false)}
                    className="p-1.5 rounded-lg text-[var(--ink-mid)] hover:bg-[var(--muted)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-4 py-2.5 border-b border-[var(--border-mid)]">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQ}
                      onChange={(e) => {
                        setSearchQ(e.target.value);
                        searchStickers(e.target.value);
                      }}
                      placeholder="Search..."
                      className="w-full pl-8 pr-4 py-2 border border-[var(--border-mid)] bg-[var(--muted)] rounded-xl text-xs focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--ink-light)]" />
                  </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {searching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--ink-light)]" />
                    </div>
                  ) : stickers.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {stickers.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setBlocks([
                              ...blocks,
                              { type: "cat", giphy_id: s.id },
                            ]);
                            setGalleryOpen(false);
                          }}
                          className="rounded-xl border border-[var(--border-mid)] bg-white dark:bg-[var(--muted)] p-1 cursor-pointer hover:scale-105 transition-all h-20 flex items-center justify-center"
                        >
                          <img
                            src={
                              s.images?.fixed_height_small?.url ||
                              s.images?.fixed_height?.url
                            }
                            alt="Sticker"
                            className="max-h-16 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-[var(--ink-light)] text-center py-8">
                      No stickers found
                    </p>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-[var(--border-mid)] text-center">
                  <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)]">
                    Powered by GIPHY
                  </span>
                </div>
              </motion.div>
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

  // READ: The paper & interactive unsealing
  if (activeLetter) {
    const cfg = STYLES[activeLetter.envelope_style] || STYLES.classic;
    const bg = candle
      ? "linear-gradient(160deg,#110C06,#1A1208)"
      : "var(--bg)";

    return (
      <div className="relative min-h-screen" style={{ background: bg }}>
        {/* Back navigation */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => {
            setActiveLetter(null);
            setReadPhase("sealed");
            setRevealCount(0);
            fetchLetters();
          }}
          className="fixed top-5 left-5 z-50 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-colors px-3 py-2 rounded-full backdrop-blur-sm"
          style={{
            color: candle
              ? "rgba(245,210,150,0.6)"
              : "var(--ink-light)",
            background: candle
              ? "rgba(30,18,8,0.6)"
              : "rgba(250,246,238,0.8)",
          }}
        >
          <ArrowLeft className="w-3 h-3" /> Inbox
        </motion.button>

        {/* Toggles: only visible when unsealed */}
        {readPhase === "open" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm"
            style={{
              background: candle
                ? "rgba(30,18,8,0.6)"
                : "rgba(250,246,238,0.8)",
            }}
          >
            {[
              {
                emoji: "🕯️",
                active: candle,
                toggle: () => setCandle((p) => !p),
                title: "Candlelight",
              },
              {
                emoji: "⌨️",
                active: typewriter,
                toggle: () => setTypewriter((p) => !p),
                title: "Typewriter",
              },
            ].map((t, i) => (
              <button
                key={i}
                onClick={t.toggle}
                title={t.title}
                className={`text-sm cursor-pointer transition-opacity ${
                  t.active ? "opacity-100" : "opacity-35 hover:opacity-60"
                }`}
              >
                {t.emoji}
              </button>
            ))}
            {typewriter && (
              <button
                onClick={() => setTypeSound((p) => !p)}
                title="Typewriter sound"
                className={`text-sm cursor-pointer transition-opacity ${
                  typeSound ? "opacity-100" : "opacity-35 hover:opacity-60"
                }`}
              >
                🔊
              </button>
            )}
          </motion.div>
        )}

        <main className="flex items-start justify-center min-h-screen pt-14 px-5 pb-24">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {/* SEALED, SHATTERING & UNSEALING: Physical Envelope Flap & Paper Rise */}
              {(readPhase === "sealed" ||
                readPhase === "shattering" ||
                readPhase === "unsealing") && (
                <motion.div
                  key="sealed-stage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -16 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center justify-center min-h-[75vh] gap-8"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]"
                  >
                    A handwritten letter awaits you
                  </motion.p>

                  {/* 3D Envelope Container with Perspective */}
                  <div className="relative w-full" style={{ perspective: 1200 }}>
                    <motion.div
                      className="relative w-full rounded-3xl paper-grain"
                      style={{
                        background: cfg.bg,
                        aspectRatio: "1.42 / 1",
                        boxShadow:
                          "0 24px 64px -8px rgba(60,38,18,0.24),0 4px 12px rgba(60,38,18,0.1)",
                        border: "1px solid rgba(196,168,130,0.3)",
                      }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: 0.15,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {/* 1. Folded Parchment Letter Sheet rising out of the envelope */}
                      <motion.div
                        className="absolute inset-x-5 top-5 bottom-5 rounded-2xl paper-grain p-5 shadow-md border border-[rgba(196,168,130,0.4)] flex flex-col justify-between overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(180deg, #FFFDF7 0%, #F8F2E4 100%)",
                          zIndex: 12,
                        }}
                        initial={{ y: 0, opacity: 0.9 }}
                        animate={
                          readPhase === "unsealing"
                            ? {
                                y: -125,
                                scale: 1.03,
                                opacity: 1,
                                boxShadow:
                                  "0 24px 48px -6px rgba(60,38,18,0.32)",
                              }
                            : { y: 0, opacity: 0.9 }
                        }
                        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-[rgba(196,168,130,0.3)] pb-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-widest text-[#9A876A]">
                              Personal & Confidential
                            </span>
                            <span className="text-xs">💌</span>
                          </div>
                          <p className="font-handwriting text-lg font-bold text-[#4A3A28]">
                            Dearest {activeLetter.recipient_name},
                          </p>
                          <div className="space-y-2 pt-1">
                            <div className="h-1.5 w-3/4 rounded-full bg-[rgba(196,168,130,0.35)]" />
                            <div className="h-1.5 w-5/6 rounded-full bg-[rgba(196,168,130,0.25)]" />
                            <div className="h-1.5 w-2/3 rounded-full bg-[rgba(196,168,130,0.2)]" />
                          </div>
                        </div>
                        <div className="text-right pt-2 border-t border-[rgba(196,168,130,0.2)]">
                          <span className="font-handwriting text-sm text-[#6B573E]">
                            With love, {activeLetter.sender_name}
                          </span>
                        </div>
                      </motion.div>

                      {/* 2. Physical Envelope Pocket Folds (sides and bottom) */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: 18 }}
                      >
                        <EnvelopePocketFolds dark={cfg.foldDark} />
                      </div>

                      <Sprig className="absolute -top-2 right-4 w-10 h-14 opacity-60 pointer-events-none z-20" />

                      {/* 3. To address */}
                      <div
                        className="absolute top-5 left-6 space-y-0.5"
                        style={{ zIndex: 22 }}
                      >
                        <p
                          className="text-[7px] font-mono uppercase tracking-widest"
                          style={{
                            color: cfg.foldDark
                              ? "rgba(255,255,255,0.35)"
                              : "#9A876A",
                          }}
                        >
                          To
                        </p>
                        <p
                          className="font-handwriting text-lg font-semibold"
                          style={{
                            color: cfg.foldDark
                              ? "rgba(255,255,255,0.8)"
                              : "#4A3A28",
                          }}
                        >
                          {activeLetter.recipient_name}
                        </p>
                      </div>

                      {/* 4. From address */}
                      <div
                        className="absolute bottom-5 right-6 space-y-0.5 text-right"
                        style={{ zIndex: 22 }}
                      >
                        <p
                          className="text-[7px] font-mono uppercase tracking-widest"
                          style={{
                            color: cfg.foldDark
                              ? "rgba(255,255,255,0.35)"
                              : "#9A876A",
                          }}
                        >
                          From
                        </p>
                        <p
                          className="font-handwriting text-base font-semibold"
                          style={{
                            color: cfg.foldDark
                              ? "rgba(255,255,255,0.8)"
                              : "#4A3A28",
                          }}
                        >
                          {activeLetter.sender_name}
                        </p>
                      </div>

                      {/* 5. 3D Top Triangular Flap */}
                      <motion.div
                        className="absolute inset-x-0 top-0 h-[50%] pointer-events-none"
                        style={{
                          transformOrigin: "top center",
                          transformStyle: "preserve-3d",
                          zIndex: readPhase === "unsealing" ? 8 : 26,
                        }}
                        initial={{ rotateX: 0 }}
                        animate={
                          readPhase === "unsealing"
                            ? { rotateX: 180 }
                            : { rotateX: 0 }
                        }
                        transition={{
                          duration: 0.8,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <EnvelopeTopFlap dark={cfg.foldDark} />
                      </motion.div>

                      {/* 6. Wax Seal Button */}
                      {readPhase !== "unsealing" && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ zIndex: 30 }}
                        >
                          <WaxSealButton
                            onPress={breakSeal}
                            shattering={readPhase === "shattering"}
                          />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  <motion.p
                    key={readPhase}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]"
                  >
                    {readPhase === "sealed" && "Tap the seal to break and open"}
                    {readPhase === "shattering" && "Breaking wax seal..."}
                    {readPhase === "unsealing" && "Unfolding letter..."}
                  </motion.p>
                </motion.div>
              )}

              {/* OPEN: The unfolded letter */}
              {readPhase === "open" && (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={`relative rounded-3xl overflow-hidden ${
                      candle ? "animate-candle-flicker" : ""
                    }`}
                    style={{
                      background: candle
                        ? "linear-gradient(160deg,#1C1208,#221608)"
                        : "linear-gradient(180deg,#FFFDF5 0%,#FAF4E8 100%)",
                      border: candle
                        ? "1px solid #3A2810"
                        : "1px solid var(--border-warm)",
                      boxShadow: candle
                        ? "0 0 80px 20px rgba(200,120,30,0.06)"
                        : "0 12px 48px rgba(60,40,20,0.1),0 2px 8px rgba(60,40,20,0.06)",
                      backgroundImage: candle
                        ? undefined
                        : "linear-gradient(180deg,#FFFDF5 0%,#FAF4E8 100%),linear-gradient(transparent calc(32px - 1px),rgba(196,168,130,0.2) calc(32px - 1px),rgba(196,168,130,0.2) 32px,transparent 32px)",
                      backgroundSize: candle ? undefined : "100%,100% 32px",
                    }}
                  >
                    {!candle && (
                      <>
                        <div
                          className="absolute top-3 right-5 w-12 h-4 pointer-events-none"
                          style={{
                            background: "var(--washi-warm)",
                            transform: "rotate(-2deg)",
                          }}
                        />
                        <Sprig className="absolute bottom-4 right-4 w-10 h-16 opacity-35 pointer-events-none" />
                      </>
                    )}

                    <div className="p-8 md:p-12 space-y-6">
                      <div
                        className="flex justify-between text-xs font-handwriting"
                        style={{
                          color: candle
                            ? "rgba(245,210,150,0.5)"
                            : "var(--ink-light)",
                        }}
                      >
                        <span>To: {activeLetter.recipient_name}</span>
                        <span>
                          {format(
                            parseISO(activeLetter.sent_at),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </div>

                      <div className="space-y-5">
                        {Array.isArray(activeLetter.content) ? (
                          activeLetter.content.map(
                            (block: any, idx: number) => {
                              if (revealCount <= idx) return null;
                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  {block.type === "text" ? (
                                    <p
                                      className="text-base leading-8 whitespace-pre-wrap"
                                      style={{
                                        fontFamily:
                                          "var(--font-handwriting),cursive",
                                        color: candle
                                          ? "rgba(245,210,150,0.88)"
                                          : "var(--ink-dark)",
                                      }}
                                    >
                                      {typewriter ? (
                                        <TypewriterText
                                          text={block.value || ""}
                                          sound={typeSound}
                                        />
                                      ) : (
                                        block.value || ""
                                      )}
                                    </p>
                                  ) : (
                                    <div className="rounded-xl overflow-hidden border border-[var(--border-warm)] max-w-xs p-2 bg-white/60">
                                      <GiphyRenderer
                                        giphyId={block.giphy_id}
                                      />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            }
                          )
                        ) : (
                          <p
                            className="text-base leading-8 whitespace-pre-wrap font-handwriting"
                            style={{
                              color: candle
                                ? "rgba(245,210,150,0.88)"
                                : "var(--ink-dark)",
                            }}
                          >
                            {typeof activeLetter.content === "string"
                              ? activeLetter.content
                              : "A handwritten letter for you ♡"}
                          </p>
                        )}
                      </div>

                      {revealCount > (activeLetter.content?.length || 0) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="border-t pt-6 space-y-5"
                          style={{
                            borderColor: candle
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(196,168,130,0.3)",
                          }}
                        >
                          <p
                            className="text-right text-xl font-handwriting"
                            style={{
                              color: candle
                                ? "rgba(245,210,150,0.9)"
                                : "var(--ink-dark)",
                            }}
                          >
                            With love, {activeLetter.sender_name}
                          </p>

                          {/* Action Bar */}
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                            <button
                              onClick={handleExportPNG}
                              disabled={isExporting}
                              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-mono font-medium border border-[var(--border-warm)] bg-white/80 hover:bg-white text-[var(--ink-dark)] cursor-pointer transition-all shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {isExporting ? "Saving..." : "Download Keepsake"}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                setIsWriting(true);
                                setStep(1);
                                setToName(activeLetter.sender_name || "");
                                setBlocks([{ type: "text", value: "" }]);
                                setActiveLetter(null);
                              }}
                              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-mono font-medium text-white cursor-pointer transition-all shadow-xs"
                              style={{ background: "var(--seal-red)" }}
                            >
                              <Heart className="w-3.5 h-3.5" />
                              <span>Write a Reply</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // INBOX: The unread letter card and archives
  const unread = lettersList.filter(
    (l) => l.sender_id !== user?.id && !l.is_opened
  );
  const read = lettersList.filter(
    (l) => !(l.sender_id !== user?.id && !l.is_opened)
  );

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <Navigation />
      <main className="max-w-lg mx-auto px-5 py-20 pb-36">
        {/* Top Mode Toggle: Letters & Bouquets */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-[var(--paper-mid)] border border-[var(--border-warm)] shadow-xs">
            <span className="px-4 py-1.5 rounded-xl text-xs font-medium bg-white text-[var(--ink-dark)] shadow-xs font-mono">
              💌 Love Letters
            </span>
            <Link
              href="/bouquet"
              className="px-4 py-1.5 rounded-xl text-xs font-medium text-[var(--ink-light)] hover:text-[var(--ink-dark)] transition-all flex items-center gap-1.5 font-mono"
            >
              <span>💐</span>
              <span>Digital Bouquets</span>
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">
              Keepsakes
            </p>
            <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)] mt-0.5">
              Letters
            </h1>
          </div>
          <button
            onClick={() => {
              setIsWriting(true);
              setStep(1);
            }}
            className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer"
          >
            Write
          </button>
        </motion.div>

        {/* If unpaired, show friendly prompt with write action */}
        {!pair ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 flex flex-col items-center gap-5 border border-[var(--border-warm)] rounded-3xl p-6 bg-white/60 paper-grain"
          >
            <WritingLetters className="w-44 h-44 rounded-3xl" />
            <div className="space-y-2 max-w-sm">
              <h2 className="font-display italic text-2xl text-[var(--ink-dark)]">
                Wax-Sealed Love Letters
              </h2>
              <p className="text-xs text-[var(--ink-mid)] font-sans">
                Write heartfelt handwritten letters on vintage parchment, seal them with wax, and share secret unlisted links. Connect your partner to save directly to each other is inboxes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setIsWriting(true);
                  setStep(1);
                }}
                className="btn-primary py-2.5 px-6 text-xs uppercase font-mono tracking-wider cursor-pointer"
              >
                Write a Letter
              </button>
              <Link
                href="/dashboard"
                className="btn-secondary py-2.5 px-6 text-xs uppercase font-mono tracking-wider"
              >
                Connect Partner
              </Link>
            </div>
          </motion.div>
        ) : lettersList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 flex flex-col items-center gap-5"
          >
            <WritingLetters className="w-48 h-48 rounded-3xl" />
            <div>
              <p className="font-display italic text-2xl text-[var(--ink-mid)] mb-2">
                The box is empty.
              </p>
              <p className="text-[10px] font-mono text-[var(--ink-light)]">
                Write the first letter to your partner.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <WritingLetters className="w-44 h-44 rounded-3xl" />
            </motion.div>

            <div className="space-y-3">
              {unread.map((l, i) => {
                const isLocked =
                  l.unseal_at && new Date(l.unseal_at) > new Date();
                return (
                  <motion.button
                    key={l.id}
                    onClick={() => !isLocked && handleUnseal(l)}
                    className={`w-full text-left cursor-pointer ${
                      isLocked ? "opacity-80" : ""
                    }`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={!isLocked ? { y: -2 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                  >
                    <div
                      className="relative material-cotton rounded-2xl px-6 py-5"
                      style={{
                        boxShadow:
                          "0 4px 20px rgba(128,32,48,0.1), 0 1px 4px rgba(60,40,20,0.06)",
                      }}
                    >
                      {!isLocked && (
                        <motion.div
                          className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--seal-red)] flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        </motion.div>
                      )}
                      <div className="flex items-center gap-4 pr-8">
                        <div className="w-10 h-10 rounded-xl bg-[var(--paper-mid)] border border-[var(--border-warm)] flex items-center justify-center flex-shrink-0">
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-[var(--ink-mid)]" />
                          ) : (
                            <Gift className="w-4 h-4 text-[var(--seal-red)]" />
                          )}
                        </div>
                        <div>
                          <p className="font-heading italic font-bold text-base text-[var(--ink-dark)]">
                            From {l.sender_name}
                          </p>
                          {isLocked ? (
                            <p className="text-[9px] font-mono mt-0.5 text-[var(--seal-red)]">
                              Unseals on{" "}
                              {format(
                                parseISO(l.unseal_at),
                                "MMMM d, yyyy"
                              )}
                            </p>
                          ) : (
                            <p className="text-[9px] font-mono text-[var(--ink-light)] mt-0.5">
                              {format(
                                parseISO(l.sent_at),
                                "MMMM d, yyyy"
                              )}{" "}
                              · Sealed
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {unread.length > 0 && read.length > 0 && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-[var(--border-mid)]" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)]">
                    Earlier
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-mid)]" />
                </div>
              )}

              {read.map((l, i) => (
                <motion.button
                  key={l.id}
                  onClick={() => handleUnseal(l)}
                  className="w-full text-left cursor-pointer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (unread.length + i) * 0.07 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4 material-cotton rounded-2xl px-5 py-4 transition-colors hover:bg-[var(--paper-warm)]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--border-mid)] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[var(--ink-mid)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--ink-dark)]">
                        {l.sender_id === user?.id
                          ? `To ${l.recipient_name}`
                          : `From ${l.sender_name}`}
                      </p>
                      <p className="text-[9px] font-mono text-[var(--ink-light)] mt-0.5">
                        {format(parseISO(l.sent_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
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
