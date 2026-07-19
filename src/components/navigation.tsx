"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  Heart, Home, BookOpen, Settings, LogOut, Gamepad2, 
  Tv, Sun, Moon, Timer, Scale, HelpCircle, Gift, 
  Brain, Camera, Compass, ChevronDown, Smile, Menu, X 
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { profile, partner, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState<{ [key: string]: boolean }>({});

  const toggleMobileDropdown = (name: string) => {
    setMobileDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navGroups = [
    {
      id: "journal",
      label: "Journal",
      icon: BookOpen,
      links: [
        { href: "/love-letter", label: "Love Letter", icon: Heart },
        { href: "/gratitude-jar", label: "Gratitude Jar", icon: Gift },
        { href: "/checkin", label: "Mood Check-in", icon: Smile },
      ]
    },
    {
      id: "play",
      label: "Play",
      icon: Gamepad2,
      links: [
        { href: "/riddle", label: "Riddle Night", icon: HelpCircle },
        { href: "/iq-duel", label: "IQ Duel", icon: Brain },
        { href: "/quiz", label: "Vibe Quiz", icon: Gamepad2 },
        { href: "/vibe-judge", label: "Between the Lines", icon: Scale },
      ]
    },
    {
      id: "memories",
      label: "Memories",
      icon: Compass,
      links: [
        { href: "/avatars", label: "Photobooth", icon: Camera },
        { href: "/moments", label: "Moments", icon: BookOpen },
        { href: "/stories", label: "Stories", icon: Compass },
      ]
    },
    {
      id: "together",
      label: "Together",
      icon: Tv,
      links: [
        { href: "/watch", label: "Watch Together", icon: Tv },
        { href: "/focus", label: "Focus Session", icon: Timer },
      ]
    },
    {
      id: "more",
      label: "More",
      icon: Settings,
      links: [
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  const isGroupActive = (group: typeof navGroups[0]) => {
    return group.links.some(link => pathname === link.href);
  };

  return (
    <nav className="sticky top-0 z-40 glass-panel px-4 sm:px-6 lg:px-8 py-3 animate-fade-in select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo (left-aligned) */}
        <Link href="/dashboard" className="flex items-center space-x-2 shrink-0 group">
          <img 
            src="/logo-book.png" 
            alt="Pairfect" 
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" 
          />
          <span className="font-sans text-lg font-black tracking-tight text-foreground gradient-text">
            Pairfect
          </span>
        </Link>

        {/* Links (center-aligned desktop nav) */}
        <div className="hidden md:flex items-center space-x-1.5 flex-1 justify-center max-w-2xl">
          {/* Home / Dashboard Link */}
          <Link
            href="/dashboard"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-button text-xs font-bold transition-all ${
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {/* Group Dropdowns */}
          {navGroups.map((group) => {
            const isActive = isGroupActive(group);
            const isOpen = activeDropdown === group.id;
            return (
              <div key={group.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(isOpen ? null : group.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-button text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : isOpen
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30 cursor-default" 
                      onClick={() => setActiveDropdown(null)} 
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 rounded-card border border-border bg-card p-2 shadow-lg z-40 animate-fade-in flex flex-col space-y-1">
                      {group.links.map((link) => {
                        const Icon = link.icon;
                        const isLinkActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-button text-xs font-bold transition-all ${
                              isLinkActive
                                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
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
            className="p-2 text-muted-foreground hover:text-foreground rounded-button hover:bg-muted active:scale-95 transition-all cursor-pointer"
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
            className="hidden md:block p-2 text-muted-foreground hover:text-red-500 rounded-button hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-button hover:bg-muted active:scale-95 transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile collapsible navigation drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background/98 backdrop-blur-lg p-6 flex flex-col animate-fade-in overflow-y-auto">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
              <img 
                src="/logo-book.png" 
                alt="Pairfect" 
                className="w-8 h-8 object-contain" 
              />
              <span className="font-sans text-lg font-black tracking-tight text-foreground gradient-text">
                Pairfect
              </span>
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              aria-label="Close Menu"
              className="p-2 text-muted-foreground hover:text-foreground rounded-button hover:bg-muted active:scale-[0.95]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-8 flex-1 flex flex-col space-y-4 pb-12">
            {/* Direct Home Link */}
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-button text-sm font-bold transition-all ${
                pathname === "/dashboard"
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Accordion Groups */}
            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = mobileDropdowns[group.id];
              const isGroupAct = isGroupActive(group);
              return (
                <div key={group.id} className="border border-border/40 rounded-card bg-card/50 overflow-hidden">
                  <button
                    onClick={() => toggleMobileDropdown(group.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                      isGroupAct 
                        ? "text-primary bg-primary/5" 
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <GroupIcon className="w-4 h-4" />
                      <span>{group.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/10 border-t border-border/20 p-2 flex flex-col space-y-1">
                      {group.links.map((link) => {
                        const Icon = link.icon;
                        const isLinkActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-button text-xs font-bold transition-all ${
                              isLinkActive
                                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Logout Mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-button text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}


