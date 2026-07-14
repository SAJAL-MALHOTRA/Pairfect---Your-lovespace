"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/navigation";
import { 
  Palette, Brush, Trash2, Camera, Loader2, 
  AlertCircle, ArrowLeft, RefreshCw, Type, Eye,
  Square, Circle, Minus, ArrowRight, Smile
} from "lucide-react";
import { format } from "date-fns";

// Daily drawing prompts pool
const promptPool = [
  "Draw tonight's dinner plan 🍽️",
  "Sketch how your day went today ☀️",
  "Draw our dream travel destination ✈️",
  "Sketch each other as funny animals 🦁",
  "Draw a blueprint of our dream house 🏡",
  "Doodle our favorite memory together 💭",
  "Sketch a cartoon version of ourselves 🎨",
  "Draw what our next date should be 🥂",
  "Draw our favorite snacks side-by-side 🍕",
  "Design a coat of arms for our relationship 🛡️"
];

export default function SharedCanvasPage() {
  const { user, pair, partner, loading } = useAuth();
  const supabase = createClient();

  const [canvasRecord, setCanvasRecord] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tools: 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'stamp' | 'text'
  const [activeTool, setActiveTool] = useState<string>("pen");
  const [brushColor, setBrushColor] = useState("#f472b6"); // default pink
  const [brushWidth, setBrushWidth] = useState(5); // default medium
  const [selectedStamp, setSelectedStamp] = useState("❤️");

  // Live cursor status
  const [partnerCursor, setPartnerCursor] = useState<{ x: number; y: number; name: string } | null>(null);
  const [partnerCursorColor, setPartnerCursorColor] = useState("#60a5fa");

  // Daily prompt calculation
  const [dailyPrompt, setDailyPrompt] = useState("");

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

  // Curated stamp emojis
  const stampPresets = ["❤️", "⭐", "🐾", "🔥", "🍕", "🎉", "👀", "💋"];

  // 1. Fetch or Initialize Canvas Session
  useEffect(() => {
    if (loading || !pair || !user) return;

    // Calculate daily prompt based on day of month
    const promptIndex = new Date().getDate() % promptPool.length;
    setDailyPrompt(promptPool[promptIndex]);

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
          id: s.id,
          type: s.type,
          points: s.stroke_data,
          color: s.color,
          width: s.stroke_width,
          shape_type: s.shape_type,
          text_content: s.text_content
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
          // Append completed partner stroke/shape to local list
          strokesRef.current.push({
            id: payload.id,
            type: payload.type,
            points: payload.points || partnerStrokePointsRef.current,
            color: payload.color,
            width: payload.width,
            shape_type: payload.shape_type,
            text_content: payload.text_content
          });
          partnerStrokePointsRef.current = [];
          redrawCanvas();
        }
      })
      .on("broadcast", { event: "erase-stroke" }, ({ payload }: any) => {
        strokesRef.current = strokesRef.current.filter((s: any) => s.id !== payload.strokeId);
        redrawCanvas();
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
                id: s.id,
                type: s.type,
                points: s.stroke_data,
                color: s.color,
                width: s.stroke_width,
                shape_type: s.shape_type,
                text_content: s.text_content
              }));
              redrawCanvas();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "canvas_strokes" },
        (payload: any) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            strokesRef.current = strokesRef.current.filter((s: any) => s.id !== deletedId);
            redrawCanvas();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canvasRecord, user, partner]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setupCanvasDimensions();
      redrawCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasRecord]);

  const setupCanvasDimensions = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  };

  // 3. Drawing Pipeline Context Redraws
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all historic elements
    strokesRef.current.forEach(stroke => drawElement(ctx, stroke));

    // Draw active partner stroke/shape in real-time
    if (partnerStrokePointsRef.current.length > 0) {
      const tempElement = {
        type: ["rect", "circle", "line", "arrow"].includes(activeTool) ? "shape" : "stroke",
        points: partnerStrokePointsRef.current,
        color: partnerCursorColor,
        width: brushWidth,
        shape_type: ["rect", "circle", "line", "arrow"].includes(activeTool) ? activeTool : null
      };
      drawElement(ctx, tempElement);
    }

    // Draw active local stroke/shape in real-time
    if (localStrokePointsRef.current.length > 0) {
      const tempElement = {
        type: ["rect", "circle", "line", "arrow"].includes(activeTool) ? "shape" : "stroke",
        points: localStrokePointsRef.current,
        color: brushColor,
        width: brushWidth,
        shape_type: ["rect", "circle", "line", "arrow"].includes(activeTool) ? activeTool : null
      };
      drawElement(ctx, tempElement);
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, stroke: any) => {
    if (stroke.type === "stroke") {
      drawLine(ctx, stroke.points, stroke.color, stroke.width);
    } else if (stroke.type === "shape") {
      drawShape(ctx, stroke.points, stroke.shape_type, stroke.color, stroke.width);
    } else if (stroke.type === "stamp") {
      ctx.font = "32px sans-serif";
      const p = stroke.points[0];
      if (p) ctx.fillText(stroke.shape_type, p.x - 16, p.y + 12);
    } else if (stroke.type === "text") {
      ctx.fillStyle = stroke.color;
      ctx.font = `bold ${stroke.width * 2 + 12}px sans-serif`;
      const p = stroke.points[0];
      if (p) ctx.fillText(stroke.text_content || "", p.x, p.y);
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

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    shapeType: string,
    color: string,
    width: number
  ) => {
    if (points.length < 2) return;
    const p0 = points[0];
    const p1 = points[points.length - 1];

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (shapeType === "line") {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    } else if (shapeType === "rect") {
      ctx.beginPath();
      ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    } else if (shapeType === "circle") {
      const rx = Math.abs(p1.x - p0.x) / 2;
      const ry = Math.abs(p1.y - p0.y) / 2;
      const cx = p0.x + (p1.x - p0.x) / 2;
      const cy = p0.y + (p1.y - p0.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeType === "arrow") {
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      // Draw arrowhead
      const arrowHeadLength = 15;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x - arrowHeadLength * Math.cos(angle - Math.PI / 6), p1.y - arrowHeadLength * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x - arrowHeadLength * Math.cos(angle + Math.PI / 6), p1.y - arrowHeadLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  };

  // 4. Hit-Test Eraser Logic
  const eraseStrokesAt = async (x: number, y: number) => {
    const eraseRadius = 15;
    const remainingStrokes = strokesRef.current.filter((stroke) => {
      if (stroke.type === "stroke") {
        const hit = stroke.points.some((p: any) => Math.hypot(p.x - x, p.y - y) <= eraseRadius);
        if (hit && stroke.id) {
          deleteStrokeFromDb(stroke.id);
        }
        return !hit;
      }
      if (stroke.type === "shape") {
        const pStart = stroke.points[0];
        const pEnd = stroke.points[stroke.points.length - 1];
        if (pStart && pEnd) {
          const distStart = Math.hypot(pStart.x - x, pStart.y - y);
          const distEnd = Math.hypot(pEnd.x - x, pEnd.y - y);
          const midX = (pStart.x + pEnd.x) / 2;
          const midY = (pStart.y + pEnd.y) / 2;
          const distMid = Math.hypot(midX - x, midY - y);
          const hit = distStart <= eraseRadius || distEnd <= eraseRadius || distMid <= eraseRadius;
          if (hit && stroke.id) {
            deleteStrokeFromDb(stroke.id);
          }
          return !hit;
        }
      }
      if (stroke.type === "text" || stroke.type === "stamp") {
        const p = stroke.points[0];
        if (p) {
          const hit = Math.hypot(p.x - x, p.y - y) <= eraseRadius * 2;
          if (hit && stroke.id) {
            deleteStrokeFromDb(stroke.id);
          }
          return !hit;
        }
      }
      return true;
    });

    if (remainingStrokes.length !== strokesRef.current.length) {
      strokesRef.current = remainingStrokes;
      redrawCanvas();
    }
  };

  const deleteStrokeFromDb = async (strokeId: string) => {
    // Broadcast delete event
    channelRef.current?.send({
      type: "broadcast",
      event: "erase-stroke",
      payload: { strokeId }
    });

    // Delete in DB
    try {
      await supabase
        .from("canvas_strokes")
        .delete()
        .eq("id", strokeId);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Client Pointer Handlers
  const handlePointerDown = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !user || !canvasRecord) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "eraser") {
      isDrawingRef.current = true;
      eraseStrokesAt(x, y);
      return;
    }

    if (activeTool === "stamp") {
      const clientStrokeId = crypto.randomUUID();
      const points = [{ x, y }];
      
      const newStamp = {
        id: clientStrokeId,
        type: "stamp",
        points,
        color: brushColor,
        width: brushWidth,
        shape_type: selectedStamp
      };

      strokesRef.current.push(newStamp);
      redrawCanvas();

      // Broadcast complete stamp insert
      channelRef.current?.send({
        type: "broadcast",
        event: "draw-end",
        payload: newStamp
      });

      // Save to database
      try {
        await supabase.from("canvas_strokes").insert({
          id: clientStrokeId,
          canvas_id: canvasRecord.id,
          user_id: user.id,
          stroke_data: points,
          color: brushColor,
          stroke_width: brushWidth,
          type: "stamp",
          shape_type: selectedStamp
        });
      } catch (err) {}
      return;
    }

    if (activeTool === "text") {
      const text = prompt("Enter note text:");
      if (!text || !text.trim()) return;

      const clientStrokeId = crypto.randomUUID();
      const points = [{ x, y }];

      const newText = {
        id: clientStrokeId,
        type: "text",
        points,
        color: brushColor,
        width: brushWidth,
        text_content: text.trim()
      };

      strokesRef.current.push(newText);
      redrawCanvas();

      channelRef.current?.send({
        type: "broadcast",
        event: "draw-end",
        payload: newText
      });

      try {
        await supabase.from("canvas_strokes").insert({
          id: clientStrokeId,
          canvas_id: canvasRecord.id,
          user_id: user.id,
          stroke_data: points,
          color: brushColor,
          stroke_width: brushWidth,
          type: "text",
          text_content: text.trim()
        });
      } catch (err) {}
      return;
    }

    // Default shapes or pen drawing
    isDrawingRef.current = true;
    localStrokePointsRef.current = [{ x, y }];
    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Broadcast cursor position
    channelRef.current?.send({
      type: "broadcast",
      event: "cursor-move",
      payload: { userId: user?.id, x, y }
    });

    if (!isDrawingRef.current) return;

    if (activeTool === "eraser") {
      eraseStrokesAt(x, y);
      return;
    }

    if (["rect", "circle", "line", "arrow"].includes(activeTool)) {
      // Shape resizing - replace last point with current mouse location
      const startPoint = localStrokePointsRef.current[0];
      localStrokePointsRef.current = [startPoint, { x, y }];
    } else {
      // Default freehand pen tool
      localStrokePointsRef.current.push({ x, y });
    }

    redrawCanvas();

    // Broadcast current points for live size update feedback
    channelRef.current?.send({
      type: "broadcast",
      event: "drawing-stroke",
      payload: { userId: user?.id, points: localStrokePointsRef.current }
    });
  };

  const handlePointerUp = async () => {
    if (!isDrawingRef.current || !canvasRecord || !user) return;
    isDrawingRef.current = false;

    if (activeTool === "eraser") return;

    const completedPoints = [...localStrokePointsRef.current];
    localStrokePointsRef.current = [];

    if (completedPoints.length === 0) return;

    const clientStrokeId = crypto.randomUUID();
    const isShape = ["rect", "circle", "line", "arrow"].includes(activeTool);

    const newElement = {
      id: clientStrokeId,
      type: isShape ? "shape" : "stroke",
      points: completedPoints,
      color: brushColor,
      width: brushWidth,
      shape_type: isShape ? activeTool : null
    };

    strokesRef.current.push(newElement);
    redrawCanvas();

    // Broadcast completed shape/stroke
    channelRef.current?.send({
      type: "broadcast",
      event: "draw-end",
      payload: newElement
    });

    // Write log to DB
    try {
      await supabase
        .from("canvas_strokes")
        .insert({
          id: clientStrokeId,
          canvas_id: canvasRecord.id,
          user_id: user.id,
          stroke_data: completedPoints,
          color: brushColor,
          stroke_width: brushWidth,
          type: isShape ? "shape" : "stroke",
          shape_type: isShape ? activeTool : null
        });
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Clear Canvas
  const handleClearCanvas = async () => {
    if (!canvasRecord) return;
    if (!confirm("Are you sure you want to clear the canvas? This deletes all drawings!")) return;

    try {
      const { error: err } = await supabase
        .from("canvas_strokes")
        .delete()
        .eq("canvas_id", canvasRecord.id);

      if (err) throw err;

      strokesRef.current = [];
      localStrokePointsRef.current = [];
      partnerStrokePointsRef.current = [];
      redrawCanvas();

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

  // 7. Save to Moments scrapbook
  const handleSaveToMoments = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !pair || !user || saving) return;

    setSaving(true);
    setError(null);

    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to render canvas image.");

      const file = new File([blob], `canvas-${Date.now()}.png`, { type: "image/png" });
      const filename = `canvas-${Date.now()}.png`;
      const storagePath = `${pair.id}/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from("memories")
        .upload(storagePath, file);

      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase
        .from("shared_moments")
        .insert({
          pair_id: pair.id,
          title: "Our Shared Doodle 🎨",
          description: `A collaborative canvas drawing centered on today's prompt: "${dailyPrompt}"`,
          moment_date: format(new Date(), "yyyy-MM-dd"),
          photo_url: storagePath
        });

      if (insertErr) throw insertErr;

      alert("Doodle saved to Shared Scrapbook moments successfully! 🎉");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save doodle.");
    } finally {
      setSaving(false);
    }
  };

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
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-fade-in"
        style={{
          background: "radial-gradient(60rem 40rem at 15% -10%, var(--glass-border) 0%, transparent 55%)",
        }}
      />
      <Navigation />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-start z-10 animate-fade-in space-y-4">
        
        {/* Curated Daily Prompt Display banner */}
        {dailyPrompt && (
          <div className="rounded-xl border border-pink-500/10 bg-pink-500/5 px-4 py-3 text-center text-xs font-bold text-[#f472b6] tracking-wide shadow-sm animate-pulse">
            🎯 Today's Prompt: "{dailyPrompt}"
          </div>
        )}

        {/* Toolbar menu */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Header titles */}
          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <Palette className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-sans font-black tracking-tight text-foreground leading-none">
                Shared Canvas
              </h1>
              <p className="text-[10px] text-stone-400 font-mono mt-1">
                 Collaborative drawing sandbox
              </p>
            </div>
          </div>

          {/* Controls tools list */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full lg:w-auto">
            
            {/* Tool Selection (Pen/Eraser/Shapes/Stickers/Text) */}
            <div className="flex items-center gap-1 bg-background p-1.5 rounded-xl border border-border">
              {[
                { id: "pen", icon: Brush, title: "Pen" },
                { id: "eraser", icon: Trash2, title: "Eraser" },
                { id: "rect", icon: Square, title: "Rectangle" },
                { id: "circle", icon: Circle, title: "Circle" },
                { id: "line", icon: Minus, title: "Line" },
                { id: "arrow", icon: ArrowRight, title: "Arrow" },
                { id: "stamp", icon: Smile, title: "Emoji Sticker" },
                { id: "text", icon: Type, title: "Text box" }
              ].map((tool: any) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      activeTool === tool.id
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={tool.title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Stamp presets picker (Only shows when stamp tool is selected) */}
            {activeTool === "stamp" && (
              <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border animate-fade-in">
                {stampPresets.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedStamp(emoji)}
                    className={`w-6 h-6 rounded text-sm transition-transform active:scale-95 cursor-pointer ${
                      selectedStamp === emoji ? "bg-accent scale-110 border border-primary/45" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

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
                  title={color === "#ffffff" ? "Eraser Fill" : color}
                />
              ))}
            </div>

            {/* Brush widths */}
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
                title="Clear all drawings"
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
