"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Bell, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PushOptInBanner() {
  const { partner } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice about push notifications
    const pushChoice = localStorage.getItem("pairfect_push_opt_in_choice");
    if (!pushChoice && partner) {
      // Show contextual prompt after a slight delay
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [partner]);

  const handleOptIn = async () => {
    localStorage.setItem("pairfect_push_opt_in_choice", "enabled");
    setVisible(false);

    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.log("Notification permission request error:", e);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pairfect_push_opt_in_choice", "dismissed");
    setVisible(false);
  };

  if (!visible || !partner) return null;

  const partnerName = partner.display_name || "your partner";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="mb-6 p-4 rounded-[var(--radius-card)] bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-md flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--burgundy)] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm text-[var(--text)]">
              Stay close with {partnerName} ♡
            </p>
            <p className="font-sans text-xs text-[var(--text-soft)]">
              Would you like to be notified when {partnerName} sends a letter or ping?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOptIn}
            className="btn-primary py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Enable
          </button>

          <button
            onClick={handleDismiss}
            className="btn-secondary py-2 px-3 text-xs text-[var(--text-soft)]"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
