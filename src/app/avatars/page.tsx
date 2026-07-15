"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  User, Palette, Camera, Loader2, Save, Trash2, 
  HelpCircle, Sparkles, AlertCircle, RefreshCw 
} from "lucide-react";

// Load 3D Scene dynamically to prevent Next.js SSR hydration crashes
const AvatarScene = dynamic(() => import("@/components/avatar-scene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-brand-peach-50/10">
      <div className="text-center space-y-2">
        <Loader2 className="w-8 h-8 text-brand-peach-500 animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Warming up 3D engine...</p>
      </div>
    </div>
  )
});

interface Outfit {
  top_style: string;
  top_color: string;
  bottom_style: string;
  bottom_color: string;
  shoes_style: string;
  shoes_color: string;
}

const DEFAULT_OUTFIT: Outfit = {
  top_style: "tshirt",
  top_color: "#f43f5e", // Rose
  bottom_style: "pants",
  bottom_color: "#4b5563", // Gray
  shoes_style: "sneakers",
  shoes_color: "#111827", // Dark
};

// Curated cozy color swatches
const COLOR_PALETTE = [
  "#f43f5e", // Rose
  "#ec4899", // Pink
  "#d946ef", // Fuchsia
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#10b981", // Green
  "#eab308", // Yellow
  "#f97316", // Orange
  "#ef4444", // Red
  "#4b5563", // Slate
  "#1f2937", // Dark slate
  "#fafaf9", // Soft white
  "#e7e5e4", // Warm gray
];

export default function AvatarsPage() {
  const { user, pair, profile, partner, loading } = useAuth();
  const supabase = createClient();

  // Outfit States
  const [userOutfit, setUserOutfit] = useState<Outfit>(DEFAULT_OUTFIT);
  const [partnerOutfit, setPartnerOutfit] = useState<Outfit | null>(null);
  
  // Interface/Loading States
  const [fetchingOutfits, setFetchingOutfits] = useState(true);
  const [savingOutfit, setSavingOutfit] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [polaroids, setPolaroids] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  
  // Polaroid form input
  const [caption, setCaption] = useState("");
  const [showBoothForm, setShowBoothForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOutfits = async () => {
    if (!pair || !user) return;
    try {
      // 1. Fetch user's own outfit
      const { data: userData, error: userErr } = await supabase
        .from("avatar_outfits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userErr) throw userErr;
      if (userData) {
        setUserOutfit({
          top_style: userData.top_style,
          top_color: userData.top_color,
          bottom_style: userData.bottom_style,
          bottom_color: userData.bottom_color,
          shoes_style: userData.shoes_style,
          shoes_color: userData.shoes_color,
        });
      }

      // 2. Fetch partner's outfit if paired
      if (partner) {
        const { data: partnerData, error: partnerErr } = await supabase
          .from("avatar_outfits")
          .select("*")
          .eq("user_id", partner.id)
          .maybeSingle();

        if (partnerErr) throw partnerErr;
        if (partnerData) {
          setPartnerOutfit({
            top_style: partnerData.top_style,
            top_color: partnerData.top_color,
            bottom_style: partnerData.bottom_style,
            bottom_color: partnerData.bottom_color,
            shoes_style: partnerData.shoes_style,
            shoes_color: partnerData.shoes_color,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load avatar outfits:", err);
    } finally {
      setFetchingOutfits(false);
    }
  };

  const fetchPolaroids = async () => {
    if (!pair) return;
    try {
      const { data, error: err } = await supabase
        .from("polaroids")
        .select("*")
        .eq("pair_id", pair.id)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setPolaroids(data || []);
    } catch (err) {
      console.error("Failed to fetch polaroid booth snapshots:", err);
    }
  };

  // Sign URLs for polaroids
  useEffect(() => {
    const loadUrls = async () => {
      const urls: { [key: string]: string } = {};
      for (const p of polaroids) {
        if (!signedUrls[p.id]) {
          const { data } = await supabase.storage
            .from("polaroids")
            .createSignedUrl(p.image_path, 3600);
          if (data?.signedUrl) {
            urls[p.id] = data.signedUrl;
          }
        }
      }
      if (Object.keys(urls).length > 0) {
        setSignedUrls((prev) => ({ ...prev, ...urls }));
      }
    };

    if (polaroids.length > 0) {
      loadUrls();
    }
  }, [polaroids]);

  useEffect(() => {
    if (!loading && pair) {
      fetchOutfits();
      fetchPolaroids();

      // Realtime listener for outfit updates (partner change)
      const oChannel = supabase
        .channel(`avatar-sync-${pair.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "avatar_outfits" },
          (payload: any) => {
            if (partner && payload.new && (payload.new as any).user_id === partner.id) {
              setPartnerOutfit(payload.new as Outfit);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "polaroids", filter: `pair_id=eq.${pair.id}` },
          () => fetchPolaroids()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(oChannel);
      };
    }
  }, [pair, loading]);

  const handleSaveOutfit = async () => {
    if (!user) return;
    setSavingOutfit(true);
    setError(null);
    try {
      const { error: saveErr } = await supabase
        .from("avatar_outfits")
        .upsert(
          {
            user_id: user.id,
            top_style: userOutfit.top_style,
            top_color: userOutfit.top_color,
            bottom_style: userOutfit.bottom_style,
            bottom_color: userOutfit.bottom_color,
            shoes_style: userOutfit.shoes_style,
            shoes_color: userOutfit.shoes_color,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (saveErr) throw saveErr;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save outfit changes.");
    } finally {
      setSavingOutfit(false);
    }
  };

  const handleTakePolaroid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair || !user) return;
    
    setCapturing(true);
    setError(null);

    try {
      // 1. Get 3D Canvas element
      const webglCanvas = document.querySelector("canvas");
      if (!webglCanvas) throw new Error("Could not find 3D canvas viewport");

      // Grab snapshot URL ( preserveDrawingBuffer: true makes this work)
      const webglImageUrl = webglCanvas.toDataURL("image/png");

      // 2. Load WebGL image into HTML Image object
      const webglImg = new Image();
      webglImg.src = webglImageUrl;
      await new Promise((resolve) => {
        webglImg.onload = resolve;
      });

      // 3. Create Offscreen Polaroid Canvas (Compositing step)
      const polaroidWidth = 600;
      const polaroidHeight = 720;
      const polaroidCanvas = document.createElement("canvas");
      polaroidCanvas.width = polaroidWidth;
      polaroidCanvas.height = polaroidHeight;
      const ctx = polaroidCanvas.getContext("2d");

      if (!ctx) throw new Error("Could not initialize 2D canvas context");

      // Background card (White Polaroid Frame)
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, polaroidWidth, polaroidHeight);

      // Light gray outline around card border
      ctx.strokeStyle = "#e7e5e4";
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, polaroidWidth - 2, polaroidHeight - 2);

      // Draw the 3D render inside frame boundaries (520x520 square, 40px margins)
      const frameX = 40;
      const frameY = 40;
      const frameSize = 520;
      ctx.drawImage(webglImg, frameX, frameY, frameSize, frameSize);

      // Thin inner outline around the photo
      ctx.strokeStyle = "#d7d3d0";
      ctx.strokeRect(frameX, frameY, frameSize, frameSize);

      // Add handwriting text caption
      ctx.fillStyle = "#1c1917";
      // Fallback handwriting fonts
      ctx.font = "italic 32px 'Courier New', Georgia, serif";
      ctx.textAlign = "center";
      
      const captionText = caption.trim() || `${profile?.display_name} & ${partner?.display_name || "Partner"}`;
      ctx.fillText(captionText, polaroidWidth / 2, 620);

      // Add small dates in light gray
      ctx.fillStyle = "#a8a29e";
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), polaroidWidth / 2, 670);

      // 4. Convert to Binary Blob
      const polaroidBlob = await new Promise<Blob | null>((resolve) => {
        polaroidCanvas.toBlob(resolve, "image/png");
      });

      if (!polaroidBlob) throw new Error("Failed to compile polaroid snapshot canvas");

      // 5. Upload to Supabase Storage
      const filename = `${pair.id}/${Date.now()}-polaroid.png`;
      const { error: uploadErr } = await supabase.storage
        .from("polaroids")
        .upload(filename, polaroidBlob, {
          contentType: "image/png",
          cacheControl: "3600"
        });

      if (uploadErr) throw uploadErr;

      // 6. Save DB Reference
      const { error: insertErr } = await supabase
        .from("polaroids")
        .insert({
          pair_id: pair.id,
          image_path: filename,
          caption: caption.trim() ? caption.trim() : null,
          created_by: user.id,
        });

      if (insertErr) throw insertErr;

      // Reset
      setCaption("");
      setShowBoothForm(false);
      await fetchPolaroids();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to capture snapshot.");
    } finally {
      setCapturing(false);
    }
  };

  const handleDeletePolaroid = async (p: any) => {
    if (p.created_by !== user?.id) {
      alert("Only the partner who took this polaroid snapshot can delete it!");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this polaroid snapshot forever?")) return;

    try {
      // 1. Delete Storage File
      const { error: storageErr } = await supabase.storage
        .from("polaroids")
        .remove([p.image_path]);

      if (storageErr) throw storageErr;

      // 2. Delete DB record
      const { error: dbErr } = await supabase
        .from("polaroids")
        .delete()
        .eq("id", p.id);

      if (dbErr) throw dbErr;

      await fetchPolaroids();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete polaroid.");
    }
  };

  if (loading || fetchingOutfits) {
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
    <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8">
      <Navigation />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-sans font-black text-foreground tracking-tight flex items-center space-x-2.5">
              <User className="w-7 h-7 text-primary" />
              <span>Avatars & Polaroid Booth</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Dress up your toy 3D figures, spin them around, and snap Polaroid snapshots to save forever.
            </p>
          </div>

          <button
            onClick={() => setShowBoothForm(!showBoothForm)}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-md bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-pink-500/10 dark:shadow-none active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Snap Polaroid</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-accent/40 border border-border text-primary text-sm flex items-start space-x-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Polaroid Booth Form Modal */}
        {showBoothForm && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-lg shadow-sm">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Snapshot Caption</span>
            </h3>
            <form onSubmit={handleTakePolaroid} className="space-y-4">
              <input
                type="text"
                maxLength={60}
                placeholder="Write a sweet handwriting caption (max 60 chars)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
              />
              <div className="flex space-x-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBoothForm(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground border border-border hover:bg-muted bg-card rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={capturing}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 rounded-md inline-flex items-center space-x-1 shadow shadow-pink-500/10 cursor-pointer"
                >
                  {capturing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Capture Photo</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dress-up Suite Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: 3D Viewport (Canvas) */}
          <div className="lg:col-span-7 aspect-square md:aspect-[4/3] w-full rounded-lg overflow-hidden bg-stone-100 border border-border shadow-md relative min-h-[350px]">
            {/* 3px top gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa] z-20 pointer-events-none" />

            <AvatarScene 
              userOutfit={userOutfit}
              partnerOutfit={partnerOutfit}
              userName={profile?.display_name || "You"}
              partnerName={partner?.display_name || null}
            />
          </div>

          {/* Right panel: Controls */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-lg border border-border bg-card p-6 space-y-6 shadow-sm">
            {/* 3px top gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

            <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-border flex items-center space-x-1.5">
              <Palette className="w-4 h-4 text-primary" />
              <span>Wardrobe Customizer</span>
            </h2>

            <div className="space-y-5">
              {/* TOP SLOT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Top / Shirt Style</label>
                  <select
                    value={userOutfit.top_style}
                    onChange={(e) => setUserOutfit(prev => ({ ...prev, top_style: e.target.value }))}
                    className="px-2 py-1 text-xs border border-border bg-card rounded-md text-foreground font-semibold"
                  >
                    <option value="tshirt">T-Shirt</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="collared">Collared Shirt</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => setUserOutfit(prev => ({ ...prev, top_color: color }))}
                      className={`w-6 h-6 rounded-full border transition-all active:scale-90 ${
                        userOutfit.top_color === color 
                          ? "ring-2 ring-primary border-white scale-110" 
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* BOTTOM SLOT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Bottoms / Pants Style</label>
                  <select
                    value={userOutfit.bottom_style}
                    onChange={(e) => setUserOutfit(prev => ({ ...prev, bottom_style: e.target.value }))}
                    className="px-2 py-1 text-xs border border-border bg-card rounded-md text-foreground font-semibold"
                  >
                    <option value="pants">Pants</option>
                    <option value="shorts">Shorts</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => setUserOutfit(prev => ({ ...prev, bottom_color: color }))}
                      className={`w-6 h-6 rounded-full border transition-all active:scale-90 ${
                        userOutfit.bottom_color === color 
                          ? "ring-2 ring-primary border-white scale-110" 
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* SHOES SLOT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Footwear / Shoes</label>
                  <select
                    value={userOutfit.shoes_style}
                    onChange={(e) => setUserOutfit(prev => ({ ...prev, shoes_style: e.target.value }))}
                    className="px-2 py-1 text-xs border border-border bg-card rounded-md text-foreground font-semibold"
                  >
                    <option value="sneakers">Sneakers</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => setUserOutfit(prev => ({ ...prev, shoes_color: color }))}
                      className={`w-6 h-6 rounded-full border transition-all active:scale-90 ${
                        userOutfit.shoes_color === color 
                          ? "ring-2 ring-primary border-white scale-110" 
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveOutfit}
              disabled={savingOutfit}
              className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-md shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all mt-4 cursor-pointer"
            >
              {savingOutfit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Clothes Configuration</span>
            </button>
          </div>

        </div>

        {/* Polaroid Booth Album Gallery */}
        <div className="space-y-6 pt-8 border-t border-border">
          <div>
            <h2 className="text-xl font-sans font-black text-foreground tracking-tight">Polaroid Memory Gallery</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Your pinned snapshot cards from the 3D Booth.</p>
          </div>

          {polaroids.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground/45" />
              <p className="text-xs font-bold font-sans">Take your first 3D Avatar Polaroid together to pin it here!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-8 justify-start">
              {polaroids.map((p) => (
                <div 
                  key={p.id}
                  className="w-[260px] bg-[#faf9f6] p-4 border border-stone-200 shadow-lg rotate-1 hover:rotate-0 hover:scale-[1.02] active:scale-98 transition-all relative group"
                >
                  {/* Photo area */}
                  <div className="aspect-square bg-stone-100 border border-stone-300 overflow-hidden relative">
                    {signedUrls[p.id] ? (
                      <img 
                        src={signedUrls[p.id]} 
                        alt={p.caption || "Polaroid snapshot"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-muted-foreground/40 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Caption & Info */}
                  <div className="mt-3.5 text-center space-y-1">
                    <p className="text-xs font-semibold text-stone-800 italic font-mono truncate px-1">
                      "{p.caption || "Snapshot"}"
                    </p>
                    <p className="text-[9px] font-mono text-stone-400">
                      {new Date(p.created_at).toLocaleDateString("en-US", { year: "2-digit", month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* Delete button (creator only, visible on hover) */}
                  {p.created_by === user?.id && (
                    <button
                      onClick={() => handleDeletePolaroid(p)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity active:scale-90 cursor-pointer"
                      title="Delete Polaroid"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
