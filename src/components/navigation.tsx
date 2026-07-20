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
  BookOpen,
  Gift,
  Image as ImageIcon,
  Clock,
  Gamepad2,
  User,
  Settings,
  Music,
  Camera,
  Heart,
  Bell,
  Check,
  Flame,
  Sparkles,
  X,
} from "lucide-react";

const CLUSTERS = [
  [
    { href: "/dashboard", icon: Home, label: "Home" }
  ],
  [
    { href: "/love-letter", icon: Mail, label: "Letters" },
    { href: "/checkin", icon: BookOpen, label: "Journal" },
    { href: "/mixtape", icon: Music, label: "Mixtape" }
  ],
  [
    { href: "/photo-booth", icon: Camera, label: "Photo Booth" },
    { href: "/play", icon: Gamepad2, label: "Playroom" },
    { href: "/gratitude-jar", icon: Gift, label: "Gratitude" },
    { href: "/stories", icon: Clock, label: "Timeline" }
  ],
  [
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" }
  ]
];

const PING_PHRASES = [
  "Thinking of you ♡",
  "Missing you",
  "Sending a warm hug 🫂",
  "Can't wait to see you ✨",
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, profile, pair, partner } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, sendPing } = useNotifications();
  
  const [visible, setVisible] = useState(true);
  const [showPingMenu, setShowPingMenu] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  const pingMenuRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);

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

  // Rate limited Ping trigger
  const handleTriggerPing = async (phrase?: string) => {
    const now = Date.now();
    if (now - lastPingTime < 120000) { // 2 minute cooldown
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
      {/* ─── GLOBAL TOP BAR ─── */}
      <div className="fixed top-0 left-0 right-0 z-40 h-20 px-6 md:px-12 flex items-center justify-between pointer-events-none">
        {/* Left: Logo image + Soft Streak Badge */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link
            href="/dashboard"
            className="flex items-center select-none transition-opacity hover:opacity-85"
          >
            <Image src="/logo-book.png" alt="Pairfect" height={36} width={36} className="rounded-lg" priority />
          </Link>

          {/* Soft Streak Badge — Zero Red, Zero Broken Hearts */}
          {pair && currentStreak > 0 && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                isStreakPaused
                  ? "bg-[var(--paper-warm)] border-[var(--border)] text-[var(--text-soft)]"
                  : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--burgundy)] font-bold shadow-xs"
              }`}
            >
              {isStreakPaused ? (
                <span>💛 Streak paused at {currentStreak} — pick it back up anytime</span>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 fill-current text-[var(--burgundy)]" />
                  <span>{currentStreak} day streak</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Ping Button + Notification Bell + Avatar */}
        <div className="flex items-center gap-3 pointer-events-auto select-none">

          {/* "Thinking of You" Ping Button */}
          {partner && (
            <div className="relative" ref={pingMenuRef}>
              <button
                onClick={() => setShowPingMenu(!showPingMenu)}
                className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5 rounded-full border-[var(--border)] bg-[var(--paper-warm)] text-[var(--burgundy)] hover:scale-105 active:scale-95 transition-all shadow-xs"
                title="Send a Thinking of You ping to your partner"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline font-sans text-xs">Ping</span>
              </button>

              {/* Ping Presets Popover */}
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

          {/* Notification Bell Icon & Drawer */}
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

            {/* Notification Flyout Drawer */}
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
                      No notifications yet. When {partner?.display_name || "your partner"} sends a letter or ping, it will appear here ♡
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                            !n.read
                              ? "bg-[var(--bg-secondary)] border border-[var(--border)]"
                              : "hover:bg-black/5 text-opacity-80"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--burgundy)] mt-1 shrink-0 opacity-80" />
                            <div className="flex-1">
                              <p className="font-heading font-semibold text-xs text-[var(--text)]">{n.title}</p>
                              {n.body && <p className="text-[11px] text-[var(--text-soft)] line-clamp-1 mt-0.5">{n.body}</p>}
                              <p className="text-[9px] font-mono text-[var(--ink-light)] mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full overflow-hidden bg-[var(--burgundy)] text-[var(--bg)] font-sans flex items-center justify-center text-sm font-bold select-none shadow-sm transition-transform hover:scale-105 active:scale-95"
            style={{ boxShadow: "0 2px 8px var(--shadow)" }}
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
          </Link>
        </div>
      </div>

      {/* Ping Status Toast Feedback */}
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

      {/* ─── FLOATING LEFT VERTICAL DOCK ─── */}
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ x: -80, opacity: 0, y: "-50%" }}
            animate={{ x: 0, opacity: 1, y: "-50%" }}
            exit={{ x: -80, opacity: 0, y: "-50%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed left-6 top-1/2 z-50"
            aria-label="Main navigation"
          >
            <div className="nav-dock flex flex-col items-center gap-2 py-4 px-2.5 rounded-full">
              {CLUSTERS.map((cluster, cIdx) => (
                <React.Fragment key={cIdx}>
                  {cIdx > 0 && (
                    <div
                      className="w-5 h-px self-center"
                      style={{ backgroundColor: "var(--border)" }}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    {cluster.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        currentPath === item.href ||
                        (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-label={item.label}
                          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors focus-visible:outline-none"
                          style={{
                            color: isActive ? "var(--burgundy)" : "var(--text-soft)",
                          }}
                        >
                          {/* Active state rose circle background */}
                          {isActive && (
                            <motion.div
                              layoutId="nav-active-pill"
                              className="absolute inset-0 rounded-full bg-[var(--burgundy)]/10"
                              transition={{
                                type: "spring",
                                stiffness: 450,
                                damping: 35,
                              }}
                            />
                          )}
                          <Icon strokeWidth={isActive ? 2.2 : 1.7} className="w-[18px] h-[18px] relative z-10" />
                        </Link>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
