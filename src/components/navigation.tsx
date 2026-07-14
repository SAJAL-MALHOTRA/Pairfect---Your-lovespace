"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  Heart, Home, Calendar, History, Sparkles, BookOpen, 
  Settings, LogOut, User, Gamepad2, Tv, Sun, Moon, Timer,
  Scale, Camera
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { profile, partner, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/checkin", label: "Check-in", icon: Calendar },
    { href: "/history", label: "History", icon: History },
    { href: "/focus", label: "Focus", icon: Timer },
    { href: "/recap", label: "Recap", icon: Sparkles },
    { href: "/quiz", label: "Quiz", icon: Gamepad2 },
    { href: "/vibe-judge", label: "Judge", icon: Scale },
    { href: "/snap-hunt", label: "Hunt", icon: Camera },
    { href: "/watch", label: "Watch", icon: Tv },
    { href: "/avatars", label: "Avatars", icon: User },
    { href: "/moments", label: "Moments", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/70 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-xl animate-fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <img src="/logo-book.png" alt="Pairfect" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
          <span className="font-sans text-lg font-black tracking-tight text-foreground">
            Pairfect
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Avatars & Actions */}
        <div className="flex items-center space-x-4">
          <div className="flex -space-x-2">
            {/* User Avatar */}
            <div
              title={profile?.display_name}
              className="flex size-9 items-center justify-center rounded border-2 border-card bg-accent text-xs font-bold text-accent-foreground ring-1 ring-primary/30 select-none shadow-sm overflow-hidden"
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
                className="flex size-9 items-center justify-center rounded border-2 border-card bg-chart-5/60 text-xs font-bold text-secondary-foreground ring-1 ring-primary/30 select-none shadow-sm overflow-hidden"
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

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 text-muted-foreground hover:text-foreground rounded hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/10" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 fill-slate-700/10" />
            )}
          </button>

          <button
            onClick={signOut}
            title="Sign Out"
            className="p-2 text-muted-foreground hover:text-red-500 rounded hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar at the bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/60 px-4 py-2 flex justify-around items-center bg-background/80 backdrop-blur-lg z-50">
        {links.filter(l => !["/vibe-judge", "/snap-hunt"].includes(l.href)).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
