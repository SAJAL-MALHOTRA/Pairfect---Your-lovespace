/**
 * High-Resolution Canvas Exporter for Love Letters.
 * 
 * Renders parchment paper, calligraphy/handwritten typography,
 * botanical sprigs, and wax seal into a downloadable keepsake PNG.
 * 
 * Zero em-dash constraint enforced.
 */

export interface ExportLetterOptions {
  recipientName: string;
  senderName: string;
  content: Array<{ type: string; value?: string }>;
  envelopeStyle?: string;
  dateStr?: string;
}

export async function exportLetterToPNG(
  options: ExportLetterOptions,
  filename?: string
): Promise<void> {
  const {
    recipientName,
    senderName,
    content,
    envelopeStyle = "classic",
    dateStr,
  } = options;

  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 1600;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Color schemes based on envelope style
  let bgColors = ["#FFFDF5", "#FAF4E8", "#F5ECE0"];
  let textColor = "#2A2016";
  let inkMid = "#7A6855";
  let sealColor = "#9E2A2B";
  let borderColor = "rgba(196, 168, 130, 0.35)";

  if (envelopeStyle === "velvet") {
    bgColors = ["#FFF9FA", "#FDF0F2", "#F6DADE"];
    textColor = "#381E26";
    inkMid = "#8B4B5A";
    sealColor = "#9B2E4B";
    borderColor = "rgba(220, 160, 175, 0.4)";
  } else if (envelopeStyle === "midnight") {
    bgColors = ["#16202E", "#0E1520", "#080D14"];
    textColor = "#EDE4D8";
    inkMid = "#9BA3AF";
    sealColor = "#6366F1";
    borderColor = "rgba(255, 255, 255, 0.15)";
  } else if (envelopeStyle === "kraft") {
    bgColors = ["#FAF4E7", "#EFE5CE", "#DECDB0"];
    textColor = "#302213";
    inkMid = "#755D42";
    sealColor = "#6B4F2C";
    borderColor = "rgba(160, 130, 90, 0.4)";
  }

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, bgColors[0]);
  bgGrad.addColorStop(0.5, bgColors[1]);
  bgGrad.addColorStop(1, bgColors[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft border frame
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 14;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, width - 88, height - 88);

  // 2. Lined paper subtle rules (unless midnight)
  if (envelopeStyle !== "midnight") {
    ctx.strokeStyle = "rgba(196, 168, 130, 0.16)";
    ctx.lineWidth = 1.5;
    const lineSpacing = 42;
    for (let y = 280; y < height - 260; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(width - 110, y);
      ctx.stroke();
    }
  }

  // 3. Top Watermark
  ctx.fillStyle = inkMid;
  ctx.font = "italic 26px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Pairfect Handwritten Letter", width / 2, 95);

  const displayDate = dateStr || new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.font = "18px Georgia, serif";
  ctx.fillText(displayDate, width / 2, 130);

  // 4. Salutation
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.font = "italic bold 44px Georgia, serif";
  ctx.fillText(`Dearest ${recipientName || "My Love"},`, 110, 220);

  // 5. Letter Text Content
  const textBlocks = content
    .filter((b) => b.type === "text" && b.value && b.value.trim())
    .map((b) => b.value || "");

  const fullText = textBlocks.length > 0 ? textBlocks.join("\n\n") : "You hold a special place in my heart.";

  ctx.font = "30px Georgia, serif";
  ctx.fillStyle = textColor;

  // Text wrapper
  const maxWidth = width - 220;
  const lineHeight = 42;
  let currentY = 310;

  const paragraphs = fullText.split("\n");
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      currentY += lineHeight * 0.7;
      continue;
    }

    const words = paragraph.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 110, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
        if (currentY > height - 320) break;
      } else {
        line = testLine;
      }
    }
    if (line && currentY <= height - 320) {
      ctx.fillText(line, 110, currentY);
      currentY += lineHeight * 1.3;
    }
    if (currentY > height - 320) break;
  }

  // 6. Signature
  const signY = Math.max(currentY + 50, height - 300);
  ctx.font = "italic 32px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillStyle = inkMid;
  ctx.fillText("With all my love,", width - 110, signY);

  ctx.font = "italic bold 46px Georgia, serif";
  ctx.fillStyle = textColor;
  ctx.fillText(senderName || "Always Yours", width - 110, signY + 60);

  // 7. Wax Seal Emblem (Bottom Left)
  const sealX = 180;
  const sealY = height - 160;
  const sealRadius = 55;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  ctx.fillStyle = sealColor;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 36px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", sealX, sealY);
  ctx.restore();

  // 8. Bottom Tagline
  ctx.font = "18px Georgia, serif";
  ctx.fillStyle = inkMid;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("pairfect.site · Forever sealed in your heart", width / 2, height - 60);

  // 9. Export image download
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const safeName = (recipientName || "love")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");
  anchor.download = filename || `pairfect-love-letter-${safeName}-${Date.now()}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
