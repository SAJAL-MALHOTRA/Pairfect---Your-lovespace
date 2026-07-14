"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { Tv, Play, Pause, RefreshCw, AlertCircle, Link2, Music, Loader2, Send } from "lucide-react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

export default function WatchPage() {
  const { user, pair, loading } = useAuth();
  
  const [videoUrl, setVideoUrl] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState("dQw4w9WgXcQ"); // Rickroll default
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  const supabase = createClient();
  const playerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef<number>(-1);

  // Parse YouTube video ID from URL
  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // 1. Initial State Fetch
  const fetchSessionState = async () => {
    if (!pair) return;
    try {
      const { data, error: fetchErr } = await supabase
        .from("youtube_sessions")
        .select("*")
        .eq("pair_id", pair.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (data) {
        setCurrentVideoId(data.video_id);
      }
    } catch (err) {
      console.error("Error loading watch session:", err);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchSessionState();
    }
  }, [pair, loading]);

  // 2. Load YouTube IFrame API
  useEffect(() => {
    // Only load if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Bind global ready callback
    window.onYouTubeIframeAPIReady = () => {
      initPlayer(currentVideoId);
    };

    if (window.YT && window.YT.Player) {
      initPlayer(currentVideoId);
    }

    return () => {
      // Cleanup player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentVideoId]);

  const initPlayer = (videoId: string) => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
      },
      events: {
        onStateChange: onPlayerStateChange,
        onReady: (event: any) => {
          // Player is ready, sync to initial state if needed
        }
      },
    });
  };

  // 3. Supabase Realtime Broadcast Listeners
  useEffect(() => {
    if (!pair || !user) return;

    const channelName = `watch-sync-${pair.id}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "sync" }, ({ payload }: any) => {
        if (payload.sender === user.id) return; // ignore own broadcast
        
        const player = playerRef.current;
        if (!player || !player.getPlayerState) return;

        // Set synchronization lock
        isSyncingRef.current = true;

        if (payload.action === "play") {
          const diff = Math.abs(player.getCurrentTime() - payload.time);
          if (diff > 1.5) {
            player.seekTo(payload.time, true);
          }
          player.playVideo();
        } else if (payload.action === "pause") {
          player.pauseVideo();
        } else if (payload.action === "seek") {
          player.seekTo(payload.time, true);
        } else if (payload.action === "load") {
          setCurrentVideoId(payload.videoId);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pair, user]);

  // 4. Handle Player State Changes (Play / Pause / Seek)
  const onPlayerStateChange = (event: any) => {
    const player = playerRef.current;
    if (!player || !channelRef.current || !user || !pair) return;

    const currentState = event.data;
    const time = player.getCurrentTime();

    // If change was triggered by broadcast sync, ignore and reset lock
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      lastStateRef.current = currentState;
      return;
    }

    // Prevent duplicate events
    if (currentState === lastStateRef.current) return;

    if (currentState === window.YT.PlayerState.PLAYING) {
      // Broadcast play event
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "play", time },
      });

      // Persist state to DB
      updateSessionDB(currentVideoId, time, true);
    } else if (currentState === window.YT.PlayerState.PAUSED) {
      // Broadcast pause event
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "pause", time },
      });

      // Persist state to DB
      updateSessionDB(currentVideoId, time, false);
    }

    lastStateRef.current = currentState;
  };

  const updateSessionDB = async (videoId: string, time: number, isPlaying: boolean) => {
    if (!pair || !user) return;
    try {
      await supabase.from("youtube_sessions").upsert({
        pair_id: pair.id,
        video_id: videoId,
        last_time: time,
        is_playing: isPlaying,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to persist player session:", err);
    }
  };

  const handleLoadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError("Please paste a valid YouTube watch URL or share link.");
      return;
    }

    setCurrentVideoId(videoId);
    setVideoUrl("");

    // Broadcast load event to partner
    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "load", videoId },
      });
    }

    // Persist to database
    await updateSessionDB(videoId, 0, false);
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
            <Tv className="w-7 h-7 text-primary" />
            <span>Watch Together</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Stream YouTube videos with synchronized controls. Play, pause, and seek instantly for both screens.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-accent/40 border border-border text-primary text-sm flex items-start space-x-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleLoadVideo} className="flex gap-3">
          <div className="relative flex-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/60">
              <Link2 className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Paste any YouTube video URL (e.g. https://www.youtube.com/watch?v=...)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm placeholder:text-muted-foreground/40 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-md bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 text-white font-bold text-sm active:scale-95 transition-all cursor-pointer shadow-md shadow-pink-500/10 dark:shadow-none"
          >
            Load Video
          </button>
        </form>

        {/* Sync Player Screen */}
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-border shadow-md relative">
          {/* 3px top gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa] z-20 pointer-events-none" />
          
          <div id="youtube-player" className="w-full h-full" />
        </div>

        {/* Note on sync behaviors */}
        <div className="p-4 rounded-lg border border-border bg-card text-xs text-muted-foreground leading-relaxed shadow-sm">
          💡 **How synchronization works**: When you play, pause, or change the video, websocket signals are broadcasted instantly to your partner. If the connection drops, reloading the page will query the database to sync both screens back onto the last played state automatically.
        </div>

      </main>
    </div>
  );
}
