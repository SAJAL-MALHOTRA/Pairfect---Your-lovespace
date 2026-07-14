"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Palette, Brush, Trash2, Camera, Loader2, 
  AlertCircle, ArrowLeft, RefreshCw, Save
} from "lucide-react";
import { format } from "date-fns";

export default function SharedCanvasPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [canvasRecord, setCanvasRecord] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Brush settings
  const [brushColor, setBrushColor] = useState("#f472b6"); // default pink
  const [brushWidth, setBrushWidth] = useState(5); // default medium

  // Live cursor status
  const [partnerCursor, setPartnerCursor] = useState<{ x: number; y: number; name: string } | null>(null);
  const [partnerCursorColor, setPartnerCursorColor] = useState("#60a5fa");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const channelRef = useRef<any>(null);
  const strokesRef = useRef<any[]>([]);
  const localStrokePointsRef = useRef<{ x: number; y: number }[]>([]);
  const partnerStrokePointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);

  // Default brush color swatches
  const colorSwatches = [
    "#f472b6", // Pink
    "#60a5fa", // Blue
    "#a855f7", // Purple
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#09090b", // Charcoal Black
    "#ffffff"  // White (Eraser/Highlight)
  ];

  // 1. Fetch or Initialize Canvas Session
  useEffect(() => {
    if (loading || !pair || !user) return;

    // Set partner brush cursor color opposite to mine
    const isUserA = pair.user_a_id === user.id;
    setBrushColor(isUserA ? "#f472b6" : "#60a5fa");
    setPartnerCursorColor(isUserA ? "#60a5fa" : "#f472b6");

    const initCanvas = async () => {
      setFetching(true);
      try {
        // Query if canvas exists for this pair
        let { data: canvas, error: fetchErr } = await supabase
          .from("canvases")
          .select("*")
          .eq("pair_id", pair.id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (!canvas) {
          // Initialize canvas
          const { data: newCanvas, error: createErr } = await supabase
            .from("canvases")
            .insert({ pair_id: pair.id, title: "Our Shared Canvas" })
            .select()
            .single();

          if (createErr) throw createErr;
          canvas = newCanvas;
        }

        setCanvasRecord(canvas);

        // Fetch historic strokes
        const { data: strokesData, error: strokesErr } = await supabase
          .from("canvas_strokes")
          .select("*")
          .eq("canvas_id", canvas.id)
          .order("created_at", { ascending: true });

        if (strokesErr) throw strokesErr;

        strokesRef.current = (strokesData || []).map((s: any) => ({
          points: s.stroke_data,
          color: s.color,
          width: s.stroke_width
        }));

        redrawCanvas();
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to initialize canvas.");
      } finally {
        setFetching(false);
      }
    };

    initCanvas();
  }, [loading, pair, user]);

  // 2. Real-time synchronizations
  useEffect(() => {
    if (!canvasRecord || !user) return;

    const channel = supabase.channel(`canvas-${canvasRecord.id}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "cursor-move" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          setPartnerCursor({ x: payload.x, y: payload.y, name: partner?.display_name || "Partner" });
        }
      })
      .on("broadcast", { event: "drawing-stroke" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          partnerStrokePointsRef.current = payload.points;
          redrawCanvas();
        }
      })
      .on("broadcast", { event: "draw-end" }, ({ payload }: any) => {
        if (payload.userId !== user.id) {
          // Append completed partner stroke to local list
          strokesRef.current.push({
            points: partnerStrokePointsRef.current,
            color: payload.color,
            width: payload.width
          });
          partnerStrokePointsRef.current = [];
          redrawCanvas();
        }
      })
      .on("broadcast", { event: "clear" }, () => {
        strokesRef.current = [];
        partnerStrokePointsRef.current = [];
        localStrokePointsRef.current = [];
        redrawCanvas();
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "canvas_strokes", filter: `canvas_id=eq.${canvasRecord.id}` },
        async (payload: any) => {
          // Verify stroke isn't already inside local strokesRef array (to prevent double rendering)
          const newStroke = payload.new;
          if (newStroke.user_id !== user.id) {
            // Reload list of strokes to ensure correct sync
            const { data: updatedStrokes } = await supabase
              .from("canvas_strokes")
              .select("*")
              .eq("canvas_id", canvasRecord.id)
              .order("created_at", { ascending: true });

            if (updatedStrokes) {
              strokesRef.current = updatedStrokes.map((s: any) => ({
                points: s.stroke_data,
                color: s.color,
                width: s.stroke_width
              }));
              redrawCanvas();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canvasRecord, user, partner]);

  // Handle window resizing to keep canvas scales consistent
  useEffect(() => {
    const handleResize = () => {
      setupCanvasDimensions();
      redrawCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasRecord]);

  // Adjust HTML5 Canvas resolution matching its rendering bounds
  const setupCanvasDimensions = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use container sizes
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set resolution matching rendering scale
    canvas.width = width;
    canvas.height = height;
  };

  // 3. Drawing Pipeline Context Redraws
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all historic strokes
    strokesRef.current.forEach(stroke => drawLine(ctx, stroke.points, stroke.color, stroke.width));

    // Draw active partner stroke in real-time
    if (partnerStrokePointsRef.current.length > 0) {
      drawLine(ctx, partnerStrokePointsRef.current, partnerCursorColor, brushWidth);
    }

    // Draw active local stroke in real-time
    if (localStrokePointsRef.current.length > 0) {
      drawLine(ctx, localStrokePointsRef.current, brushColor, brushWidth);
    }
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    color: string,
    width: number
  ) => {
    if (points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  // 4. Client Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    localStrokePointsRef.current = [{ x, y }];
    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Broadcast ephemeral cursor position
    channelRef.current?.send({
      type: "broadcast",
      event: "cursor-move",
      payload: { userId: user?.id, x, y }
    });

    if (!isDrawingRef.current) return;

    // 2. Append points and redraw
    localStrokePointsRef.current.push({ x, y });
    redrawCanvas();

    // 3. Broadcast stroke points for real-time stroke-by-stroke preview
    channelRef.current?.send({
      type: "broadcast",
      event: "drawing-stroke",
      payload: { userId: user?.id, points: localStrokePointsRef.current }
    });
  };

  const handlePointerUp = async () => {
    if (!isDrawingRef.current || !canvasRecord || !user) return;
    isDrawingRef.current = false;

    const completedPoints = [...localStrokePointsRef.current];
    localStrokePointsRef.current = [];

    if (completedPoints.length === 0) return;

    // Append completed local stroke to list
    strokesRef.current.push({
      points: completedPoints,
      color: brushColor,
      width: brushWidth
    });

    redrawCanvas();

    // Broadcast stroke finish event to clear partner temporary preview
    channelRef.current?.send({
      type: "broadcast",
      event: "draw-end",
      payload: { userId: user.id, color: brushColor, width: brushWidth }
    });

    // Write stroke database log in background
    try {
      await supabase
        .from("canvas_strokes")
        .insert({
          canvas_id: canvasRecord.id,
          user_id: user.id,
          stroke_data: completedPoints,
          color: brushColor,
          stroke_width: brushWidth
        });
    } catch (e) {
      console.error("Failed to persist stroke to database:", e);
    }
  };

  // 5. Clear Canvas action
  const handleClearCanvas = async () => {
    if (!canvasRecord) return;
    if (!confirm("Are you sure you want to clear the canvas? This deletes all strokes!")) return;

    try {
      // Delete all strokes in DB
      const { error: err } = await supabase
        .from("canvas_strokes")
        .delete()
        .eq("canvas_id", canvasRecord.id);

      if (err) throw err;

      // Reset local refs
      strokesRef.current = [];
      localStrokePointsRef.current = [];
      partnerStrokePointsRef.current = [];
      redrawCanvas();

      // Broadcast clear action
      channelRef.current?.send({
        type: "broadcast",
        event: "clear",
        payload: {}
      });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to clear canvas.");
    }
  };

  // 6. Save to Moments scrapbook logic
  const handleSaveToMoments = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !pair || !user || saving) return;

    setSaving(true);
    setError(null);

    try {
      // 1. Convert Canvas to Blob PNG
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to render canvas image.");

      const file = new File([blob], `canvas-doodle-${Date.now()}.png`, { type: "image/png" });
      const filename = `canvas-${Date.now()}.png`;
      const storagePath = `${pair.id}/${filename}`;

      // 2. Upload file to Supabase memories bucket
      const { error: uploadErr } = await supabase.storage
        .from("memories")
        .upload(storagePath, file);

      if (uploadErr) throw uploadErr;

      // 3. Insert memory database row
      const { error: insertErr } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          title: "Our Shared Doodle 🎨",
          description: "A collaborative drawing doodle made by us on the canvas!",
          moment_date: format(new Date(), "yyyy-MM-dd"),
          photo_url: storagePath
        });

      if (insertErr) throw insertErr;

      alert("Doodle saved to Shared Scrapbook moments successfully! 🎉");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save doodle to Moments scrapbook.");
    } finally {
      setSaving(false);
    }
  };

  // Setup dimension resolution once records load
  useEffect(() => {
    if (canvasRecord) {
      setupCanvasDimensions();
      redrawCanvas();
    }
  }, [canvasRecord]);

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col pb-24 md:pb-8 bg-background text-foreground transition-colors duration-300">
      {/* soft ambient warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background: "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-start z-10 animate-fade-in space-y-4">
        
        {/* Top Control Bar panel */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Header titles */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Palette className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-sans font-black tracking-tight text-foreground leading-none">
                Shared Canvas
              </h1>
              <p className="text-[10px] text-stone-400 font-mono mt-1">
                 dRaw together in real-time
              </p>
            </div>
          </div>

          {/* Controls tools block */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            
            {/* Color swatches */}
            <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border">
              {colorSwatches.map((color: string) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-105 active:scale-95 border cursor-pointer ${
                    brushColor === color ? "border-primary scale-110 shadow-sm" : "border-border/60"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color === "#ffffff" ? "Eraser" : color}
                />
              ))}
            </div>

            {/* Brush sizes selection */}
            <div className="flex items-center gap-1 bg-background p-1.5 rounded-xl border border-border">
              {[
                { label: "Thin", val: 2 },
                { label: "Medium", val: 5 },
                { label: "Thick", val: 10 }
              ].map((sz: any) => (
                <button
                  key={sz.label}
                  onClick={() => setBrushWidth(sz.val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    brushWidth === sz.val
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            {/* Clear & Save triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearCanvas}
                className="p-2.5 rounded-xl text-xs font-bold text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all cursor-pointer"
                title="Clear all strokes"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleSaveToMoments}
                disabled={saving}
                className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#f472b6] to-[#60a5fa] hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-pink-500/5 dark:shadow-none"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span>Save to Moments ▸</span>
              </button>
            </div>

          </div>

        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drawing Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 w-full min-h-[60vh] border border-border/80 bg-card rounded-2xl relative overflow-hidden shadow-inner cursor-crosshair select-none"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Figma-like Live Partner Cursor Overlay */}
          {partnerCursor && (
            <div 
              className="absolute pointer-events-none transition-all duration-75 ease-out z-20 flex flex-col items-start"
              style={{ 
                left: `${partnerCursor.x}px`, 
                top: `${partnerCursor.y}px`,
                transform: "translate(-2px, -2px)" 
              }}
            >
              {/* Colored Dot indicator */}
              <div 
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md animate-pulse"
                style={{ backgroundColor: partnerCursorColor }}
              />
              {/* Monospace Name Label */}
              <div 
                className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white shadow-sm whitespace-nowrap"
                style={{ backgroundColor: partnerCursorColor }}
              >
                {partnerCursor.name}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
