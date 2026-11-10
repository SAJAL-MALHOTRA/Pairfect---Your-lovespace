"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music, CloudRain, Flame, Moon, Disc, ChevronDown, ChevronUp } from "lucide-react";
import { setSoundscape, setSoundscapeVolume, SoundscapeTrack } from "@/lib/audio/soundscape";

const TRACKS: { id: SoundscapeTrack; name: string; icon: any }[] = [
  { id: "off", name: "Mute", icon: VolumeX },
  { id: "rain", name: "Rain", icon: CloudRain },
  { id: "fireplace", name: "Hearth", icon: Flame },
  { id: "night", name: "Night", icon: Moon },
  { id: "vinyl", name: "Vinyl", icon: Disc },
];

export default function AmbientSoundscapeBar() {
  const [currentTrack, setCurrentTrack] = useState<SoundscapeTrack>("off");
  const [volume, setVolume] = useState<number>(0.3);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTrack = (localStorage.getItem("pairfect_ambient_track") as SoundscapeTrack) || "off";
    const savedVol = localStorage.getItem("pairfect_ambient_vol");
    const parsedVol = savedVol ? parseFloat(savedVol) : 0.3;

    if (savedTrack && savedTrack !== "off") {
      // Don't autoplay with sound immediately to respect browser user-gesture policy, but keep selection ready
      setCurrentTrack("off");
    }
    setVolume(parsedVol);
  }, []);

  const handleSelectTrack = (track: SoundscapeTrack) => {
    setCurrentTrack(track);
    setSoundscape(track, volume);
    if (typeof window !== "undefined") {
      localStorage.setItem("pairfect_ambient_track", track);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setSoundscapeVolume(newVol);
    if (typeof window !== "undefined") {
      localStorage.setItem("pairfect_ambient_vol", String(newVol));
    }
  };

  const activeTrackObj = TRACKS.find((t) => t.id === currentTrack) || TRACKS[0];
  const ActiveIcon = activeTrackObj.icon;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 transition-all">
      <div className="bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-lg shadow-black/5 overflow-hidden text-[var(--text)] transition-all">
        {/* Compact Bar */}
        <div className="flex items-center gap-2 p-2 px-3">
          <button
            onClick={() => handleSelectTrack(currentTrack === "off" ? "rain" : "off")}
            className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5
              ${currentTrack !== "off"
                ? "bg-[var(--burgundy)]/10 text-[var(--burgundy)]"
                : "hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-soft)]"
              }`}
            title={currentTrack !== "off" ? "Stop ambient sound" : "Start cozy date night soundscape"}
          >
            <ActiveIcon className="w-4 h-4" />
            <span className="text-xs font-medium">
              {currentTrack !== "off" ? activeTrackObj.name : "Soundscape"}
            </span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-[var(--text-soft)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={expanded ? "Collapse sound controls" : "Change soundscape track or volume"}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Controls Panel */}
        {expanded && (
          <div className="p-3 pt-1 border-t border-[var(--border)] space-y-3 min-w-[210px] animate-fade-in">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)]">
              <span>Cozy Ambience</span>
              <span>Web Audio</span>
            </div>

            {/* Track Selection Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {TRACKS.map((t) => {
                const Icon = t.icon;
                const isSelected = currentTrack === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrack(t.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer
                      ${isSelected
                        ? "bg-[var(--burgundy)] text-white font-bold shadow-sm"
                        : "bg-[var(--bg)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text)] border border-[var(--border)]"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            {currentTrack !== "off" && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-soft)]">
                  <span>Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--burgundy)]"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
