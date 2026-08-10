"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Loader2, ShieldCheck } from "lucide-react";

interface CityItem {
  name: string;
  country: string;
  timezone: string;
}

const POPULAR_CITIES: CityItem[] = [
  { name: "Delhi", country: "India", timezone: "Asia/Kolkata" },
  { name: "Mumbai", country: "India", timezone: "Asia/Kolkata" },
  { name: "Jalandhar", country: "India", timezone: "Asia/Kolkata" },
  { name: "Chandigarh", country: "India", timezone: "Asia/Kolkata" },
  { name: "Bangalore", country: "India", timezone: "Asia/Kolkata" },
  { name: "Hyderabad", country: "India", timezone: "Asia/Kolkata" },
  { name: "Kolkata", country: "India", timezone: "Asia/Kolkata" },
  { name: "Pune", country: "India", timezone: "Asia/Kolkata" },
];

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelected: (city: CityItem) => void;
}

export default function CitySelectorModal({ isOpen, onClose, onCitySelected }: CitySelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CityItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/city/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Failed to search cities:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = async (city: CityItem) => {
    setSelectedCity(city);
    setSaving(true);

    try {
      const res = await fetch("/api/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: city.name,
          country: city.country,
          timezone: city.timezone,
        }),
      });

      if (!res.ok) throw new Error("Failed to save city");

      onCitySelected(city);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save your city. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayList = searchQuery.trim() ? results : POPULAR_CITIES;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-lg rounded-[28px] border overflow-hidden p-6 sm:p-8 shadow-2xl z-10 space-y-6"
          style={{
            backgroundColor: "var(--paper-warm)",
            borderColor: "var(--border)",
            boxShadow: "0 24px 60px rgba(61, 36, 50, 0.18)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:text-[var(--text)] flex items-center justify-center transition-all hover:scale-105"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-2 text-center sm:text-left pr-8">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Meanwhile Proximity</span>
            </div>
            <h2 className="font-display italic text-2xl sm:text-3xl font-black text-[var(--text)] leading-tight">
              Where are you right now?
            </h2>
            <p className="font-sans text-xs text-[var(--text-soft)] leading-relaxed">
              Choose your city so Pairfect can show your distance, their weather and local time.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-soft)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your city..."
              className="input-warm pl-11 pr-10 py-3 text-sm rounded-2xl"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--burgundy)] animate-spin" />
            )}
          </div>

          {/* City Grid / List */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] font-semibold">
              {searchQuery.trim() ? "Search Results" : "Popular Cities"}
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {displayList.map((city, idx) => {
                const isSelected = selectedCity?.name === city.name;
                return (
                  <button
                    key={`${city.name}-${city.country}-${idx}`}
                    onClick={() => handleSelectCity(city)}
                    disabled={saving}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--burgundy)] text-[var(--burgundy)] font-bold shadow-xs"
                        : "bg-[var(--card)] border-[var(--border)] text-[var(--text)] hover:border-[var(--burgundy)]/40 hover:bg-[var(--paper-mid)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm truncate group-hover:text-[var(--burgundy)]">
                        {city.name}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-soft)] truncate">
                        {city.country}
                      </p>
                    </div>
                    <MapPin className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 text-[var(--burgundy)] shrink-0 ml-1" />
                  </button>
                );
              })}

              {searchQuery.trim() && results.length === 0 && !searching && (
                <div className="col-span-2 py-6 text-center text-xs text-[var(--text-soft)] italic">
                  No cities found for "{searchQuery}". Try a major city nearby.
                </div>
              )}
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="p-3.5 rounded-2xl bg-[var(--paper-mid)] border border-[var(--border)] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--burgundy)] shrink-0" />
            <p className="text-[11px] font-sans text-[var(--text-soft)] leading-snug">
              <strong className="font-semibold text-[var(--text)]">Your exact location is never shared.</strong> Pairfect only uses your chosen city.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
