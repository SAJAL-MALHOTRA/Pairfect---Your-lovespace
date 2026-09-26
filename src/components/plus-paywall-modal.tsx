"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Sparkles,
  X,
  Check,
  Heart,
  Lock,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlusPaywallModalProps {
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
  const { user, pair } = useAuth();

  const [trialLoading, setTrialLoading] = useState(false);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
  const [trialMessage, setTrialMessage] = useState<string | null>(null);
  const [trialError, setTrialError] = useState<string | null>(null);

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
    setTrialError(null);
    try {
      const res = await fetch("/api/trials/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to activate free trial.");
      }
      setTrialMessage("✨ 7-day Pairfect Plus trial activated for both of you! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setTrialError(err?.message || "Failed to activate trial.");
    } finally {
      setTrialLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative z-10 w-full max-w-lg rounded-[32px] bg-[#FAF7F2] border border-[#FFD9E3] shadow-2xl p-6 sm:p-8 paper-grain overflow-hidden"
          style={{
            boxShadow: "0 24px 60px rgba(232, 82, 125, 0.22)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-[#E8527D] text-[10px] font-mono font-bold tracking-widest uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>PAIRFECT PLUS EXCLUSIVE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display italic font-black text-[#2D1F2D] tracking-tight">
              {featureTitle ? `Unlock ${featureTitle}` : "Unlock Pairfect Plus"}
            </h2>

            <p className="text-xs sm:text-sm text-[#6E5564] max-w-sm mx-auto leading-relaxed">
              {featureDescription ||
                "One pass unlocks permanent memory archives, 10-year letter scheduling, and all connection rituals for BOTH partners."}
            </p>
          </div>

          {/* Value Props Checklist */}
          <div className="bg-white/80 rounded-2xl p-4 sm:p-5 border border-[#FFD9E3] space-y-2.5 mb-6 text-xs text-[#2D1F2D]">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-[#E8527D] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="font-medium">
                <strong>Pay for One, Unlock for Both</strong> — no double billing ever
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-[#E8527D] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>
                <strong>Permanent living vault</strong> for all photostrips, moments, and letters
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-[#E8527D] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>
                <strong>10-year letter time capsules</strong> that unseal on future anniversaries
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-[#E8527D] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>
                <strong>All 14 spicy &amp; deep quiz decks</strong> with simultaneous lock-in
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-[#E8527D] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>
                <strong>Custom Spotify cassette mixtapes</strong> &amp; physical decal shells
              </span>
            </div>
          </div>

          {/* Trial Success / Error Messages */}
          {trialMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{trialMessage}</span>
            </div>
          )}

          {trialError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
              <Lock className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{trialError}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3">
            {/* If eligible for 7-day free trial, show instant 1-click trial button */}
            {trialEligible && (
              <button
                type="button"
                onClick={handleStartTrial}
                disabled={trialLoading}
                className="w-full btn-journal py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
              >
                {trialLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Trial...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start 7-Day Free Trial (No Card Needed) ▷</span>
                  </>
                )}
              </button>
            )}

            {/* Direct Upgrade Link to Checkout */}
            <Link
              href="/checkout?plan=plus-quarterly"
              onClick={onClose}
              className={`w-full text-center py-3 px-6 rounded-2xl text-xs font-mono font-bold transition-all block cursor-pointer ${
                trialEligible
                  ? "bg-white hover:bg-stone-50 text-[#2D1F2D] border border-[#FFD9E3]"
                  : "btn-journal shadow-md hover:scale-[1.02]"
              }`}
            >
              <span>View All Plans (from ₹129/mo or ₹249 for 3 months) ▷</span>
            </Link>
          </div>

          {/* Fine print */}
          <p className="text-[10px] font-mono text-center text-[#6E5564] mt-4">
            No auto-debit surprises. Single payment unlocks both accounts instantly.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
