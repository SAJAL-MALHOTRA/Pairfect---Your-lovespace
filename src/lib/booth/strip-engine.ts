/**
 * Photostrip Canvas Rendering Engine.
 * 
 * Implements the 7 authentic photostrip templates and analog film-stock color grades
 * from the long-distance photobooth architecture:
 * - filmStrip (Classic 35mm vertical strip with sprockets)
 * - filmStrip6 (6-frame extended film strip)
 * - instax (Iconic Polaroid / Instax instant print)
 * - coupleStrip (Side-by-side couple frames)
 * - grid2x2 (2x2 quad print)
 * - grid3x2 (3x2 six-photo grid)
 * - polaroid (Dark vintage polaroid)
 * 
 * Includes procedural analog film grain and radial edge vignette.
 */

export type PhotostripTemplate =
  | "filmStrip"
  | "filmStrip6"
  | "instax"
  | "coupleStrip"
  | "grid2x2"
  | "grid3x2"
  | "polaroid";

export type FilmStockGrade = "none" | "fuji" | "instax" | "dslr" | "bw" | "golden";

export interface BoothPhotoItem {
  id: string;
  dataURL: string;
  name: string;
  isSelf: boolean;
  captureId?: string | null;
  takenAt?: number;
}

export const TEMPLATE_CONFIGS: Record<
  PhotostripTemplate,
  { label: string; count: number; desc: string; canvasWidth: number; canvasHeight: number }
> = {
  filmStrip: {
    label: "Classic 35mm Strip",
    count: 4,
    desc: "4-frame 35mm film strip with sprockets and frame numbers",
    canvasWidth: 900,
    canvasHeight: 2290,
  },
  filmStrip6: {
    label: "6-Frame Film Strip",
    count: 6,
    desc: "Extended 6-frame vertical film roll",
    canvasWidth: 900,
    canvasHeight: 3340,
  },
  instax: {
    label: "Instax Instant Print",
    count: 2,
    desc: "Iconic Polaroid print with wide bottom chin for date notes",
    canvasWidth: 900,
    canvasHeight: 1200,
  },
  coupleStrip: {
    label: "Side-by-Side Couple",
    count: 4,
    desc: "Paired frames showing both partners side-by-side",
    canvasWidth: 900,
    canvasHeight: 1400,
  },
  grid2x2: {
    label: "2x2 Quad Grid",
    count: 4,
    desc: "Square 2x2 grid keepsake",
    canvasWidth: 900,
    canvasHeight: 1200,
  },
  grid3x2: {
    label: "3x2 Collage Grid",
    count: 6,
    desc: "6-frame rectangular photo collage",
    canvasWidth: 900,
    canvasHeight: 1200,
  },
  polaroid: {
    label: "Dark Polaroid",
    count: 2,
    desc: "Moody dark-bordered vintage keepsake",
    canvasWidth: 900,
    canvasHeight: 1200,
  },
};

export const FILM_STOCK_GRADES: Record<FilmStockGrade, { label: string; filter: string }> = {
  none: { label: "Natural", filter: "none" },
  fuji: { label: "Fuji Vivid", filter: "saturate(1.12) contrast(1.07) brightness(1.04)" },
  instax: { label: "Instax Soft", filter: "saturate(1.25) contrast(1.1) sepia(0.06)" },
  dslr: { label: "Clean DSLR", filter: "contrast(1.1) saturate(1.04)" },
  bw: { label: "Classic B&W", filter: "grayscale(1) contrast(1.22) brightness(1.03)" },
  golden: { label: "Golden Hour", filter: "sepia(0.32) saturate(1.3) contrast(1.06) hue-rotate(5deg)" },
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function coverCrop(img: HTMLImageElement, targetW: number, targetH: number) {
  const imgRatio = img.width / img.height;
  const targetRatio = targetW / targetH;
  if (imgRatio > targetRatio) {
    const sw = img.height * targetRatio;
    return { sx: (img.width - sw) / 2, sy: 0, sw, sh: img.height };
  }
  const sh = img.width / targetRatio;
  return { sx: 0, sy: (img.height - sh) / 2, sw: img.width, sh };
}

export function applyGrainRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.045,
  count = 350
) {
  for (let i = 0; i < count; i++) {
    const g = 140 + Math.floor(Math.random() * 115);
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`;
    ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.5, 1.5);
  }
}

export function applyVignetteRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  strength = 0.28
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rInner = Math.min(w, h) * 0.35;
  const rOuter = Math.max(w, h) * 0.72;
  const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawGradedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  gradeCss: string,
  enableGrain = true
) {
  const { sx, sy, sw, sh } = coverCrop(img, w, h);
  ctx.save();
  roundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  if (gradeCss && gradeCss !== "none") {
    ctx.filter = gradeCss;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  if (gradeCss && gradeCss !== "none") {
    ctx.filter = "none";
  }

  if (enableGrain) {
    applyGrainRect(ctx, x, y, w, h, 0.04, 300);
    applyVignetteRect(ctx, x, y, w, h, 0.22);
  }
  ctx.restore();
}

/**
 * Render 35mm film strip sprockets on the left and right borders.
 */
function drawFilmSprockets(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  sprocketPitch = 56
) {
  ctx.fillStyle = "#0A0A0A";
  const numSprockets = Math.floor(canvasH / sprocketPitch);
  const startY = (canvasH % sprocketPitch) / 2 + 12;

  for (let i = 0; i < numSprockets - 1; i++) {
    const y = startY + i * sprocketPitch;
    // Left sprocket
    roundedRect(ctx, 16, y, 16, 26, 4);
    ctx.fillStyle = "#1E1E1E";
    ctx.fill();
    // Right sprocket
    roundedRect(ctx, canvasW - 32, y, 16, 26, 4);
    ctx.fillStyle = "#1E1E1E";
    ctx.fill();
  }
}

export interface RenderStripOptions {
  template: PhotostripTemplate;
  photos: BoothPhotoItem[];
  filmGrade: FilmStockGrade;
  roomName?: string;
  customNote?: string;
  dateStr?: string;
  frameColor?: string;
}

/**
 * Main rendering routine: draws the complete photostrip on a given HTML5 canvas.
 */
export async function renderPhotostripOnCanvas(
  canvas: HTMLCanvasElement,
  options: RenderStripOptions
): Promise<void> {
  const {
    template,
    photos,
    filmGrade,
    roomName = "PAIRFECT",
    customNote,
    dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    frameColor = "#FAF6EF",
  } = options;

  const config = TEMPLATE_CONFIGS[template] || TEMPLATE_CONFIGS.filmStrip;
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const gradeFilter = FILM_STOCK_GRADES[filmGrade]?.filter || "none";

  // Pre-load images
  const loadedImages: (HTMLImageElement | null)[] = await Promise.all(
    photos.map((p) => loadImage(p.dataURL))
  );
  const validImages = loadedImages.filter((img): img is HTMLImageElement => img !== null);

  // ── TEMPLATE: Classic 35mm Film Strip (4 or 6 frames) ──────────────────────
  if (template === "filmStrip" || template === "filmStrip6") {
    // Film base background
    ctx.fillStyle = "#161616";
    ctx.fillRect(0, 0, W, H);

    drawFilmSprockets(ctx, W, H, 60);

    const frameCount = template === "filmStrip" ? 4 : 6;
    const marginX = 54;
    const frameW = W - marginX * 2;
    const frameH = template === "filmStrip" ? 470 : 470;
    const startY = 80;
    const gapY = 32;

    // Header film label
    ctx.fillStyle = "#71717A";
    ctx.font = "bold 13px ui-monospace, SFMono-Regular, monospace";
    ctx.letterSpacing = "2px";
    ctx.fillText("PAIRFECT 400 • ISO 400/27° • SAFETY FILM", 60, 48);
    ctx.fillText(dateStr.toUpperCase(), W - 260, 48);

    for (let i = 0; i < frameCount; i++) {
      const y = startY + i * (frameH + gapY);
      const img = validImages[i % validImages.length];

      // Draw photo container border
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(marginX - 2, y - 2, frameW + 4, frameH + 4);

      if (img) {
        drawGradedImage(ctx, img, marginX, y, frameW, frameH, 4, gradeFilter, true);
      } else {
        ctx.fillStyle = "#27272A";
        ctx.fillRect(marginX, y, frameW, frameH);
      }

      // Frame numbers on film rebate edge
      ctx.fillStyle = "#D97706";
      ctx.font = "bold 11px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(`▶ ${(i + 1).toString().padStart(2, "0")}A`, 60, y + frameH + 20);
    }

    // Bottom footer
    const footerY = H - 36;
    ctx.fillStyle = "#A1A1AA";
    ctx.font = "14px ui-monospace, SFMono-Regular, monospace";
    const noteText = customNote ? `"${customNote}"` : `ROOM: ${roomName.toUpperCase()}`;
    ctx.fillText(noteText, 60, footerY);

    return;
  }

  // ── TEMPLATE: Instax Instant Print ─────────────────────────────────────────
  if (template === "instax" || template === "polaroid") {
    const isDark = template === "polaroid";
    ctx.fillStyle = isDark ? "#141416" : frameColor;
    ctx.fillRect(0, 0, W, H);

    // Subtle paper shadow / border
    ctx.strokeStyle = isDark ? "#27272A" : "#E4DEC8";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    const pad = 64;
    const photoW = (W - pad * 3) / 2;
    const photoH = 780;
    const photoY = 80;

    for (let i = 0; i < 2; i++) {
      const x = pad + i * (photoW + pad);
      const img = validImages[i % validImages.length];

      if (img) {
        drawGradedImage(ctx, img, x, photoY, photoW, photoH, 12, gradeFilter, true);
      } else {
        ctx.fillStyle = isDark ? "#222" : "#E2D9C3";
        roundedRect(ctx, x, photoY, photoW, photoH, 12);
        ctx.fill();
      }
    }

    // Wide Chin Handwritten Footer
    const chinY = photoY + photoH + 80;
    ctx.fillStyle = isDark ? "#F4F4F5" : "#262626";
    ctx.font = "italic 38px 'Caveat', cursive, serif";
    ctx.textAlign = "center";
    const noteText = customNote || "us across the distance ♡";
    ctx.fillText(noteText, W / 2, chinY);

    ctx.font = "16px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = isDark ? "#A1A1AA" : "#78716C";
    ctx.fillText(dateStr.toUpperCase(), W / 2, chinY + 44);
    ctx.textAlign = "left";

    return;
  }

  // ── TEMPLATE: Couple Strip (Side-by-Side) ──────────────────────────────────
  if (template === "coupleStrip") {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, W, H);

    // Outer subtle border
    ctx.strokeStyle = "#DDD5BE";
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    const pad = 48;
    const headerH = 100;
    const rowH = 460;
    const halfW = (W - pad * 3) / 2;

    // Header
    ctx.fillStyle = "#1C1917";
    ctx.font = "bold 24px ui-monospace, SFMono-Regular, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAIRFECT COUPLE BOOTH", W / 2, 58);

    ctx.font = "14px ui-monospace, SFMono-Regular, monospace";
    ctx.fillStyle = "#78716C";
    ctx.fillText(dateStr.toUpperCase(), W / 2, 84);

    // 2 Rows of 2 photos (Partner & You)
    for (let row = 0; row < 2; row++) {
      const y = headerH + 20 + row * (rowH + 24);

      for (let col = 0; col < 2; col++) {
        const idx = row * 2 + col;
        const x = pad + col * (halfW + pad);
        const img = validImages[idx % validImages.length];

        if (img) {
          drawGradedImage(ctx, img, x, y, halfW, rowH, 10, gradeFilter, true);
        } else {
          ctx.fillStyle = "#E7DFD0";
          roundedRect(ctx, x, y, halfW, rowH, 10);
          ctx.fill();
        }
      }
    }

    // Bottom note
    const footerY = H - 48;
    ctx.fillStyle = "#292524";
    ctx.font = "italic 32px 'Caveat', cursive, serif";
    ctx.textAlign = "center";
    ctx.fillText(customNote || "two hearts, one screen", W / 2, footerY);
    ctx.textAlign = "left";

    return;
  }

  // ── TEMPLATE: 2x2 Grid or 3x2 Grid ─────────────────────────────────────────
  if (template === "grid2x2" || template === "grid3x2") {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, W, H);

    const cols = template === "grid2x2" ? 2 : 3;
    const rows = 2;
    const margin = 50;
    const gap = 24;
    const totalW = W - margin * 2;
    const totalH = H - margin * 2 - 80;
    const cellW = (totalW - gap * (cols - 1)) / cols;
    const cellH = (totalH - gap * (rows - 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = margin + c * (cellW + gap);
        const y = margin + r * (cellH + gap);
        const img = validImages[idx % validImages.length];

        if (img) {
          drawGradedImage(ctx, img, x, y, cellW, cellH, 8, gradeFilter, true);
        } else {
          ctx.fillStyle = "#EAE2D2";
          roundedRect(ctx, x, y, cellW, cellH, 8);
          ctx.fill();
        }
      }
    }

    // Bottom Note & Date
    const bottomY = H - 42;
    ctx.fillStyle = "#1C1917";
    ctx.font = "italic 30px 'Caveat', cursive, serif";
    ctx.textAlign = "center";
    ctx.fillText(customNote || "captured together with love", W / 2, bottomY);
    ctx.textAlign = "left";

    return;
  }
}

/**
 * Helper to download the canvas content as a high-res image.
 */
export function downloadCanvasStrip(canvas: HTMLCanvasElement, filename = "pairfect-photostrip.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 0.95);
  link.click();
}
