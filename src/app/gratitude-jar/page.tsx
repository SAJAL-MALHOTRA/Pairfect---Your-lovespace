"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { Sparkles, Gift, Heart, Send, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GratitudeJarPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [notes, setNotes] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // Animation & Reveal states
  const [shaking, setShaking] = useState(false);
  const [activeNote, setActiveNote] = useState<any | null>(null);

  const fetchNotes = async (currentLimit = limit) => {
    if (!pair) return;
    try {
      // Query limit + 1 to detect if there's a next page
      const { data, error: err } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false })
        .limit(currentLimit + 1);

      if (err) throw err;

      if (data && data.length > currentLimit) {
        setHasMore(true);
        setNotes(data.slice(0, currentLimit));
      } else {
        setHasMore(false);
        setNotes(data || []);
      }
    } catch (e) {
      console.error("Error fetching gratitude entries:", e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchNotes(limit);

      // Realtime listener for gratitude entries
      const channel = supabase
        .channel(`gratitude-${pair.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "gratitude_entries",
            filter: `pair_id=eq.${pair.id}`,
          },
          () => {
            fetchNotes(limit);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loading, pair, limit]);

  const handleDropNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !pair || !user) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase
        .from("gratitude_entries")
        .insert({
          pair_id: pair.id,
          user_id: user.id,
          content: message.trim(),
        });

      if (insertErr) throw insertErr;
      setMessage("");
      await fetchNotes(limit);
    } catch (err: any) {
      setError(err.message || "Failed to drop note into the jar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShakeJar = () => {
    if (notes.length === 0) return;
    setShaking(true);
    setActiveNote(null);

    // Wobble for 1 second, then pick a random note from the partner (or anyone if solo)
    setTimeout(() => {
      setShaking(false);
      const partnerNotes = notes.filter((n) => n.user_id !== user?.id);
      const pool = partnerNotes.length > 0 ? partnerNotes : notes;
      const randomIdx = Math.floor(Math.random() * pool.length);
      setActiveNote(pool[randomIdx]);
    }, 1000);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from("gratitude_entries")
        .delete()
        .eq("id", id);

      if (err) throw err;
      await fetchNotes(limit);
      if (activeNote?.id === id) {
        setActiveNote(null);
      }
    } catch (err: any) {
      console.error("Error deleting note:", err);
      setError(err.message || "Failed to delete appreciation note.");
    }
  };

  const getRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  if (loading || (fetching && notes.length === 0)) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground transition-colors duration-200">
      {/* ambient glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 opacity-30 dark:opacity-20" style={{
        background: "radial-gradient(50rem 35rem at 50% 10%,rgba(244,114,182,0.05) 0%,transparent 60%)"
      }} />
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col md:flex-row gap-8 items-center md:items-start z-10">
        
        {/* Left Side: Interactive Glass Jar */}
        <div className="flex-1 flex flex-col items-center space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-sans font-black tracking-tight text-foreground flex items-center justify-center gap-2">
              <Gift className="w-8 h-8 text-primary" />
              <span>Our Gratitude Jar</span>
            </h1>
            <p className="text-xs text-muted-foreground max-w-sm">
              Shake the jar to read a sweet message of appreciation from {partner?.display_name || "your partner"}.
            </p>
          </div>

          {/* Interactive Glass Jar Graphic Container */}
          <div className="relative w-64 h-80 flex items-center justify-center">
            
            {/* Custom CSS Glass Jar Graphic */}
            <div 
              onClick={handleShakeJar}
              className={`w-48 h-72 rounded-t-[40px] rounded-b-[20px] border-4 border-white/20 dark:border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative cursor-pointer select-none transition-transform duration-350 active:scale-95 flex flex-col justify-between p-4 overflow-hidden
                ${shaking ? "animate-bounce" : "hover:scale-[1.02]"}
              `}
              style={{
                boxShadow: "inset 0 10px 20px rgba(255,255,255,0.15), inset 0 -10px 20px rgba(0,0,0,0.2), 0 15px 30px rgba(0,0,0,0.1)"
              }}
            >
              {/* Lid of the jar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-md border border-amber-800 z-20 flex items-center justify-center">
                <span className="w-16 h-1 bg-amber-500/30 rounded" />
              </div>

              {/* Floating Hearts Inside the Jar (indicates note count) */}
              <div className="flex-1 w-full relative mt-6 flex flex-wrap gap-2 items-end justify-center p-3 select-none pointer-events-none">
                {notes.map((_, i) => (
                  <Heart 
                    key={i} 
                    className="w-5 h-5 text-pink-500 fill-pink-500/80 animate-pulse" 
                    style={{
                      animationDelay: `${i * 150}ms`,
                      animationDuration: "2s"
                    }}
                  />
                ))}
                {notes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Jar is empty</p>
                  </div>
                )}
              </div>

              {/* Tag hanging from the neck of the jar */}
              <div className="absolute top-10 left-6 w-10 h-14 bg-amber-50 border border-amber-200 shadow-sm rounded-sm origin-top rotate-[12deg] z-10 flex flex-col items-center justify-center p-1 font-mono text-[7px] font-bold text-amber-800">
                <div className="w-1 h-1 bg-amber-900 rounded-full mb-1" />
                <span>SWEET</span>
                <span>NOTES</span>
              </div>
            </div>
            
            {/* Glow beneath the jar */}
            <div className="absolute -bottom-2 w-40 h-4 bg-pink-500/20 rounded-full blur-md -z-10" />
          </div>

          <button
            onClick={handleShakeJar}
            disabled={notes.length === 0 || shaking}
            className="btn-primary w-full max-w-[200px] py-3 text-xs uppercase tracking-widest"
          >
            {shaking ? "Shaking Jar..." : "Shake to Read ▷"}
          </button>
        </div>

        {/* Right Side: Write Form & History Gallery */}
        <div className="w-full md:w-96 flex flex-col space-y-8">
          
          {/* Write Note Panel */}
          <form 
            onSubmit={handleDropNote}
            className="card-standard p-6 space-y-4"
          >
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-foreground tracking-tight">Drop a Sweet Note</h2>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Write down your appreciation</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> 
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What are you grateful for about your partner today?"
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Drop Note</span>
            </button>
          </form>

          {/* Reveal Note Container */}
          {activeNote && (
            <div className="card-hero p-6 relative overflow-hidden animate-fade-in space-y-4">
              <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/0 to-stone-100 dark:to-[#27272a] border-l border-b border-border/40 rounded-bl-lg" />
              
              <div className="space-y-1">
                <span className="inline-block text-[9px] font-bold text-pink-500 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Appreciation Note 💖
                </span>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  From: {activeNote.user_id === user?.id ? "You" : (partner?.display_name || "Partner")}
                </p>
              </div>

              <p className="font-serif italic text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                "{activeNote.content}"
              </p>
            </div>
          )}

          {/* Appreciation Timeline (Scrollable Gallery) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
              Appreciation Timeline
            </h3>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {notes.map((note) => {
                const isAuthor = note.user_id === user?.id;
                const authorName = isAuthor ? "You" : (partner?.display_name || "Partner");
                return (
                  <div 
                    key={note.id} 
                    className="card-standard p-4 relative overflow-hidden border-l-4 border-l-primary/60 hover:shadow-md transition-shadow group flex flex-col justify-between gap-3"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap flex-1">
                        {note.content}
                      </p>
                      {isAuthor && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-muted-foreground hover:text-red-500 p-1 rounded-lg hover:bg-muted active:scale-95 transition-all opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono mt-1">
                      <span>By: <span className="font-bold text-foreground">{authorName}</span></span>
                      <span>{getRelativeDate(note.created_at)}</span>
                    </div>
                  </div>
                );
              })}

              {notes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground card-standard bg-muted/20">
                  <p className="text-xs">Timeline is empty. Drop the first note to fill the jar! 💌</p>
                </div>
              )}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setLimit((prev) => prev + 20)}
                  className="btn-secondary text-[11px] py-1.5 px-4 font-bold"
                >
                  Load More History
                </button>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
