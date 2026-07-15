"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  Heart, Home, BookOpen, Settings, LogOut, Gamepad2, 
  Tv, Sun, Moon, Timer, Scale, HelpCircle, Gift, 
  Brain, Camera, Compass, ChevronDown
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { profile, partner, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 5 core navigation elements visible in the main header row
  const primaryLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/gratitude-jar", label: "Gratitude Jar", icon: Gift },
    { href: "/moments", label: "Moments", icon: BookOpen },
    { href: "/stories", label: "Stories", icon: Compass },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Secondary tools and games hidden under the "More" dropdown to avoid wrapping bugs
  const activityLinks = [
    { href: "/avatars", label: "Photobooth", icon: Camera },
    { href: "/love-letter", label: "Love Letter", icon: Heart },
    { href: "/quiz", label: "Vibe Quiz", icon: Gamepad2 },
    { href: "/watch", label: "Watch Together", icon: Tv },
    { href: "/focus", label: "Focus Timer", icon: Timer },
    { href: "/vibe-judge", label: "AI Vibe Judge", icon: Scale },
    { href: "/riddle", label: "Riddle Night", icon: HelpCircle },
    { href: "/iq-duel", label: "IQ Duel", icon: Brain },
  ];

  // Combine links for mobile navigation filter fallback
  const mobileLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/gratitude-jar", label: "Jar", icon: Gift },
    { href: "/moments", label: "Moments", icon: BookOpen },
    { href: "/stories", label: "Stories", icon: Compass },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/70 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-xl animate-fade-in select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo (left-aligned) */}
        <Link href="/dashboard" className="flex items-center space-x-2 shrink-0 group">
          <img 
            src="/logo-book.png" 
            alt="Pairfect" 
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" 
          />
          <span className="font-sans text-lg font-black tracking-tight text-foreground">
            Pairfect
          </span>
        </Link>

        {/* Links (center-aligned flex layout) */}
        <div className="hidden md:flex items-center space-x-1.5 flex-1 justify-center max-w-xl">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Activities Dropdown for extra features */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer ${
                dropdownOpen ? "bg-muted" : ""
              }`}
            >
              <span>More</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-250 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30 cursor-default" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-2.5 shadow-lg z-40 animate-fade-in flex flex-col space-y-1">
                  {activityLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Avatars & Actions (right-aligned) */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex -space-x-1.5">
            {/* User Avatar */}
            <div
              title={profile?.display_name}
              className="flex size-8 items-center justify-center rounded border-2 border-card bg-accent text-[10px] font-bold text-accent-foreground ring-1 ring-primary/30 select-none shadow-sm overflow-hidden"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profile?.display_name || "Me")
              )}
            </div>

            {/* Partner Avatar */}
            {partner && (
              <div
                title={partner.display_name}
                className="flex size-8 items-center justify-center rounded border-2 border-card bg-chart-5/60 text-[10px] font-bold text-secondary-foreground ring-1 ring-primary/30 select-none shadow-sm overflow-hidden"
              >
                {partner.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partner.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(partner.display_name || "Partner")
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/10" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 fill-slate-700/10" />
            )}
          </button>

          {/* Logout */}
          <button
            onClick={signOut}
            title="Sign Out"
            className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar at the bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/60 px-4 py-2 flex justify-around items-center bg-background/80 backdrop-blur-lg z-50">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] mt-1 font-semibold">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
