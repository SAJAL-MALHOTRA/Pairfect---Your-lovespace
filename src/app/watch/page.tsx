"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Tv,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  Link2,
  Sparkles,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Heart,
  ListVideo,
  Radio,
  Flame,
  Monitor,
  Video,
  Film,
  ExternalLink,
  Info,
  SkipForward,
  Clapperboard,
  Music,
  Smile,
  Zap,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import { useNotifications } from "@/components/providers/notification-provider";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
    YT: any;
  }
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  senderName: string;
  x: number;
  burst?: boolean;
}

interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  addedBy: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const PRESET_VIDEOS = [
  { label: "☕ Lofi Hip Hop Radio", id: "jfKfPfyJRdk" },
  { label: "🔥 Cozy Fireplace & Rain", id: "L_LUpnjgPso" },
  { label: "🌌 Ghibli Piano Music", id: "0t3H-KjJtX0" },
  { label: "🌊 Ocean Waves 4K", id: "bn9F19Hi1Lk" },
];

const MOODS = [
  { id: "cozy", label: "🍿 Cozy", bgClass: "from-amber-950/20 via-background to-background" },
  { id: "rain", label: "🌧 Rain", bgClass: "from-slate-950/20 via-background to-background" },
  { id: "piano", label: "🎹 Piano", bgClass: "from-purple-950/20 via-background to-background" },
  { id: "romantic", label: "✨ Romantic", bgClass: "from-rose-950/20 via-background to-background" },
];

const SUGGESTED_TONIGHT = [
  { title: "Ghibli Lofi Studio Chill", search: "Ghibli Lofi Chill Beats", id: "0t3H-KjJtX0", type: "Music" },
  { title: "Interstellar Soundtrack Live", search: "Interstellar Main Theme Live Hans Zimmer", id: "UDVtMYqUA4w", type: "Movie Theme" },
  { title: "Cozy Coffee Shop Ambience", search: "Cozy Coffee Shop Ambience Jazz Music", id: "lP26UCnoHya", type: "Ambience" },
  { title: "Friends Funny Moments Comp", search: "Best of Friends Season 1-10 Compilation", id: "xH380y8qS6c", type: "Show" },
  { title: "Howl's Moving Castle Theme", search: "Merry Go Round of Life Piano", id: "38VzEMH76hU", type: "Anime" },
];

const REACTION_EMOJIS = ["❤️", "😂", "🥺", "😮", "🔥", "🍿", "👏", "😭"];

export default function WatchPage() {
  const { user, pair, partner, profile, loading } = useAuth();
  const { sendGameNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<"youtube" | "screenshare" | "guide">("youtube");
  const [selectedMood, setSelectedMood] = useState("cozy");
  const [videoUrl, setVideoUrl] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState("dQw4w9WgXcQ");
  const [error, setError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isPartnerPresent, setIsPartnerPresent] = useState(false);
  const [reactions, setReactions] = useState<FloatingEmoji[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [skipVotes, setSkipVotes] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Screen Sharing states
  const [isSharing, setIsSharing] = useState(false);
  const [isReceivingStream, setIsReceivingStream] = useState(false);
  const [isConnectingWebRTC, setIsConnectingWebRTC] = useState(false);
  const [remoteSharerName, setRemoteSharerName] = useState<string>("");
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);

  // Screen Sharing refs
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const supabase = createClient();
  const playerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef<number>(-1);

  useEffect(() => {
    if (pair && user) {
      sendGameNotification("Movie Night", "/watch");
    }
  }, [pair, user]);

  // Clean up screen share media & peer connections on component unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      closePeerConnection();
    };
  }, []);

  // Rebind stream targets whenever activeTab or stream states update
  useEffect(() => {
    if (activeTab === "screenshare") {
      if (isSharing && mediaStreamRef.current && screenVideoRef.current) {
        screenVideoRef.current.srcObject = mediaStreamRef.current;
      }
      if (isReceivingStream && remoteStreamRef.current && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [activeTab, isSharing, isReceivingStream]);

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
      if (data && data.video_id) {
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

  // 2. YouTube IFrame API Initialization
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer(currentVideoId);
    };

    if (window.YT && window.YT.Player) {
      initPlayer(currentVideoId);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [currentVideoId]);

  const initPlayer = (videoId: string) => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {}
    }

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onStateChange: onPlayerStateChange,
      },
    });
  };

  // 3. WebRTC Peer Connection Helper Methods
  const closePeerConnection = () => {
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    iceCandidatesQueueRef.current = [];
  };

  const createPeerConnection = (isSharer: boolean): RTCPeerConnection => {
    closePeerConnection();

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-ice",
          payload: { sender: user.id, candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const incomingStream = event.streams[0];
        remoteStreamRef.current = incomingStream;
        setIsReceivingStream(true);
        setIsConnectingWebRTC(false);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = incomingStream;
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setIsConnectingWebRTC(false);
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        setIsConnectingWebRTC(false);
        if (!isSharer && state !== "disconnected") {
          setIsReceivingStream(false);
          remoteStreamRef.current = null;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
      }
    };

    return pc;
  };

  const handleWebRTCOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    try {
      setIsConnectingWebRTC(true);
      setIsReceivingStream(true);
      setActiveTab("screenshare");

      const pc = createPeerConnection(false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      while (iceCandidatesQueueRef.current.length > 0) {
        const cand = iceCandidatesQueueRef.current.shift();
        if (cand) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-answer",
          payload: { sender: user.id, answer },
        });
      }
    } catch (err) {
      console.error("Error handling WebRTC offer:", err);
      setIsConnectingWebRTC(false);
      showSyncFeedback("Failed to connect to partner's screen share.");
    }
  };

  const handleWebRTCAnswer = async (answer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        while (iceCandidatesQueueRef.current.length > 0) {
          const cand = iceCandidatesQueueRef.current.shift();
          if (cand) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        }
      }
    } catch (err) {
      console.error("Error handling WebRTC answer:", err);
    }
  };

  const handleWebRTCIce = async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!candidate) return;

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    } else {
      iceCandidatesQueueRef.current.push(candidate);
    }
  };

  const handleRemoteScreenStop = () => {
    closePeerConnection();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    setIsReceivingStream(false);
    setIsConnectingWebRTC(false);
    setRemoteSharerName("");
    showSyncFeedback("Partner ended screen share.");
  };

  // 4. Supabase Realtime Broadcast & Presence Listener
  useEffect(() => {
    if (!pair || !user) return;

    const channelName = `watch-sync-${pair.id}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("broadcast", { event: "sync" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;

        const player = playerRef.current;
        if (!player || !player.getPlayerState) return;

        isSyncingRef.current = true;

        if (payload.action === "play") {
          const diff = Math.abs(player.getCurrentTime() - payload.time);
          if (diff > 1.5) {
            player.seekTo(payload.time, true);
          }
          player.playVideo();
          showSyncFeedback(`Synced: Partner resumed video`);
        } else if (payload.action === "pause") {
          player.pauseVideo();
          showSyncFeedback(`Synced: Partner paused video`);
        } else if (payload.action === "seek") {
          player.seekTo(payload.time, true);
          showSyncFeedback(`Synced: Partner seeked to ${Math.floor(payload.time)}s`);
        } else if (payload.action === "load") {
          setCurrentVideoId(payload.videoId);
          showSyncFeedback(`Partner loaded a new video!`);
        } else if (payload.action === "vote_skip") {
          handlePartnerSkipVote(payload.sender);
        }
      })
      .on("broadcast", { event: "reaction" }, ({ payload }: any) => {
        triggerEmojiAnimation(payload.emoji, payload.senderName || "Partner", payload.burst);
      })
      .on("broadcast", { event: "screen-start" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        setRemoteSharerName(payload.senderName || "Partner");
        setIsReceivingStream(true);
        setIsConnectingWebRTC(true);
        setActiveTab("screenshare");
        showSyncFeedback(`${payload.senderName || "Partner"} started Virtual Cinema screen sharing!`);
      })
      .on("broadcast", { event: "webrtc-offer" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        handleWebRTCOffer(payload.offer, payload.sender);
      })
      .on("broadcast", { event: "webrtc-answer" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        handleWebRTCAnswer(payload.answer);
      })
      .on("broadcast", { event: "webrtc-ice" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        handleWebRTCIce(payload.candidate);
      })
      .on("broadcast", { event: "screen-stop" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        handleRemoteScreenStop();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const partnerPresent = Object.keys(state).some((id) => id !== user.id);
        setIsPartnerPresent(partnerPresent);
        if (!partnerPresent && isReceivingStream) {
          handleRemoteScreenStop();
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pair, user, isReceivingStream]);

  const showSyncFeedback = (msg: string) => {
    setSyncStatus(msg);
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const triggerEmojiAnimation = (emoji: string, senderName: string, isBurst = false) => {
    const count = isBurst ? 8 : 1;
    const newItems: FloatingEmoji[] = [];

    for (let i = 0; i < count; i++) {
      const id = `${Date.now()}-${Math.random()}-${i}`;
      const x = Math.floor(Math.random() * 75) + 12;
      newItems.push({ id, emoji, senderName, x, burst: isBurst });
    }

    setReactions((prev) => [...prev, ...newItems].slice(-25));

    setTimeout(() => {
      const idsToRemove = new Set(newItems.map((n) => n.id));
      setReactions((prev) => prev.filter((r) => !idsToRemove.has(r.id)));
    }, 2800);
  };

  const sendReaction = (emoji: string, isBurst = false) => {
    if (!channelRef.current || !user) return;
    const senderName = profile?.display_name || "You";

    triggerEmojiAnimation(emoji, senderName, isBurst);

    channelRef.current.send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji, senderName, burst: isBurst },
    });
  };

  const forceSyncToPartner = () => {
    if (!channelRef.current || !user || !playerRef.current) return;
    const time = playerRef.current.getCurrentTime();
    channelRef.current.send({
      type: "broadcast",
      event: "sync",
      payload: { sender: user.id, action: "seek", time },
    });
    showSyncFeedback("Sent time-sync pulse to partner!");
  };

  const handleSkipVote = () => {
    if (!user) return;
    if (skipVotes.includes(user.id)) return;

    const newVotes = [...skipVotes, user.id];
    setSkipVotes(newVotes);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "vote_skip" },
      });
    }

    if (newVotes.length >= 2 || !isPartnerPresent) {
      playNextInQueue();
    } else {
      showSyncFeedback("Voted to skip (1/2 votes)");
    }
  };

  const handlePartnerSkipVote = (partnerId: string) => {
    setSkipVotes((prev) => {
      if (prev.includes(partnerId)) return prev;
      const updated = [...prev, partnerId];
      if (updated.length >= 2) {
        playNextInQueue();
      } else {
        showSyncFeedback("Partner voted to skip! (1/2 votes)");
      }
      return updated;
    });
  };

  const playNextInQueue = () => {
    setSkipVotes([]);
    if (queue.length > 0) {
      const nextItem = queue[0];
      setQueue((prev) => prev.slice(1));
      loadVideoById(nextItem.videoId);
      showSyncFeedback(`Skipped! Now playing: ${nextItem.title}`);
    } else {
      showSyncFeedback("Queue is empty.");
    }
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      setIsConnectingWebRTC(true);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1920, ideal: 1280 },
          height: { max: 1080, ideal: 720 },
          frameRate: { max: 30, ideal: 24 },
          cursor: "always",
        } as any,
        audio: true,
      });

      mediaStreamRef.current = stream;
      setIsSharing(true);
      setActiveTab("screenshare");
      showSyncFeedback("Virtual Cinema started! Switch to your streaming tab to watch together.");

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      // Handle stream end when user stops sharing via browser native floating bar
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      const pc = createPeerConnection(true);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "screen-start",
          payload: { sender: user.id, senderName: profile?.display_name || "Partner" },
        });

        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-offer",
          payload: { sender: user.id, offer },
        });
      }
    } catch (err: any) {
      setIsConnectingWebRTC(false);
      setIsSharing(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        showSyncFeedback("Screen sharing permission was cancelled.");
      } else {
        console.error("Screen share error:", err);
        setError(err?.message || "Screen sharing failed.");
      }
    }
  };

  const stopScreenShare = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }

    closePeerConnection();

    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "screen-stop",
        payload: { sender: user.id },
      });
    }

    setIsSharing(false);
    setIsConnectingWebRTC(false);
    showSyncFeedback("Virtual Cinema ended.");
  };

  const onPlayerStateChange = (event: any) => {
    const player = playerRef.current;
    if (!player || !channelRef.current || !user || !pair) return;

    const currentState = event.data;
    const time = player.getCurrentTime();

    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      lastStateRef.current = currentState;
      return;
    }

    if (currentState === lastStateRef.current) return;

    if (currentState === window.YT.PlayerState.PLAYING) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "play", time },
      });
      updateSessionDB(currentVideoId, time, true);
    } else if (currentState === window.YT.PlayerState.PAUSED) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "pause", time },
      });
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

    loadVideoById(videoId);
    setVideoUrl("");
  };

  const loadVideoById = async (videoId: string) => {
    setCurrentVideoId(videoId);

    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { sender: user.id, action: "load", videoId },
      });
    }

    await updateSessionDB(videoId, 0, false);
    showSyncFeedback("Loaded new video for both screens!");
  };

  const addToQueue = () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError("Please paste a valid YouTube link to add to queue.");
      return;
    }

    const newItem: QueueItem = {
      id: `${Date.now()}`,
      videoId,
      title: `YouTube Video (${videoId})`,
      addedBy: profile?.display_name || "You",
    };

    setQueue((prev) => [...prev, newItem]);
    setVideoUrl("");
    showSyncFeedback(`Added to queue!`);
  };

  if (loading || (pair && sessionLoading)) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg)]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--burgundy)]/25 border-t-[var(--burgundy)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <UnpairedPrompt
        title="Watch Together · Movie Night"
        description="Synchronized YouTube playback, floating emoji bursts, shared video queues, and virtual cinema screen sharing. Connect your partner to watch together."
        icon={Tv}
      />
    );
  }

  const partnerName = partner?.display_name || "Partner";
  const watchStreak = pair?.current_streak || 1;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 md:pb-8">
      <Navigation />

      <main
        className={`w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-6 transition-all ${
          isTheaterMode ? "max-w-6xl" : "max-w-4xl"
        }`}
      >
        {/* 🎬 MOVIE NIGHT DESTINATION HEADER */}
        <div className="p-6 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-heading font-bold text-[var(--burgundy)] tracking-tight flex items-center space-x-2.5">
                  <Clapperboard className="w-8 h-8 text-[var(--burgundy)]" />
                  <span>Movie Night</span>
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--burgundy)] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" /> {watchStreak} Day Watch Streak
                </span>
              </div>
              <p className="text-xs font-sans text-[var(--text-soft)] mt-1">
                Your private cinema for two. Stream YouTube, share Netflix & Prime tabs, and react together in real time.
              </p>
            </div>

            {/* Live Partner Status Card */}
            <div className="flex items-center gap-2">
              <div
                className={`px-4 py-2 rounded-full border text-xs font-mono font-medium flex items-center gap-2 shadow-xs transition-all ${
                  isPartnerPresent
                    ? "bg-emerald-950/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-soft)]"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPartnerPresent ? "bg-emerald-500 animate-pulse" : "bg-[var(--border)]"
                  }`}
                />
                <span>{isPartnerPresent ? `${partnerName} is waiting ❤️` : `Waiting for ${partnerName}`}</span>
              </div>

              <button
                type="button"
                onClick={forceSyncToPartner}
                className="p-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-soft)] hover:text-[var(--burgundy)] transition-all shadow-xs"
                title="Force time sync with partner"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="p-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-soft)] hover:text-[var(--burgundy)] transition-all shadow-xs"
                title="Toggle Theater Mode"
              >
                {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tonight's Mood Selector */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)] shrink-0">
              Tonight's Mood:
            </span>
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all shrink-0 shadow-xs ${
                  selectedMood === m.id
                    ? "bg-[var(--burgundy)] text-white font-bold"
                    : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--burgundy)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Mode Switcher Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("youtube")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "youtube"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
            }`}
          >
            <Tv className="w-4 h-4" /> ▶ YouTube Sync
          </button>

          <button
            onClick={() => setActiveTab("screenshare")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "screenshare"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
            }`}
          >
            <Monitor className="w-4 h-4" /> 📺 Virtual Cinema (Netflix/Prime)
            {(isSharing || isReceivingStream) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-4 py-2 rounded-full text-xs font-heading font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "guide"
                ? "bg-[var(--burgundy)] text-white shadow-xs"
                : "bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--text)]"
            }`}
          >
            <Info className="w-4 h-4" /> 💡 Streaming Guide
          </button>
        </div>

        {/* Toast Notification Bar */}
        <AnimatePresence>
          {syncStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 rounded-full bg-[var(--burgundy)] text-white text-xs font-sans font-medium shadow-md flex items-center gap-2 self-center"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{syncStatus}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 rounded-card bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--burgundy)] text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: YOUTUBE SYNC */}
        {activeTab === "youtube" && (
          <div className="space-y-6">
            {/* Input Bar */}
            <form onSubmit={handleLoadVideo} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-soft)]">
                  <Link2 className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Paste any YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="input-warm block w-full pl-10 pr-4 py-2.5 rounded-button text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary py-2.5 px-5 text-xs flex-1 sm:flex-none">
                  Play Now
                </button>
                <button
                  type="button"
                  onClick={addToQueue}
                  className="btn-secondary py-2.5 px-3 text-xs inline-flex items-center gap-1.5"
                  title="Add to Up Next Queue"
                >
                  <Plus className="w-4 h-4" /> Queue
                </button>
              </div>
            </form>

            {/* Quick Co-Watch Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-soft)] shrink-0">
                Quick Ambient Rooms:
              </span>
              {PRESET_VIDEOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadVideoById(preset.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-sans bg-[var(--paper-warm)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--burgundy)] hover:text-[var(--burgundy)] transition-all shrink-0 shadow-xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Sync Player Video Container */}
            <div className="relative aspect-video w-full rounded-card overflow-hidden bg-black border border-[var(--border)] shadow-xl paper-grain">
              <div className="accent-line absolute top-0 left-0 right-0 z-20 pointer-events-none" />

              <div id="youtube-player" className="w-full h-full" />

              {/* Floating Live Reactions Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                <AnimatePresence>
                  {reactions.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 150, scale: 0.5 }}
                      animate={{ opacity: 1, y: -40, scale: r.burst ? 1.8 : 1.4 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      style={{ left: `${r.x}%` }}
                      className="absolute bottom-6 flex flex-col items-center gap-0.5"
                    >
                      <span className="text-3xl filter drop-shadow-md">{r.emoji}</span>
                      <span className="text-[9px] font-mono bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {r.senderName}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Live Reaction Bar & Double-Tap Heart */}
            <div
              className="p-3 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs flex items-center justify-between gap-2 flex-wrap"
              onDoubleClick={() => sendReaction("❤️", true)}
              title="Double click anywhere here to send a Love Heart Shower!"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-bold text-[var(--burgundy)] flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-current" /> Express to {partnerName}:
                </span>
                <span className="text-[10px] font-mono text-[var(--text-soft)] hidden sm:inline">
                  (Double-click for Emoji Shower 🎉)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji, false)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      sendReaction(emoji, true);
                    }}
                    className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--burgundy)]/10 hover:scale-125 active:scale-95 transition-all text-base flex items-center justify-center border border-[var(--border)] shadow-xs"
                    title="Click for single emoji, Right click / Long press for Explosion!"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Up Next Queue & Turn-Based Controls */}
            {queue.length > 0 && (
              <div className="p-4 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[var(--burgundy)] flex items-center gap-2">
                    <ListVideo className="w-4 h-4" /> Up Next Queue ({queue.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSkipVote}
                      className="btn-secondary py-1 px-3 text-[11px] inline-flex items-center gap-1"
                    >
                      <SkipForward className="w-3.5 h-3.5" /> Vote Skip ({skipVotes.length}/2)
                    </button>
                    <button
                      onClick={() => setQueue([])}
                      className="text-[10px] font-mono text-[var(--text-soft)] hover:text-[var(--burgundy)]"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {queue.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[var(--text-soft)] font-bold">#{idx + 1}</span>
                        <div>
                          <p className="font-sans font-medium text-[var(--text)]">{item.title}</p>
                          <p className="text-[10px] text-[var(--text-soft)]">Added by {item.addedBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            loadVideoById(item.videoId);
                            setQueue((prev) => prev.filter((q) => q.id !== item.id));
                          }}
                          className="btn-primary py-1 px-3 text-[10px]"
                        >
                          Play Now
                        </button>
                        <button
                          onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))}
                          className="p-1 text-[var(--text-soft)] hover:text-[var(--burgundy)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🍿 SUGGESTED TONIGHT SELECTION */}
            <div className="p-4 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs space-y-3">
              <h3 className="font-heading font-bold text-sm text-[var(--burgundy)] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Suggested Tonight
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SUGGESTED_TONIGHT.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col justify-between space-y-2 hover:border-[var(--burgundy)]/50 transition-all"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[var(--burgundy)]/10 text-[var(--burgundy)]">
                        {s.type}
                      </span>
                      <p className="font-heading font-bold text-xs text-[var(--text)] mt-1">{s.title}</p>
                    </div>
                    <button
                      onClick={() => loadVideoById(s.id)}
                      className="btn-primary py-1 px-3 text-[10px] w-full"
                    >
                      Stream Together
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VIRTUAL CINEMA (REAL-TIME WEBRTC SCREEN SHARE FOR NETFLIX / PRIME) */}
        {activeTab === "screenshare" && (
          <div className="space-y-4">
            <div className="p-4 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-[var(--burgundy)] flex items-center gap-2">
                      <Monitor className="w-5 h-5" /> Virtual Cinema Mode
                    </h3>
                    {isSharing && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500 text-white animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live (Sharer)
                      </span>
                    )}
                    {isReceivingStream && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-600 text-white animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live ({remoteSharerName || partnerName})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-soft)] mt-0.5 leading-relaxed">
                    Real-time peer-to-peer tab & screen streaming over WebRTC. Share your browser tab to watch together with {partnerName}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isReceivingStream && (
                    <button
                      onClick={() => {
                        if (remoteVideoRef.current) {
                          remoteVideoRef.current.muted = !isRemoteMuted;
                          setIsRemoteMuted(!isRemoteMuted);
                        }
                      }}
                      className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5"
                      title={isRemoteMuted ? "Unmute Stream Audio" : "Mute Stream Audio"}
                    >
                      {isRemoteMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                      <span>{isRemoteMuted ? "Unmute" : "Mute"}</span>
                    </button>
                  )}

                  {!isSharing ? (
                    <button
                      onClick={startScreenShare}
                      disabled={isConnectingWebRTC}
                      className="btn-primary py-2.5 px-5 text-xs inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {isConnectingWebRTC ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span>Share Netflix / Prime Tab</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScreenShare}
                      className="btn-secondary py-2.5 px-4 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Stop Sharing
                    </button>
                  )}
                </div>
              </div>

              {/* Virtual Cinema Video Screen Container */}
              <div className="relative aspect-video w-full rounded-card overflow-hidden bg-black border border-[var(--border)] shadow-xl paper-grain flex items-center justify-center">
                <div className="accent-line absolute top-0 left-0 right-0 z-20 pointer-events-none" />

                {/* Local Sharer Video Screen */}
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${isSharing ? "block" : "hidden"}`}
                />

                {/* Remote Partner Incoming Video Screen */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={isRemoteMuted}
                  className={`w-full h-full object-contain ${isReceivingStream && !isSharing ? "block" : "hidden"}`}
                />

                {/* Connecting WebRTC Spinner */}
                {isConnectingWebRTC && (
                  <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-[var(--burgundy)] animate-spin" />
                    <p className="font-heading font-bold text-sm text-white">Establishing Secure WebRTC Connection...</p>
                    <p className="text-xs text-stone-300 max-w-xs">Connecting peer-to-peer stream with {partnerName}.</p>
                  </div>
                )}

                {/* Cinema Screen Offline Placeholder */}
                {!isSharing && !isReceivingStream && !isConnectingWebRTC && (
                  <div className="text-center p-6 space-y-3">
                    <Film className="w-12 h-12 text-[var(--burgundy)]/40 mx-auto" />
                    <div>
                      <p className="font-heading font-bold text-sm text-white">Cinema Screen Offline</p>
                      <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        Click "Share Netflix / Prime Tab" above to start streaming live over WebRTC. In the browser popup, select your streaming tab and make sure "Also share tab audio" is enabled.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STREAMING GUIDE FOR NETFLIX / PRIME */}
        {activeTab === "guide" && (
          <div className="p-6 rounded-card bg-[var(--paper-warm)] border border-[var(--border)] paper-grain shadow-xs space-y-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-[var(--burgundy)] flex items-center gap-2">
                <Film className="w-5 h-5" /> How Co-Watching Netflix & Amazon Prime Works
              </h3>
              <p className="text-xs text-[var(--text-soft)] mt-1 leading-relaxed">
                Some streaming services (like Netflix, Amazon Prime Video, and Disney+) protect copyrighted video with DRM (Digital Rights Management). Depending on your browser, operating system, and DRM policy, video or audio capture may vary. Here are the best ways to co-watch:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Method 1: Virtual Cinema */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--burgundy)] text-white">
                  Method 1 (Built-In WebRTC)
                </span>
                <h4 className="font-heading font-bold text-sm text-[var(--text)]">
                  Pairfect Virtual Cinema (Tab Share)
                </h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Switch to the **Virtual Cinema** tab inside Pairfect. Click "Share Netflix / Prime Tab" and enable tab audio. WebRTC stream will transmit live to your partner inside Pairfect!
                </p>
              </div>

              {/* Method 2: Teleparty Extension */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--burgundy)] text-white">
                  Method 2 (Native Extension)
                </span>
                <h4 className="font-heading font-bold text-sm text-[var(--text)]">
                  Teleparty (Netflix Party) Extension
                </h4>
                <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                  Install the free Teleparty Chrome/Edge browser extension. Open Netflix or Prime, click Teleparty to generate a party link, and send it to your partner. Play/pause will sync directly inside Netflix/Prime!
                </p>
                <a
                  href="https://www.teleparty.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--burgundy)] hover:underline pt-1"
                >
                  Get Teleparty Extension <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Sync Info Footer */}
        <div className="p-4 rounded-card border border-[var(--border)] bg-[var(--paper-warm)] text-xs text-[var(--text-soft)] leading-relaxed shadow-xs paper-grain">
          💡 **Real-time Movie Night Active**: Playback, WebRTC screen sharing, seeking, and floating reactions sync live across both partner devices via Supabase Realtime WebSockets.
        </div>
      </main>
    </div>
  );
}
