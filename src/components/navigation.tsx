"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Heart, Home, Calendar, History, Sparkles, BookOpen, Settings, LogOut, User } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { profile, partner, signOut } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/checkin", label: "Check-in", icon: Calendar },
    { href: "/history", label: "History", icon: History },
    { href: "/recap", label: "Recap", icon: Sparkles },
    { href: "/moments", label: "Moments", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-card-border px-4 sm:px-6 lg:px-8 py-3 bg-white/70 dark:bg-[#151312]/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-2xl bg-brand-rose-500 flex items-center justify-center text-white shadow-md shadow-brand-rose-200 dark:shadow-none group-hover:scale-105 active:scale-95 transition-all">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground bg-gradient-to-r from-brand-rose-500 to-brand-peach-500 bg-clip-text text-transparent">
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-rose-500/10 text-brand-rose-600 dark:text-brand-rose-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-card-border/30"
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
              className="w-8 h-8 rounded-full border-2 border-background bg-brand-rose-200 dark:bg-brand-rose-950/40 text-brand-rose-700 dark:text-brand-rose-300 flex items-center justify-center text-xs font-semibold select-none shadow-sm"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(profile?.display_name || "Me")
              )}
            </div>

            {/* Partner Avatar */}
            {partner && (
              <div
                title={partner.display_name}
                className="w-8 h-8 rounded-full border-2 border-background bg-brand-peach-200 dark:bg-brand-peach-950/40 text-brand-peach-700 dark:text-brand-peach-300 flex items-center justify-center text-xs font-semibold select-none shadow-sm"
              >
                {partner.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partner.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(partner.display_name)
                )}
              </div>
            )}
          </div>

          <button
            onClick={signOut}
            title="Sign Out"
            className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/10 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar at the bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-card-border px-4 py-2 flex justify-around items-center bg-white/80 dark:bg-[#151312]/80 backdrop-blur-lg z-50">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                isActive
                  ? "text-brand-rose-500 scale-105"
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
