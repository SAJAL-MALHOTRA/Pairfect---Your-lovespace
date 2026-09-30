"use client";

import React from "react";

// ── Flower Vector Illustrations ─────────────────────────────────────────────

export function RoseFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="rose-grad-outer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="65%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </radialGradient>
        <radialGradient id="rose-grad-inner" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="70%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </radialGradient>
        <filter id="rose-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#4C0519" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Sepal leaves */}
      <path d="M50 78 C42 86 35 94 28 98 C36 90 44 82 48 76" stroke="#2D6A4F" strokeWidth="2.5" fill="#40916C" />
      <path d="M50 78 C58 86 65 94 72 98 C64 90 56 82 52 76" stroke="#2D6A4F" strokeWidth="2.5" fill="#40916C" />

      {/* Outer base petals */}
      <g filter="url(#rose-shadow)">
        <path d="M26 62 C16 46 22 26 40 20 C48 30 46 54 26 62 Z" fill="url(#rose-grad-outer)" opacity="0.95" />
        <path d="M74 62 C84 46 78 26 60 20 C52 30 54 54 74 62 Z" fill="url(#rose-grad-outer)" opacity="0.95" />
        <path d="M30 74 C18 64 24 44 48 42 C54 58 44 72 30 74 Z" fill="url(#rose-grad-outer)" />
        <path d="M70 74 C82 64 76 44 52 42 C46 58 56 72 70 74 Z" fill="url(#rose-grad-outer)" />
        <path d="M50 82 C32 82 24 66 38 52 C50 64 56 74 50 82 Z" fill="url(#rose-grad-outer)" />
        <path d="M50 82 C68 82 76 66 62 52 C50 64 44 74 50 82 Z" fill="url(#rose-grad-outer)" />

        {/* Mid floral cup */}
        <path d="M32 46 C34 30 46 24 58 28 C64 42 50 56 32 46 Z" fill="url(#rose-grad-inner)" />
        <path d="M68 46 C66 30 54 24 42 28 C36 42 50 56 68 46 Z" fill="url(#rose-grad-inner)" />
        <path d="M38 58 C38 42 62 42 62 58 C56 68 44 68 38 58 Z" fill="url(#rose-grad-inner)" />

        {/* Spiral center heart */}
        <ellipse cx="50" cy="46" rx="14" ry="12" fill="#881337" />
        <path d="M43 45 C43 39 57 39 57 45 C57 51 46 52 46 47 C46 43 54 43 54 46" stroke="#FECDD3" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function PeonyFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="peony-grad-petal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="60%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#F43F5E" />
        </radialGradient>
      </defs>

      {/* Layer 1: Background broad scalloped petals */}
      <g opacity="0.9">
        <circle cx="50" cy="50" r="38" fill="#F43F5E" opacity="0.2" />
        <path d="M50 14 C36 14 26 28 32 42 C40 32 50 30 50 14 Z" fill="url(#peony-grad-petal)" />
        <path d="M50 14 C64 14 74 28 68 42 C60 32 50 30 50 14 Z" fill="url(#peony-grad-petal)" />
        <path d="M86 50 C86 36 72 26 58 32 C68 40 70 50 86 50 Z" fill="url(#peony-grad-petal)" />
        <path d="M14 50 C14 36 28 26 42 32 C32 40 30 50 14 50 Z" fill="url(#peony-grad-petal)" />
        <path d="M50 86 C36 86 26 72 32 58 C40 68 50 70 50 86 Z" fill="url(#peony-grad-petal)" />
        <path d="M50 86 C64 86 74 72 68 58 C60 68 50 70 50 86 Z" fill="url(#peony-grad-petal)" />
      </g>

      {/* Layer 2: Intermediate ruffled petals */}
      <path d="M28 30 C34 18 52 20 54 34 C44 38 34 38 28 30 Z" fill="url(#peony-grad-petal)" />
      <path d="M72 30 C66 18 48 20 46 34 C56 38 66 38 72 30 Z" fill="url(#peony-grad-petal)" />
      <path d="M74 68 C82 56 70 42 56 46 C60 56 68 64 74 68 Z" fill="url(#peony-grad-petal)" />
      <path d="M26 68 C18 56 30 42 44 46 C40 56 32 64 26 68 Z" fill="url(#peony-grad-petal)" />

      {/* Layer 3: Inner tight ruffles */}
      <ellipse cx="50" cy="50" rx="20" ry="18" fill="#FB7185" />
      <path d="M38 46 C42 38 58 38 62 46 C58 56 42 56 38 46 Z" fill="#FFE4E6" />
      <path d="M42 52 C45 44 55 44 58 52 C55 58 45 58 42 52 Z" fill="#FDA4AF" />

      {/* Golden stamens core */}
      <circle cx="50" cy="50" r="7" fill="#FBBF24" />
      <circle cx="48" cy="48" r="1.5" fill="#D97706" />
      <circle cx="52" cy="48" r="1.5" fill="#D97706" />
      <circle cx="50" cy="52" r="1.5" fill="#D97706" />
    </svg>
  );
}

export function TulipFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="tulip-grad-l" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="tulip-grad-r" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="tulip-grad-c" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Stem */}
      <path d="M50 78 Q50 90 52 98" stroke="#40916C" strokeWidth="4" strokeLinecap="round" />

      {/* Back center petal */}
      <path d="M50 18 C44 32 44 60 50 74 C56 60 56 32 50 18 Z" fill="#D97706" opacity="0.8" />

      {/* Left broad wing petal */}
      <path
        d="M50 78 C30 76 18 56 26 34 C34 40 44 54 50 78 Z"
        fill="url(#tulip-grad-l)"
      />

      {/* Right broad wing petal */}
      <path
        d="M50 78 C70 76 82 56 74 34 C66 40 56 54 50 78 Z"
        fill="url(#tulip-grad-r)"
      />

      {/* Front center smooth cup petal */}
      <path
        d="M50 24 C38 42 40 70 50 78 C60 70 62 42 50 24 Z"
        fill="url(#tulip-grad-c)"
      />
    </svg>
  );
}

export function DaisyFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  const petals = Array.from({ length: 14 }).map((_, i) => (i * 360) / 14);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="daisy-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
      </defs>

      {/* Radiating clean white petals */}
      <g transform="translate(50, 50)">
        {petals.map((rot, idx) => (
          <g key={idx} transform={`rotate(${rot})`}>
            <path
              d="M-5 -40 C-8 -26 -6 -12 0 0 C6 -12 8 -26 5 -40 C3 -44 -3 -44 -5 -40 Z"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="0.8"
            />
          </g>
        ))}
      </g>

      {/* Golden textured disc florets */}
      <circle cx="50" cy="50" r="14" fill="url(#daisy-center)" />
      <circle cx="50" cy="50" r="11" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      <circle cx="50" cy="50" r="6" fill="#FBBF24" opacity="0.7" />
    </svg>
  );
}

export function PoppyFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="poppy-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="70%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>
      </defs>

      {/* 4 large overlapping crepe petals */}
      <path d="M50 50 C26 22 20 68 50 82 C34 68 34 38 50 50 Z" fill="url(#poppy-grad)" />
      <path d="M50 50 C74 22 80 68 50 82 C66 68 66 38 50 50 Z" fill="url(#poppy-grad)" />
      <path d="M50 50 C20 34 68 20 82 50 C68 34 38 34 50 50 Z" fill="url(#poppy-grad)" />
      <path d="M50 50 C20 66 68 80 82 50 C68 66 38 66 50 50 Z" fill="url(#poppy-grad)" />

      {/* Central velvety black ink core */}
      <circle cx="50" cy="50" r="15" fill="#18181B" />
      <circle cx="50" cy="50" r="12" fill="#27272A" />
      <circle cx="50" cy="50" r="8" fill="#15803D" />

      {/* Radiating stamens */}
      {Array.from({ length: 12 }).map((_, i) => {
        const rad = (i * 30 * Math.PI) / 180;
        const x2 = 50 + Math.cos(rad) * 14;
        const y2 = 50 + Math.sin(rad) * 14;
        return (
          <circle key={i} cx={x2} cy={y2} r="1.2" fill="#FACC15" />
        );
      })}
    </svg>
  );
}

export function LavenderFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      {/* Central slender stem */}
      <path d="M50 16 L50 96" stroke="#40916C" strokeWidth="2.5" strokeLinecap="round" />

      {/* Clustered vertical lavender buds */}
      {[20, 28, 36, 44, 52, 60, 68].map((y, idx) => (
        <g key={idx}>
          <ellipse cx="43" cy={y} rx="5" ry="3.5" transform={`rotate(-18 43 ${y})`} fill="#A855F7" />
          <ellipse cx="57" cy={y + 1} rx="5" ry="3.5" transform={`rotate(18 57 ${y + 1})`} fill="#9333EA" />
          <ellipse cx="48" cy={y - 2} rx="4" ry="3" fill="#C084FC" />
          <ellipse cx="52" cy={y - 2} rx="4" ry="3" fill="#DDD6FE" />
        </g>
      ))}

      {/* Top terminal plume */}
      <ellipse cx="50" cy="14" rx="3.5" ry="5" fill="#C084FC" />
    </svg>
  );
}

export function LilyFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="lily-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </radialGradient>
      </defs>

      {/* 6 sweeping recurved star petals */}
      <g transform="translate(50, 50)">
        {[0, 60, 120, 180, 240, 300].map((rot, idx) => (
          <g key={idx} transform={`rotate(${rot})`}>
            <path
              d="M0 0 C-10 -22 -14 -40 0 -48 C14 -40 10 -22 0 0 Z"
              fill="url(#lily-grad)"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
            {/* Center pink blush groove */}
            <path d="M0 -4 C-1 -18 0 -34 0 -42" stroke="#FDA4AF" strokeWidth="1.2" opacity="0.6" />
            {/* Freckles */}
            <circle cx="-3" cy="-22" r="0.8" fill="#BE123C" opacity="0.6" />
            <circle cx="2" cy="-26" r="0.8" fill="#BE123C" opacity="0.6" />
            <circle cx="-1" cy="-30" r="0.8" fill="#BE123C" opacity="0.6" />
          </g>
        ))}
      </g>

      {/* Pistils with amber anthers */}
      <circle cx="50" cy="50" r="4" fill="#65A30D" />
      {[30, 90, 150, 210, 270, 330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = 50 + Math.cos(rad) * 14;
        const y2 = 50 + Math.sin(rad) * 14;
        return (
          <g key={i}>
            <line x1="50" y1="50" x2={x2} y2={y2} stroke="#84CC16" strokeWidth="1.2" />
            <ellipse cx={x2} cy={y2} rx="2.5" ry="1.5" transform={`rotate(${deg} ${x2} ${y2})`} fill="#B45309" />
          </g>
        );
      })}
    </svg>
  );
}

export function OrchidFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="orchid-grad-petal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAF5FF" />
          <stop offset="60%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      {/* Top dorsal sepal */}
      <path d="M50 50 C44 32 44 14 50 10 C56 14 56 32 50 50 Z" fill="url(#orchid-grad-petal)" stroke="#A855F7" strokeWidth="0.6" />

      {/* Bottom two lateral sepals */}
      <path d="M50 50 C36 60 22 76 26 84 C34 82 44 68 50 50 Z" fill="url(#orchid-grad-petal)" stroke="#A855F7" strokeWidth="0.6" />
      <path d="M50 50 C64 60 78 76 74 84 C66 82 56 68 50 50 Z" fill="url(#orchid-grad-petal)" stroke="#A855F7" strokeWidth="0.6" />

      {/* Two broad side petals */}
      <ellipse cx="28" cy="42" rx="18" ry="12" transform="rotate(-15 28 42)" fill="url(#orchid-grad-petal)" stroke="#C084FC" strokeWidth="0.8" />
      <ellipse cx="72" cy="42" rx="18" ry="12" transform="rotate(15 72 42)" fill="url(#orchid-grad-petal)" stroke="#C084FC" strokeWidth="0.8" />

      {/* Center labellum (lip) */}
      <path d="M42 50 C38 64 42 74 50 78 C58 74 62 64 58 50 C54 52 46 52 42 50 Z" fill="#9333EA" />
      <ellipse cx="50" cy="58" rx="5" ry="4" fill="#FACC15" />
      <circle cx="50" cy="54" r="1.5" fill="#7E22CE" />
    </svg>
  );
}

export function CamelliaFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="camellia-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="60%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#F43F5E" />
        </radialGradient>
      </defs>

      {/* Outer petal ring */}
      <g transform="translate(50, 50)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((rot, idx) => (
          <ellipse
            key={idx}
            cx="0"
            cy="-28"
            rx="14"
            ry="18"
            transform={`rotate(${rot})`}
            fill="url(#camellia-grad)"
            opacity="0.9"
          />
        ))}
      </g>

      {/* Middle petal ring */}
      <g transform="translate(50, 50)">
        {[22, 67, 112, 157, 202, 247, 292, 337].map((rot, idx) => (
          <ellipse
            key={idx}
            cx="0"
            cy="-18"
            rx="11"
            ry="14"
            transform={`rotate(${rot})`}
            fill="url(#camellia-grad)"
          />
        ))}
      </g>

      {/* Inner tight rosette */}
      <circle cx="50" cy="50" r="12" fill="#FB7185" />
      <circle cx="50" cy="50" r="6" fill="#FBBF24" />
      <circle cx="49" cy="49" r="1" fill="#D97706" />
      <circle cx="51" cy="51" r="1" fill="#D97706" />
    </svg>
  );
}

export function SunflowerFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  const petals = Array.from({ length: 18 }).map((_, i) => (i * 360) / 18);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#451A03" />
          <stop offset="75%" stopColor="#291102" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
      </defs>

      {/* Golden radiating petals */}
      <g transform="translate(50, 50)">
        {petals.map((rot, idx) => (
          <g key={idx} transform={`rotate(${rot})`}>
            <path
              d="M-4 -42 C-7 -26 -5 -12 0 0 C5 -12 7 -26 4 -42 C2 -46 -2 -46 -4 -42 Z"
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth="0.6"
            />
          </g>
        ))}
      </g>

      {/* Big chocolate textured seed center */}
      <circle cx="50" cy="50" r="19" fill="url(#sun-core)" />
      <circle cx="50" cy="50" r="16" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
    </svg>
  );
}

export function LotusFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="lotus-grad" cx="50%" cy="80%" r="70%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="60%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE185D" />
        </radialGradient>
      </defs>

      {/* Outer floating fan petals */}
      <path d="M50 78 C20 74 10 52 24 38 C34 52 44 68 50 78 Z" fill="url(#lotus-grad)" opacity="0.9" />
      <path d="M50 78 C80 74 90 52 76 38 C66 52 56 68 50 78 Z" fill="url(#lotus-grad)" opacity="0.9" />

      {/* Intermediate serene petals */}
      <path d="M50 78 C28 66 22 40 38 24 C44 42 48 64 50 78 Z" fill="url(#lotus-grad)" />
      <path d="M50 78 C72 66 78 40 62 24 C56 42 52 64 50 78 Z" fill="url(#lotus-grad)" />

      {/* Upright center crown petal */}
      <path d="M50 16 C42 34 44 64 50 78 C56 64 58 34 50 16 Z" fill="url(#lotus-grad)" />

      {/* Golden pollen base */}
      <ellipse cx="50" cy="74" rx="8" ry="3" fill="#FBBF24" />
    </svg>
  );
}

export function BabyBreathFlower({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      {/* Branching twigs */}
      <path d="M50 96 Q50 60 48 40" stroke="#40916C" strokeWidth="1.5" />
      <path d="M48 64 Q32 50 24 36" stroke="#40916C" strokeWidth="1.2" />
      <path d="M49 52 Q68 40 76 28" stroke="#40916C" strokeWidth="1.2" />
      <path d="M30 42 Q20 30 16 18" stroke="#40916C" strokeWidth="1" />
      <path d="M48 40 Q46 26 42 16" stroke="#40916C" strokeWidth="1" />
      <path d="M68 34 Q78 20 84 14" stroke="#40916C" strokeWidth="1" />

      {/* Miniature snow-white floret clusters */}
      {[
        [24, 36], [16, 18], [28, 22], [42, 16],
        [48, 26], [54, 18], [76, 28], [84, 14],
        [68, 20], [36, 48], [62, 44], [52, 34],
      ].map(([x, y], idx) => (
        <g key={idx}>
          <circle cx={x} cy={y} r="3.2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
          <circle cx={x} cy={y} r="1" fill="#FEF08A" />
        </g>
      ))}
    </svg>
  );
}

// ── Flower Renderer by ID ───────────────────────────────────────────────────
export function RenderFlowerIcon({ flowerId, size = 100, className = "" }: { flowerId: string; size?: number; className?: string }) {
  switch (flowerId) {
    case "rose":
      return <RoseFlower size={size} className={className} />;
    case "peony":
      return <PeonyFlower size={size} className={className} />;
    case "tulip":
      return <TulipFlower size={size} className={className} />;
    case "daisy":
      return <DaisyFlower size={size} className={className} />;
    case "poppy":
      return <PoppyFlower size={size} className={className} />;
    case "lavender":
      return <LavenderFlower size={size} className={className} />;
    case "lily":
      return <LilyFlower size={size} className={className} />;
    case "orchid":
      return <OrchidFlower size={size} className={className} />;
    case "camellia":
      return <CamelliaFlower size={size} className={className} />;
    case "sunflower":
      return <SunflowerFlower size={size} className={className} />;
    case "lotus":
      return <LotusFlower size={size} className={className} />;
    case "baby_breath":
      return <BabyBreathFlower size={size} className={className} />;
    default:
      return <RoseFlower size={size} className={className} />;
  }
}

// ── Greenery Foliage Illustration ──────────────────────────────────────────
export function GreeneryBranch({
  type = "eucalyptus",
  size = 180,
  flip = false,
  className = "",
}: {
  type?: string;
  size?: number;
  flip?: boolean;
  className?: string;
}) {
  const flipStyle = flip ? { transform: "scaleX(-1)" } : {};

  if (type === "fern") {
    return (
      <svg
        width={size * 0.55}
        height={size}
        viewBox="0 0 70 180"
        fill="none"
        className={className}
        style={{ ...flipStyle, overflow: "visible" }}
      >
        <path d="M35 178 C35 120 32 70 35 10" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" />
        {[30, 50, 70, 90, 110, 130, 150].map((y, idx) => (
          <g key={idx}>
            <path d={`M35 ${y} Q18 ${y - 12} 8 ${y - 20}`} stroke="#40916C" strokeWidth="2" strokeLinecap="round" />
            <path d={`M35 ${y} Q52 ${y - 12} 62 ${y - 20}`} stroke="#40916C" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );
  }

  if (type === "olive") {
    return (
      <svg
        width={size * 0.55}
        height={size}
        viewBox="0 0 70 180"
        fill="none"
        className={className}
        style={{ ...flipStyle, overflow: "visible" }}
      >
        <path d="M35 178 Q32 100 36 12" stroke="#588157" strokeWidth="2.5" strokeLinecap="round" />
        {[28, 54, 82, 110, 138].map((y, idx) => (
          <g key={idx}>
            <ellipse cx="22" cy={y - 8} rx="12" ry="5" transform={`rotate(-35 22 ${y - 8})`} fill="#74A57F" stroke="#588157" strokeWidth="1" />
            <ellipse cx="48" cy={y - 6} rx="12" ry="5" transform={`rotate(35 48 ${y - 6})`} fill="#6B9080" stroke="#588157" strokeWidth="1" />
            <circle cx="28" cy={y + 4} r="2.5" fill="#3D3A2A" />
          </g>
        ))}
      </svg>
    );
  }

  // Default: Eucalyptus
  return (
    <svg
      width={size * 0.6}
      height={size}
      viewBox="0 0 80 180"
      fill="none"
      className={className}
      style={{ ...flipStyle, overflow: "visible" }}
    >
      <path d="M40 178 C40 120 38 70 41 12" stroke="#3A5A40" strokeWidth="3" strokeLinecap="round" />
      {[32, 60, 90, 120, 150].map((y, idx) => (
        <g key={idx}>
          <circle cx="20" cy={y - 6} r="14" fill="#6B9080" stroke="#3A5A40" strokeWidth="1.2" opacity="0.92" />
          <circle cx="60" cy={y} r="13" fill="#84A98C" stroke="#3A5A40" strokeWidth="1.2" opacity="0.92" />
          <line x1="39" y1={y + 4} x2="20" y2={y - 6} stroke="#3A5A40" strokeWidth="1.5" />
          <line x1="41" y1={y + 6} x2="60" y2={y} stroke="#3A5A40" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}

// ── Ribbon Tie Vector Illustration ──────────────────────────────────────────
export function RibbonBow({ color = "#E11D48", size = 90, className = "" }: { color?: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 100 75"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`ribbon-grad-${color.replace("#", "")}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#4C0519" />
        </radialGradient>
      </defs>

      {/* Hanging ribbon tails */}
      <path d="M44 40 Q32 55 24 72" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M56 40 Q68 55 76 72" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Left loop */}
      <path
        d="M50 34 C30 18 12 24 16 38 C20 48 38 42 50 36 Z"
        fill={color}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />

      {/* Right loop */}
      <path
        d="M50 34 C70 18 88 24 84 38 C80 48 62 42 50 36 Z"
        fill={color}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />

      {/* Center knot */}
      <circle cx="50" cy="36" r="7.5" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" />
    </svg>
  );
}
