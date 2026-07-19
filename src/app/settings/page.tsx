"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Settings, User, Check, Heart, Loader2,
  AlertCircle, ShieldAlert, Mail, Key, Bell, ShieldQuestion
} from "lucide-react";

const APP_VERSION = "0.1.0";
const DEFAULT_NOTIFICATION_SETTINGS = {
  partner_check_in: true,
  new_gratitude: true,
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function SettingsPage() {
  const { user, profile, pair, partner, refreshSession, signOut, loading } = useAuth();
  const supabase = createClient();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Profile States
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // 2. Email States
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // 3. Password States
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 4. Notification States
  const [partnerCheckInAlert, setPartnerCheckInAlert] = useState(true);
  const [newGratitudeAlert, setNewGratitudeAlert] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  // 5. Unlinking State
  const [unlinkingPair, setUnlinkingPair] = useState(false);

  // 6. Account Deletion Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Sync state with loaded profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");

      const settings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(profile.notification_settings || {}),
      };
      setPartnerCheckInAlert(settings.partner_check_in);
      setNewGratitudeAlert(settings.new_gratitude);
    }
  }, [profile]);

  // Is Google OAuth User check
  const canChangePassword = Boolean(
    user &&
      (user.identities?.some((id) => id.provider === "email") ||
        user.app_metadata?.provider !== "google")
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !user) return;
    setUpdatingProfile(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setSuccessMessage("Profile updated successfully!");
      await refreshSession();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to update profile settings."));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setUpdatingEmail(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (emailErr) throw emailErr;

      setSuccessMessage("Confirmation links sent! Please check both your current and new email inbox.");
      setNewEmail("");
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to update email."));
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setUpdatingPassword(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) throw passErr;

      setSuccessMessage("Password updated successfully!");
      setNewPassword("");
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggleNotification = async (type: "partner_check_in" | "new_gratitude", checked: boolean) => {
    if (!user) return;
    setUpdatingNotifications(true);
    setError(null);

    const updatedSettings = {
      partner_check_in: type === "partner_check_in" ? checked : partnerCheckInAlert,
      new_gratitude: type === "new_gratitude" ? checked : newGratitudeAlert,
    };

    if (type === "partner_check_in") setPartnerCheckInAlert(checked);
    else setNewGratitudeAlert(checked);

    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ notification_settings: updatedSettings })
        .eq("id", user.id);

      if (updateErr) throw updateErr;
      await refreshSession();
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to update notification settings. Make sure you applied migration_v21.sql.");
      // Rollback UI state on failure
      if (type === "partner_check_in") setPartnerCheckInAlert(!checked);
      else setNewGratitudeAlert(!checked);
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const handleUnlinkPair = async () => {
    if (!pair) return;
    if (!confirm("Are you sure you want to unlink from your partner? This will keep your shared history but disconnect the pair.")) {
      return;
    }

    setUnlinkingPair(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/unlink-pair", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlink pair.");
      await refreshSession();
      setSuccessMessage("Partner session unlinked successfully.");
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to unlink pair."));
    } finally {
      setUnlinkingPair(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    setDeletingAccount(true);
    setError(null);
    try {
      const { error: deleteErr } = await supabase.functions.invoke("delete-account");
      if (deleteErr) throw deleteErr;

      // Logout and redirect
      await signOut();
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to delete account. Please try again."));
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
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
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 bg-background text-foreground transition-colors duration-200">
      <Navigation />

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8 z-10">
        <div>
          <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
            <Settings className="w-7 h-7 text-primary animate-spin-slow" />
            <span>Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your personal profile details, account credentials, notifications, and pairing.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start space-x-2 animate-pulse">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs flex items-start space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. PROFILE DETAILS */}
        <div className="card-standard p-6 space-y-4">
          <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-2">
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
                className="block w-full px-3.5 py-2.5 border border-border rounded-button bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile || displayName.trim() === profile?.display_name}
                className="btn-primary py-2 px-5 text-xs"
              >
                {updatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* 2. CHANGE EMAIL */}
        <div className="card-standard p-6 space-y-4">
          <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-2">
            <Mail className="w-4 h-4 text-primary" />
            <span>Change Email Address</span>
          </h2>

          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-mono">Current Email: {user?.email}</p>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                New Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. newemail@example.com"
                className="block w-full px-3.5 py-2.5 border border-border rounded-button bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updatingEmail || !newEmail.trim()}
                className="btn-secondary py-2 px-5 text-xs"
              >
                {updatingEmail ? "Updating..." : "Send Verification"}
              </button>
            </div>
          </form>
        </div>

        {/* 3. CHANGE PASSWORD (HIDDEN FOR GOOGLE OAUTH) */}
        {canChangePassword && (
          <div className="card-standard p-6 space-y-4">
            <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-2">
              <Key className="w-4 h-4 text-primary" />
              <span>Change Password</span>
            </h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="block w-full px-3.5 py-2.5 border border-border rounded-button bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPassword || newPassword.length < 6}
                  className="btn-secondary py-2 px-5 text-xs"
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. NOTIFICATION PREFERENCES */}
        <div className="card-standard p-6 space-y-4">
          <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-2">
            <Bell className="w-4 h-4 text-primary" />
            <span>Notification Preferences</span>
          </h2>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">Partner Check-in Alerts</span>
                <p className="text-[10px] text-muted-foreground font-mono">Notify me when my partner logs their daily mood status</p>
              </div>
              <input
                type="checkbox"
                checked={partnerCheckInAlert}
                disabled={updatingNotifications}
                onChange={(e) => handleToggleNotification("partner_check_in", e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/40 focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">New Gratitude Notes</span>
                <p className="text-[10px] text-muted-foreground font-mono">Alert me when my partner drops an appreciation note in the jar</p>
              </div>
              <input
                type="checkbox"
                checked={newGratitudeAlert}
                disabled={updatingNotifications}
                onChange={(e) => handleToggleNotification("new_gratitude", e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/40 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* 5. RELATIONSHIP CONNECTION */}
        {pair && pair.status === "active" && (
          <div className="card-standard p-6 space-y-4">
            <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-2">
              <Heart className="w-4 h-4 text-primary animate-pulse" />
              <span>Relationship Connection</span>
            </h2>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Partner:</span>
                <span className="font-extrabold text-foreground">
                  {partner?.display_name || "Waiting for partner to join..."}
                </span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">Invite Code:</span>
                <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                  {pair.invite_code}
                </span>
              </div>
              <div className="flex justify-between text-xs">
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
                className="px-5 py-2 rounded-button text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {unlinkingPair ? "Unlinking..." : "Unlink Partner Session"}
              </button>
            </div>
          </div>
        )}

        {/* 6. DANGER ZONE (DELETE ACCOUNT) */}
        <div className="card-standard border border-red-500/20 p-6 space-y-4 bg-red-500/[0.01]">
          <h2 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest pb-3 border-b border-red-500/10 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
            <span>Danger Zone</span>
          </h2>

          <div className="space-y-3 pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-foreground">Permanently Delete Account</h3>
              <p className="text-[10px] text-muted-foreground max-w-md">
                Deletes your profile, login credentials, and unlinks your relationship. Related data is removed through cascade rules.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-2.5 rounded-button text-xs font-bold text-red-500 border border-red-500/30 bg-transparent hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* 7. SUPPORT / CONTACT FOOTER */}
        <div className="pt-8 text-center space-y-1 select-none flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldQuestion className="w-3.5 h-3.5 text-primary" />
            <span>Pairfect v{APP_VERSION}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Need help? Contact us at <a href="mailto:support@pairfect.app" className="underline hover:text-primary">support@pairfect.app</a>
          </p>
        </div>
      </main>

      {/* ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-red-500/20 max-w-sm w-full rounded-card p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top warning line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

            <div className="space-y-2 text-center">
              <h3 className="font-sans font-black text-lg text-foreground flex items-center justify-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <span>Confirm Deletion</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                This is permanent and cannot be undone — type DELETE to confirm.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-red-400 text-center">
                Type DELETE below to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="block w-full text-center px-4 py-2 border border-red-500/30 rounded-button bg-background/50 focus:outline-none focus:ring-2 focus:ring-red-500/40 text-sm font-bold tracking-widest text-red-500 uppercase placeholder:opacity-30"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-button text-xs font-bold text-muted-foreground border border-border bg-card hover:bg-accent cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE" || deletingAccount}
                className="flex-1 py-2.5 rounded-button text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
              >
                {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
