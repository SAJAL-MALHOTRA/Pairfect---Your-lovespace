"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateStreak } from "@/lib/utils/streak";
import { Check, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();
  const [streak, setStreak] = useState(0);
  const [bucketList, setBucketList] = useState<any[]>([
    { id: "1", text: "Watch the sunrise together 🌅", done: true },
    { id: "2", text: "Cook homemade gnocchi from scratch 🍝", done: false },
    { id: "3", text: "Fill our memories photo album 📸", done: true },
    { id: "4", text: "Write 10 custom love letters 💌", done: false },
    { id: "5", text: "Stargaze on a clear summer night 🌌", done: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    if (!pair) return;
    (async () => {
      const { data } = await supabase.from("mood_logs").select("*").eq("pair_id", pair.id).limit(200);
      if (data) setStreak(calculateStreak(data, pair.user_a_id, pair.user_b_id));
    })();
  }, [pair]);

  useEffect(() => {
    if (!pair) return;
    const saved = localStorage.getItem(`pairfect-bucketlist-${pair.id}`);
    if (saved) { try { setBucketList(JSON.parse(saved)); } catch {} }
  }, [pair]);

  const toggleTodo = (id: string) => {
    const updated = bucketList.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setBucketList(updated);
    if (pair) localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(updated));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const updated = [...bucketList, { id: Date.now().toString(), text: newTodo.trim(), done: false }];
    setBucketList(updated);
    setNewTodo("");
    if (pair) localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  const daysTogether = pair?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pair.created_at).getTime()) / 86400000) + 1)
    : 1;

  const since = pair?.created_at
    ? new Date(pair.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const getInitials = (name: string | null | undefined) => name ? name.slice(0, 2).toUpperCase() : "??";

  const ROTATIONS = ["-rotate-[1.8deg]", "rotate-[1.5deg]"];
  const WASHI = ["rgba(196,164,130,0.42)", "rgba(176,120,120,0.38)"];

  return (
    <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
      <Navigation />

      <main className="max-w-sm mx-auto px-5 py-16 pb-36">

        {/* THE HERO: the number. Nothing else competes with it. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          {since && (
            <p className="font-handwriting text-sm text-[var(--ink-light)] mb-3">Since {since}</p>
          )}

          {/* The monument */}
          <div className="relative inline-block">
            <p className="font-display font-black text-[clamp(5rem,22vw,7.5rem)] text-[var(--ink-dark)] leading-none tracking-tight tabular-nums" style={{ lineHeight: 0.9 }}>
              {daysTogether}
            </p>
            {/* Subtle ambient glow behind the number */}
            <div aria-hidden className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(128,32,48,0.06) 0%, transparent 70%)" }} />
          </div>

          <p className="font-handwriting text-base text-[var(--ink-mid)] mt-3">
            days of choosing each other
          </p>

          {/* Thin rule */}
          <div className="flex items-center gap-3 mt-6 mb-2">
            <div className="flex-1 h-px bg-[var(--border-mid)]" />
            <span className="text-[var(--ink-light)] text-xs">✦</span>
            <div className="flex-1 h-px bg-[var(--border-mid)]" />
          </div>

          {/* Secondary stat: streak */}
          {streak > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="font-handwriting text-sm text-[var(--ink-light)]">
              {streak} day streak 🔥
            </motion.p>
          )}
        </motion.div>

        {/* Two Polaroid portraits — subordinate to the number */}
        <motion.div
          className="flex items-end justify-center gap-8 mb-14"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {[
            { displayName: profile?.display_name, avatarUrl: profile?.avatar_url },
            { displayName: partner?.display_name, avatarUrl: partner?.avatar_url },
          ].map((person, i) => (
            <motion.div
              key={i}
              className={`polaroid ${ROTATIONS[i]} relative`}
              style={{ width: "clamp(110px, 28vw, 140px)" }}
              whileHover={{ rotate: 0, y: -4, scale: 1.04 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              {/* Washi tape strip */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 pointer-events-none z-10"
                style={{ background: WASHI[i], transform: `translateX(-50%) rotate(${i === 0 ? -1.5 : 1.5}deg)` }} />

              {/* Photo area */}
              <div className="aspect-square bg-[var(--border-mid)] overflow-hidden flex items-center justify-center">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={person.displayName || ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-black text-2xl text-[var(--ink-light)]">{getInitials(person.displayName)}</span>
                )}
              </div>

              {/* Caption */}
              <div className="pt-2.5 text-center">
                <p className="font-handwriting text-xs text-[#3A2E22] dark:text-[#D4C8B8] truncate">
                  {person.displayName || "—"}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bucket list — on a physical notebook pad */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
        >
          <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] mb-3">Our bucket list</p>
          <div
            className="relative rounded-3xl overflow-hidden paper-grain"
            style={{
              background: "linear-gradient(180deg,#FFF9F0 0%,#FAF4E8 100%)",
              border: "1px solid var(--border-warm)",
              backgroundImage: "linear-gradient(180deg,#FFF9F0 0%,#FAF4E8 100%),linear-gradient(transparent calc(36px - 1px),rgba(196,168,130,0.2) calc(36px - 1px),rgba(196,168,130,0.2) 36px,transparent 36px)",
              backgroundSize: "100%,100% 36px",
              boxShadow: "0 4px 20px rgba(60,40,20,0.07)",
            }}
          >
            <div className="px-6 py-4 space-y-0">
              {bucketList.map((item, i) => (
                <motion.div
                  key={item.id}
                  onClick={() => toggleTodo(item.id)}
                  className="flex items-center gap-3 cursor-pointer group"
                  style={{ minHeight: "36px", paddingTop: "2px" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      item.done ? "bg-[var(--seal-red)] border-[var(--seal-red)]" : "bg-transparent border-[var(--ink-light)]"
                    }`}
                    whileTap={{ scale: 0.85 }}
                  >
                    {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </motion.div>
                  <span
                    className={`text-sm leading-relaxed transition-all duration-200 ${
                      item.done ? "line-through text-[var(--ink-light)]" : "text-[#2E2A25]"
                    }`}
                    style={{ fontFamily: "var(--font-handwriting),cursive" }}
                  >
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>

            <form onSubmit={addTodo} className="px-6 pb-5 flex items-center gap-3 border-t" style={{ borderColor: "rgba(196,168,130,0.25)" }}>
              <Plus className="w-3.5 h-3.5 text-[var(--ink-light)] flex-shrink-0" />
              <input
                type="text"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Add a dream..."
                className="flex-1 bg-transparent text-sm placeholder-[#C4B89A] focus:outline-none py-2"
                style={{ fontFamily: "var(--font-handwriting),cursive", color: "#2E2A25", lineHeight: "36px" }}
              />
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
