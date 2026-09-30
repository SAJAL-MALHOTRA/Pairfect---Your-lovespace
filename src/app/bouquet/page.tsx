"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import BouquetCanvas from "@/components/bouquet/bouquet-canvas";
import {
  FLOWER_LIST,
  BOTANICAL_FLOWERS,
  WRAPPING_STYLES,
  RIBBON_STYLES,
  GREENERY_OPTIONS,
  ATMOSPHERE_EFFECTS,
  OCCASION_STARTERS,
  DigitalBouquet,
} from "@/lib/bouquet/flowers-data";
import { RenderFlowerIcon } from "@/components/bouquet/flower-illustrations";
import { exportBouquetToPNG } from "@/lib/bouquet/export-bouquet";
import {
  Sparkles,
  Flower2,
  Mail,
  Download,
  Share2,
  Check,
  ArrowRight,
  ArrowLeft,
  Heart,
  RotateCcw,
  Send,
  Loader2,
} from "lucide-react";

export default function BouquetPage() {
  const { user, pair, partner } = useAuth();
  const supabase = createClient();

  // ── Mode & Stepper ──
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isRevealMode, setIsRevealMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingToPartner, setIsSendingToPartner] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // ── Bouquet Configuration State ──
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([
    "rose",
    "peony",
    "tulip",
  ]);
  const [wrappingId, setWrappingId] = useState("kraft");
  const [ribbonId, setRibbonId] = useState("rose");
  const [greeneryId, setGreeneryId] = useState("eucalyptus");
  const [atmosphereId, setAtmosphereId] = useState("petals");

  const [toName, setToName] = useState("");
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState(
    "A handpicked digital bouquet for you. Thinking of you today and always."
  );

  // Auto-fill names if authenticated
  useEffect(() => {
    if (partner?.display_name && !toName) {
      setToName(partner.display_name);
    }
    if (user?.user_metadata?.name && !fromName) {
      setFromName(user.user_metadata.name);
    }
  }, [user, partner, toName, fromName]);

  // ── Rehydrate from Shared URL Param ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get("share");

    if (shareData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(shareData))));
        if (decoded.flowers && Array.isArray(decoded.flowers)) {
          setSelectedFlowers(decoded.flowers);
          if (decoded.wrapping) setWrappingId(decoded.wrapping);
          if (decoded.ribbon) setRibbonId(decoded.ribbon);
          if (decoded.greenery) setGreeneryId(decoded.greenery);
          if (decoded.atmosphere) setAtmosphereId(decoded.atmosphere);
          if (decoded.toName) setToName(decoded.toName);
          if (decoded.fromName) setFromName(decoded.fromName);
          if (decoded.message) setMessage(decoded.message);
          setIsRevealMode(true);
        }
      } catch (e) {
        console.error("Failed to decode shared bouquet:", e);
      }
    }
  }, []);

  // ── Flower Selection Handlers ──
  const handleToggleFlower = (flowerId: string) => {
    if (selectedFlowers.includes(flowerId)) {
      if (selectedFlowers.length <= 3) return; // Keep minimum 3
      setSelectedFlowers(selectedFlowers.filter((id) => id !== flowerId));
    } else {
      if (selectedFlowers.length >= 6) return; // Maximum 6
      setSelectedFlowers([...selectedFlowers, flowerId]);
    }
  };

  const handleApplyOccasion = (templateMsg: string, occasionTag: string) => {
    setMessage(templateMsg);
    if (!toName) setToName(occasionTag);
  };

  // ── Share Link Generation ──
  const getShareUrl = () => {
    const payload: Partial<DigitalBouquet> = {
      flowers: selectedFlowers,
      wrapping: wrappingId,
      ribbon: ribbonId,
      greenery: greeneryId,
      atmosphere: atmosphereId,
      toName: toName.trim() || "My Favorite Person",
      fromName: fromName.trim() || "Always Yours",
      message: message.trim(),
      createdAt: Date.now(),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.pairfect.site";
    return `${origin}/bouquet?share=${b64}`;
  };

  const handleCopyShareLink = async () => {
    try {
      const url = getShareUrl();
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      alert("Please copy URL from the browser address bar.");
    }
  };

  // ── Download PNG Keepsake ──
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      await exportBouquetToPNG({
        flowers: selectedFlowers,
        wrappingId,
        ribbonId,
        greeneryId,
        toName: toName.trim() || "My Favorite Person",
        fromName: fromName.trim() || "Always Yours",
        message: message.trim(),
      });
    } catch (e) {
      console.error("Bouquet export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Send to Connected Partner in Pairfect ──
  const handleSendToPartner = async () => {
    if (!pair || !user || isSendingToPartner) return;
    setIsSendingToPartner(true);
    try {
      const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;

      // 1. Notify partner
      if (partnerId) {
        await supabase.from("notifications").insert({
          pair_id: pair.id,
          recipient_id: partnerId,
          sender_id: user.id,
          type: "letter_sent",
          title: `${fromName.trim() || "Your partner"} sent you a digital bouquet 💐`,
          body: "Tap to unwrap and read their personal note.",
        });
      }

      // 2. Save to shared couple moments
      await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        title: "Digital Botanical Bouquet 💐",
        description: `Handpicked bouquet with ${selectedFlowers.length} blooms for ${toName.trim() || "Partner"}: "${message.slice(0, 80)}..."`,
        moment_date: new Date().toISOString().split("T")[0],
        photo_url: "canvas-default.png",
      });

      // 3. Keep couple streak active
      await supabase.rpc("record_pair_activity", { p_pair_id: pair.id });

      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 5000);
    } catch (e: any) {
      alert(e.message || "Failed to send to partner.");
    } finally {
      setIsSendingToPartner(false);
    }
  };

  // ── REVEAL MODE (Recipient Unwrapping Experience) ──
  if (isRevealMode) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between">
        <Navigation />
        <main className="max-w-xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-1"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold uppercase tracking-wider">
              <Flower2 className="w-3.5 h-3.5 text-rose-600" />
              <span>A Special Delivery For You</span>
            </div>
            <h1 className="font-display italic text-3xl font-bold text-[var(--text)]">
              {toName || "Someone Special"}
            </h1>
            <p className="text-xs text-[var(--text-soft)] font-mono">
              From {fromName || "Someone who loves you"}
            </p>
          </motion.div>

          <BouquetCanvas
            flowers={selectedFlowers}
            wrappingId={wrappingId}
            ribbonId={ribbonId}
            greeneryId={greeneryId}
            atmosphereId={atmosphereId}
            toName={toName}
            fromName={fromName}
            message={message}
            isRevealMode={true}
          />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="btn-journal py-2.5 px-6 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Saving..." : "Download Keepsake Image"}</span>
            </button>

            <Link
              href="/bouquet"
              className="btn-journal-ghost py-2.5 px-6 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
            >
              <Flower2 className="w-4 h-4 text-rose-600" />
              <span>Make a Bouquet in Return</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── CREATOR WORKFLOW (Steps 1, 2, 3) ──
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-36">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Top Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold uppercase tracking-wider">
              <Flower2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Digital Bouquets & Letters</span>
            </div>
            <h1 className="font-display italic text-3xl sm:text-4xl font-bold text-[var(--text)]">
              Handpicked Digital Bouquet
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-soft)] font-sans">
              Choose 3 to 6 blooms, style your wrap and ribbon, and write a personal card to share or print.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/love-letter"
              className="px-4 py-2 rounded-xl border border-[var(--border)] hover:border-rose-300 text-xs font-mono flex items-center gap-1.5 transition-colors text-[var(--text)]"
            >
              <Mail className="w-3.5 h-3.5 text-rose-600" />
              <span>Wax-Sealed Letters ▷</span>
            </Link>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs">
            {[
              { num: 1, label: "Flowers" },
              { num: 2, label: "Style Wrap" },
              { num: 3, label: "Personal Note" },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num as any)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--burgundy)] text-white font-bold shadow-xs"
                      : isDone
                      ? "bg-emerald-500/10 text-emerald-700 font-medium"
                      : "text-[var(--text-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                    {isDone ? "✓" : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Interactive Bouquet Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <BouquetCanvas
              flowers={selectedFlowers}
              wrappingId={wrappingId}
              ribbonId={ribbonId}
              greeneryId={greeneryId}
              atmosphereId={atmosphereId}
              toName={toName}
              fromName={fromName}
              message={message}
            />

            <div className="flex items-center justify-between w-full max-w-[460px] px-2 pt-3 text-[11px] font-mono text-[var(--text-soft)]">
              <span>{selectedFlowers.length} blooms arranged</span>
              <span>Tap note card on bouquet to focus</span>
            </div>
          </div>

          {/* Right Column: Customizer Controls Panel */}
          <div className="lg:col-span-6 space-y-6">
            {/* ── STEP 1: CHOOSE FLOWERS ── */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display italic text-xl font-bold text-[var(--text)]">
                      Pick Your Blooms
                    </h2>
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      {selectedFlowers.length} / 6 Selected
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft)] font-sans">
                    Choose between 3 and 6 botanical flowers to shape your bouquet.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FLOWER_LIST.map((fl) => {
                    const isSelected = selectedFlowers.includes(fl.id);
                    return (
                      <button
                        key={fl.id}
                        onClick={() => handleToggleFlower(fl.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center text-center space-y-2 relative overflow-hidden ${
                          isSelected
                            ? "bg-rose-50/70 border-rose-400 ring-2 ring-rose-200 shadow-sm"
                            : "bg-[var(--paper-warm)] border-[var(--border)] hover:border-rose-300"
                        }`}
                      >
                        <div className="w-16 h-16 flex items-center justify-center">
                          <RenderFlowerIcon flowerId={fl.id} size={58} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-sans font-bold text-xs text-[var(--text)] leading-tight">
                            {fl.name}
                          </p>
                          <p className="text-[10px] text-rose-700/80 font-mono italic leading-tight">
                            {fl.symbolism}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-journal py-3 px-8 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Proceed to Style Wrap</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: STYLE WRAP & DETAILS ── */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="font-display italic text-xl font-bold text-[var(--text)]">
                    Wrapping & Atmosphere
                  </h2>
                  <p className="text-xs text-[var(--text-soft)] font-sans">
                    Dress your arrangement with textured paper folds, silk ribbon, and ambient particles.
                  </p>
                </div>

                {/* 1. Wrapping Style */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                    Wrapping Paper Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.values(WRAPPING_STYLES).map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setWrappingId(w.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          wrappingId === w.id
                            ? "bg-[var(--paper-mid)] border-rose-500 ring-2 ring-rose-200"
                            : "bg-[var(--paper-warm)] border-[var(--border)] hover:border-rose-300"
                        }`}
                      >
                        <p className="font-sans font-bold text-xs text-[var(--text)] truncate">
                          {w.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-soft)] truncate">
                          {w.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Ribbon Tie */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                    Ribbon Tie & Bow
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(RIBBON_STYLES).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRibbonId(r.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          ribbonId === r.id
                            ? "bg-rose-50 border-rose-500 text-rose-800 font-bold"
                            : "border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: r.color }}
                        />
                        <span>{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Greenery Foliage */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                    Foliage & Greenery
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(GREENERY_OPTIONS).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGreeneryId(g.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          greeneryId === g.id
                            ? "bg-emerald-50/70 border-emerald-500 font-bold text-emerald-900"
                            : "border-[var(--border)] text-[var(--text-soft)]"
                        }`}
                      >
                        <p className="text-xs font-sans truncate">{g.name}</p>
                        <p className="text-[10px] font-mono opacity-75 truncate">{g.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Atmosphere FX */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                    Atmosphere Particles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(ATMOSPHERE_EFFECTS).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAtmosphereId(a.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          atmosphereId === a.id
                            ? "bg-rose-50 border-rose-500 text-rose-900 font-bold"
                            : "border-[var(--border)] text-[var(--text-soft)]"
                        }`}
                      >
                        <span>{a.icon}</span>
                        <span>{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Flowers
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn-journal py-3 px-8 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Proceed to Write Note</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: PERSONAL NOTE & SHARE ── */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="font-display italic text-xl font-bold text-[var(--text)]">
                    Attached Card Note
                  </h2>
                  <p className="text-xs text-[var(--text-soft)] font-sans">
                    Write words that belong to the two of you, or pick an occasion starter.
                  </p>
                </div>

                {/* Occasion Starters Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                    Occasion Starters
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {OCCASION_STARTERS.map((oc) => (
                      <button
                        key={oc.id}
                        onClick={() => handleApplyOccasion(oc.defaultMessage, oc.recipientTag)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] hover:border-rose-400 bg-[var(--paper-warm)] text-[11px] font-mono text-[var(--text)] cursor-pointer transition-colors"
                      >
                        {oc.occasion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* To & From Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)]">
                      To:
                    </label>
                    <input
                      type="text"
                      placeholder="Their Name / Nickname"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] focus:border-rose-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)]">
                      From:
                    </label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)]">
                    Your Handwritten Note:
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write something heartfelt..."
                    className="w-full p-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] font-script text-base focus:border-rose-400 leading-relaxed"
                  />
                </div>

                {/* Share Actions Grid */}
                <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)]">
                    Share & Keepsake Options
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Copy Shareable Link */}
                    <button
                      onClick={handleCopyShareLink}
                      className="p-3 rounded-xl border border-[var(--border)] hover:border-rose-400 bg-white dark:bg-zinc-800 text-left cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="font-sans font-bold text-xs text-[var(--text)]">
                          {copiedLink ? "Link Copied ✓" : "Copy Unlisted Link"}
                        </p>
                        <p className="text-[10px] text-[var(--text-soft)] font-mono">
                          Share on WhatsApp, iMessage
                        </p>
                      </div>
                      <Share2 className="w-4 h-4 text-rose-600" />
                    </button>

                    {/* Download High-Res Image */}
                    <button
                      disabled={isExporting}
                      onClick={handleDownloadPNG}
                      className="p-3 rounded-xl border border-[var(--border)] hover:border-rose-400 bg-white dark:bg-zinc-800 text-left cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="font-sans font-bold text-xs text-[var(--text)]">
                          {isExporting ? "Exporting..." : "Download Keepsake PNG"}
                        </p>
                        <p className="text-[10px] text-[var(--text-soft)] font-mono">
                          High-res 300 DPI image
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>

                  {/* Send to Connected Partner */}
                  {pair && (
                    <button
                      disabled={isSendingToPartner}
                      onClick={handleSendToPartner}
                      className="w-full btn-journal py-3 px-4 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] transition-all"
                    >
                      {isSendingToPartner ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Delivering Bouquet…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Deliver Directly to {partner?.display_name || "Partner"}</span>
                        </>
                      )}
                    </button>
                  )}

                  {sentSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs text-center font-medium flex items-center justify-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4" />
                      <span>Bouquet delivered and saved to your shared memories!</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Styling
                  </button>

                  <button
                    onClick={() => {
                      setSelectedFlowers(["rose", "peony", "tulip"]);
                      setMessage("A handpicked digital bouquet for you. Thinking of you today and always.");
                      setStep(1);
                    }}
                    className="text-xs font-mono text-[var(--text-soft)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
