"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Mail, BookOpen, Gift, Image, Clock, Gamepad2, User, Settings, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

const NAV_ITEMS = [
  { href: "/dashboard",    icon: Home,      label: "Home"     },
  { href: "/love-letter",  icon: Mail,      label: "Letters"  },
  { href: "/checkin",      icon: BookOpen,  label: "Journal"  },
  { href: "/gratitude-jar", icon: Gift,     label: "Jar"      },
  { href: "/moments",      icon: Image,     label: "Memories" },
  { href: "/stories",      icon: Clock,     label: "Timeline" },
  { href: "/play",         icon: Gamepad2,  label: "Play"     },
  { href: "/profile",      icon: User,      label: "Us"       },
];

export default function Navigation() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onHide = () => { setVisible(false); };
    const onShow = () => { setVisible(true); };
    window.addEventListener("navigation-hide", onHide);
    window.addEventListener("navigation-show", onShow);
    return () => {
      window.removeEventListener("navigation-hide", onHide);
      window.removeEventListener("navigation-show", onShow);
    };
  }, []);

  // Don't render on auth / onboarding pages
  const hiddenRoutes = ["/login", "/signup", "/onboarding", "/auth/callback", "/avatars"];
  if (hiddenRoutes.some(r => pathname.startsWith(r))) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          aria-label="Main navigation"
        >
          {/* Tooltip labels — appear above hovered icon */}
          <AnimatePresence>
            {hoveredItem && (
              <motion.div
                key={hoveredItem}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute -top-9 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                {/* Find the label of the hovered item */}
                {(() => {
                  if (hoveredItem === "theme-toggle") {
                    return (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-mid)] bg-[var(--background)]/90 px-2.5 py-1 rounded-full border border-[var(--border-mid)] backdrop-blur-sm whitespace-nowrap shadow-sm">
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                      </span>
                    );
                  }
                  const item = NAV_ITEMS.find(i => i.href === hoveredItem);
                  if (!item) return null;
                  return (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-mid)] bg-[var(--background)]/90 px-2.5 py-1 rounded-full border border-[var(--border-mid)] backdrop-blur-sm whitespace-nowrap shadow-sm">
                      {item.label}
                    </span>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flex wrapper for Dock and Theme Switcher side-by-side */}
          <div className="flex items-center gap-3">
            {/* The dock pill */}
            <div
              className="flex items-center gap-0.5 px-3 py-2.5 rounded-full"
              style={{
                background: "rgba(253, 250, 244, 0.88)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                boxShadow:
                  "0 4px 24px rgba(46, 38, 28, 0.12), 0 1px 0 rgba(255,255,255,0.7) inset, 0 0 0 1px rgba(196,168,130,0.18)",
              }}
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="relative flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--seal-red)]"
                    style={{ color: isActive ? "var(--seal-red)" : "var(--ink-mid)" }}
                  >
                    {/* Active background pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "rgba(128,32,48,0.08)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}

                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 600, damping: 30 }}
                    >
                      <Icon
                        strokeWidth={isActive ? 2.2 : 1.7}
                        className="w-[19px] h-[19px] relative z-10 transition-[stroke-width] duration-150"
                      />
                    </motion.div>

                    {/* Active dot */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-dot"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--seal-red)]"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* Thin divider before settings */}
              <div className="w-px h-4 mx-0.5 bg-[var(--border-mid)]" />

              <Link
                href="/settings"
                aria-label="Settings"
                onMouseEnter={() => setHoveredItem("/settings")}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--seal-red)]"
                style={{ color: pathname === "/settings" ? "var(--seal-red)" : "var(--ink-light)" }}
              >
                <motion.div whileHover={{ scale: 1.12, rotate: 45 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                  <Settings strokeWidth={1.6} className="w-[17px] h-[17px]" />
                </motion.div>
              </Link>
            </div>

            {/* Quick Theme Toggle Button — placed just besides the bar */}
            <motion.button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              onMouseEnter={() => setHoveredItem("theme-toggle")}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              className="flex items-center justify-center w-11 h-11 rounded-full cursor-pointer transition-colors"
              style={{
                background: "rgba(253, 250, 244, 0.88)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                boxShadow:
                  "0 4px 24px rgba(46, 38, 28, 0.12), 0 1px 0 rgba(255,255,255,0.7) inset, 0 0 0 1px rgba(196,168,130,0.18)",
                color: "var(--ink-mid)",
              }}
            >
              {theme === "dark" ? (
                <Sun className="w-[19px] h-[19px] text-amber-500" strokeWidth={1.8} />
              ) : (
                <Moon className="w-[19px] h-[19px] text-indigo-900" strokeWidth={1.8} />
              )}
            </motion.button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
