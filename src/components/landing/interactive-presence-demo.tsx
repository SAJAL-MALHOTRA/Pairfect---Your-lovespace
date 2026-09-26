"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, CloudRain, Moon, MapPin, Sparkles, Send } from "lucide-react";

export default function InteractivePresenceDemo() {
  const [pingSent, setPingSent] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

  const handleSendPing = () => {
    setPingSent(true);
    const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
    setHearts((prev) => [...prev, newHeart]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Calm Presence Frame */}
      <div
        className="relative rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] p-6 sm:p-9 shadow-xl overflow-hidden select-none min-h-[440px] flex flex-col justify-between"
        style={{
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
        }}
      >
        {/* Floating Heart Reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, y: 300, scale: 0.8, x: `calc(50% + ${h.x}px)` }}
              animate={{ opacity: 0, y: 80, scale: 1.4 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute text-2xl text-[#8E2B45]"
            >
              ♡
            </motion.div>
          ))}
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#6E5D57] font-semibold">
              Quiet Sanctuary Presence
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#9E8C85]">Non-intrusive connection</span>
        </div>

        {/* Center: Quiet Dual Mood Cards */}
        <div className="my-4 space-y-3">
          {/* Partner Status */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border border-[#E4D8CB] flex items-center justify-center text-xl">
                🌿
              </div>
              <div>
                <div className="text-xs font-bold text-[#2C1E1A]">Mia checked in as peaceful</div>
                <div className="text-[11px] text-[#6E5D57] font-mono">
                  &ldquo;Wrapped in cozy knitwear reading by the window&rdquo;
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#9E8C85]">12m ago</span>
          </div>

          {/* Meanwhile Proximity & Local Weather */}
          <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CloudRain className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E8C85] block">
                  Meanwhile in Delhi
                </span>
                <p className="text-xs font-semibold text-[#2C1E1A]">
                  24°C · Rain on the roof · 08:34 PM
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right pl-11 sm:pl-0">
              <span className="text-[10px] font-mono text-[#8E2B45] font-bold block">
                138 miles apart
              </span>
              <span className="text-[10px] text-[#9E8C85] font-mono">Stars in Jalandhar</span>
            </div>
          </div>
        </div>

        {/* Gentle "Thinking of You" Ping Action */}
        <div className="pt-3 border-t border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-[#6E5D57] font-mono">
            {pingSent ? (
              <span className="text-[#8E2B45] font-semibold flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current" />
                Thinking of you ping delivered to Mia&apos;s phone.
              </span>
            ) : (
              <span>Send a gentle pulse across the distance.</span>
            )}
          </div>

          <button
            onClick={handleSendPing}
            className="px-4 py-2 rounded-full bg-white border border-[#E8DFD5] hover:border-[#8E2B45] text-xs font-semibold text-[#8E2B45] hover:bg-rose-50 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Send &ldquo;Thinking of you&rdquo;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
