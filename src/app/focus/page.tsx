"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Play, Pause, RotateCcw, Brain, Timer, Flame, Coffee, 
  Sparkles, CheckCircle2, History, AlertTriangle, ChevronRight, Check
} from "lucide-react";
import { format, parseISO } from "date-fns";

type FocusStatus = "idle" | "work" | "break";

interface PartnerFocusState {
  userId: string;
  displayName: string;
  status: FocusStatus;
  label: string;
  secondsRemaining: number;
  durationSeconds: number;
  updatedAt: number;
}

interface FocusLog {
  id: string;
  user_id: string;
  label: string;
  duration_minutes: number;
  completed_at: string;
  display_name?: string;
  users?: {
    display_name: string;
  };
}

export default function FocusZonePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  // Timer state
  const [status, setStatus] = useState<FocusStatus>("idle");
  const [durationSeconds, setDurationSeconds] = useState(1500); // default 25m
  const [secondsRemaining, setSecondsRemaining] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [label, setLabel] = useState("");
  const [customLabelInput, setCustomLabelInput] = useState("");

  // DB vs Local fallback states
  const [schemaError, setSchemaError] = useState(false);
  const [dbLogs, setDbLogs] = useState<FocusLog[]>([]);
  const [localLogs, setLocalLogs] = useState<FocusLog[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(true);

  // Partner status
  const [partnerFocus, setPartnerFocus] = useState<PartnerFocusState | null>(null);

  // Refs for tracking timer states in handlers & intervals
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  
  const statusRef = useRef(status);
  const labelRef = useRef(label);
  const secondsRemainingRef = useRef(secondsRemaining);
  const durationSecondsRef = useRef(durationSeconds);
  const timerActiveRef = useRef(timerActive);

  // Sync refs
  useEffect(() => {
    statusRef.current = status;
    labelRef.current = label;
    secondsRemainingRef.current = secondsRemaining;
    durationSecondsRef.current = durationSeconds;
    timerActiveRef.current = timerActive;
  }, [status, label, secondsRemaining, durationSeconds, timerActive]);

  // Fetch db logs
  const fetchDbLogs = async () => {
    if (!pair) return;
    try {
      const { data, error } = await supabase
        .from("focus_logs")
        .select(`
          id,
          user_id,
          label,
          duration_minutes,
          completed_at,
          users (
            display_name
          )
        `)
        .eq("pair_id", pair.id)
        .order("completed_at", { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === "42P01") {
          setSchemaError(true);
        } else {
          console.error("Error loading logs from Supabase:", error);
        }
      } else {
        setDbLogs(data as unknown as FocusLog[] || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingLogs(false);
    }
  };

  // Fetch local fallback logs
  const fetchLocalLogs = () => {
    if (!pair) return;
    try {
      const stored = localStorage.getItem(`focus_logs_${pair.id}`);
      if (stored) {
        setLocalLogs(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Local storage read error:", e);
    }
  };

  // Initial load
  useEffect(() => {
    if (!loading && pair) {
      fetchDbLogs();
      fetchLocalLogs();
    }
  }, [pair, loading]);

  // Setup Realtime Sync
  useEffect(() => {
    if (!pair || !user) return;

    const channel = supabase.channel(`focus_zone_${pair.id}`, {
      config: {
        broadcast: { self: false }
      }
    });

    channel
      .on("broadcast", { event: "focus_update" }, (message: any) => {
        const payload = message.payload as PartnerFocusState;
        if (payload.userId === partner?.id) {
          // If the partner just turned idle, clear it
          if (payload.status === "idle") {
            setPartnerFocus(null);
          } else {
            // Check if the update is newer than 2 minutes ago to prevent ghost states
            if (Date.now() - payload.updatedAt < 120000) {
              setPartnerFocus(payload);
            }
          }
        }
      })
      .subscribe((subStatus: any) => {
        if (subStatus === "SUBSCRIBED") {
          // If active, broadcast state immediately so partner catches up
          if (timerActiveRef.current) {
            broadcastState();
          }
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [pair, user, partner]);

  // Periodic broad-sync to handle cases where partner joins focus page later
  useEffect(() => {
    if (!timerActive) return;

    const syncInterval = setInterval(() => {
      broadcastState();
    }, 15000); // sync every 15 seconds

    return () => clearInterval(syncInterval);
  }, [timerActive]);

  // Helper to play synthesized chimes using Web Audio API
  const playCozyChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc2.type = "sine";

      // Sweet arpeggiated double chime
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5

      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.error("Audio API chime failed:", e);
    }
  };

  // Broadcast state helper
  const broadcastState = (overrideStatus?: FocusStatus, overrideRemaining?: number) => {
    if (!channelRef.current || !user) return;
    
    const targetStatus = overrideStatus !== undefined ? overrideStatus : statusRef.current;
    const targetRemaining = overrideRemaining !== undefined ? overrideRemaining : secondsRemainingRef.current;

    channelRef.current.send({
      type: "broadcast",
      event: "focus_update",
      payload: {
        userId: user.id,
        displayName: profile?.display_name || "Partner",
        status: targetStatus,
        label: labelRef.current || (targetStatus === "work" ? "Focusing" : "Break"),
        secondsRemaining: targetRemaining,
        durationSeconds: durationSecondsRef.current,
        updatedAt: Date.now()
      }
    });
  };

  // Start study timer
  const startTimer = (type: FocusStatus, duration: number, customLabel: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setStatus(type);
    setDurationSeconds(duration);
    setSecondsRemaining(duration);
    setTimerActive(true);
    setLabel(customLabel);

    // Broadcast immediate start
    broadcastState(type, duration);

    intervalRef.current = setInterval(() => {
      if (secondsRemainingRef.current <= 1) {
        // Timer Finished!
        clearInterval(intervalRef.current!);
        playCozyChime();
        
        // Log if it was a work session
        if (statusRef.current === "work") {
          logCompletedSession(labelRef.current, Math.round(durationSecondsRef.current / 60));
        }

        setStatus("idle");
        setTimerActive(false);
        setSecondsRemaining(0);
        broadcastState("idle", 0);
      } else {
        const nextRemaining = secondsRemainingRef.current - 1;
        setSecondsRemaining(nextRemaining);
      }
    }, 1000);
  };

  // Pause Timer
  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerActive(false);
    broadcastState(status, secondsRemaining);
  };

  // Resume Timer
  const resumeTimer = () => {
    if (intervalRef.current) return;
    setTimerActive(true);

    broadcastState(status, secondsRemaining);

    intervalRef.current = setInterval(() => {
      if (secondsRemainingRef.current <= 1) {
        clearInterval(intervalRef.current!);
        playCozyChime();

        if (statusRef.current === "work") {
          logCompletedSession(labelRef.current, Math.round(durationSecondsRef.current / 60));
        }

        setStatus("idle");
        setTimerActive(false);
        setSecondsRemaining(0);
        broadcastState("idle", 0);
      } else {
        const nextRemaining = secondsRemainingRef.current - 1;
        setSecondsRemaining(nextRemaining);
      }
    }, 1000);
  };

  // Reset Timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus("idle");
    setTimerActive(false);
    setSecondsRemaining(1500);
    setDurationSeconds(1500);
    setLabel("");
    broadcastState("idle", 1500);
  };

  // Log completed session
  const logCompletedSession = async (sessionLabel: string, minutes: number) => {
    const finalLabel = sessionLabel.trim() || "Study Session";
    const logItem: FocusLog = {
      id: Math.random().toString(),
      user_id: user?.id || "",
      label: finalLabel,
      duration_minutes: minutes,
      completed_at: new Date().toISOString(),
      display_name: profile?.display_name || "Me"
    };

    // Save to local storage history
    try {
      const stored = localStorage.getItem(`focus_logs_${pair?.id}`);
      const logsArray = stored ? JSON.parse(stored) : [];
      const updated = [logItem, ...logsArray];
      localStorage.setItem(`focus_logs_${pair?.id}`, JSON.stringify(updated));
      setLocalLogs(updated);
    } catch (e) {
      console.error(e);
    }

    // Save to Supabase
    if (!schemaError && pair && user) {
      try {
        const { error } = await supabase.from("focus_logs").insert({
          pair_id: pair.id,
          user_id: user.id,
          label: finalLabel,
          duration_minutes: minutes
        });
        
        if (error) {
          if (error.code === "42P01") {
            setSchemaError(true);
          } else {
            console.error("DB log insert error:", error);
          }
        } else {
          fetchDbLogs();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Format countdown
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Circular progress calculation
  const progressPercent = durationSeconds > 0 ? (secondsRemaining / durationSeconds) * 100 : 0;
  const strokeDashoffset = 282.6 - (282.6 * progressPercent) / 100;

  // Combine DB + Local logs, removing duplicates
  const getCombinedLogs = () => {
    const listMap = new Map<string, FocusLog>();
    
    // Add local logs first
    localLogs.forEach(log => {
      listMap.set(log.completed_at, log);
    });

    // Overwrite/add db logs
    dbLogs.forEach(log => {
      const mappedLog = {
        ...log,
        display_name: log.users?.display_name || log.display_name
      };
      listMap.set(log.completed_at, mappedLog);
    });

    return Array.from(listMap.values())
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  };

  const allLogs = getCombinedLogs();

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, #3a2527 0%, transparent 55%), radial-gradient(50rem 40rem at 100% 10%, #2e1e20 0%, transparent 50%)",
        }}
      />

      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10">
        
        {/* Title */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-foreground tracking-tight flex items-center justify-center sm:justify-start space-x-3">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
            <span>Focus Zone</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
            Stay in the zone together. Work pomodoros, log study tracks, and see what your partner is studying in real-time.
          </p>
        </div>

        {/* Database setup notification helper */}
        {schemaError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Focus History Persistence Offline</p>
              <p className="leading-relaxed opacity-90">
                Study sessions are currently only saving in your local browser storage. To share focus history across devices, copy-paste the SQL script inside <code className="bg-background px-1.5 py-0.5 rounded font-mono text-amber-200">supabase/focus_zone.sql</code> into your Supabase SQL Editor and execute it!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MID: POMODORO TIMER PANEL */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/55 p-6 sm:p-8 shadow-[0_18px_40px_-24px_rgba(120,80,80,0.4)] backdrop-blur-xl flex flex-col items-center text-center">
              
              {/* Circular Timer Visual */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="stroke-border/20 fill-none"
                    strokeWidth="4"
                  />
                  {/* Progress Line */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="stroke-primary fill-none transition-all duration-100"
                    strokeWidth="4"
                    strokeDasharray="282.6"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Counter text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <span className="text-4xl font-mono font-bold text-foreground">
                    {formatTime(secondsRemaining)}
                  </span>
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mt-1">
                    {status === "work" ? "Focusing" : status === "break" ? "On Break" : "Cozy Timer"}
                  </span>
                </div>
              </div>

              {/* Focus Label */}
              {status === "work" && (
                <div className="mb-6 bg-accent px-4 py-1.5 rounded-full text-xs font-semibold text-primary flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 fill-primary" />
                  <span>Focusing on: {label || "General Study"}</span>
                </div>
              )}
              {status === "break" && (
                <div className="mb-6 bg-emerald-500/15 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Break Time! Relax a bit.</span>
                </div>
              )}

              {/* Focus Topic Input (Only show if idle) */}
              {status === "idle" && (
                <div className="w-full max-w-sm mb-6 space-y-2">
                  <label className="block text-xs text-left font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    What are you studying? (Optional)
                  </label>
                  <input
                    type="text"
                    value={customLabelInput}
                    onChange={(e) => setCustomLabelInput(e.target.value)}
                    placeholder="e.g. Physics homework, coding React..."
                    className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              )}

              {/* Timer Controls */}
              <div className="flex items-center space-x-4">
                {status === "idle" ? (
                  // Select Session Type to Start
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => startTimer("work", 1500, customLabelInput || "Study Session")}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer"
                    >
                      Pomodoro (25m)
                    </button>
                    <button
                      onClick={() => startTimer("work", 3000, customLabelInput || "Study Session")}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary/20 text-primary border border-border/60 hover:bg-primary/35 transition-all cursor-pointer"
                    >
                      Long Focus (50m)
                    </button>
                    <button
                      onClick={() => startTimer("break", 300, "Short Break")}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      Short Break (5m)
                    </button>
                  </div>
                ) : (
                  // Active Controls
                  <div className="flex items-center space-x-3">
                    {timerActive ? (
                      <button
                        onClick={pauseTimer}
                        className="flex items-center space-x-1.5 px-5 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all active:scale-95 cursor-pointer"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={resumeTimer}
                        className="flex items-center space-x-1.5 px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      onClick={resetTimer}
                      title="Reset Timer"
                      className="p-3 border border-border/60 rounded-xl bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STUDY LOG HISTORY */}
            <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-sm backdrop-blur-xl">
              <h2 className="text-lg font-serif font-bold text-foreground flex items-center space-x-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <span>Study History Log</span>
              </h2>

              {fetchingLogs ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Loading focus logs...
                </div>
              ) : allLogs.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border/40 rounded-2xl text-sm text-muted-foreground">
                  No logged focus sessions yet. Work your first Pomodoro to see it here!
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {allLogs.map((log) => {
                    const isMe = log.user_id === user?.id;
                    const date = parseISO(log.completed_at);
                    
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 border border-border/60 bg-background/30 rounded-2xl hover:bg-background/50 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2.5 rounded-xl ${isMe ? "bg-accent text-primary" : "bg-emerald-500/10 text-emerald-400"}`}>
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {log.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Completed by <span className="font-semibold text-foreground/80">{log.display_name || (isMe ? "Me" : "Partner")}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-foreground block">
                            {log.duration_minutes}m
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold block mt-0.5">
                            {format(date, "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: PARTNER FOCUS STATUS */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-[0_18px_40px_-24px_rgba(120,80,80,0.4)] backdrop-blur-xl">
              <h2 className="text-lg font-serif font-bold text-foreground mb-4">
                Partner Focus Status
              </h2>

              {!partner ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  You are not currently linked to a partner. Invite a partner in Settings to sync focus sessions!
                </div>
              ) : partnerFocus ? (
                <div className="space-y-5 text-center py-4">
                  {/* Large Icon display */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent text-primary shadow-inner">
                    {partnerFocus.status === "work" ? (
                      <Flame className="w-10 h-10 fill-primary animate-pulse" />
                    ) : (
                      <Coffee className="w-10 h-10 animate-bounce" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-foreground">
                      {partner.display_name} is in the zone!
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>
                        {partnerFocus.status === "work" 
                          ? `Focusing on: ${partnerFocus.label}` 
                          : "Taking a short break"}
                      </span>
                    </p>
                  </div>

                  {/* Partner Countdown sync indicator */}
                  <div className="bg-background/60 border border-border/60 py-3 px-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Remaining
                    </span>
                    <span className="text-lg font-mono font-bold text-primary">
                      {formatTime(partnerFocus.secondsRemaining)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center py-6">
                  {/* Idle status */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background/80 border border-border/60 text-muted-foreground">
                    <Timer className="w-8 h-8 opacity-40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {partner.display_name} is offline or resting
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Start focusing or drop a message to study together!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pomodoro study tip cards */}
            <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-sm backdrop-blur-xl">
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-1.5 uppercase tracking-wider text-primary mb-3">
                <Sparkles className="w-4 h-4 fill-primary" />
                <span>Focus Zone Tips</span>
              </h3>
              
              <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>
                    <strong>25/5 rule:</strong> Study for 25 minutes (Pomodoro) and rest for 5 minutes. Reset after 4 focus sessions.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>
                    <strong>Realtime Sync:</strong> Keep this page open while you study to broadcast your live study updates to your partner automatically.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
