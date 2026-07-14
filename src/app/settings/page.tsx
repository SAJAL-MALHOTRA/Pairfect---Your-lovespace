"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { Settings, User, Music, Link2, LogOut, Check, Heart, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, pair, partner, refreshSession, signOut, loading } = useAuth();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  const [unlinkingPair, setUnlinkingPair] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setUpdatingProfile(true);
    setProfileSuccess(false);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ display_name: displayName.trim() })
        .eq("id", user!.id);

      if (updateErr) throw updateErr;

      setProfileSuccess(true);
      await refreshSession();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUnlinkPair = async () => {
    if (!pair) return;
    if (
      !confirm(
        "Are you sure you want to unlink from your partner? This will archive your shared session."
      )
    ) {
      return;
    }

    setUnlinkingPair(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from("pairs")
        .update({ status: "archived" })
        .eq("id", pair.id);

      if (updateErr) throw updateErr;

      await refreshSession();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to unlink pair.");
    } finally {
      setUnlinkingPair(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">          <div className="w-8 h-8 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
      <Navigation />

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        <div>
          <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
            <Settings className="w-7 h-7 text-primary" />
            <span>Settings</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your profile, pair configurations, and third-party integrations.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-accent/40 border border-border text-primary text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Profile Settings */}
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
          {/* 3px top gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa] z-10" />

          <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-1.5">
            <User className="w-4 h-4 text-primary" />
            <span>Profile Details</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Display Name (how you appear to partner)
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {profileSuccess ? (
                <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </span>
              ) : (
                <span />
              )}
              
              <button
                type="submit"
                disabled={updatingProfile || displayName.trim() === profile?.display_name}
                className="px-5 py-2.5 rounded-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer shadow-md shadow-pink-500/10 dark:shadow-none"
              >
                {updatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>



        {/* 3. Pairing Settings */}
        {pair && (
          <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
            {/* 3px top gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa] z-10" />

            <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-primary" />
              <span>Relationship Connection</span>
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Partner:</span>
                <span className="font-extrabold text-foreground">
                  {partner?.display_name || "Waiting for partner to join..."}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Invite Code:</span>
                <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  {pair.invite_code}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session Status:</span>
                <span className="font-bold text-primary capitalize">
                  {pair.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={handleUnlinkPair}
                disabled={unlinkingPair}
                className="px-5 py-2.5 rounded-md text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {unlinkingPair ? "Unlinking..." : "Unlink Partner Session"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
