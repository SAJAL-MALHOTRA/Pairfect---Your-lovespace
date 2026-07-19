"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  Heart, Home, BookOpen, Settings, LogOut, Gamepad2, 
  Sun, Moon, Camera, Compass, Smile
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [navigationHidden, setNavigationHidden] = useState(false);

  useEffect(() => {
    const handleHide = () => setNavigationHidden(true);
    const handleShow = () => setNavigationHidden(false);

    window.addEventListener("navigation-hide", handleHide);
    window.addEventListener("navigation-show", handleShow);

    return () => {
      window.removeEventListener("navigation-hide", handleHide);
      window.removeEventListener("navigation-show", handleShow);
    };
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/love-letter", label: "Letters", icon: Heart },
    { href: "/checkin", label: "Journal", icon: BookOpen },
    { href: "/moments", label: "Memories", icon: Camera },
    { href: "/play", label: "Play", icon: Gamepad2 },
    { href: "/stories", label: "Timeline", icon: Compass },
    { href: "/profile", label: "Profile", icon: Smile },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-4 py-2 bg-[#FAF6EE]/90 dark:bg-[#28221D]/90 backdrop-blur-md border border-[#EAE3D5] dark:border-[#3E352E] rounded-full shadow-lg transition-all duration-500 ease-in-out select-none max-w-[95vw] md:max-w-2xl ${
        navigationHidden
          ? "translate-y-28 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
    >
      {/* Navigation links */}
      <div className="flex items-center gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 relative group cursor-pointer ${
                isActive
                  ? "bg-[#802030] text-[#FCFBF9] dark:bg-[#B03B50] font-bold shadow-sm"
                  : "text-[#7C7267] hover:bg-[#FAF6EE] dark:text-[#A59B8E] dark:hover:bg-[#1C1713]/40 hover:text-[#2E2A25] dark:hover:text-[#E8E2D5]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className={`transition-all duration-300 ${isActive ? "inline" : "hidden sm:inline"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Vertical divider */}
      <div className="w-px h-5 bg-[#EAE3D5] dark:bg-[#3E352E] mx-1" />

      {/* Utility Actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          className="p-1.5 text-[#7C7267] dark:text-[#A59B8E] hover:text-[#2E2A25] dark:hover:text-[#E8E2D5] rounded-full hover:bg-[#FAF6EE] dark:hover:bg-[#1C1713]/40 active:scale-95 transition-all cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700 fill-slate-700/10" />
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={signOut}
          title="Sign Out"
          className="p-1.5 text-[#7C7267] dark:text-[#A59B8E] hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-[#FAF6EE] dark:hover:bg-[#1C1713]/40 active:scale-95 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}
