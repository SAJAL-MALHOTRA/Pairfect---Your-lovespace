/**
 * High-Resolution (300 DPI) Canvas Exporter for Digital Botanical Bouquets.
 * Renders authentic botanical illustrations, foliage, wrapping, ribbon, and card note.
 */

import {
  getWrappingStyle,
  RIBBON_STYLES,
  getFlowerById,
  getGreeneryData,
  generateArrangement,
} from "./flowers-data";

export interface ExportBouquetOptions {
  flowers: string[];
  wrappingId: string;
  ribbonId: string;
  greeneryId?: string;
  toName: string;
  fromName: string;
  message: string;
}

// Helper to safely load image onto canvas
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportBouquetToPNG(
  options: ExportBouquetOptions,
  filename?: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const {
    flowers,
    wrappingId,
    ribbonId,
    greeneryId = "eucalyptus",
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

  const wrap = getWrappingStyle(wrappingId);
  const ribbon = RIBBON_STYLES[ribbonId] || RIBBON_STYLES.gold;
  const greenery = getGreeneryData(greeneryId);

  // 1. Soft Parchment Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#FBF8F3");
  bgGrad.addColorStop(0.6, "#F5ECE0");
  bgGrad.addColorStop(1, "#EFE3D3");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Delicate Double Border Frame
  ctx.strokeStyle = "rgba(180, 140, 100, 0.35)";
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = "rgba(180, 140, 100, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // 2. Brand Header Watermark
  ctx.fillStyle = "#A88B77";
  ctx.font = "italic 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Pairfect Botanical Keepsake", width / 2, 85);

  // 3. Back Wrapping Paper Cone
  if (!wrap.isVase) {
    ctx.save();
    ctx.fillStyle = wrap.borderColor;
    ctx.beginPath();
    ctx.moveTo(width * 0.22, height * 0.44);
    ctx.lineTo(width * 0.78, height * 0.44);
    ctx.lineTo(width * 0.62, height * 0.94);
    ctx.lineTo(width * 0.38, height * 0.94);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. Draw Greenery Base Foliage
  const greeneryBaseImg = await loadImage(greenery.base);
  if (greeneryBaseImg) {
    const gw = width * 0.72;
    const gh = height * 0.58;
    const gx = width * 0.14;
    const gy = height * 0.30;
    ctx.drawImage(greeneryBaseImg, gx, gy, gw, gh);
  }

  // 5. Draw Arranged Botanical Flowers
  const validFlowers = flowers.length > 0 ? flowers : ["rose", "peony", "tulip", "daisy"];
  const positions = generateArrangement(validFlowers, 0.42, width, height);

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const flower = getFlowerById(p.flowerId);
    const flowerImg = await loadImage(flower.image);

    if (flowerImg) {
      ctx.save();
      const fx = p.x;
      const fy = p.y * 1.05; // slightly scaled for canvas
      const fSize = 270 * p.scale;

      ctx.translate(fx + fSize / 2, fy + fSize / 2);
      ctx.rotate((p.rotation * Math.PI) / 180);

      // Subtle drop shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;

      ctx.drawImage(flowerImg, -fSize / 2, -fSize / 2, fSize, fSize);
      ctx.restore();
    }
  }

  // 6. Draw Greenery Top Overlay
  const greeneryTopImg = await loadImage(greenery.top);
  if (greeneryTopImg) {
    ctx.save();
    ctx.globalAlpha = 0.65;
    const gw = width * 0.72;
    const gh = height * 0.58;
    const gx = width * 0.14;
    const gy = height * 0.30;
    ctx.drawImage(greeneryTopImg, gx, gy, gw, gh);
    ctx.restore();
  }

  // 7. Front Wrapping Paper Cone or Vase
  ctx.save();
  if (wrap.isVase) {
    ctx.fillStyle = wrap.id === "glass" ? "rgba(255, 255, 255, 0.7)" : "#E0D5C1";
    ctx.strokeStyle = wrap.borderColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(width * 0.38, height * 0.62, width * 0.24, height * 0.30, [40, 40, 60, 60]);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = wrap.borderColor;
    ctx.beginPath();
    ctx.moveTo(width * 0.24, height * 0.58);
    ctx.lineTo(width * 0.76, height * 0.58);
    ctx.lineTo(width * 0.62, height * 0.95);
    ctx.lineTo(width * 0.38, height * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();

  // 8. Ribbon Bow
  ctx.save();
  ctx.translate(width / 2, height * 0.84);
  ctx.fillStyle = ribbon.color;
  ctx.beginPath();
  ctx.ellipse(-46, -10, 44, 24, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(46, -10, 44, 24, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -6, 20, 0, Math.PI * 2);
  ctx.fillStyle = ribbon.accentColor;
  ctx.fill();
  ctx.restore();

  // 9. Tucked Handwritten Gift Card
  const cardX = width * 0.44;
  const cardY = height * 0.64;
  const cardW = 480;
  const cardH = 340;

  ctx.save();
  ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
  ctx.rotate(0.05); // subtle romantic tilt

  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#FFFDF9";
  ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "rgba(180, 140, 100, 0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);

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

  // Card Message text
  ctx.fillStyle = "#292524";
  ctx.font = "italic 23px Georgia, serif";
  ctx.textAlign = "left";

  const words = (message || "A handpicked digital bouquet for you.").split(" ");
  let line = "";
  let lineY = -cardH / 2 + 105;
  const maxLineW = cardW - 56;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineW && n > 0) {
      ctx.fillText(line, -cardW / 2 + 28, lineY);
      line = words[n] + " ";
      lineY += 34;
      if (lineY > cardH / 2 - 60) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, -cardW / 2 + 28, lineY);

  ctx.fillStyle = "#9F1239";
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText(`From: ${fromName || "Always Yours"}`, cardW / 2 - 28, cardH / 2 - 24);

  ctx.restore();

  // 10. Trigger Download
  const link = document.createElement("a");
  link.download = filename || `pairfect-bouquet-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
