"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  GREENERY_KEYS,
  ATMOSPHERE_EFFECTS,
  OCCASION_STARTERS,
  BOUQUET_TEMPLATES,
  ArrangementPosition,
  getFlowerById,
} from "@/lib/bouquet/flowers-data";
import { RenderFlowerIcon } from "@/components/bouquet/flower-illustrations";
import { exportBouquetToPNG } from "@/lib/bouquet/export-bouquet";
import { playPlopSound, playChimeSound, playRustleSound } from "@/lib/bouquet/audio";
import { celebrateBouquet } from "@/lib/bouquet/confetti";
import {
  Sparkles,
  Flower2,
  Mail,
  Share2,
  Check,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Send,
  Loader2,
  Gift,
  Clock,
  Eye,
  Download,
  Shuffle,
  Trash2,
} from "lucide-react";

interface ReceivedBouquet {
  id: string;
  senderId: string;
  senderName: string;
  recipientName: string;
  flowers: string[];
  wrappingId: string;
  ribbonId: string;
  greeneryId: string;
  atmosphereId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function BouquetPage() {
  const { user, profile, pair, partner } = useAuth();
  const supabase = createClient();

  // Primary mode: "create" (studio builder) or "received" (partner deliveries)
  const [activeTab, setActiveTab] = useState<"create" | "received">("create");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isRevealMode, setIsRevealMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingToPartner, setIsSendingToPartner] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Received Bouquets State
  const [receivedBouquets, setReceivedBouquets] = useState<ReceivedBouquet[]>([]);
  const [isLoadingBouquets, setIsLoadingBouquets] = useState(false);
  const [activeBouquetId, setActiveBouquetId] = useState<string | null>(null);

  // Selected flowers map: { [flowerId: string]: number }
  const [selectedFlowersMap, setSelectedFlowersMap] = useState<Record<string, number>>({
    rose: 2,
    peony: 2,
    tulip: 2,
  });

  // Flat flower array for canvas
  const flowerList = useMemo(() => {
    const list: string[] = [];
    Object.entries(selectedFlowersMap).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) {
        list.push(id);
      }
    });
    return list;
  }, [selectedFlowersMap]);

  const totalFlowerCount = flowerList.length;

  // Styling State
  const [wrappingId, setWrappingId] = useState("classic");
  const [ribbonId, setRibbonId] = useState("gold");
  const [greeneryIndex, setGreeneryIndex] = useState(0);
  const [atmosphereId, setAtmosphereId] = useState("petals");
  const [arrangementSeed, setArrangementSeed] = useState(0.42);
  const [customPositions, setCustomPositions] = useState<ArrangementPosition[] | undefined>(undefined);
  const [isMono, setIsMono] = useState(false);

  // Letter & Recipient State
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
    if ((profile?.display_name || user?.user_metadata?.name) && !fromName) {
      setFromName(profile?.display_name || user?.user_metadata?.name || "");
    }
  }, [user, profile, partner, toName, fromName]);

  // Fetch Received Bouquets
  const fetchReceivedBouquets = useCallback(async () => {
    if (!user) return [];
    setIsLoadingBouquets(true);
    try {
      const res = await fetch(`/api/bouquet?recipientId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.bouquets)) {
          setReceivedBouquets(json.bouquets);
          return json.bouquets;
        }
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40);

      if (!error && data) {
        const bouquetNotifs = data.filter(
          (n: any) =>
            n.title?.toLowerCase().includes("bouquet") ||
            n.metadata?.bouquet ||
            n.body?.toLowerCase().includes("bouquet")
        );

        const parsed: ReceivedBouquet[] = bouquetNotifs.map((n: any) => {
          const bq = n.metadata?.bouquet;
          const senderDisplayName =
            bq?.fromName ||
            (partner && partner.id === n.sender_id ? partner.display_name : null) ||
            "Your Partner";
          const recipientDisplayName =
            bq?.toName || profile?.display_name || user?.user_metadata?.name || "You";

          return {
            id: n.id,
            senderId: n.sender_id,
            senderName: senderDisplayName,
            recipientName: recipientDisplayName,
            flowers: Array.isArray(bq?.flowers) && bq.flowers.length > 0
              ? bq.flowers
              : ["rose", "peony", "tulip", "daisy"],
            wrappingId: bq?.wrappingId || bq?.wrapping || "classic",
            ribbonId: bq?.ribbonId || bq?.ribbon || "gold",
            greeneryId: bq?.greeneryId || bq?.greenery || "eucalyptus",
            atmosphereId: bq?.atmosphereId || bq?.atmosphere || "petals",
            message: bq?.message || "A handpicked digital bouquet for you. Thinking of you today and always.",
            createdAt: n.created_at,
            read: Boolean(n.read),
          };
        });

        setReceivedBouquets(parsed);
        return parsed;
      }
    } catch (e) {
      console.error("Failed to fetch received bouquets:", e);
    } finally {
      setIsLoadingBouquets(false);
    }
    return [];
  }, [user, partner, profile, supabase]);

  useEffect(() => {
    if (user) {
      fetchReceivedBouquets();
    }
  }, [user, fetchReceivedBouquets]);

  // Rehydrate from URL Params: ?unwrap=<id> or ?share=<data>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const unwrapId = params.get("unwrap");
    const shareData = params.get("share");

    if (unwrapId) {
      setActiveTab("received");
      setActiveBouquetId(unwrapId);

      const loadNotificationBouquet = async () => {
        setIsLoadingBouquets(true);
        try {
          const res = await fetch(`/api/bouquet?id=${encodeURIComponent(unwrapId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.bouquet) {
              const bq = json.bouquet;
              const fMap: Record<string, number> = {};
              (bq.flowers || []).forEach((f: string) => {
                fMap[f] = (fMap[f] || 0) + 1;
              });
              setSelectedFlowersMap(fMap);
              setWrappingId(bq.wrappingId || "classic");
              setRibbonId(bq.ribbonId || "gold");
              setGreeneryIndex(GREENERY_KEYS.indexOf(bq.greeneryId as any) >= 0 ? GREENERY_KEYS.indexOf(bq.greeneryId as any) : 0);
              setAtmosphereId(bq.atmosphereId || "petals");
              setToName(bq.toName || "");
              setFromName(bq.fromName || "");
              setMessage(bq.message || "");
              setIsRevealMode(true);

              if (user) {
                await supabase.from("notifications").update({ read: true }).eq("id", unwrapId);
                setReceivedBouquets((prev) =>
                  prev.map((item) => (item.id === unwrapId ? { ...item, read: true } : item))
                );
              }
              return;
            }
          }
        } catch (e) {
          console.error("Failed to load unwrapped bouquet:", e);
        } finally {
          setIsLoadingBouquets(false);
        }
      };

      loadNotificationBouquet();
    } else if (shareData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(shareData))));
        if (decoded.flowers && Array.isArray(decoded.flowers)) {
          const fMap: Record<string, number> = {};
          decoded.flowers.forEach((f: string) => {
            fMap[f] = (fMap[f] || 0) + 1;
          });
          setSelectedFlowersMap(fMap);
          if (decoded.wrapping) setWrappingId(decoded.wrapping);
          if (decoded.ribbon) setRibbonId(decoded.ribbon);
          if (decoded.greenery) {
            const idx = GREENERY_KEYS.indexOf(decoded.greenery as any);
            if (idx >= 0) setGreeneryIndex(idx);
          }
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
  }, [user, partner, profile, supabase]);

  // Flower Selection Handlers
  const handleAddFlower = (flowerId: string) => {
    if (totalFlowerCount >= 10) return;
    playPlopSound();
    setSelectedFlowersMap((prev) => ({
      ...prev,
      [flowerId]: (prev[flowerId] || 0) + 1,
    }));
    setCustomPositions(undefined);
  };

  const handleRemoveFlower = (flowerId: string) => {
    if ((selectedFlowersMap[flowerId] || 0) <= 0) return;
    if (totalFlowerCount <= 3) return; // Keep minimum 3
    playPlopSound();
    setSelectedFlowersMap((prev) => {
      const next = { ...prev };
      if (next[flowerId] > 1) {
        next[flowerId]--;
      } else {
        delete next[flowerId];
      }
      return next;
    });
    setCustomPositions(undefined);
  };

  const handleClearAll = () => {
    setSelectedFlowersMap({ rose: 1, peony: 1, tulip: 1 });
    setCustomPositions(undefined);
  };

  const handleSurpriseMe = () => {
    const pool = FLOWER_LIST.map((f) => f.id);
    const count = 6 + Math.floor(Math.random() * 3); // 6 to 8 blooms
    const nextMap: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      nextMap[pick] = (nextMap[pick] || 0) + 1;
    }

    setSelectedFlowersMap(nextMap);
    setArrangementSeed(Math.random());
    setCustomPositions(undefined);
    playChimeSound();
  };

  const handleApplyTemplate = (template: typeof BOUQUET_TEMPLATES[0]) => {
    const nextMap: Record<string, number> = {};
    template.flowers.forEach((f) => {
      nextMap[f] = (nextMap[f] || 0) + 1;
    });
    setSelectedFlowersMap(nextMap);
    setWrappingId(template.wrappingId);
    setArrangementSeed(Math.random());
    setCustomPositions(undefined);
    playChimeSound();
    setStep(2);
  };

  const handleShuffleArrangement = () => {
    setArrangementSeed(Math.random());
    setCustomPositions(undefined);
    playRustleSound();
  };

  const handleCycleGreenery = () => {
    setGreeneryIndex((prev) => (prev + 1) % GREENERY_KEYS.length);
    playRustleSound();
  };

  const handleSelectWrapping = (id: string) => {
    setWrappingId(id);
    playRustleSound();
  };

  const handleApplyOccasion = (templateMsg: string, recipientTag: string) => {
    setMessage(templateMsg);
    if (!toName) setToName(recipientTag);
    playPlopSound();
  };

  // Share Link Generation
  const getShareUrl = () => {
    const payload = {
      flowers: flowerList,
      wrapping: wrappingId,
      ribbon: ribbonId,
      greenery: GREENERY_KEYS[greeneryIndex],
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

  // Download High-Resolution Keepsake PNG
  const handleDownloadPNG = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await exportBouquetToPNG({
        flowers: flowerList,
        wrappingId,
        ribbonId,
        greeneryId: GREENERY_KEYS[greeneryIndex],
        toName: toName.trim() || "My Favorite Person",
        fromName: fromName.trim() || "Always Yours",
        message: message.trim(),
      });
    } catch (e) {
      console.error("Failed to export bouquet:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Deliver Directly to Connected Partner
  const handleSendToPartner = async () => {
    if (!pair || !user || isSendingToPartner) return;
    setIsSendingToPartner(true);
    try {
      const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
      const bouquetId = `bq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const recipientDisplayName = toName.trim() || partner?.display_name || "Partner";
      const senderDisplayName =
        fromName.trim() || profile?.display_name || user.user_metadata?.name || "Your partner";

      const bouquetData = {
        id: bouquetId,
        flowers: flowerList,
        wrappingId,
        ribbonId,
        greeneryId: GREENERY_KEYS[greeneryIndex],
        atmosphereId,
        toName: recipientDisplayName,
        fromName: senderDisplayName,
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      if (partnerId) {
        const { data: notifData } = await supabase
          .from("notifications")
          .insert({
            pair_id: pair.id,
            recipient_id: partnerId,
            sender_id: user.id,
            type: "letter_sent",
            title: `${senderDisplayName} sent you a botanical bouquet`,
            body: "Tap to unwrap and read their personal note.",
            metadata: {
              bouquet: bouquetData,
              route: "/bouquet",
            },
          })
          .select()
          .maybeSingle();

        if (notifData?.id) {
          await supabase
            .from("notifications")
            .update({
              metadata: {
                bouquet: bouquetData,
                route: `/bouquet?unwrap=${notifData.id}`,
              },
            })
            .eq("id", notifData.id);
        }
      }

      await supabase.from("shared_moments").insert({
        pair_id: pair.id,
        created_by: user.id,
        title: "Botanical Bouquet",
        description: `Handpicked bouquet with ${flowerList.length} blooms for ${recipientDisplayName}: "${message.slice(0, 80)}..."`,
        moment_date: new Date().toISOString().split("T")[0],
        photo_url: "canvas-default.png",
      });

      await supabase.rpc("record_pair_activity", { p_pair_id: pair.id });

      celebrateBouquet();
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 5000);
    } catch (e: any) {
      alert(e.message || "Failed to send to partner.");
    } finally {
      setIsSendingToPartner(false);
    }
  };

  const handleOpenReceivedBouquet = async (bq: ReceivedBouquet) => {
    setActiveBouquetId(bq.id);
    const fMap: Record<string, number> = {};
    (bq.flowers || []).forEach((f) => {
      fMap[f] = (fMap[f] || 0) + 1;
    });
    setSelectedFlowersMap(fMap);
    setWrappingId(bq.wrappingId || "classic");
    setRibbonId(bq.ribbonId || "gold");
    const idx = GREENERY_KEYS.indexOf(bq.greeneryId as any);
    if (idx >= 0) setGreeneryIndex(idx);
    setAtmosphereId(bq.atmosphereId || "petals");
    setToName(bq.recipientName);
    setFromName(bq.senderName);
    setMessage(bq.message);
    setIsRevealMode(true);

    if (!bq.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", bq.id);
      setReceivedBouquets((prev) =>
        prev.map((item) => (item.id === bq.id ? { ...item, read: true } : item))
      );
    }
  };

  const handleMakeBouquetInReturn = () => {
    setToName(fromName || partner?.display_name || "My Love");
    setFromName(profile?.display_name || user?.user_metadata?.name || "Me");
    setMessage("Thank you for the lovely flowers. Here are fresh blooms from my heart to yours.");
    setIsRevealMode(false);
    setActiveTab("create");
    setStep(1);
  };

  const unreadCount = receivedBouquets.filter((b) => !b.read).length;

  const formatBouquetDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  // REVEAL MODE: Recipient Unwrapping View
  if (isRevealMode) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between">
        <Navigation />
        <main className="max-w-xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setIsRevealMode(false);
                setActiveTab("received");
                if (typeof window !== "undefined" && window.location.search) {
                  window.history.replaceState({}, "", "/bouquet");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-[var(--text-soft)] hover:text-[var(--text)] bg-[var(--paper-warm)] border border-[var(--border)] transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Received Bouquets</span>
            </button>

            <span className="text-[11px] font-mono text-rose-700/80 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Interactive Floral Delivery
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 space-y-1"
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
            key={activeBouquetId || `${flowerList.join("-")}-${wrappingId}-${ribbonId}-reveal`}
            flowers={flowerList}
            wrappingId={wrappingId}
            ribbonId={ribbonId}
            greeneryId={GREENERY_KEYS[greeneryIndex]}
            atmosphereId={atmosphereId}
            seed={arrangementSeed}
            positions={customPositions}
            toName={toName}
            fromName={fromName}
            message={message}
            isRevealMode={true}
          />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleMakeBouquetInReturn}
              className="btn-journal py-3 px-8 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105 transition-all"
            >
              <Flower2 className="w-4 h-4 text-white" />
              <span>Make a Bouquet in Return</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--paper-warm)] text-xs font-mono flex items-center gap-1.5 hover:border-rose-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>Save Keepsake</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // MAIN STUDIO WORKFLOW
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-36">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[var(--border)] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold uppercase tracking-wider">
              <Flower2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Botanical Floral Studio</span>
            </div>
            <h1 className="font-display italic text-3xl sm:text-4xl font-bold text-[var(--text)]">
              Digital Bouquets
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-soft)] font-sans">
              Handpick botanical blooms, unwrap deliveries from your partner, and keep shared floral memories alive.
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

        {/* Primary View Switcher: Make a Bouquet vs Received Bouquets */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "create"
                  ? "bg-[var(--burgundy)] text-white shadow-xs"
                  : "text-[var(--text-soft)] hover:text-[var(--text)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Make a Bouquet</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("received");
                fetchReceivedBouquets();
              }}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "received"
                  ? "bg-[var(--burgundy)] text-white shadow-xs"
                  : "text-[var(--text-soft)] hover:text-[var(--text)]"
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Received Bouquets</span>
              {receivedBouquets.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-transform ${
                    unreadCount > 0
                      ? "bg-rose-500 text-white animate-pulse"
                      : activeTab === "received"
                      ? "bg-white/20 text-white"
                      : "bg-black/10 text-zinc-700"
                  }`}
                >
                  {receivedBouquets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: RECEIVED BOUQUETS GALLERY */}
        {activeTab === "received" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="font-display italic text-2xl font-bold text-[var(--text)]">
                  Bouquets For You
                </h2>
                <p className="text-xs text-[var(--text-soft)] font-sans">
                  Tap to unwrap deliveries, read heartfelt notes, or replay the blooming reveals.
                </p>
              </div>

              {receivedBouquets.length > 0 && (
                <button
                  onClick={() => fetchReceivedBouquets()}
                  className="self-start sm:self-auto text-xs font-mono text-[var(--text-soft)] hover:text-[var(--burgundy)] flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refresh deliveries</span>
                </button>
              )}
            </div>

            {isLoadingBouquets && (
              <div className="p-16 text-center space-y-3">
                <Flower2 className="w-8 h-8 text-rose-500 mx-auto animate-spin" />
                <p className="text-xs font-mono text-[var(--text-soft)]">
                  Gathering your botanical deliveries...
                </p>
              </div>
            )}

            {!isLoadingBouquets && receivedBouquets.length === 0 && (
              <div className="p-12 sm:p-16 rounded-3xl bg-[var(--paper-warm)] border border-[var(--border)] text-center space-y-4 paper-grain">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
                  <Flower2 className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-display italic text-xl font-bold text-[var(--text)]">
                    No bouquets received yet
                  </h3>
                  <p className="text-xs text-[var(--text-soft)] font-sans leading-relaxed">
                    Surprise {partner?.display_name || "your partner"} with a handpicked digital bouquet today, and your shared floral deliveries will appear right here.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("create")}
                  className="btn-journal py-2.5 px-6 text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Make a Bouquet Now</span>
                </button>
              </div>
            )}

            {!isLoadingBouquets && receivedBouquets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedBouquets.map((bq) => (
                  <motion.div
                    key={bq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl border transition-all space-y-4 relative overflow-hidden paper-grain ${
                      !bq.read
                        ? "bg-rose-50/40 border-rose-300 ring-2 ring-rose-200/60 shadow-md"
                        : "bg-[var(--paper-warm)] border-[var(--border)] hover:border-rose-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                          {bq.senderName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">
                            From {bq.senderName}
                          </p>
                          <p className="text-[10px] font-mono text-[var(--text-soft)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatBouquetDate(bq.createdAt)}</span>
                          </p>
                        </div>
                      </div>

                      {!bq.read ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ready to Unwrap</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-soft)] text-[10px] font-mono">
                          Unwrapped
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)]">
                        Arrangement: {bq.flowers.length} Blooms
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bq.flowers.slice(0, 5).map((flId, idx) => {
                          const flData = getFlowerById(flId);
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-[var(--border)] text-[11px] font-sans font-medium text-[var(--text)] shadow-xs"
                            >
                              <RenderFlowerIcon flowerId={flId} size={18} />
                              <span>{flData?.name || flId}</span>
                            </span>
                          );
                        })}
                        {bq.flowers.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-xl bg-stone-100 text-[10px] font-mono text-stone-600">
                            +{bq.flowers.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border border-rose-100 dark:border-zinc-700/60">
                      <p className="font-script text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 italic line-clamp-2 leading-relaxed">
                        &ldquo;{bq.message}&rdquo;
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenReceivedBouquet(bq)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                          !bq.read
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "btn-journal"
                        }`}
                      >
                        {!bq.read ? (
                          <>
                            <Gift className="w-4 h-4" />
                            <span>Unwrap Bouquet and Read Note 🎀</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>View Bouquet and Untie Ribbon</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATOR WORKFLOW */}
        {activeTab === "create" && (
          <div>
            {/* Stepper Tabs */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--paper-warm)] border border-[var(--border)] shadow-xs">
                {[
                  { num: 1, label: "1. Pick Blooms" },
                  { num: 2, label: "2. Style & Arrange" },
                  { num: 3, label: "3. Card & Deliver" },
                ].map((s, idx) => {
                  const stepNum = (idx + 1) as 1 | 2 | 3;
                  const isCurrent = step === stepNum;
                  const isDone = step > stepNum;
                  return (
                    <button
                      key={stepNum}
                      onClick={() => setStep(stepNum)}
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
              <div className="lg:col-span-6 flex flex-col items-center sticky top-20">
                <BouquetCanvas
                  key={`${flowerList.join("-")}-${wrappingId}-${ribbonId}-${greeneryIndex}-${atmosphereId}-${arrangementSeed}`}
                  flowers={flowerList}
                  wrappingId={wrappingId}
                  ribbonId={ribbonId}
                  greeneryId={GREENERY_KEYS[greeneryIndex]}
                  atmosphereId={atmosphereId}
                  seed={arrangementSeed}
                  positions={customPositions}
                  onPositionsChange={(pos) => setCustomPositions(pos)}
                  allowDrag={step === 2}
                  isMono={isMono}
                  toName={toName}
                  fromName={fromName}
                  message={message}
                />

                <div className="flex items-center justify-between w-full max-w-[460px] px-2 pt-3 text-[11px] font-mono text-[var(--text-soft)]">
                  <span>{totalFlowerCount} blooms in bouquet</span>
                  <span>{step === 2 ? "Tip: drag blooms to rearrange" : "Tap note card to focus"}</span>
                </div>
              </div>

              {/* Right Column: Customizer Controls Panel */}
              <div className="lg:col-span-6 space-y-6">
                {/* STEP 1: CHOOSE BLOOMS */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display italic text-xl font-bold text-[var(--text)]">
                          Pick 3 to 10 Blooms
                        </h2>
                        <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          {totalFlowerCount} / 10 Selected
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-soft)] font-sans">
                        Tap blooms to add them to your bouquet. You can select multiple stems of your favorites.
                      </p>
                    </div>

                    {/* Presets and Surprise Me Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                      <button
                        onClick={handleSurpriseMe}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                        <span>Surprise Me</span>
                      </button>

                      {BOUQUET_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--paper-warm)] hover:border-rose-300 text-xs font-mono text-[var(--text)] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <span>{tmpl.emoji}</span>
                          <span>{tmpl.name}</span>
                        </button>
                      ))}

                      {totalFlowerCount > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="ml-auto text-xs font-mono text-[var(--text-soft)] hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    {/* 12 Botanical Flower Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {FLOWER_LIST.map((fl) => {
                        const count = selectedFlowersMap[fl.id] || 0;
                        const isSelected = count > 0;
                        return (
                          <div
                            key={fl.id}
                            onClick={() => handleAddFlower(fl.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center text-center space-y-2 relative overflow-hidden group select-none ${
                              isSelected
                                ? "bg-rose-50/60 border-rose-400 ring-2 ring-rose-200 shadow-sm"
                                : "bg-[var(--paper-warm)] border-[var(--border)] hover:border-rose-300"
                            }`}
                          >
                            {/* Minus Button if selected */}
                            {count > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFlower(fl.id);
                                }}
                                title="Remove one"
                                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white border border-rose-300 text-rose-700 font-bold flex items-center justify-center text-xs hover:bg-rose-100 shadow-xs cursor-pointer z-10"
                              >
                                -
                              </button>
                            )}

                            {/* Badge Count */}
                            {count > 0 && (
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold shadow-xs z-10">
                                {count}
                              </span>
                            )}

                            {/* Botanical Image */}
                            <div className="w-20 h-20 flex items-center justify-center transition-transform group-hover:scale-105">
                              <img
                                src={fl.image}
                                alt={fl.name}
                                className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
                                loading="lazy"
                              />
                            </div>

                            <div className="space-y-0.5 w-full">
                              <p className="font-sans font-bold text-xs text-[var(--text)] leading-tight truncate">
                                {fl.name}
                              </p>
                              <p className="text-[10px] text-rose-700/80 font-mono italic leading-tight truncate">
                                {fl.symbolism}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-mono text-[var(--text-soft)]">
                        {totalFlowerCount < 3 ? `Pick ${3 - totalFlowerCount} more to proceed` : "Ready to style"}
                      </span>
                      <button
                        onClick={() => {
                          setStep(2);
                          playChimeSound();
                        }}
                        disabled={totalFlowerCount < 3}
                        className="btn-journal py-3 px-8 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <span>Proceed to Style & Arrange</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: STYLE & ARRANGE */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display italic text-xl font-bold text-[var(--text)]">
                          Style Wrap & Foliage
                        </h2>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleShuffleArrangement}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--paper-warm)] hover:border-rose-300 text-xs font-mono text-[var(--text)] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <Shuffle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Shuffle Layout</span>
                          </button>
                          <button
                            onClick={handleCycleGreenery}
                            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--paper-warm)] hover:border-rose-300 text-xs font-mono text-[var(--text)] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Change Bush</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-soft)] font-sans">
                        Customize wrapping, glass vase, ribbon tie, and ambient atmosphere. You can drag flowers on the canvas to place them freely.
                      </p>
                    </div>

                    {/* 1. Wrapping Paper & Vase Styles */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                        Wrapping Paper or Vase
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {Object.values(WRAPPING_STYLES).map((w) => (
                          <button
                            key={w.id}
                            onClick={() => handleSelectWrapping(w.id)}
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

                    {/* 2. Ribbon Ties */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                        Ribbon Tie & Bow
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(RIBBON_STYLES).map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setRibbonId(r.id);
                              playRustleSound();
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                              ribbonId === r.id
                                ? "bg-rose-50 border-rose-500 text-rose-800 font-bold"
                                : "border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-xs"
                              style={{ backgroundColor: r.color }}
                            />
                            <span>{r.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Greenery Foliage Choice */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                        Foliage Bush ({GREENERY_OPTIONS[GREENERY_KEYS[greeneryIndex]]?.name})
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {GREENERY_KEYS.map((gKey, idx) => {
                          const gData = GREENERY_OPTIONS[gKey];
                          const isCurrent = greeneryIndex === idx;
                          return (
                            <button
                              key={gKey}
                              onClick={() => {
                                setGreeneryIndex(idx);
                                playRustleSound();
                              }}
                              className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                isCurrent
                                  ? "bg-emerald-50/70 border-emerald-500 font-bold text-emerald-900 ring-2 ring-emerald-200"
                                  : "border-[var(--border)] text-[var(--text-soft)]"
                              }`}
                            >
                              <p className="text-xs font-sans truncate">{gData.name.split(" ")[1] || gData.name}</p>
                              <p className="text-[10px] font-mono opacity-75 truncate">{gData.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Atmosphere Particles & Monochrome Switch */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)] block">
                          Atmosphere Effect
                        </label>
                        <button
                          onClick={() => setIsMono(!isMono)}
                          className="text-[11px] font-mono text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
                        >
                          {isMono ? "Color Palette" : "Monochrome Ink"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(ATMOSPHERE_EFFECTS).map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              setAtmosphereId(a.id);
                              playPlopSound();
                            }}
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
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Blooms
                      </button>
                      <button
                        onClick={() => {
                          setStep(3);
                          playChimeSound();
                        }}
                        className="btn-journal py-3 px-8 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>Proceed to Write Note</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PERSONAL NOTE & DELIVER */}
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
                          placeholder="Their Name or Nickname"
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
                        className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] outline-none text-[var(--text)] focus:border-rose-400 leading-relaxed text-sm"
                        style={{
                          fontFamily: "var(--font-handwriting), Georgia, serif",
                        }}
                      />
                    </div>

                    {/* Share & Keepsake Actions Grid */}
                    <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] space-y-3">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-soft)]">
                        Share & Keepsake Options
                      </p>

                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Download High-Resolution PNG */}
                        <button
                          onClick={handleDownloadPNG}
                          disabled={isDownloading}
                          className="p-3.5 rounded-xl border border-[var(--border)] hover:border-rose-400 bg-white dark:bg-zinc-800 text-left cursor-pointer transition-all flex items-center justify-between disabled:opacity-50"
                        >
                          <div className="space-y-0.5">
                            <p className="font-sans font-bold text-xs text-[var(--text)]">
                              {isDownloading ? "Saving Image..." : "Download Keepsake"}
                            </p>
                            <p className="text-[10px] text-[var(--text-soft)] font-mono">
                              300 DPI High-Res PNG
                            </p>
                          </div>
                          <Download className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>

                      {/* Deliver Directly to Connected Partner */}
                      {pair && (
                        <button
                          disabled={isSendingToPartner}
                          onClick={handleSendToPartner}
                          className="w-full btn-journal py-3 px-4 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01] transition-all"
                        >
                          {isSendingToPartner ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Delivering Bouquet...</span>
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
                          setSelectedFlowersMap({ rose: 2, peony: 2, tulip: 2 });
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
          </div>
        )}
      </main>
    </div>
  );
}
