"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedTrackResult } from "@/app/api/spotify/search/route";

interface SelectedTrack {
  name: string;
  artist: string;
  spotifyUrl: string;
  albumArt?: string;
}

interface SpotifySearchInputProps {
  selectedTrack?: SelectedTrack | null;
  onSelectTrack: (track: SelectedTrack | null) => void;
  label?: string;
}

export default function SpotifySearchInput({
  selectedTrack,
  onSelectTrack,
  label = "Song (optional)",
}: SpotifySearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedTrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search query (450ms delay)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.tracks || []);
          setDropdownOpen(true);
        }
      } catch (e) {
        console.error("Spotify search error:", e);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (track: UnifiedTrackResult) => {
    onSelectTrack({
      name: track.name,
      artist: track.artist,
      spotifyUrl: track.spotifyUrl,
      albumArt: track.albumArt,
    });
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  };

  const handleClear = () => {
    onSelectTrack(null);
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] block font-medium">
        {label}
      </label>

      {/* Selected Track Compact Chip Display */}
      {selectedTrack && selectedTrack.name ? (
        <div className="p-2.5 rounded-xl bg-[var(--paper-warm)] border border-[var(--border)] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {selectedTrack.albumArt ? (
              <img
                src={selectedTrack.albumArt}
                alt={selectedTrack.name}
                className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-black/10"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[var(--rose)]/20 text-[var(--burgundy)] flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-heading font-bold text-xs text-[var(--text)] truncate leading-tight">
                {selectedTrack.name}
              </p>
              <p className="text-[10px] text-[var(--text-soft)] font-mono truncate leading-tight mt-0.5">
                {selectedTrack.artist || "Unknown Artist"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-[var(--text-soft)] hover:text-red-500 hover:bg-black/5 cursor-pointer transition-colors"
            title="Clear song selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Search Input Box */
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setDropdownOpen(true); }}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-sans text-[var(--text)] placeholder:text-[var(--ink-light)] focus:outline-none focus:ring-2 focus:ring-[var(--burgundy)]/30 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-[var(--text-soft)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-[var(--burgundy)] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}

          {/* Search Dropdown Results */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-xl divide-y divide-[var(--border)]/60"
              >
                {results.length > 0 ? (
                  results.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelect(track)}
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-[var(--paper-warm)] transition-colors text-left cursor-pointer group"
                    >
                      {track.albumArt ? (
                        <img
                          src={track.albumArt}
                          alt={track.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-black/10 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[var(--rose)]/20 text-[var(--burgundy)] flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-bold text-xs text-[var(--text)] truncate leading-tight group-hover:text-[var(--burgundy)] transition-colors">
                          {track.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-soft)] font-mono truncate leading-tight mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs font-mono text-[var(--text-soft)] italic">
                    No songs found for &ldquo;{query}&rdquo;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
