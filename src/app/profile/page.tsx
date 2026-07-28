"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateStreak } from "@/lib/utils/streak";
import { Check, Plus, Loader2, Edit3, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { PairfectPortrait } from "@/components/cozy-illustrations";
import Link from "next/link";
import { ChibiAvatar, parseAvatarConfig } from "@/components/chibi-avatar";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!pair) return;
    (async () => {
      const { data } = await supabase.from("mood_logs").select("*").eq("pair_id", pair.id).limit(200);
      if (data) setStreak(calculateStreak(data, pair.user_a_id, pair.user_b_id));
    })();
  }, [pair]);

  const channelRef = useState<any>(null);

  useEffect(() => {
    if (!pair) return;

    // Load initial bucket list from DB or localStorage
    (async () => {
      try {
        const { data } = await supabase
          .from("pairs")
          .select("bucket_list")
          .eq("id", pair.id)
          .single();

        if (data?.bucket_list && Array.isArray(data.bucket_list) && data.bucket_list.length > 0) {
          setBucketList(data.bucket_list);
          localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(data.bucket_list));
          return;
        }
      } catch (e) {
        console.warn("DB bucket_list fetch:", e);
      }

      const saved = localStorage.getItem(`pairfect-bucketlist-${pair.id}`);
      if (saved) {
        try { setBucketList(JSON.parse(saved)); } catch {}
      }
    })();

    // Realtime broadcast listener for instant partner sync
    const ch = supabase.channel(`bucketlist-sync-${pair.id}`);

    ch.on("broadcast", { event: "bucket-update" }, ({ payload }: any) => {
      if (payload?.list && Array.isArray(payload.list)) {
        setBucketList(payload.list);
        localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(payload.list));
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [pair]);

  const saveToStorage = async (list: any[]) => {
    setBucketList(list);
    if (!pair) return;

    // Save to local storage
    localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(list));

    // Broadcast to partner in real time
    supabase.channel(`bucketlist-sync-${pair.id}`).send({
      type: "broadcast",
      event: "bucket-update",
      payload: { list },
    });

    // Save to database
    try {
      await supabase.from("pairs").update({ bucket_list: list }).eq("id", pair.id);
    } catch (e) {
      console.warn("Save DB bucket_list error:", e);
    }
  };

  const toggleTodo = (id: string) => {
    const updated = bucketList.map(item => item.id === id ? { ...item, done: !item.done } : item);
    saveToStorage(updated);
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const updated = [...bucketList, { id: Date.now().toString(), text: newTodo.trim(), done: false }];
    saveToStorage(updated);
    setNewTodo("");
  };

  const startEdit = (item: { id: string; text: string }) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) {
      deleteTodo(id);
      return;
    }
    const updated = bucketList.map(item => item.id === id ? { ...item, text: editText.trim() } : item);
    saveToStorage(updated);
    setEditingId(null);
    setEditText("");
  };

  const deleteTodo = (id: string) => {
    const updated = bucketList.filter(item => item.id !== id);
    saveToStorage(updated);
    if (editingId === id) setEditingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  const anniversaryStart = pair?.started_dating_date || pair?.created_at;

  const daysTogether = anniversaryStart
    ? Math.max(1, Math.floor((Date.now() - new Date(anniversaryStart).getTime()) / 86400000) + 1)
    : 1;

  const since = anniversaryStart
    ? new Date(anniversaryStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
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
            <p className="font-handwriting text-xs text-[var(--ink-light)] mb-2 italic">
              Since {since}
            </p>
          )}

          <div className="relative inline-block">
            <h1
              className="font-display font-black text-8xl md:text-9xl text-[var(--ink-dark)] tracking-tighter leading-none select-none"
              style={{ fontSize: "clamp(5.5rem, 18vw, 8.5rem)" }}
            >
              {daysTogether}
            </h1>
          </div>

          <p className="font-handwriting text-base text-[var(--ink-mid)] mt-3 italic">
            days of choosing each other
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-[var(--border-mid)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)] opacity-50" />
            <div className="h-px w-8 bg-[var(--border-mid)]" />
          </div>
        </motion.div>

        {/* The Couple — side by side polaroid portraits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 gap-4 mb-16"
        >
          {[
            {
              profile: profile,
              isMe: true,
              displayName: profile?.display_name,
            },
            {
              profile: partner,
              isMe: false,
              displayName: partner?.display_name,
            },
          ].map((person, index) => (
            <motion.div
              key={index}
              className={`polaroid relative ${ROTATIONS[index]}`}
              whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {/* Washi tape top */}
              <div
                className="washi-tape"
                style={{
                  width: "40px",
                  height: "16px",
                  background: WASHI[index],
                  transform: `translateX(-50%) rotate(${index === 0 ? -4 : 4}deg)`,
                }}
              />

              {/* Avatar Box */}
              <div className="relative bg-[var(--paper-mid)] overflow-hidden rounded-sm group aspect-square flex items-center justify-center">
                <ChibiAvatar
                  config={parseAvatarConfig(person.profile?.avatar_config)}
                  className="w-28 h-28"
                />
                {person.isMe && (
                  <Link
                    href="/profile/avatar-builder"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] uppercase tracking-wider font-mono font-bold"
                  >
                    Customize
                  </Link>
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)]">Our bucket list</p>
            <span className="text-[9px] font-mono text-[var(--ink-light)]">
              {bucketList.filter(i => i.done).length}/{bucketList.length} completed
            </span>
          </div>

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
              {bucketList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 group"
                  style={{ minHeight: "36px", paddingTop: "2px" }}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTodo(item.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                      item.done ? "bg-[var(--seal-red)] border-[var(--seal-red)]" : "bg-transparent border-[var(--ink-light)] hover:border-[var(--seal-red)]"
                    }`}
                  >
                    {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </button>

                  {/* Inline Edit Form vs Normal Text */}
                  {editingId === item.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); saveEdit(item.id); }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        className="flex-1 bg-white/70 px-2 py-0.5 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[var(--seal-red)]"
                        style={{ fontFamily: "var(--font-handwriting),cursive", color: "var(--text)" }}
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Save item"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span
                        onClick={() => toggleTodo(item.id)}
                        className={`flex-1 text-sm leading-relaxed transition-all duration-200 cursor-pointer ${
                          item.done ? "line-through" : ""
                        }`}
                        style={{
                          fontFamily: "var(--font-handwriting),cursive",
                          color: item.done ? "#9C8E7B" : "#3A2E22",
                        }}
                      >
                        {item.text}
                      </span>

                      {/* Action buttons (Edit / Delete) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-1 text-[#7A6A55] hover:text-[#8E2B45] rounded hover:bg-black/5 cursor-pointer"
                          title="Edit item"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTodo(item.id)}
                          className="p-1 text-[#7A6A55] hover:text-red-700 rounded hover:bg-black/5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add new item input */}
            <form onSubmit={addTodo} className="px-6 pb-5 flex items-center gap-3 border-t" style={{ borderColor: "rgba(196,168,130,0.25)" }}>
              <Plus className="w-3.5 h-3.5 text-[#8C7D6B] flex-shrink-0" />
              <input
                type="text"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Add a dream..."
                className="flex-1 bg-transparent text-sm placeholder-[#9C8E7B] focus:outline-none py-2"
                style={{ fontFamily: "var(--font-handwriting),cursive", color: "#3A2E22", lineHeight: "36px" }}
              />
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
