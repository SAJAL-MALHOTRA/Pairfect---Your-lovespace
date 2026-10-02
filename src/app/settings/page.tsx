"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import {
  Check, Loader2, AlertCircle, ShieldAlert, ChevronRight, MapPin, Trash2, Sparkles, Heart, Crown, Calendar, LogOut, ShieldCheck, KeyRound
} from "lucide-react";
import CitySelectorModal from "@/components/city-selector-modal";
import { useSubscription } from "@/hooks/use-subscription";
import {
  hasPairKey,
  getPairKey,
  savePairKey,
  exportKeyToFragment,
  extractKeyFromFragment,
  importKeyFromFragment,
  generateCoupleKey,
  deletePairKey,
} from "@/lib/crypto/e2ee";

const APP_VERSION = "0.1.0";
const DEFAULT_NOTIFICATION_SETTINGS = {
  partner_check_in: true,
  new_gratitude: true,
};
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

// Settings row component: clean, iOS-like
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
      <div className="bg-[var(--bg-secondary)] paper-grain rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)] px-5">
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
  const { isPlus, tier, daysRemaining, expiresAt, isLifetime, isExpiringSoon } = useSubscription();
  const supabase = createClient();
  const router = useRouter();

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
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [clearingCity, setClearingCity] = useState(false);

  const [unlinkingPair, setUnlinkingPair] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkConfirmText, setUnlinkConfirmText] = useState("");
  const [sharedCounts, setSharedCounts] = useState<{ letters: number; memories: number; mixtapes: number; gratitude: number }>({
    letters: 0,
    memories: 0,
    mixtapes: 0,
    gratitude: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [updatingAnniversary, setUpdatingAnniversary] = useState(false);

  // E2EE Vault Key states
  const [vaultKeyExists, setVaultKeyExists] = useState<boolean | null>(null);
  const [keyLinkCopied, setKeyLinkCopied] = useState(false);
  const [showImportKeyModal, setShowImportKeyModal] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState("");
  const [importingVaultKey, setImportingVaultKey] = useState(false);

  useEffect(() => {
    if (pair?.id) {
      hasPairKey(pair.id).then(exists => setVaultKeyExists(exists));
    }
  }, [pair?.id]);

  const handleShareKeyLink = async () => {
    if (!pair?.id) return;
    try {
      const key = await getPairKey(pair.id);
      if (!key) {
        setError("Vault encryption key is not present on this device.");
        return;
      }
      const frag = await exportKeyToFragment(key);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://www.pairfect.site";
      const fullLink = `${origin}/onboarding?code=${pair.invite_code}#k=${frag}`;
      await navigator.clipboard.writeText(fullLink);
      setKeyLinkCopied(true);
      setSuccessMessage("Secret invite link copied! Send it to your partner to restore their encryption key.");
      setTimeout(() => setKeyLinkCopied(false), 3000);
    } catch (e: any) {
      setError("Failed to export encryption key: " + (e?.message || "Unknown error"));
    }
  };

  const handleImportKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair?.id || !importKeyInput.trim()) return;
    setImportingVaultKey(true);
    try {
      const text = importKeyInput.trim();
      const rawKey = extractKeyFromFragment(text) || text;
      const importedKey = await importKeyFromFragment(rawKey);
      await savePairKey(pair.id, importedKey);
      setVaultKeyExists(true);
      setShowImportKeyModal(false);
      setImportKeyInput("");
      setSuccessMessage("Encryption key imported successfully! Encrypted photos will now decrypt.");
    } catch (e: any) {
      setError("Invalid encryption key or link. Please paste the full secret invite link containing #k=");
    } finally {
      setImportingVaultKey(false);
    }
  };

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

  const openUnlinkModal = async () => {
    if (!pair) return;
    setShowUnlinkModal(true);
    setLoadingCounts(true);
    try {
      const [lettersRes, memoriesRes, mixtapesRes, gratitudeRes] = await Promise.all([
        supabase.from("love_letters").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
        supabase.from("shared_moments").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
        supabase.from("mixtapes").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
        supabase.from("gratitude_entries").select("id", { count: "exact", head: true }).eq("pair_id", pair.id),
      ]);

      setSharedCounts({
        letters: lettersRes.count || 0,
        memories: memoriesRes.count || 0,
        mixtapes: mixtapesRes.count || 0,
        gratitude: gratitudeRes.count || 0,
      });
    } catch (e) {
      console.error("Failed to load shared counts:", e);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleUnlinkPair = async () => {
    if (!pair || unlinkConfirmText.trim().toUpperCase() !== "UNLINK") return;
    setUnlinkingPair(true); setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc("unlink_and_delete_pair", { p_pair_id: pair.id });
      if (rpcErr) {
        const res = await fetch("/api/auth/unlink-pair", { method: "POST" });
        const data = await res.json();
        if (!res.ok && !data.success) throw new Error(data.error || "Failed to unlink");
      }

      // Purge the local AES key from IndexedDB so no stale key remains on this device
      await deletePairKey(pair.id);

      await refreshSession();
      setShowUnlinkModal(false);
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to unlink partner."));
    } finally { setUnlinkingPair(false); }
  };


  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeletingAccount(true); setError(null);
    try {
      if (pair?.id) {
        await deletePairKey(pair.id);
      }

      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete account");
      }

      await signOut();
      setShowDeleteModal(false);
      router.push("/login");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete account."));
      setDeletingAccount(false);
      setShowDeleteModal(false);
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

        {/* Header: the simplicity IS the hero */}
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

        {/* Pairfect Membership & Plans */}
        <Section title="Pairfect Membership & Plans">
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLifetime ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                    <Crown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    Forever Pass · Lifetime
                  </span>
                ) : isPlus ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Pairfect Plus · Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    Free Plan
                  </span>
                )}
                {isExpiringSoon && (
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/30">
                    Expiring Soon
                  </span>
                )}
              </div>

              <Link
                href="/checkout"
                className="btn-primary py-1.5 px-3.5 text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer rounded-xl bg-[var(--burgundy)] text-white hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPlus ? "Extend / Upgrade" : "View Plans"}</span>
              </Link>
            </div>

            <div className="text-xs text-[var(--text-soft)] space-y-1">
              <p>
                {isLifetime
                  ? "Both you and your partner have permanent lifetime access to all Pairfect features."
                  : isPlus
                  ? `${daysRemaining !== null ? `${daysRemaining} days remaining` : "Active pass"} · Covers both partners.`
                  : "One pass covers both partners. Includes unlimited Photobooth, AI Vibe Judge, and Memory Wall."}
              </p>
              {expiresAt && !isLifetime && (
                <p className="text-[10px] font-mono text-[var(--text-soft)] flex items-center gap-1 pt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Valid until {new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Your City (Meanwhile Proximity) */}
        <Section title="Your City (Meanwhile Proximity)">
          <SettingsRow
            label="Current City"
            description={profile?.city ? `${profile.city.name}, ${profile.city.country}` : "No city selected yet"}
            right={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(true)}
                  className="btn-secondary py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-[var(--burgundy)]" />
                  <span>{profile?.city ? "Change" : "Choose City"}</span>
                </button>

                {profile?.city && (
                  <button
                    type="button"
                    disabled={clearingCity}
                    onClick={async () => {
                      const confirmClear = window.confirm(
                        "Stop sharing your city?\n\nYour partner will no longer see your distance, local weather or local time."
                      );
                      if (!confirmClear) return;

                      setClearingCity(true);
                      try {
                        const res = await fetch("/api/city", { method: "DELETE" });
                        if (res.ok) {
                          setSuccessMessage("City cleared.");
                          await refreshSession();
                        }
                      } catch (e) {
                        setError("Failed to clear city.");
                      } finally {
                        setClearingCity(false);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-[10px] font-mono cursor-pointer transition-colors"
                    title="Clear city"
                  >
                    {clearingCity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
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

            {/* Scrapbook Encryption Key (Zero-Knowledge) */}
            <SettingsRow
              label="Scrapbook Encryption Key"
              description={
                vaultKeyExists === null
                  ? "Checking device vault..."
                  : vaultKeyExists
                  ? "Active on this device (Zero-knowledge AES-256)"
                  : "Key missing on this device (Photos cannot be decrypted)"
              }
              right={
                <div className="flex items-center gap-2">
                  {vaultKeyExists ? (
                    <button
                      type="button"
                      onClick={handleShareKeyLink}
                      className="btn-secondary py-1.5 px-3 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{keyLinkCopied ? "Link Copied!" : "Re-Share Secret Link"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImportKeyModal(true)}
                      className="btn-secondary py-1.5 px-3 text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Import Key</span>
                    </button>
                  )}
                </div>
              }
            />

            {/* Legacy photos notice */}
            <p className="text-[10px] text-[var(--text-soft)] font-mono leading-relaxed pb-1">
              Photos taken before encryption was enabled are stored in standard couple cloud storage and are not end-to-end encrypted.
            </p>

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

            <div className="py-4 border-t border-[var(--border)] pt-4 flex justify-end">
              <button
                onClick={openUnlinkModal}
                disabled={unlinkingPair}
                className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer transition-colors disabled:opacity-40"
              >
                {unlinkingPair ? "Unlinking..." : "Unlink partner session"}
              </button>
            </div>
          </Section>
        )}

        {/* Session & Account */}
        <Section title="Session">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">Sign out of Pairfect</p>
              <p className="text-[11px] text-[var(--text-soft)]">
                Logged in as <span className="font-mono text-[var(--text)] font-medium">{user?.email}</span>
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone">
          <div className="py-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer transition-colors"
            >
              Delete account permanently
            </button>
            <p className="text-[10px] text-[#A89E90] font-mono mt-0.5">
              This removes all your data and cannot be undone.
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[9px] font-mono text-[#C4B8A8] dark:text-[#5A5045]">
            Pairfect v{APP_VERSION} · <a href="mailto:pairfect.site@yahoo.com" className="hover:text-[#8A7B6E] transition-colors">pairfect.site@yahoo.com</a>
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
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === "Enter" && confirmText.trim().toUpperCase() === "DELETE" && !deletingAccount) {
                    handleDeleteAccount();
                  }
                }}
                placeholder="DELETE"
                autoFocus
                className="w-full text-center px-4 py-2.5 border border-red-200 dark:border-red-900/30 rounded-xl bg-transparent text-sm font-bold tracking-widest text-red-500 uppercase placeholder:opacity-30 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}
                  disabled={deletingAccount}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-soft)] border border-[var(--border)] bg-transparent hover:bg-[var(--bg-secondary)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={confirmText.trim().toUpperCase() !== "DELETE" || deletingAccount}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 cursor-pointer transition-all flex items-center justify-center"
                >
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlink partner confirmation modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--bg)] rounded-3xl max-w-sm w-full border border-red-200 dark:border-red-900/30 overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <p className="font-heading font-bold text-base text-[var(--text)]">Unlink Partner</p>
                <p className="text-[11px] text-[var(--text-soft)]">Connected to {partner?.display_name || "partner"}</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-soft)] leading-relaxed">
              This will <strong className="text-red-500">permanently delete all shared letters, memories, mixtapes, and gratitude notes</strong> for both of you. This cannot be undone.
            </p>

            {/* Live Shared Items Counts */}
            {loadingCounts ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--burgundy)]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[var(--text-soft)] pt-1">
                <div className="bg-[var(--paper-warm)] p-2 rounded-xl border border-[var(--border)] text-center">
                  <span className="font-bold text-red-500 text-sm">{sharedCounts.letters}</span> Letters
                </div>
                <div className="bg-[var(--paper-warm)] p-2 rounded-xl border border-[var(--border)] text-center">
                  <span className="font-bold text-red-500 text-sm">{sharedCounts.memories}</span> Memories
                </div>
                <div className="bg-[var(--paper-warm)] p-2 rounded-xl border border-[var(--border)] text-center">
                  <span className="font-bold text-red-500 text-sm">{sharedCounts.mixtapes}</span> Mixtapes
                </div>
                <div className="bg-[var(--paper-warm)] p-2 rounded-xl border border-[var(--border)] text-center">
                  <span className="font-bold text-red-500 text-sm">{sharedCounts.gratitude}</span> Gratitude Notes
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-sans text-[var(--text-soft)]">
                To confirm permanent deletion, type <strong className="text-red-500 font-mono">UNLINK</strong> below:
              </p>
              <input
                type="text"
                value={unlinkConfirmText}
                onChange={e => setUnlinkConfirmText(e.target.value.toUpperCase())}
                placeholder="UNLINK"
                className="w-full text-center px-4 py-2.5 border border-red-200 dark:border-red-900/30 rounded-xl bg-transparent text-sm font-bold tracking-widest text-red-500 uppercase placeholder:opacity-30 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowUnlinkModal(false); setUnlinkConfirmText(""); }}
                disabled={unlinkingPair}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-soft)] border border-[var(--border)] bg-transparent hover:bg-[var(--bg-secondary)] cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlinkPair}
                disabled={unlinkConfirmText.trim().toUpperCase() !== "UNLINK" || unlinkingPair}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 cursor-pointer transition-all flex items-center justify-center"
              >
                {unlinkingPair ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlink & Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import / Restore Encryption Key modal */}
      {showImportKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--bg)] rounded-3xl max-w-sm w-full border border-[var(--border)] overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-6 h-6 text-[var(--burgundy)] shrink-0" />
              <div>
                <p className="font-heading font-bold text-base text-[var(--text)]">Vault Encryption Key</p>
                <p className="text-[11px] text-[var(--text-soft)]">Zero-knowledge device setup</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-soft)] leading-relaxed">
              Paste the secret invite link shared by your partner (containing <span className="font-mono text-[var(--burgundy)]">#k=...</span>) to decrypt and view photos on this device.
            </p>

            <form onSubmit={handleImportKeySubmit} className="space-y-3">
              <input
                type="text"
                value={importKeyInput}
                onChange={e => setImportKeyInput(e.target.value)}
                placeholder="https://pairfect.site/onboarding?code=...#k=..."
                className="w-full px-3.5 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)] text-xs font-mono text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--burgundy)]"
              />
              <button
                type="submit"
                disabled={importingVaultKey || !importKeyInput.trim()}
                className="w-full btn-primary py-2.5 rounded-xl text-xs uppercase font-mono font-bold tracking-wider cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {importingVaultKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Import & Activate</span>
              </button>
            </form>

            <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
              <p className="text-[10px] text-[var(--text-soft)] text-center leading-relaxed">
                If your partner has the active key on their device, ask them to tap &ldquo;Re-Share Secret Link&rdquo; in their Settings.
              </p>
              <button
                type="button"
                onClick={() => { setShowImportKeyModal(false); setImportKeyInput(""); }}
                className="text-xs text-[var(--text-soft)] hover:text-[var(--text)] font-sans text-center cursor-pointer mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City Selector Modal */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onCitySelected={() => refreshSession()}
      />
    </div>
  );
}
