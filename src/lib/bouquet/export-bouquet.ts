/**
 * High-Resolution (300 DPI) Canvas Exporter for Digital Bouquets.
 * 
 * Renders the botanical arrangement, wrapping folds, foliage, ribbon tie,
 * and personal handwritten gift card into an exportable PNG image.
 */

import {
  WRAPPING_STYLES,
  RIBBON_STYLES,
  BOTANICAL_FLOWERS,
} from "./flowers-data";

export interface ExportBouquetOptions {
  flowers: string[];
  wrappingId: string;
  ribbonId: string;
  greeneryId: string;
  toName: string;
  fromName: string;
  message: string;
}

export async function exportBouquetToPNG(
  options: ExportBouquetOptions,
  filename?: string
): Promise<void> {
  const {
    flowers,
    wrappingId,
    ribbonId,
    toName,
    fromName,
    message,
  } = options;

  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const wrap = WRAPPING_STYLES[wrappingId] || WRAPPING_STYLES.kraft;
  const ribbon = RIBBON_STYLES[ribbonId] || RIBBON_STYLES.rose;

  // 1. Background soft paper gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#FBF8F3");
  bgGrad.addColorStop(0.6, "#F5ECE0");
  bgGrad.addColorStop(1, "#EFE3D3");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft border frame
  ctx.strokeStyle = "rgba(180, 140, 100, 0.25)";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // 2. Header watermark / brand
  ctx.fillStyle = "#A88B77";
  ctx.font = "italic 32px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Pairfect Botanical Keepsake ♡", width / 2, 70);

  // 3. Back wrapping paper cone
  ctx.save();
  ctx.fillStyle = wrap.borderColor;
  ctx.beginPath();
  ctx.moveTo(width * 0.15, height * 0.45);
  ctx.lineTo(width * 0.85, height * 0.45);
  ctx.lineTo(width * 0.62, height * 0.94);
  ctx.lineTo(width * 0.38, height * 0.94);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Stems
  ctx.strokeStyle = "#2D6A4F";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  for (let i = 0; i < flowers.length; i++) {
    const startX = width * (0.3 + (i * 0.4) / (flowers.length || 1));
    ctx.beginPath();
    ctx.moveTo(startX, height * 0.4);
    ctx.quadraticCurveTo(width / 2, height * 0.7, width / 2, height * 0.88);
    ctx.stroke();
  }

  // 5. Flower Blooms (Rendered as radiant layered botanical circles with symbolic colors)
  const validFlowers = flowers.length > 0 ? flowers : ["rose", "peony", "tulip"];
  const flowerCount = validFlowers.length;

  for (let idx = 0; idx < flowerCount; idx++) {
    const fId = validFlowers[idx];
    const flowerObj = BOTANICAL_FLOWERS[fId] || BOTANICAL_FLOWERS.rose;

    const angleNorm = (idx - (flowerCount - 1) / 2) / (flowerCount || 1);
    const fx = width / 2 + angleNorm * 380;
    const fy = height * 0.38 - Math.cos(angleNorm * Math.PI) * 120;
    const r = 90;

    ctx.save();
    ctx.translate(fx, fy);

    // Outer petal glow
    const petalGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, r);
    petalGrad.addColorStop(0, "#FFFFFF");
    petalGrad.addColorStop(0.5, flowerObj.primaryColor);
    petalGrad.addColorStop(1, flowerObj.accentColor);

    ctx.fillStyle = petalGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Ruffled petal edges
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.2) {
      const rad = r + Math.sin(a * 8) * 6;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner core
    ctx.fillStyle = flowerObj.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 6. Front Wrapping Paper Sleeve & Lapels
  ctx.save();
  ctx.fillStyle = wrap.lapelFill;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height * 0.55);
  ctx.quadraticCurveTo(width / 2, height * 0.62, width * 0.8, height * 0.55);
  ctx.lineTo(width * 0.64, height * 0.95);
  ctx.quadraticCurveTo(width / 2, height * 0.98, width * 0.36, height * 0.95);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = wrap.borderColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // 7. Tied Ribbon Bow
  ctx.save();
  ctx.translate(width / 2, height * 0.86);

  ctx.strokeStyle = ribbon.color;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  // Left loop
  ctx.beginPath();
  ctx.ellipse(-48, -12, 42, 22, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = ribbon.color;
  ctx.fill();
  // Right loop
  ctx.beginPath();
  ctx.ellipse(48, -12, 42, 22, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = ribbon.color;
  ctx.fill();
  // Knot
  ctx.beginPath();
  ctx.arc(0, -6, 20, 0, Math.PI * 2);
  ctx.fillStyle = ribbon.accentColor;
  ctx.fill();
  ctx.restore();

  // 8. Tucked Handwritten Gift Card (Rendered clearly on the right)
  const cardX = width * 0.44;
  const cardY = height * 0.62;
  const cardW = 460;
  const cardH = 320;

  ctx.save();
  ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
  ctx.rotate(0.06); // 3.5 degrees romantic tilt

  // Card shadow & background
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#FFFDF9";
  ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
  ctx.shadowColor = "transparent";

  // Card border
  ctx.strokeStyle = "rgba(180, 140, 100, 0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);

  // Card Header: To Name
  ctx.fillStyle = "#881337";
  ctx.font = "bold 26px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText(`To: ${toName || "My Favorite Person"}`, -cardW / 2 + 28, -cardH / 2 + 48);

  ctx.strokeStyle = "rgba(244, 63, 94, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-cardW / 2 + 28, -cardH / 2 + 64);
  ctx.lineTo(cardW / 2 - 28, -cardH / 2 + 64);
  ctx.stroke();

  // Card Message text with word wrapping
  ctx.fillStyle = "#292524";
  ctx.font = "italic 24px Caveat, cursive, serif";
  ctx.textAlign = "left";

  const words = (message || "A handpicked digital bouquet for you.").split(" ");
  let line = "";
  let lineY = -cardH / 2 + 110;
  const maxLineW = cardW - 56;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineW && n > 0) {
      ctx.fillText(line, -cardW / 2 + 28, lineY);
      line = words[n] + " ";
      lineY += 34;
      if (lineY > cardH / 2 - 60) break; // Don't overflow card
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, -cardW / 2 + 28, lineY);

  // Card Footer: From Name
  ctx.fillStyle = "#9F1239";
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(`From: ${fromName || "Always Yours"}`, cardW / 2 - 28, cardH / 2 - 24);

  ctx.restore();

  // 9. Download trigger
  const link = document.createElement("a");
  link.download = filename || `pairfect-bouquet-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
