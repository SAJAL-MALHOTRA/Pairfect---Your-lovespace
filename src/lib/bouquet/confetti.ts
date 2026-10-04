// Lightweight canvas-based celebratory confetti burst for digital bouquets
// Zero external dependencies

const CONFETTI_COLORS = [
  "#E8A0B4",
  "#D4A574",
  "#F2C6D0",
  "#8FB996",
  "#C89B7B",
  "#FFD700",
  "#FF6B8A",
  "#F472B6",
  "#FDA4AF",
  "#FEF08A",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  opacity: number;
  decay: number;
  shape: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animFrame: number | null = null;

function ensureCanvas() {
  if (typeof window === "undefined") return;
  if (canvas) return;

  canvas = document.createElement("canvas");
  canvas.id = "bouquet-confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";

  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  const resize = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);
}

function animate() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter((p) => p.opacity > 0);

  for (const p of particles) {
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.99;
    p.rotation += p.rotationSpeed;
    p.opacity -= p.decay;

    if (p.opacity <= 0) continue;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;

    if (p.shape === 0) {
      // Petal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 1) {
      // Little soft circle
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ribbon strip
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }

    ctx.restore();
  }

  if (particles.length > 0) {
    animFrame = requestAnimationFrame(animate);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animFrame = null;
  }
}

export function fireBouquetConfetti(x?: number, y?: number, count = 70) {
  if (typeof window === "undefined") return;
  ensureCanvas();
  if (!canvas) return;

  const cx = x ?? canvas.width / 2;
  const cy = y ?? canvas.height * 0.35;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 3,
      gravity: 0.28,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      size: Math.random() * 9 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      opacity: 1,
      decay: Math.random() * 0.014 + 0.008,
      shape: Math.floor(Math.random() * 3),
    });
  }

  if (!animFrame) {
    animFrame = requestAnimationFrame(animate);
  }
}

export function celebrateBouquet() {
  if (typeof window === "undefined") return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  fireBouquetConfetti(w * 0.35, h * 0.35, 45);
  setTimeout(() => fireBouquetConfetti(w * 0.65, h * 0.35, 45), 140);
  setTimeout(() => fireBouquetConfetti(w * 0.5, h * 0.28, 50), 280);
}
