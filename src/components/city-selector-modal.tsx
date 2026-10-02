"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Loader2, ShieldCheck, Check, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export interface CityItem {
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
  currentCity?: CityItem | null;
}

export default function CitySelectorModal({
  isOpen,
  onClose,
  onCitySelected,
  currentCity,
}: CitySelectorModalProps) {
  const { profile, refreshSession } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CityItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingCityName, setSavingCityName] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Determine active city from props or auth profile
  const activeCity = currentCity || profile?.city || null;
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(activeCity);

  useEffect(() => {
    if (isOpen) {
      setSelectedCity(currentCity || profile?.city || null);
      setSearchQuery("");
      setResults([]);
    }
  }, [isOpen, currentCity, profile?.city]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = async (city: CityItem) => {
    setSelectedCity(city);
    setSavingCityName(city.name);

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
      if (refreshSession) {
        await refreshSession(false);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save your city. Please try again.");
    } finally {
      setSavingCityName(null);
    }
  };

  const handleClearCity = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/city", { method: "DELETE" });
      if (res.ok) {
        setSelectedCity(null);
        if (refreshSession) {
          await refreshSession(false);
        }
        onClose();
      }
    } catch (err) {
      console.error("Failed to clear city:", err);
    } finally {
      setClearing(false);
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
          className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-[28px] border overflow-hidden p-6 sm:p-7 shadow-2xl z-10 space-y-5"
          style={{
            backgroundColor: "var(--paper-warm)",
            borderColor: "var(--border)",
            boxShadow: "0 24px 60px rgba(61, 36, 50, 0.18)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:text-[var(--text)] flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-xs"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-1.5 text-center sm:text-left pr-8 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--burgundy)] font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Meanwhile Proximity</span>
            </div>
            <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--text)] leading-tight tracking-wide">
              Where are you right now?
            </h2>
            <p className="font-sans text-xs text-[var(--text-soft)] leading-relaxed">
              Choose your city so Pairfect can show your distance, their weather and local time.
            </p>
          </div>

          {/* Search Input with Guaranteed Left Padding */}
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-soft)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your city..."
              style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
              className="input-warm w-full text-sm rounded-2xl border border-[var(--border)] focus:border-[var(--burgundy)] transition-all outline-none"
              autoFocus
            />
            {searching ? (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--burgundy)] animate-spin" />
            ) : searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* City Grid / List Header */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between shrink-0 px-0.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] font-semibold">
                {searchQuery.trim() ? `Search Results (${results.length})` : "Popular Cities"}
              </p>

              {selectedCity && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--burgundy)] font-medium">
                  <span>Current: <strong>{selectedCity.name}</strong></span>
                  <button
                    type="button"
                    onClick={handleClearCity}
                    disabled={clearing}
                    className="ml-1 text-[10px] text-zinc-400 hover:text-red-500 underline cursor-pointer"
                    title="Stop sharing city"
                  >
                    {clearing ? "Clearing..." : "Clear"}
                  </button>
                </div>
              )}
            </div>

            {/* City Grid Container with Smooth Custom Scrollbar and Zero Border Clipping */}
            <div
              className={`grid grid-cols-2 gap-2.5 overflow-y-auto p-0.5 pr-2 ${
                searchQuery.trim() ? "max-h-[280px]" : "max-h-[290px]"
              }`}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(232, 82, 125, 0.25) transparent",
              }}
            >
              {displayList.map((city, idx) => {
                const isSelected = selectedCity?.name?.toLowerCase() === city.name.toLowerCase();
                const isSavingThis = savingCityName === city.name;

                return (
                  <button
                    key={`${city.name}-${city.country}-${idx}`}
                    onClick={() => handleSelectCity(city)}
                    disabled={savingCityName !== null}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-rose-50/80 border-[var(--burgundy)] ring-2 ring-[var(--burgundy)]/25 text-[var(--burgundy)] font-bold shadow-xs"
                        : "bg-[var(--card)] border-[var(--border)] text-[var(--text)] hover:border-[var(--burgundy)]/40 hover:bg-[var(--paper-mid)] active:scale-[0.98]"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <p className={`font-heading font-bold text-sm truncate ${isSelected ? "text-[var(--burgundy)]" : "group-hover:text-[var(--burgundy)]"}`}>
                        {city.name}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-soft)] truncate">
                        {city.country}
                      </p>
                    </div>

                    <div className="shrink-0 ml-1">
                      {isSavingThis ? (
                        <Loader2 className="w-4 h-4 text-[var(--burgundy)] animate-spin" />
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-[var(--burgundy)] stroke-[2.5]" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 opacity-35 group-hover:opacity-100 text-[var(--burgundy)] transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}

              {searchQuery.trim() && results.length === 0 && !searching && (
                <div className="col-span-2 py-8 text-center text-xs text-[var(--text-soft)] italic">
                  No cities found for &quot;{searchQuery}&quot;. Try a major city nearby.
                </div>
              )}
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="p-3.5 rounded-2xl bg-[var(--paper-mid)] border border-[var(--border)] flex items-center gap-3 shrink-0">
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
