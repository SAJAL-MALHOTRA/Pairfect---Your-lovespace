"use client";

import React, { useState, useEffect } from "react";
import {
  generateRecoveryPhrase,
  validateRecoveryPhrase,
  wrapVaultKeyWithPhrase,
  unwrapVaultKeyWithPhrase,
} from "@/lib/crypto/recovery-phrase";
import { getPairKey, savePairKey } from "@/lib/crypto/e2ee";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Trash2,
  Download,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";

interface RecoveryPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairId?: string;
}

export function RecoveryPhraseModal({ isOpen, onClose, pairId }: RecoveryPhraseModalProps) {
  const [activeTab, setActiveTab] = useState<"backup" | "restore">("backup");

  // Backup state
  const [phrase, setPhrase] = useState<string>("");
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [serverEnvelopeDeleted, setServerEnvelopeDeleted] = useState<boolean>(false);
  const [isDeletingEnvelope, setIsDeletingEnvelope] = useState<boolean>(false);
  const [backupConfirmed, setBackupConfirmed] = useState<boolean>(false);
  const [isSyncingEnvelope, setIsSyncingEnvelope] = useState<boolean>(false);

  // Purge confirmation dialog state
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const [purgeWordInput, setPurgeWordInput] = useState<string>("");
  const [purgeError, setPurgeError] = useState<string | null>(null);

  // Restore state
  const [restoreInput, setRestoreInput] = useState<string>("");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Check server recovery envelope status when modal opens
  useEffect(() => {
    if (!isOpen || !pairId) return;

    async function checkEnvelopeStatus() {
      try {
        setIsSyncingEnvelope(true);
        const envRes = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId!)}&type=recovery`);
        const envData = await envRes.json();
        if (envData.success && !envData.envelope) {
          setServerEnvelopeDeleted(true);
        }
      } catch (err) {
        console.warn("[Recovery Modal] Error checking recovery envelope:", err);
      } finally {
        setIsSyncingEnvelope(false);
      }
    }

    checkEnvelopeStatus();
  }, [isOpen, pairId]);

  const handleGenerateNewPhrase = async () => {
    if (!pairId) return;
    setIsSyncingEnvelope(true);
    setPurgeError(null);
    try {
      const vaultKey = await getPairKey(pairId);
      if (!vaultKey) {
        setPurgeError("No active couple key found on this device to backup.");
        return;
      }
      const newPhrase = await generateRecoveryPhrase();
      setPhrase(newPhrase);
      const recoveryEnvelopeStr = await wrapVaultKeyWithPhrase(vaultKey, newPhrase, pairId);
      await fetch("/api/vault/envelope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairId, envelope: recoveryEnvelopeStr, type: "recovery" }),
      });
      setServerEnvelopeDeleted(false);
    } catch (err: any) {
      setPurgeError(err?.message || "Failed to generate new recovery phrase.");
    } finally {
      setIsSyncingEnvelope(false);
    }
  };

  if (!isOpen) return null;

  const words = phrase ? phrase.split(" ") : [];
  const confirmationTargetWord = words[2] || ""; // Word #3 for purge confirmation

  const handleCopy = () => {
    if (!phrase) return;
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!phrase) return;
    const content =
      "PAIRFECT VAULT CLIENT RECOVERY PHRASE\n" +
      "====================================\n" +
      `Pair ID: ${pairId}\n` +
      `Date Created: ${new Date().toLocaleDateString()}\n\n` +
      "12-Word Secret Recovery Phrase:\n" +
      phrase +
      "\n\n" +
      "IMPORTANT NOTICE:\n" +
      "These 12 words allow you and your partner to unlock your encrypted photos and memories.\n" +
      "Photos, letters and voice notes are encrypted on your device.\n" +
      "Pairfect servers never store or transmit this phrase. Keep this file in a secure location.\n";

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pairfect-vault-recovery-${pairId ? pairId.substring(0, 8) : "phrase"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmPurge = async () => {
    if (!pairId) return;
    setPurgeError(null);

    if (purgeWordInput.trim().toLowerCase() !== confirmationTargetWord.toLowerCase()) {
      setPurgeError(`Word #3 does not match. Please verify word 3 from your phrase above.`);
      return;
    }

    if (!phrase) {
      setPurgeError("No recovery phrase loaded. Purge aborted.");
      return;
    }

    setIsDeletingEnvelope(true);
    try {
      // Safety gate: Test-restore verification before cloud destruction
      // Proves cryptographically that the phrase can successfully unwrap the active vault key
      const localKey = await getPairKey(pairId);
      if (localKey) {
        const envRes = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId)}&type=recovery`);
        const envData = await envRes.json();
        if (envData.success && envData.envelope) {
          try {
            const testRecoveredKey = await unwrapVaultKeyWithPhrase(envData.envelope, phrase, pairId);
            const testBytes = await window.crypto.subtle.exportKey("raw", testRecoveredKey);
            const localBytes = await window.crypto.subtle.exportKey("raw", localKey);
            const testArr = new Uint8Array(testBytes);
            const localArr = new Uint8Array(localBytes);
            let matches = testArr.byteLength === localArr.byteLength;
            if (matches) {
              for (let i = 0; i < testArr.byteLength; i++) {
                if (testArr[i] !== localArr[i]) {
                  matches = false;
                  break;
                }
              }
            }
            if (!matches) {
              setPurgeError("Safety check failed: Recovery phrase does not unwrap the active vault key. Purge aborted to prevent permanent data loss.");
              setIsDeletingEnvelope(false);
              return;
            }
          } catch (unwrapErr: any) {
            setPurgeError(`Safety check failed: Could not unwrap vault envelope with this phrase (${unwrapErr?.message || "invalid key"}). Purge aborted.`);
            setIsDeletingEnvelope(false);
            return;
          }
        }
      }

      const res = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId)}&type=recovery`, {
        method: "DELETE",
      });
      if (res.ok) {
        setServerEnvelopeDeleted(true);
        setShowPurgeConfirm(false);
      } else {
        const data = await res.json();
        setPurgeError(data.error || "Failed to purge cloud envelope.");
      }
    } catch (e: any) {
      setPurgeError(e?.message || "Network error purging server envelope.");
    } finally {
      setIsDeletingEnvelope(false);
    }
  };

  const handleRestoreFromPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError(null);
    setRestoreSuccess(false);

    if (!pairId) {
      setRestoreError("No active couple found.");
      return;
    }

    // 1. Validate phrase format and checksum
    const validation = await validateRecoveryPhrase(restoreInput);
    if (!validation.valid) {
      setRestoreError(validation.error || "Invalid recovery phrase.");
      return;
    }

    setIsRestoring(true);
    try {
      // 2. Fetch recovery envelope from server
      const envRes = await fetch(`/api/vault/envelope?pairId=${encodeURIComponent(pairId)}&type=recovery`);
      const envData = await envRes.json();

      if (!envData.success || !envData.envelope) {
        setRestoreError(
          "No backup envelope found on the server. The recovery envelope was purged from cloud storage (device-only mode). To sync keys to this device, open Pairfect on your partner's active device."
        );
        return;
      }

      // 3. Unwrap vault key using the recovery phrase
      const recoveredKey = await unwrapVaultKeyWithPhrase(envData.envelope, restoreInput, pairId);
      await savePairKey(pairId, recoveredKey);

      setRestoreSuccess(true);
    } catch (err: any) {
      setRestoreError(err?.message || "Failed to restore vault key from phrase. Verify word spelling and order.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-stone-900">
                Couple Vault Recovery Phrase
              </h3>
              <p className="text-[11px] font-mono text-stone-500">
                Client-Side Encrypted Couple Vault
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100/70 mx-5 mt-4 rounded-xl text-xs font-mono font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "backup"
                ? "bg-white text-stone-900 shadow-xs font-bold"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Backup Phrase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("restore")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "restore"
                ? "bg-white text-stone-900 shadow-xs font-bold"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Restore Vault
          </button>
        </div>

        {/* Tab 1: Backup */}
        {activeTab === "backup" && (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Info notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Encrypted On Your Device</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Write down these 12 words in order. Photos, letters and voice notes are encrypted on your device. The server keeps no copy of your key once purged.
                </p>
              </div>
            </div>

            {words.length > 0 ? (
              <>
                {/* Word Chips Grid */}
                <div className="relative p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="grid grid-cols-3 gap-2">
                    {words.map((word, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono shadow-2xs"
                      >
                        <span className="text-[10px] text-stone-400 select-none">
                          {idx + 1}.
                        </span>
                        <span
                          className={`font-medium transition-all ${
                            isMasked ? "blur-xs select-none" : "text-stone-800"
                          }`}
                        >
                          {word}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Mask overlay button */}
                  {isMasked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-50/60 backdrop-blur-[1px] rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setIsMasked(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-mono font-medium shadow-xs hover:bg-stone-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-500" />
                        <span>Click to reveal words</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions: Reveal toggle, Copy, Download */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsMasked(!isMasked)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isMasked ? "Reveal" : "Hide"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Download .txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-3.5 rounded-lg shadow-2xs transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Phrase"}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-3">
                <p className="text-xs text-stone-600">
                  Your 12-word recovery phrase was presented during onboarding. For maximum security, Pairfect never stores recovery phrases in browser storage or in the cloud.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateNewPhrase}
                  disabled={isSyncingEnvelope}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-medium shadow-xs transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSyncingEnvelope ? "Generating..." : "Generate New Recovery Phrase"}</span>
                </button>
              </div>
            )}

            {/* Confirmation checkbox */}
            <div className="pt-2 border-t border-stone-100">
              <label className="flex items-start gap-2 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backupConfirmed}
                  onChange={(e) => setBackupConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                />
                <span>I have written down or saved my 12-word recovery phrase in a private place.</span>
              </label>
            </div>

            {/* Optional Device-Only Upgrade: Purge server-side envelope */}
            {backupConfirmed && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-mono font-bold text-stone-900">
                      Device-Only Mode (Cloud Purge)
                    </span>
                  </div>
                  {serverEnvelopeDeleted ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Envelope Purged
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {serverEnvelopeDeleted
                    ? "The server-stored key envelope has been permanently deleted from cloud storage. The server keeps no copy of your key."
                    : "Delete the server-stored envelope so that your key exists only on your devices and on your written recovery paper."}
                </p>

                {!serverEnvelopeDeleted && !showPurgeConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowPurgeConfirm(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Server Envelope</span>
                  </button>
                )}

                {/* Two-step purge confirmation */}
                {showPurgeConfirm && !serverEnvelopeDeleted && (
                  <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2 text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Device-Only Mode Warning</p>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Purging permanently deletes your 128-bit recovery envelope from Pairfect servers. The server only holds an encrypted envelope locked with your 12 words, which it never sees. After purging, a new phone or browser cannot restore your vault from the cloud using the 12 words alone because no envelope exists on the server. Recovery will depend entirely on maintaining an active local device.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-stone-700 mb-1">
                        To confirm, please enter word #3 ({confirmationTargetWord ? `"${confirmationTargetWord}"` : ""}) from your phrase:
                      </label>
                      <input
                        type="text"
                        value={purgeWordInput}
                        onChange={(e) => setPurgeWordInput(e.target.value)}
                        placeholder="Type word #3 to confirm"
                        className="w-full p-2 rounded-lg bg-white border border-stone-300 text-xs font-mono text-stone-800 focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    {purgeError && (
                      <p className="text-[11px] text-rose-700 font-mono">{purgeError}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmPurge}
                        disabled={isDeletingEnvelope || !purgeWordInput.trim()}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                      >
                        {isDeletingEnvelope ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm & Purge Forever</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPurgeConfirm(false);
                          setPurgeWordInput("");
                          setPurgeError(null);
                        }}
                        className="text-xs font-mono text-stone-600 hover:text-stone-900 py-1.5 px-2.5 rounded-lg hover:bg-rose-100/50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Restore */}
        {activeTab === "restore" && (
          <form onSubmit={handleRestoreFromPhrase} className="p-5 space-y-4 overflow-y-auto">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs">
              <p className="font-medium text-stone-900">Restore Vault from 12 Words</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Paste or type your 12 words separated by spaces to restore your local couple vault key on this device.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-stone-700 mb-1.5">
                Recovery Phrase (12 Words)
              </label>
              <textarea
                rows={3}
                value={restoreInput}
                onChange={(e) => setRestoreInput(e.target.value)}
                placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                className="w-full p-3 rounded-2xl bg-white border border-stone-200 text-xs font-mono text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {restoreError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Vault key successfully restored and saved to your device.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRestoring || !restoreInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-mono font-bold shadow-2xs transition-colors flex items-center justify-center gap-2"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying phrase...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Restore Couple Vault</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
