"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import {
  Check, Loader2, AlertCircle, ShieldAlert, ChevronRight
} from "lucide-react";

const APP_VERSION = "0.1.0";
const DEFAULT_NOTIFICATION_SETTINGS = {
  partner_check_in: true,
  new_gratitude: true,
};
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

// Settings row component — clean, iOS-like
function SettingsRow({
  label,
  description,
  right,
  dangerous = false,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  dangerous?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-4 px-0 ${dangerous ? "text-red-600 dark:text-red-400" : ""}`}>
      <div className="min-w-0 flex-1 pr-4">
        <p className={`text-sm font-medium leading-tight ${dangerous ? "text-red-600 dark:text-red-400" : "text-[var(--text)]"}`}>
          {label}
        </p>
        {description && (
          <p className="text-[10px] text-[var(--text-soft)] font-mono mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

// Settings section
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-soft)] px-1 mb-2">
        {title}
      </p>
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)] px-5">
        {children}
      </div>
    </div>
  );
}

// Clean toggle switch
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0 ${
        checked ? "bg-[var(--burgundy)]" : "bg-[var(--border)]"
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, profile, pair, partner, refreshSession, signOut, loading } = useAuth();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [partnerCheckInAlert, setPartnerCheckInAlert] = useState(true);
  const [newGratitudeAlert, setNewGratitudeAlert] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  const [unlinkingPair, setUnlinkingPair] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [updatingAnniversary, setUpdatingAnniversary] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(profile.notification_settings || {}) };
      setPartnerCheckInAlert(settings.partner_check_in);
      setNewGratitudeAlert(settings.new_gratitude);
    }
    if (pair?.started_dating_date) {
      setAnniversaryDate(pair.started_dating_date);
    }
  }, [profile, pair]);

  const canChangePassword = Boolean(
    user && (user.identities?.some((id: any) => id.provider === "email") || user.app_metadata?.provider !== "google")
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !user) return;
    setUpdatingProfile(true); setSuccessMessage(null); setError(null);
    try {
      const { error: updateErr } = await supabase.from("users").update({ display_name: displayName.trim() }).eq("id", user.id);
      if (updateErr) throw updateErr;
      setSuccessMessage("Name updated.");
      await refreshSession();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update profile."));
    } finally { setUpdatingProfile(false); }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setUpdatingEmail(true); setSuccessMessage(null); setError(null);
    try {
      const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (emailErr) throw emailErr;
      setSuccessMessage("Verification email sent to both addresses.");
      setNewEmail("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update email."));
    } finally { setUpdatingEmail(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setUpdatingPassword(true); setSuccessMessage(null); setError(null);
    try {
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) throw passErr;
      setSuccessMessage("Password updated.");
      setNewPassword("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update password."));
    } finally { setUpdatingPassword(false); }
  };

  const handleToggleNotification = async (type: "partner_check_in" | "new_gratitude", checked: boolean) => {
    if (!user) return;
    setUpdatingNotifications(true); setError(null);
    const updated = {
      partner_check_in: type === "partner_check_in" ? checked : partnerCheckInAlert,
      new_gratitude: type === "new_gratitude" ? checked : newGratitudeAlert,
    };
    if (type === "partner_check_in") setPartnerCheckInAlert(checked);
    else setNewGratitudeAlert(checked);
    try {
      const { error: updateErr } = await supabase.from("users").update({ notification_settings: updated }).eq("id", user.id);
      if (updateErr) throw updateErr;
      await refreshSession();
    } catch (err: unknown) {
      setError("Failed to update notifications.");
      if (type === "partner_check_in") setPartnerCheckInAlert(!checked);
      else setNewGratitudeAlert(!checked);
    } finally { setUpdatingNotifications(false); }
  };

  const handleSaveAnniversary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anniversaryDate || !pair) return;
    setUpdatingAnniversary(true); setSuccessMessage(null); setError(null);
    try {
      const { error: updateErr } = await supabase
        .from("pairs")
        .update({ started_dating_date: anniversaryDate })
        .eq("id", pair.id);
      if (updateErr) throw updateErr;
      setSuccessMessage("Anniversary date saved.");
      await refreshSession();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save anniversary date."));
    } finally { setUpdatingAnniversary(false); }
  };

  const handleUnlinkPair = async () => {
    if (!pair || !confirm("Unlink from your partner? Your shared history stays intact.")) return;
    setUnlinkingPair(true); setError(null);
    try {
      const res = await fetch("/api/auth/unlink-pair", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshSession();
      setSuccessMessage("Partner unlinked.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to unlink."));
    } finally { setUnlinkingPair(false); }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    setDeletingAccount(true); setError(null);
    try {
      const { error: deleteErr } = await supabase.functions.invoke("delete-account");
      if (deleteErr) throw deleteErr;
      await signOut();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete account."));
      setDeletingAccount(false); setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--burgundy)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      <Navigation />

      <main className="max-w-md mx-auto px-5 py-16 pb-36 space-y-8">

        {/* Header — the simplicity IS the hero */}
        <div>
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--text-soft)]">Account</p>
          <h1 className="font-display italic text-3xl font-black text-[var(--text)] mt-0.5">Settings</h1>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl px-4 py-3">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile section */}
        <Section title="Profile">
          <form onSubmit={handleUpdateProfile}>
            <SettingsRow
              label="Display name"
              description={profile?.display_name || "Not set"}
            />
            <div className="pb-4 space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
              />
              <button
                type="submit"
                disabled={updatingProfile || displayName.trim() === profile?.display_name}
                className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
              >
                {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </button>
            </div>
          </form>
        </Section>

        {/* Account section */}
        <Section title="Account">
          <form onSubmit={handleUpdateEmail}>
            <SettingsRow
              label="Email address"
              description={user?.email}
            />
            <div className="pb-4 space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="New email address"
                className="w-full px-4 py-2.5 border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
              />
              <button
                type="submit"
                disabled={updatingEmail || !newEmail.trim()}
                className="btn-secondary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
              >
                {updatingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Verification"}
              </button>
            </div>
          </form>

          {canChangePassword && (
            <form onSubmit={handleUpdatePassword}>
              <SettingsRow label="Password" description="Change your account password" />
              <div className="pb-4 space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full px-4 py-2.5 border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
                />
                <button
                  type="submit"
                  disabled={updatingPassword || newPassword.length < 6}
                  className="btn-secondary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
                >
                  {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </Section>

        {/* Preferences section */}
        <Section title="Preferences">
          <SettingsRow
            label="Dark Mode"
            description="Toggle dark and light physical tones"
            right={
              <Toggle
                checked={theme === "dark"}
                onChange={toggleTheme}
              />
            }
          />
        </Section>

        {/* Notifications section */}
        <Section title="Notifications">
          <SettingsRow
            label="Partner check-in alerts"
            description="When your partner logs their mood"
            right={
              <Toggle
                checked={partnerCheckInAlert}
                onChange={v => handleToggleNotification("partner_check_in", v)}
                disabled={updatingNotifications}
              />
            }
          />
          <SettingsRow
            label="New gratitude notes"
            description="When your partner adds to the jar"
            right={
              <Toggle
                checked={newGratitudeAlert}
                onChange={v => handleToggleNotification("new_gratitude", v)}
                disabled={updatingNotifications}
              />
            }
          />
        </Section>

        {/* Relationship section */}
        {pair?.status === "active" && (
          <Section title="Relationship">
            <SettingsRow
              label="Connected to"
              description={partner?.display_name || "Your partner"}
              right={<span className="text-[9px] font-mono uppercase tracking-widest text-[var(--burgundy)]">Active</span>}
            />
            <SettingsRow
              label="Invite code"
              description="Share to invite your partner"
              right={<span className="text-[10px] font-mono font-bold bg-[var(--paper-mid)] text-[var(--text)] px-2 py-1 rounded-lg border border-[var(--border)]">{pair.invite_code}</span>}
            />

            {/* Anniversary / Start Date */}
            <form onSubmit={handleSaveAnniversary}>
              <SettingsRow
                label="Anniversary date"
                description={anniversaryDate ? `Set to ${new Date(anniversaryDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Not set yet"}
              />
              <div className="pb-4 space-y-3">
                <input
                  type="date"
                  value={anniversaryDate}
                  onChange={e => setAnniversaryDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
                />
                <button
                  type="submit"
                  disabled={updatingAnniversary || !anniversaryDate}
                  className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-40"
                >
                  {updatingAnniversary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Date"}
                </button>
              </div>
            </form>

            <div className="py-4">
              <button
                onClick={handleUnlinkPair}
                disabled={unlinkingPair}
                className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer transition-colors disabled:opacity-40"
              >
                {unlinkingPair ? "Unlinking..." : "Unlink partner session"}
              </button>
            </div>
          </Section>
        )}

        {/* Danger zone */}
        <Section title="Danger zone">
          <div className="py-4">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer transition-colors"
            >
              Delete account permanently
            </button>
            <p className="text-[10px] text-[#A89E90] font-mono mt-1">
              This removes all your data and cannot be undone.
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[9px] font-mono text-[#C4B8A8] dark:text-[#5A5045]">
            Pairfect v{APP_VERSION} · <a href="mailto:support@pairfect.site" className="hover:text-[#8A7B6E] transition-colors">support@pairfect.site</a>
          </p>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--bg)] rounded-3xl max-w-sm w-full border border-red-200 dark:border-red-900/30 overflow-hidden shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <p className="font-bold text-[var(--text)] text-sm">Delete account</p>
              </div>
              <p className="text-xs text-[var(--text-soft)] leading-relaxed">
                This is permanent. Your profile, login, and relationship data will be removed. Type <strong className="text-red-500">DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full text-center px-4 py-2.5 border border-red-200 dark:border-red-900/30 rounded-xl bg-transparent text-sm font-bold tracking-widest text-red-500 uppercase placeholder:opacity-30 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}
                  disabled={deletingAccount}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-soft)] border border-[var(--border)] bg-transparent hover:bg-[var(--card-bg)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "DELETE" || deletingAccount}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 cursor-pointer transition-all flex items-center justify-center"
                >
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
