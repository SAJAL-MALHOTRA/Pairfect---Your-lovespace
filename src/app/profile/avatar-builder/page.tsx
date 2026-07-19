"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import {
  ChibiAvatar,
  parseAvatarConfig,
  stringifyAvatarConfig,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_STYLES,
  GLASSES_OPTIONS,
  BEARD_OPTIONS,
  ACCESSORIES_OPTIONS,
  SWEATER_COLORS,
  SHIRT_COLORS,
  AvatarConfig,
} from "@/components/chibi-avatar";
import { Loader2, ArrowLeft, Save, Sparkles, Shirt } from "lucide-react";
import { motion } from "framer-motion";

export default function AvatarBuilderPage() {
  const { user, profile, refreshSession, loading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [selectedTab, setSelectedTab] = useState<"face" | "hair" | "style" | "clothes">("face");
  const [previewPose, setPreviewPose] = useState<"standing" | "writing" | "drinking-coffee" | "hugging">("standing");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile) {
      setConfig(parseAvatarConfig(profile.avatar_url));
    }
  }, [loading, profile]);

  const updateProp = (key: keyof AvatarConfig, val: string) => {
    if (!config) return;
    setConfig({ ...config, [key]: val });
  };

  const handleSave = async () => {
    if (!user || !config || saving) return;
    setSaving(true);
    setError(null);
    try {
      const avatarString = stringifyAvatarConfig(config);
      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: avatarString })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      await refreshSession();
      router.push("/profile");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save portrait config.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-5 h-5 text-[var(--seal-red)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh]" style={{ background: "var(--background)" }}>
      <Navigation />

      <main className="max-w-xl mx-auto px-5 py-12 pb-36 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/profile")}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--ink-light)] hover:text-[var(--ink-dark)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-2 px-5 text-[10px] uppercase tracking-widest cursor-pointer inline-flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[9px] font-mono tracking-widest uppercase text-[var(--ink-light)]">Customizer</p>
          <h1 className="font-display italic text-3xl font-black text-[var(--ink-dark)]">Portrait Builder</h1>
          <p className="font-handwriting text-sm text-[var(--ink-mid)]">Design your signature chibi mascot.</p>
        </div>

        {/* Live Preview Area */}
        <div className="flex flex-col items-center gap-4 bg-[var(--card-bg)] border border-[var(--border-mid)] rounded-3xl p-6 shadow-sm">
          <div className="relative p-4 rounded-full bg-[var(--paper-warm)] border border-[var(--border-warm)] shadow-inner">
            <ChibiAvatar config={config} pose={previewPose} className="w-48 h-48" />
          </div>

          {/* Pose Selector Tabs */}
          <div className="flex items-center gap-2 mt-2">
            {(["standing", "writing", "drinking-coffee", "hugging"] as const).map((pose) => (
              <button
                key={pose}
                onClick={() => setPreviewPose(pose)}
                className={`text-[8px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  previewPose === pose
                    ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                    : "bg-[var(--background)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-warm)]"
                }`}
              >
                {pose.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2 text-center">{error}</p>
        )}

        {/* Builder controls */}
        <div className="paper-grain rounded-3xl border overflow-hidden" style={{ background: "var(--card-bg)", borderColor: "var(--border-mid)" }}>
          {/* Tab headers */}
          <div className="flex border-b text-center font-mono text-[9px] uppercase tracking-widest" style={{ borderColor: "var(--border-mid)" }}>
            {(["face", "hair", "style", "clothes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 py-3 border-r last:border-r-0 cursor-pointer transition-colors ${
                  selectedTab === tab
                    ? "bg-[var(--background)] text-[var(--seal-red)] font-bold"
                    : "text-[var(--ink-light)] hover:bg-[var(--paper-warm)]/40"
                }`}
                style={{ borderColor: "var(--border-mid)" }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content panel */}
          <div className="p-6 space-y-6">
            {/* FACE TAB */}
            {selectedTab === "face" && (
              <div className="space-y-5">
                {/* Skin tone */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Skin Tone</label>
                  <div className="flex flex-wrap gap-2.5">
                    {SKIN_TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => updateProp("skin", t.value)}
                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                          config.skin === t.value ? "border-[var(--seal-red)] scale-110 shadow-sm" : "border-transparent"
                        }`}
                        style={{ backgroundColor: t.value }}
                        title={t.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Eye style */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Eye Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EYE_STYLES.map((e) => (
                      <button
                        key={e.value}
                        onClick={() => updateProp("eyeStyle", e.value)}
                        className={`text-[9px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          config.eyeStyle === e.value
                            ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                            : "bg-[var(--background)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-warm)]"
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beard */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Beard / Facial Hair</label>
                  <div className="flex flex-wrap gap-1.5">
                    {BEARD_OPTIONS.map((b) => (
                      <button
                        key={b.value}
                        onClick={() => updateProp("beard", b.value)}
                        className={`text-[9px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          config.beard === b.value
                            ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                            : "bg-[var(--background)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-warm)]"
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HAIR TAB */}
            {selectedTab === "hair" && (
              <div className="space-y-5">
                {/* Hair styles */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Hair Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h.value}
                        onClick={() => updateProp("hairStyle", h.value)}
                        className={`text-[9px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          config.hairStyle === h.value
                            ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                            : "bg-[var(--background)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-warm)]"
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair color */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Hair Color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateProp("hairColor", c.value)}
                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                          config.hairColor === c.value ? "border-[var(--seal-red)] scale-110 shadow-sm" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STYLE TAB */}
            {selectedTab === "style" && (
              <div className="space-y-5">
                {/* Glasses */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Glasses</label>
                  <div className="flex flex-wrap gap-1.5">
                    {GLASSES_OPTIONS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => updateProp("glasses", g.value)}
                        className={`text-[9px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          config.glasses === g.value
                            ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                            : "bg-[var(--background)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-warm)]"
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessories */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Accessories</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCESSORIES_OPTIONS.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => updateProp("accessories", a.value)}
                        className={`text-[9px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          config.accessories === a.value
                            ? "bg-[var(--ink-dark)] text-[var(--background)] border-[var(--ink-dark)]"
                            : "bg-[var(--background)] text-[var(--ink-mid)] border-[var(--border-mid)] hover:bg-[var(--paper-warm)]"
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CLOTHES TAB */}
            {selectedTab === "clothes" && (
              <div className="space-y-5">
                {/* Sweater color */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Sweater Color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {SWEATER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateProp("sweater", c.value)}
                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                          config.sweater === c.value ? "border-[var(--seal-red)] scale-110 shadow-sm" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Shirt color */}
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-widest text-[var(--ink-light)] block">Shirt Collar Color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {SHIRT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateProp("shirt", c.value)}
                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                          config.shirt === c.value ? "border-[var(--seal-red)] scale-110 shadow-sm" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
