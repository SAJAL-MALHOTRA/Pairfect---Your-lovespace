"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Wind, Droplets, CloudRain, Sun, Cloud, Moon, RefreshCw, Send, Mail, Edit3 } from "lucide-react";
import { ChibiAvatar, parseAvatarConfig } from "@/components/chibi-avatar";
import { getTimeOfDay } from "@/lib/weather-codes";

interface MeanwhileData {
  state: "no_city" | "waiting_partner" | "no_pair" | "complete";
  you?: { city: string; country: string; timezone: string } | null;
  partner?: { city: string; country: string; timezone: string } | null;
  partnerName?: string;
  distance?: {
    miles: number;
    km: number;
    label: string;
  };
  partnerWeather?: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    description: string;
    icon: string;
    isDay: boolean;
    updatedAt: string;
  };
  yourWeather?: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    description: string;
    icon: string;
  };
}

interface MeanwhileCardProps {
  userProfile: any;
  partnerProfile: any;
  onOpenCitySelector: () => void;
}

const MICROCOPY_QUOTES = [
  "Same sky, different places. ♥",
  "Miles may lie between us, but we share the same sky. ♥",
  "One little window into their day.",
  "Different places. Same story.",
  "Distance makes the little moments mean more.",
];

export default function MeanwhileCard({ userProfile, partnerProfile, onOpenCitySelector }: MeanwhileCardProps) {
  const [data, setData] = useState<MeanwhileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [partnerTime, setPartnerTime] = useState<string>("");

  const fetchMeanwhileData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/meanwhile");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch meanwhile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeanwhileData();
  }, [userProfile?.city, partnerProfile?.city]);

  // Live ticking clock for partner's timezone
  useEffect(() => {
    if (!data?.partner?.timezone) return;

    const updateClock = () => {
      try {
        const now = new Date();
        const formatted = now.toLocaleTimeString("en-US", {
          timeZone: data.partner?.timezone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setPartnerTime(formatted);
      } catch (e) {
        setPartnerTime("8:42 PM");
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [data?.partner?.timezone]);

  // Rotate microcopy quote on mount
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * MICROCOPY_QUOTES.length);
    setQuoteIndex(randomIdx);
  }, []);

  const partnerName = partnerProfile?.display_name || data?.partnerName || "partner";
  const myName = userProfile?.display_name || "You";

  // Render avatars helper
  const renderAvatar = (prof: any, defaultInitial: string) => {
    if (prof?.avatar_url) {
      return (
        <ChibiAvatar
          config={parseAvatarConfig(prof.avatar_url)}
          pose="profile"
          className="w-full h-full"
        />
      );
    }
    return (
      <span className="font-heading font-bold text-lg text-[var(--burgundy)]">
        {prof?.display_name?.charAt(0).toUpperCase() || defaultInitial}
      </span>
    );
  };

  // Weather background SVG illustration component
  const AtmosphericBg = ({ isDay, description }: { isDay?: boolean; description?: string }) => {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px] opacity-25">
        <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" preserveAspectRatio="none">
          <circle cx="340" cy="50" r="80" fill="url(#sunGlow)" opacity="0.6" />
          <path
            d="M 50 180 Q 150 140 250 190 T 400 170 L 400 240 L 0 240 Z"
            fill="var(--rose)"
            opacity="0.15"
          />
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD9E3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFF3F6" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // STATE 1: Loading
  // ═══════════════════════════════════════════════════════════════
  if (loading && !data) {
    return (
      <div
        className="w-full p-8 rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center min-h-[280px] shadow-sm space-y-3"
      >
        <RefreshCw className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
        <p className="text-xs font-mono text-[var(--text-soft)] uppercase tracking-wider">
          Connecting your skies...
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE 2: Neither has a city set
  // ═══════════════════════════════════════════════════════════════
  if (data?.state === "no_city") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full p-8 sm:p-10 rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] shadow-crafted-card flex flex-col items-center text-center space-y-5 overflow-hidden paper-grain"
      >
        <div className="w-14 h-14 rounded-full bg-[var(--rose)]/20 text-[var(--burgundy)] flex items-center justify-center shadow-xs">
          <MapPin className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md">
          <p className="typo-chapter">Meanwhile Proximity</p>
          <h2 className="typo-display text-2xl sm:text-3xl text-[var(--text)]">
            Where in the world are you two? ♥
          </h2>
          <p className="font-sans text-xs text-[var(--text-soft)] leading-relaxed">
            Choose your city so Pairfect can show your distance, {partnerName}'s local weather and local time. Your exact location is never shared.
          </p>
        </div>

        <button
          onClick={onOpenCitySelector}
          className="btn-primary py-3 px-8 text-xs font-mono uppercase tracking-widest cursor-pointer shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Choose Your City →
        </button>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE 3: Current user has city, partner does not
  // ═══════════════════════════════════════════════════════════════
  if (data?.state === "waiting_partner") {
    const myCityName = data.you?.city || "your city";
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full p-8 sm:p-10 rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] shadow-crafted-card flex flex-col items-center text-center space-y-5 overflow-hidden paper-grain"
      >
        <div className="w-14 h-14 rounded-full bg-[var(--rose)]/20 text-[var(--burgundy)] flex items-center justify-center shadow-xs">
          <Heart className="w-7 h-7 fill-current" />
        </div>

        <div className="space-y-2 max-w-md">
          <p className="typo-chapter">Meanwhile Proximity</p>
          <h2 className="typo-display text-2xl sm:text-3xl text-[var(--text)]">
            You're in {myCityName} ♥
          </h2>
          <p className="font-sans text-xs text-[var(--text-soft)] leading-relaxed">
            Ask {partnerName} to choose their city in Pairfect so you can see your distance, their local weather, and local time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCitySelector}
            className="btn-secondary py-2.5 px-5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Change My City</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE 4: FULL MEANWHILE EXPERIENCE (Both partners have cities)
  // ═══════════════════════════════════════════════════════════════
  const youCity = data?.you?.city || "Jalandhar";
  const partnerCity = data?.partner?.city || "Delhi";
  const distanceLabel = data?.distance?.label || "86 miles apart";
  const pWeather = data?.partnerWeather;
  const yWeather = data?.yourWeather;
  const timeInfo = getTimeOfDay(data?.partner?.timezone || "Asia/Kolkata");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] shadow-crafted-hero overflow-hidden paper-grain p-6 sm:p-8 space-y-8"
    >
      <AtmosphericBg isDay={pWeather?.isDay} description={pWeather?.description} />

      {/* ── 1. HEADER & DISTANCE ── */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--burgundy)] font-bold">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>MEANWHILE</span>
          </div>

          <button
            onClick={onOpenCitySelector}
            className="text-[10px] font-mono text-[var(--text-soft)] hover:text-[var(--burgundy)] transition-colors flex items-center gap-1"
            title="Change your city"
          >
            <Edit3 className="w-3 h-3" />
            <span className="hidden sm:inline">Change City</span>
          </button>
        </div>

        {/* Large Pixel Distance Display */}
        <h2 className="font-pixel text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text)] tracking-wider pt-1">
          {distanceLabel}
        </h2>
      </div>

      {/* ── 2. TWO AVATARS & DOTTED HEART PATH CONNECTING CITIES ── */}
      <div className="relative z-10 py-4 flex items-center justify-between max-w-lg mx-auto w-full px-4 sm:px-8">
        
        {/* You Avatar */}
        <div className="flex flex-col items-center text-center space-y-2 shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--border)] bg-[var(--paper-warm)] p-1 shadow-md overflow-hidden flex items-center justify-center">
            {renderAvatar(userProfile, "Y")}
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text)] block">
              {myName}
            </span>
            <span className="text-[10px] font-sans text-[var(--text-soft)] block">
              {youCity}, India
            </span>
          </div>
        </div>

        {/* Connecting Dotted Arc Path with Floating Hearts */}
        <div className="flex-1 relative h-16 mx-3 flex items-center justify-center">
          <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40" fill="none">
            <path
              d="M 10 30 Q 100 0 190 30"
              stroke="var(--rose)"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>

          {/* Floating Heart Monogram in center */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center shadow-md"
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-4 h-4 fill-current" />
          </motion.div>
        </div>

        {/* Partner Avatar */}
        <div className="flex flex-col items-center text-center space-y-2 shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--border)] bg-[var(--paper-warm)] p-1 shadow-md overflow-hidden flex items-center justify-center">
            {renderAvatar(partnerProfile, "P")}
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text)] block">
              {partnerName}
            </span>
            <span className="text-[10px] font-sans text-[var(--text-soft)] block">
              {partnerCity}, India
            </span>
          </div>
        </div>

      </div>

      {/* ── 3. THEIR SKY & LOCAL TIME GRID ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Partner Weather Card ("THEIR SKY") */}
        <div
          className="p-5 rounded-[22px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-soft)] font-bold">
              THEIR SKY · {partnerCity}
            </span>
            <span className="text-xl" title={pWeather?.description}>
              {pWeather?.icon || "☁️"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-heading font-black text-4xl sm:text-5xl text-[var(--text)] leading-none">
                {pWeather?.temperature ?? 24}°C
              </div>
              <p className="font-sans font-medium text-xs text-[var(--text-soft)] mt-1">
                {pWeather?.description || "Cloudy"} · Feels like {pWeather?.feelsLike ?? 25}°
              </p>
            </div>
          </div>

          {/* Meteorological Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-soft)]">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[var(--rose)]" />
              <span>Hum {pWeather?.humidity ?? 68}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[var(--rose)]" />
              <span>Wind {pWeather?.windSpeed ?? 12}km/h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-[var(--rose)]" />
              <span>Rain {pWeather?.precipitation ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Partner Local Time Card */}
        <div
          className="p-5 rounded-[22px] border border-[var(--border)] bg-[var(--paper-warm)] shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-soft)] font-bold">
              THEIR LOCAL TIME · {partnerCity}
            </span>
            {timeInfo.period === "night" ? (
              <Moon className="w-4 h-4 text-[var(--burgundy)]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </div>

          <div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[var(--text)] leading-none tabular-nums">
              {partnerTime || "8:42 PM"}
            </div>
            <p className="font-quote italic text-sm text-[var(--burgundy)] mt-1.5">
              "{timeInfo.label}"
            </p>
          </div>

          {/* Your Weather Companion Comparison */}
          {yWeather && (
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-sans text-[var(--text-soft)]">
              <span>YOUR SKY ({youCity})</span>
              <span className="font-semibold text-[var(--text)]">
                {yWeather.icon} {yWeather.temperature}°C · {yWeather.description}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── 4. EMOTIONAL MICROCOPY & CTAs ── */}
      <div className="relative z-10 pt-2 flex flex-col items-center text-center space-y-5">
        <p className="font-quote italic text-lg sm:text-xl text-[var(--burgundy)] leading-relaxed max-w-lg">
          "{MICROCOPY_QUOTES[quoteIndex]}"
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Send Ping Action */}
          <Link
            href="/dashboard"
            onClick={(e) => {
              // Trigger ping button in navigation if available
              const pingBtn = document.querySelector<HTMLButtonElement>("button[title*='Thinking of You']");
              if (pingBtn) {
                e.preventDefault();
                pingBtn.click();
              }
            }}
            className="btn-primary py-3 px-7 text-xs font-mono uppercase tracking-widest inline-flex items-center gap-2 rounded-full shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send a Ping →</span>
          </Link>

          {/* Write a Letter Action */}
          <Link
            href="/love-letter"
            className="btn-secondary py-3 px-7 text-xs font-mono uppercase tracking-widest inline-flex items-center gap-2 rounded-full border-[var(--border)] bg-[var(--paper-warm)] text-[var(--text)] hover:border-[var(--burgundy)]"
          >
            <Mail className="w-3.5 h-3.5 text-[var(--burgundy)]" />
            <span>Write a Letter →</span>
          </Link>
        </div>

        {/* Open-Meteo Attribution */}
        <p className="text-[9px] font-mono text-[var(--text-soft)] opacity-60 pt-2">
          Weather data provided by Open-Meteo · City-level proximity only
        </p>
      </div>
    </motion.div>
  );
}
