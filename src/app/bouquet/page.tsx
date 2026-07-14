"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Heart, Check, X, Loader2, AlertCircle, 
  Trophy, Sparkles, Send, ArrowLeft, RefreshCw,
  Gift, Eye, BookOpen, Clock, MailOpen, Mail, Plus
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Flower SVG Renderer helper to guarantee beautiful graphics load offline
function FlowerIcon({ name, className = "w-12 h-12" }: { name: string; className?: string }) {
  const clean = name.toLowerCase().replace(/\s+/g, "");
  
  if (clean === "redrose" || clean === "rose") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" fill="url(#roseGrad)" />
        <path d="M50 20 C35 30 35 70 50 80 C65 70 65 30 50 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M35 35 C45 45 55 45 65 35" stroke="white" strokeWidth="2" />
        <path d="M50 80 L50 95" stroke="#10b981" strokeWidth="4" />
        <path d="M50 85 C38 85 38 75 50 75" fill="#10b981" />
        <defs>
          <linearGradient id="roseGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "whitelily" || clean === "lily") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 20 L65 45 L90 50 L65 55 L50 80 L35 55 L10 50 L35 45 Z" fill="url(#lilyGrad)" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx="50" cy="50" r="8" fill="#f59e0b" />
        <line x1="50" y1="50" x2="50" y2="30" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="50" y1="50" x2="65" y2="35" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="50" y1="50" x2="35" y2="35" stroke="#f59e0b" strokeWidth="1.5" />
        <defs>
          <linearGradient id="lilyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "pinkpeony" || clean === "peony") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="28" fill="url(#peonyGrad)" />
        <circle cx="50" cy="55" r="20" fill="#f472b6" opacity="0.8" />
        <circle cx="50" cy="50" r="14" fill="#f472b6" />
        <circle cx="50" cy="50" r="6" fill="#fb7185" />
        <defs>
          <linearGradient id="peonyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "purpletulip" || clean === "tulip") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35 30 C30 50 35 75 50 80 C65 75 70 50 65 30 C55 35 45 35 35 30 Z" fill="url(#tulipGrad)" />
        <path d="M50 35 C42 55 45 75 50 80 C55 75 58 55 50 35 Z" fill="#c084fc" opacity="0.9" />
        <line x1="50" y1="80" x2="50" y2="95" stroke="#10b981" strokeWidth="3" />
        <defs>
          <linearGradient id="tulipGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "sunflower") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="32" fill="#fbbf24" />
        <path d="M50 10 L54 30 L50 40 L46 30 Z" fill="#f59e0b" />
        <path d="M50 90 L54 70 L50 60 L46 70 Z" fill="#f59e0b" />
        <path d="M10 50 L30 54 L40 50 L30 46 Z" fill="#f59e0b" />
        <path d="M90 50 L70 54 L60 50 L70 46 Z" fill="#f59e0b" />
        <circle cx="50" cy="50" r="18" fill="#78350f" />
        <circle cx="50" cy="50" r="14" fill="#451a03" />
        <defs>
          <linearGradient id="sunflowerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "bluehydrangea" || clean === "hydrangea") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="26" fill="url(#hydrangeaGrad)" />
        <circle cx="38" cy="38" r="10" fill="#60a5fa" opacity="0.9" />
        <circle cx="62" cy="38" r="10" fill="#60a5fa" opacity="0.9" />
        <circle cx="38" cy="62" r="10" fill="#60a5fa" opacity="0.9" />
        <circle cx="62" cy="62" r="10" fill="#60a5fa" opacity="0.9" />
        <circle cx="50" cy="34" r="8" fill="#3b82f6" />
        <circle cx="50" cy="66" r="8" fill="#3b82f6" />
        <defs>
          <linearGradient id="hydrangeaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (clean === "pinkcarnation" || clean === "carnation") {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="28" fill="url(#carnationGrad)" />
        <path d="M50 22 L54 36 L66 30 L60 44 L74 44 L66 54 L78 62 L64 66 L68 80 L56 72 L50 84 L44 72 L32 80 L36 66 L22 62 L34 54 L26 44 L40 44 L34 30 L46 36 Z" fill="#fda4af" opacity="0.6" />
        <circle cx="50" cy="50" r="12" fill="#ec4899" />
        <defs>
          <linearGradient id="carnationGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 L62 40 L88 40 L67 56 L76 82 L50 66 L24 82 L33 56 L12 40 L38 40 Z" fill="url(#orchidGrad)" />
      <circle cx="50" cy="50" r="6" fill="#ec4899" />
      <defs>
        <linearGradient id="orchidGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function BouquetPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [flowers, setFlowers] = useState<any[]>([]);
  const [cardStyles, setCardStyles] = useState<any[]>([]);
  const [bouquetsList, setBouquetsList] = useState<any[]>([]);
  const [activeBouquet, setActiveBouquet] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Form states
  const [selectedFlowers, setSelectedFlowers] = useState<any[]>([]);
  const [selectedCardStyle, setSelectedCardStyle] = useState<any>(null);
  const [cardMessage, setCardMessage] = useState("");
  const [submittingBouquet, setSubmittingBouquet] = useState(false);

  // Reveal screen state
  const [bloomIndex, setBloomIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [savingMoment, setSavingMoment] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // 1. Fetch flowers, card styles, and bouquets list
  const fetchData = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data: fData } = await supabase.from("flowers").select("*");
      setFlowers(fData || []);

      const { data: cData } = await supabase.from("card_styles").select("*");
      setCardStyles(cData || []);
      if (cData && cData.length > 0) {
        setSelectedCardStyle(cData[0]);
      }

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

      // Realtime subscription for bouquets list updates
      const bouquetChan = supabase
        .channel(`bouquets-list-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bouquets", filter: `pair_id=eq.${pair.id}` },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bouquetChan);
      };
    }
  }, [loading, pair]);

  // 2. Open / Reveal Bouquet screen logic
  const handleOpenBouquet = async (bouquet: any) => {
    setActiveBouquet(bouquet);
    setBloomIndex(0);
    setMessageVisible(false);
    setTypedMessage("");

    // Stagger flower blooming delay
    const flowerIds = bouquet.flower_ids || [];
    for (let i = 0; i <= flowerIds.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setBloomIndex(i + 1);
    }

    // Typewriter effect message
    setMessageVisible(true);
    const msg = bouquet.message;
    for (let i = 0; i <= msg.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 25));
      setTypedMessage(msg.slice(0, i));
    }

    // Mark as opened in DB in background if not already
    if (!bouquet.is_opened && user?.id !== bouquet.sender_id) {
      try {
        await supabase
          .from("bouquets")
          .update({ is_opened: true, opened_at: new Date().toISOString() })
          .eq("id", bouquet.id);
      } catch (err) {}
    }
  };

  // 3. Flower Selection Toggles
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

  // 4. Send Digital Bouquet
  const handleSendBouquet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !user || submittingBouquet) return;
    if (selectedFlowers.length < 3) {
      setError("Please select at least 3 flowers to assemble your bouquet!");
      return;
    }
    if (!cardMessage.trim()) {
      setError("Please add a private message to the bouquet card!");
      return;
    }

    setSubmittingBouquet(true);
    setError(null);

    const fIds = selectedFlowers.map(f => f.id);

    try {
      const { data, error: err } = await supabase
        .from("bouquets")
        .insert({
          pair_id: pair.id,
          sender_id: user.id,
          flower_ids: fIds,
          card_style_id: selectedCardStyle.id,
          message: cardMessage.trim()
        })
        .select()
        .single();

      if (err) throw err;

      setSelectedFlowers([]);
      setCardMessage("");
      fetchData();
      alert("Digital Bouquet sent successfully to your partner! 💐");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to send bouquet.");
    } finally {
      setSubmittingBouquet(false);
    }
  };

  // 5. Save Bouquet to Moments scrapbook
  const handleSaveToMoments = async () => {
    if (!activeBouquet || !pair || !user || savingMoment) return;
    setSavingMoment(true);

    try {
      // Gather flower names
      const flowerNames = activeBouquet.flower_ids.map((fid: string) => {
        const match = flowers.find(f => f.id === fid);
        return match ? match.name : "";
      }).filter(Boolean).join(", ");

      const partnerName = partner?.display_name || "Partner";
      const isSentByMe = activeBouquet.sender_id === user.id;

      // Log shared memory to database
      const { error: err } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          title: "Bouquet Received 💐",
          description: isSentByMe 
            ? `Sent a digital bouquet to ${partnerName} containing: ${flowerNames}. Message: "${activeBouquet.message}"`
            : `Received a digital bouquet from ${partnerName} containing: ${flowerNames}. Message: "${activeBouquet.message}"`,
          moment_date: format(new Date(), "yyyy-MM-dd"),
          photo_url: "canvas-default.png" // placeholder/doodle defaults
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

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground transition-colors duration-300">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background: "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* LOBBY / BOQUET SENDER & LOGS */}
        {!activeBouquet && (
          <div className="space-y-8">
            {/* Header titles */}
            <div className="border-b border-border/40 pb-6 space-y-2">
              <h1 className="text-3xl font-sans font-black tracking-tight text-foreground flex items-center space-x-2.5">
                <Gift className="w-7 h-7 text-primary" />
                <span>Digital Bouquet</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Send a custom digital bouquet to your partner complete with card stylings and flower symbolisms. An elegant apology, appreciation, or just-because gesture.
              </p>
            </div>

            {/* Main interface grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Bouquet Builder Form (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
                  <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-border/40 pb-3">
                    <Plus className="w-4 h-4 text-primary" />
                    <span>Assemble a Digital Bouquet</span>
                  </h2>

                  <form onSubmit={handleSendBouquet} className="space-y-6">
                    
                    {/* Flower Picker */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-foreground">
                        Step 1: Select 3 to 5 Flowers
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {flowers.map((flower) => {
                          const isSelected = selectedFlowers.find(f => f.id === flower.id);
                          return (
                            <div
                              key={flower.id}
                              onClick={() => handleSelectFlower(flower)}
                              className={`rounded-xl border p-3 text-center cursor-pointer transition-all hover:scale-[1.02] flex flex-col items-center justify-between ${
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                  : "border-border bg-background"
                              }`}
                            >
                              <FlowerIcon name={flower.icon_name} className="w-16 h-16 animate-fade-in" />
                              <div className="mt-2.5">
                                <p className="text-xs font-bold text-foreground">{flower.name}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1 italic" title={flower.meaning}>
                                  "{flower.meaning}"
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Styles selection */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-foreground">
                        Step 2: Choose Card Style
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {cardStyles.map((style) => {
                          const isSelected = selectedCardStyle?.id === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setSelectedCardStyle(style)}
                              className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {style.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message box */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-foreground">
                        Step 3: Write Personal Message
                      </p>
                      <textarea
                        required
                        value={cardMessage}
                        onChange={(e) => setCardMessage(e.target.value)}
                        placeholder="Write down your card message here..."
                        className="block w-full h-24 px-3.5 py-2.5 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground resize-none"
                      />
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingBouquet || selectedFlowers.length < 3}
                      className="w-full flex items-center justify-center space-x-1.5 py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-pink-500/5 dark:shadow-none"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Digital Bouquet 💐</span>
                    </button>

                  </form>
                </div>
              </div>

              {/* Right Column: Historic logs (1/3 width) */}
              <div className="space-y-4">
                <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Bouquet Delivery Log</span>
                </h2>

                {bouquetsList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground leading-relaxed">
                    No bouquets sent or received yet. Assemble one above to surprise your partner!
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {bouquetsList.map((b) => {
                      const isSentByMe = b.sender_id === user?.id;
                      const dateFormatted = format(parseISO(b.sent_at), "MMM d, h:mm a");

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleOpenBouquet(b)}
                          className="rounded-xl border border-border bg-card p-4 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className={`p-2.5 rounded-lg border ${
                              isSentByMe 
                                ? "bg-stone-50 border-stone-200 dark:bg-stone-900 dark:border-stone-800 text-stone-400" 
                                : "bg-pink-500/10 border-pink-500/20 text-[#f472b6]"
                            }`}>
                              {isSentByMe ? <Mail className="w-4 h-4" /> : (b.is_opened ? <MailOpen className="w-4 h-4" /> : <Gift className="w-4 h-4 animate-bounce" />)}
                            </span>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {isSentByMe ? `Bouquet to ${partnerName}` : `Bouquet from ${partnerName}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {dateFormatted}
                              </p>
                            </div>
                          </div>

                          {!isSentByMe && !b.is_opened && (
                            <span className="bg-pink-500 text-white text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* FULL SCREEN REVEAL / UNPACK EXPERIENCE */}
        {activeBouquet && (
          <div className="max-w-2xl w-full mx-auto space-y-6 animate-fade-in">
            {/* Exit header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <button
                onClick={() => {
                  setActiveBouquet(null);
                  fetchData();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Bouquet log</span>
              </button>
            </div>

            {/* The Animated Gift Box Card */}
            {(() => {
              // Match selected CSS theme properties
              const matchStyle = cardStyles.find(c => c.id === activeBouquet.card_style_id);
              let styleConfig = { border: "border-border", bg: "bg-card", font: "font-sans", text: "text-foreground" };
              if (matchStyle?.css_theme) {
                try {
                  styleConfig = typeof matchStyle.css_theme === "string" ? JSON.parse(matchStyle.css_theme) : matchStyle.css_theme;
                } catch (e) {}
              }

              return (
                <div className={`rounded-2xl border ${styleConfig.border} ${styleConfig.bg} p-8 text-center shadow-lg space-y-8 relative overflow-hidden`}>
                  
                  {/* Bouquet Bloom Area */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                      {activeBouquet.sender_id === user?.id ? `Bouquet sent to ${partnerName}` : `Bouquet from ${partnerName}`}
                    </p>
                    
                    {/* Bloom staggered rendering loop */}
                    <div className="flex justify-center items-end -space-x-8 min-h-[160px] py-4">
                      {activeBouquet.flower_ids.map((flowerId: string, idx: number) => {
                        const matchFlower = flowers.find(f => f.id === flowerId);
                        if (!matchFlower) return null;

                        const isBloomed = bloomIndex > idx;
                        return (
                          <div
                            key={idx}
                            className={`transition-all duration-700 ease-out transform ${
                              isBloomed 
                                ? "opacity-100 scale-100 translate-y-0" 
                                : "opacity-0 scale-50 translate-y-12"
                            }`}
                            style={{ transitionDelay: `${idx * 150}ms` }}
                          >
                            <div className="flex flex-col items-center">
                              <FlowerIcon name={matchFlower.icon_name} className="w-20 h-20 filter drop-shadow-md" />
                              <span className="text-[9px] font-mono bg-background px-1.5 py-0.5 rounded border border-border mt-1 shadow-sm font-bold text-foreground">
                                {matchFlower.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personal note card details */}
                  {messageVisible && (
                    <div className={`border-t border-border/50 pt-6 space-y-4 ${styleConfig.font} animate-fade-in`}>
                      <div className="max-w-md mx-auto bg-background/50 border border-border/80 rounded-xl p-5 shadow-sm text-left">
                        <p className={`text-sm ${styleConfig.text} leading-relaxed italic whitespace-pre-wrap font-medium font-serif`}>
                          "{typedMessage}"
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handleSaveToMoments}
                          disabled={savingMoment}
                          className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                        >
                          <BookOpen className="w-4 h-4" />
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
