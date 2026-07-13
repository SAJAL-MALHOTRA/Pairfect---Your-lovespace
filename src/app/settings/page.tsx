"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { Settings, User, Music, Link2, LogOut, Check, Heart, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, pair, partner, refreshSession, signOut, loading } = useAuth();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  const [updatingSpotify, setUpdatingSpotify] = useState(false);
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

  const handleToggleSpotify = async () => {
    setUpdatingSpotify(true);
    setError(null);
    try {
      const currentStatus = profile?.spotify_connected || false;
      const { error: updateErr } = await supabase
        .from("users")
        .update({ spotify_connected: !currentStatus })
        .eq("id", user!.id);

      if (updateErr) throw updateErr;

      await refreshSession();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to toggle Spotify status.");
    } finally {
      setUpdatingSpotify(false);
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
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-rose-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-gradient-to-b from-brand-rose-50/20 via-background to-background">
      <Navigation />

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center space-x-2">
            <Settings className="w-8 h-8 text-muted-foreground" />
            <span>Settings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, pair configurations, and third-party integrations.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Profile Settings */}
        <div className="cozy-card p-6 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center space-x-2 pb-2 border-b border-card-border/50">
            <User className="w-5 h-5 text-brand-rose-500" />
            <span>Profile Details</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Display Name (how you appear to partner)
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-card-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-brand-rose-300 text-foreground text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {profileSuccess ? (
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </span>
              ) : (
                <span />
              )}
              
              <button
                type="submit"
                disabled={updatingProfile || displayName.trim() === profile?.display_name}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-rose-500 hover:bg-brand-rose-600 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
              >
                {updatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Spotify Settings */}
        <div className="cozy-card p-6 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center space-x-2 pb-2 border-b border-card-border/50">
            <Music className="w-5 h-5 text-brand-sage-500" />
            <span>Spotify Integration</span>
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Spotify Status: {profile?.spotify_connected ? "Connected" : "Disconnected"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Linking Spotify enables attaching your recently played songs to daily mood check-ins.
              </p>
            </div>

            <button
              onClick={handleToggleSpotify}
              disabled={updatingSpotify}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                profile?.spotify_connected
                  ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 hover:bg-red-100"
                  : "bg-brand-sage-500 text-white hover:bg-brand-sage-600 shadow-sm"
              }`}
            >
              {updatingSpotify ? "Processing..." : profile?.spotify_connected ? "Disconnect" : "Connect Spotify"}
            </button>
          </div>
        </div>

        {/* 3. Pairing Settings */}
        {pair && (
          <div className="cozy-card p-6 bg-white/50 dark:bg-[#1e1a19]/50 border border-card-border space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center space-x-2 pb-2 border-b border-card-border/50">
              <Heart className="w-5 h-5 text-brand-rose-500 fill-brand-rose-400/20" />
              <span>Relationship Connection</span>
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Partner:</span>
                <span className="font-bold text-foreground">
                  {partner?.display_name || "Waiting for partner to join..."}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invite Code:</span>
                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-card-border">
                  {pair.invite_code}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session Status:</span>
                <span className="font-semibold text-brand-peach-500 capitalize">
                  {pair.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-card-border/40 flex justify-end">
              <button
                onClick={handleUnlinkPair}
                disabled={unlinkingPair}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 border border-red-200 dark:border-red-900/50 active:scale-[0.98] disabled:opacity-50 transition-all"
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
