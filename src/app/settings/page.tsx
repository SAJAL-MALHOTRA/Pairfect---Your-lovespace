"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import { CoupleBeansMascot } from "@/components/couple-mascot";
import { RecoveryPhraseModal } from "@/components/vault/recovery-phrase-modal";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  PenLine,
  Smile,
  User,
  Languages,
  HardDrive,
  Gamepad2,
  CreditCard,
  FileText,
  ShieldCheck,
  Mail,
  ExternalLink,
  LogOut,
  Loader2,
  Heart,
} from "lucide-react";

// Top Right Mascot with gentle breathing and floating hearts
function SettingsMascotWithHearts() {
  return (
    <div className="relative shrink-0 flex items-center justify-center p-2">
      {/* Gentle Breathing Mascot */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          y: [0, -3, 0],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{
          scale: 1.1,
          rotate: [-2, 2, -1, 0],
          transition: { type: "spring", stiffness: 400, damping: 16 },
        }}
        className="cursor-pointer select-none"
      >
        <CoupleBeansMascot className="w-24 h-18 sm:w-28 sm:h-20" />
      </motion.div>

      {/* Floating Animated Hearts */}
      {/* Heart 1 */}
      <motion.div
        animate={{
          y: [0, -20, -36],
          x: [0, 8, -4],
          opacity: [0, 0.9, 0],
          scale: [0.5, 1, 0.6],
        }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.2,
        }}
        className="absolute -top-2 right-4 pointer-events-none text-rose-500"
      >
        <Heart className="w-4 h-4 fill-rose-500 drop-shadow-xs" />
      </motion.div>

      {/* Heart 2 */}
      <motion.div
        animate={{
          y: [0, -16, -30],
          x: [0, -7, 3],
          opacity: [0, 0.85, 0],
          scale: [0.4, 0.85, 0.5],
        }}
        transition={{
          duration: 3.0,
          repeat: Infinity,
          ease: "easeOut",
          delay: 1.2,
        }}
        className="absolute -top-1 left-3 pointer-events-none text-pink-400"
      >
        <Heart className="w-3.5 h-3.5 fill-pink-400 drop-shadow-xs" />
      </motion.div>

      {/* Heart 3 (smaller sparkle heart) */}
      <motion.div
        animate={{
          y: [0, -24, -40],
          x: [0, 5, -3],
          opacity: [0, 0.75, 0],
          scale: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeOut",
          delay: 2.0,
        }}
        className="absolute -top-3 right-8 pointer-events-none text-rose-400"
      >
        <Heart className="w-2.5 h-2.5 fill-rose-400 drop-shadow-xs" />
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, pair, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      <Navigation />

      {/* Main Content Area with Desktop Sidebar Offset */}
      <div className="lg:pl-60 xl:pl-64 min-h-screen pt-18 pb-10 sm:py-10 px-4 sm:px-8 flex justify-center">
        <main className="w-full max-w-4xl space-y-8 select-none pb-24">
          
          {/* ══════════════════════════════════════════════════
              TOP HEADER: BACK TO PROFILE & TITLE + MASCOT
              ══════════════════════════════════════════════════ */}
          <div className="flex items-start justify-between pt-2">
            <div className="space-y-2">
              <motion.div
                whileHover={{ x: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-block"
              >
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </motion.div>
              <h1 className="text-3xl sm:text-5xl font-heading font-black text-stone-900 tracking-tight">
                Settings
              </h1>
              <p className="text-xs sm:text-sm font-sans text-stone-500">
                Your account, your plan and the app.
              </p>
            </div>

            {/* Hugging Beans Mascot with gentle breathing and floating hearts */}
            <SettingsMascotWithHearts />
          </div>

          {/* ══════════════════════════════════════════════════
              SETTINGS GROUPS: 2 COLUMNS
              ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: PERSONAL & YOUR GAMES */}
            <div className="space-y-6">
              
              {/* PERSONAL Group */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase px-2">
                  PERSONAL
                </p>

                {/* Settings card with spring hover lift */}
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 14px 34px -10px rgba(0, 0, 0, 0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="rounded-3xl bg-white border border-stone-200/90 shadow-2xs divide-y divide-stone-100 overflow-hidden"
                >
                  {/* Your name */}
                  <Link
                    href="/profile"
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                        <PenLine className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Your name
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {profile?.display_name || "Add your name"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Gender */}
                  <div className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                        <Smile className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Gender
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          Couple Duo
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </div>

                  {/* Account */}
                  <Link
                    href={user ? "#" : "/login"}
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Account
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {user ? `Active · ${user.email}` : "Guest · sign in to keep your strips"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Language */}
                  <div className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500 group-hover:scale-105 transition-transform">
                        <Languages className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Language
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          English
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🇺🇸</span>
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </div>
                  </div>

                  {/* Storage & Vault */}
                  <div
                    onClick={() => setShowRecoveryModal(true)}
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-2">
                          <span>Vault & Recovery Phrase</span>
                          <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">12 Words</span>
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          Zero-knowledge client backup · manage key
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.div>
              </div>

              {/* YOUR GAMES Group */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase px-2">
                  YOUR GAMES
                </p>

                {/* Settings card with spring hover lift */}
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 14px 34px -10px rgba(0, 0, 0, 0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="rounded-3xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden"
                >
                  <Link
                    href="/play"
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Game log
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {user ? "View activity history" : "Sign in to keep your games"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              </div>

            </div>

            {/* Right Column: SUBSCRIPTION & ABOUT */}
            <div className="space-y-6">
              
              {/* SUBSCRIPTION Group */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase px-2">
                  SUBSCRIPTION
                </p>

                {/* Settings card with spring hover lift */}
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 14px 34px -10px rgba(0, 0, 0, 0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="rounded-3xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden"
                >
                  <Link
                    href="/checkout"
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Billing
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          Free plan · plans, payments &amp; purchases
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              </div>

              {/* ABOUT Group */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase px-2">
                  ABOUT
                </p>

                {/* Settings card with spring hover lift */}
                <motion.div
                  whileHover={{
                    y: -4,
                    boxShadow: "0 14px 34px -10px rgba(0, 0, 0, 0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="rounded-3xl bg-white border border-stone-200/90 shadow-2xs divide-y divide-stone-100 overflow-hidden"
                >
                  {/* Terms of Use */}
                  <Link
                    href="/terms"
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                        Terms of Use
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                  </Link>

                  {/* Privacy Policy */}
                  <Link
                    href="/privacy"
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                        Privacy Policy
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                  </Link>

                  {/* Contact support */}
                  <a
                    href="mailto:pairfect.site@yahoo.com"
                    className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-xs sm:text-sm text-stone-900">
                          Contact support
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          pairfect.site@yahoo.com
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                  </a>
                </motion.div>
              </div>

              {/* Sign out action if logged in */}
              {user && (
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full py-3 px-4 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              )}

            </div>

          </div>

          {/* Bottom Tagline */}
          <div className="pt-8 text-center">
            <p className="text-xs font-mono text-stone-400">
              pairfect · made for two
            </p>
          </div>

          {/* BIP-39 Recovery Phrase Modal */}
          <RecoveryPhraseModal
            isOpen={showRecoveryModal}
            onClose={() => setShowRecoveryModal(false)}
            pairId={pair?.id}
          />
        </main>
      </div>

    </div>
  );
}
