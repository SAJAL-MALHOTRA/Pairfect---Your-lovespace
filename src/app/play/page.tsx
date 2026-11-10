"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import {
  Camera,
  Heart,
  Brain,
  MessageSquare,
  Scale,
  Gift,
  Mail,
  BookOpen,
  Sparkles,
  ArrowRight,
  Check,
  Search,
  Key,
  Flame,
  Palette,
  Gamepad2,
  Lock,
  Compass,
  Trophy,
  Moon,
  Home,
  X,
  Music,
  Mic,
  Flower2,
  Dices,
  Star,
  Share2,
  ExternalLink,
  Play,
  Volume2,
  MapPin,
  Gavel,
  ShieldCheck,
  Calendar,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ────────────────────────────────────────────────────────────
// Types & Milestone Schema
// ────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  longDescription: string;
  timeEstimate: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    nodeBg: string;
    nodeBorder: string;
    glowRing: string;
    badgeBg: string;
    badgeText: string;
  };
  isCompleted?: boolean;
  isCurrent?: boolean;
  highlights: string[];
}

// ────────────────────────────────────────────────────────────
// 8 Chapters Data (32 Curated Authentic Milestones)
// ────────────────────────────────────────────────────────────

const MILESTONES: Milestone[] = [
  // ── CHAPTER 1: START HERE ──────────────────────────────────
  {
    id: "photo-booth",
    chapterNumber: 1,
    chapterTitle: "Start Here",
    title: "Online Photobooth",
    badge: "FREE TO PLAY",
    tagline: "Korean 인생네컷 Virtual Photobooth",
    description: "Korean 인생네컷 Virtual Photobooth with real photostrips, film grain, magnetic prints & stickers.",
    longDescription: "Step into Pairfect's authentic Korean 인생네컷 photobooth. Snap synchronized 4-cut photostrips in real time across the distance, complete with vintage film grain, retro date stamps, magnetic border prints, and playful couple stickers.",
    timeEstimate: "3 mins · Live for two",
    route: "/photo-booth",
    icon: Camera,
    colorTheme: {
      bg: "bg-[#FFE4E8]",
      border: "border-rose-200",
      text: "text-rose-700",
      nodeBg: "bg-gradient-to-tr from-pink-100 to-rose-50",
      nodeBorder: "border-rose-400",
      glowRing: "border-rose-400",
      badgeBg: "bg-stone-900",
      badgeText: "text-white",
    },
    isCurrent: true,
    highlights: [
      "Real-time synchronized countdown shutter",
      "Authentic Korean 4-cut film strips & textures",
      "Magnetic fridge print export & cute stickers",
    ],
  },
  {
    id: "how-well-do-you-know-me",
    chapterNumber: 1,
    chapterTitle: "Start Here",
    title: "How Well Do You Know Me",
    badge: "COMPLETED",
    tagline: "Couple Match Game",
    description: "Reveal unexpected quirks and compare answers simultaneously to see how synced you are.",
    longDescription: "Answer 10 revealing questions about your partner's habits, pet peeves, and secret dreams. Lock in your guesses and flip them together to see who knows who best.",
    timeEstimate: "5 mins · Turn-based duel",
    route: "/play/love-match",
    icon: Heart,
    colorTheme: {
      bg: "bg-[#FFE4E8]",
      border: "border-rose-200",
      text: "text-rose-700",
      nodeBg: "bg-white",
      nodeBorder: "border-amber-400",
      glowRing: "border-amber-400",
      badgeBg: "bg-amber-500",
      badgeText: "text-white",
    },
    isCompleted: true,
    highlights: [
      "Simultaneous question flip cards",
      "Instant couple compatibility score",
      "Cute tiebreaker bonus questions",
    ],
  },
  {
    id: "daily-mood-checkin",
    chapterNumber: 1,
    chapterTitle: "Start Here",
    title: "Daily Mood Check-In",
    badge: "DAILY RITUAL",
    tagline: "Sanctuary Emotional Weather",
    description: "Daily Mood Check-In & Sanctuary Weather to see each other's emotional forecast.",
    longDescription: "Share your daily emotional temperature in seconds. From sunny and energetic to stormy and overwhelmed, Sanctuary Weather lets your partner know exactly how to care for you today without asking.",
    timeEstimate: "2 mins · Daily sync",
    route: "/checkin",
    icon: MessageSquare,
    colorTheme: {
      bg: "bg-[#FFE4E8]",
      border: "border-rose-200",
      text: "text-rose-700",
      nodeBg: "bg-white",
      nodeBorder: "border-rose-300",
      glowRing: "border-rose-300",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-700",
    },
    highlights: [
      "Live sanctuary weather widget",
      "Custom emotional battery sliders",
      "One-tap comfort care suggestions",
    ],
  },
  {
    id: "wax-sealed-love-letter",
    chapterNumber: 1,
    chapterTitle: "Start Here",
    title: "Wax-Sealed Love Letter",
    badge: "ROMANTIC",
    tagline: "Vintage Keepsake Post",
    description: "Wax-Sealed Love Letters with GIPHY stickers & envelope animations.",
    longDescription: "Write meaningful long-form letters on textured vintage parchment. Seal them with custom wax stamps, decorate with animated GIPHY stickers, and watch the envelope unseal with realistic folding physics.",
    timeEstimate: "5 mins · Keepsake",
    route: "/love-letter",
    icon: Mail,
    colorTheme: {
      bg: "bg-[#FFE4E8]",
      border: "border-rose-200",
      text: "text-rose-700",
      nodeBg: "bg-white",
      nodeBorder: "border-rose-300",
      glowRing: "border-rose-300",
      badgeBg: "bg-rose-600",
      badgeText: "text-white",
    },
    highlights: [
      "Authentic wax stamp cracking animation",
      "Vintage stationery, inks, and fonts",
      "Animated GIPHY stickers & cute envelopes",
    ],
  },

  // ── CHAPTER 2: WORDS & MEMORIES ─────────────────────────────
  {
    id: "shared-canvas",
    chapterNumber: 2,
    chapterTitle: "Words & Memories",
    title: "Shared Canvas",
    badge: "CO-OP ART",
    tagline: "Real-time Synchronized Drawing",
    description: "Doodle, draw, and leave sweet scribbles on a synchronized digital canvas.",
    longDescription: "Draw together on a real-time synchronized canvas. Sketch portraits of each other, play quick Pictionary, or leave secret handwritten notes that stay on your couple pinboard forever.",
    timeEstimate: "5 mins · Live drawing",
    route: "/moments",
    icon: Palette,
    colorTheme: {
      bg: "bg-[#E8F0FE]",
      border: "border-blue-200",
      text: "text-blue-700",
      nodeBg: "bg-white",
      nodeBorder: "border-blue-300",
      glowRing: "border-blue-400",
      badgeBg: "bg-blue-600",
      badgeText: "text-white",
    },
    highlights: [
      "Simultaneous dual live cursor tracking",
      "Watercolor and pastel ink brushes",
      "Save directly into your shared album",
    ],
  },
  {
    id: "gratitude-jar",
    chapterNumber: 2,
    chapterTitle: "Words & Memories",
    title: "Gratitude Jar",
    badge: "WARM & FUZZY",
    tagline: "Origami Notes in a Glass Jar",
    description: "Fold colorful origami notes and drop little moments of appreciation into your shared jar.",
    longDescription: "Fold colorful origami stars, cranes, and hearts filled with little reasons you appreciate each other. Shake the 3D jar to draw a memory when you need a gentle reminder of love.",
    timeEstimate: "3 mins · Daily appreciation",
    route: "/gratitude-jar",
    icon: Sparkles,
    colorTheme: {
      bg: "bg-[#E8F0FE]",
      border: "border-blue-200",
      text: "text-blue-700",
      nodeBg: "bg-white",
      nodeBorder: "border-amber-400",
      glowRing: "border-amber-400",
      badgeBg: "bg-amber-500",
      badgeText: "text-white",
    },
    isCompleted: true,
    highlights: [
      "3D glass jar physics with gentle shake",
      "Origami paper unfolding animations",
      "Searchable archive of grateful moments",
    ],
  },
  {
    id: "riddle-night",
    chapterNumber: 2,
    chapterTitle: "Words & Memories",
    title: "Riddle Night",
    badge: "BRAIN TEASER",
    tagline: "Collaborative Mind Benders",
    description: "Riddle Night with collaborative brain teasers to solve as a two-player team.",
    longDescription: "Tackle intriguing lateral thinking puzzles and witty riddles. Put your heads together, compare hints, and celebrate that eureka moment when you solve the clue together.",
    timeEstimate: "7 mins · Co-op brain workout",
    route: "/riddle",
    icon: HelpCircle,
    colorTheme: {
      bg: "bg-[#E8F0FE]",
      border: "border-blue-200",
      text: "text-blue-700",
      nodeBg: "bg-white",
      nodeBorder: "border-blue-300",
      glowRing: "border-blue-400",
      badgeBg: "bg-indigo-600",
      badgeText: "text-white",
    },
    highlights: [
      "Dual hint unlocking mechanism",
      "Progressive difficulty tiers",
      "Live partner scratchpad notes",
    ],
  },
  {
    id: "vibe-judge",
    chapterNumber: 2,
    chapterTitle: "Words & Memories",
    title: "Between the Lines",
    badge: "AI VIBE JUDGE",
    tagline: "Conflict Resolution & Humor",
    description: "Between the Lines with AI Vibe Judge conflict resolution and playful verdicts.",
    longDescription: "Turn misunderstandings into laughter. Paste confusing texts or summarize a minor disagreement. Pairfect's impartial AI Vibe Judge decodes subtext, validates both sides, and awards fair, playful verdicts.",
    timeEstimate: "4 mins · Conflict resolution",
    route: "/vibe-judge",
    icon: Scale,
    colorTheme: {
      bg: "bg-[#E8F0FE]",
      border: "border-blue-200",
      text: "text-blue-700",
      nodeBg: "bg-white",
      nodeBorder: "border-blue-300",
      glowRing: "border-blue-400",
      badgeBg: "bg-orange-500",
      badgeText: "text-white",
    },
    highlights: [
      "Impartial subtext and tone analysis",
      "Hilarious legal verdicts & reparations",
      "De-escalates tension with warm empathy",
    ],
  },

  // ── CHAPTER 3: PLAY & DUEL ──────────────────────────────────
  {
    id: "iq-duel",
    chapterNumber: 3,
    chapterTitle: "Play & Duel",
    title: "IQ Duel",
    badge: "#1 DUEL",
    tagline: "Simultaneous Puzzle Duel",
    description: "IQ Duel simultaneous puzzle duel with speed rounds, memory tests, and live leaderboards.",
    longDescription: "Go head to head in a fast-paced mental duel. Race against the clock and each other across visual puzzles, pattern recognition, and logic matrices with live score updates.",
    timeEstimate: "5 mins · Head-to-head duel",
    route: "/iq-duel",
    icon: Brain,
    colorTheme: {
      bg: "bg-[#F3E8FF]",
      border: "border-purple-200",
      text: "text-purple-700",
      nodeBg: "bg-white",
      nodeBorder: "border-purple-300",
      glowRing: "border-purple-400",
      badgeBg: "bg-purple-600",
      badgeText: "text-white",
    },
    highlights: [
      "Real-time simultaneous duel engine",
      "Match timer with sudden death rounds",
      "Live couple head-to-head scorecards",
    ],
  },
  {
    id: "color-match",
    chapterNumber: 3,
    chapterTitle: "Play & Duel",
    title: "Color Match",
    badge: "FAST PACED",
    tagline: "Intuition & Speed Duel",
    description: "Test your couple telepathy and rapid reflexes by picking matching colors under pressure.",
    longDescription: "Do you think alike under pressure? Race through rapid color coordination challenges where guessing what your partner will pick is the key to winning bonus points.",
    timeEstimate: "3 mins · Fast reflexes",
    route: "/match-game",
    icon: Palette,
    colorTheme: {
      bg: "bg-[#F3E8FF]",
      border: "border-purple-200",
      text: "text-purple-700",
      nodeBg: "bg-white",
      nodeBorder: "border-purple-300",
      glowRing: "border-purple-400",
      badgeBg: "bg-teal-600",
      badgeText: "text-white",
    },
    highlights: [
      "Rapid-fire 30-second rounds",
      "Couple telepathy score calculation",
      "Instant replay of chosen colors",
    ],
  },
  {
    id: "love-roulette",
    chapterNumber: 3,
    chapterTitle: "Play & Duel",
    title: "Love Roulette",
    badge: "PROMPT WHEEL",
    tagline: "Romantic Wheel of Fate",
    description: "Love Roulette romantic prompt wheel for unexpected questions and spicy stakes.",
    longDescription: "Give the 3D spinning wheel a whirl. Land on provocative questions, playful dares, deep vulnerability cards, or relationship decision makers that guarantee memorable conversations.",
    timeEstimate: "5 mins · Endless spins",
    route: "/roulette",
    icon: Flame,
    colorTheme: {
      bg: "bg-[#F3E8FF]",
      border: "border-purple-200",
      text: "text-purple-700",
      nodeBg: "bg-white",
      nodeBorder: "border-purple-300",
      glowRing: "border-purple-400",
      badgeBg: "bg-rose-500",
      badgeText: "text-white",
    },
    highlights: [
      "3D wheel spinning physics and tick audio",
      "Curated spicy and heartfelt question decks",
      "Custom date stake builder",
    ],
  },
  {
    id: "two-player-arcade",
    chapterNumber: 3,
    chapterTitle: "Play & Duel",
    title: "Two-Player Arcade",
    badge: "CO-OP ARCADE",
    tagline: "Co-op Mini Games",
    description: "Classic retro arcade games engineered for two players sitting far apart.",
    longDescription: "Jump into synchronous 2-player arcade classics. Team up to beat high scores, defend retro bases, or challenge each other to quick paddle showdowns across the internet.",
    timeEstimate: "8 mins · Co-op & VS",
    route: "/play",
    icon: Gamepad2,
    colorTheme: {
      bg: "bg-[#F3E8FF]",
      border: "border-purple-200",
      text: "text-purple-700",
      nodeBg: "bg-white",
      nodeBorder: "border-purple-300",
      glowRing: "border-purple-400",
      badgeBg: "bg-indigo-700",
      badgeText: "text-white",
    },
    highlights: [
      "Low-latency WebSocket game sync",
      "Playful retro 8-bit sound effects",
      "Joint trophy cabinet and achievements",
    ],
  },

  // ── CHAPTER 4: ROMANTIC RITUALS ─────────────────────────────
  {
    id: "botanical-floral-studio",
    chapterNumber: 4,
    chapterTitle: "Romantic Rituals",
    title: "Botanical Floral Studio",
    badge: "SIGNATURE STUDIO",
    tagline: "Custom Digital Flower Arrangements",
    description: "Botanical Floral Studio (DigiBouquet) with handpicked stems, vases, ribbons & notes.",
    longDescription: "Craft a breathtaking digital flower arrangement stem by stem. Select fresh peonies, hydrangeas, garden roses, and eucalyptus, customize ceramic vases, tie silk ribbons, and include a sealed love card.",
    timeEstimate: "4 mins · Flower delivery",
    route: "/bouquet",
    icon: Flower2,
    colorTheme: {
      bg: "bg-[#E6F4EA]",
      border: "border-emerald-200",
      text: "text-emerald-700",
      nodeBg: "bg-white",
      nodeBorder: "border-emerald-300",
      glowRing: "border-emerald-400",
      badgeBg: "bg-emerald-600",
      badgeText: "text-white",
    },
    highlights: [
      "Botanical flower meaning guide for each stem",
      "Custom ceramic vases & silk ribbon styling",
      "Permanent bouquet that never withers in your sanctuary",
    ],
  },
  {
    id: "spotify-mixtape",
    chapterNumber: 4,
    chapterTitle: "Romantic Rituals",
    title: "Spotify Mixtape",
    badge: "AUDIO SANCTUARY",
    tagline: "Shared Cassette Mixtape",
    description: "Spotify Mixtape song search and shared relationship cassette playlist.",
    longDescription: "Build your relationship mixtape together. Search millions of Spotify tracks, attach a specific memory or photo to each song, and play vintage cassette tape animations as you listen simultaneously.",
    timeEstimate: "6 mins · Shared tunes",
    route: "/mixtape",
    icon: Music,
    colorTheme: {
      bg: "bg-[#E6F4EA]",
      border: "border-emerald-200",
      text: "text-emerald-700",
      nodeBg: "bg-white",
      nodeBorder: "border-emerald-300",
      glowRing: "border-emerald-400",
      badgeBg: "bg-green-600",
      badgeText: "text-white",
    },
    highlights: [
      "Real-time Spotify song search & artwork",
      "Animated spinning cassette reels & track notes",
      "Export directly to your personal Spotify account",
    ],
  },
  {
    id: "twenty-questions",
    chapterNumber: 4,
    chapterTitle: "Romantic Rituals",
    title: "20 Questions",
    badge: "HEART TO HEART",
    tagline: "Deep Meaningful Prompts",
    description: "Carefully curated questions that spark hours of deep and nostalgic conversation.",
    longDescription: "Skip the small talk. Explore 20 thought-provoking questions designed by relationship counselors to unlock childhood memories, future hopes, and unspoken romantic feelings.",
    timeEstimate: "10 mins · Heart-to-heart",
    route: "/quiz",
    icon: MessageSquare,
    colorTheme: {
      bg: "bg-[#E6F4EA]",
      border: "border-emerald-200",
      text: "text-emerald-700",
      nodeBg: "bg-white",
      nodeBorder: "border-emerald-300",
      glowRing: "border-emerald-400",
      badgeBg: "bg-amber-600",
      badgeText: "text-white",
    },
    highlights: [
      "Counselor-crafted conversation stages",
      "Audio reading mode for late night calls",
      "Bookmark your partner's favorite answers",
    ],
  },
  {
    id: "time-capsule-vault",
    chapterNumber: 4,
    chapterTitle: "Romantic Rituals",
    title: "Time Capsule Vault",
    badge: "SECRET VAULT",
    tagline: "Future Unlocking Memories",
    description: "Lock memories, voice notes, and letters in an encrypted vault for a future date.",
    longDescription: "Deposit today's thoughts, anniversary wishes, or predictions into a sealed time capsule. Set an unlock date in the future, and receive a joint notification when the vault doors finally open.",
    timeEstimate: "5 mins · Long-term keepsake",
    route: "/journal",
    icon: Lock,
    colorTheme: {
      bg: "bg-[#E6F4EA]",
      border: "border-emerald-200",
      text: "text-emerald-700",
      nodeBg: "bg-white",
      nodeBorder: "border-emerald-300",
      glowRing: "border-emerald-400",
      badgeBg: "bg-stone-800",
      badgeText: "text-white",
    },
    highlights: [
      "Countdown timer to the scheduled unlock date",
      "Cryptographic privacy until both are present",
      "Joint ceremonial vault opening animation",
    ],
  },

  // ── CHAPTER 5: LATE NIGHT SECRETS ───────────────────────────
  {
    id: "truth-or-dare",
    chapterNumber: 5,
    chapterTitle: "Late Night Secrets",
    title: "Truth or Dare",
    badge: "SPICY & SILLY",
    tagline: "Unfiltered Couple Edition",
    description: "Late-night truths and remote dares designed specifically for long-distance partners.",
    longDescription: "From spicy admissions to silly photo proof dares, this mode is designed for late nights when inhibitions are low and you want to feel like you are whispering under the blankets together.",
    timeEstimate: "8 mins · Spicy & fun",
    route: "/roulette",
    icon: Flame,
    colorTheme: {
      bg: "bg-[#1E293B]",
      border: "border-slate-700",
      text: "text-sky-300",
      nodeBg: "bg-slate-900",
      nodeBorder: "border-rose-400",
      glowRing: "border-rose-400",
      badgeBg: "bg-rose-500",
      badgeText: "text-white",
    },
    highlights: [
      "Mild, Spicy, and Wild intensity tiers",
      "Photo dare camera verification",
      "Couple skip passes and wildcards",
    ],
  },
  {
    id: "whisper-voice-memos",
    chapterNumber: 5,
    chapterTitle: "Late Night Secrets",
    title: "Whisper Voice Memos",
    badge: "AUDIO INTIMACY",
    tagline: "Ambient Soundwave Whispers",
    description: "Whisper Voice Memos with soft background rain, vinyl, and fireplace sounds.",
    longDescription: "Record intimate voice notes that play with ambient audio environments like gentle rain, crackling fireplace, or midnight train rides. Listen to your partner's voice as if they are right beside you.",
    timeEstimate: "2 mins · Audio only",
    route: "/whisper",
    icon: Mic,
    colorTheme: {
      bg: "bg-[#1E293B]",
      border: "border-slate-700",
      text: "text-sky-300",
      nodeBg: "bg-slate-900",
      nodeBorder: "border-sky-400",
      glowRing: "border-sky-400",
      badgeBg: "bg-sky-500",
      badgeText: "text-slate-950",
    },
    highlights: [
      "High-fidelity crystal voice recording",
      "Ambient rain, vinyl, and fireplace background audio",
      "Organic pulsating soundwave animations",
    ],
  },
  {
    id: "midnight-confessions",
    chapterNumber: 5,
    chapterTitle: "Late Night Secrets",
    title: "Midnight Confessions",
    badge: "AFTER HOURS",
    tagline: "Double-Blind Revelations",
    description: "Submit anonymous late-night confessions that unlock only after both have written.",
    longDescription: "Have something on your chest? Write your confession in the midnight chamber. Neither partner can read the other's entry until both have submitted theirs, creating a safe space for total honesty.",
    timeEstimate: "5 mins · Double-blind",
    route: "/journal",
    icon: Moon,
    colorTheme: {
      bg: "bg-[#1E293B]",
      border: "border-slate-700",
      text: "text-sky-300",
      nodeBg: "bg-slate-900",
      nodeBorder: "border-indigo-400",
      glowRing: "border-indigo-400",
      badgeBg: "bg-indigo-500",
      badgeText: "text-white",
    },
    highlights: [
      "Double-blind unlock mechanism for safety",
      "Atmospheric dark mode sanctuary",
      "Gentle follow-up conversation prompts",
    ],
  },
  {
    id: "date-roulette",
    chapterNumber: 5,
    chapterTitle: "Late Night Secrets",
    title: "Date Roulette",
    badge: "DECISION MAKER",
    tagline: "Couple Fate Spinner",
    description: "Can not decide what movie to stream or food to order? Let roulette decide.",
    longDescription: "End the 40-minute 'What do you want to watch?' paralysis. Input your options or pick from curated long-distance date ideas, and let the wheel make the binding choice.",
    timeEstimate: "2 mins · Zero debate",
    route: "/roulette",
    icon: Compass,
    colorTheme: {
      bg: "bg-[#1E293B]",
      border: "border-slate-700",
      text: "text-sky-300",
      nodeBg: "bg-slate-900",
      nodeBorder: "border-amber-400",
      glowRing: "border-amber-400",
      badgeBg: "bg-amber-400",
      badgeText: "text-stone-900",
    },
    highlights: [
      "Movie, TV, and food presets",
      "Custom roulette slots for personal favorites",
      "Binding couple contract animation",
    ],
  },

  // ── CHAPTER 6: DEEP CONNECTION ──────────────────────────────
  {
    id: "attachment-quiz",
    chapterNumber: 6,
    chapterTitle: "Deep Connection",
    title: "Attachment Quiz",
    badge: "PSYCHOLOGY",
    tagline: "Attachment Style Discovery",
    description: "Discover how your secure, anxious, or avoidant tendencies interact in love.",
    longDescription: "Understand the blueprint of your bond. Take an evidence-based quiz to identify your attachment styles and receive actionable insights on how to soothe and support each other during stress.",
    timeEstimate: "6 mins · Eye-opening",
    route: "/quiz",
    icon: Compass,
    colorTheme: {
      bg: "bg-[#FEF7E0]",
      border: "border-amber-200",
      text: "text-amber-800",
      nodeBg: "bg-white",
      nodeBorder: "border-amber-300",
      glowRing: "border-amber-400",
      badgeBg: "bg-amber-600",
      badgeText: "text-white",
    },
    highlights: [
      "Evidence-based attachment framework",
      "Partner dynamic compatibility analysis",
      "Personalized connection and de-escalation tips",
    ],
  },
  {
    id: "love-languages",
    chapterNumber: 6,
    chapterTitle: "Deep Connection",
    title: "Love Languages",
    badge: "RELATIONSHIP IQ",
    tagline: "The 5 Love Languages",
    description: "Pinpoint what makes your partner feel truly cherished across distance.",
    longDescription: "Words of affirmation, quality time, gifts, acts of service, and physical touch look different across miles. Discover how your scores align and unlock long-distance love language tips.",
    timeEstimate: "5 mins · Relationship IQ",
    route: "/quiz",
    icon: Heart,
    colorTheme: {
      bg: "bg-[#FEF7E0]",
      border: "border-amber-200",
      text: "text-amber-800",
      nodeBg: "bg-white",
      nodeBorder: "border-amber-300",
      glowRing: "border-amber-400",
      badgeBg: "bg-rose-500",
      badgeText: "text-white",
    },
    highlights: [
      "Detailed percentage score breakdown",
      "Remote love language translation guide",
      "Sanctuary reminders for daily habits",
    ],
  },
  {
    id: "future-dream-map",
    chapterNumber: 6,
    chapterTitle: "Deep Connection",
    title: "Future Dream Map",
    badge: "VISION BOARD",
    tagline: "Interactive Couple Vision Board",
    description: "Pin dream trips, shared living goals, and milestone bucket lists on a joint map.",
    longDescription: "Plot your future together. Drop pins on dream destinations to visit, design your future home checklist, and track shared savings goals as you count down the days to closing the distance.",
    timeEstimate: "8 mins · Collaborative",
    route: "/focus",
    icon: MapPin,
    colorTheme: {
      bg: "bg-[#FEF7E0]",
      border: "border-amber-200",
      text: "text-amber-800",
      nodeBg: "bg-white",
      nodeBorder: "border-amber-300",
      glowRing: "border-amber-400",
      badgeBg: "bg-emerald-600",
      badgeText: "text-white",
    },
    highlights: [
      "Interactive world map with custom pins",
      "Closing the distance reunion countdown",
      "Shared collaborative bucket list",
    ],
  },
  {
    id: "letters-to-the-future",
    chapterNumber: 6,
    chapterTitle: "Deep Connection",
    title: "Letters to the Future",
    badge: "TIME TRAVEL",
    tagline: "Anniversary Time Capsules",
    description: "Write letters to be delivered on your 1st, 5th, or 10th anniversary.",
    longDescription: "Pour your heart into a letter for your future selves. Whether celebrating your reunion day or five years of closing the distance, these sealed letters arrive exactly when you scheduled them.",
    timeEstimate: "10 mins · Sacred keepsake",
    route: "/love-letter",
    icon: Mail,
    colorTheme: {
      bg: "bg-[#FEF7E0]",
      border: "border-amber-200",
      text: "text-amber-800",
      nodeBg: "bg-white",
      nodeBorder: "border-amber-300",
      glowRing: "border-amber-400",
      badgeBg: "bg-violet-600",
      badgeText: "text-white",
    },
    highlights: [
      "Scheduled future delivery engine",
      "Handwritten font styles with texture",
      "Delivered directly into partner inbox",
    ],
  },

  // ── CHAPTER 7: PLAYFUL ARGUMENTS ────────────────────────────
  {
    id: "couples-court",
    chapterNumber: 7,
    chapterTitle: "Playful Arguments",
    title: "Couples Court",
    badge: "TRIAL BY JURY",
    tagline: "AI Judge Gavel in Session",
    description: "Couples Court with photo evidence, witness testimony, and hilarious rulings.",
    longDescription: "Order in the court! State your complaint, upload screenshot evidence, and let AI Judge Gavel weigh the facts. Receive a courtroom verdict complete with official sentencing and comedy reparations.",
    timeEstimate: "5 mins · Hilarious trial",
    route: "/vibe-judge",
    icon: Gavel,
    colorTheme: {
      bg: "bg-[#FCE7F3]",
      border: "border-pink-200",
      text: "text-pink-700",
      nodeBg: "bg-white",
      nodeBorder: "border-pink-300",
      glowRing: "border-pink-400",
      badgeBg: "bg-stone-900",
      badgeText: "text-white",
    },
    highlights: [
      "Official judge verdict gavel animation",
      "Comedic legal briefs with sound effects",
      "Custom penalty assignments (e.g. back rub)",
    ],
  },
  {
    id: "the-petty-meter",
    chapterNumber: 7,
    chapterTitle: "Playful Arguments",
    title: "The Petty Meter",
    badge: "WHO CARES MORE",
    tagline: "Pettiness Analyzer",
    description: "The Petty Meter to calculate whose grievance is more ridiculously trivial.",
    longDescription: "Is leaving the cabinet open a crime punishable by death? Enter your minor irritation and let the Petty Meter calculate the exact absurdity percentage, defusing annoyance with instant laughter.",
    timeEstimate: "2 mins · Quick laugh",
    route: "/vibe-judge",
    icon: Scale,
    colorTheme: {
      bg: "bg-[#FCE7F3]",
      border: "border-pink-200",
      text: "text-pink-700",
      nodeBg: "bg-white",
      nodeBorder: "border-pink-300",
      glowRing: "border-pink-400",
      badgeBg: "bg-orange-600",
      badgeText: "text-white",
    },
    highlights: [
      "Petty percentage analog gauge animation",
      "Witty AI commentary on trivial fights",
      "One-click reconciliation truce seal",
    ],
  },
  {
    id: "chore-wars",
    chapterNumber: 7,
    chapterTitle: "Playful Arguments",
    title: "Chore Wars",
    badge: "STAKES AT HAND",
    tagline: "High-Stakes Household Bets",
    description: "Wager real-world chores on quick mini games and enforce the results.",
    longDescription: "Who makes dinner? Who takes out the trash? Who plans the next flight itinerary? Bet chores on quick arcade showdowns and generate binding digital IOUs that neither can deny.",
    timeEstimate: "3 mins · High stakes",
    route: "/vibe-judge",
    icon: Trophy,
    colorTheme: {
      bg: "bg-[#FCE7F3]",
      border: "border-pink-200",
      text: "text-pink-700",
      nodeBg: "bg-white",
      nodeBorder: "border-pink-300",
      glowRing: "border-pink-400",
      badgeBg: "bg-pink-600",
      badgeText: "text-white",
    },
    highlights: [
      "Pre-loaded chore contracts and wagers",
      "Enforceable digital coupon redemption",
      "Couple scoreboard of chores won and lost",
    ],
  },
  {
    id: "verdict-arcade",
    chapterNumber: 7,
    chapterTitle: "Playful Arguments",
    title: "Verdict Arcade",
    badge: "HALL OF FAME",
    tagline: "Past Rulings & Settlements",
    description: "A hall of fame archive of past verdicts, funny settlements, and redeemed favors.",
    longDescription: "Browse your historical library of disputes, verdicts, and redeemed coupons. Revisit the funniest moments of your relationship and see who truly has the cleanest record.",
    timeEstimate: "3 mins · Hall of fame",
    route: "/vibe-judge",
    icon: Trophy,
    colorTheme: {
      bg: "bg-[#FCE7F3]",
      border: "border-pink-200",
      text: "text-pink-700",
      nodeBg: "bg-white",
      nodeBorder: "border-pink-300",
      glowRing: "border-pink-400",
      badgeBg: "bg-indigo-600",
      badgeText: "text-white",
    },
    highlights: [
      "Searchable archive of courtroom disputes",
      "Win-loss ratio charts with funny titles",
      "Couple inside jokes preserved forever",
    ],
  },

  // ── CHAPTER 8: FOREVER SANCTUARY ────────────────────────────
  {
    id: "cozy-connected-cottages",
    chapterNumber: 8,
    chapterTitle: "Forever Sanctuary",
    title: "Cozy Connected Cottages",
    badge: "VIRTUAL HOME",
    tagline: "Two Homes, One Shared Light",
    description: "Cozy Connected Cottages with warm fairy lights that glow when both partners are online.",
    longDescription: "Two illustrated cozy cottages connected across the map by warm glowing string lights. When your partner opens the app, the chimney smokes and the windows illuminate with warm light.",
    timeEstimate: "Always on · Ambient presence",
    route: "/dashboard",
    icon: Home,
    colorTheme: {
      bg: "bg-[#EDE9FE]",
      border: "border-indigo-200",
      text: "text-indigo-700",
      nodeBg: "bg-white",
      nodeBorder: "border-indigo-300",
      glowRing: "border-indigo-400",
      badgeBg: "bg-indigo-700",
      badgeText: "text-white",
    },
    highlights: [
      "Live partner ambient presence indicator",
      "Synchronized day and night sanctuary skies",
      "Send a warm cup of tea ping across the distance",
    ],
  },
  {
    id: "living-memory-wall",
    chapterNumber: 8,
    chapterTitle: "Forever Sanctuary",
    title: "Living Memory Wall",
    badge: "SCRAPBOOK",
    tagline: "Infinite Relationship Gallery",
    description: "Living Memory Wall with photostrips, voice notes, ticket stubs & love notes.",
    longDescription: "Every photobooth strip, gratitude note, letter, and voice memo automatically collects onto your living memory wall. Pin boarding passes, favorite selfies, and song lyrics in a scrapbook that never runs out of space.",
    timeEstimate: "Continuous · Cherished gallery",
    route: "/moments",
    icon: BookOpen,
    colorTheme: {
      bg: "bg-[#EDE9FE]",
      border: "border-indigo-200",
      text: "text-indigo-700",
      nodeBg: "bg-white",
      nodeBorder: "border-indigo-300",
      glowRing: "border-indigo-400",
      badgeBg: "bg-rose-600",
      badgeText: "text-white",
    },
    highlights: [
      "Automatic milestone aggregation from all games",
      "Custom magnetic pins, washi tape, and polaroids",
      "One-click anniversary photobook export",
    ],
  },
  {
    id: "anniversary-vault",
    chapterNumber: 8,
    chapterTitle: "Forever Sanctuary",
    title: "Anniversary Vault",
    badge: "TIMELESS",
    tagline: "Milestone Countdown & Secrets",
    description: "Anniversary Vault with countdown clock, secret surprise gifts & memory flashbacks.",
    longDescription: "Track every milestone since day one. Count down days until your next reunion trip, look back on 'On This Day' flashbacks, and store secret anniversary gifts until the big day arrives.",
    timeEstimate: "Milestone tracker",
    route: "/journal",
    icon: Calendar,
    colorTheme: {
      bg: "bg-[#EDE9FE]",
      border: "border-indigo-200",
      text: "text-indigo-700",
      nodeBg: "bg-white",
      nodeBorder: "border-indigo-300",
      glowRing: "border-indigo-400",
      badgeBg: "bg-amber-600",
      badgeText: "text-white",
    },
    highlights: [
      "Live reunion countdown clock and time elapsed",
      "Automatic On This Day memory flashbacks",
      "Secret reveal envelopes timed for midnight",
    ],
  },
  {
    id: "forever-sealed-lock",
    chapterNumber: 8,
    chapterTitle: "Forever Sanctuary",
    title: "Forever Sealed Lock",
    badge: "PHYSICAL KEEPSAKE",
    tagline: "Physical Prints & Engraved Locks",
    description: "Forever Sealed Lock: engrave initials on brass locks or order magnetic fridge photostrips.",
    longDescription: "Bring your virtual memories into the physical world. Order high-quality magnetic 인생네컷 photostrips delivered to both of your addresses, or engrave your initials on a Paris-style brass love lock.",
    timeEstimate: "Forever keepsake",
    route: "/checkout",
    icon: Lock,
    colorTheme: {
      bg: "bg-[#EDE9FE]",
      border: "border-indigo-200",
      text: "text-indigo-700",
      nodeBg: "bg-white",
      nodeBorder: "border-indigo-400",
      glowRing: "border-indigo-400",
      badgeBg: "bg-stone-900",
      badgeText: "text-white",
    },
    highlights: [
      "Worldwide couple delivery to two separate addresses",
      "Ultra-thick matte magnetic photostrip prints",
      "Pairfect signature luxury gift packaging",
    ],
  },
];

// Chapter Metadata Header Information
const CHAPTERS_META = [
  {
    number: 1,
    title: "Start Here",
    tagline: "A photo first, then find out how well you really know each other.",
    colorBg: "bg-[#FFE4E8]",
    colorBorder: "border-rose-200/80",
    colorText: "text-rose-600",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    progress: "1 OF 4 TRIED",
    lineColor: "border-rose-300",
  },
  {
    number: 2,
    title: "Words & Memories",
    tagline: "Express, reminisce, and solve riddles together across the miles.",
    colorBg: "bg-[#E8F0FE]",
    colorBorder: "border-blue-200/80",
    colorText: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    progress: "1 OF 4 TRIED",
    lineColor: "border-blue-300",
  },
  {
    number: 3,
    title: "Play & Duel",
    tagline: "Fast-paced challenges, simultaneous duels, and playful bets.",
    colorBg: "bg-[#F3E8FF]",
    colorBorder: "border-purple-200/80",
    colorText: "text-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    progress: "4 STOPS",
    lineColor: "border-purple-300",
  },
  {
    number: 4,
    title: "Romantic Rituals",
    tagline: "Deliberate acts of romance crafted to linger long after you hang up.",
    colorBg: "bg-[#E6F4EA]",
    colorBorder: "border-emerald-200/80",
    colorText: "text-emerald-600",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    progress: "4 STOPS",
    lineColor: "border-emerald-300",
  },
  {
    number: 5,
    title: "Late Night Secrets",
    tagline: "For when the rest of the world goes to sleep and it is just the two of you.",
    colorBg: "bg-[#0F172A]",
    colorBorder: "border-slate-800",
    colorText: "text-sky-400",
    badgeBg: "bg-slate-800",
    badgeText: "text-sky-300",
    progress: "NIGHT MODE",
    isDark: true,
    lineColor: "border-slate-700",
  },
  {
    number: 6,
    title: "Deep Connection",
    tagline: "Go beneath the surface to explore attachments, dreams, and mutual growth.",
    colorBg: "bg-[#FEF7E0]",
    colorBorder: "border-amber-200/80",
    colorText: "text-amber-700",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    progress: "4 STOPS",
    lineColor: "border-amber-300",
  },
  {
    number: 7,
    title: "Playful Arguments",
    tagline: "Settle silly debates, petty grievances, and chore distribution with humor.",
    colorBg: "bg-[#FCE7F3]",
    colorBorder: "border-pink-200/80",
    colorText: "text-pink-600",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-800",
    progress: "4 STOPS",
    lineColor: "border-pink-300",
  },
  {
    number: 8,
    title: "Forever Sanctuary",
    tagline: "Cozy spaces, memories preserved in amber, and promises that never expire.",
    colorBg: "bg-[#EDE9FE]",
    colorBorder: "border-indigo-200/80",
    colorText: "text-indigo-600",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-800",
    progress: "FOREVER",
    lineColor: "border-indigo-300",
  },
];

// ────────────────────────────────────────────────────────────
// Animations: Concentric Pulsing Glow Rings
// ────────────────────────────────────────────────────────────

function ConcentricPulsingRings() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <motion.span
        className="absolute rounded-full border-2 border-rose-400/80"
        initial={{ width: "100%", height: "100%", opacity: 0.9 }}
        animate={{
          width: ["100%", "142%"],
          height: ["100%", "142%"],
          opacity: [0.9, 0],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="absolute rounded-full border border-rose-400/50"
        initial={{ width: "100%", height: "100%", opacity: 0.8 }}
        animate={{
          width: ["100%", "178%"],
          height: ["100%", "178%"],
          opacity: [0.8, 0],
        }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.65, ease: "easeOut" }}
      />
      <motion.span
        className="absolute rounded-full bg-rose-400/15"
        initial={{ width: "100%", height: "100%", opacity: 0.5 }}
        animate={{
          width: ["100%", "210%"],
          height: ["100%", "210%"],
          opacity: [0.5, 0],
        }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 1.3, ease: "easeOut" }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Animations: Gold Starburst & Completed Checkmark
// ────────────────────────────────────────────────────────────

function GoldStarBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <motion.svg
        viewBox="0 0 100 100"
        className="w-28 h-28 text-amber-400/50 absolute"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <polygon
          points="50,5 58,35 90,35 64,55 74,85 50,68 26,85 36,55 10,35 42,35"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </motion.svg>
      {/* Corner checkmark badge */}
      <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border-2 border-white flex items-center justify-center text-white shadow-md z-20">
        <Check className="w-4 h-4 stroke-[3]" />
      </div>
      {/* Twinkling mini star */}
      <motion.span
        className="absolute -top-2 left-2 text-xs text-amber-400 select-none"
        animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        ★
      </motion.span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Animations: Flying Paper Plane with Spring Turbulence
// ────────────────────────────────────────────────────────────

function FlyingPaperPlane() {
  return (
    <div className="absolute -top-2 right-2 sm:right-6 w-24 h-20 pointer-events-none z-20 select-none hidden sm:block">
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        initial={{ x: 0, y: 0, rotate: -6 }}
        animate={{
          x: [0, 16, 4, -12, 0],
          y: [0, -12, 6, -6, 0],
          rotate: [-6, 6, -4, 4, -6],
        }}
        transition={{
          duration: 7.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-14 h-14 text-rose-400 drop-shadow-md">
          {/* Main Paper Plane Wings */}
          <path
            d="M 12 50 Q 42 20 85 16 L 62 70 L 46 56 L 22 62 Z"
            fill="#FFE4E8"
            stroke="#F43F5E"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Plane Crease */}
          <path
            d="M 46 56 L 85 16"
            stroke="#F43F5E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Underfold Shadow */}
          <path
            d="M 46 56 L 56 68 L 62 70 Z"
            fill="#FDA4AF"
            stroke="#F43F5E"
            strokeWidth="1.5"
          />
          {/* Curved flight wind trail */}
          <path
            d="M 18 66 C 4 78 22 86 32 80 C 40 74 36 68 26 72"
            fill="none"
            stroke="#FB7185"
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />
        </svg>
        {/* Floating mini heart */}
        <motion.span
          className="absolute -left-1 bottom-2 text-[10px] text-rose-500 font-bold"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          ♥
        </motion.span>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Interactive 3D Dice with Physics Roll on Hover/Click
// ────────────────────────────────────────────────────────────

function InteractiveDice() {
  const [isRolling, setIsRolling] = useState(false);
  const [currentFace, setCurrentFace] = useState(5);
  const [rotation, setRotation] = useState({ x: -18, y: 28 });
  const [promptMessage, setPromptMessage] = useState(
    "Roll for tonight's date stake or duel bet!"
  );

  const couplePrompts: Record<number, string> = {
    1: "Take an online photobooth snap together right now!",
    2: "Tell your partner two tiny quirks you adore about them.",
    3: "Send a wax-sealed love letter with an animated sticker.",
    4: "IQ Duel round: loser washes the dishes or cooks tomorrow!",
    5: "Search and play a slow dance song on your Spotify Mixtape.",
    6: "AI Vibe Judge: file a cute, petty argument for instant judgment!",
  };

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    const nextFace = Math.floor(Math.random() * 6) + 1;

    // Face mapping rotations in 3D
    const faceAngles: Record<number, { x: number; y: number }> = {
      1: { x: 0, y: 0 },
      2: { x: 0, y: -90 },
      3: { x: -90, y: 0 },
      4: { x: 90, y: 0 },
      5: { x: 0, y: 90 },
      6: { x: 180, y: 0 },
    };

    const base = faceAngles[nextFace];
    // Add multiple spins for natural physics tumble
    const extraSpinsX = (Math.floor(Math.random() * 2) + 2) * 360;
    const extraSpinsY = (Math.floor(Math.random() * 2) + 2) * 360;

    setRotation({
      x: base.x + extraSpinsX,
      y: base.y + extraSpinsY,
    });

    setTimeout(() => {
      setCurrentFace(nextFace);
      setPromptMessage(couplePrompts[nextFace]);
      setIsRolling(false);
    }, 950);
  };

  return (
    <div className="w-full p-5 sm:p-6 rounded-3xl bg-white border border-purple-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-5 sm:gap-6 my-4">
      {/* 3D Dice Stage */}
      <div
        className="w-24 h-24 flex items-center justify-center cursor-pointer select-none group"
        onClick={handleRoll}
        style={{ perspective: "600px" }}
        title="Click to roll the 3D couple dice!"
      >
        <motion.div
          className="w-14 h-14 relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{
            rotateX: rotation.x,
            rotateY: rotation.y,
          }}
          transition={{
            duration: 0.95,
            ease: [0.25, 1, 0.5, 1],
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Face 1: Front (1 dot) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white to-purple-50 border-2 border-purple-300 rounded-xl shadow-md flex items-center justify-center backface-hidden"
            style={{ transform: "translateZ(28px)" }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
          </div>

          {/* Face 2: Right (2 dots) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white to-purple-50 border-2 border-purple-300 rounded-xl shadow-md flex flex-col justify-between p-2 backface-hidden"
            style={{ transform: "rotateY(90deg) translateZ(28px)" }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-700 self-start" />
            <span className="w-2 h-2 rounded-full bg-purple-700 self-end" />
          </div>

          {/* Face 3: Top (3 dots) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white to-purple-50 border-2 border-purple-300 rounded-xl shadow-md flex flex-col justify-between p-2 backface-hidden"
            style={{ transform: "rotateX(90deg) translateZ(28px)" }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-700 self-start" />
            <span className="w-2 h-2 rounded-full bg-purple-700 self-center" />
            <span className="w-2 h-2 rounded-full bg-purple-700 self-end" />
          </div>

          {/* Face 4: Bottom (4 dots) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white to-purple-50 border-2 border-purple-300 rounded-xl shadow-md grid grid-cols-2 p-2 place-items-center backface-hidden"
            style={{ transform: "rotateX(-90deg) translateZ(28px)" }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
          </div>

          {/* Face 5: Left (5 dots) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white to-purple-50 border-2 border-purple-300 rounded-xl shadow-md relative p-2 backface-hidden"
            style={{ transform: "rotateY(-90deg) translateZ(28px)" }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-700 absolute top-2 left-2" />
            <span className="w-2 h-2 rounded-full bg-purple-700 absolute top-2 right-2" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <span className="w-2 h-2 rounded-full bg-purple-700 absolute bottom-2 left-2" />
            <span className="w-2 h-2 rounded-full bg-purple-700 absolute bottom-2 right-2" />
          </div>

          {/* Face 6: Back (6 dots) */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-white to-purple-50 border-2 border-purple-300 rounded-xl shadow-md grid grid-cols-2 p-1.5 place-items-center backface-hidden"
            style={{ transform: "rotateY(180deg) translateZ(28px)" }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
            <span className="w-2 h-2 rounded-full bg-purple-700" />
          </div>
        </motion.div>
      </div>

      {/* Dice Prompt & Control */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-mono font-bold uppercase tracking-wider">
            3D COUPLE DICE
          </span>
          <span className="text-xs font-mono font-bold text-stone-500">
            ROLLED: {currentFace}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-sans font-medium text-stone-800 leading-snug">
          {promptMessage}
        </p>
        <div className="pt-1 flex items-center justify-center sm:justify-start gap-3">
          <button
            type="button"
            onClick={handleRoll}
            disabled={isRolling}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Dices className={`w-3.5 h-3.5 ${isRolling ? "animate-spin" : ""}`} />
            <span>{isRolling ? "Rolling..." : "Roll dice"}</span>
          </button>
          <span className="text-[11px] font-sans text-stone-400">
            Hover or tap dice to roll
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function PlayLovePathPage() {
  const { user, profile, partner } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [partnerPings, setPartnerPings] = useState<number[]>([]);

  // Filtered milestones when search query is entered
  const filteredMilestones = searchQuery.trim()
    ? MILESTONES.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSendHeartPing = () => {
    setPartnerPings((prev) => [...prev, Date.now()]);
    setTimeout(() => {
      setPartnerPings((prev) => prev.slice(1));
    }, 2000);
  };

  const handleCopyLink = () => {
    if (selectedMilestone) {
      const fullUrl = `${window.location.origin}${selectedMilestone.route}`;
      navigator.clipboard.writeText(fullUrl);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 2200);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Main Container Area with Desktop Sticky Sidebar Offset */}
      <div className="lg:pl-60 xl:pl-64 min-h-screen flex justify-center pt-18 pb-12 sm:py-12 px-4 sm:px-8">
        <div className="w-full max-w-2xl space-y-12 select-none relative pb-28">

          {/* ══════════════════════════════════════════════════
              HEADER: THE LOVE PATH
              ══════════════════════════════════════════════════ */}
          <header className="space-y-4 pt-4 sm:pt-6 relative">
            <FlyingPaperPlane />

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
                THE LOVE PATH · 8 CHAPTERS
              </span>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs text-xs font-mono font-bold text-stone-700 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-rose-500" />
                <span>Join with a code</span>
              </button>
            </div>

            <div className="relative pr-16 sm:pr-24">
              <h1 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight leading-tight">
                Where to tonight?
              </h1>
              <p className="mt-2 text-sm sm:text-base font-sans text-stone-600 leading-relaxed max-w-lg">
                Games, rituals, and dates for two people in two places. Tap any milestone to explore and play together.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a game or activity (e.g. photobooth, duel, bouquet, letters)"
                className="w-full pl-11 pr-10 py-3 rounded-2xl border border-stone-200 bg-white text-xs sm:text-sm font-sans placeholder:text-stone-400 shadow-2xs focus:outline-hidden focus:border-stone-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* ══════════════════════════════════════════════════
              SEARCH RESULTS VIEW (WHEN SEARCHING)
              ══════════════════════════════════════════════════ */}
          {searchQuery.trim() !== "" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-500 uppercase">
                <span>FOUND {filteredMilestones.length} RESULTS FOR &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>

              {filteredMilestones.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center space-y-2">
                  <p className="font-heading font-bold text-stone-800">No activities matched your search.</p>
                  <p className="text-xs text-stone-500">Try searching for &apos;booth&apos;, &apos;duel&apos;, &apos;judge&apos;, or &apos;mixtape&apos;.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMilestones.map((m) => {
                    const IconComponent = m.icon;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMilestone(m)}
                        className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-stone-900 transition-all shadow-xs cursor-pointer space-y-3 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                            Chapter {m.chapterNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[9px] font-mono font-bold text-stone-600">
                            {m.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl ${m.colorTheme.nodeBg} border ${m.colorTheme.nodeBorder} flex items-center justify-center text-stone-800 group-hover:scale-105 transition-transform`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-sm text-stone-900 group-hover:text-rose-600 transition-colors">
                              {m.title}
                            </h3>
                            <p className="text-xs text-stone-500">{m.timeEstimate}</p>
                          </div>
                        </div>
                        <p className="text-xs font-sans text-stone-600 line-clamp-2">
                          {m.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ══════════════════════════════════════════════════
                THE 8 CURATED CHAPTERS ON THE LOVE PATH
                ══════════════════════════════════════════════════ */
            <div className="space-y-16">
              {CHAPTERS_META.map((ch) => {
                const chapterMilestones = MILESTONES.filter(
                  (m) => m.chapterNumber === ch.number
                );

                return (
                  <section
                    key={ch.number}
                    id={`chapter-${ch.number}`}
                    className="space-y-6 pt-2 scroll-mt-24"
                  >
                    {/* Chapter Header Card */}
                    <div
                      className={`p-6 sm:p-7 rounded-3xl ${ch.colorBg} border ${ch.colorBorder} shadow-2xs space-y-2 relative overflow-hidden`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider">
                        <span className={ch.colorText}>CHAPTER {ch.number}</span>
                        <span
                          className={`${ch.badgeBg} ${ch.badgeText} px-2.5 py-0.5 rounded-full text-[10px] font-bold`}
                        >
                          {ch.progress}
                        </span>
                      </div>
                      <h2
                        className={`text-2xl sm:text-3xl font-heading font-black ${
                          ch.isDark ? "text-white" : "text-stone-900"
                        }`}
                      >
                        {ch.title}
                      </h2>
                      <p
                        className={`text-xs sm:text-sm font-sans leading-relaxed max-w-lg ${
                          ch.isDark ? "text-stone-300" : "text-stone-700"
                        }`}
                      >
                        {ch.tagline}
                      </p>
                    </div>

                    {/* Chapter 3 Special Feature: 3D Interactive Dice */}
                    {ch.number === 3 && <InteractiveDice />}

                    {/* Vertical Connecting Winding Path for Chapter Milestones */}
                    <div className="relative flex flex-col items-center space-y-12 py-4">
                      {/* Vertical Dotted Connecting Line */}
                      <div
                        className={`absolute top-0 bottom-0 w-1 border-r-2 border-dashed ${ch.lineColor} left-1/2 -translate-x-1/2 pointer-events-none`}
                      />

                      {chapterMilestones.map((milestone, idx) => {
                        const IconComponent = milestone.icon;
                        const isCurrentNode = Boolean(milestone.isCurrent);
                        const isCompletedNode = Boolean(milestone.isCompleted);

                        return (
                          <div
                            key={milestone.id}
                            className="relative z-10 flex flex-col items-center group cursor-pointer"
                            onClick={() => setSelectedMilestone(milestone)}
                          >
                            {/* "Try Next" Callout Pill for Current Playable Node */}
                            {isCurrentNode && (
                              <motion.div
                                initial={{ y: -3 }}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="mb-2 px-3 py-1 rounded-full bg-white border border-rose-300 shadow-xs text-[10px] font-mono font-bold text-rose-600 flex items-center gap-1.5"
                              >
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <span>Ready to play</span>
                              </motion.div>
                            )}

                            {/* Node Button Circle */}
                            <div className="relative">
                              {/* Concentric Pulsing Rings on Current Node */}
                              {isCurrentNode && <ConcentricPulsingRings />}

                              {/* Gold Star Burst on Completed Nodes */}
                              {isCompletedNode && <GoldStarBurst />}

                              {/* Main Interactive Circle */}
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.07 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-22 h-22 sm:w-24 sm:h-24 rounded-full ${milestone.colorTheme.nodeBg} border-4 ${milestone.colorTheme.nodeBorder} shadow-lg flex items-center justify-center relative transition-colors cursor-pointer group-hover:border-stone-900`}
                              >
                                <IconComponent className="w-9 h-9 sm:w-10 sm:h-10 text-stone-800" />

                                {/* Badge Top Tag */}
                                <span
                                  className={`absolute -top-2 px-2.5 py-0.5 rounded-full ${milestone.colorTheme.badgeBg} ${milestone.colorTheme.badgeText} font-mono text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap`}
                                >
                                  {milestone.badge}
                                </span>
                              </motion.button>
                            </div>

                            {/* Micro live cursors on first node */}
                            {idx === 0 && ch.number === 1 && (
                              <>
                                <div className="absolute -left-12 top-8 px-2 py-0.5 rounded-md bg-white border border-rose-200 shadow-xs text-[9px] font-mono text-rose-600 font-bold hidden sm:block">
                                  me
                                </div>
                                <div className="absolute -right-12 top-14 px-2 py-0.5 rounded-md bg-white border border-sky-200 shadow-xs text-[9px] font-mono text-sky-600 font-bold hidden sm:block">
                                  you
                                </div>
                              </>
                            )}

                            {/* Node Label Pill */}
                            <div className="mt-3 flex flex-col items-center">
                              <p className="font-heading font-bold text-xs sm:text-sm text-stone-900 bg-white px-3.5 py-1 rounded-full border border-stone-200 shadow-2xs group-hover:border-stone-900 group-hover:text-rose-600 transition-colors">
                                {milestone.title}
                              </p>
                              <span className="text-[10px] font-mono text-stone-400 mt-1">
                                {milestone.timeEstimate}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {/* ══════════════════════════════════════════════════
                  COUPLES HUB INTERSTITIAL BANNER
                  ══════════════════════════════════════════════════ */}
              <Link
                href="/dashboard"
                className="block p-5 sm:p-6 rounded-3xl bg-white border-2 border-stone-200 hover:border-stone-900 transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base text-stone-900 group-hover:text-rose-600 transition-colors">
                        Couples Sanctuary Hub
                      </h3>
                      <p className="text-xs font-sans text-stone-500">
                        One place for the two of you with your photostrips, daily weather, and shared milestones.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* ══════════════════════════════════════════════════
                  END OF THE PATH CELEBRATION
                  ══════════════════════════════════════════════════ */}
              <div className="pt-12 text-center space-y-6 border-t border-stone-200">
                {/* CoupleBeansMascot Celebration */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <CoupleBeansMascot className="w-32 h-24" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-500">
                    MADE FOR TWO · PAIRFECT
                  </span>
                </div>

                {/* Two Cozy Houses Connected by Warm String Lights */}
                <div className="flex items-center justify-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-300 shadow-md flex items-center justify-center text-rose-500">
                    <Home className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 border-2 border-sky-300 shadow-md flex items-center justify-center text-sky-500">
                    <Home className="w-7 h-7" />
                  </div>
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <p className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase">
                    END OF THE PATH
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-stone-900 leading-tight">
                    One day you will do all of this in the same room.
                  </h2>
                  <p className="text-xs sm:text-sm font-sans text-stone-500">
                    Until then, keep playing, writing letters, and building memories across the miles.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs font-mono text-stone-400">
                  <Link href="/dashboard" className="hover:text-stone-700">Home</Link>
                  <span>·</span>
                  <Link href="/dashboard" className="hover:text-stone-700">Sanctuary Hub</Link>
                  <span>·</span>
                  <Link href="/photo-booth" className="hover:text-stone-700">Photobooth</Link>
                  <span>·</span>
                  <Link href="/love-letter" className="hover:text-stone-700">Letters</Link>
                  <span>·</span>
                  <span>pairfect.site</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ══════════════════════════════════════════════════
            STICKY RIGHT PROGRESS WIDGETS COLUMN (DESKTOP)
            ══════════════════════════════════════════════════ */}
        <aside className="hidden xl:block fixed right-8 top-16 w-80 space-y-4 select-none pointer-events-auto">

          {/* Widget 1: Your Love Path Progress */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-stone-500">
              <span>LOVE PATH PROGRESS</span>
              <span className="text-stone-900">2 of 32 tried</span>
            </div>

            {/* Animated progress bar */}
            <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 rounded-full"
                initial={{ width: "6%" }}
                animate={{ width: "12%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>

            {/* Quick Next Activity */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-stone-500">Next milestone:</span>
              <Link
                href="/photo-booth"
                className="font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>Online Photobooth</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Chapter Jump Shortcuts */}
            <div className="pt-2 border-t border-stone-100">
              <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-2">
                JUMP TO CHAPTER
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {CHAPTERS_META.map((ch) => (
                  <a
                    key={ch.number}
                    href={`#chapter-${ch.number}`}
                    className="py-1 rounded-lg bg-stone-50 hover:bg-stone-900 hover:text-white border border-stone-200 text-center font-mono text-[10px] font-bold text-stone-600 transition-colors"
                  >
                    CH {ch.number}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Widget 2: Playing Together & Partner Cursor Presence Box */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                PLAYING TOGETHER
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>24ms sync</span>
              </span>
            </div>

            {/* Interactive Moving Cursors Simulation Box */}
            <div className="h-24 rounded-2xl bg-gradient-to-br from-stone-50 to-pink-50/40 border border-stone-200 flex flex-col justify-between p-3 relative overflow-hidden">
              {/* Partner Cursors */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                <motion.div
                  className="flex items-center gap-1 text-rose-500"
                  animate={{ x: [0, 8, -4, 0], y: [0, -3, 2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span>↖ me</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1 text-sky-500"
                  animate={{ x: [0, -6, 4, 0], y: [0, 3, -2, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span>you ↖</span>
                </motion.div>
              </div>

              {/* Heart floating between */}
              <div className="flex items-center justify-center">
                <motion.span
                  className="text-base text-rose-500"
                  animate={{ scale: [1, 1.25, 1], y: [0, -2, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  ♥
                </motion.span>
              </div>

              <div className="text-[10px] font-mono text-center text-stone-400">
                {partner?.display_name ? `${partner.display_name} is in Sanctuary` : "Partner online · Ready to pair"}
              </div>

              {/* Animated Pings */}
              {partnerPings.map((pingId) => (
                <motion.div
                  key={pingId}
                  initial={{ opacity: 1, scale: 0.5, y: 0 }}
                  animate={{ opacity: 0, scale: 1.8, y: -25 }}
                  transition={{ duration: 1.6 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-xl text-rose-500 font-bold">♥</span>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSendHeartPing}
              className="w-full py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 font-mono text-[11px] font-bold text-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Send partner heart ping</span>
            </button>

            {/* Mascot Presence */}
            <div className="pt-1 flex items-center gap-3">
              <CoupleBeansMascot className="w-16 h-12" />
              <p className="text-[11px] font-sans text-stone-500 leading-snug">
                Start any game and share your code to sync live cursors instantly.
              </p>
            </div>
          </div>

        </aside>

      </div>

      {/* ══════════════════════════════════════════════════
          INTERACTIVE MILESTONE MODAL
          ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedMilestone(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
                    CHAPTER {selectedMilestone.chapterNumber}: {selectedMilestone.chapterTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[10px] font-mono font-bold uppercase text-rose-600">
                    {selectedMilestone.badge}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Big Icon Graphic */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl ${selectedMilestone.colorTheme.nodeBg} border-2 ${selectedMilestone.colorTheme.nodeBorder} flex items-center justify-center text-stone-900 shadow-md shrink-0`}
                >
                  {React.createElement(selectedMilestone.icon, { className: "w-8 h-8" })}
                </div>
                <div>
                  <h3 className="font-heading font-black text-xl sm:text-2xl text-stone-900">
                    {selectedMilestone.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans font-medium text-stone-500">
                    {selectedMilestone.tagline}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-stone-400">
                    <span>{selectedMilestone.timeEstimate}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-3 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-b border-stone-100 py-3">
                <p>{selectedMilestone.longDescription}</p>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                    KEY PAIRFECT HIGHLIGHTS:
                  </p>
                  <ul className="space-y-1">
                    {selectedMilestone.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700">
                        <Check className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link
                  href={selectedMilestone.route}
                  className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01]"
                >
                  <span>Play together</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-mono text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{hasCopiedLink ? "Copied direct link!" : "Copy invite link"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMilestone(null)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-500 font-mono text-xs font-bold hover:bg-stone-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Mascot Footer inside modal */}
              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-mono text-stone-400 border-t border-stone-100">
                <CoupleBeansMascot className="w-12 h-8" />
                <span>Made with love for two on Pairfect</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          JOIN ROOM WITH CODE MODAL
          ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isCodeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsCodeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-rose-500" />
                  <h3 className="font-heading font-black text-base text-stone-900">
                    Join with a code
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-600">
                Enter your partner&apos;s 4-digit or 6-digit room code to jump straight into their game session.
              </p>

              <input
                type="text"
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (E.G. P7K4)"
                className="w-full px-4 py-3 text-center text-sm font-mono font-bold tracking-widest uppercase rounded-2xl border border-stone-300 bg-stone-50 focus:outline-hidden focus:border-stone-900"
              />

              <button
                type="button"
                disabled={joinCodeInput.trim().length < 3}
                onClick={() => {
                  setIsCodeModalOpen(false);
                  window.location.href = `/onboarding?code=${joinCodeInput.trim()}`;
                }}
                className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Connect to room
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
