"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/components/providers/notification-provider";
import { parseAvatarConfig, ChibiAvatar } from "@/components/chibi-avatar";
import {
  Home,
  Mail,
  Camera,
  Gamepad2,
  Gift,
  Clock,
  Calendar,
  User,
  Settings,
  Heart,
  Bell,
  Sparkles,
  Flame,
  BookOpen,
  Flower2,
  Radio,
  LogOut,
} from "lucide-react";

/* Navigation Items */
const SIDEBAR_ITEMS = [
  { href: "/dashboard",    icon: Home,     label: "HOME",      title: "Home",       subtitle: "Return to your story →" },
  { href: "/whisper",      icon: Radio,    label: "WHISPER",   title: "Whisper Radio", subtitle: "Tune in to voice notes →" },
  { href: "/bouquet",      icon: Flower2,  label: "BOUQUET",   title: "Bouquets",   subtitle: "Handpick botanical blooms →" },
  { href: "/love-letter",  icon: Mail,     label: "LETTERS",   title: "Letters",    subtitle: "Sealed with wax, kept forever →" },
  { href: "/photo-booth",  icon: Camera,   label: "PHOTOBOOTH",title: "Photobooth", subtitle: "Four frames of us →" },
  { href: "/play",         icon: Gamepad2, label: "PLAYROOM",  title: "Playroom",   subtitle: "Play tonight's date night →" },
  { href: "/gratitude-jar",icon: Gift,     label: "RITUALS",   title: "Rituals",    subtitle: "Daily appreciation jar →" },
  { href: "/stories",      icon: BookOpen, label: "STORIES",   title: "Stories & Explore", subtitle: "Stories & community →" },
  { href: "/calendar",     icon: Calendar, label: "DATES",     title: "Dates",      subtitle: "Special milestones →" },
  { href: "/profile",      icon: User,     label: "PROFILE",   title: "Profile",    subtitle: "Your profile & space →" },
  { href: "/settings",     icon: Settings, label: "SETTINGS",  title: "Settings",   subtitle: "Preferences & security →" },
];

const PING_PHRASES = [
  "Thinking of you ♡",
  "Missing you",
  "Sending a warm hug 🫂",
  "Can't wait to see you ✨",
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, profile, pair, partner, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, sendPing } = useNotifications();

  const [visible, setVisible] = useState(true);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [showPingMenu, setShowPingMenu] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  const pingMenuRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onHide = () => setVisible(false);
    const onShow = () => setVisible(true);
    window.addEventListener("navigation-hide", onHide);
    window.addEventListener("navigation-show", onShow);

    const handleClickOutside = (e: MouseEvent) => {
      if (pingMenuRef.current && !pingMenuRef.current.contains(e.target as Node)) {
        setShowPingMenu(false);
      }
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("navigation-hide", onHide);
      window.removeEventListener("navigation-show", onShow);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentPath = pathname || "";

  // Don't render on auth / onboarding pages
  const hiddenRoutes = ["/login", "/signup", "/onboarding", "/auth/callback", "/avatars"];
  if (hiddenRoutes.some((r) => currentPath.startsWith(r))) return null;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.trim().charAt(0).toUpperCase();
  };

  const userInitial = getInitials(profile?.display_name);

  const handleTriggerPing = async (phrase?: string) => {
    const now = Date.now();
    if (now - lastPingTime < 120000) {
      setPingStatus("Sent with love! Give it a minute before sending another ♡");
      setTimeout(() => setPingStatus(null), 3000);
      setShowPingMenu(false);
      return;
    }

    setLastPingTime(now);
    setShowPingMenu(false);
    const res = await sendPing(phrase);
    setPingStatus(res.message);
    setTimeout(() => setPingStatus(null), 3500);
  };

  const currentStreak = pair?.current_streak || 0;
  const isStreakPaused = pair?.is_paused || false;

  return (
    <>
      {/* ══════════════════════════════════════════════════
          TOP CONTROL BAR: Logo, Streak, Ping, Bell, Avatar
          ══════════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-40 h-20 px-6 md:pl-32 md:pr-12 flex items-center justify-between pointer-events-none">

        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 select-none transition-opacity hover:opacity-85"
          >
            <Image src="/logo-book.png" alt="Pairfect" height={32} width={32} className="rounded-lg shadow-xs" priority />
            <div className="flex items-center gap-1.5">
              <span className="font-display italic text-xl font-black tracking-tight text-[#3D2432]">
                pairfect
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FF8DA1] inline-block" />
            </div>
          </Link>

          {pair && currentStreak > 0 && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                isStreakPaused
                  ? "bg-[var(--paper-warm)] border-[var(--border)] text-[var(--text-soft)]"
                  : "bg-[var(--paper-warm)] border-[var(--border)] text-[var(--burgundy)] font-bold shadow-xs"
              }`}
            >
              {isStreakPaused ? (
                <span>💛 Streak paused at {currentStreak}</span>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 fill-current text-[var(--burgundy)]" />
                  <span>{currentStreak} day streak</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 pointer-events-auto select-none">
          {partner && (
            <div className="relative" ref={pingMenuRef}>
              <button
                onClick={() => setShowPingMenu(!showPingMenu)}
                className="btn-journal-ghost px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 !rounded-full shadow-xs"
                title="Send a Thinking of You ping"
              >
                <Heart className="w-3.5 h-3.5 fill-current text-[var(--burgundy)]" />
                <span className="hidden sm:inline font-sans text-xs">Ping</span>
              </button>

              <AnimatePresence>
                {showPingMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl z-50 space-y-1 paper-grain"
                  >
                    <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                      Send a Ping to {partner.display_name || "partner"}
                    </p>
                    {PING_PHRASES.map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTriggerPing(phrase)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-sans text-[var(--text)] hover:bg-[var(--bg-secondary)] hover:text-[var(--burgundy)] transition-colors flex items-center justify-between"
                      >
                        <span>{phrase}</span>
                        <Heart className="w-3 h-3 text-[var(--rose)] opacity-60" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Bell */}
          <div className="relative" ref={notifPanelRef}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative w-9 h-9 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--burgundy)] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto p-3 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-2xl z-50 space-y-2 paper-grain"
                >
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-[var(--border)]">
                    <p className="font-heading font-bold text-sm text-[var(--burgundy)]">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-mono text-[var(--text-soft)] hover:text-[var(--burgundy)]"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-soft)] italic">
                      No notifications yet ♡
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          href="/dashboard"
                          onClick={() => {
                            markAsRead(n.id);
                            setShowNotifPanel(false);
                          }}
                          className={`block p-2.5 rounded-xl transition-all cursor-pointer ${
                            !n.read
                              ? "bg-[var(--bg-secondary)] border border-[var(--border)] font-medium"
                              : "hover:bg-black/5 opacity-80"
                          }`}
                        >
                          <p className="font-heading font-semibold text-xs text-[var(--text)]">{n.title}</p>
                          {n.body && <p className="text-[11px] text-[var(--text-soft)] line-clamp-1 mt-0.5">{n.body}</p>}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Avatar with Dropdown Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full overflow-hidden bg-[var(--burgundy)] text-white font-sans flex items-center justify-center text-sm font-bold select-none shadow-sm transition-transform hover:scale-105 active:scale-95 border border-[var(--border)] cursor-pointer"
              title={profile?.display_name || user?.email || "Account Menu"}
              aria-label="Account Menu"
            >
              {profile?.avatar_url ? (
                <ChibiAvatar
                  config={parseAvatarConfig(profile.avatar_url)}
                  pose="profile"
                  className="w-full h-full"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-2xl z-50 space-y-2 paper-grain"
                >
                  <div className="px-2 pb-2 border-b border-[var(--border)]">
                    <p className="font-heading font-bold text-sm text-[var(--text)] truncate">
                      {profile?.display_name || "Your Account"}
                    </p>
                    <p className="text-[11px] text-[var(--text-soft)] truncate font-mono">
                      {user?.email}
                    </p>
                    {partner && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono text-[var(--burgundy)] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Paired with {partner.display_name} ♡
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-secondary)] hover:text-[var(--burgundy)] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[var(--burgundy)]" />
                      <span>Profile & Bucket List</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-secondary)] hover:text-[var(--burgundy)] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[var(--text-soft)]" />
                      <span>Settings & Preferences</span>
                    </Link>
                  </div>

                  <div className="pt-1.5 border-t border-[var(--border)]">
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await signOut();
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Direct Logout Button */}
          <button
            onClick={async () => {
              await signOut();
            }}
            title="Log out"
            aria-label="Log out"
            className="w-9 h-9 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Ping Status Toast */}
      <AnimatePresence>
        {pingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--burgundy)] text-white text-xs font-sans font-medium shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{pingStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════
          DESKTOP: SIGNATURE COZY PINK CAPSULE SIDEBAR
          Matches exact design from reference screenshot
          ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="hidden md:block fixed left-4 top-20 bottom-3 my-auto z-50 h-fit max-h-[calc(100vh-88px)] overflow-y-auto no-scrollbar"
            aria-label="Main Navigation"
          >
            {/* Sidebar Capsule */}
            <div
              className="relative flex flex-col items-center py-3 px-2 rounded-[999px] select-none"
              style={{
                width: "76px",
                background: "linear-gradient(180deg, #FFF2F5 0%, #FFF8FA 100%)",
                border: "2px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 12px 32px rgba(232, 82, 125, 0.12), inset 0 2px 4px rgba(255, 255, 255, 0.9)",
              }}
            >
              {/* Subtle top heart accent on capsule */}
              <div className="absolute top-2 right-2 text-[#FF7597] text-[9px] animate-pulse pointer-events-none select-none">
                ♥
              </div>

              {/* Navigation Items Stack */}
              <div className="flex flex-col items-center gap-1.5 relative z-10 w-full">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentPath === item.href ||
                    (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                  const isHovered = hoveredHref === item.href;

                  return (
                    <div
                      key={item.href}
                      className="relative flex flex-col items-center justify-center w-full"
                      onMouseEnter={() => setHoveredHref(item.href)}
                      onMouseLeave={() => setHoveredHref(null)}
                    >
                      <Link
                        href={item.href}
                        aria-label={item.title}
                        className="relative flex flex-col items-center justify-center w-full group focus-visible:outline-none"
                      >
                        {/* Active State Glowing Pink Orb */}
                        {isActive ? (
                          <motion.div
                            layoutId="active-glowing-orb"
                            className="relative flex items-center justify-center w-11 h-11 rounded-full mb-0.5"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            style={{
                              background: "linear-gradient(135deg, #FF6B95 0%, #E8527D 100%)",
                              boxShadow: "0 6px 20px rgba(232, 82, 125, 0.42), inset 0 2px 3px rgba(255, 255, 255, 0.4)",
                            }}
                          >
                            {/* Tiny top heart on active orb */}
                            <span className="absolute -top-1 right-1 text-[8px] text-[#FFB3C6]">♥</span>
                            <Icon className="w-4.5 h-4.5 text-white stroke-[2]" />
                          </motion.div>
                        ) : (
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                              isHovered ? "bg-white/80 scale-105 shadow-xs" : ""
                            }`}
                          >
                            <Icon
                              strokeWidth={1.75}
                              className={`w-4.5 h-4.5 transition-colors duration-200 ${
                                isHovered ? "text-[#E8527D]" : "text-[#7A4B5D]"
                              }`}
                            />
                          </div>
                        )}

                        {/* Label below icon */}
                        <span
                          className={`text-[8.5px] font-mono font-bold tracking-wider uppercase transition-colors duration-150 ${
                            isActive
                              ? "text-[#E8527D] font-black"
                              : isHovered
                              ? "text-[#E8527D]"
                              : "text-[#7A4B5D]/80"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>

                      {/* ── Active / Hover Floating Popout Tooltip Card ── */}
                      <AnimatePresence>
                        {(isActive || isHovered) && (
                          <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.94 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.94 }}
                            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                            className="absolute left-full ml-4 px-4 py-3 rounded-2xl bg-white border border-[#FFD0DD] shadow-xl z-50 pointer-events-none select-none flex items-center gap-3"
                            style={{
                              boxShadow: "0 12px 32px rgba(232, 82, 125, 0.15), 0 4px 12px rgba(0,0,0,0.04)",
                            }}
                          >
                            {/* Speech Bubble Triangle Pointer */}
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-r-6 border-r-white" />

                            {/* Left Pink Square Icon Badge */}
                            <div className="w-9 h-9 rounded-xl bg-[#FFF0F4] border border-[#FFD0DD] flex items-center justify-center text-[#E8527D] shrink-0">
                              <Icon className="w-4.5 h-4.5 stroke-[2]" />
                            </div>

                            {/* Title & Subtitle */}
                            <div className="text-left space-y-0.5 whitespace-nowrap">
                              <p className="font-heading font-bold text-sm text-[#3D2432]">
                                {item.title}
                              </p>
                              <p className="font-sans text-[11px] text-[#7A4B5D]">
                                {item.subtitle}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  );
                })}

                {/* Subtle divider */}
                <div className="w-8 h-px bg-[#FFD0DD]/80 my-1" />

                {/* Logout Button */}
                <div
                  className="relative flex flex-col items-center justify-center w-full"
                  onMouseEnter={() => setHoveredHref("logout")}
                  onMouseLeave={() => setHoveredHref(null)}
                >
                  <button
                    onClick={() => signOut()}
                    className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-150 group cursor-pointer hover:bg-red-50"
                    aria-label="Log out"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150">
                      <LogOut className="w-4 h-4 stroke-[1.8] text-[#7A4B5D] group-hover:text-red-500" />
                    </div>
                    <span className="text-[8.5px] font-mono font-bold tracking-wider uppercase text-[#7A4B5D]/80 group-hover:text-red-500">
                      LOGOUT
                    </span>
                  </button>

                  <AnimatePresence>
                    {hoveredHref === "logout" && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.94 }}
                        transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                        className="absolute left-full ml-4 px-4 py-3 rounded-2xl bg-white border border-red-200 shadow-xl z-50 pointer-events-none select-none flex items-center gap-3"
                      >
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-r-6 border-r-white" />
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shrink-0">
                          <LogOut className="w-4.5 h-4.5 stroke-[2]" />
                        </div>
                        <div className="text-left space-y-0.5 whitespace-nowrap">
                          <p className="font-heading font-bold text-sm text-red-600">
                            Log Out
                          </p>
                          <p className="font-sans text-[11px] text-[var(--text-soft)]">
                            Sign out of Pairfect
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════
          MOBILE: FLOATING BOTTOM CAPSULE
          ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ y: 80, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 80, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="md:hidden fixed bottom-6 left-1/2 z-50"
            aria-label="Mobile Navigation"
          >
            <div
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[999px] bg-[#FFF2F5] border-2 border-white paper-grain select-none shadow-2xl"
              style={{
                boxShadow: "0 12px 36px rgba(232, 82, 125, 0.22)",
              }}
            >
              {SIDEBAR_ITEMS.slice(0, 7).map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.title}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active-orb-pill"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "linear-gradient(135deg, #FF6B95 0%, #E8527D 100%)",
                          boxShadow: "0 4px 14px rgba(232, 82, 125, 0.4)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon
                      strokeWidth={1.75}
                      className={`w-4 h-4 relative z-10 ${
                        isActive ? "text-white" : "text-[#7A4B5D]"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
