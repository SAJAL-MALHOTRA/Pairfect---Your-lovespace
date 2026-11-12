"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Camera,
  Heart,
  Mail,
  BookOpen,
  Sparkles,
  Flame,
  Palette,
  Gamepad2,
  Clock,
  HelpCircle,
  MapPin,
  Film,
  Zap,
  Scale,
  X,
  Eye,
  Maximize2,
  ArrowRight,
  Key,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import PushOptInBanner from "@/components/push-opt-in-banner";
import MeanwhileCard from "@/components/meanwhile-card";
import CitySelectorModal from "@/components/city-selector-modal";
import { useSubscription } from "@/hooks/use-subscription";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import { RecoveryPhraseModal } from "@/components/vault/recovery-phrase-modal";

interface MemoryKeepsake {
  id: string;
  type: "polaroid" | "photostrip";
  title: string;
  caption: string;
  date: string;
  images: string[];
  rotation: number;
}

const SAMPLE_MEMORIES: MemoryKeepsake[] = [
  {
    id: "mem-1",
    type: "polaroid",
    title: "Golden Hour Glow",
    caption: "The evening we forgot to look at our phones",
    date: "May 14",
    images: ["/polaroid-memories.jpg"],
    rotation: -3,
  },
  {
    id: "mem-2",
    type: "photostrip",
    title: "Photobooth Smiles",
    caption: "Three takes to get our favorite silly face",
    date: "June 2",
    images: [
      "/booth/couple-heart.jpg",
      "/booth/couple-peace.jpg",
      "/booth/couple-cozy.jpg",
    ],
    rotation: 2.5,
  },
  {
    id: "mem-3",
    type: "polaroid",
    title: "Cozy Blanket Fort",
    caption: "Popcorn, rain on the glass, zero plans",
    date: "July 19",
    images: ["/cozy-movie-night.jpg"],
    rotation: -1.5,
  },
];

export default function DashboardPage() {
  const { user, profile, pair, partner, loading, refreshSession } = useAuth();
  const { isPlus, isTrial, daysRemaining } = useSubscription();

  const [momentsCount, setMomentsCount] = useState(0);
  const [lettersCount, setLettersCount] = useState(0);
  const [gratitudeCount, setGratitudeCount] = useState(0);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [hasRecoveryEnvelope, setHasRecoveryEnvelope] = useState<boolean | null>(null);
  const [dismissBanner, setDismissBanner] = useState(false);

  // Today Question 3D Tilt & Mascot Cheer
  const bannerRef = useRef<HTMLDivElement>(null);
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useSpring(useTransform(cardY, [-0.5, 0.5], [6, -6]), {
    stiffness: 320,
    damping: 26,
  });
  const rotateY = useSpring(useTransform(cardX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 320,
    damping: 26,
  });
  const [isMascotExcited, setIsMascotExcited] = useState(false);
  const [heartsBurst, setHeartsBurst] = useState<number[]>([]);

  // Interactive Memories Preview Modal State
  const [selectedMemory, setSelectedMemory] = useState<MemoryKeepsake | null>(null);

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  useEffect(() => {
    if (!pair || loading) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/dashboard-summary");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data.counts) {
          setLettersCount(data.counts.letters || 0);
          setMomentsCount(data.counts.moments || 0);
          setGratitudeCount(data.counts.gratitude || 0);
        }
      } catch {
        // Silently handle summary fetch error
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pair, loading]);

  const checkRecoveryStatus = async () => {
    if (!pair?.id || pair.status !== "active") return;
    try {
      const res = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pair.id)}&type=recovery`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHasRecoveryEnvelope(!!data.envelope);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (!pair?.id || pair.status !== "active") return;
    try {
      const isDismissed = localStorage.getItem(`pairfect_dismiss_recovery_banner_${pair.id}`);
      if (isDismissed === "true") {
        setDismissBanner(true);
      }
    } catch {}
    checkRecoveryStatus();
  }, [pair?.id, pair?.status]);

  // Handle ESC key to dismiss memory preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMemory(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const streakWeeks = Math.max(0, Math.floor((pair?.current_streak || 0) / 7));

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardX.set(x);
    cardY.set(y);
  };

  const handleBannerMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
    setIsMascotExcited(false);
  };

  const triggerMascotCheer = () => {
    setIsMascotExcited(true);
    setHeartsBurst((prev) => [...prev, Date.now()]);
    setTimeout(() => {
      setHeartsBurst((prev) => prev.slice(1));
    }, 1200);
  };

  const partnerDisplayName = partner?.display_name || "Partner";

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Main Content Area with Desktop Sidebar Offset */}
      <div className="lg:pl-60 xl:pl-64 min-h-screen pt-18 pb-10 sm:py-10 px-4 sm:px-8 flex justify-center">
        <main className="w-full max-w-5xl space-y-8 select-none pb-24">
          <PushOptInBanner />

          {/* Couple Vault Recovery Backup Migration Banner */}
          {pair?.status === "active" && hasRecoveryEnvelope === false && !dismissBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm text-stone-900">
                      Back up your couple vault
                    </h3>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed max-w-xl font-sans">
                    Set up your 12-word recovery phrase so you can safely restore your encrypted photos and memories if you switch devices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRecoveryModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-heading font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Set up phrase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDismissBanner(true);
                    if (pair?.id && typeof window !== "undefined") {
                      try {
                        localStorage.setItem(`pairfect_dismiss_recovery_banner_${pair.id}`, "true");
                      } catch {}
                    }
                  }}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-amber-100/50 transition-colors cursor-pointer"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              1. TOP HEADER: GREETING & DATE + LIVE PARTNER PRESENCE
              ══════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-stone-900 tracking-tight">
                {profile?.display_name ? `Hi ${profile.display_name}` : "Hi there"}
              </h1>
              <p className="text-xs sm:text-sm font-mono text-stone-500 mt-1">
                {todayFormatted}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-600 shadow-2xs transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>

              {/* Partner Avatar Ring with Animated Breathing Halo Pulse */}
              <div
                className="relative flex items-center group cursor-pointer"
                title={`${partnerDisplayName} is connected`}
              >
                {/* Multi-layered breathing halo pulse */}
                <motion.span
                  className="absolute -inset-1.5 rounded-full bg-emerald-400/35 pointer-events-none"
                  animate={{
                    scale: [1, 1.35, 1],
                    opacity: [0.8, 0.15, 0.8],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.span
                  className="absolute -inset-3 rounded-full bg-rose-400/20 pointer-events-none"
                  animate={{
                    scale: [1, 1.55, 1],
                    opacity: [0.55, 0.05, 0.55],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.45,
                  }}
                />

                <Link
                  href="/profile"
                  className="relative w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden bg-rose-100 flex items-center justify-center font-bold text-rose-600 text-sm shadow-2xs hover:scale-105 transition-transform"
                >
                  <Image
                    src="/booth/couple-peace.jpg"
                    alt={partnerDisplayName}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </Link>

                {/* Connected indicator beacon */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>

                {/* Subtle Hover Tooltip */}
                <div className="absolute right-0 top-12 px-2.5 py-1 rounded-lg bg-stone-900/90 text-white text-[11px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md">
                  {partner?.display_name ? `${partner.display_name} is connected ♡` : "Live partner presence active"}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              2. TOP 3 STAT CARDS ROW
              ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Card 1: Activities Tried */}
            <Link
              href="/play"
              className="md:col-span-3 p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-black text-2xl text-stone-900 leading-none">
                  1 <span className="text-xs text-stone-400 font-mono font-normal">of 22</span>
                </p>
                <p className="text-[11px] font-mono text-stone-500 mt-1 uppercase tracking-wider">
                  Tried
                </p>
              </div>
            </Link>

            {/* Card 2: Green Streak Card with CoupleBeansMascot & Spring Physics */}
            <motion.div
              onClick={() => setIsPaywallOpen(true)}
              whileHover={{ scale: 1.025, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="md:col-span-6 p-5 sm:p-6 rounded-3xl bg-[#22C55E] text-white shadow-md flex items-center justify-between gap-4 relative overflow-hidden cursor-pointer group"
              role="button"
              tabIndex={0}
              aria-label="Open Plus upgrade options"
            >
              <div className="space-y-1.5 z-10">
                <div className="flex items-center gap-2 font-heading font-black text-2xl sm:text-3xl">
                  {/* Lightning bolt with gentle pulsing glow */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      filter: [
                        "drop-shadow(0 0 2px rgba(255,255,255,0.4))",
                        "drop-shadow(0 0 10px rgba(255,255,255,0.95))",
                        "drop-shadow(0 0 2px rgba(255,255,255,0.4))",
                      ],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="shrink-0"
                  >
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white" />
                  </motion.div>
                  <span>{streakWeeks} Week streak</span>
                </div>
                <p className="text-xs font-sans text-emerald-50 leading-snug max-w-xs">
                  Make a strip or play a game together to start one
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-100 bg-white/15 hover:bg-white/25 px-2.5 py-0.5 rounded-full transition-colors">
                  <Sparkles className="w-3 h-3 text-yellow-200" />
                  <span>Tap to explore Plus perks</span>
                </div>
              </div>

              {/* Signature Hugging Mascot with organic breathing and swaying motion */}
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [-2, 2, -2],
                  scale: [1, 1.025, 1],
                }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 shrink-0 -mr-2"
              >
                <CoupleBeansMascot className="w-24 h-18 sm:w-28 sm:h-20" />
              </motion.div>

              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-90" />
            </motion.div>

            {/* Card 3: Photo Strips */}
            <Link
              href="/photo-booth"
              className="md:col-span-3 p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-500 shrink-0 group-hover:scale-105 transition-transform">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-black text-2xl text-stone-900 leading-none">
                  {momentsCount}
                </p>
                <p className="text-[11px] font-mono text-stone-500 mt-1 uppercase tracking-wider">
                  Photo strips
                </p>
              </div>
            </Link>

          </div>

          {/* ══════════════════════════════════════════════════
              3. TODAY'S QUESTION BANNER (CORAL GRADIENT WITH 3D TILT & EXCITED MASCOT)
              ══════════════════════════════════════════════════ */}
          <motion.div
            ref={bannerRef}
            onMouseMove={handleBannerMouseMove}
            onMouseLeave={handleBannerMouseLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              perspective: 1000,
            }}
            className="rounded-3xl bg-gradient-to-r from-[#E11D48] via-[#F43F5E] to-[#FB7185] text-white p-6 sm:p-8 shadow-md relative overflow-hidden transition-shadow duration-300 hover:shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              
              <div className="space-y-3 max-w-xl">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs font-mono text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Today&apos;s question
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs font-mono text-xs font-bold text-white">
                    Honest
                  </span>
                </div>

                {/* Question with Shimmer Sweep on load */}
                <div className="relative overflow-hidden inline-block pr-2">
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-white leading-snug">
                    What do you wish I understood without you having to explain it?
                  </h2>
                  {/* Subtle shimmer sweep across the question text */}
                  <motion.div
                    className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                    initial={{ x: "-120%" }}
                    animate={{ x: "220%" }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      repeatDelay: 3.5,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Subtext with Live Partner Presence Indicator */}
                <div className="flex items-center gap-2.5 text-xs font-sans text-rose-100">
                  <div className="relative flex items-center justify-center">
                    <motion.span
                      className="absolute -inset-1 rounded-full bg-white/40 pointer-events-none"
                      animate={{
                        scale: [1, 1.45, 1],
                        opacity: [0.7, 0.1, 0.7],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="w-5 h-5 rounded-full bg-white/30 backdrop-blur-xs border border-white/60 flex items-center justify-center text-[10px] font-bold text-white relative z-10">
                      {partner?.display_name ? partner.display_name.charAt(0).toUpperCase() : "♥"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white shadow-xs" />
                  </div>
                  <span className="font-medium">
                    {partner?.display_name ? `Connected with ${partner.display_name}` : "Connected and waiting for partner"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-[10px] font-mono text-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Live
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/checkin"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    Answer
                  </Link>
                  <span className="text-xs font-mono text-rose-100 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> New card in 12h 35m
                  </span>
                </div>
              </div>

              {/* Mascot Beans holding card: Blushes and raises card on hover or click */}
              <div
                className="shrink-0 flex justify-center md:justify-end cursor-pointer select-none group"
                onMouseEnter={() => setIsMascotExcited(true)}
                onMouseLeave={() => setIsMascotExcited(false)}
                onClick={triggerMascotCheer}
                role="button"
                tabIndex={0}
                aria-label="Interactive couple mascot"
              >
                <div className="relative">
                  {/* Soft rosy blush background glow */}
                  <motion.div
                    className="absolute -inset-4 rounded-full bg-rose-300/40 blur-xl pointer-events-none"
                    animate={{
                      scale: isMascotExcited ? 1.45 : 0.85,
                      opacity: isMascotExcited ? 0.95 : 0.2,
                    }}
                    transition={{ type: "spring", stiffness: 320, damping: 25 }}
                  />

                  {/* Mascot body with spring bounce & blush tilt */}
                  <motion.div
                    animate={
                      isMascotExcited
                        ? { scale: 1.08, y: -8, rotate: [-2, 2, -2, 0] }
                        : { scale: 1, y: 0, rotate: 0 }
                    }
                    transition={{ type: "spring", stiffness: 360, damping: 22 }}
                  >
                    <CoupleBeansMascot className="w-32 h-24 sm:w-36 sm:h-28" />
                  </motion.div>

                  {/* Raised Question Card */}
                  <motion.div
                    className="absolute -top-2 -right-1 w-10 h-13 bg-white rounded-lg shadow-xl border border-rose-200 flex flex-col items-center justify-center text-rose-500 font-bold text-xs select-none"
                    animate={
                      isMascotExcited
                        ? { y: -16, rotate: 16, scale: 1.2 }
                        : { y: 0, rotate: 6, scale: 1 }
                    }
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                  >
                    <span className="text-sm leading-none">♥</span>
                    <span className="text-[9px] font-mono tracking-tighter text-rose-400 font-black mt-0.5">
                      ASK
                    </span>
                  </motion.div>

                  {/* Heart burst sparkles on click/hover */}
                  <AnimatePresence>
                    {heartsBurst.map((id) => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 1, scale: 0.4, y: 0 }}
                        animate={{ opacity: 0, scale: 1.4, y: -40 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none text-rose-100"
                      >
                        <span className="text-base">💖</span>
                        <span className="text-xs">✨</span>
                        <span className="text-sm">🌸</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Hint tooltip */}
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-rose-100/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to cheer
                  </span>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              4. OUR WEEK & OUR MOMENTS SPLIT ROW
              ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Card: Our week */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-black text-base text-stone-900">
                  Our week
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> strips
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> games
                  </span>
                </div>
              </div>

              <div>
                <p className="font-heading font-black text-3xl text-stone-900">
                  0 <span className="text-sm font-sans font-normal text-stone-500">moments together</span>
                </p>
                <p className="text-xs font-sans text-stone-500 mt-1">
                  Your week starts with one game.
                </p>
              </div>

              {/* Day of week track */}
              <div className="flex items-center justify-between pt-2 px-2 text-center font-mono text-xs text-stone-400 font-bold">
                {["W", "T", "F", "S", "S", "M", "T"].map((day, idx) => (
                  <div key={idx} className="space-y-1.5 flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full ${idx === 6 ? "bg-rose-500" : "bg-stone-200"}`} />
                    <span className={idx === 6 ? "text-rose-600 font-black" : ""}>{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Our moments */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-stone-900">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Our moments</span>
              </div>

              <div className="space-y-2">
                <p className="font-heading font-black text-base text-stone-900">
                  Moments, just for two
                </p>
                <p className="text-xs font-sans text-stone-500 leading-relaxed">
                  Sign in, then connect with your partner to send each other moments.
                </p>
              </div>

              <div>
                {!user ? (
                  <Link
                    href="/login"
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-sky-500 hover:opacity-95 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Sign in</span>
                  </Link>
                ) : (
                  <Link
                    href="/moments"
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>View moments</span>
                  </Link>
                )}
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════
              5. JUMP IN QUICK ACTIONS ROW
              ══════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
                JUMP IN
              </p>
              <Link href="/play" className="text-xs font-mono font-bold text-rose-500 hover:text-rose-600">
                Edit
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { name: "Photobooth", href: "/photo-booth", icon: Camera, bg: "bg-rose-50 border-rose-200 text-rose-500" },
                { name: "Know Me", href: "/play/love-match", icon: HelpCircle, bg: "bg-blue-50 border-blue-200 text-blue-500" },
                { name: "Draw", href: "/play", icon: Palette, bg: "bg-indigo-50 border-indigo-200 text-indigo-500" },
                { name: "Arcade", href: "/play", icon: Gamepad2, bg: "bg-purple-50 border-purple-200 text-purple-500" },
                { name: "Truth or Dare", href: "/roulette", icon: Flame, bg: "bg-pink-50 border-pink-200 text-pink-500" },
                { name: "Court", href: "/vibe-judge", icon: Scale, bg: "bg-amber-50 border-amber-200 text-amber-500" },
              ].map((act, idx) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={idx}
                    href={act.href}
                    className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-900 transition-all flex flex-col items-center justify-center text-center gap-2 group shadow-2xs cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-2xl border ${act.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-heading font-bold text-xs text-stone-900">
                      {act.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              6. WHICH GAME SHOULD WE MAKE NEXT? VOTING ROW
              ══════════════════════════════════════════════════ */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-stone-900">
                  Which game should we make next?
                </h3>
                <p className="text-xs text-stone-500">
                  Tap the ones you&apos;d play together.
                </p>
              </div>
              <Link href="/play" className="text-xs font-mono font-bold text-rose-500 hover:text-rose-600">
                See all &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: "Photobooth date", src: "/booth/couple-heart.jpg" },
                { title: "Airport reunion", src: "/booth/couple-reunion.jpg" },
                { title: "Cozy cafe morning", src: "/booth/couple-cozy.jpg" },
                { title: "Late night laughter", src: "/booth/couple-peace.jpg" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 hover:border-stone-900 transition-all group cursor-pointer"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-200">
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2.5 text-center">
                    <p className="font-heading font-bold text-xs text-stone-900 truncate">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              7. YOUR MEMORIES ROW: INTERACTIVE POLAROIDS & PHOTOSTRIPS
              ══════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
                  YOUR MEMORIES
                </p>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-mono font-bold">
                  Interactive keepsakes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/photo-booth"
                  className="text-xs font-mono font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  + New strip
                </Link>
                <Link
                  href="/moments"
                  className="text-xs font-mono font-bold text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Scrapbook &gt;
                </Link>
              </div>
            </div>

            {/* Keepsakes Row with Spring Physics Tilt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              
              {/* Polaroid 1: Golden Hour */}
              <motion.div
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  rotate: 0,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                style={{ rotate: SAMPLE_MEMORIES[0].rotation }}
                onClick={() => setSelectedMemory(SAMPLE_MEMORIES[0])}
                className="cursor-pointer group relative bg-white p-3.5 pb-4 rounded-2xl border border-stone-200/90 shadow-2xs select-none"
                role="button"
                tabIndex={0}
                aria-label={`Preview ${SAMPLE_MEMORIES[0].title}`}
              >
                {/* Washi tape accent */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-amber-100/80 border border-amber-200/60 rounded-xs shadow-2xs rotate-1 z-10 pointer-events-none" />

                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100">
                  <Image
                    src={SAMPLE_MEMORIES[0].images[0]}
                    alt={SAMPLE_MEMORIES[0].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-stone-900 text-[10px] font-mono px-2 py-0.5 rounded-full shadow-xs">
                      Tap to open
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-0.5 px-0.5">
                  <p className="font-heading font-black text-xs text-stone-900 truncate">
                    {SAMPLE_MEMORIES[0].title}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {SAMPLE_MEMORIES[0].date}
                  </p>
                </div>
              </motion.div>

              {/* Photostrip 2: 3-Shot Strip */}
              <motion.div
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  rotate: 0,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                style={{ rotate: SAMPLE_MEMORIES[1].rotation }}
                onClick={() => setSelectedMemory(SAMPLE_MEMORIES[1])}
                className="cursor-pointer group relative bg-stone-900 p-2.5 pb-3 rounded-2xl border border-stone-800 shadow-2xs select-none text-white"
                role="button"
                tabIndex={0}
                aria-label={`Preview ${SAMPLE_MEMORIES[1].title}`}
              >
                {/* Washi tape accent */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-rose-200/80 border border-rose-300/60 rounded-xs shadow-2xs -rotate-2 z-10 pointer-events-none" />

                <div className="space-y-1.5">
                  {SAMPLE_MEMORIES[1].images.map((src, i) => (
                    <div key={i} className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-800">
                      <Image
                        src={src}
                        alt={`Pose ${i + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-center space-y-0.5">
                  <p className="font-heading font-black text-[11px] text-stone-100 tracking-tight">
                    {SAMPLE_MEMORIES[1].title}
                  </p>
                  <p className="text-[9px] font-mono text-stone-400">
                    {SAMPLE_MEMORIES[1].date} · 3 poses
                  </p>
                </div>
              </motion.div>

              {/* Polaroid 3: Cozy Blanket Fort */}
              <motion.div
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  rotate: 0,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                style={{ rotate: SAMPLE_MEMORIES[2].rotation }}
                onClick={() => setSelectedMemory(SAMPLE_MEMORIES[2])}
                className="cursor-pointer group relative bg-white p-3.5 pb-4 rounded-2xl border border-stone-200/90 shadow-2xs select-none"
                role="button"
                tabIndex={0}
                aria-label={`Preview ${SAMPLE_MEMORIES[2].title}`}
              >
                {/* Washi tape accent */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-sky-100/80 border border-sky-200/60 rounded-xs shadow-2xs rotate-2 z-10 pointer-events-none" />

                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100">
                  <Image
                    src={SAMPLE_MEMORIES[2].images[0]}
                    alt={SAMPLE_MEMORIES[2].title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-stone-900 text-[10px] font-mono px-2 py-0.5 rounded-full shadow-xs">
                      Tap to open
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-0.5 px-0.5">
                  <p className="font-heading font-black text-xs text-stone-900 truncate">
                    {SAMPLE_MEMORIES[2].title}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {SAMPLE_MEMORIES[2].date}
                  </p>
                </div>
              </motion.div>

              {/* Action Card: Photobooth Creator with CoupleBeansMascot */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3 flex flex-col justify-between self-stretch">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-black text-sm text-stone-900">
                      Take your next strip
                    </h4>
                    <span className="text-xs">📸</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-snug">
                    Step inside the photobooth together. Every strip is saved to your shared scrapbook forever.
                  </p>
                </div>

                {/* Mascot Beans Cheer */}
                <div className="py-1 flex justify-center">
                  <CoupleBeansMascot className="w-20 h-16" />
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    href="/photo-booth"
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Open Photobooth</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/moments"
                    className="w-full py-1.5 px-3 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-700 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                    <span>View Scrapbook</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              8. LETTERS TO THE FUTURE BANNER
              ══════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
                LETTERS TO THE FUTURE
              </p>
              <Link href="/love-letter" className="text-xs font-mono font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                <span>✎</span> Write
              </Link>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-sm text-stone-900">
                    A letter that opens years from now
                  </h4>
                  <p className="text-xs text-stone-500">
                    To the one you&apos;re with, or to future you.
                  </p>
                </div>
              </div>
              <Link
                href="/love-letter"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-sky-500 text-white font-mono text-xs font-bold uppercase tracking-wider shrink-0 shadow-xs"
              >
                Write a letter &gt;
              </Link>
            </div>
          </div>

          {/* Meanwhile Card & City Selector for Timezone / Location */}
          <MeanwhileCard
            userProfile={profile}
            partnerProfile={partner}
            onOpenCitySelector={() => setIsCityModalOpen(true)}
          />

          <CitySelectorModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            onCitySelected={() => refreshSession(false)}
          />

          <PlusPaywallModal
            isOpen={isPaywallOpen}
            onClose={() => setIsPaywallOpen(false)}
          />

          <RecoveryPhraseModal
            isOpen={isRecoveryModalOpen}
            onClose={() => {
              setIsRecoveryModalOpen(false);
              checkRecoveryStatus();
            }}
            pairId={pair?.id}
          />

          {/* ══════════════════════════════════════════════════
              9. INTERACTIVE MEMORIES PREVIEW MODAL
              ══════════════════════════════════════════════════ */}
          <AnimatePresence>
            {selectedMemory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedMemory(null)}
                  className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
                />

                {/* Modal Container with Spring Physics */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                  className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200"
                >
                  {/* Top Bar */}
                  <div className="p-4 px-6 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-heading font-black text-sm text-stone-900">
                        {selectedMemory.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMemory(null)}
                      className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    {selectedMemory.type === "polaroid" ? (
                      /* Polaroid Frame */
                      <div className="bg-[#FAF9F6] p-4 pb-6 rounded-2xl border border-stone-200 shadow-inner flex flex-col items-center">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-xs">
                          <Image
                            src={selectedMemory.images[0]}
                            alt={selectedMemory.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="w-full pt-4 text-center space-y-1">
                          <p className="font-heading font-black text-stone-900 text-sm">
                            {selectedMemory.caption}
                          </p>
                          <p className="font-mono text-xs text-stone-400">
                            Captured {selectedMemory.date} · Kept safe in Pairfect
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Photostrip Frame */
                      <div className="bg-stone-950 p-4 rounded-2xl shadow-inner text-white flex flex-col items-center space-y-3">
                        <div className="grid grid-cols-3 gap-2 w-full">
                          {selectedMemory.images.map((img, i) => (
                            <div key={i} className="relative aspect-4/3 rounded-lg overflow-hidden border border-stone-800">
                              <Image
                                src={img}
                                alt={`Frame ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-center pt-1 space-y-1">
                          <p className="font-heading font-black text-stone-100 text-sm">
                            {selectedMemory.caption}
                          </p>
                          <p className="font-mono text-xs text-stone-400">
                            {selectedMemory.date} · 3-shot classic photobooth
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Modal Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <Link
                        href="/photo-booth"
                        onClick={() => setSelectedMemory(null)}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Create in photobooth</span>
                      </Link>
                      <Link
                        href="/moments"
                        onClick={() => setSelectedMemory(null)}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-800 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-stone-500" />
                        <span>View in scrapbook</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>
      </div>

    </div>
  );
}
