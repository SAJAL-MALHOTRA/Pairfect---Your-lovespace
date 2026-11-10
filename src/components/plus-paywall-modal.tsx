"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartBeansAirplaneMascot } from "@/components/couple-mascot";

export interface PlusPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export default function PlusPaywallModal({
  isOpen,
  onClose,
  featureTitle,
  featureDescription,
}: PlusPaywallModalProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [trialLoading, setTrialLoading] = useState(false);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);

  // Check trial eligibility on modal open
  useEffect(() => {
    if (isOpen && user) {
      fetch("/api/trials/eligibility")
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.eligible === "boolean") {
            setTrialEligible(data.eligible);
          }
        })
        .catch(() => setTrialEligible(false));
    }
  }, [isOpen, user]);

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const res = await fetch("/api/trials/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to activate free trial.");
      }
      onClose();
      window.location.reload();
    } catch {
      onClose();
      router.push("/checkout?plan=plus-monthly");
    } finally {
      setTrialLoading(false);
    }
  };

  const handleUnlockJustForMe = () => {
    if (trialEligible) {
      handleStartTrial();
    } else {
      onClose();
      router.push("/checkout?plan=plus-monthly");
    }
  };

  const handleCreateGift = () => {
    onClose();
    router.push("/checkout?plan=plus-annual");
  };

  // Default to 'her' as in the Angie reference screenshot
  const partnerPronoun = "her";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative z-10 w-full max-w-[420px] max-h-[92vh] flex flex-col rounded-[32px] bg-white border border-stone-200/90 shadow-2xl overflow-hidden"
            style={{
              boxShadow: "0 25px 60px -15px rgba(225, 29, 72, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-3">
            {/* Top Bar: Brand + Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-xl tracking-tight text-stone-900">
                  pairfect
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pill: You've played your free game */}
            <div className="flex justify-center mt-3">
              <span className="inline-flex items-center px-4 py-1 rounded-full bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48] text-xs font-semibold shadow-xs">
                {featureTitle || "You've played your free game."}
              </span>
            </div>

            {/* Buy 1, get 1 free banner */}
            <div className="mt-3.5 rounded-2xl p-4 bg-gradient-to-r from-[#FFF1F5] via-[#FAF5FF] to-[#EFF6FF] border border-[#FCE7F3] flex items-center justify-between shadow-xs">
              <div className="space-y-1 pr-2">
                <h4 className="text-2xl sm:text-[26px] font-black text-stone-900 leading-tight tracking-tight">
                  Buy <span className="text-[#EC4899]">1</span>,<br />
                  get <span className="text-[#3B82F6]">1</span> free
                </h4>
                <p className="text-xs text-stone-600 font-medium">
                  Your partner gets Premium too
                </p>
              </div>
              <div className="shrink-0 w-28 h-20 flex items-center justify-center">
                <HeartBeansAirplaneMascot className="w-28 h-20" />
              </div>
            </div>

            {/* Surprise her tonight heading */}
            <div className="text-center mt-5 space-y-1">
              <h3 className="text-2xl sm:text-[26px] font-black text-stone-900 tracking-tight">
                Surprise <span className="text-[#EC4899]">{partnerPronoun}</span>{" "}
                <span className="text-[#3B82F6]">tonight</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                {featureDescription || "Made from your date nights together."}
              </p>
            </div>

            {/* Keepsakes Hero Preview Card */}
            <div className="relative rounded-2xl bg-[#FAFAF9] border border-stone-200/80 p-4 mt-3.5 min-h-[175px] flex items-center justify-center overflow-hidden">
              {/* Left Photo Strip */}
              <div className="w-24 bg-white p-2 rounded-xl shadow-md border border-stone-100 -rotate-6 transform -translate-x-4 transition-transform hover:rotate-0">
                <div className="space-y-1.5">
                  <div className="h-10 rounded-lg bg-[#FFE4E6] border border-[#FECDD3]" />
                  <div className="h-10 rounded-lg bg-[#DBEAFE] border border-[#BFDBFE]" />
                  <div className="h-10 rounded-lg bg-[#FFE4E6] border border-[#FECDD3]" />
                </div>
              </div>

              {/* Right Letter Stationery */}
              <div className="w-28 bg-[#FFFDF9] p-3 rounded-xl shadow-md border border-amber-100 rotate-6 transform translate-x-4 transition-transform hover:rotate-0">
                <p className="font-serif italic font-bold text-xs text-[#BE123C]">
                  My love,
                </p>
                <div className="space-y-1.5 mt-2">
                  <div className="h-1 bg-amber-200/70 rounded-full w-full" />
                  <div className="h-1 bg-amber-200/70 rounded-full w-4/5" />
                  <div className="h-1 bg-amber-200/70 rounded-full w-3/4" />
                </div>
              </div>

              {/* Center Floating Gradient Card: You + Partner */}
              <div className="absolute z-10 bottom-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#6366F1] text-white shadow-xl flex flex-col items-center justify-center text-center">
                <Heart className="w-3.5 h-3.5 fill-white/90 text-white mb-0.5" />
                <span className="font-heading font-black text-xs sm:text-sm tracking-tight text-white leading-tight">
                  You + Partner
                </span>
                <span className="text-[8px] font-mono font-bold tracking-widest uppercase opacity-90 mt-0.5">
                  CUSTOM CARD
                </span>
              </div>
            </div>

            {/* + UNLOCKS PREMIUM FOR YOU BOTH */}
            <div className="mt-4 mb-2 text-center">
              <span className="text-[10px] font-mono font-bold tracking-wider text-stone-400 uppercase">
                + UNLOCKS PREMIUM FOR YOU BOTH
              </span>
            </div>

            {/* 3 Benefit Cards */}
            <div className="grid grid-cols-3 gap-2 text-left mb-2">
              {/* 01 Card */}
              <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-[#FB7185]">01</span>
                <div className="mt-1">
                  <p className="text-xl font-black text-[#E11D48] leading-tight">999+</p>
                  <p className="text-[10px] text-stone-600 font-medium leading-tight mt-0.5">
                    photo booth strips kept
                  </p>
                </div>
              </div>

              {/* 02 Card */}
              <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-[#60A5FA]">02</span>
                <div className="mt-1">
                  <p className="text-xl font-black text-[#2563EB] leading-tight">All</p>
                  <p className="text-[10px] text-stone-600 font-medium leading-tight mt-0.5">
                    premium frames
                  </p>
                </div>
              </div>

              {/* 03 Card */}
              <div className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#F3E8FF] flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-[#A855F7]">03</span>
                <div className="mt-1">
                  <p className="text-xl font-black text-[#7E22CE] leading-tight">20+</p>
                  <p className="text-[10px] text-stone-600 font-medium leading-tight mt-0.5">
                    games, dates & modes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="border-t border-stone-100 bg-white/95 backdrop-blur-xs px-5 pt-3.5 pb-4 space-y-2">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleCreateGift}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] hover:from-[#DB2777] hover:to-[#2563EB] active:scale-[0.99] shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Create {partnerPronoun} gift · $79.99/year</span>
              <span className="font-mono text-base">&gt;</span>
            </button>

            {/* Subtext */}
            <p className="text-[11px] text-stone-500 text-center font-medium">
              $79.99 a year, renews yearly. Cancel anytime.
            </p>

            {/* Secondary actions */}
            <div className="pt-0.5 flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleUnlockJustForMe}
                disabled={trialLoading}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] underline underline-offset-2 cursor-pointer transition-colors"
              >
                {trialLoading ? "Activating trial..." : "Unlock it just for me"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-400 hover:text-stone-700 underline underline-offset-2 cursor-pointer transition-colors mt-0.5"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
