"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Heart, Check, X, Loader2, AlertCircle, 
  Send, ArrowLeft, Clock, MailOpen, Mail,
  BookOpen, Plus, Trash2, Smile, Gift, Lock, Search
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { LoveLetterEnvelope, WaxSealStamp } from "@/components/cozy-illustrations";

// Isolated Giphy Renderer component to resolve URLs on-the-fly at runtime
function GiphyRenderer({ giphyId }: { giphyId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch(`/api/giphy/resolve?id=${encodeURIComponent(giphyId)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load sticker");
        }
        setUrl(json.url || null);
      } catch (e) {
        console.error("Giphy resolve error:", e);
      } finally {
        setUrl(null);
        setLoading(false);
      }
    };
    fetchUrl();
  }, [giphyId]);

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-stone-50 rounded-xl">
        <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="text-[10px] text-stone-400 font-mono p-4 text-center">
        Sticker unavailable
      </div>
    );
  }

  return (
    <img src={url} alt="Cat sticker" className="rounded-xl max-h-48 object-contain w-full" />
  );
}

// Helper to synthesize typewriter click sounds using Web Audio API
const playTypewriterClick = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600 + Math.random() * 500, ctx.currentTime);

    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
};

// Custom typewriter effect component
function TypewriterText({ text, speed = 35, playSound = false, onComplete }: { text: string; speed?: number; playSound?: boolean; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);
  const textRef = useRef(text);
  
  useEffect(() => {
    setDisplayedText("");
    indexRef.current = 0;
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    let timer: any;
    const type = () => {
      if (indexRef.current < textRef.current.length) {
        const nextChar = textRef.current[indexRef.current];
        setDisplayedText(prev => prev + nextChar);
        indexRef.current += 1;
        
        if (playSound && nextChar !== " " && nextChar !== "\n") {
          playTypewriterClick();
        }
        timer = setTimeout(type, speed + Math.random() * 15);
      } else if (onComplete) {
        onComplete();
      }
    };
    timer = setTimeout(type, speed);
    return () => clearTimeout(timer);
  }, [text, speed, playSound, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
}

export default function LoveLetterPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [lettersList, setLettersList] = useState<any[]>([]);
  const [activeLetter, setActiveLetter] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Composing Mode States
  const [isWriting, setIsWriting] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [contentBlocks, setContentBlocks] = useState<any[]>([{ type: "text", value: "" }]);
  const [envelopeStyle, setEnvelopeStyle] = useState<string>("classic");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sendingLetter, setSendingLetter] = useState(false);

  // Giphy search state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [giphyStickers, setGiphyStickers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Reading States
  const [isUnsealed, setIsUnsealed] = useState(false);
  const [unsealAnimating, setUnsealAnimating] = useState(false);
  const [revealedBlocksCount, setRevealedBlocksCount] = useState(0);
  const [savingMoment, setSavingMoment] = useState(false);
  const [isTypewriterEnabled, setIsTypewriterEnabled] = useState(false);
  const [isTypewriterSoundEnabled, setIsTypewriterSoundEnabled] = useState(false);
  const [isCandlelightEnabled, setIsCandlelightEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Triggering hide navigation triggers dynamically
  useEffect(() => {
    if (isWriting || activeLetter !== null) {
      window.dispatchEvent(new CustomEvent("navigation-hide"));
    } else {
      window.dispatchEvent(new CustomEvent("navigation-show"));
    }
  }, [isWriting, activeLetter]);

  // Check URL parameters for write trigger
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("write") === "true") {
        setIsWriting(true);
        setActiveStep(1);
      }
    }
  }, []);

  // Envelope configurations
  const envelopeStyles: { [key: string]: { name: string; bg: string; border: string; text: string; seal: string } } = {
    classic: {
      name: "Classic Gold",
      bg: "bg-[#FAF6EE] dark:bg-[#28221D]",
      border: "border-[#EAE3D5] dark:border-[#3E352E]",
      text: "text-[#2E2A25] dark:text-[#E8E2D5]",
      seal: "bg-amber-700 hover:bg-amber-800"
    },
    velvet: {
      name: "Velvet Romance",
      bg: "bg-rose-50/80 dark:bg-rose-950/20",
      border: "border-rose-200 dark:border-rose-900/30",
      text: "text-rose-900 dark:text-rose-200",
      seal: "bg-rose-700 hover:bg-rose-800"
    },
    midnight: {
      name: "Midnight Stars",
      bg: "bg-slate-900 dark:bg-[#151B26]",
      border: "border-slate-800 dark:border-slate-800",
      text: "text-slate-100 dark:text-slate-200",
      seal: "bg-indigo-700 hover:bg-indigo-800"
    },
    kraft: {
      name: "Kraft Vintage",
      bg: "bg-[#F3EDE2] dark:bg-amber-950/10",
      border: "border-[#D6CBB7] dark:border-amber-900/20",
      text: "text-amber-950 dark:text-amber-100",
      seal: "bg-[#802030] hover:bg-[#6E1B29]"
    }
  };

  const fetchData = async () => {
    if (!pair) return;
    try {
      const res = await fetch(`/api/love-letters?pairId=${pair.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load letters");
      setLettersList(data || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load letters.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchData();

      // Realtime subscription for letters list updates
      const listChan = supabase
        .channel(`letters-list-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "love_letters", filter: `pair_id=eq.${pair.id}` },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(listChan);
      };
    }
  }, [loading, pair]);

  // Load draft from localStorage
  useEffect(() => {
    if (pair) {
      const saved = localStorage.getItem(`pairfect-love-letter-draft-${pair.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.contentBlocks) setContentBlocks(parsed.contentBlocks);
          if (parsed.envelopeStyle) setEnvelopeStyle(parsed.envelopeStyle);
          if (parsed.recipientName) setRecipientName(parsed.recipientName);
          if (parsed.senderName) setSenderName(parsed.senderName);
        } catch (e) {
          console.error("Failed to load letter draft", e);
        }
      }
    }
  }, [pair]);

  // Auto-save draft
  useEffect(() => {
    if (pair && isWriting && activeStep === 1) {
      const hasContent = contentBlocks.some(b => b.type === "cat" || (b.type === "text" && b.value.trim() !== ""));
      if (hasContent || recipientName.trim() || senderName.trim()) {
        localStorage.setItem(`pairfect-love-letter-draft-${pair.id}`, JSON.stringify({
          contentBlocks,
          envelopeStyle,
          recipientName,
          senderName
        }));
      } else {
        localStorage.removeItem(`pairfect-love-letter-draft-${pair.id}`);
      }
    }
  }, [contentBlocks, envelopeStyle, recipientName, senderName, pair, activeStep, isWriting]);

  const performStickerSearch = async (query: string) => {
    setSearching(true);
    setError(null);
    try {
      const q = query.trim() ? `cat ${query}` : "cat happy";
      const res = await fetch(`/api/giphy/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to query stickers");
      setGiphyStickers(data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to query GIPHY sticker list.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (galleryOpen) {
      performStickerSearch(searchQuery);
    }
  }, [galleryOpen]);

  const handleUpdateBlockValue = (index: number, val: string) => {
    const updated = [...contentBlocks];
    updated[index].value = val;
    setContentBlocks(updated);
  };

  const handleAddTextBlock = () => {
    setContentBlocks([...contentBlocks, { type: "text", value: "" }]);
  };

  const handleRemoveBlock = (index: number) => {
    if (contentBlocks.length === 1 && contentBlocks[0].type === "text") {
      setContentBlocks([{ type: "text", value: "" }]);
      return;
    }
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const handleInsertCatBlock = (giphyId: string) => {
    setContentBlocks([...contentBlocks, { type: "cat", giphy_id: giphyId }]);
    setGalleryOpen(false);
    setSearchQuery("");
  };

  const handleSendLetter = async () => {
    if (!pair || !user || sendingLetter) return;
    const cleanBlocks = contentBlocks.filter(b => b.type === "cat" || b.value.trim() !== "");
    if (cleanBlocks.length === 0) {
      alert("Please write some content first!");
      return;
    }
    if (!recipientName.trim()) {
      alert("Please specify the recipient's name!");
      return;
    }

    setSendingLetter(true);
    try {
      const res = await fetch("/api/love-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId: pair.id,
          recipientName: recipientName.trim(),
          senderName: senderName.trim() || "Me",
          content: cleanBlocks,
          envelopeStyle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send letter");

      // Reset
      setContentBlocks([{ type: "text", value: "" }]);
      setEnvelopeStyle("classic");
      setRecipientName("");
      setSenderName("");
      setIsWriting(false);
      setActiveStep(1);

      fetchData();
      localStorage.removeItem(`pairfect-love-letter-draft-${pair.id}`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to send letter.");
    } finally {
      setSendingLetter(false);
    }
  };

  const handleUnsealLetter = async (letter: any) => {
    setActiveLetter(letter);
    setIsUnsealed(false);
    setRevealedBlocksCount(0);

    if (letter.is_opened) {
      setIsUnsealed(true);
      setRevealedBlocksCount(letter.content.length);
      return;
    }

    setUnsealAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setUnsealAnimating(false);
    setIsUnsealed(true);

    const blocksCount = letter.content?.length || 0;
    for (let i = 0; i <= blocksCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setRevealedBlocksCount(i + 1);
    }

    if (!letter.is_opened && user?.id !== letter.sender_id) {
      try {
        await supabase
          .from("love_letters")
          .update({ is_opened: true, opened_at: new Date().toISOString() })
          .eq("id", letter.id);
      } catch (err) {}
    }
  };

  const handleSaveToMoments = async () => {
    if (!activeLetter || !pair || !user || savingMoment) return;
    setSavingMoment(true);

    try {
      const partnerName = partner?.display_name || "Partner";
      const isSentByMe = activeLetter.sender_id === user.id;
      const firstTextBlock = activeLetter.content.find((b: any) => b.type === "text")?.value || "";
      const summaryText = firstTextBlock.slice(0, 100);

      const { error: err } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          title: "Love Letter 💌",
          description: isSentByMe
            ? `Sent a Love Letter to ${activeLetter.recipient_name}: "${summaryText}..."`
            : `Received a Love Letter from ${partnerName}: "${summaryText}..."`,
          moment_date: format(new Date(), "yyyy-MM-dd"),
          photo_url: "canvas-default.png"
        });

      if (err) throw err;
      alert("Saved successfully to Scrapbook moments!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to log moment.");
    } finally {
      setSavingMoment(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5]">
      {/* Hide navigation header component when composing or reading */}
      {!isWriting && !activeLetter && <Navigation />}

      <main className="max-w-3xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-start z-10 animate-fade-in select-none">
        
        {/* LOBBY LIST VIEW (Minimal Editorial letters list) */}
        {!activeLetter && !isWriting && (
          <div className="space-y-12">
            <div className="border-b border-[#EAE3D5] dark:border-[#3E352E] pb-6 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
                  Keepsakes Box
                </span>
                <h1 className="text-4xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] mt-1">
                  Letters Box
                </h1>
              </div>
              <button
                onClick={() => {
                  setIsWriting(true);
                  setActiveStep(1);
                }}
                className="btn-primary py-2.5 px-6 text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Write Letter
              </button>
            </div>

            {/* List entries */}
            {lettersList.length === 0 ? (
              <div className="text-center py-20 bg-[#FAF6EE] dark:bg-[#28221D] rounded-2xl border border-dashed border-[#EAE3D5] dark:border-[#3E352E] text-sm text-[#7C7267] italic">
                The letters box is empty. Write the first unsealed moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lettersList.map((l) => {
                  const isSentByMe = l.sender_id === user?.id;
                  const dateFormatted = format(parseISO(l.sent_at), "MMM d, yyyy");
                  const config = envelopeStyles[l.envelope_style] || envelopeStyles.classic;

                  return (
                    <div
                      key={l.id}
                      onClick={() => handleUnsealLetter(l)}
                      className="group rounded-2xl border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] p-6 cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between shadow-sm hover:shadow"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <span className={`p-3.5 rounded-xl border ${config.bg} ${config.border} ${config.text}`}>
                          {isSentByMe ? (
                            <Mail className="w-4 h-4 text-[#8A7B6E]" />
                          ) : (
                            <Gift className={`w-4 h-4 ${!l.is_opened ? "animate-pulse text-[#802030]" : "text-[#8A7B6E]"}`} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="font-heading italic text-base text-[#2E2A25] dark:text-[#E8E2D5] font-bold">
                            {isSentByMe ? `To: ${l.recipient_name}` : `From: ${l.sender_name}`}
                          </p>
                          <p className="text-[10px] font-mono text-[#8A7B6E] mt-0.5">
                            {dateFormatted}
                          </p>
                        </div>
                      </div>
                      {!isSentByMe && !l.is_opened && (
                        <span className="bg-[#802030] text-white text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                          Sealed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* WRITE MODE COMPOSER (Spacious paper writing room) */}
        {isWriting && (
          <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#3E352E] pb-4">
              <button
                onClick={() => {
                  setIsWriting(false);
                  setActiveStep(1);
                }}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#8A7B6E] hover:text-[#2E2A25] uppercase cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <span className="text-[10px] font-mono font-bold text-[#8A7B6E] uppercase">
                Step {activeStep} of 3
              </span>
            </div>

            {/* STEP 1: CONTENT BLOCKS */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="font-display italic text-3xl font-black text-[#2E2A25] dark:text-[#E8E2D5]">
                    Compose Letter
                  </h2>
                  <p className="text-xs text-[#8A7B6E] font-mono">Write down your feelings below.</p>
                </div>

                <div className="bg-[#FAF6EE] dark:bg-[#28221D] border border-[#EAE3D5] dark:border-[#3E352E] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                  {contentBlocks.map((block, idx) => (
                    <div key={idx} className="relative group border-l-2 border-[#802030] pl-4 space-y-2">
                      <button
                        onClick={() => handleRemoveBlock(idx)}
                        className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition-all"
                        title="Delete block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {block.type === "text" ? (
                        <textarea
                          value={block.value}
                          onChange={(e) => handleUpdateBlockValue(idx, e.target.value)}
                          placeholder="Write something sweet here..."
                          className="block w-full h-28 p-2 bg-transparent text-sm focus:outline-none font-quote italic placeholder-[#8A7B6E]/40"
                        />
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-[#EAE3D5] dark:border-[#3E352E] max-w-xs p-2 bg-[#FCFBF9] dark:bg-[#1C1713]">
                          <GiphyRenderer giphyId={block.giphy_id} />
                          <span className="text-[8px] font-mono uppercase bg-[#8A7B6E] text-white px-2 py-0.5 rounded-full mt-2 font-bold block text-center tracking-widest">
                            Embedded Giphy
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 justify-center border-t border-[#EAE3D5] dark:border-[#3E352E] pt-4">
                    <button
                      onClick={handleAddTextBlock}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#EAE3D5] dark:border-[#3E352E] rounded-xl text-xs font-bold text-[#7C7267] hover:bg-[#FCFBF9] dark:hover:bg-[#1C1713] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Text</span>
                    </button>
                    <button
                      onClick={() => setGalleryOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#EAE3D5] dark:border-[#3E352E] rounded-xl text-xs font-bold text-[#802030] hover:bg-rose-50 dark:hover:bg-rose-950/15 cursor-pointer"
                    >
                      <Smile className="w-3 h-3" />
                      <span>Sticker</span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setActiveStep(2)}
                    disabled={contentBlocks.every(b => b.type === "text" && !b.value.trim())}
                    className="btn-primary py-3 px-8 text-xs uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ENVELOPE THEME */}
            {activeStep === 2 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <h2 className="font-display italic text-3xl font-black text-[#2E2A25] dark:text-[#E8E2D5]">
                    Envelope Theme
                  </h2>
                  <p className="text-xs text-[#8A7B6E] font-mono">Select the packaging style.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(envelopeStyles).map(([key, style]) => {
                    const isSelected = envelopeStyle === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setEnvelopeStyle(key)}
                        className={`rounded-2xl p-4 cursor-pointer transition-all border flex flex-col justify-between h-40 ${
                          isSelected
                            ? "border-[#802030] bg-[#FAF6EE] dark:bg-[#28221D] scale-102 shadow-sm"
                            : "border-[#EAE3D5] dark:border-[#3E352E] bg-transparent opacity-80"
                        }`}
                      >
                        <div className={`w-full flex-1 rounded-lg border border-[#EAE3D5] dark:border-[#3E352E] flex items-center justify-center relative ${style.bg}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.seal} text-white shadow-sm`}>
                            <Lock className="w-3 h-3" />
                          </div>
                        </div>
                        <p className="text-xs font-bold text-[#2E2A25] dark:text-[#E8E2D5] mt-2.5">{style.name}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="btn-secondary py-2.5 px-6 text-xs uppercase font-bold tracking-widest cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="btn-primary py-2.5 px-6 text-xs uppercase font-bold tracking-widest cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DETAILS & DISPATCH */}
            {activeStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <h2 className="font-display italic text-3xl font-black text-[#2E2A25] dark:text-[#E8E2D5]">
                    Seal & Send
                  </h2>
                  <p className="text-xs text-[#8A7B6E] font-mono">Finalize envelope addresses.</p>
                </div>

                <div className="bg-[#FAF6EE] dark:bg-[#28221D] border border-[#EAE3D5] dark:border-[#3E352E] rounded-3xl p-6 space-y-4 text-left shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[#8A7B6E] uppercase">To field (Recipient)</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. My Love"
                      className="block w-full px-4 py-3 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FCFBF9] dark:bg-[#1C1713] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#802030]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[#8A7B6E] uppercase">From field (Sender)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Your Partner"
                      className="block w-full px-4 py-3 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FCFBF9] dark:bg-[#1C1713] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#802030]"
                    />
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="btn-secondary py-2.5 px-6 text-xs uppercase font-bold tracking-widest cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSendLetter}
                    disabled={sendingLetter || !recipientName.trim()}
                    className="btn-primary py-2.5 px-8 text-xs uppercase font-bold tracking-widest cursor-pointer"
                  >
                    {sendingLetter ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Letter 💌"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ENVELOPE UNSEALING & READING (Ceremonial Paper Sheet & settings) */}
        {activeLetter && (
          <div className="max-w-xl w-full mx-auto space-y-8 animate-fade-in pb-16">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#3E352E] pb-4">
              <button
                onClick={() => {
                  setActiveLetter(null);
                  fetchData();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#8A7B6E] hover:text-[#2E2A25] uppercase cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Inbox</span>
              </button>
            </div>

            {(() => {
              const config = envelopeStyles[activeLetter.envelope_style] || envelopeStyles.classic;

              return (
                <div className="space-y-8 relative">
                  
                  {/* CLOSED SEED VIEW */}
                  {!isUnsealed && (
                    <div className="w-full max-w-md mx-auto select-none">
                      <div className={`relative w-full h-80 rounded-2xl border shadow-md flex flex-col justify-between items-center p-8 ${config.bg} ${config.border} overflow-hidden`}>
                        
                        {/* Diagonal lines to outline envelope */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                          <svg viewBox="0 0 320 208" className="w-full h-full stroke-[#EAE3D5]/50 dark:stroke-[#3E352E]/50 fill-none stroke-1">
                            <path d="M 0,0 L 160,104 L 320,0" />
                            <path d="M 0,208 L 110,120" />
                            <path d="M 320,208 L 210,120" />
                          </svg>
                        </div>

                        <div className="text-center z-10 space-y-1">
                          <span className="text-[9px] font-mono text-[#8A7B6E] uppercase tracking-wider block">To:</span>
                          <span className="font-heading italic text-lg text-[#2E2A25] dark:text-[#E8E2D5] font-black">{activeLetter.recipient_name}</span>
                        </div>

                        {/* Seal interaction */}
                        <button
                          onClick={() => handleUnsealLetter(activeLetter)}
                          disabled={unsealAnimating}
                          className="relative w-20 h-20 flex items-center justify-center cursor-pointer z-10"
                        >
                          <div className={`transition-all duration-700 ${unsealAnimating ? "scale-110 rotate-45 opacity-0" : "hover:scale-105 active:scale-95 animate-pulse"}`}>
                            <WaxSealStamp className="w-16 h-16" />
                          </div>
                        </button>

                        <div className="text-center z-10 space-y-1">
                          <span className="text-[8px] font-mono text-[#8A7B6E] uppercase tracking-widest block">Press Wax Seal to Unseal</span>
                          <span className="text-xs font-bold text-[#2E2A25] dark:text-[#E8E2D5]">From: {activeLetter.sender_name}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UNROLLED LUXURY PAPER SHEET */}
                  {isUnsealed && (
                    <div className="space-y-6">
                      {/* Quiet settings bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3D5] dark:border-[#3E352E] pb-3 select-none text-[10px] font-mono uppercase tracking-widest text-[#8A7B6E]">
                        <span>Reading Settings</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isCandlelightEnabled}
                              onChange={(e) => setIsCandlelightEnabled(e.target.checked)}
                              className="rounded border-[#EAE3D5] text-[#802030] focus:ring-[#802030]"
                            />
                            <span>🕯️ Candle</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isTypewriterEnabled}
                              onChange={(e) => setIsTypewriterEnabled(e.target.checked)}
                              className="rounded border-[#EAE3D5] text-[#802030] focus:ring-[#802030]"
                            />
                            <span>⌨️ Typewriter</span>
                          </label>
                          {isTypewriterEnabled && (
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isTypewriterSoundEnabled}
                                onChange={(e) => setIsTypewriterSoundEnabled(e.target.checked)}
                                className="rounded border-[#EAE3D5] text-[#802030] focus:ring-[#802030]"
                              />
                              <span>🔊 Sound</span>
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Spacious Luxury stationary view */}
                      <div className={`relative rounded-2xl border p-10 md:p-16 space-y-8 text-left shadow-lg overflow-hidden min-h-[50vh] ${
                        isCandlelightEnabled
                          ? "border-[#3A2A1A] bg-gradient-to-br from-[#1E140C] via-[#2A1C10] to-[#160E08] text-amber-200 animate-candle-flicker"
                          : "border-[#EAE3D5] bg-[#FAF5EB] text-[#2E2A25]"
                      }`}>
                        
                        {/* Subtle floral svg or clean linen styling: Washi tape at top right */}
                        <div className="absolute top-4 right-4 washi-tape washi-tape-angle z-10" />

                        {/* Top addressed labels (Caveat cursive font) */}
                        <div className="flex justify-between items-center text-sm tracking-wide text-[#8A7B6E] select-none font-handwriting">
                          <span>To: {activeLetter.recipient_name}</span>
                          <span>{format(parseISO(activeLetter.sent_at), "MMMM d, yyyy")}</span>
                        </div>

                        {/* Blocks */}
                        <div className="space-y-6 py-4 flex-1">
                          {activeLetter.content.map((block: any, idx: number) => {
                            if (revealedBlocksCount <= idx) return null;

                            return (
                              <div key={idx} className="animate-fade-in">
                                {block.type === "text" ? (
                                  <p className={`text-base leading-relaxed whitespace-pre-wrap font-sans ${
                                    isCandlelightEnabled ? "text-amber-100/90" : "text-[#2E2A25]"
                                  } ${!isTypewriterEnabled ? "animate-ink-bleed" : ""}`}>
                                    {isTypewriterEnabled ? (
                                      <TypewriterText 
                                        text={block.value} 
                                        playSound={isTypewriterSoundEnabled} 
                                      />
                                    ) : (
                                      block.value
                                    )}
                                  </p>
                                ) : (
                                  <div className="rounded-xl overflow-hidden border border-[#EAE3D5] dark:border-[#3E352E] max-w-sm my-4 p-2 bg-[#FCFBF9] dark:bg-[#1C1713]">
                                    <GiphyRenderer giphyId={block.giphy_id} />
                                    <span className="text-[8px] font-mono uppercase bg-[#8A7B6E] text-white px-2 py-0.5 rounded-full mt-2 font-bold tracking-widest block text-center">
                                      Embedded Sticker
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Signature (Caveat handwriting font) */}
                        {revealedBlocksCount > activeLetter.content.length && (
                          <div className="border-t border-[#EAE3D5]/40 pt-6 space-y-6 animate-fade-in">
                            <p className="text-right text-lg font-handwriting text-[#2E2A25] dark:text-[#E8E2D5]">
                              With love, {activeLetter.sender_name}
                            </p>
                            
                            <div className="flex justify-center pt-2">
                              <button
                                onClick={handleSaveToMoments}
                                disabled={savingMoment}
                                className="flex items-center gap-1.5 py-2.5 px-6 rounded-full text-xs font-bold text-white bg-[#802030] hover:bg-[#6E1B29] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                              >
                                {savingMoment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                                <span>Save to Moments Scrapbook</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* GIPHY SEARCH DIALOG TRAY */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#FCFBF9] dark:bg-[#1C1713] rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#EAE3D5] dark:border-[#3E352E] overflow-hidden">
            <div className="p-5 border-b border-[#EAE3D5] dark:border-[#3E352E] flex justify-between items-center bg-[#FAF6EE] dark:bg-[#28221D]">
              <div>
                <h3 className="text-sm font-bold text-[#2E2A25] dark:text-[#E8E2D5]">Embed Sticker</h3>
                <p className="text-[8px] text-[#8A7B6E] font-mono uppercase mt-0.5">Powered by GIPHY</p>
              </div>
              <button
                onClick={() => {
                  setGalleryOpen(false);
                  setSearchQuery("");
                }}
                className="p-1.5 rounded-lg text-[#8A7B6E] hover:bg-[#FAF6EE] dark:hover:bg-[#1C1713] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#EAE3D5] dark:border-[#3E352E] bg-[#FCFBF9] dark:bg-[#1C1713]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    performStickerSearch(e.target.value);
                  }}
                  placeholder="Search stickers (happy, sad, love...)"
                  className="block w-full pl-8 pr-4 py-2 border border-[#EAE3D5] dark:border-[#3E352E] rounded-xl bg-[#FAF6EE] dark:bg-[#28221D] text-xs focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8A7B6E]" />
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-[#FAF6EE]/30">
              {error ? (
                <div className="text-center py-8 text-xs text-red-600">{error}</div>
              ) : searching ? (
                <div className="text-center py-12">
                  <Loader2 className="w-5 h-5 text-[#802030] animate-spin mx-auto" />
                  <p className="text-[10px] text-[#8A7B6E] mt-2 font-mono">Querying stickers...</p>
                </div>
              ) : giphyStickers.length === 0 ? (
                <div className="text-center py-12 text-[#8A7B6E] text-xs">No stickers found.</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {giphyStickers.map((sticker: any) => (
                    <div
                      key={sticker.id}
                      onClick={() => handleInsertCatBlock(sticker.id)}
                      className="rounded-xl border border-[#EAE3D5] dark:border-[#3E352E] bg-white dark:bg-[#28221D] p-1.5 cursor-pointer hover:scale-102 transition-all flex items-center justify-center h-20"
                    >
                      <img
                        src={sticker.images?.fixed_height_small?.url || sticker.images?.fixed_height?.url}
                        alt="Sticker item"
                        className="max-h-16 object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#EAE3D5] dark:border-[#3E352E] text-center bg-[#FAF6EE] dark:bg-[#28221D]">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#8A7B6E] font-bold">
                GIPHY STICKERS INC
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
