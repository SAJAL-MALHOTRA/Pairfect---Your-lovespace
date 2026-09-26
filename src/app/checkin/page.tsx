"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { UnpairedPrompt } from "@/components/unpaired-prompt";
import { Loader2, Heart, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const MOODS = [
  { key: 'joyful',   emoji: '😊', label: 'Joyful',   color: '#EAB308' },
  { key: 'content',  emoji: '🥰', label: 'Content',  color: '#EC4899' },
  { key: 'neutral',  emoji: '😐', label: 'Neutral',  color: '#64748B' },
  { key: 'tired',    emoji: '🥱', label: 'Tired',    color: '#3B82F6' },
  { key: 'stressed', emoji: '😰', label: 'Stressed', color: '#F97316' },
  { key: 'sad',      emoji: '😢', label: 'Sad',      color: '#0EA5E9' },
  { key: 'anxious',  emoji: '🥺', label: 'Anxious',  color: '#6366F1' },
  { key: 'excited',  emoji: '🤪', label: 'Excited',  color: '#EC4899' },
  { key: 'loved',    emoji: '💖', label: 'Loved',    color: '#E11D48' },
  { key: 'distant',  emoji: '😶', label: 'Distant',  color: '#14B8A6' },
];

export default function CheckinPage() {
  const { user, profile, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [partnerLatest, setPartnerLatest] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const fetchLogs = async () => {
    if (!pair || !user) return;
    setFetching(true);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('pair_id', pair.id)
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
        
      if (data) {
        setRecentLogs(data.filter((log: any) => log.user_id === user.id));
        
        const partnerLogs = data.filter((log: any) => log.user_id !== user.id);
        if (partnerLogs.length > 0) {
          setPartnerLatest(partnerLogs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pair, user, supabase]);

  const handleSubmit = async () => {
    if (!selectedMood || !pair || !user) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('mood_logs').insert({
        pair_id: pair.id,
        user_id: user.id,
        mood: selectedMood,
        mood_intensity: intensity,
        note: note.trim() || null,
      });
      
      if (!error) {
        setSubmitted(true);
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  if (!pair) {
    return <UnpairedPrompt title="Daily Mood Check-in" />;
  }

  const todayStr = new Date().toDateString();
  const todaysLogs = recentLogs.filter(l => new Date(l.created_at).toDateString() === todayStr);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col pb-24">
      <Navigation />
      
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-24 space-y-8">
        
        {/* Check-in Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--border)] bg-[var(--paper-warm)] shadow-xl p-6 sm:p-8 paper-grain relative overflow-hidden"
        >
          <div className="text-center mb-8">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase">
              ♡ Daily Check-in
            </span>
            <h1 className="text-3xl font-display italic mt-2 text-[var(--text)]">How are you feeling?</h1>
          </div>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Mood Grid */}
                <div className="grid grid-cols-5 gap-3">
                  {MOODS.map(m => {
                    const isSelected = selectedMood === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMood(m.key)}
                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-200 border-2 ${isSelected ? 'border-[var(--burgundy)] bg-white/60 scale-105 shadow-md' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
                      >
                        <span className="text-2xl sm:text-3xl mb-1">{m.emoji}</span>
                        <span className="text-[10px] font-heading font-medium tracking-wide">{m.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Intensity Slider */}
                <AnimatePresence>
                  {selectedMood && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="flex justify-between items-center text-xs font-mono text-[var(--text-soft)] uppercase tracking-wider">
                        <span>Barely</span>
                        <span>Deeply</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="5" step="1"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full accent-[var(--burgundy)]"
                      />
                      <div className="flex justify-between px-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= intensity ? 'bg-[var(--burgundy)]' : 'bg-black/10'}`} />
                        ))}
                      </div>

                      {/* Note */}
                      <div className="pt-4 relative">
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={280}
                          placeholder="How are you feeling right now? (optional)"
                          className="w-full bg-white/50 border border-[var(--border)] rounded-xl p-4 text-sm font-sans resize-none focus:outline-none focus:border-[var(--burgundy)] focus:ring-1 focus:ring-[var(--burgundy)] transition-all h-24"
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[var(--text-soft)]">
                          {note.length}/280
                        </div>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-journal w-full py-4 rounded-xl flex items-center justify-center font-bold font-heading text-sm shadow-md mt-4"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log My Mood ♡'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 space-y-4 text-center"
              >
                <div className="w-20 h-20 bg-[var(--rose)]/20 rounded-full flex items-center justify-center text-4xl border border-[var(--rose)]/30">
                  {MOODS.find(m => m.key === selectedMood)?.emoji}
                </div>
                <h3 className="text-xl font-display italic text-[var(--text)]">Mood logged.</h3>
                <p className="text-sm font-sans text-[var(--text-soft)]">Thanks for checking in today.</p>
                <Link href="/dashboard" className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-[var(--burgundy)] hover:opacity-80 flex items-center">
                  <ArrowLeft className="w-3 h-3 mr-2" />
                  Back to Sanctuary
                </Link>
                <button 
                  onClick={() => { setSubmitted(false); setSelectedMood(null); setNote(""); setIntensity(3); }}
                  className="mt-4 text-[10px] font-mono uppercase text-[var(--text-soft)] underline"
                >
                  Log another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* History Section */}
        <div className="space-y-6 pt-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* My Today's History */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper-warm)]/60 p-5 paper-grain">
              <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase mb-4">My Today</h3>
              {fetching ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-[var(--text-soft)]" /></div>
              ) : todaysLogs.length > 0 ? (
                <div className="space-y-3">
                  {todaysLogs.map(log => {
                    const mood = MOODS.find(m => m.key === log.mood);
                    return (
                      <div key={log.id} className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-[var(--border)]/50">
                        <span className="text-xl">{mood?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-heading text-sm">{mood?.label}</span>
                            <span className="text-[10px] text-[var(--text-soft)]">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {log.note && <p className="text-xs text-[var(--text-soft)] truncate mt-0.5">{log.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-soft)] text-center py-4 italic">No check-ins yet today.</p>
              )}
            </div>

            {/* Partner Latest */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper-warm)]/60 p-5 paper-grain">
              <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase mb-4">{partner?.display_name || "Partner"}'s Latest</h3>
              {fetching ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-[var(--text-soft)]" /></div>
              ) : partnerLatest ? (
                <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-[var(--border)]/50">
                   <span className="text-3xl">{MOODS.find(m => m.key === partnerLatest.mood)?.emoji}</span>
                   <div className="flex-1">
                      <div className="font-heading text-sm">{MOODS.find(m => m.key === partnerLatest.mood)?.label}</div>
                      <div className="text-[10px] text-[var(--text-soft)] mt-1">
                        {new Date(partnerLatest.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {partnerLatest.note && <p className="text-xs text-[var(--text-soft)] mt-2 bg-black/5 p-2 rounded-lg italic">"{partnerLatest.note}"</p>}
                   </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-soft)] text-center py-4 italic">No recent check-ins.</p>
              )}
            </div>
          </div>

          {/* 14 Day Timeline */}
          <div className="mt-8">
            <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--text-soft)] uppercase mb-4 pl-2">Last 14 Days (You)</h3>
            <div className="space-y-3">
              {fetching ? (
                 <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-[var(--text-soft)]" /></div>
              ) : recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  const mood = MOODS.find(m => m.key === log.mood);
                  return (
                    <div key={log.id} className="bg-white/40 p-4 rounded-xl flex items-start gap-4 border border-[var(--border)]/40 hover:bg-white/60 transition-colors">
                      <div className="text-2xl mt-1">{mood?.emoji}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-heading text-sm font-medium">{mood?.label}</span>
                          <span className="text-[10px] text-[var(--text-soft)] font-mono">
                            {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {/* Intensity visualization */}
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= log.mood_intensity ? 'bg-[var(--burgundy)]/60' : 'bg-black/5'}`} />
                          ))}
                        </div>
                        {log.note && (
                          <p className="text-sm font-sans text-[var(--text-soft)] bg-white/50 p-3 rounded-lg border border-[var(--border)]/30">
                            {log.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--text-soft)] text-center py-8 italic bg-white/30 rounded-xl border border-[var(--border)]/30">No check-ins in the last 14 days.</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
