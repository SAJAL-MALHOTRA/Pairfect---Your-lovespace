"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Sparkles, Image as ImageIcon, Gift, X } from "lucide-react";

export interface NotificationItem {
  id: string;
  pair_id: string;
  recipient_id: string;
  sender_id: string;
  type: "letter_sent" | "ping_sent" | "memory_added" | "gratitude_note" | "reaction_reply";
  title: string;
  body: string | null;
  read: boolean;
  metadata?: any;
  created_at: string;
}

interface ToastNotice {
  id: string;
  title: string;
  body: string | null;
  type: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendPing: (phrase?: string) => Promise<{ success: boolean; message: string }>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  sendPing: async () => ({ success: false, message: "" }),
  refreshNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, pair, partner } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        const notifs = data as NotificationItem[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: NotificationItem) => !n.read).length);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime Listener on Notifications table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Trigger live warm toast
          const toastId = `${newNotif.id}-${Date.now()}`;
          setToasts(prev => [...prev, {
            id: toastId,
            title: newNotif.title,
            body: newNotif.body,
            type: newNotif.type,
          }]);

          // Auto dismiss toast after 6 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", user.id)
        .eq("read", false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  // "Thinking of You" Ping Action
  const sendPing = async (phrase?: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !pair || !partner) {
      return { success: false, message: "No active pair found." };
    }

    try {
      const pingText = phrase || "Thinking of you ♡";
      const partnerName = partner.display_name || "partner";

      // 1. Log notification for recipient
      const { error: notifErr } = await supabase.from("notifications").insert({
        pair_id: pair.id,
        recipient_id: partner.id,
        sender_id: user.id,
        type: "ping_sent",
        title: `${user.user_metadata?.display_name || "Your partner"} ${phrase ? `sent a hug: "${phrase}"` : "is thinking of you ♡"}`,
        body: pingText,
      });

      if (notifErr) throw notifErr;

      // 2. Record pair activity for soft streak progression
      await supabase.rpc("record_pair_activity", { p_pair_id: pair.id });

      return { success: true, message: `Sent a warm ping to ${partnerName}!` };
    } catch (e: any) {
      console.error("Failed to send ping:", e);
      return { success: false, message: e?.message || "Failed to send ping." };
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        sendPing,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}

      {/* Live Warm Toast Popover Layer */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl text-[var(--text)] paper-grain"
              style={{ boxShadow: "0 10px 30px var(--shadow)" }}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--burgundy)] shrink-0 mt-0.5">
                {toast.type === "letter_sent" ? (
                  <Mail className="w-4 h-4" />
                ) : toast.type === "ping_sent" ? (
                  <Heart className="w-4 h-4 fill-current" />
                ) : toast.type === "memory_added" ? (
                  <ImageIcon className="w-4 h-4" />
                ) : toast.type === "gratitude_note" ? (
                  <Gift className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 space-y-0.5">
                <p className="font-heading font-bold text-sm text-[var(--burgundy)]">{toast.title}</p>
                {toast.body && (
                  <p className="font-sans text-xs text-[var(--text-soft)] leading-snug">{toast.body}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-[var(--text-soft)] hover:text-[var(--text)] p-1 rounded-full hover:bg-black/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
