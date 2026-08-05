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
  Tv,
  User,
  Settings,
  Heart,
  Bell,
  Sparkles,
  Flame,
} from "lucide-react";

/* ─── Easing & Motion timing scale from spec ─── */
const EASE_PAPER = [0.22, 0.61, 0.36, 1] as const;

/* ─── Grouped Navigation Clusters (Apple HI spec) ─── */
const NAV_GROUPS = [
  {
    title: "Relationship",
    items: [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/love-letter", icon: Mail, label: "Letters" },
      { href: "/photo-booth", icon: Camera, label: "Photobooth" },
      { href: "/play", icon: Gamepad2, label: "Playroom" },
    ],
  },
  {
    title: "Connection",
    items: [
      { href: "/gratitude-jar", icon: Gift, label: "Gratitude" },
      { href: "/stories", icon: Clock, label: "Timeline" },
      { href: "/watch", icon: Tv, label: "Watch" },
    ],
  },
  {
    title: "Profile",
    items: [
      { href: "/profile", icon: User, label: "Profile" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const PING_PHRASES = [
  "Thinking of you ♡",
  "Missing you",
  "Sending a warm hug 🫂",
  "Can't wait to see you ✨",
];

export default function Navigation() {
  const pathname = usePathname();
  const { profile, pair, partner } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, sendPing } = useNotifications();

  const [visible, setVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
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

  // Rate-limited Ping trigger
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
      {/* ══════════════════════════════════════════════════════════
          GLOBAL TOP CONTROL BAR
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-40 h-20 px-6 md:px-12 flex items-center justify-between pointer-events-none">
        
        {/* Left: Brand Logo & Streak Counter */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link
            href="/dashboard"
            className="flex items-center select-none transition-opacity hover:opacity-85"
          >
            <Image src="/logo-book.png" alt="Pairfect" height={36} width={36} className="rounded-lg shadow-sm" priority />
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

        {/* Right Controls: Ping, Notifications & Profile Avatar */}
        <div className="flex items-center gap-3 pointer-events-auto select-none">

          {/* Thinking of You Ping */}
          {partner && (
            <div className="relative" ref={pingMenuRef}>
              <button
                onClick={() => setShowPingMenu(!showPingMenu)}
                className="btn-journal-ghost px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 !rounded-full shadow-xs"
                title="Send a Thinking of You ping to your partner"
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
                    transition={{ duration: 0.2, ease: EASE_PAPER }}
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

          {/* Notification Bell */}
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
                  transition={{ duration: 0.2, ease: EASE_PAPER }}
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
                      {notifications.map((n) => {
                        const getNotifRoute = (notif: any) => {
                          if (notif.metadata?.route) return notif.metadata.route;
                          if (notif.type === "letter_sent" || notif.type === "reaction_reply") return "/love-letter";
                          if (notif.type === "gratitude_note") return "/gratitude-jar";
                          if (notif.type === "memory_added") return "/stories";
                          if (notif.type === "game_started") return "/play";
                          return "/dashboard";
                        };

                        return (
                          <Link
                            key={n.id}
                            href={getNotifRoute(n)}
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
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${!n.read ? "bg-[var(--burgundy)]" : "bg-[var(--border)]"}`} />
                              <div className="flex-1">
                                <p className="font-heading font-semibold text-xs text-[var(--text)]">{n.title}</p>
                                {n.body && <p className="text-[11px] text-[var(--text-soft)] line-clamp-1 mt-0.5">{n.body}</p>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full overflow-hidden bg-[var(--burgundy)] text-white font-sans flex items-center justify-center text-sm font-bold select-none shadow-sm transition-transform hover:scale-105 active:scale-95 border border-[var(--border)]"
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

      {/* Ping Status Feedback */}
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


      {/* ══════════════════════════════════════════════════════════
          DESKTOP FLOATING HANDCRAFTED BOOKMARK SIDEBAR
          Designed to Apple Human Interface Specifications
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ x: -100, opacity: 0, y: "-50%" }}
            animate={{ x: 0, opacity: 1, y: "-50%" }}
            exit={{ x: -100, opacity: 0, y: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="hidden md:block fixed left-6 top-1/2 z-50"
            aria-label="Main Navigation"
          >
            <motion.div
              onMouseEnter={() => setIsExpanded(true)}
              onMouseLeave={() => setIsExpanded(false)}
              animate={{ width: isExpanded ? 110 : 84 }}
              transition={{ duration: 0.22, ease: EASE_PAPER }}
              className="relative flex flex-col items-center py-6 px-3 rounded-[999px] bg-[#FFFDF9] border border-[rgba(140,44,61,0.08)] paper-grain select-none overflow-visible"
              style={{
                boxShadow: "0 2px 6px rgba(44,38,40,0.04), 0 14px 36px rgba(44,38,40,0.08), 0 28px 60px rgba(44,38,40,0.06)",
              }}
            >
              {/* Inner highlight ring */}
              <div className="absolute inset-0 rounded-[999px] border border-white/60 pointer-events-none" />

              {/* Grouped Navigation Clusters */}
              <div className="flex flex-col items-center gap-5 relative z-10 w-full">
                {NAV_GROUPS.map((group, gIdx) => (
                  <React.Fragment key={group.title}>
                    {gIdx > 0 && (
                      <div
                        className="w-[28px] h-[1px] my-0.5 rounded-full"
                        style={{ backgroundColor: "var(--border-warm)" }}
                      />
                    )}

                    <div className="flex flex-col items-center gap-2.5 w-full">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          currentPath === item.href ||
                          (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                        return (
                          <div
                            key={item.href}
                            className="relative flex items-center justify-center w-full"
                            onMouseEnter={() => setHoveredHref(item.href)}
                            onMouseLeave={() => setHoveredHref(null)}
                          >
                            <Link
                              href={item.href}
                              aria-label={item.label}
                              className={`relative flex items-center ${
                                isExpanded ? "justify-start px-3 gap-2.5 w-full" : "justify-center w-11"
                              } h-11 rounded-full transition-all duration-200 active:scale-95 focus-visible:outline-none`}
                            >
                              {/* Layered Active Item Object */}
                              {isActive && (
                                <motion.div
                                  layoutId="bookmark-active-indicator"
                                  className="absolute inset-0 rounded-full bg-[var(--burgundy)] shadow-md"
                                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                  style={{
                                    boxShadow: "0 10px 24px rgba(140,44,61,0.22)",
                                  }}
                                />
                              )}

                              {/* Hover Highlight (inactive items) */}
                              {!isActive && hoveredHref === item.href && (
                                <div className="absolute inset-0 rounded-full bg-[var(--paper-mid)] border border-[var(--border)] opacity-80" />
                              )}

                              {/* Icon & Label */}
                              <Icon
                                strokeWidth={1.75}
                                className={`w-5 h-5 relative z-10 transition-transform duration-200 ${
                                  isActive
                                    ? "text-white rotate-[1deg]"
                                    : hoveredHref === item.href
                                    ? "text-[var(--burgundy)] -translate-y-0.5"
                                    : "text-[var(--text-soft)]"
                                }`}
                              />

                              {isExpanded && (
                                <span
                                  className={`text-xs font-sans font-medium tracking-[0.02em] whitespace-nowrap relative z-10 ${
                                    isActive ? "text-white font-bold" : "text-[var(--text)]"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              )}
                            </Link>

                            {/* Floating Premium Paper Tooltip (when collapsed) */}
                            {!isExpanded && hoveredHref === item.href && (
                              <motion.div
                                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                                transition={{ duration: 0.18, ease: EASE_PAPER }}
                                className="absolute left-full ml-3 px-3 py-1.5 rounded-[14px] bg-[#FFFDF9] border border-[rgba(140,44,61,0.1)] shadow-md whitespace-nowrap z-50 text-[13px] font-sans font-medium tracking-[0.02em] text-[#3D2432] pointer-events-none paper-grain"
                              >
                                {item.label}
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════════════
          MOBILE FLOATING BOTTOM BOOKMARK CAPSULE
          Reuses exact same paper bookmark design language
          ══════════════════════════════════════════════════════════ */}
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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[999px] bg-[#FFFDF9] border border-[rgba(140,44,61,0.08)] paper-grain select-none shadow-2xl"
              style={{
                boxShadow: "0 10px 30px rgba(44,38,40,0.12), 0 4px 12px rgba(44,38,40,0.06)",
              }}
            >
              {[
                { href: "/dashboard", icon: Home, label: "Home" },
                { href: "/love-letter", icon: Mail, label: "Letters" },
                { href: "/photo-booth", icon: Camera, label: "Photos" },
                { href: "/play", icon: Gamepad2, label: "Play" },
                { href: "/gratitude-jar", icon: Gift, label: "Gratitude" },
                { href: "/stories", icon: Clock, label: "Timeline" },
                { href: "/profile", icon: User, label: "Profile" },
              ].map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active-pill"
                        className="absolute inset-0 rounded-full bg-[var(--burgundy)]"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon
                      strokeWidth={1.75}
                      className={`w-4 h-4 relative z-10 ${
                        isActive ? "text-white" : "text-[var(--text-soft)]"
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
