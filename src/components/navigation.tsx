"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
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
} from "lucide-react";

const CLUSTERS = [
  [
    { href: "/dashboard", icon: Home, label: "Home" }
  ],
  [
    { href: "/love-letter", icon: Mail, label: "Letters" },
    { href: "/checkin", icon: BookOpen, label: "Journal" },
    { href: "/moments", icon: ImageIcon, label: "Memories" }
  ],
  [
    { href: "/play", icon: Gamepad2, label: "Playroom" },
    { href: "/gratitude-jar", icon: Gift, label: "Gratitude" },
    { href: "/stories", icon: Clock, label: "Timeline" }
  ],
  [
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" }
  ]
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onHide = () => setVisible(false);
    const onShow = () => setVisible(true);
    window.addEventListener("navigation-hide", onHide);
    window.addEventListener("navigation-show", onShow);
    return () => {
      window.removeEventListener("navigation-hide", onHide);
      window.removeEventListener("navigation-show", onShow);
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

  return (
    <>
      {/* â”€â”€â”€ GLOBAL TOP BAR â”€â”€â”€ */}
      <div className="fixed top-0 left-0 right-0 z-40 h-20 px-6 md:px-12 flex items-center justify-between pointer-events-none">
        {/* Left: Logo image */}
        <Link
          href="/dashboard"
          className="flex items-center pointer-events-auto select-none transition-opacity hover:opacity-85"
        >
          <Image src="/logo-book.png" alt="Pairfect" height={36} width={36} className="rounded-lg" priority />
        </Link>

        {/* Right: Avatar â€” chibi character or initial fallback */}
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full overflow-hidden bg-[var(--burgundy)] text-[#F8F3EE] font-sans flex items-center justify-center text-sm font-bold pointer-events-auto select-none shadow-sm transition-transform hover:scale-105 active:scale-95"
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

      {/* â”€â”€â”€ FLOATING LEFT VERTICAL DOCK â”€â”€â”€ */}
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
            <div
              className="flex flex-col items-center gap-2 py-4 px-2.5 rounded-full bg-[rgba(255,255,255,0.55)] dark:bg-[rgba(30,20,14,0.65)] border border-[rgba(255,255,255,0.6)] dark:border-[rgba(61,48,40,0.6)] backdrop-blur-md"
              style={{
                boxShadow: "0 10px 30px var(--shadow)",
              }}
            >
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

