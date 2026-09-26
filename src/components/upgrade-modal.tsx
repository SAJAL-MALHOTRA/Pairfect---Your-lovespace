"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, X, Shield, ArrowRight, Camera, Scale, Vault } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  description,
}: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/45 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative w-full max-w-lg rounded-[28px] border overflow-hidden p-6 sm:p-8 shadow-2xl z-10 space-y-6"
          style={{
            backgroundColor: "var(--paper-warm, #FAF6F0)",
            borderColor: "var(--border, #E8DFD8)",
            boxShadow: "0 28px 64px rgba(61, 36, 50, 0.22)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[var(--border,#E8DFD8)] bg-[var(--card,#FFFFFF)] text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Wax Seal Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/20 ring-4 ring-rose-100 mx-auto">
              <Heart className="w-7 h-7 fill-white/90 text-white" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                One Pass Unlocks For Both
              </span>
              <h2 className="font-display italic text-2xl sm:text-3xl font-black text-stone-900 leading-tight pt-1">
                Elevate Your Sanctuary
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                {description ||
                  "Unlock unlimited shared rituals, timeless film strips, and keepsake archiving for you and your partner."}
              </p>
            </div>
          </div>

          {/* Feature Callout if triggered by a specific feature */}
          {featureName && (
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs text-rose-950">
                <span className="font-semibold">Plus Feature:</span> {featureName} is included with your Sanctuary Pass.
              </div>
            </div>
          )}

          {/* Perks Grid */}
          <div className="space-y-2.5 text-xs text-stone-700 bg-white/60 p-4 rounded-2xl border border-[var(--border,#E8DFD8)]">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <strong className="text-stone-900 block font-semibold">Pay Once, Both Unlock</strong>
                When you activate a pass, your partner automatically gains full Plus access.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-pink-100 text-pink-700 shrink-0 mt-0.5">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-stone-900 block font-semibold">Unlimited Photobooth Film Strips</strong>
                Capture synchronized photo strips with film grain & custom love frames.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Scale className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-stone-900 block font-semibold">AI Vibe Judge Mediation</strong>
                Playful, objective conflict resolution and couple debate verdicts.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                <Vault className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-stone-900 block font-semibold">Permanent Keepsake Cloud Vault</strong>
                Lossless storage for your gratitude notes, letters, voice memos & dates.
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleGoToCheckout}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-[0.99] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Sanctuary Passes (from ₹99)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                No auto-renewal surprises
              </span>
              <span>UPI, Cards & Netbanking</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
