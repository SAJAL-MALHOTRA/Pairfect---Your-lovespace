"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Heart, Check, X, Loader2, AlertCircle, 
  Sparkles, Send, ArrowLeft, Clock, MailOpen, Mail,
  BookOpen, Plus, Trash2, Smile, Gift, Lock
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function LoveLetterPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [catMedia, setCatMedia] = useState<any[]>([]);
  const [lettersList, setLettersList] = useState<any[]>([]);
  const [activeLetter, setActiveLetter] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Multi-step builder state (Steps: 1 | 2 | 3)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [contentBlocks, setContentBlocks] = useState<any[]>([{ type: "text", value: "" }]);
  const [envelopeStyle, setEnvelopeStyle] = useState<string>("classic");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sendingLetter, setSendingLetter] = useState(false);

  // Cat Gallery Modal selection
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<string>("all");

  // Reveal / Unseal screen state
  const [isUnsealed, setIsUnsealed] = useState(false);
  const [unsealAnimating, setUnsealAnimating] = useState(false);
  const [revealedBlocksCount, setRevealedBlocksCount] = useState(0);
  const [savingMoment, setSavingMoment] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Envelope styles configuration
  const envelopeStyles: { [key: string]: { name: string; bg: string; border: string; text: string; seal: string } } = {
    classic: {
      name: "Classic Gold",
      bg: "bg-[#fdfbf7] dark:bg-slate-900",
      border: "border-amber-400/40",
      text: "text-amber-900 dark:text-amber-200",
      seal: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
    },
    velvet: {
      name: "Velvet Romance",
      bg: "bg-rose-50 dark:bg-rose-950/20",
      border: "border-rose-300",
      text: "text-rose-800 dark:text-rose-300",
      seal: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
    },
    midnight: {
      name: "Midnight Stars",
      bg: "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950",
      border: "border-indigo-800/40",
      text: "text-indigo-200",
      seal: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
    },
    kraft: {
      name: "Kraft Heart",
      bg: "bg-[#f5e6d3] dark:bg-amber-950/10",
      border: "border-[#c4a482]",
      text: "text-amber-950 dark:text-amber-100",
      seal: "bg-[#b05a46] hover:bg-[#9d4d3b] shadow-amber-800/30"
    }
  };

  // 1. Fetch letters list & curated cat media
  const fetchData = async () => {
    if (!pair) return;
    setFetching(true);
    try {
      const { data: cData } = await supabase.from("cat_media").select("*");
      setCatMedia(cData || []);

      const { data: lData, error: lErr } = await supabase
        .from("love_letters")
        .select("*")
        .eq("pair_id", pair.id)
        .order("sent_at", { ascending: false });

      if (lErr) throw lErr;
      setLettersList(lData || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load letter details.");
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

  // 2. Block Editing Handlers
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

  const handleInsertCatBlock = (catUrl: string) => {
    setContentBlocks([...contentBlocks, { type: "cat", value: catUrl }]);
    setGalleryOpen(false);
  };

  // 3. Send Love Letter
  const handleSendLetter = async () => {
    if (!pair || !user || sendingLetter) return;
    
    // Filter empty text blocks
    const cleanBlocks = contentBlocks.filter(b => b.type === "cat" || b.value.trim() !== "");
    if (cleanBlocks.length === 0) {
      alert("Please write some content inside your letter first!");
      return;
    }
    if (!recipientName.trim()) {
      alert("Please write the recipient's name!");
      return;
    }

    setSendingLetter(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from("love_letters")
        .insert({
          pair_id: pair.id,
          sender_id: user.id,
          recipient_name: recipientName.trim(),
          sender_name: senderName.trim() || "Me",
          content: cleanBlocks,
          envelope_style: envelopeStyle
        });

      if (err) throw err;

      // Reset states
      setContentBlocks([{ type: "text", value: "" }]);
      setEnvelopeStyle("classic");
      setRecipientName("");
      setSenderName("");
      setActiveStep(1);

      fetchData();
      alert("Love Letter (Cat Edition) sent successfully! 💌🐾");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to send letter.");
    } finally {
      setSendingLetter(false);
    }
  };

  // 4. Open / Unseal animation pipeline
  const handleUnsealLetter = async (letter: any) => {
    setActiveLetter(letter);
    setIsUnsealed(false);
    setRevealedBlocksCount(0);

    // If already unsealed, skip unsealing slide transitions
    if (letter.is_opened) {
      setIsUnsealed(true);
      setRevealedBlocksCount(letter.content.length);
      return;
    }

    setUnsealAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setUnsealAnimating(false);
    setIsUnsealed(true);

    // Stagger block reveal fade-in animations
    const blocksCount = letter.content?.length || 0;
    for (let i = 0; i <= blocksCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setRevealedBlocksCount(i + 1);
    }

    // Set read status in DB in background
    if (!letter.is_opened && user?.id !== letter.sender_id) {
      try {
        await supabase
          .from("love_letters")
          .update({ is_opened: true, opened_at: new Date().toISOString() })
          .eq("id", letter.id);
      } catch (err) {}
    }
  };

  // 5. Save Letter to scrapbook moments
  const handleSaveToMoments = async () => {
    if (!activeLetter || !pair || !user || savingMoment) return;
    setSavingMoment(true);

    try {
      const partnerName = partner?.display_name || "Partner";
      const isSentByMe = activeLetter.sender_id === user.id;

      // Extract a small summary text
      const firstTextBlock = activeLetter.content.find((b: any) => b.type === "text")?.value || "";
      const summaryText = firstTextBlock.slice(0, 100);

      const { error: err } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          title: "Cat Love Letter 💌",
          description: isSentByMe
            ? `Sent a Cat Love Letter to ${activeLetter.recipient_name}: "${summaryText}..."`
            : `Received a Cat Love Letter from ${partnerName}: "${summaryText}..."`,
          moment_date: format(new Date(), "yyyy-MM-dd"),
          photo_url: "canvas-default.png"
        });

      if (err) throw err;
      alert("Letter memory successfully logged in your Scrapbook moments! 🎉");
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
  const activeStyleObj = envelopeStyles[envelopeStyle] || envelopeStyles.classic;

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-[#fffcf5] text-foreground transition-colors duration-300">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* LOBBY / MULTI-STEP LETTER BUILDER */}
        {!activeLetter && (
          <div className="space-y-8">
            
            {/* Header Title */}
            <div className="border-b border-border/40 pb-6 space-y-2">
              <h1 className="text-3xl font-sans font-black tracking-tight text-foreground flex items-center space-x-2.5">
                <Mail className="w-7 h-7 text-[#db2777]" />
                <span>Love Letters</span>
              </h1>
              <p className="text-sm text-stone-500 max-w-2xl leading-relaxed">
                Compose custom love letters interspersed with cute cat photos. Pick an envelope theme, seal it with virtual wax, and send it to your partner!
              </p>
            </div>

            {/* Builder Progression bar (shown in step 2 & 3) */}
            {activeStep > 1 && (
              <div className="max-w-md mx-auto flex items-center justify-between border-b border-border/40 pb-4">
                {[
                  { num: 1, label: "Write Letter" },
                  { num: 2, label: "Envelope Style" },
                  { num: 3, label: "Seal & Send" }
                ].map((step) => (
                  <div key={step.num} className="flex flex-col items-center space-y-1">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                      activeStep === step.num 
                        ? "bg-[#db2777] text-white ring-4 ring-pink-100" 
                        : (activeStep > step.num ? "bg-emerald-500 text-white" : "bg-white text-stone-400 border border-border")
                    }`}>
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-stone-500">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1: WRITE LETTER (BLOCKS EDITOR) */}
            {activeStep === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl font-serif text-[#db2777] font-black italic">Write Your Love Letter</h2>
                  <p className="text-xs text-stone-500 font-mono">Mix heartfelt text blocks with adorable cat stickers</p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-white p-6 md:p-8 shadow-sm space-y-6">
                  {contentBlocks.map((block, idx) => (
                    <div key={idx} className="relative group border-l-2 border-pink-500/20 pl-4 space-y-2 animate-fade-in">
                      
                      {/* Delete block trigger */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(idx)}
                        className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        title="Remove Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {block.type === "text" ? (
                        <textarea
                          value={block.value}
                          onChange={(e) => handleUpdateBlockValue(idx, e.target.value)}
                          placeholder="Type your message section here..."
                          className="block w-full h-24 px-3 py-2 border border-stone-100 focus:border-pink-500 rounded-xl bg-[#fafafa] text-sm text-foreground focus:outline-none resize-none font-serif italic"
                        />
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-border max-w-xs relative bg-[#fafafa] p-2 flex flex-col items-center">
                          <img
                            src={block.value}
                            alt="Sticker cat"
                            className="rounded-lg max-h-40 object-cover w-full shadow-inner"
                          />
                          <span className="text-[8px] font-mono uppercase bg-pink-500 text-white px-2 py-0.5 rounded-full mt-2 font-bold tracking-wider">
                            🐾 Embedded Cat Sticker
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add block choices */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-border/40 justify-center">
                    <button
                      type="button"
                      onClick={handleAddTextBlock}
                      className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-stone-700 bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Text Block 📝</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGalleryOpen(true)}
                      className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-[#db2777] bg-pink-50 border border-pink-100 hover:bg-pink-100/60 transition-all cursor-pointer"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>Insert Cat Sticker 🐾</span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    disabled={contentBlocks.every(b => b.type === "text" && !b.value.trim())}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 disabled:opacity-40 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md shadow-pink-100"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE ENVELOPE STYLE */}
            {activeStep === 2 && (
              <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif text-[#db2777] font-black italic">Choose Envelope Style</h2>
                  <p className="text-xs text-stone-500 font-mono">Select the presentation theme for your sealed letter</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(envelopeStyles).map(([key, style]) => {
                    const isSelected = envelopeStyle === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setEnvelopeStyle(key)}
                        className={`rounded-2xl p-4 text-center cursor-pointer transition-all border hover:scale-[1.02] flex flex-col justify-between h-44 ${
                          isSelected
                            ? "border-pink-500 bg-white shadow-lg shadow-pink-100 scale-105"
                            : "border-border/60 bg-white/70"
                        }`}
                      >
                        {/* envelope miniature */}
                        <div className={`w-full flex-1 rounded-xl shadow-inner border border-border/40 flex items-center justify-center relative ${style.bg}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.seal} shadow-md`}>
                            <Lock className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <p className="text-xs font-bold text-stone-700 mt-3">{style.name}</p>
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

            {/* STEP 3: ENVELOPE DETAILS & SEND */}
            {activeStep === 3 && (
              <div className="max-w-xl mx-auto text-center space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif text-[#db2777] font-black italic">Address the Envelope</h2>
                  <p className="text-xs text-stone-500 font-mono">Fill in names to customize the seal label</p>
                </div>

                {/* Form fields */}
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm text-left space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 font-mono">Recipient's Name (To)</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Pranavi"
                      className="block w-full px-4 py-3 border border-border rounded-xl bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 font-mono">Your Name (From)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Sajal"
                      className="block w-full px-4 py-3 border border-border rounded-xl bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-stone-600 bg-white border border-border hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSendLetter}
                    disabled={sendingLetter || !recipientName.trim()}
                    className="py-3 px-8 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#db2777] to-pink-500 disabled:opacity-40 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md shadow-pink-100"
                  >
                    {sendingLetter ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Love Letter 💌"}
                  </button>
                </div>
              </div>
            )}

            {/* Historic logs list of sent/received letters */}
            {activeStep === 1 && (
              <div className="max-w-2xl mx-auto space-y-4 pt-8 border-t border-border/40">
                <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#db2777]" />
                  <span>Envelope Log history</span>
                </h2>

                {lettersList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-stone-400 text-xs leading-relaxed">
                    No letters sent or received yet. Click above to write your first cozy love letter!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lettersList.map((l) => {
                      const isSentByMe = l.sender_id === user?.id;
                      const dateFormatted = format(parseISO(l.sent_at), "MMM d, h:mm a");
                      const config = envelopeStyles[l.envelope_style] || envelopeStyles.classic;

                      return (
                        <div
                          key={l.id}
                          onClick={() => handleUnsealLetter(l)}
                          className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <span className={`p-3 rounded-xl border ${config.bg} ${config.border} ${config.text}`}>
                              {isSentByMe ? <Mail className="w-4 h-4" /> : (l.is_opened ? <MailOpen className="w-4 h-4" /> : <Gift className="w-4 h-4 animate-bounce" />)}
                            </span>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-800 truncate">
                                {isSentByMe ? `To: ${l.recipient_name}` : `From: ${l.sender_name}`}
                              </p>
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                {dateFormatted}
                              </p>
                            </div>
                          </div>

                          {!isSentByMe && !l.is_opened && (
                            <span className="bg-[#db2777] text-white text-[8px] font-bold font-mono uppercase px-2 py-0.5 rounded animate-pulse">
                              Seal
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
        {activeLetter && (
          <div className="max-w-xl w-full mx-auto space-y-6 animate-fade-in pb-16">
            
            {/* Exit header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <button
                onClick={() => {
                  setActiveLetter(null);
                  fetchData();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-500 hover:text-foreground uppercase font-mono tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Inbox</span>
              </button>
            </div>

            {/* Envelope rendering wrapper */}
            {(() => {
              const config = envelopeStyles[activeLetter.envelope_style] || envelopeStyles.classic;

              return (
                <div className="space-y-8 relative">
                  
                  {/* CLOSED ENVELOPE SEED VIEW (Wax Seal interaction) */}
                  {!isUnsealed && (
                    <div className={`rounded-3xl border shadow-xl p-12 text-center h-[60vh] flex flex-col justify-between items-center transition-all ${
                      unsealAnimating ? "scale-95 opacity-50 duration-1000" : "scale-100 opacity-100"
                    } ${config.bg} ${config.border}`}>
                      
                      <div className="space-y-2">
                        <p className={`text-2xl font-serif italic font-black ${config.text}`}>
                          To: {activeLetter.recipient_name}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-1">
                          Private sealed correspondence
                        </p>
                      </div>

                      {/* Animated Wax Seal button */}
                      <button
                        onClick={() => handleUnsealLetter(activeLetter)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-lg text-lg border-2 border-white ${config.seal}`}
                      >
                        💌
                      </button>

                      <div className="space-y-1">
                        <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">
                          Press Wax Seal to Unseal
                        </p>
                        <p className="text-xs font-bold text-stone-500">
                          From: {activeLetter.sender_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* UNROLLED ELEGANT LETTER BLOCK VIEW */}
                  {isUnsealed && (
                    <div className="rounded-3xl border border-border/80 bg-white p-8 md:p-12 shadow-xl space-y-8 relative overflow-hidden animate-fade-in font-serif italic text-left min-h-[70vh] flex flex-col justify-between">
                      
                      {/* Letter Top Details */}
                      <div className="border-b border-border/40 pb-4 flex justify-between items-center text-xs text-stone-400 font-mono tracking-wide not-italic select-none">
                        <span>TO: {activeLetter.recipient_name}</span>
                        <span>{format(parseISO(activeLetter.sent_at), "MMMM d, yyyy")}</span>
                      </div>

                      {/* Content Blocks mapping */}
                      <div className="space-y-6 py-6 flex-1">
                        {activeLetter.content.map((block: any, idx: number) => {
                          const isVisible = revealedBlocksCount > idx;
                          if (!isVisible) return null;

                          return (
                            <div 
                              key={idx}
                              className="animate-fade-in transition-all duration-700 ease-out transform translate-y-0"
                            >
                              {block.type === "text" ? (
                                <p className="text-base leading-relaxed text-stone-800 whitespace-pre-wrap">
                                  {block.value}
                                </p>
                              ) : (
                                <div className="rounded-2xl overflow-hidden border border-border/50 max-w-sm my-4 shadow-md bg-stone-50 p-2 flex flex-col items-center not-italic">
                                  <img
                                    src={block.value}
                                    alt="Cat attachment"
                                    className="rounded-xl max-h-48 object-cover w-full shadow-inner"
                                  />
                                  <span className="text-[8px] font-mono uppercase bg-pink-500 text-white px-2 py-0.5 rounded-full mt-2 font-bold tracking-wider">
                                    🐾 Embedded Cat Moment
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Sign-off details */}
                      {revealedBlocksCount > activeLetter.content.length && (
                        <div className="border-t border-border/40 pt-6 space-y-4 animate-fade-in">
                          <p className="text-right text-sm font-bold text-stone-700">
                            With love, {activeLetter.sender_name}
                          </p>

                          <div className="flex justify-center pt-2">
                            <button
                              onClick={handleSaveToMoments}
                              disabled={savingMoment}
                              className="flex items-center space-x-1.5 py-2.5 px-5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#db2777] to-pink-500 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md not-italic"
                            >
                              {savingMoment ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                              <span>Save to Moments Scrapbook</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

      </main>

      {/* CURATED CAT MEDIA PICKER MODAL (Step 1 sticker insertion) */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl border border-border animate-scale-up overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border/40 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-stone-800">Choose a Cute Cat Sticker</h3>
                <p className="text-[10px] text-stone-400 font-mono mt-0.5">Pick one to embed inside your letter</p>
              </div>
              <button
                onClick={() => setGalleryOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:bg-stone-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter tags */}
            <div className="px-5 py-3 border-b border-border/40 flex gap-2 overflow-x-auto bg-stone-50 select-none">
              {["all", "silly", "sleepy", "playful", "love"].map((catFilter) => (
                <button
                  key={catFilter}
                  onClick={() => setGalleryFilter(catFilter)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    galleryFilter === catFilter
                      ? "bg-[#db2777] text-white"
                      : "bg-white text-stone-500 border border-border hover:bg-stone-100"
                  }`}
                >
                  {catFilter}
                </button>
              ))}
            </div>

            {/* Curated Cat Photos Grid */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-2 gap-4">
              {catMedia
                .filter(cat => galleryFilter === "all" || cat.category === galleryFilter)
                .map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleInsertCatBlock(cat.media_url)}
                    className="rounded-2xl border border-border overflow-hidden bg-stone-50 shadow-sm cursor-pointer hover:scale-[1.02] transition-all relative group h-40 flex flex-col justify-end"
                  >
                    <img
                      src={cat.media_url}
                      alt="Cat sticker"
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    
                    <span className="relative z-10 m-2.5 bg-white/95 text-stone-700 text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded shadow-sm self-start">
                      🐾 {cat.category}
                    </span>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
