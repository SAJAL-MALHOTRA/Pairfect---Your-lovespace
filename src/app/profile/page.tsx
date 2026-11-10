"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import {
  Settings,
  Camera,
  Gamepad2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Shirt,
  Award,
  Heart,
  Info,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import PlusPaywallModal from "@/components/plus-paywall-modal";

// Isometric Room Furniture Item Definition
interface SanctuaryItem {
  id: string;
  name: string;
  level: string;
  tooltip: string;
  icon: string;
  coords: { left: string; top: string };
  glowColor: string;
}

const SANCTUARY_ITEMS: SanctuaryItem[] = [
  {
    id: "lamp",
    name: "Midnight Glow Lamp",
    level: "Level 2",
    tooltip: "Level 2: Midnight Glow Lamp - lit every midnight together!",
    icon: "🏮",
    coords: { left: "14%", top: "34%" },
    glowColor: "rgba(251, 191, 36, 0.4)",
  },
  {
    id: "sakura",
    name: "Sakura Blossom bonsai",
    level: "Level 3",
    tooltip: "Level 3: Sakura Blossom bonsai - unlocked from 5 dates!",
    icon: "🌸",
    coords: { left: "36%", top: "20%" },
    glowColor: "rgba(244, 114, 182, 0.4)",
  },
  {
    id: "sofa",
    name: "Velvet Loveseat",
    level: "Level 4",
    tooltip: "Level 4: Velvet Loveseat - built for endless cuddle sessions!",
    icon: "🛋️",
    coords: { left: "56%", top: "42%" },
    glowColor: "rgba(251, 113, 133, 0.4)",
  },
  {
    id: "gamepad",
    name: "Retro Gamepad",
    level: "Level 5",
    tooltip: "Level 5: Retro Gamepad - unlocked from 8 Co-Op victories!",
    icon: "🎮",
    coords: { left: "26%", top: "64%" },
    glowColor: "rgba(129, 140, 248, 0.4)",
  },
  {
    id: "plant",
    name: "Monstera Deliciosa",
    level: "Level 2",
    tooltip: "Level 2: Monstera Deliciosa - nurtured by daily love check-ins!",
    icon: "🪴",
    coords: { left: "80%", top: "54%" },
    glowColor: "rgba(52, 211, 153, 0.4)",
  },
];

// Interactive Isometric Room Sanctuary Component
function InteractiveSanctuaryRoom() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-gradient-to-tr from-rose-50 via-amber-50 to-sky-50 border border-stone-200 select-none">
      {/* Subtle isometric grid floor pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="sanctuary-iso-grid"
            width="40"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 40 12 L 20 24 L 0 12 Z"
              fill="none"
              stroke="#F43F5E"
              strokeWidth="0.6"
              strokeOpacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sanctuary-iso-grid)" />
      </svg>

      {/* Floating Room Header Badge */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-rose-200/80 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
          Living Archive Sanctuary
        </span>
      </div>

      {/* Instructions pill */}
      <div className="absolute bottom-2 left-3 z-10 text-[9px] font-mono text-stone-400">
        Hover furniture to inspect items
      </div>

      {/* 5 Interactive Isometric Furniture Items */}
      {SANCTUARY_ITEMS.map((item) => {
        const isHovered = hoveredId === item.id;

        return (
          <div
            key={item.id}
            style={{ left: item.coords.left, top: item.coords.top }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
          >
            {/* Ground Contact Shadow */}
            <motion.div
              animate={{
                scale: isHovered ? [1, 0.75, 0.9] : 1,
                opacity: isHovered ? 0.25 : 0.4,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-stone-900 blur-[2px] pointer-events-none"
            />

            {/* Item Interactive Trigger with playful spring jump and wiggle */}
            <motion.button
              type="button"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(isHovered ? null : item.id)}
              whileHover={{
                y: -14,
                scale: 1.25,
                rotate: [0, -10, 10, -5, 5, 0],
              }}
              whileTap={{ scale: 0.92 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 14,
              }}
              className="relative p-1.5 cursor-pointer focus:outline-hidden"
              aria-label={item.name}
            >
              {/* Item Halo Glow */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1.4 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="absolute inset-0 rounded-full blur-md pointer-events-none"
                    style={{ backgroundColor: item.glowColor }}
                  />
                )}
              </AnimatePresence>

              {/* Emoji Item Representation */}
              <span className="text-3xl sm:text-4xl filter drop-shadow-sm inline-block select-none">
                {item.icon}
              </span>
            </motion.button>

            {/* Charming Tooltip with speech bubble tail */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 z-40 pointer-events-none min-w-[210px] sm:min-w-[240px]"
                >
                  <div className="relative px-3 py-2 rounded-2xl bg-stone-900/95 backdrop-blur-md text-white shadow-xl border border-stone-700/80 text-center">
                    <p className="text-[11px] font-sans font-bold leading-tight text-rose-200">
                      {item.tooltip}
                    </p>
                    {/* Tooltip triangle tail */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-stone-900/95 rotate-45 border-r border-b border-stone-700/80" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// 3D Tilt Badges Card with Sparkle Reflection
function InteractiveBadgesCard() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [activeBadgeTooltip, setActiveBadgeTooltip] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;
    setRotateX(rX);
    setRotateY(rY);
    setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setActiveBadgeTooltip(null);
  };

  const badges = [
    { icon: "🏆", label: "Date Champion : 5 dates completed" },
    { icon: "📸", label: "Photobooth Pro : 3 strips preserved" },
    { icon: "💌", label: "Love Letters : First note exchanged" },
    { icon: "🎮", label: "Arcade Duo : Co-Op gaming star" },
    { icon: "✨", label: "Spark Master : 7-day streak active" },
  ];

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        scale: isHovered ? 1.015 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 24,
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      className="relative p-4 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-3 overflow-hidden cursor-pointer"
    >
      {/* Glare & Sparkle Reflection Sweep Overlay */}
      <motion.div
        animate={{ opacity: isHovered ? 0.7 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 pointer-events-none rounded-3xl z-20"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.15) 35%, transparent 65%)`,
        }}
      />

      {/* Floating Sparkle Reflections */}
      <AnimatePresence>
        {isHovered && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.8], y: -22 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
              className="absolute top-2.5 right-6 text-amber-400 pointer-events-none z-30"
            >
              <Sparkles className="w-4 h-4 fill-amber-300" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 0.7], y: -18 }}
              transition={{ duration: 1.4, delay: 0.35, repeat: Infinity, ease: "easeOut" }}
              className="absolute bottom-3 left-10 text-rose-400 pointer-events-none z-30"
            >
              <Sparkles className="w-3.5 h-3.5 fill-rose-300" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between text-xs">
        <span className="font-heading font-black text-stone-900">Badges</span>
        <span className="font-mono text-stone-400">0 of 12 &gt;</span>
      </div>

      <div className="flex items-center gap-3 pt-1 relative z-10">
        <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
          <Award className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2.5">
          {badges.map((b, idx) => (
            <motion.button
              key={idx}
              type="button"
              onMouseEnter={() => setActiveBadgeTooltip(b.label)}
              onMouseLeave={() => setActiveBadgeTooltip(null)}
              whileHover={{ scale: 1.35, y: -4, rotate: [0, -8, 8, 0] }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 15 }}
              className="text-2xl cursor-pointer select-none relative focus:outline-hidden"
              aria-label={b.label}
            >
              <span>{b.icon}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Floating Badge Label Pill */}
      <AnimatePresence>
        {activeBadgeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="pt-1"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-mono text-[10px] font-bold">
              {activeBadgeTooltip}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [stripsCount] = useState(0);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Main Content Area with Desktop Sidebar Offset */}
      <div className="lg:pl-60 xl:pl-64 min-h-screen pt-18 pb-10 sm:py-10 px-4 sm:px-8 flex justify-center">
        <main className="w-full max-w-4xl space-y-6 select-none pb-24">
          
          {/* ══════════════════════════════════════════════════
              TOP HEADER: PROFILE & SETTINGS BUTTON
              ══════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2">
            <h1 className="text-2xl sm:text-4xl font-heading font-black text-stone-900 tracking-tight">
              Profile
            </h1>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs text-xs font-mono font-bold text-stone-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </Link>
            </motion.div>
          </div>

          {/* ══════════════════════════════════════════════════
              USER BANNER CARD WITH STATS
              ══════════════════════════════════════════════════ */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User details */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-rose-100 border-2 border-rose-300 overflow-hidden flex items-center justify-center text-xl font-bold text-rose-600 shadow-xs">
                <Image
                  src="/booth/monkey-heart.jpg"
                  alt="Avatar"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-xl text-stone-900">
                    {profile?.display_name || "Guest"}
                  </h2>
                  {!user && (
                    <Link
                      href="/login"
                      className="px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] font-bold transition-colors"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
                <p className="text-xs font-mono text-stone-400">
                  {user ? "Pairfect account · active" : "Guest · saved on this phone only"}
                </p>
              </div>
            </div>

            {/* 3 Stats on Right */}
            <div className="flex items-center gap-6 sm:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-stone-100">
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <p className="font-heading font-black text-lg text-stone-900 leading-none">
                  {stripsCount}
                </p>
                <p className="text-[10px] font-mono text-stone-400 uppercase">
                  Strips created
                </p>
              </div>

              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <p className="font-heading font-black text-lg text-stone-900 leading-none">
                  0
                </p>
                <p className="text-[10px] font-mono text-stone-400 uppercase">
                  Games played
                </p>
              </div>

              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="font-heading font-black text-sm text-stone-900 leading-none">
                  Jul 2026
                </p>
                <p className="text-[10px] font-mono text-stone-400 uppercase">
                  Member since
                </p>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════
              ROW 2: SUBSCRIPTION & PARTNER CONNECTION VS ROOM
              ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Plan & Connection */}
            <div className="space-y-6">
              
              {/* Free Plan Card */}
              <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm text-stone-900">
                      Free plan
                    </h3>
                    <p className="text-xs text-stone-500">
                      Photobooth play is free
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  type="button"
                  onClick={() => setIsPaywallOpen(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 hover:opacity-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Try Unlimited: 3 days for ₹99</span>
                </motion.button>
              </div>

              {/* Play together, connected card */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs text-center space-y-3">
                <div className="flex items-center justify-center gap-3 relative py-2">
                  <CoupleBeansMascot className="w-24 h-16" />
                  <div className="absolute top-0 right-16 text-rose-400 text-xs font-mono">
                    ✈
                  </div>
                </div>
                <h3 className="font-heading font-black text-base text-stone-900">
                  Play together, connected
                </h3>
                <p className="text-xs font-sans text-stone-500 max-w-xs mx-auto">
                  Sign in, then invite your partner with a link or a code.
                </p>
                <div className="pt-1">
                  {!user ? (
                    <Link
                      href="/login"
                      className="inline-block px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider"
                    >
                      Sign in
                    </Link>
                  ) : (
                    <Link
                      href="/onboarding"
                      className="inline-block px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider"
                    >
                      Invite partner
                    </Link>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Badges, Print Studio, Your room */}
            <div className="space-y-4">
              
              {/* Badges card with 3D Tilt and Sparkle Reflection */}
              <InteractiveBadgesCard />

              {/* Print Studio */}
              <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 350, damping: 25 }}>
                <Link
                  href="/checkout"
                  className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:border-stone-900 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                      <Shirt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-sm text-stone-900 group-hover:text-rose-600 transition-colors">
                        Print Studio
                      </h4>
                      <p className="text-xs text-stone-500">
                        Design shirts together
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Your Room Card with Interactive Isometric Furniture */}
              <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
                {/* Interactive Cozy Sanctuary Room Illustration */}
                <InteractiveSanctuaryRoom />

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="font-heading font-black text-sm text-stone-900">
                      Your room
                    </h4>
                    <p className="text-xs text-stone-500">
                      Pin your strips. Every game you finish brings something new.
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

          {/* ══════════════════════════════════════════════════
              SECTION: MY STRIPS
              ══════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <h3 className="font-heading font-black text-sm text-stone-900 px-1">
              My strips
            </h3>

            <div className="p-8 rounded-3xl bg-white border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left">
              <div className="shrink-0">
                <CoupleBeansMascot className="w-24 h-18" />
              </div>
              <div className="space-y-2">
                <h4 className="font-heading font-black text-base text-stone-900">
                  No strips yet
                </h4>
                <p className="text-xs text-stone-500">
                  Your photobooth strips land here.
                </p>
                <div>
                  <Link
                    href="/photo-booth"
                    className="inline-block px-4 py-2 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100 text-rose-600 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Take one
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <PlusPaywallModal
            isOpen={isPaywallOpen}
            onClose={() => setIsPaywallOpen(false)}
          />

        </main>
      </div>

    </div>
  );
}
