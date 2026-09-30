"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, Music } from "lucide-react";
import Image from "next/image";

export interface MixtapePlayerTrack {
  id?: string;
  title: string;
  artist?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  duration?: string;
}

interface RetroAudioPlayerProps {
  tracks: MixtapePlayerTrack[];
  currentIndex: number;
  onTrackChange: (index: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  className?: string;
}

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function RetroAudioPlayer({
  tracks,
  currentIndex,
  onTrackChange,
  onPlaybackStateChange,
  className = "",
}: RetroAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = tracks[currentIndex] || tracks[0];
  const videoId = currentTrack ? extractYouTubeId(currentTrack.youtube_url) : null;

  // Notify parent of playback state changes
  const updatePlayState = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      onPlaybackStateChange?.(playing);
    },
    [onPlaybackStateChange]
  );

  // Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiLoaded(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiLoaded(true);
    };
  }, []);

  // Initialize or re-create YouTube player when API is ready
  useEffect(() => {
    if (!isApiLoaded || !videoId) return;

    if (playerRef.current) {
      try {
        playerRef.current.loadVideoById(videoId);
        return;
      } catch (e) {
        // Player error, fall through to re-init
      }
    }

    const playerId = "mixtape-yt-iframe";
    let targetEl = document.getElementById(playerId);
    if (!targetEl) return;

    try {
      playerRef.current = new window.YT.Player(playerId, {
        height: "1",
        width: "1",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              updatePlayState(true);
            } else if (event.data === 2) {
              updatePlayState(false);
            } else if (event.data === 0) {
              // Auto advance
              updatePlayState(false);
              if (currentIndex < tracks.length - 1) {
                onTrackChange(currentIndex + 1);
              }
            }
          },
        },
      });
    } catch (err) {
      console.error("YouTube Player init error:", err);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isApiLoaded, videoId, currentIndex, tracks.length, onTrackChange, updatePlayState]);

  // Polling current time while playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          try {
            const cur = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur > 0) setDuration(dur);
          } catch (e) {
            // ignore
          }
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) {
      // Fallback if player isn't loaded or interactive
      updatePlayState(!isPlaying);
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        updatePlayState(false);
      } else {
        playerRef.current.playVideo();
        updatePlayState(true);
      }
    } catch (e) {
      updatePlayState(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(val, true);
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handlePrev = () => {
    if (currentTime > 3) {
      // Restart current song
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(0, true);
      }
      setCurrentTime(0);
    } else if (currentIndex > 0) {
      onTrackChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < tracks.length - 1) {
      onTrackChange(currentIndex + 1);
    }
  };

  if (!currentTrack) {
    return null;
  }

  // Generate thumbnail fallback
  const thumbUrl =
    currentTrack.thumbnail_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto rounded-2xl bg-white/95 backdrop-blur-md border border-[var(--border)] shadow-[0_15px_35px_rgba(232,82,125,0.08)] p-4 sm:p-5 select-none ${className}`}
      style={{ maxWidth: 460, width: "100%" }}
    >
      {/* Hidden YouTube Iframe Mount */}
      <div className="absolute opacity-0 pointer-events-none -z-50 w-1 h-1 overflow-hidden">
        <div id="mixtape-yt-iframe" />
      </div>

      <div className="flex items-center gap-4">
        {/* Track Thumbnail */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 shadow-sm flex items-center justify-center">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="w-7 h-7 text-zinc-400" />
          )}

          {/* Mini Playing Status Overlay */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-end gap-1 h-4">
                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.1s]" style={{ height: "60%" }} />
                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.3s]" style={{ height: "100%" }} />
                <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" style={{ height: "80%" }} />
              </div>
            </div>
          )}
        </div>

        {/* Track Details & Scrubber */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-sans font-semibold text-zinc-900 text-sm sm:text-base truncate leading-snug">
                {currentTrack.title}
              </h4>
              {currentTrack.artist && currentTrack.artist.toLowerCase() !== "unknown artist" && (
                <p className="font-sans text-xs sm:text-sm text-zinc-500 truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              )}
            </div>

            {currentTrack.youtube_url && (
              <a
                href={currentTrack.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
                title="Open in YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Scrubber Bar */}
          <div className="mt-3">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[var(--burgundy)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
        <div className="text-[11px] font-mono text-zinc-400">
          TRACK {currentIndex + 1} / {tracks.length}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Previous Track */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 && currentTime < 3}
            className="p-2 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--burgundy)] text-white flex items-center justify-center hover:bg-[#D13D68] transition-transform active:scale-95 shadow-md cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= tracks.length - 1}
            className="p-2 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 disabled:hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Volume Mute */}
        <button
          onClick={toggleMute}
          className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors rounded-full"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
