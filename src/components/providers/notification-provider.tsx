"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Sparkles, Image as ImageIcon, Gift, X, Gamepad2 } from "lucide-react";
import Link from "next/link";

export interface NotificationItem {
  id: string;
  pair_id: string;
  recipient_id: string;
  sender_id: string;
  type: "letter_sent" | "ping_sent" | "memory_added" | "gratitude_note" | "reaction_reply" | "game_started";
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
  route?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendPing: (phrase?: string) => Promise<{ success: boolean; message: string }>;
  sendGameNotification: (gameName: string, gameRoute: string) => Promise<{ success: boolean }>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  sendPing: async () => ({ success: false, message: "" }),
  sendGameNotification: async () => ({ success: false }),
  refreshNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, pair, partner, profile } = useAuth();
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

          // Extract game route from metadata or body
          const gameRoute = newNotif.metadata?.route || (newNotif.body?.includes("/") ? newNotif.body.split(" ").find(w => w.startsWith("/")) : undefined);

          // Trigger live warm toast
          const toastId = `${newNotif.id}-${Date.now()}`;
          setToasts(prev => [...prev, {
            id: toastId,
            title: newNotif.title,
            body: newNotif.body,
            type: newNotif.type,
            route: gameRoute,
          }]);

          // Auto dismiss toast after 8 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 8000);
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          fetchNotifications();
        }
      });

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

      const { error: notifErr } = await supabase.from("notifications").insert({
        pair_id: pair.id,
        recipient_id: partner.id,
        sender_id: user.id,
        type: "ping_sent",
        title: `${profile?.display_name || "Your partner"} ${phrase ? `sent a hug: "${phrase}"` : "is thinking of you ♡"}`,
        body: pingText,
      });

      if (notifErr) throw notifErr;
      await supabase.rpc("record_pair_activity", { p_pair_id: pair.id });

      return { success: true, message: `Sent a warm ping to ${partnerName}!` };
    } catch (e: any) {
      console.error("Failed to send ping:", e);
      return { success: false, message: e?.message || "Failed to send ping." };
    }
  };

  // Game Activity Notification Action
  const sendGameNotification = async (gameName: string, gameRoute: string): Promise<{ success: boolean }> => {
    if (!user || !pair || !partner) return { success: false };
    try {
      const partnerName = profile?.display_name || "Your partner";
      await supabase.from("notifications").insert({
        pair_id: pair.id,
        recipient_id: partner.id,
        sender_id: user.id,
        type: "game_started",
        title: `${partnerName} started playing ${gameName} — join them?`,
        body: `Tap Join Now to play ${gameName} together!`,
        metadata: { route: gameRoute },
      });
      return { success: true };
    } catch (e) {
      console.error("Failed to send game notification:", e);
      return { success: false };
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
        sendGameNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}

      {/* Live Warm Toast Popover Layer */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const getToastRoute = (t: ToastNotice) => {
              if (t.route) return t.route;
              if (t.type === "letter_sent" || t.type === "reaction_reply") return "/love-letter";
              if (t.type === "gratitude_note") return "/gratitude-jar";
              if (t.type === "memory_added") return "/stories";
              if (t.type === "game_started") return "/play";
              return "/dashboard";
            };
            const targetRoute = getToastRoute(toast);

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="pointer-events-auto p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border)] shadow-xl text-[var(--text)] paper-grain hover:border-[var(--burgundy)]/50 transition-all cursor-pointer"
                style={{ boxShadow: "0 10px 30px var(--shadow)" }}
              >
                <Link
                  href={targetRoute}
                  onClick={() => removeToast(toast.id)}
                  className="flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--burgundy)] shrink-0 mt-0.5">
                    {toast.type === "game_started" ? (
                      <Gamepad2 className="w-4.5 h-4.5 text-[var(--burgundy)]" />
                    ) : toast.type === "letter_sent" ? (
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

                  <div className="flex-1 space-y-1">
                    <p className="font-heading font-bold text-sm text-[var(--burgundy)]">{toast.title}</p>
                    {toast.body && (
                      <p className="font-sans text-xs text-[var(--text-soft)] leading-snug">{toast.body}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--burgundy)] hover:underline pt-1">
                      View details →
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeToast(toast.id);
                    }}
                    className="text-[var(--text-soft)] hover:text-[var(--text)] p-1 rounded-full hover:bg-black/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
