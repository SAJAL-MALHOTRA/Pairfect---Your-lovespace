"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { 
  Camera, ArrowLeft, Loader2, Sparkles, AlertCircle, 
  Download, Save, RefreshCw, Check, Heart, Trash2
} from "lucide-react";
import { format } from "date-fns";

type FrameStyle = "classic" | "charcoal" | "rose" | "lavender" | "sunset";

const FRAME_OPTIONS = [
  { id: "classic" as FrameStyle, label: "Retro White", bg: "#f5f3f0", border: "#e7e5e4", text: "#1c1917" },
  { id: "charcoal" as FrameStyle, label: "Cozy Charcoal", bg: "#161313", border: "#2a2424", text: "#f4eae6" },
  { id: "rose" as FrameStyle, label: "Cream Rose", bg: "#2a1e20", border: "#3a2527", text: "#e8a87c" },
  { id: "lavender" as FrameStyle, label: "Dreamy Purple", bg: "#1c1a24", border: "#2a2538", text: "#a78bfa" },
  { id: "sunset" as FrameStyle, label: "Sunset Glow", bg: "#2d1b22", border: "#452634", text: "#f43f5e" }
];

export default function PhotoBoothPage() {
  const { user, pair, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Webcam stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Snaps sequence state
  const [snaps, setSnaps] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: idle, 1-4: snapping, 5: compiling
  const [countdown, setCountdown] = useState(0);
  const [flashActive, setFlashActive] = useState(false);

  // Final strip details
  const [caption, setCaption] = useState("");
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>("classic");
  const [stripDataUrl, setStripDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize camera access
  const enableCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Could not access your webcam. Please check your camera permissions and try again.");
    }
  };

  // Auto-enable camera on page mount
  useEffect(() => {
    enableCamera();
  }, []);

  // Bind the camera stream to the video element when it becomes available in the DOM
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraActive]);

  // Close camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Audio synthethizer beeps using Web Audio API
  const playBeep = (freq: number, duration: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Beep synth failed:", e);
    }
  };

  // Shutter snap sound
  const playShutterSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.error("Shutter synth failed:", e);
    }
  };

  // Run countdown & capture sequence
  const startPhotoStripSequence = () => {
    if (!videoRef.current || !stream) return;

    setSnaps([]);
    setStripDataUrl(null);
    setSuccess(false);
    setError(null);
    setIsCapturing(true);
    setCurrentStep(1);

    captureNextPhoto(1, []);
  };

  // Capture step helper
  const captureNextPhoto = (stepNum: number, currentSnaps: string[]) => {
    let count = 3;
    setCountdown(count);
    playBeep(440, 0.08); // Ready blip

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep(440, 0.08); // Countdown blip
      } else {
        clearInterval(timer);
        setCountdown(0);
        
        // Trigger Shutter snap
        triggerFlash();
        playShutterSound();
        const snappedImg = captureCanvasFrame();

        const updatedSnaps = [...currentSnaps, snappedImg];
        setSnaps(updatedSnaps);

        if (stepNum < 4) {
          setCurrentStep(stepNum + 1);
          // Wait 2.5 seconds before starting next countdown to let users prepare
          setTimeout(() => {
            captureNextPhoto(stepNum + 1, updatedSnaps);
          }, 2500);
        } else {
          // Finished snaps!
          setCurrentStep(5);
          setIsCapturing(false);
          compilePhotoStrip(updatedSnaps, selectedFrame, caption);
        }
      }
    }, 1000);
  };

  // Trigger white flash animation
  const triggerFlash = () => {
    setFlashActive(true);
    setTimeout(() => {
      setFlashActive(false);
    }, 150);
  };

  // Draw frame from video preview
  const captureCanvasFrame = (): string => {
    if (!videoRef.current) return "";

    const captureCanvas = document.createElement("canvas");
    // Make it a clean square crop from the center of the video
    const videoWidth = videoRef.current.videoWidth || 640;
    const videoHeight = videoRef.current.videoHeight || 480;
    const size = Math.min(videoWidth, videoHeight);

    captureCanvas.width = 400;
    captureCanvas.height = 400;

    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return "";

    // Mirror image for natural photobooth feel
    ctx.translate(400, 0);
    ctx.scale(-1, 1);

    const sourceX = (videoWidth - size) / 2;
    const sourceY = (videoHeight - size) / 2;

    ctx.drawImage(
      videoRef.current,
      sourceX,
      sourceY,
      size,
      size,
      0,
      0,
      400,
      400
    );

    return captureCanvas.toDataURL("image/png");
  };

  // Stitch snaps vertically and apply selected frame styling
  const compilePhotoStrip = async (
    allSnaps: string[],
    frameId: FrameStyle,
    captionStr: string
  ) => {
    if (allSnaps.length < 4) return;

    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;

    const frameConfig = FRAME_OPTIONS.find(f => f.id === frameId) || FRAME_OPTIONS[0];

    // Strip size specifications
    const stripWidth = 340;
    const padding = 20;
    const photoWidth = stripWidth - (padding * 2); // 300
    const photoHeight = photoWidth; // Square: 300
    const gap = 15;
    const bottomHeight = 110;

    const totalHeight = padding + (photoHeight * 4) + (gap * 3) + bottomHeight;

    canvas.width = stripWidth;
    canvas.height = totalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw main frame background
    ctx.fillStyle = frameConfig.bg;
    ctx.fillRect(0, 0, stripWidth, totalHeight);

    // Draw frame stroke outline
    ctx.strokeStyle = frameConfig.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, stripWidth - 2, totalHeight - 2);

    // Helper to load snaps as images
    const loadImg = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };

    // Draw all 4 photos
    for (let i = 0; i < 4; i++) {
      const snapImg = await loadImg(allSnaps[i]);
      const drawX = padding;
      const drawY = padding + i * (photoHeight + gap);

      // Draw photo container shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(drawX + 2, drawY + 2, photoWidth, photoHeight);

      // Draw photo
      ctx.drawImage(snapImg, drawX, drawY, photoWidth, photoHeight);

      // Draw photo thin border outline
      ctx.strokeStyle = frameConfig.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX, drawY, photoWidth, photoHeight);
    }

    // Draw bottom branding & dating caption text
    const bottomY = totalHeight - bottomHeight;

    // Custom text caption
    ctx.fillStyle = frameConfig.text;
    ctx.textAlign = "center";
    
    // Draw handwriting caption
    if (captionStr.trim()) {
      ctx.font = "italic bold 16px Nunito, sans-serif";
      ctx.fillText(captionStr.trim(), stripWidth / 2, bottomY + 30);
    }

    // Draw anniversary/dating stamp
    ctx.font = "bold uppercase tracking-wider 10px monospace";
    ctx.fillStyle = frameId === "classic" ? "#78716c" : "#a8a29e";
    const dateStamp = format(new Date(), "MMMM d, yyyy");
    ctx.fillText(`Pairfect Space • ${dateStamp}`, stripWidth / 2, bottomY + 65);

    // Save compiled strip
    setStripDataUrl(canvas.toDataURL("image/png"));
  };

  // Recompile strip when frame or caption changes
  useEffect(() => {
    if (snaps.length === 4) {
      compilePhotoStrip(snaps, selectedFrame, caption);
    }
  }, [selectedFrame, caption, snaps]);

  // Upload photo strip to Supabase
  const handleSaveStrip = async () => {
    if (!stripDataUrl || !pair || !user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Convert DataUrl to Binary Blob
      const res = await fetch(stripDataUrl);
      const blob = await res.blob();

      // 2. Upload file to 'polaroids' bucket
      const filename = `${pair.id}/strip-${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("polaroids")
        .upload(filename, blob, {
          contentType: "image/png"
        });

      if (uploadErr) throw uploadErr;

      // 3. Save db record in 'polaroids'
      const { error: dbErr } = await supabase
        .from("polaroids")
        .insert({
          pair_id: pair.id,
          created_by: user.id,
          image_path: filename,
          caption: caption.trim().slice(0, 60) || "Cozy Photo Booth Strip"
        });

      if (dbErr) throw dbErr;

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save photo strip. Make sure polaroids bucket is public.");
    } finally {
      setSaving(false);
    }
  };

  // Download locally
  const handleDownloadLocal = () => {
    if (!stripDataUrl) return;
    const a = document.createElement("a");
    a.href = stripDataUrl;
    a.download = `pairfect-strip-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Restart booth
  const handleRetake = () => {
    setSnaps([]);
    setStripDataUrl(null);
    setSuccess(false);
    setError(null);
    setCurrentStep(0);
  };

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, #3a2527 0%, transparent 55%), radial-gradient(50rem 40rem at 100% 10%, #2e1e20 0%, transparent 50%)",
        }}
      />

      <Navigation />

      {/* Camera shutter flash cover */}
      <div 
        className={`pointer-events-none fixed inset-0 bg-white z-50 transition-opacity duration-150 ${
          flashActive ? "opacity-95" : "opacity-0"
        }`}
      />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-start z-10">
        
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Closet</span>
          </button>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight flex items-center space-x-2.5">
            <Camera className="w-7 h-7 text-primary" />
            <span>Cozy Photo Booth</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture a sequence of 4 retro square frames with your partner and compile them into a gorgeous vertical photo strip.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-accent/40 border border-border/60 text-primary text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* LEFT: WEBCAM FEED / STEP INSTRUCTIONS */}
          <div className="space-y-6">
            {!stripDataUrl ? (
              <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-md backdrop-blur-xl relative overflow-hidden flex flex-col items-center">
                
                {/* Live Camera Feed Viewport */}
                <div className="relative w-full aspect-square max-w-sm rounded-2xl border border-border/60 bg-background/50 overflow-hidden flex items-center justify-center">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      
                      {/* Countdown Overlay */}
                      {countdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm z-20">
                          <span className="text-7xl font-bold font-mono text-white animate-ping">
                            {countdown}
                          </span>
                        </div>
                      )}

                      {/* Snap Step Overlay */}
                      {isCapturing && (
                        <div className="absolute top-4 left-4 bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-primary-foreground tracking-wider uppercase z-20 animate-pulse">
                          Taking Photo {currentStep}/4
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-accent/50 text-primary flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8" />
                      </div>
                      {cameraError ? (
                        <p className="text-xs text-primary font-semibold max-w-xs">{cameraError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground max-w-xs">Enable camera access to open the photo booth portal.</p>
                      )}
                      <button
                        onClick={enableCamera}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer"
                      >
                        Enable Webcam
                      </button>
                    </div>
                  )}
                </div>

                {/* Shutter Triggers */}
                {cameraActive && (
                  <div className="w-full max-w-sm mt-6">
                    <button
                      onClick={startPhotoStripSequence}
                      disabled={isCapturing}
                      className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl shadow-md text-base font-bold text-primary-foreground bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
                    >
                      <Camera className="w-5 h-5 fill-primary-foreground" />
                      <span>{isCapturing ? "Capturing Strip..." : "Start Shutter Strip (4 Snaps)"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* PREVIEW COMPILED STRIP CUSTOMIZATION CONTROLS */
              <div className="rounded-3xl border border-border/60 bg-card/55 p-6 shadow-md backdrop-blur-xl space-y-6">
                <h3 className="text-lg font-serif font-semibold text-foreground flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Customize Photo Strip</span>
                </h3>

                {/* Frame Colors */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Frame Background
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FRAME_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedFrame(opt.id)}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          selectedFrame === opt.id
                            ? "border-primary ring-2 ring-primary bg-accent/40"
                            : "border-border/60 bg-background/50 hover:bg-background"
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-border/60" 
                          style={{ backgroundColor: opt.bg }}
                        />
                        <span className="text-foreground">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption Entry */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Add Handwriting Caption
                  </label>
                  <input
                    type="text"
                    maxLength={35}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Rainy Sunday dates, Study break kisses..."
                    className="w-full px-4 py-3 border border-border/60 rounded-xl bg-background/50 text-foreground placeholder:text-muted-foreground/45 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>

                {/* Save & Download Actions */}
                <div className="pt-4 border-t border-border/20 space-y-3">
                  {success ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-fade-in">
                      <Check className="w-4 h-4" />
                      <span>Photo strip successfully saved to your shared Polaroid Booth!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveStrip}
                      disabled={saving || !stripDataUrl}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving to Shared Album...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save to Polaroid Gallery</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleRetake}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-border/60 bg-background/50 hover:bg-background text-foreground transition-all cursor-pointer"
                    >
                      Retake Photos
                    </button>
                    
                    <button
                      onClick={handleDownloadLocal}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-accent/40 border border-border/60 hover:bg-accent/80 text-primary transition-all cursor-pointer"
                    >
                      Download PNG
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: STRIP PREVIEW STITCHING VIEW */}
          <div className="flex justify-center">
            {stripDataUrl ? (
              <div className="relative shadow-2xl rounded-2xl overflow-hidden max-w-[280px] sm:max-w-[340px] animate-fade-in border border-border/60">
                <img 
                  src={stripDataUrl} 
                  alt="Stitched Photo Strip" 
                  className="w-full h-auto object-contain" 
                />
              </div>
            ) : (
              <div className="w-full max-w-[300px] border border-dashed border-border/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-card/25 min-h-[450px]">
                <Camera className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Strip Output Preview</p>
                <p className="text-xs text-muted-foreground/75 mt-2 max-w-[200px]">Snaps will be compiled vertically here instantly once captured.</p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
