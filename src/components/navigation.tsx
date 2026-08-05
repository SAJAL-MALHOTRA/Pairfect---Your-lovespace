"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
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

/* ══════════════════════════════════════════════════
   SPRING PHYSICS — Apple Liquid Glass spec
   stiffness 250, damping 26, mass 0.9
   ══════════════════════════════════════════════════ */
const DOCK_SPRING = { stiffness: 250, damping: 26, mass: 0.9 };
const ACTIVE_SPRING = { stiffness: 400, damping: 32 };

/* ── Dock icon geometry ── */
const ICON_SIZE = 44;       // Base icon container size
const ICON_GAP = 6;         // Gap between icons
const MAGNIFY_SCALE = 1.35; // Hovered icon max scale
const NEIGHBOR_SCALE = 1.12; // Adjacent icons scale
const DOCK_BASE_WIDTH = 78;
const DOCK_EXPANDED_WIDTH = 180;

/* ── Flat list of all nav items for the dock fish-eye ── */
interface NavItem {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  group: number;
}

const DOCK_ITEMS: NavItem[] = [
  { href: "/dashboard",    icon: Home,     label: "Home",       group: 0 },
  { href: "/love-letter",  icon: Mail,     label: "Letters",    group: 0 },
  { href: "/photo-booth",  icon: Camera,   label: "Photobooth", group: 0 },
  { href: "/play",         icon: Gamepad2, label: "Playroom",   group: 0 },
  { href: "/gratitude-jar",icon: Gift,     label: "Gratitude",  group: 1 },
  { href: "/stories",      icon: Clock,    label: "Timeline",   group: 1 },
  { href: "/watch",        icon: Tv,       label: "Watch",      group: 1 },
  { href: "/profile",      icon: User,     label: "Profile",    group: 2 },
  { href: "/settings",     icon: Settings, label: "Settings",   group: 2 },
];

const MOBILE_ITEMS = [
  { href: "/dashboard",     icon: Home,     label: "Home" },
  { href: "/love-letter",   icon: Mail,     label: "Letters" },
  { href: "/photo-booth",   icon: Camera,   label: "Photos" },
  { href: "/play",          icon: Gamepad2, label: "Play" },
  { href: "/gratitude-jar", icon: Gift,     label: "Gratitude" },
  { href: "/stories",       icon: Clock,    label: "Timeline" },
  { href: "/profile",       icon: User,     label: "Profile" },
];

const PING_PHRASES = [
  "Thinking of you ♡",
  "Missing you",
  "Sending a warm hug 🫂",
  "Can't wait to see you ✨",
];


/* ══════════════════════════════════════════════════
   LIQUID DOCK ICON — macOS-style fish-eye per icon
   ══════════════════════════════════════════════════ */
function LiquidDockIcon({
  item,
  index,
  mouseY,
  isActive,
  isHovered,
  onHover,
  onLeave,
}: {
  item: NavItem;
  index: number;
  mouseY: any;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  // Calculate distance from cursor to this icon's center
  const distance = useTransform(mouseY, (val: number) => {
    if (!ref.current || val < 0) return 150; // far away
    const rect = ref.current.getBoundingClientRect();
    const iconCenter = rect.top + rect.height / 2;
    return Math.abs(val - iconCenter);
  });

  // Map distance → scale using smooth interpolation
  const scaleMotion = useTransform(distance, [0, 60, 120], [MAGNIFY_SCALE, NEIGHBOR_SCALE, 1]);
  const scale = useSpring(scaleMotion, DOCK_SPRING);

  return (
    <motion.div
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ scale }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Link
        href={item.href}
        aria-label={item.label}
        className="relative flex items-center justify-center w-11 h-11 rounded-full focus-visible:outline-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* ── Active: Wine glass orb with inner glow ── */}
        {isActive && (
          <motion.div
            layoutId="liquid-active-orb"
            className="absolute inset-0 rounded-full"
            transition={ACTIVE_SPRING}
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(180,60,80,0.95), rgba(140,44,61,0.88))",
              boxShadow: [
                "0 12px 30px rgba(140,44,61,0.25)",
                "0 4px 12px rgba(140,44,61,0.15)",
                "inset 0 1px 2px rgba(255,255,255,0.25)",
                "inset 0 -1px 2px rgba(0,0,0,0.08)",
              ].join(", "),
            }}
          >
            {/* Specular highlight — tiny reflection */}
            <div
              className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[18px] h-[6px] rounded-full"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))",
              }}
            />
          </motion.div>
        )}

        {/* ── Hover highlight (non-active) ── */}
        {!isActive && isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-full"
            style={{
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
            }}
          />
        )}

        {/* Icon */}
        <Icon
          strokeWidth={1.75}
          className={`w-[19px] h-[19px] relative z-10 transition-colors duration-150 ${
            isActive
              ? "text-white"
              : isHovered
              ? "text-[#8C2C3D]"
              : "text-[rgba(60,45,45,0.8)]"
          }`}
        />
      </Link>

      {/* ── Floating glass tooltip ── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-4 px-[18px] py-[10px] rounded-[999px] whitespace-nowrap z-50 pointer-events-none select-none"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.4)",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "var(--font-sans), Inter, system-ui, sans-serif",
              letterSpacing: "0.02em",
              color: "#3D2432",
            }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════
   MAIN NAVIGATION COMPONENT
   ══════════════════════════════════════════════════ */
export default function Navigation() {
  const pathname = usePathname();
  const { profile, pair, partner } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, sendPing } = useNotifications();

  const [visible, setVisible] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [showPingMenu, setShowPingMenu] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  const pingMenuRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // Mouse Y for dock fish-eye magnification
  const mouseY = useMotionValue(-1);

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

  // Build group divider positions
  const groupBoundaries = new Set<number>();
  let runningIdx = 0;
  for (const item of DOCK_ITEMS) {
    if (runningIdx > 0 && DOCK_ITEMS[runningIdx - 1].group !== item.group) {
      groupBoundaries.add(runningIdx);
    }
    runningIdx++;
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════
          TOP CONTROL BAR — Logo, Streak, Ping, Bell, Avatar
          ══════════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-40 h-20 px-6 md:px-12 flex items-center justify-between pointer-events-none">

        {/* Left: Logo & Streak */}
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

        {/* Right: Ping + Bell + Avatar */}
        <div className="flex items-center gap-3 pointer-events-auto select-none">

          {/* Thinking of You Ping */}
          {partner && (
            <div className="relative" ref={pingMenuRef}>
              <button
                onClick={() => setShowPingMenu(!showPingMenu)}
                className="px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 rounded-full shadow-xs transition-all hover:scale-105 active:scale-95"
                title="Send a Thinking of You ping"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(16px) saturate(180%)",
                  WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "var(--burgundy)",
                  fontWeight: 600,
                }}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline font-sans text-xs">Ping</span>
              </button>

              <AnimatePresence>
                {showPingMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 p-2 rounded-2xl z-50 space-y-1"
                    style={{
                      background: "rgba(255,255,255,0.65)",
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.4)",
                    }}
                  >
                    <p className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
                      Send a Ping to {partner.display_name || "partner"}
                    </p>
                    {PING_PHRASES.map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTriggerPing(phrase)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-sans text-[var(--text)] hover:bg-white/40 hover:text-[var(--burgundy)] transition-colors flex items-center justify-between"
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
              className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Notifications"
              style={{
                background: "rgba(255,255,255,0.45)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "var(--text-soft)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
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
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto p-3 rounded-2xl z-50 space-y-2"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(32px) saturate(180%)",
                    WebkitBackdropFilter: "blur(32px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.4)",
                  }}
                >
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-white/20">
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
                                ? "bg-white/40 border border-white/30 font-medium"
                                : "hover:bg-white/20 opacity-80"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${!n.read ? "bg-[var(--burgundy)]" : "bg-black/10"}`} />
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
            className="w-9 h-9 rounded-full overflow-hidden text-white font-sans flex items-center justify-center text-sm font-bold select-none transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "var(--burgundy)",
              boxShadow: "0 4px 12px rgba(140,44,61,0.2), inset 0 1px 1px rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-xs font-sans font-medium shadow-lg flex items-center gap-2"
            style={{
              background: "rgba(140,44,61,0.88)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 12px 30px rgba(140,44,61,0.25)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{pingStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════
          DESKTOP — LIQUID GLASS DOCK
          macOS Dock fish-eye + Apple Liquid Glass material
          ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ x: -100, opacity: 0, y: "-50%" }}
            animate={{ x: 0, opacity: 1, y: "-50%" }}
            exit={{ x: -100, opacity: 0, y: "-50%" }}
            transition={{ type: "spring", ...DOCK_SPRING }}
            className="hidden md:block fixed left-8 top-1/2 z-50"
            aria-label="Main Navigation"
            onMouseMove={(e) => mouseY.set(e.clientY)}
            onMouseEnter={() => setIsDockHovered(true)}
            onMouseLeave={() => {
              mouseY.set(-1);
              setIsDockHovered(false);
              setHoveredIndex(null);
            }}
          >
            {/* Liquid Glass Container */}
            <div
              className="relative flex flex-col items-center py-5 rounded-[999px] select-none overflow-visible"
              style={{
                width: `${DOCK_BASE_WIDTH}px`,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(32px) saturate(180%) brightness(115%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%) brightness(115%)",
                border: "1px solid rgba(255,255,255,0.28)",
                boxShadow: [
                  "0 20px 60px rgba(0,0,0,0.15)",
                  "inset 0 8px 20px rgba(255,255,255,0.15)",
                  "inset 0 1px 0 rgba(255,255,255,0.3)",
                ].join(", "),
              }}
            >
              {/* Inner glass gradient highlight */}
              <div
                className="absolute inset-0 rounded-[999px] pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))",
                }}
              />

              {/* Animated specular shimmer */}
              <div
                className="absolute inset-0 rounded-[999px] pointer-events-none overflow-hidden"
              >
                <motion.div
                  animate={{
                    y: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-x-0 h-[40%]"
                  style={{
                    background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)",
                  }}
                />
              </div>

              {/* Glass reflection underneath (floor reflection) */}
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[60%] h-[6px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse, rgba(255,255,255,0.12), transparent)",
                  filter: "blur(3px)",
                }}
              />

              {/* Navigation Icons */}
              <div className="flex flex-col items-center gap-1 relative z-10 w-full px-2.5">
                {DOCK_ITEMS.map((item, i) => {
                  const isActive =
                    currentPath === item.href ||
                    (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                  const showDivider = groupBoundaries.has(i);

                  return (
                    <React.Fragment key={item.href}>
                      {/* Group Divider */}
                      {showDivider && (
                        <div
                          className="w-[28px] h-[1px] my-1.5 rounded-full"
                          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                        />
                      )}

                      <LiquidDockIcon
                        item={item}
                        index={i}
                        mouseY={mouseY}
                        isActive={isActive}
                        isHovered={hoveredIndex === i}
                        onHover={() => setHoveredIndex(i)}
                        onLeave={() => setHoveredIndex(null)}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════
          MOBILE — BOTTOM FLOATING LIQUID GLASS DOCK
          Same glass material, horizontal layout
          ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ y: 80, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 80, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", ...DOCK_SPRING }}
            className="md:hidden fixed bottom-6 left-1/2 z-50"
            aria-label="Mobile Navigation"
          >
            <div
              className="flex items-center gap-1 px-3 py-2 rounded-[999px] select-none"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(32px) saturate(180%) brightness(115%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%) brightness(115%)",
                border: "1px solid rgba(255,255,255,0.28)",
                boxShadow: [
                  "0 20px 60px rgba(0,0,0,0.15)",
                  "inset 0 4px 12px rgba(255,255,255,0.12)",
                  "inset 0 1px 0 rgba(255,255,255,0.3)",
                ].join(", "),
              }}
            >
              {/* Inner gradient highlight */}
              <div
                className="absolute inset-0 rounded-[999px] pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.02))",
                }}
              />

              {MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/dashboard" && currentPath.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full transition-transform active:scale-90 z-10"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-liquid-active"
                        className="absolute inset-0 rounded-full"
                        transition={ACTIVE_SPRING}
                        style={{
                          background: "radial-gradient(circle at 35% 30%, rgba(180,60,80,0.95), rgba(140,44,61,0.88))",
                          boxShadow: "0 8px 20px rgba(140,44,61,0.25), inset 0 1px 2px rgba(255,255,255,0.2)",
                        }}
                      >
                        {/* Tiny specular dot */}
                        <div
                          className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[14px] h-[5px] rounded-full"
                          style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0))",
                          }}
                        />
                      </motion.div>
                    )}
                    <Icon
                      strokeWidth={1.75}
                      className={`w-4 h-4 relative z-10 ${
                        isActive ? "text-white" : "text-[rgba(60,45,45,0.8)]"
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
