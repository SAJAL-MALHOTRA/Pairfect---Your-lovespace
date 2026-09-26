"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Camera, BookOpen, Gift, Sparkles, X } from "lucide-react";

interface VaultItem {
  id: string;
  type: "letter" | "photo" | "journal" | "gratitude";
  title: string;
  preview: string;
  date: string;
  badge: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  tags: string[];
}

const VAULT_ITEMS: VaultItem[] = [
  {
    id: "v1",
    type: "letter",
    title: "Letter: Morning Coffee Ritual",
    preview: "The roast tasted like hazelnuts, but watching your sleepy smile across the breakfast counter was the sweetest part...",
    date: "July 14, 2026",
    badge: "Wax Letter",
    icon: Mail,
    iconColor: "text-[#8E2B45]",
    iconBg: "bg-rose-50",
    tags: ["coffee", "morning", "july", "letters"],
  },
  {
    id: "v2",
    type: "photo",
    title: "Polaroid: Corner Table at Blue Tokai",
    preview: "Heavy monsoon rain outside, two dirty chai lattes, and our favorite book between us.",
    date: "July 28, 2026",
    badge: "Polaroid",
    icon: Camera,
    iconColor: "text-amber-800",
    iconBg: "bg-amber-50",
    tags: ["coffee", "rain", "july", "tokai", "cafe"],
  },
  {
    id: "v3",
    type: "journal",
    title: "Journal: Midnight Dinner Debates",
    preview: "We couldn't decide on dinner, so we made garlic noodles at 1 AM in our pajamas and rated them 10/10.",
    date: "August 04, 2026",
    badge: "Living Journal",
    icon: BookOpen,
    iconColor: "text-purple-700",
    iconBg: "bg-purple-50",
    tags: ["dinner", "midnight", "food", "noodles"],
  },
  {
    id: "v4",
    type: "gratitude",
    title: "Gratitude Slip: The Espresso Shot",
    preview: "Thank you for waking up 15 minutes before my alarm just to grind fresh beans before my nervous interview.",
    date: "September 02, 2026",
    badge: "Gratitude Jar",
    icon: Gift,
    iconColor: "text-emerald-700",
    iconBg: "bg-emerald-50",
    tags: ["coffee", "espresso", "morning", "kindness"],
  },
  {
    id: "v5",
    type: "photo",
    title: "Polaroid: Rooftop Candlelight Dinner",
    preview: "Cold breeze, fairy lights plugged into the bedroom extension cord, homemade pasta.",
    date: "September 19, 2026",
    badge: "Polaroid",
    icon: Camera,
    iconColor: "text-amber-800",
    iconBg: "bg-amber-50",
    tags: ["dinner", "pasta", "candlelight", "rooftop"],
  },
];

export default function InteractiveVaultDemo() {
  const [searchTerm, setSearchTerm] = useState("coffee");

  const filtered = VAULT_ITEMS.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q) ||
      item.date.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search Vault Frame */}
      <div
        className="relative rounded-[32px] border border-[#E8DFD5] bg-[#FAF6F0] p-6 sm:p-9 shadow-xl overflow-hidden select-none min-h-[500px] flex flex-col justify-between"
        style={{
          boxShadow: "0 20px 60px -10px rgba(44, 30, 26, 0.12)",
        }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#FAF5EC] text-[#8E2B45]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#8E2B45] font-bold">
                Searchable Memory Vault
              </span>
            </div>

            <span className="text-[10px] font-mono text-[#9E8C85]">Instant recall across years</span>
          </div>

          {/* Interactive Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search letters, dates, photos, journal entries..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-[#E8DFD5] text-xs sm:text-sm text-[#2C1E1A] focus:outline-none focus:ring-2 focus:ring-[#8E2B45]/20 focus:border-[#8E2B45] shadow-xs"
            />
            <Search className="w-4 h-4 text-[#9E8C85] absolute left-3.5 top-3.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-3.5 text-[#9E8C85] hover:text-[#2C1E1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Suggested search chips */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-mono uppercase text-[#9E8C85]">Try searching:</span>
            {["coffee", "dinner", "July", "rain"].map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchTerm(chip)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-colors cursor-pointer ${
                  searchTerm.toLowerCase() === chip.toLowerCase()
                    ? "bg-[#8E2B45] text-white shadow-2xs"
                    : "bg-white border border-[#E8DFD5] text-[#6E5D57] hover:border-[#8E2B45]"
                }`}
              >
                &ldquo;{chip}&rdquo;
              </button>
            ))}
          </div>

          {/* Search Results Feed */}
          <div className="space-y-2.5 pt-2 max-h-[250px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="p-3.5 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#8E2B45]/40 transition-all shadow-2xs flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-xl ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#2C1E1A] truncate">{item.title}</h4>
                          <span className="text-[9px] font-mono text-[#9E8C85] shrink-0">{item.date}</span>
                        </div>
                        <p className="text-[11px] text-[#6E5D57] line-clamp-2 leading-relaxed">
                          {item.preview}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-[#9E8C85] italic font-mono">
                  No memories found for &ldquo;{searchTerm}&rdquo;. Try &ldquo;coffee&rdquo; or &ldquo;July&rdquo;.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Vault Guarantee */}
        <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between text-[11px] text-[#6E5D57] font-mono">
          <span>{filtered.length} memories indexed in couple vault</span>
          <span className="text-[#8E2B45] font-bold">End-to-End Private</span>
        </div>
      </div>
    </div>
  );
}
