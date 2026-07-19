"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Navigation from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateStreak } from "@/lib/utils/streak";
import { Heart, Compass, Check, Calendar, Plus, Smile } from "lucide-react";

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
    const fetchStreak = async () => {
      if (!pair) return;
      try {
        const { data: moodLogs } = await supabase
          .from("mood_logs")
          .select("*")
          .eq("pair_id", pair.id);
        if (moodLogs) {
          const calculatedStreak = calculateStreak(moodLogs, pair.user_a_id, pair.user_b_id);
          setStreak(calculatedStreak);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStreak();
  }, [pair]);

  // Load custom bucket list items from local cache
  useEffect(() => {
    if (pair) {
      const saved = localStorage.getItem(`pairfect-bucketlist-${pair.id}`);
      if (saved) {
        try {
          setBucketList(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [pair]);

  const toggleTodo = (id: string) => {
    const updated = bucketList.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setBucketList(updated);
    if (pair) {
      localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(updated));
    }
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      done: false
    };
    const updated = [...bucketList, newItem];
    setBucketList(updated);
    setNewTodo("");
    if (pair) {
      localStorage.setItem(`pairfect-bucketlist-${pair.id}`, JSON.stringify(updated));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FCFBF9] dark:bg-[#1C1713]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative min-h-screen bg-[#FCFBF9] text-[#2E2A25] dark:bg-[#1C1713] dark:text-[#E8E2D5] flex flex-col justify-between pb-32">
      <Navigation />

      <main className="max-w-3xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-start space-y-16 animate-fade-in select-none">
        
        {/* Page Header */}
        <div className="border-b border-[#EAE3D5] dark:border-[#3E352E] pb-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
            Our Identity
          </span>
          <h1 className="text-4xl font-display italic font-black text-[#2E2A25] dark:text-[#E8E2D5] mt-1">
            Our Space
          </h1>
          <p className="text-xs text-[#7C7267] mt-1">
            The private profile we build, grow, and document together.
          </p>
        </div>

        {/* Side-by-Side Polaroid Profiles */}
        <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto w-full pt-4">
          
          {/* User Card */}
          <div className="bg-[#FAF6EE] dark:bg-[#201A15] p-4 pb-6 border border-[#EAE3D5] dark:border-amber-950/20 shadow-md rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
            <div className="aspect-square bg-stone-100 dark:bg-stone-900 border border-stone-200/40 relative overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{getInitials(profile?.display_name)}</span>
              )}
            </div>
            <div className="pt-4 text-center">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E] block mb-0.5">Me</span>
              <p className="font-handwriting text-lg font-bold text-[#2E2A25] dark:text-[#E8E2D5]">{profile?.display_name || "Love"}</p>
            </div>
          </div>

          {/* Partner Card */}
          <div className="bg-[#FAF6EE] dark:bg-[#201A15] p-4 pb-6 border border-[#EAE3D5] dark:border-amber-950/20 shadow-md rotate-[1.5deg] hover:rotate-0 transition-transform duration-300">
            <div className="aspect-square bg-stone-100 dark:bg-stone-900 border border-stone-200/40 relative overflow-hidden flex items-center justify-center">
              {partner?.avatar_url ? (
                <img src={partner.avatar_url} alt={partner.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{getInitials(partner?.display_name || "Partner")}</span>
              )}
            </div>
            <div className="pt-4 text-center">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E] block mb-0.5">Partner</span>
              <p className="font-handwriting text-lg font-bold text-[#2E2A25] dark:text-[#E8E2D5]">{partner?.display_name || "Partner"}</p>
            </div>
          </div>

        </div>

        {/* Streak & Stats Section */}
        <div className="max-w-md mx-auto w-full text-center space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E]">
            Connection streak
          </span>
          <p className="font-heading italic text-4xl font-black text-[#802030] dark:text-rose-400">
            {streak} days logged together
          </p>
          <p className="text-xs text-[#7C7267] max-w-xs mx-auto leading-relaxed">
            Streaks represent overlapping days where both partners shared check-ins. Keep communicating!
          </p>
        </div>

        {/* Cozy Bucket List Section */}
        <div className="max-w-xl mx-auto w-full space-y-6">
          <div className="border-b border-[#EAE3D5] dark:border-[#3E352E] pb-3 text-left">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A7B6E] block">
              Shared checklist
            </span>
            <h2 className="text-2xl font-display italic font-bold text-[#2E2A25] dark:text-[#E8E2D5] mt-0.5">
              Our Bucket List
            </h2>
          </div>

          {/* List items */}
          <div className="space-y-3.5 text-left">
            {bucketList.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleTodo(item.id)}
                className="flex items-center space-x-3.5 cursor-pointer group"
              >
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  item.done
                    ? "bg-[#802030] border-[#802030] text-white"
                    : "border-[#EAE3D5] group-hover:border-[#8A7B6E] bg-[#FAF6EE] dark:bg-[#28221D]"
                }`}>
                  {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span className={`text-sm font-medium transition-all ${
                  item.done 
                    ? "line-through text-[#8A7B6E] opacity-60" 
                    : "text-[#2E2A25] dark:text-[#E8E2D5]"
                }`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Add item form */}
          <form onSubmit={addTodo} className="flex gap-2 pt-4">
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="Add a new custom adventure..."
              className="flex-1 px-4 py-2 border border-[#EAE3D5] dark:border-[#3E352E] bg-[#FAF6EE] dark:bg-[#28221D] rounded-xl text-xs focus:outline-none text-[#2E2A25] dark:text-[#E8E2D5]"
            />
            <button
              type="submit"
              className="btn-primary py-2 px-6 text-xs uppercase font-bold tracking-wider cursor-pointer"
            >
              Add Item
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
