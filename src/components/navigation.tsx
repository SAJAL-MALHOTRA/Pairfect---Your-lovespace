"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  User,
  Settings,
  Camera,
  Heart,
  Brain,
  Scale,
  Sparkles,
  Gamepad2,
  HelpCircle,
  Palette,
  Flame,
  MessageSquare,
  Mail,
  BookOpen,
  PanelLeftClose,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Flower2,
  Music
} from "lucide-react";

interface JumpInItem {
  id: string;
  name: string;
  href: string;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const JUMP_IN_ACTIVITIES: JumpInItem[] = [
  { id: "booth", name: "Photobooth", href: "/photo-booth", iconBg: "bg-rose-100", iconColor: "text-rose-600", icon: Camera },
  { id: "know-me", name: "Love Match", href: "/play/love-match", iconBg: "bg-blue-100", iconColor: "text-blue-600", icon: HelpCircle },
  { id: "bouquet", name: "Floral Studio", href: "/bouquet", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", icon: Flower2 },
  { id: "letters", name: "Love Letters", href: "/love-letter", iconBg: "bg-amber-100", iconColor: "text-amber-600", icon: Mail },
  { id: "court", name: "Couples Court", href: "/vibe-judge", iconBg: "bg-rose-100", iconColor: "text-rose-600", icon: Scale },
  { id: "iq-duel", name: "IQ Duel", href: "/iq-duel", iconBg: "bg-purple-100", iconColor: "text-purple-600", icon: Brain },
  { id: "gratitude", name: "Gratitude Jar", href: "/gratitude-jar", iconBg: "bg-pink-100", iconColor: "text-pink-600", icon: Heart },
  { id: "riddles", name: "Riddle Night", href: "/riddle", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", icon: Sparkles },
  { id: "roulette", name: "Love Roulette", href: "/roulette", iconBg: "bg-red-100", iconColor: "text-red-600", icon: Flame },
  { id: "mixtape", name: "Spotify Mixtape", href: "/mixtape", iconBg: "bg-teal-100", iconColor: "text-teal-600", icon: Music },
  { id: "whisper", name: "Whisper Memos", href: "/whisper", iconBg: "bg-sky-100", iconColor: "text-sky-600", icon: MessageSquare },
  { id: "checkin", name: "Daily Check-in", href: "/checkin", iconBg: "bg-cyan-100", iconColor: "text-cyan-600", icon: Compass },
  { id: "fridge", name: "Keepsake Fridge", href: "/fridge", iconBg: "bg-amber-100", iconColor: "text-amber-600", icon: Sparkles },
  { id: "scrapbook", name: "Memory Wall", href: "/moments", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", icon: BookOpen },
  { id: "draw", name: "Shared Canvas", href: "/moments", iconBg: "bg-violet-100", iconColor: "text-violet-600", icon: Palette },
  { id: "arcade", name: "Arcade Path", href: "/play", iconBg: "bg-purple-100", iconColor: "text-purple-600", icon: Gamepad2 },
];

export default function Navigation() {
  const pathname = usePathname() || "";
  const { user, profile, partner } = useAuth();
  const [showAllJumpIn, setShowAllJumpIn] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize expanded state with localStorage so it persists across page navigations
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pairfect_nav_show_all");
      if (saved !== null) {
        setShowAllJumpIn(saved === "true");
      }
    } catch {}
  }, []);

  const toggleShowAllJumpIn = () => {
    setShowAllJumpIn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pairfect_nav_show_all", String(next));
      } catch {}
      return next;
    });
  };

  // Hidden on auth/onboarding routes
  const hiddenRoutes = ["/login", "/signup", "/onboarding", "/auth/callback"];
  if (hiddenRoutes.some((r) => pathname.startsWith(r))) return null;

  const isHomeActive = pathname === "/dashboard" || pathname === "/home";
  const isActivitiesActive = pathname.startsWith("/play") || pathname === "/activities";
  const isBoothActive = pathname.startsWith("/photo-booth");
  const isProfileActive = pathname.startsWith("/profile");

  const visibleJumpIn = showAllJumpIn ? JUMP_IN_ACTIVITIES : JUMP_IN_ACTIVITIES.slice(0, 6);

  return (
    <>
      {/* ══════════════════════════════════════════════════
          1. MOBILE TOP APP BAR & SLIDE-OVER DRAWER
          ══════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 z-50 px-4 flex items-center justify-between select-none">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo-book.png" alt="Pairfect Logo" width={24} height={24} className="rounded-md object-contain" priority />
          <span className="font-sans font-black text-xl tracking-tight text-stone-900">pairfect</span>
          <div className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-[#FF5E8E]" />
            <span className="w-2 h-2 rounded-full bg-[#4F86F7]" />
          </div>
        </Link>

        {/* Mobile controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full border border-stone-200 overflow-hidden bg-rose-50 flex items-center justify-center text-xs font-bold text-rose-600"
          >
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : "G"}
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-700 active:scale-95 transition-transform"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-72 bg-white h-full pt-16 pb-6 px-4 flex flex-col justify-between overflow-y-auto shadow-2xl"
            >
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-rose-600 text-sm">
                      {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : "G"}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-xs text-stone-900">
                        {profile?.display_name || "Guest"}
                      </p>
                      <p className="text-[10px] font-mono text-stone-400">
                        {user ? "Connected" : "Saved locally"}
                      </p>
                    </div>
                  </div>
                  {!user && (
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-mono text-[10px] font-bold"
                    >
                      Sign in
                    </Link>
                  )}
                </div>

                {/* Main Nav */}
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-heading font-bold transition-all ${
                      isHomeActive ? "bg-[#FFE4E8] text-[#E11D48] border border-rose-200" : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </Link>

                  <Link
                    href="/play"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-heading font-bold transition-all ${
                      isActivitiesActive ? "bg-[#FFE4E8] text-[#E11D48] border border-rose-200" : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Activities</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-heading font-bold transition-all ${
                      isProfileActive ? "bg-[#FFE4E8] text-[#E11D48] border border-rose-200" : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                </div>

                {/* Jump In Mobile */}
                <div className="pt-2">
                  <p className="text-[10px] font-mono font-bold tracking-wider text-stone-400 uppercase px-2 mb-2">
                    JUMP IN
                  </p>
                  <div className="space-y-1">
                    {visibleJumpIn.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-heading font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <div className={`w-6 h-6 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Toggle all activities button in mobile drawer */}
                  <button
                    type="button"
                    onClick={toggleShowAllJumpIn}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-mono font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{showAllJumpIn ? "Show less" : `See all (${JUMP_IN_ACTIVITIES.length})`}</span>
                    {showAllJumpIn ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Bottom promo in mobile drawer */}
              <div className="pt-4 border-t border-stone-200 space-y-2">
                <div className="p-3 rounded-2xl bg-[#FFF0F5] border border-rose-200 text-center space-y-2">
                  <CoupleBeansMascot className="w-16 h-12 mx-auto" />
                  <p className="font-heading font-black text-xs text-stone-900">
                    Couples Court
                  </p>
                  <Link
                    href="/vibe-judge"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full py-1.5 rounded-xl bg-[#E8557F] text-white font-mono text-[10px] font-bold uppercase tracking-wider"
                  >
                    Play Date Night
                  </Link>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold text-stone-500 hover:text-stone-900"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </div>
            </motion.div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          1B. MOBILE FIXED BOTTOM NAVIGATION BAR
          ══════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] select-none">
        <div className="grid grid-cols-4 h-16 items-center px-2 max-w-md mx-auto">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isHomeActive ? "text-rose-600 font-bold" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
          </Link>

          <Link
            href="/play"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isActivitiesActive ? "text-rose-600 font-bold" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Activities</span>
          </Link>

          <Link
            href="/photo-booth"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isBoothActive ? "text-rose-600 font-bold" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Booth</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isProfileActive ? "text-rose-600 font-bold" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Profile</span>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════
          2. DESKTOP FIXED LEFT SIDEBAR
          ══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 xl:w-64 bg-white border-r border-stone-200/90 z-40 flex-col justify-between p-4 xl:p-5 select-none overflow-y-auto">
        
        <div className="space-y-4">
          
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between px-1 pt-1">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <Image src="/logo-book.png" alt="Pairfect Logo" width={28} height={28} className="rounded-md object-contain" priority />
              <span className="font-sans font-black text-2xl tracking-tight text-stone-900 group-hover:text-rose-600 transition-colors">
                pairfect
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF5E8E] group-hover:scale-125 transition-transform" />
                <span className="w-2 h-2 rounded-full bg-[#4F86F7] group-hover:scale-125 transition-transform" />
              </div>
            </Link>
            <div className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors">
              <PanelLeftClose className="w-4 h-4" />
            </div>
          </div>

          {/* User Profile Card */}
          <motion.div
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-2.5 rounded-2xl bg-stone-50/80 border border-stone-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-rose-600 text-sm shrink-0 overflow-hidden shadow-2xs">
                <Image
                  src="/booth/couple-heart.jpg"
                  alt="Avatar"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-xs text-stone-900 truncate">
                  {profile?.display_name || "Guest"}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-stone-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{user ? "Connected" : "Sign in"}</span>
                </div>
              </div>
            </div>
            {!user && (
              <Link
                href="/login"
                className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer"
              >
                Sign in
              </Link>
            )}
          </motion.div>

          {/* Primary Navigation Items */}
          <nav className="space-y-1">
            {/* Home */}
            <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-heading font-bold transition-all ${
                  isHomeActive
                    ? "bg-[#FFE4E8] text-[#E11D48] border border-rose-200/80 shadow-2xs"
                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <Home className={`w-4 h-4 ${isHomeActive ? "text-[#E11D48]" : "text-stone-500"}`} />
                <span>Home</span>
              </Link>
            </motion.div>

            {/* Activities */}
            <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/play"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-heading font-bold transition-all ${
                  isActivitiesActive
                    ? "bg-[#FFE4E8] text-[#E11D48] border border-rose-200/80 shadow-2xs"
                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <Gamepad2 className={`w-4 h-4 ${isActivitiesActive ? "text-[#E11D48]" : "text-stone-500"}`} />
                <span>Activities</span>
              </Link>
            </motion.div>

            {/* Profile */}
            <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-heading font-bold transition-all ${
                  isProfileActive
                    ? "bg-[#FFE4E8] text-[#E11D48] border border-rose-200/80 shadow-2xs"
                    : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <User className={`w-4 h-4 ${isProfileActive ? "text-[#E11D48]" : "text-stone-500"}`} />
                <span>Profile</span>
              </Link>
            </motion.div>
          </nav>

          {/* JUMP IN Activities List */}
          <div className="pt-2">
            <p className="text-[10px] font-mono font-bold tracking-wider text-stone-400 uppercase px-2 mb-2">
              JUMP IN
            </p>
            <div className="space-y-1">
              {visibleJumpIn.map((item) => {
                const Icon = item.icon;
                const isItemActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.03, x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all text-xs font-heading font-medium ${
                        isItemActive
                          ? "bg-stone-100 text-stone-900 font-bold shadow-2xs"
                          : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* See All / Show Less Toggle Button */}
            <button
              type="button"
              onClick={toggleShowAllJumpIn}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-mono font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors cursor-pointer"
            >
              <span>{showAllJumpIn ? "Show less" : `See all (${JUMP_IN_ACTIVITIES.length})`}</span>
              {showAllJumpIn ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

        </div>

        {/* Bottom Section: Promo Card & Settings */}
        <div className="pt-4 space-y-3 border-t border-stone-200/80">
          
          {/* This Week's Date Night Promo Card with Mascot */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            className="p-3.5 rounded-3xl bg-[#FFF0F5] border border-rose-200/80 text-center space-y-2 shadow-2xs relative overflow-hidden group cursor-pointer"
          >
            <CoupleBeansMascot className="w-20 h-14 mx-auto" />
            <div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-500">
                THIS WEEK&apos;S DATE NIGHT
              </p>
              <p className="font-heading font-black text-xs text-stone-900 mt-0.5">
                Couples Court
              </p>
            </div>
            <Link
              href="/vibe-judge"
              className="w-full py-1.5 px-3 rounded-xl bg-[#E8557F] hover:bg-[#D43D69] active:scale-98 text-white font-mono text-[11px] font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Play</span>
              <span>&gt;</span>
            </Link>
          </motion.div>

          {/* Settings Link */}
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-stone-400" />
            <span>Settings</span>
          </Link>
        </div>

      </aside>
    </>
  );
}
