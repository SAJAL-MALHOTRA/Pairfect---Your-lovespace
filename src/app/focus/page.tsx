"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Play, Pause, RotateCcw, Brain, Timer, Flame, Coffee, 
  Sparkles, CheckCircle2, History, AlertTriangle, ChevronRight, Check, X
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNotifications } from "@/components/providers/notification-provider";

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
  started_at?: string;
  ended_at?: string;
  completed?: boolean;
  display_name?: string;
  users?: {
    display_name: string;
  };
}

export default function FocusZonePage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const { sendGameNotification } = useNotifications();
  const supabase = createClient();

  // Timer state
  const [status, setStatus] = useState<FocusStatus>("idle");
  const [durationSeconds, setDurationSeconds] = useState(1500); // default 25m
  const [secondsRemaining, setSecondsRemaining] = useState(1500);
  const [timerActive, setTimerActive] = useState(false);
  const [label, setLabel] = useState("");
  const [customLabelInput, setCustomLabelInput] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const startedAtRef = useRef<string | null>(null);

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
          started_at,
          ended_at,
          completed,
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
          console.error("Error reading focus logs from db:", error);
        }
        loadLocalLogs();
      } else {
        setDbLogs(data || []);
      }
    } catch (err) {
      console.error(err);
      loadLocalLogs();
    } finally {
      setFetchingLogs(false);
    }
  };

  const loadLocalLogs = () => {
    try {
      const saved = localStorage.getItem("pairfect-focus-logs");
      if (saved) {
        setLocalLogs(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }
    setFetchingLogs(false);
  };

  useEffect(() => {
    if (!loading && pair) {
      fetchDbLogs();
    } else if (!loading && !pair) {
      loadLocalLogs();
    }
  }, [pair, loading]);

  // Realtime Broadcast logic
  useEffect(() => {
    if (loading || !user) return;

    const channelName = pair ? `focus-room-${pair.id}` : `focus-solo-${user.id}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "timer-sync" }, ({ payload }: any) => {
        if (payload.userId === user.id) return; // ignore own
        
        // Save partner state
        setPartnerFocus({
          userId: payload.userId,
          displayName: payload.displayName,
          status: payload.status,
          label: payload.label,
          secondsRemaining: payload.secondsRemaining,
          durationSeconds: payload.durationSeconds,
          updatedAt: Date.now(),
        });
      })
      .subscribe((statusVal: any) => {
        if (statusVal === "SUBSCRIBED") {
          channelRef.current = channel;
          
          // Request state check from partner on load
          channel.send({
            type: "broadcast",
            event: "timer-request",
            payload: { requestedBy: user.id },
          });
        }
      });

    // Listen for partner requests for state
    const requestChannel = supabase.channel(pair ? `focus-request-${pair.id}` : `focus-solo-req-${user.id}`);
    requestChannel
      .on("broadcast", { event: "timer-request" }, () => {
        broadcastState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(requestChannel);
    };
  }, [pair, user, loading]);

  // Periodically clean up partner status if offline (no update for 10 seconds)
  useEffect(() => {
    const checkOffline = setInterval(() => {
      if (partnerFocus && Date.now() - partnerFocus.updatedAt > 10000) {
        setPartnerFocus(null); // clear if no beacon for 10s
      }
    }, 5000);

    return () => clearInterval(checkOffline);
  }, [partnerFocus]);

  const broadcastState = () => {
    if (!channelRef.current || !user) return;
    
    channelRef.current.send({
      type: "broadcast",
      event: "timer-sync",
      payload: {
        userId: user.id,
        displayName: profile?.display_name || "Partner",
        status: statusRef.current,
        label: labelRef.current,
        secondsRemaining: secondsRemainingRef.current,
        durationSeconds: durationSecondsRef.current,
        timerActive: timerActiveRef.current,
      },
    });
  };

  // Broadcast state updates on changes
  useEffect(() => {
    if (timerActive) {
      broadcastState();
    }
  }, [timerActive, secondsRemaining, status]);

  // Audio syntheziser for alarms (cross-platform clean buzzer)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.value = freq;
        osc.type = "sine";
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play cozy melodic chord chime (C5 -> E5 -> G5)
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.25); // C5
      playTone(659.25, now + 0.15, 0.25); // E5
      playTone(783.99, now + 0.3, 0.45); // G5
    } catch (e) {
      console.warn("Audio Context beep failed to initialize:", e);
    }
  };

  // Database session save log
  const saveFocusSessionLog = async (completedLabel: string, completedDurationMinutes: number, wasCompleted: boolean = true) => {
    const timestamp = new Date().toISOString();
    const startVal = startedAtRef.current || timestamp;
    
    // 1. Try DB Write
    if (pair && !schemaError) {
      try {
        const { error } = await supabase
          .from("focus_logs")
          .insert({
            pair_id: pair.id,
            user_id: user!.id,
            label: completedLabel,
            duration_minutes: completedDurationMinutes,
            completed_at: timestamp,
            started_at: startVal,
            ended_at: timestamp,
            completed: wasCompleted,
          });

        if (error) throw error;
        await fetchDbLogs();
        return;
      } catch (err) {
        console.warn("DB Write failed, saving to local logs:", err);
      }
    }

    // 2. Fallback local logs
    const newLog: FocusLog = {
      id: `local-${Date.now()}`,
      user_id: user?.id || "solo",
      label: completedLabel,
      duration_minutes: completedDurationMinutes,
      completed_at: timestamp,
      started_at: startVal,
      ended_at: timestamp,
      completed: wasCompleted,
      display_name: profile?.display_name || "Me",
    };

    const updated = [newLog, ...localLogs].slice(0, 50);
    setLocalLogs(updated);
    try {
      localStorage.setItem("pairfect-focus-logs", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const startTimer = (sessionType: FocusStatus, seconds: number, topic: string) => {
    setStatus(sessionType);
    setDurationSeconds(seconds);
    setSecondsRemaining(seconds);
    setLabel(topic);
    setTimerActive(true);
    if (sessionType === "work") {
      sendGameNotification("Focus Session", "/focus");
    }

    const nowStr = new Date().toISOString();
    setStartedAt(nowStr);
    startedAtRef.current = nowStr;

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      handleTick();
    }, 1000);
  };

  const handleTick = () => {
    if (secondsRemainingRef.current <= 1) {
      // Completed!
      playBeep();
      const completedType = statusRef.current;
      const completedLabel = labelRef.current;
      const durationMins = Math.round(durationSecondsRef.current / 60);

      // Stop state
      setTimerActive(false);
      setStatus("idle");
      setSecondsRemaining(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Save Log if Focus (not break)
      if (completedType === "work") {
        saveFocusSessionLog(completedLabel || "Focus Session", durationMins);
      }
      
      broadcastState();
      alert(completedType === "work" ? `Focus session completed! Great job: "${completedLabel}"` : "Break over! Ready to focus?");
    } else {
      setSecondsRemaining((prev) => prev - 1);
    }
  };

  const pauseTimer = () => {
    setTimerActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    broadcastState();
  };

  const resumeTimer = () => {
    setTimerActive(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      handleTick();
    }, 1000);
    broadcastState();
  };

  const resetTimer = () => {
    // If work timer is active, log it as an abandoned session
    if (timerActiveRef.current && statusRef.current === "work" && startedAtRef.current) {
      const elapsedSeconds = durationSecondsRef.current - secondsRemainingRef.current;
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      saveFocusSessionLog(labelRef.current || "Focus Session", elapsedMinutes, false);
    }

    setTimerActive(false);
    setStatus("idle");
    setSecondsRemaining(1500);
    setDurationSeconds(1500);
    setLabel("");
    setStartedAt(null);
    startedAtRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    broadcastState();
  };

  useEffect(() => {
    // Cleanup timer interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const strokeDashoffset = durationSeconds > 0 
    ? 282.6 - (secondsRemaining / durationSeconds) * 282.6 
    : 0;

  const getCombinedLogs = () => {
    const listMap = new Map<string, FocusLog>();
    
    // Combine local storage and DB logs
    localLogs.forEach((log) => {
      listMap.set(log.completed_at, log);
    });

    dbLogs.forEach((log) => {
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
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-4xl w-full mx-auto px-6 pt-24 md:pl-36 md:pr-12 pb-16 flex-1 flex flex-col justify-start z-10 animate-fade-in">
        
        {/* Title */}
        <div className="mb-10">
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Focus Zone</p>
          <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)] mt-0.5">Focus Space</h1>
          <p className="font-handwriting text-sm text-[var(--ink-mid)] mt-2">Study, reflect, and stay in the zone together.</p>
        </div>

        {/* Database setup notification helper */}
        {schemaError && (
          <div className="mb-6 p-4 rounded-[20px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Focus History Persistence Offline</p>
              <p className="leading-relaxed opacity-90">
                Study sessions are currently only saving in your local browser storage. To share focus history across devices, copy-paste the SQL script inside <code className="bg-[var(--bg)] dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-amber-600 dark:text-amber-400 border border-[var(--border)]">supabase/focus_zone.sql</code> into your Supabase SQL Editor and execute it!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MID: POMODORO TIMER PANEL */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8 shadow-sm paper-grain flex flex-col items-center text-center">
              
              {/* Circular Timer Visual */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="stroke-muted fill-none"
                    strokeWidth="3.5"
                  />
                  {/* Progress Line */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="stroke-[var(--seal-red)] fill-none transition-all duration-100"
                    strokeWidth="3.5"
                    strokeDasharray="282.6"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Counter text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <span className="text-4xl font-mono font-bold text-[var(--text)]">
                    {formatTime(secondsRemaining)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-soft)] tracking-widest mt-1.5 font-mono">
                    {status === "work" ? "Focusing" : status === "break" ? "On Break" : "Cozy Timer"}
                  </span>
                </div>
              </div>

              {/* Focus Label */}
              {status === "work" && (
                <div className="mb-6 bg-[var(--seal-red)]/10 px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--seal-red)] flex items-center space-x-1.5 border border-[var(--seal-red)]/20">
                  <Flame className="w-3.5 h-3.5 fill-[var(--seal-red)]" />
                  <span>Focusing on: {label || "General Study"}</span>
                </div>
              )}
              {status === "break" && (
                <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Break Time! Relax a bit.</span>
                </div>
              )}

              {/* Focus Topic Input (Only show if idle) */}
              {status === "idle" && (
                <div className="w-full max-w-sm mb-6 space-y-2">
                  <label className="block text-[10px] text-left font-bold text-[var(--text-soft)] uppercase tracking-widest pl-1 font-mono">
                    What are you studying? (Optional)
                  </label>
                  <input
                    type="text"
                    value={customLabelInput}
                    onChange={(e) => setCustomLabelInput(e.target.value)}
                    placeholder="e.g. Physics homework, coding React..."
                    className="input-warm block w-full px-3.5 py-2.5"
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
                      className="btn-primary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer"
                    >
                      Pomodoro (25m)
                    </button>
                    <button
                      onClick={() => startTimer("work", 3000, customLabelInput || "Study Session")}
                      className="btn-secondary py-2.5 px-6 text-[10px] uppercase tracking-widest cursor-pointer"
                    >
                      Long Focus (50m)
                    </button>
                    <button
                      onClick={() => startTimer("break", 300, "Short Break")}
                      className="px-4 py-2.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
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
                        className="flex items-center space-x-1.5 px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={resumeTimer}
                        className="flex items-center space-x-1.5 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      onClick={resetTimer}
                      title="Reset Timer"
                      className="p-3 border border-[var(--border)] rounded-full bg-[var(--bg-secondary)] hover:bg-muted text-[var(--text-soft)] hover:text-[var(--text)] transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STUDY LOG HISTORY */}
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-sm paper-grain">
              <h2 className="text-sm font-mono font-bold text-[var(--ink-light)] uppercase tracking-widest mb-4">
                <span>Study History Log</span>
              </h2>

              {fetchingLogs ? (
                <div className="text-center py-6 text-sm text-[var(--text-soft)]">
                  Loading focus logs...
                </div>
              ) : allLogs.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl text-xs text-[var(--text-soft)]">
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
                        className="flex items-center justify-between p-3 border border-[var(--border)] bg-[var(--bg)]/30 rounded-2xl hover:bg-[var(--bg)]/50 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-xl ${
                            log.completed === false
                              ? "bg-red-500/10 text-red-500"
                              : isMe
                              ? "bg-[var(--seal-red)]/10 text-[var(--seal-red)]"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {log.completed === false ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--text)]">
                              {log.label}
                            </p>
                            <p className="text-[10px] text-[var(--text-soft)] mt-0.5">
                              {log.completed === false ? "Abandoned by " : "Completed by "}
                              <span className="font-semibold text-[var(--text)]/80">{log.display_name || (isMe ? "Me" : "Partner")}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[var(--text)] block">
                            {log.duration_minutes}m
                          </span>
                          <span className="text-[9px] text-[var(--text-soft)] font-semibold block mt-0.5">
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
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-sm paper-grain">
              <h2 className="text-xl font-heading font-bold text-[var(--text)] tracking-tight mb-4">
                Partner Focus Status
              </h2>

              {!partner ? (
                <div className="text-center py-6 text-sm text-[var(--text-soft)]">
                  You are not currently linked to a partner. Invite a partner in Settings to sync focus sessions!
                </div>
              ) : partnerFocus ? (
                <div className="space-y-5 text-center py-4">
                  {/* Large Icon display */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-[20px] bg-[var(--seal-red)]/10 text-[var(--seal-red)] shadow-inner">
                    {partnerFocus.status === "work" ? (
                      <Flame className="w-10 h-10 fill-[var(--seal-red)] animate-pulse" />
                    ) : (
                      <Coffee className="w-10 h-10 animate-bounce" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-[var(--text)]">
                      {partner.display_name} is in the zone!
                    </h3>
                    
                    <div className="text-sm text-[var(--text-soft)] mt-1 flex items-center justify-center space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>
                        {partnerFocus.status === "work" 
                          ? `Focusing on: ${partnerFocus.label}` 
                          : "Taking a short break"}
                      </span>
                    </div>
                  </div>

                  {/* Partner Countdown sync indicator */}
                  <div className="bg-[var(--bg)]/60 border border-[var(--border)] py-3 px-4 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-soft)] font-semibold uppercase tracking-widest font-mono">
                      Remaining
                    </span>
                    <span className="text-lg font-mono font-bold text-[var(--seal-red)]">
                      {formatTime(partnerFocus.secondsRemaining)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center py-6">
                  {/* Idle status */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg)]/80 border border-[var(--border)] text-[var(--text-soft)]/40">
                    <Timer className="w-8 h-8 opacity-45" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {partner.display_name} is offline or resting
                    </p>
                    <p className="text-xs text-[var(--text-soft)] mt-0.5 leading-relaxed">
                      Start focusing or drop a message to study together!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pomodoro study tip cards */}
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-sm paper-grain">
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink-light)] mb-3">
                <span>Focus Zone Tips</span>
              </h3>
              
              <div className="space-y-3.5 text-xs text-[var(--text-soft)] leading-relaxed">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--burgundy)] mt-1.5 flex-shrink-0" />
                  <p>
                    <strong>25/5 rule:</strong> Study for 25 minutes (Pomodoro) and rest for 5 minutes. Reset after 4 focus sessions.
                  </p>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--burgundy)] mt-1.5 flex-shrink-0" />
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
