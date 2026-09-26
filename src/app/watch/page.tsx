"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import PlusPaywallModal from "@/components/plus-paywall-modal";
import { FloatingHeartsLayer, FloatingHeartItem } from "@/components/watch/floating-hearts";
import { SessionChat, SessionChatMessage } from "@/components/watch/session-chat";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Heart,
  Loader2,
  Sparkles,
  AlertCircle,
  PhoneCall,
  Crown,
  Users,
  RefreshCw,
  Info,
  Maximize2,
  Minimize2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

type SessionMode = "camera" | "screenshare";
type SessionState = "idle" | "waiting" | "connecting" | "connected" | "reconnecting" | "ended";

export default function WatchPage() {
  const { user, profile, pair, partner, loading: authLoading } = useAuth();
  const { isPlus, loading: subLoading } = useSubscription();
  const supabase = createClient();

  // Session lifecycle & mode
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [sessionMode, setSessionMode] = useState<SessionMode>("camera");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);

  // Presence & status
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false);
  const [isPartnerInCall, setIsPartnerInCall] = useState<boolean>(false);
  const [incomingCallFromPartner, setIncomingCallFromPartner] = useState<boolean>(false);
  const [strictNatWarning, setStrictNatWarning] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Media track states
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCamMuted, setIsCamMuted] = useState<boolean>(false);
  const [isPartnerMicMuted, setIsPartnerMicMuted] = useState<boolean>(false);
  const [isPartnerCamMuted, setIsPartnerCamMuted] = useState<boolean>(false);

  // Feature detection for screen share (desktop vs mobile)
  const [canScreenShare, setCanScreenShare] = useState<boolean>(false);

  // Overlay chat & reactions
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<SessionChatMessage[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeartItem[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Paywall modal
  const [showPaywall, setShowPaywall] = useState<boolean>(false);

  // Video element & stream refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  const partnerName = partner?.display_name || "your partner";
  const myName = profile?.display_name || "You";

  // Check displayMedia capability once on client mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices && "getDisplayMedia" in navigator.mediaDevices) {
      setCanScreenShare(true);
    }
  }, []);

  // Duration timer
  useEffect(() => {
    if (sessionState === "connected") {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (sessionState === "idle") setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sessionState]);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // ─── WebRTC Peer Connection Cleaners & Builders ───
  const cleanupMediaStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

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

  const createPeerConnection = (isCallInitiator: boolean): RTCPeerConnection => {
    closePeerConnection();

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Send ICE candidates to partner over Supabase Realtime broadcast
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-ice",
          payload: { sender: user.id, candidate: event.candidate.toJSON() },
        });
      }
    };

    // Receive partner incoming remote audio/video tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setSessionState("connected");
      }
    };

    // Monitor connection states
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setSessionState("connected");
        setStrictNatWarning(false);
      } else if (state === "disconnected") {
        setSessionState("reconnecting");
      } else if (state === "failed") {
        setStrictNatWarning(true);
        setSessionState("reconnecting");
      } else if (state === "closed") {
        if (sessionState === "connected" || sessionState === "reconnecting") {
          setSessionState("ended");
        }
      }
    };

    return pc;
  };

  // ─── WebRTC Signaling Handlers ───
  const handleRemoteOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    if (!user) return;
    try {
      setSessionState("connecting");

      // Obtain local media stream if not active
      let localStream = localStreamRef.current;
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }

      const pc = createPeerConnection(false);

      // Add local tracks to peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream!);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      while (iceCandidatesQueueRef.current.length > 0) {
        const cand = iceCandidatesQueueRef.current.shift();
        if (cand) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-answer",
          payload: { sender: user.id, answer },
        });
      }
    } catch (err) {
      console.error("Error answering WebRTC offer:", err);
      showNotice("Failed to connect video call.");
      setSessionState("idle");
    }
  };

  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush queued ICE candidates
        while (iceCandidatesQueueRef.current.length > 0) {
          const cand = iceCandidatesQueueRef.current.shift();
          if (cand) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        }
      }
    } catch (err) {
      console.error("Error setting remote answer:", err);
    }
  };

  const handleRemoteIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!candidate) return;

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding remote ICE candidate:", err);
      }
    } else {
      iceCandidatesQueueRef.current.push(candidate);
    }
  };

  // ─── Supabase Realtime Channel (Signaling + Presence + Chat + Reactions) ───
  useEffect(() => {
    if (!pair || !user) return;

    const channelName = `watch-session:${pair.id}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      // WebRTC SDP Offer
      .on("broadcast", { event: "webrtc-offer" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        setIncomingCallFromPartner(false);
        handleRemoteOffer(payload.offer, payload.sender);
      })
      // WebRTC SDP Answer
      .on("broadcast", { event: "webrtc-answer" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        handleRemoteAnswer(payload.answer);
      })
      // WebRTC ICE Candidate
      .on("broadcast", { event: "webrtc-ice" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        handleRemoteIceCandidate(payload.candidate);
      })
      // Live Invite Notification
      .on("broadcast", { event: "session-invite" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        setSessionId(payload.sessionId);
        setSessionMode(payload.mode || "camera");
        setIncomingCallFromPartner(true);
      })
      // Partner ended session
      .on("broadcast", { event: "session-ended" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        closePeerConnection();
        cleanupMediaStreams();
        setSessionState("ended");
        showNotice(`${partnerName} ended the call.`);
      })
      // Track muting indicators
      .on("broadcast", { event: "track-muted" }, ({ payload }: any) => {
        if (payload.sender === user.id) return;
        if (payload.kind === "audio") setIsPartnerMicMuted(payload.muted);
        if (payload.kind === "video") setIsPartnerCamMuted(payload.muted);
      })
      // Live In-Call Chat Message
      .on("broadcast", { event: "chat-message" }, ({ payload }: any) => {
        setChatMessages((prev) => [...prev, payload.message]);
        if (!isChatOpen) {
          setUnreadChatCount((prev) => prev + 1);
        }
      })
      // Live Floating Heart Reaction
      .on("broadcast", { event: "heart-reaction" }, ({ payload }: any) => {
        spawnFloatingHeart(payload.senderName, payload.color || "burgundy");
      })
      // Supabase Presence Tracking
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const partnerPresence = Object.entries(state).find(([id]) => id !== user.id);

        if (partnerPresence) {
          setIsPartnerOnline(true);
          const pData = (partnerPresence[1] as any)?.[0];
          setIsPartnerInCall(Boolean(pData?.in_call));
        } else {
          setIsPartnerOnline(false);
          setIsPartnerInCall(false);
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            display_name: profile?.display_name || "Partner",
            in_call: sessionState === "connected" || sessionState === "waiting",
            mode: sessionMode,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      closePeerConnection();
      cleanupMediaStreams();
    };
  }, [pair?.id, user?.id, sessionState]);

  // Update presence whenever call state or mode changes
  useEffect(() => {
    if (channelRef.current && user) {
      channelRef.current.track({
        display_name: profile?.display_name || "Partner",
        in_call: sessionState === "connected" || sessionState === "waiting",
        mode: sessionMode,
        online_at: new Date().toISOString(),
      });
    }
  }, [sessionState, sessionMode]);

  // Check active session on mount
  useEffect(() => {
    if (!pair) return;
    fetch("/api/watch/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSessionId(data.session.id);
          if (data.session.status === "waiting" && data.session.initiator_id !== user?.id) {
            setIncomingCallFromPartner(true);
            setSessionMode(data.session.mode || "camera");
          }
        }
      })
      .catch(() => {});
  }, [pair]);

  // ─── Floating Heart Trigger ───
  const spawnFloatingHeart = (senderName: string, color: "rose" | "burgundy" = "burgundy") => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.floor(Math.random() * 65) + 15; // 15% - 80%
    const scale = Math.random() * 0.4 + 0.9; // 0.9 - 1.3
    const newHeart: FloatingHeartItem = { id, senderName, x, scale, color };

    setFloatingHearts((prev) => [...prev, newHeart].slice(-18));

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 3400);
  };

  const handleSendHeart = (color: "rose" | "burgundy" = "burgundy") => {
    spawnFloatingHeart(myName, color);
    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "heart-reaction",
        payload: { sender: user.id, senderName: myName, color },
      });
    }
  };

  // ─── In-Call Chat Sender ───
  const handleSendChatMessage = (content: { text?: string; gifUrl?: string; emoji?: string }) => {
    if (!user) return;
    const msg: SessionChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: user.id,
      senderName: myName,
      text: content.text,
      gifUrl: content.gifUrl,
      emoji: content.emoji,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, msg]);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat-message",
        payload: { message: msg },
      });
    }
  };

  // ─── Start Call (Initiator Flow) ───
  const startSession = async (mode: SessionMode = "camera") => {
    if (!isPlus) {
      setShowPaywall(true);
      return;
    }

    try {
      setSessionMode(mode);
      setIsInitiator(true);
      setSessionState("waiting");

      // 1. Get media stream
      let stream: MediaStream;
      if (mode === "screenshare" && canScreenShare) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });
        stream.getVideoTracks()[0].onended = () => {
          endSession();
        };
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Start session in DB & trigger partner invite
      const res = await fetch("/api/watch/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresPlus) {
          cleanupMediaStreams();
          setSessionState("idle");
          setShowPaywall(true);
          return;
        }
        throw new Error(data.error || "Failed to start call");
      }

      setSessionId(data.session?.id || null);

      // 3. Broadcast invite through Realtime channel
      if (channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "session-invite",
          payload: {
            sender: user.id,
            sessionId: data.session?.id,
            mode,
          },
        });
      }

      // 4. Create WebRTC offer
      const pc = createPeerConnection(true);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channelRef.current && user) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-offer",
          payload: { sender: user.id, offer },
        });
      }
    } catch (err: any) {
      console.error("Start session error:", err);
      cleanupMediaStreams();
      setSessionState("idle");
      if (err.name !== "NotAllowedError" && err.name !== "PermissionDeniedError") {
        showNotice(err.message || "Could not start video session.");
      }
    }
  };

  // ─── Join Call (Receiver Flow) ───
  const joinIncomingSession = async () => {
    if (!isPlus) {
      setShowPaywall(true);
      return;
    }

    try {
      setIncomingCallFromPartner(false);
      setSessionState("connecting");

      // Inform API that we are joining
      await fetch("/api/watch/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: sessionMode }),
      });

      // Get local camera & mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // If we already have the offer queued or pc established
      if (pcRef.current && pcRef.current.remoteDescription) {
        stream.getTracks().forEach((track) => {
          pcRef.current?.addTrack(track, stream);
        });
      }
    } catch (err: any) {
      console.error("Join call error:", err);
      setSessionState("idle");
      showNotice("Could not join video session.");
    }
  };

  // ─── End Call / Cancel ───
  const endSession = async () => {
    closePeerConnection();
    cleanupMediaStreams();
    setSessionState("ended");
    setIncomingCallFromPartner(false);

    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "session-ended",
        payload: { sender: user.id },
      });
    }

    try {
      await fetch("/api/watch/session/end", { method: "POST" });
    } catch (e) {}
  };

  // ─── Toggle Mic / Camera ───
  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMicMuted(muted);
        if (channelRef.current && user) {
          channelRef.current.send({
            type: "broadcast",
            event: "track-muted",
            payload: { sender: user.id, kind: "audio", muted },
          });
        }
      }
    }
  };

  const toggleCam = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const muted = !videoTrack.enabled;
        setIsCamMuted(muted);
        if (channelRef.current && user) {
          channelRef.current.send({
            type: "broadcast",
            event: "track-muted",
            payload: { sender: user.id, kind: "video", muted },
          });
        }
      }
    }
  };

  // ─── Mode Switch (Camera <-> Screen-share during active call) ───
  const switchSessionMode = async (targetMode: SessionMode) => {
    if (targetMode === "screenshare" && !canScreenShare) {
      showNotice("Screen sharing is supported on desktop browsers.");
      return;
    }

    try {
      let newStream: MediaStream;
      if (targetMode === "screenshare") {
        newStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });
        newStream.getVideoTracks()[0].onended = () => {
          switchSessionMode("camera");
        };
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      }

      const pc = pcRef.current;
      if (pc) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        const newVideoTrack = newStream.getVideoTracks()[0];

        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      localStreamRef.current = newStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }

      setSessionMode(targetMode);
      showNotice(`Switched to ${targetMode === "screenshare" ? "Screen Sharing" : "Camera"}`);
    } catch (e: any) {
      console.error("Failed to switch stream mode:", e);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Loading / Unpaired Guards ───
  if (authLoading || subLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[var(--bg)]">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 rounded-full text-[#E8527D] animate-spin" />
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <UnpairedPrompt
        title="Watch Together"
        description="Private 1:1 real-time video calls and cinema screen sharing for the two of you. Connect your partner to start your first session."
        icon={Video}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FFF5F8] text-[#3D2432] pb-24 md:pb-8 selection:bg-[#E8527D] selection:text-white">
      <Navigation />

      <main
        className={`w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-6 transition-all ${
          isTheaterMode ? "max-w-6xl" : "max-w-4xl"
        }`}
      >
        {/* Top Header Card */}
        <div className="p-6 rounded-[28px] bg-white/95 border border-[#FFD9E3] paper-grain shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D]">
                  <Video className="w-5 h-5" />
                </span>
                <h1 className="font-display italic font-bold text-3xl text-[#3D2432] tracking-tight">
                  Watch Together
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFF0F4] text-[#802030] border border-[#FFD9E3] uppercase tracking-wider">
                  1:1 Live
                </span>
              </div>
              <p className="text-xs text-[#7A4B5D] mt-1 leading-relaxed">
                Direct peer-to-peer video calls and co-streaming for you &amp; {partnerName}.
              </p>
            </div>

            {/* Live Presence Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3.5 py-1.5 rounded-full border text-xs font-mono flex items-center gap-2 shadow-2xs ${
                  isPartnerInCall
                    ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                    : isPartnerOnline
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-[#FFF9FB] border-[#FFD9E3] text-[#7A4B5D]"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPartnerInCall
                      ? "bg-rose-500 animate-ping"
                      : isPartnerOnline
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-stone-300"
                  }`}
                />
                <span>
                  {isPartnerInCall
                    ? `${partnerName} in session`
                    : isPartnerOnline
                    ? `${partnerName} is online`
                    : `${partnerName} offline`}
                </span>
              </div>

              {sessionState === "connected" && (
                <button
                  type="button"
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className="p-2 rounded-full border border-[#FFD9E3] bg-white text-[#7A4B5D] hover:text-[#E8527D] transition-colors"
                  title="Toggle Theater Mode"
                >
                  {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notice toast */}
        <AnimatePresence>
          {noticeMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-2 rounded-full bg-[#E8527D] text-white text-xs font-mono font-medium shadow-md flex items-center gap-2 self-center z-30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{noticeMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Strict NAT Firewall Notice (if WebRTC cannot negotiate peer connection) */}
        {strictNatWarning && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Strict Firewall Detected</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Direct peer-to-peer connection couldn't traverse your local Wi-Fi / carrier network. A dedicated TURN relay server will be needed for this specific network setup.
              </p>
            </div>
          </div>
        )}

        {/* ─── INCOMING CALL BANNER (Receiver alert) ─── */}
        <AnimatePresence>
          {incomingCallFromPartner && sessionState === "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-[28px] bg-gradient-to-r from-[#FFF0F4] to-[#FFE6EE] border-2 border-[#E8527D] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-full bg-[#E8527D] text-white flex items-center justify-center animate-bounce shadow-md">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display italic font-bold text-xl text-[#3D2432]">
                    {partnerName} is calling you!
                  </h3>
                  <p className="text-xs text-[#7A4B5D] mt-0.5">
                    Tap join to connect your 1:1 video session now.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setIncomingCallFromPartner(false)}
                  className="flex-1 sm:flex-none btn-journal-ghost py-2.5 px-4 text-xs font-mono"
                >
                  Dismiss
                </button>
                <button
                  onClick={joinIncomingSession}
                  className="flex-1 sm:flex-none btn-journal py-2.5 px-6 text-xs font-mono font-bold tracking-wider uppercase shadow-md hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer"
                >
                  Join Call ▷
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════
            STATE 1: IDLE — START SESSION SELECTION CARD
           ═══════════════════════════════════════════════════════════════ */}
        {sessionState === "idle" && (
          <div className="p-8 sm:p-10 rounded-[32px] bg-white/95 border border-[#FFD9E3] paper-grain shadow-md space-y-8 text-center">
            <div className="max-w-md mx-auto space-y-2.5">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D] flex items-center justify-center mx-auto shadow-xs">
                <Video className="w-7 h-7" />
              </div>
              <h2 className="font-display italic font-bold text-3xl text-[#3D2432]">
                Start Watch Together
              </h2>
              <p className="text-xs text-[#7A4B5D] leading-relaxed">
                Connect in real time with {partnerName}. Choose whether to chat face-to-face on camera or co-stream your screen.
              </p>
            </div>

            {/* Mode selection cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
              {/* Option 1: Camera Call (Primary) */}
              <div
                onClick={() => setSessionMode("camera")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 relative ${
                  sessionMode === "camera"
                    ? "bg-[#FFF9FB] border-[#E8527D] shadow-sm ring-2 ring-[#E8527D]/20"
                    : "bg-white border-[#FFD9E3] hover:border-[#E8527D]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#FFF0F4] text-[#E8527D]">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">
                    Mobile &amp; Desktop
                  </span>
                </div>
                <h3 className="font-display italic font-bold text-base text-[#3D2432]">
                  1:1 Video Call
                </h3>
                <p className="text-xs text-[#7A4B5D] leading-relaxed">
                  Face-to-face live stream using front camera and audio. Works reliably across mobile and desktop.
                </p>
              </div>

              {/* Option 2: Screen Sharing (Co-Watch Desktop) */}
              <div
                onClick={() => {
                  if (canScreenShare) {
                    setSessionMode("screenshare");
                  }
                }}
                className={`p-5 rounded-2xl border-2 transition-all space-y-2 relative ${
                  !canScreenShare
                    ? "opacity-60 cursor-not-allowed bg-[#FAF7F2] border-[#EADFD0]"
                    : sessionMode === "screenshare"
                    ? "bg-[#FFF9FB] border-[#E8527D] shadow-sm ring-2 ring-[#E8527D]/20 cursor-pointer"
                    : "bg-white border-[#FFD9E3] hover:border-[#E8527D]/50 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#FFF0F4] text-[#E8527D]">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${
                    canScreenShare
                      ? "bg-purple-50 text-purple-800 border-purple-200"
                      : "bg-stone-100 text-stone-600 border-stone-200"
                  }`}>
                    {canScreenShare ? "Desktop Co-Stream" : "Desktop Only"}
                  </span>
                </div>
                <h3 className="font-display italic font-bold text-base text-[#3D2432]">
                  Screen Sharing
                </h3>
                <p className="text-xs text-[#7A4B5D] leading-relaxed">
                  Stream your browser tab or desktop to watch Netflix, YouTube, or photos together.
                </p>
              </div>
            </div>

            {/* Launch CTA Button */}
            <div className="pt-2">
              <button
                onClick={() => startSession(sessionMode)}
                className="btn-journal py-3 px-8 text-xs font-mono font-bold tracking-wider uppercase shadow-md hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                <span>Start Call ({sessionMode === "camera" ? "Camera Mode" : "Screen Share"}) ▷</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STATE 2: WAITING — CALLING PARTNER RINGING PULSE
           ═══════════════════════════════════════════════════════════════ */}
        {sessionState === "waiting" && (
          <div className="p-10 rounded-[32px] bg-white/95 border border-[#FFD9E3] paper-grain shadow-md text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#E8527D]/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-[#FFF0F4] border-2 border-[#E8527D] text-[#E8527D] flex items-center justify-center shadow-md">
                <PhoneCall className="w-9 h-9" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-display italic font-bold text-2xl text-[#3D2432]">
                Calling {partnerName}...
              </h3>
              <p className="text-xs text-[#7A4B5D]">
                {isPartnerOnline
                  ? `${partnerName} is online. Waiting for them to accept.`
                  : `Notification sent to ${partnerName}. Waiting for them to join.`}
              </p>
            </div>

            {/* Self preview while waiting */}
            <div className="max-w-xs mx-auto aspect-video rounded-2xl overflow-hidden bg-black border border-[#FFD9E3] shadow-md relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-black/60 text-white px-2 py-0.5 rounded-full">
                Your Camera
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={endSession}
                className="btn-secondary py-2.5 px-6 text-xs font-mono text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
              >
                Cancel Call
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STATE 3 & 4: CONNECTING / CONNECTED / RECONNECTING VIDEO STAGE
           ═══════════════════════════════════════════════════════════════ */}
        {(sessionState === "connecting" ||
          sessionState === "connected" ||
          sessionState === "reconnecting") && (
          <div className="space-y-4">
            {/* Live Session Viewport Container */}
            <div
              className="relative aspect-video w-full rounded-[28px] overflow-hidden bg-black border border-[#FFD9E3] shadow-2xl paper-grain select-none cursor-pointer"
              onDoubleClick={() => handleSendHeart("burgundy")}
              title="Double tap anywhere to shower love hearts!"
            >
              {/* Floating Hearts Layer */}
              <FloatingHeartsLayer hearts={floatingHearts} />

              {/* Main Remote Partner Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />

              {/* Reconnection / Connecting Overlay */}
              {(sessionState === "connecting" || sessionState === "reconnecting") && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                  <Loader2 className="w-10 h-10 text-[#E8527D] animate-spin" />
                  <p className="font-display italic font-bold text-lg text-white">
                    {sessionState === "connecting"
                      ? `Connecting securely with ${partnerName}...`
                      : `Reconnecting with ${partnerName}...`}
                  </p>
                  <p className="text-xs text-stone-300 font-mono">
                    Direct WebRTC peer-to-peer session
                  </p>
                </div>
              )}

              {/* Partner video mute indicator placeholder */}
              {isPartnerCamMuted && sessionState === "connected" && (
                <div className="absolute inset-0 bg-stone-900 flex flex-col items-center justify-center space-y-2 z-10">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <p className="font-mono text-xs text-stone-300">
                    {partnerName} turned camera off
                  </p>
                </div>
              )}

              {/* Top Meta Bar (Timer & Mode) */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{formatSeconds(callDuration)}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md text-xs font-mono uppercase tracking-wider hidden sm:inline">
                    {sessionMode === "screenshare" ? "Screen Share" : "Camera Mode"}
                  </span>
                </div>

                {isPartnerMicMuted && (
                  <span className="px-3 py-1 rounded-full bg-rose-600/80 text-white backdrop-blur-md text-xs font-mono flex items-center gap-1.5">
                    <MicOff className="w-3.5 h-3.5" />
                    <span>{partnerName} muted</span>
                  </span>
                )}
              </div>

              {/* Picture-in-Picture (PiP) Local Self View */}
              <div className="absolute bottom-4 left-4 w-28 sm:w-44 aspect-video rounded-2xl overflow-hidden bg-stone-900 border-2 border-white/80 shadow-2xl z-30 pointer-events-auto">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCamMuted ? "hidden" : "block"}`}
                />
                {isCamMuted && (
                  <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400">
                    <VideoOff className="w-5 h-5" />
                  </div>
                )}
                <span className="absolute bottom-1 left-2 text-[9px] font-mono text-white/90 drop-shadow-xs">
                  You {isMicMuted ? "(Muted)" : ""}
                </span>
              </div>

              {/* In-Call Overlay Chat component */}
              <SessionChat
                messages={chatMessages}
                currentUserId={user?.id || ""}
                partnerName={partnerName}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onSendMessage={handleSendChatMessage}
                onSendHeart={() => handleSendHeart("rose")}
              />
            </div>

            {/* In-Call Bottom Floating Controls Bar */}
            <div className="p-3.5 rounded-3xl bg-white/95 border border-[#FFD9E3] shadow-md paper-grain flex items-center justify-between gap-2 max-w-2xl mx-auto flex-wrap">
              {/* Mic & Cam toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isMicMuted
                      ? "bg-rose-50 text-rose-600 border-rose-300"
                      : "bg-[#FFF9FB] border-[#FFD9E3] text-[#3D2432] hover:border-[#E8527D]"
                  }`}
                  title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleCam}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isCamMuted
                      ? "bg-rose-50 text-rose-600 border-rose-300"
                      : "bg-[#FFF9FB] border-[#FFD9E3] text-[#3D2432] hover:border-[#E8527D]"
                  }`}
                  title={isCamMuted ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isCamMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              </div>

              {/* Mode switch (Camera vs Screen-share) */}
              <div className="flex items-center gap-2">
                {canScreenShare && (
                  <button
                    type="button"
                    onClick={() =>
                      switchSessionMode(sessionMode === "camera" ? "screenshare" : "camera")
                    }
                    className="p-3 rounded-2xl border border-[#FFD9E3] bg-[#FFF9FB] text-[#7A4B5D] hover:text-[#E8527D] hover:border-[#E8527D] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                    title="Switch Camera / Screen Share"
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {sessionMode === "camera" ? "Share Screen" : "Use Camera"}
                    </span>
                  </button>
                )}

                {/* Floating Heart Button */}
                <button
                  type="button"
                  onClick={() => handleSendHeart("burgundy")}
                  className="p-3 rounded-2xl border border-[#FFD9E3] bg-[#FFF0F4] text-[#E8527D] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Send Love Heart Shower"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>

                {/* Chat Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsChatOpen(!isChatOpen);
                    setUnreadChatCount(0);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    isChatOpen
                      ? "bg-[#E8527D] text-white border-[#E8527D]"
                      : "bg-[#FFF9FB] border-[#FFD9E3] text-[#3D2432] hover:border-[#E8527D]"
                  }`}
                  title="Toggle In-Call Chat"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadChatCount > 0 && !isChatOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                      {unreadChatCount}
                    </span>
                  )}
                </button>
              </div>

              {/* End Call Button */}
              <div>
                <button
                  type="button"
                  onClick={endSession}
                  className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  title="End Video Call"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="hidden sm:inline">End Call</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STATE 5: ENDED — CALL SUMMARY & RETURN
           ═══════════════════════════════════════════════════════════════ */}
        {sessionState === "ended" && (
          <div className="p-8 sm:p-10 rounded-[32px] bg-white/95 border border-[#FFD9E3] paper-grain shadow-md text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0F4] border border-[#FFD9E3] text-[#E8527D] flex items-center justify-center mx-auto shadow-xs">
              <Heart className="w-7 h-7 fill-current" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display italic font-bold text-2xl text-[#3D2432]">
                Session Completed
              </h3>
              <p className="text-xs text-[#7A4B5D]">
                You connected with {partnerName} for {formatSeconds(callDuration)}.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSessionState("idle");
                  setCallDuration(0);
                }}
                className="btn-journal py-2.5 px-6 text-xs font-mono font-bold tracking-wider uppercase cursor-pointer"
              >
                Start Another Call ▷
              </button>
              <a
                href="/dashboard"
                className="btn-journal-ghost py-2.5 px-5 text-xs font-mono cursor-pointer"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Feature Overview Footer */}
        <div className="p-4 rounded-2xl border border-[#FFD9E3] bg-white/70 text-xs text-[#7A4B5D] leading-relaxed shadow-2xs space-y-1">
          <p className="font-bold text-[#3D2432]">
            💡 About Watch Together
          </p>
          <p>
            Direct 1:1 WebRTC peer connection for couples. Camera mode streams real-time audio and video between you and {partnerName}. Desktop screen sharing lets you co-stream your favorite movies and shows together.
          </p>
        </div>
      </main>

      {/* Plus Paywall Modal Integration */}
      <PlusPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureTitle="Watch Together"
        featureDescription="1:1 direct video calls and desktop screen sharing with in-call chat, floating heart reactions, and Tenor GIFs."
      />
    </div>
  );
}
