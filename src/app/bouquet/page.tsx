"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Heart, Check, X, Loader2, AlertCircle, 
  Sparkles, Send, ArrowLeft, Clock, MailOpen, Mail,
  BookOpen, ChevronRight, Gift
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Flower SVG renderers matching Screen 1 visual identities
function FlowerSVG({ name, className = "w-20 h-20" }: { name: string; className?: string }) {
  const clean = name.toLowerCase().replace(/\s+/g, "");

  if (clean === "rose") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="url(#roseGrad)" />
        <path d="M50 20 C35 30 35 70 50 80 C65 70 65 30 50 20" stroke="#fecdd3" strokeWidth="1.5" />
        <path d="M38 32 C45 42 55 42 62 32" stroke="#fecdd3" strokeWidth="1.5" />
        <path d="M44 44 C48 50 52 50 56 44" stroke="#fecdd3" strokeWidth="1.5" />
        <path d="M50 78 L50 92" stroke="#10b981" strokeWidth="3" />
        <defs>
          <linearGradient id="roseGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "peony") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="32" fill="url(#peonyGrad)" />
        <path d="M50 18 C30 25 30 75 50 82 C70 75 70 25 50 18" stroke="#fbcfe8" strokeWidth="1.5" opacity="0.6" />
        <circle cx="50" cy="50" r="22" fill="#ec4899" opacity="0.75" />
        <circle cx="50" cy="50" r="14" fill="#db2777" />
        <circle cx="50" cy="50" r="6" fill="#f43f5e" />
        <defs>
          <linearGradient id="peonyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "tulip") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35 30 C30 50 35 75 50 80 C65 75 70 50 65 30 C55 35 45 35 35 30 Z" fill="url(#tulipGrad)" />
        <path d="M50 35 C42 55 45 75 50 80 C55 75 58 55 50 35 Z" fill="#e879f9" opacity="0.85" />
        <path d="M50 80 L50 92" stroke="#10b981" strokeWidth="3" />
        <defs>
          <linearGradient id="tulipGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#86198f" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "daisy") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="32" fill="url(#daisyGrad)" />
        <circle cx="50" cy="50" r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
        <path d="M50 12 L50 32" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 68 L50 88" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 50 L32 50" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M68 50 L88 50" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M23 23 L37 37" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M63 63 L77 77" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M23 77 L37 63" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M63 23 L77 37" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <defs>
          <linearGradient id="daisyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "lily") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15 L62 42 L90 45 L68 62 L74 88 L50 72 L26 88 L32 62 L10 45 L38 42 Z" fill="url(#lilyGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="6" fill="#fb7185" />
        <defs>
          <linearGradient id="lilyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "orchid") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="50" rx="30" ry="15" fill="url(#orchidGrad)" transform="rotate(-30 50 50)" />
        <ellipse cx="50" cy="50" rx="30" ry="15" fill="url(#orchidGrad)" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="15" ry="25" fill="#f472b6" />
        <circle cx="50" cy="50" r="6" fill="#f59e0b" />
        <defs>
          <linearGradient id="orchidGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "camellia") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="32" fill="url(#camelliaGrad)" />
        <circle cx="50" cy="50" r="22" fill="#fda4af" stroke="#f43f5e" strokeWidth="1" />
        <circle cx="50" cy="50" r="12" fill="#f43f5e" />
        <circle cx="50" cy="50" r="5" fill="#fbbf24" />
        <defs>
          <linearGradient id="camelliaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 C30 35 30 65 50 85 C70 65 70 35 50 15 Z" fill="url(#lotusGrad)" />
      <path d="M50 30 C38 45 38 65 50 85 C62 65 62 45 50 30 Z" fill="#fb7185" opacity="0.9" />
      <path d="M50 45 C44 55 44 65 50 85 C56 65 56 55 50 45 Z" fill="#f43f5e" />
      <defs>
        <linearGradient id="lotusGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Greenery SVG Renderers matching Screen 2
function GreenerySVG({ name, className = "w-28 h-28" }: { name: string; className?: string }) {
  const clean = name.toLowerCase().replace(/\s+/g, "");

  if (clean === "leafy") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 95 L50 35" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 70 C30 60 20 40 15 25" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 70 C70 60 80 40 85 25" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        {/* leaves */}
        <circle cx="15" cy="25" r="8" fill="#34d399" />
        <circle cx="85" cy="25" r="8" fill="#34d399" />
        <circle cx="28" cy="48" r="7" fill="#059669" />
        <circle cx="72" cy="48" r="7" fill="#059669" />
        <circle cx="36" cy="62" r="6" fill="#10b981" />
        <circle cx="64" cy="62" r="6" fill="#10b981" />
      </svg>
    );
  }
  if (clean === "fern") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 95 C45 65 40 40 30 15" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        {/* fronds */}
        <path d="M42 65 C32 60 26 50 20 42" stroke="#059669" strokeWidth="2.5" />
        <path d="M45 50 C35 45 28 35 24 28" stroke="#059669" strokeWidth="2.5" />
        <path d="M48 80 C36 78 30 68 22 60" stroke="#059669" strokeWidth="2.5" />
      </svg>
    );
  }
  if (clean === "eucalyptus") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 95 L50 15" stroke="#065f46" strokeWidth="3" />
        <ellipse cx="50" cy="30" rx="14" ry="10" fill="#0d9488" opacity="0.8" />
        <ellipse cx="50" cy="50" rx="18" ry="12" fill="#0d9488" />
        <ellipse cx="50" cy="70" rx="22" ry="14" fill="#14b8a6" opacity="0.9" />
      </svg>
    );
  }
  // willow
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10 C50 35 30 60 20 90" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 10 C50 35 70 60 80 90" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="45" r="4" fill="#34d399" />
      <circle cx="72" cy="45" r="4" fill="#34d399" />
      <circle cx="22" cy="65" r="4" fill="#059669" />
      <circle cx="78" cy="65" r="4" fill="#059669" />
    </svg>
  );
}

// Background Theme mappings matching Screen 5
const backgroundThemesList = [
  { name: "Soft Blush", css: "bg-pink-100/90 dark:bg-pink-950/20" },
  { name: "Midnight Garden", css: "bg-slate-900/90 dark:bg-slate-950/40 border-slate-800 text-slate-100", animated: true },
  { name: "Golden Hour", css: "bg-amber-100/90 dark:bg-amber-950/20", animated: true },
  { name: "Lavender Dream", css: "bg-purple-100/90 dark:bg-purple-950/20" },
  { name: "Spring Meadow", css: "bg-emerald-100/90 dark:bg-emerald-950/20", animated: true },
  { name: "Starlit Night", css: "bg-indigo-950/90 text-indigo-100", animated: true },
  { name: "Rose Mist", css: "bg-rose-100/90 dark:bg-rose-950/20", animated: true },
  { name: "Ocean Breeze", css: "bg-cyan-100/90 dark:bg-cyan-950/20", animated: true },
  { name: "Sunset Glow", css: "bg-orange-100/90 dark:bg-orange-950/20" },
  { name: "Cherry Blossom", css: "bg-rose-200/90 dark:bg-rose-900/20", animated: true }
];

// Card Styles mappings matching Screen 3
const cardStylesList = [
  { name: "Classic Cream", css: "bg-amber-50/80 border-rose-300 text-rose-800 font-serif" },
  { name: "Torn Vintage", css: "bg-[#fcf8f2] border-yellow-800/20 text-yellow-900 font-serif" },
  { name: "Burnt Edge", css: "bg-amber-100/80 border-amber-900/30 text-amber-950 font-serif shadow-md" },
  { name: "Rose Gold", css: "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-400/40 text-rose-900 font-sans" },
  { name: "Watercolor Wash", css: "bg-blue-50/80 border-blue-200 text-blue-800 font-sans" },
  { name: "Midnight", css: "bg-slate-950 border-slate-800 text-indigo-200 font-sans shadow-lg" },
  { name: "Kraft Card", css: "bg-[#ebd3a9]/70 border-[#bfa275] text-[#5c4015] font-serif" },
  { name: "Garden Party", css: "bg-emerald-50/80 border-emerald-200 text-emerald-900 font-serif" }
];

export default function BouquetPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [flowers, setFlowers] = useState<any[]>([]);
  const [bouquetsList, setBouquetsList] = useState<any[]>([]);
  const [activeBouquet, setActiveBouquet] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Multi-step builder state (Steps: 1 | 2 | 3 | 4 | 5)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedFlowers, setSelectedFlowers] = useState<any[]>([]);
  const [selectedGreenery, setSelectedGreenery] = useState<string>("Leafy");
  const [selectedCardStyle, setSelectedCardStyle] = useState<string>("Classic Cream");
  const [backgroundTheme, setBackgroundTheme] = useState<string>("Soft Blush");

  // Card Message Fields
  const [recipientName, setRecipientName] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [submittingBouquet, setSubmittingBouquet] = useState(false);

  // Reveal screen state
  const [bloomIndex, setBloomIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [savingMoment, setSavingMoment] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch initial details
  const fetchData = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data: fData } = await supabase.from("flowers").select("*");
      setFlowers(fData || []);

      const { data: bData, error: bErr } = await supabase
        .from("bouquets")
        .select("*")
        .eq("pair_id", pair.id)
        .order("sent_at", { ascending: false });

      if (bErr) throw bErr;
      setBouquetsList(bData || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load lobby details.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchData();

      // Realtime subscription for list updates
      const listChan = supabase
        .channel(`bouquets-list-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bouquets", filter: `pair_id=eq.${pair.id}` },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(listChan);
      };
    }
  }, [loading, pair]);

  // Handle Flower Selection Toggles
  const handleSelectFlower = (flower: any) => {
    if (selectedFlowers.find(f => f.id === flower.id)) {
      setSelectedFlowers(selectedFlowers.filter(f => f.id !== flower.id));
    } else {
      if (selectedFlowers.length >= 5) {
        alert("A bouquet can hold a maximum of 5 flowers!");
        return;
      }
      setSelectedFlowers([...selectedFlowers, flower]);
    }
  };

  // Open / Reveal Bouquet screen
  const handleOpenBouquet = async (bouquet: any) => {
    setActiveBouquet(bouquet);
    setBloomIndex(0);
    setMessageVisible(false);
    setTypedMessage("");
    setCardExpanded(false);

    // Stagger flower bloom delay
    const flowerIds = bouquet.flower_ids || [];
    for (let i = 0; i <= flowerIds.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setBloomIndex(i + 1);
    }

    // Reveal Card
    setMessageVisible(true);
    const msg = bouquet.message;
    for (let i = 0; i <= msg.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 25));
      setTypedMessage(msg.slice(0, i));
    }

    // Mark as read
    if (!bouquet.is_opened && user?.id !== bouquet.sender_id) {
      try {
        await supabase
          .from("bouquets")
          .update({ is_opened: true, opened_at: new Date().toISOString() })
          .eq("id", bouquet.id);
      } catch (err) {}
    }
  };

  // Send Digital Bouquet
  const handleSendBouquet = async () => {
    if (!pair || !user || submittingBouquet) return;
    if (selectedFlowers.length < 3) {
      alert("Please select at least 3 flowers to assemble your bouquet!");
      return;
    }
    if (!cardMessage.trim()) {
      alert("Please write a message to your partner!");
      return;
    }

    setSubmittingBouquet(true);
    setError(null);

    const fIds = selectedFlowers.map(f => f.id);

    try {
      const { error: err } = await supabase
        .from("bouquets")
        .insert({
          pair_id: pair.id,
          sender_id: user.id,
          flower_ids: fIds,
          greenery_type: selectedGreenery,
          card_style: selectedCardStyle,
          background_theme: backgroundTheme,
          message: cardMessage.trim(),
          recipient_name: recipientName.trim() || "You",
          sender_name: senderName.trim() || "Me"
        });

      if (err) throw err;

      // Reset form variables
      setSelectedFlowers([]);
      setSelectedGreenery("Leafy");
      setSelectedCardStyle("Classic Cream");
      setBackgroundTheme("Soft Blush");
      setRecipientName("");
      setCardMessage("");
      setSenderName("");
      setActiveStep(1);

      fetchData();
      alert("Digital Bouquet sent successfully to your partner! 💐");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to send bouquet.");
    } finally {
      setSubmittingBouquet(false);
    }
  };

  // Save Bouquet details to moments scrapbook
  const handleSaveToMoments = async () => {
    if (!activeBouquet || !pair || !user || savingMoment) return;
    setSavingMoment(true);

    try {
      const flowerNames = activeBouquet.flower_ids.map((fid: string) => {
        const match = flowers.find(f => f.id === fid);
        return match ? match.name : "";
      }).filter(Boolean).join(", ");

      const partnerName = partner?.display_name || "Partner";
      const isSentByMe = activeBouquet.sender_id === user.id;

      const { error: err } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          title: "Bouquet Received 💐",
          description: isSentByMe 
            ? `Sent a digital bouquet with ${activeBouquet.greenery_type} wrapping containing: ${flowerNames}. Message card to ${activeBouquet.recipient_name}: "${activeBouquet.message}"`
            : `Received a digital bouquet from ${partnerName} containing: ${flowerNames}. Message card to ${activeBouquet.recipient_name}: "${activeBouquet.message}"`,
          moment_date: format(new Date(), "yyyy-MM-dd"),
          photo_url: "canvas-default.png"
        });

      if (err) throw err;
      alert("Bouquet memory successfully logged inside your Scrapbook moments! 🎉");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to log moment.");
    } finally {
      setSavingMoment(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const partnerName = partner?.display_name || "Partner";

  // Active styles lookup
  const activeCardStyleObj = cardStylesList.find(c => c.name === selectedCardStyle) || cardStylesList[0];
  const activeBackgroundThemeObj = backgroundThemesList.find(t => t.name === backgroundTheme) || backgroundThemesList[0];

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-[#fff5f5] text-foreground transition-colors duration-300">
      <Navigation />

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* LOBBY / MULTI-STEP BUILDER */}
        {!activeBouquet && (
          <div className="space-y-8">
            
            {/* Steps Progress Indicator (Screens 2-5) */}
            {activeStep > 1 && (
              <div className="max-w-3xl mx-auto flex items-center justify-between border-b border-border/40 pb-4">
                {[
                  { num: 1, label: "Flowers" },
                  { num: 2, label: "Greenery" },
                  { num: 3, label: "Card" },
                  { num: 4, label: "Message" },
                  { num: 5, label: "Theme" }
                ].map((step) => (
                  <div key={step.num} className="flex flex-col items-center space-y-1">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                      activeStep === step.num 
                        ? "bg-[#db2777] text-white ring-4 ring-pink-100" 
                        : (activeStep > step.num ? "bg-emerald-500 text-white" : "bg-white text-muted-foreground border border-border")
                    }`}>
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1: PICK YOUR FLOWERS */}
            {activeStep === 1 && (
              <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h1 className="text-4xl font-serif text-[#db2777] font-black italic">Pick Your Flowers</h1>
                  <p className="text-sm text-stone-500 font-mono">Select the flowers for your bouquet (pick at least 3)</p>
                  <p className="text-[10px] text-stone-400 max-w-xl mx-auto leading-relaxed mt-2">
                    Flower, petal, greenery, and bouquet arrangement visuals on DigiBouquet are provided for use within DigiBouquet only. See the <span className="underline cursor-pointer">Terms of Service</span> or email <span className="underline cursor-pointer">support@digibouquet.net</span>.
                  </p>
                </div>

                {/* Flowers Grid (8 flowers) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
                  {flowers.map((flower) => {
                    const isSelected = selectedFlowers.find(f => f.id === flower.id);
                    return (
                      <div
                        key={flower.id}
                        onClick={() => handleSelectFlower(flower)}
                        className={`rounded-2xl bg-white p-5 text-center cursor-pointer transition-all border hover:scale-[1.02] flex flex-col items-center justify-between ${
                          isSelected
                            ? "border-pink-500 shadow-lg shadow-pink-100"
                            : "border-border/60 shadow-sm"
                        }`}
                      >
                        <FlowerSVG name={flower.name} className="w-24 h-24" />
                        <div className="mt-4">
                          <p className="text-sm font-sans font-bold text-[#1e293b]">{flower.name}</p>
                          <p className="text-[10px] text-stone-400 italic mt-0.5">"{flower.meaning}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next Trigger */}
                <div className="pt-6">
                  <button
                    onClick={() => setActiveStep(2)}
                    disabled={selectedFlowers.length < 3}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 disabled:opacity-40 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md shadow-pink-100"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE YOUR GREENERY */}
            {activeStep === 2 && (
              <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-4xl font-serif text-[#db2777] font-black italic">Choose Your Greenery</h1>
                  <p className="text-sm text-stone-500 font-mono">Pick a greenery style to wrap your bouquet</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
                  {["Leafy", "Fern", "Eucalyptus", "Willow"].map((greenery) => {
                    const isSelected = selectedGreenery === greenery;
                    return (
                      <div
                        key={greenery}
                        onClick={() => setSelectedGreenery(greenery)}
                        className={`rounded-2xl bg-white p-5 text-center cursor-pointer transition-all border hover:scale-[1.02] flex flex-col items-center justify-between ${
                          isSelected
                            ? "border-pink-500 shadow-lg shadow-pink-100"
                            : "border-border/60 shadow-sm"
                        }`}
                      >
                        <GreenerySVG name={greenery} className="w-24 h-24" />
                        <p className="text-sm font-sans font-bold text-[#1e293b] mt-4">{greenery}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-stone-600 bg-white border border-border hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHOOSE YOUR CARD */}
            {activeStep === 3 && (
              <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-4xl font-serif text-[#db2777] font-black italic">Choose Your Card</h1>
                  <p className="text-sm text-stone-500 font-mono">Pick a card style for your personal message</p>
                </div>

                {/* Card Styles grid (8 template options) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {cardStylesList.map((style) => {
                    const isSelected = selectedCardStyle === style.name;
                    return (
                      <div
                        key={style.name}
                        onClick={() => setSelectedCardStyle(style.name)}
                        className={`rounded-2xl p-4 text-center cursor-pointer transition-all border hover:scale-[1.02] flex flex-col items-center justify-between h-40 ${
                          isSelected
                            ? "border-pink-500 bg-white shadow-lg shadow-pink-100 scale-105"
                            : "border-border/60 bg-white/75"
                        }`}
                      >
                        {/* Miniature layout preview */}
                        <div className={`w-full flex-1 rounded-lg border p-3 flex flex-col justify-between text-left text-[8px] leading-tight select-none ${style.css}`}>
                          <p className="font-bold">To: You</p>
                          <p className="truncate">Your message...</p>
                          <p className="text-right">With love</p>
                        </div>
                        <p className="text-xs font-bold text-[#1e293b] mt-3">{style.name}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-stone-600 bg-white border border-border hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setActiveStep(4)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: WRITE YOUR CARD */}
            {activeStep === 4 && (
              <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-4xl font-serif text-[#db2777] font-black italic">Write Your Card</h1>
                  <p className="text-sm text-stone-500 font-mono">Add a personal message to your bouquet</p>
                </div>

                {/* Left Live Card Preview vs Right Inputs grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-3xl mx-auto">
                  
                  {/* Left: Live Preview */}
                  <div className={`aspect-[4/3] w-full rounded-2xl border p-8 text-left flex flex-col justify-between shadow-lg relative ${activeCardStyleObj.css}`}>
                    
                    {/* Pink corners for card preview border */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-pink-500" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-pink-500" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-pink-500" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-pink-500" />

                    <div className="space-y-4">
                      <p className="text-base font-bold italic font-serif text-[#db2777]">To: {recipientName || "..."}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {cardMessage || "Your message here..."}
                      </p>
                    </div>

                    <p className="text-right text-xs font-bold italic font-serif text-[#db2777] mt-6">
                      With love, {senderName || "..."}
                    </p>
                  </div>

                  {/* Right: Form Inputs */}
                  <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 font-mono">Recipient's Name</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Who is this for?"
                        className="block w-full px-4 py-3 border border-border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-stone-500 font-mono">Your Message</label>
                        <span className="text-[10px] font-mono text-stone-400">{cardMessage.length}/200</span>
                      </div>
                      <textarea
                        maxLength={200}
                        value={cardMessage}
                        onChange={(e) => setCardMessage(e.target.value)}
                        placeholder="Write something sweet..."
                        className="block w-full h-32 px-4 py-3 border border-border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 font-mono">Your Name</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="From..."
                        className="block w-full px-4 py-3 border border-border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-stone-600 bg-white border border-border hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setActiveStep(5)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SET THE MOOD */}
            {activeStep === 5 && (
              <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h1 className="text-4xl font-serif text-[#db2777] font-black italic">Set the Mood</h1>
                  <p className="text-sm text-stone-500 font-mono">Choose a background theme for your bouquet</p>
                </div>

                {/* Themes List (10 choices) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-4xl mx-auto">
                  {backgroundThemesList.map((theme) => {
                    const isSelected = backgroundTheme === theme.name;
                    return (
                      <div
                        key={theme.name}
                        onClick={() => setBackgroundTheme(theme.name)}
                        className={`rounded-2xl p-4 text-center cursor-pointer transition-all border hover:scale-102 flex flex-col items-center justify-between h-36 ${
                          isSelected
                            ? "border-pink-500 bg-white shadow-lg shadow-pink-100 scale-105"
                            : "border-border/60 bg-white/75"
                        }`}
                      >
                        {/* Theme tint box */}
                        <div className={`w-full flex-1 rounded-xl shadow-inner border border-border/40 ${theme.css}`} />
                        <div className="mt-3">
                          <p className="text-xs font-bold text-[#1e293b]">{theme.name}</p>
                          {theme.animated && (
                            <span className="text-[8px] font-bold font-mono text-pink-500 bg-pink-50 px-1 rounded">
                              Animated
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-stone-600 bg-white border border-border hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSendBouquet}
                    disabled={submittingBouquet}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md shadow-pink-100"
                  >
                    {submittingBouquet ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Bouquet 💐"}
                  </button>
                </div>
              </div>
            )}

            {/* Bouquet logs history list below the builder */}
            {activeStep === 1 && (
              <div className="max-w-2xl mx-auto space-y-4 pt-8 border-t border-border/40">
                <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#db2777]" />
                  <span>Bouquet Delivery Log</span>
                </h2>

                {bouquetsList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-stone-400 text-xs leading-relaxed">
                    No bouquets sent or received yet. Choose flowers above to surprise your partner!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bouquetsList.map((b) => {
                      const isSentByMe = b.sender_id === user?.id;
                      const dateFormatted = format(parseISO(b.sent_at), "MMM d, h:mm a");

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleOpenBouquet(b)}
                          className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <span className={`p-3 rounded-xl border ${
                              isSentByMe 
                                ? "bg-stone-50 border-stone-200 text-stone-400" 
                                : "bg-pink-100/60 border-pink-200 text-pink-500"
                            }`}>
                              {isSentByMe ? <Mail className="w-4 h-4" /> : (b.is_opened ? <MailOpen className="w-4 h-4" /> : <Gift className="w-4 h-4 animate-bounce" />)}
                            </span>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1e293b] truncate">
                                {isSentByMe ? `To: ${b.recipient_name}` : `From: ${b.sender_name}`}
                              </p>
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                {dateFormatted}
                              </p>
                            </div>
                          </div>

                          {!isSentByMe && !b.is_opened && (
                            <span className="bg-[#db2777] text-white text-[8px] font-bold font-mono uppercase px-2 py-0.5 rounded animate-pulse">
                              Open
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* FULL SCREEN REVEAL / UNPACK EXPERIENCE */}
        {activeBouquet && (
          <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in">
            {/* Back indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <button
                onClick={() => {
                  setActiveBouquet(null);
                  fetchData();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-500 hover:text-foreground uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Bouquet Log</span>
              </button>
            </div>

            {/* The Animated Bouquet Presentation Canvas */}
            {(() => {
              const matchTheme = backgroundThemesList.find(t => t.name === activeBouquet.background_theme) || backgroundThemesList[0];
              const matchStyle = cardStylesList.find(c => c.name === activeBouquet.card_style) || cardStylesList[0];

              return (
                <div className={`rounded-3xl border border-border p-8 md:p-12 text-center shadow-xl space-y-12 relative overflow-hidden transition-all min-h-[80vh] flex flex-col justify-between items-center ${matchTheme.css}`}>
                  
                  {/* Floating sparkles background effect if animated */}
                  {matchTheme.animated && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 to-purple-500/5 animate-pulse pointer-events-none" />
                  )}

                  {/* Assembled Bouquet Illustration (Screen 6 replicate) */}
                  <div className="relative w-full max-w-[280px] mx-auto flex flex-col items-center">
                    
                    {/* 1. Greenery Wrapping Background */}
                    <div className="z-10 animate-fade-in">
                      <GreenerySVG name={activeBouquet.greenery_type} className="w-56 h-56" />
                    </div>

                    {/* 2. Selected Flowers Bloomed in-place */}
                    <div className="absolute top-10 inset-x-0 flex justify-center items-end -space-x-8 z-20">
                      {activeBouquet.flower_ids.map((flowerId: string, idx: number) => {
                        const matchFlower = flowers.find(f => f.id === flowerId);
                        if (!matchFlower) return null;

                        const isBloomed = bloomIndex > idx;
                        return (
                          <div
                            key={idx}
                            className={`transition-all duration-700 ease-out transform ${
                              isBloomed 
                                ? "opacity-100 scale-100 translate-y-0 rotate-0" 
                                : "opacity-0 scale-50 translate-y-12 rotate-12"
                            }`}
                            style={{ transitionDelay: `${idx * 150}ms` }}
                          >
                            <FlowerSVG name={matchFlower.name} className="w-20 h-20 filter drop-shadow-sm" />
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Card Section */}
                  {messageVisible && (
                    <div className="w-full max-w-sm mx-auto space-y-4 animate-fade-in z-30">
                      <div 
                        onClick={() => setCardExpanded(!cardExpanded)}
                        className={`w-full rounded-2xl border p-6 text-left shadow-md cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] relative ${matchStyle.css} ${
                          cardExpanded ? "max-h-full" : "max-h-32 overflow-hidden"
                        }`}
                      >
                        {/* Pink corners indicator */}
                        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#db2777]" />
                        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#db2777]" />
                        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#db2777]" />
                        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#db2777]" />

                        <div className="space-y-3">
                          <p className="text-xs font-bold italic text-[#db2777]">To: {activeBouquet.recipient_name}</p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif italic">
                            {typedMessage}
                          </p>
                        </div>
                        <p className="text-right text-[10px] font-bold italic text-[#db2777] mt-4">
                          With love, {activeBouquet.sender_name}
                        </p>
                      </div>

                      <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">
                        Tap card to expand
                      </p>

                      {/* Save as Memory Scrapbook moment */}
                      <div className="pt-4 flex justify-center">
                        <button
                          onClick={handleSaveToMoments}
                          disabled={savingMoment}
                          className="flex items-center space-x-1.5 py-2.5 px-5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#db2777] to-pink-500 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                        >
                          {savingMoment ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                          <span>Save to Moments Scrapbook</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

      </main>
    </div>
  );
}
