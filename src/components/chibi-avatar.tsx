import React from "react";

export interface AvatarConfig {
  skin: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  glasses: string;
  beard: string;
  accessories: string;
  sweater: string;
  shirt: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin: "#FCEBE3",
  hairStyle: "bob",
  hairColor: "#6E5A44",
  eyeStyle: "chibi",
  glasses: "none",
  beard: "none",
  accessories: "none",
  sweater: "#E0B8B8",
  shirt: "#FFFDF8",
};

export function parseAvatarConfig(avatarUrl: string | null | undefined): AvatarConfig {
  if (!avatarUrl) return DEFAULT_AVATAR_CONFIG;
  try {
    if (avatarUrl.startsWith("{")) {
      return { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(avatarUrl) };
    }
  } catch (e) {
    console.error("Failed to parse avatar config", e);
  }
  return DEFAULT_AVATAR_CONFIG;
}

export function stringifyAvatarConfig(config: AvatarConfig): string {
  return JSON.stringify(config);
}

// ── OPTIONS DEFINITION ──────────────────────────────────────────────────────
export const SKIN_TONES = [
  { name: "Light Cream", value: "#FCEBE3" },
  { name: "Warm Beige", value: "#F5D6C6" },
  { name: "Tan Peach", value: "#E5B299" },
  { name: "Honey Brown", value: "#A97E63" },
  { name: "Rich Espresso", value: "#704D38" },
];

export const HAIR_STYLES = [
  { name: "Classic Bob", value: "bob" },
  { name: "Short Crop", value: "short-crop" },
  { name: "Side Part", value: "side-part" },
  { name: "Long Waves", value: "long" },
  { name: "Cozy Bun", value: "bun" },
  { name: "Curly Afro", value: "afro" },
  { name: "Clean Bald", value: "bald" },
];

export const HAIR_COLORS = [
  { name: "Espresso Black", value: "#2E251E" },
  { name: "Warm Brown", value: "#6E5A44" },
  { name: "Dusty Brown", value: "#8C7355" },
  { name: "Honey Blonde", value: "#D9C3A0" },
  { name: "Auburn Red", value: "#A8636E" },
  { name: "Soft Grey", value: "#A39E98" },
];

export const EYE_STYLES = [
  { name: "Cozy Chibi", value: "chibi" },
  { name: "Simple Dot", value: "dot" },
  { name: "Playful Wink", value: "wink" },
  { name: "Sleepy Arc", value: "sleepy" },
];

export const GLASSES_OPTIONS = [
  { name: "No Glasses", value: "none" },
  { name: "Round Spectacles", value: "round" },
  { name: "Square Frames", value: "square" },
];

export const BEARD_OPTIONS = [
  { name: "No Beard", value: "none" },
  { name: "Soft Stubble", value: "stubble" },
  { name: "Full Cozy Beard", value: "full" },
];

export const ACCESSORIES_OPTIONS = [
  { name: "No Accessory", value: "none" },
  { name: "Cozy Beanie", value: "beanie" },
  { name: "Red Bow", value: "bow" },
  { name: "Little Heart Clip", value: "heart" },
];

export const SWEATER_COLORS = [
  { name: "Blush Pink", value: "#E0B8B8" },
  { name: "Sage Green", value: "#A8BDB2" },
  { name: "Soft Lavender", value: "#D2C4D8" },
  { name: "Gold Ochre", value: "#C8A882" },
  { name: "Terracotta Coral", value: "#CD8D8D" },
  { name: "Warm Charcoal", value: "#4A4D53" },
];

export const SHIRT_COLORS = [
  { name: "Paper White", value: "#FFFDF8" },
  { name: "Soft Charcoal", value: "#3A3E45" },
  { name: "Mustard Gold", value: "#E5C387" },
];

interface ChibiAvatarProps extends React.SVGProps<SVGSVGElement> {
  config: AvatarConfig;
  pose?: "standing" | "writing" | "drinking-coffee" | "profile" | "hugging";
  noBackground?: boolean;
}

export function ChibiAvatar({ config, pose = "standing", className = "w-24 h-24", noBackground = false, ...props }: ChibiAvatarProps) {
  const { skin, hairStyle, hairColor, eyeStyle, glasses, beard, accessories, sweater, shirt } = config;

  // Render back hair underlay if long hair
  const renderBackHair = () => {
    if (hairStyle === "long") {
      return <path d="M 85 110 C 80 180, 195 180, 195 110 Z" fill={hairColor} />;
    }
    if (hairStyle === "bun") {
      return <circle cx="140" cy="52" r="16" fill={hairColor} />;
    }
    return null;
  };

  // Render front hair overlay
  const renderFrontHair = () => {
    switch (hairStyle) {
      case "bob":
        return <path d="M 86 110 C 86 50, 194 50, 194 110 C 194 100, 178 80, 165 92 C 150 102, 130 102, 115 92 C 102 80, 86 100, 86 110 Z" fill={hairColor} />;
      case "short-crop":
        return <path d="M 90 100 C 90 55, 190 55, 190 100 C 190 92, 172 82, 155 88 C 135 94, 115 84, 90 100 Z" fill={hairColor} />;
      case "side-part":
        return <path d="M 88 105 C 88 52, 192 52, 192 105 C 192 90, 155 74, 140 92 C 120 74, 88 90, 88 105 Z" fill={hairColor} />;
      case "long":
        return <path d="M 86 110 C 86 50, 194 50, 194 110 C 194 95, 175 80, 140 90 C 105 80, 86 95, 86 110 Z" fill={hairColor} />;
      case "bun":
        return <path d="M 88 110 C 88 55, 192 55, 192 110 C 192 100, 175 85, 140 92 C 105 85, 88 100, 88 110 Z" fill={hairColor} />;
      case "afro":
        return (
          <g fill={hairColor}>
            <circle cx="140" cy="100" r="50" />
            <circle cx="105" cy="85" r="22" />
            <circle cx="175" cy="85" r="22" />
            <circle cx="100" cy="115" r="22" />
            <circle cx="180" cy="115" r="22" />
          </g>
        );
      case "bald":
      default:
        return null;
    }
  };

  // Render eyes
  const renderEyes = () => {
    switch (eyeStyle) {
      case "chibi":
        return (
          <g>
            {/* Left Eye */}
            <circle cx="118" cy="110" r="10" fill="#FFF" />
            <circle cx="118" cy="110" r="7" fill="#4A3B32" />
            <circle cx="116" cy="108" r="2.5" fill="#FFF" />
            <circle cx="120" cy="112" r="1" fill="#FFF" />
            
            {/* Right Eye */}
            <circle cx="162" cy="110" r="10" fill="#FFF" />
            <circle cx="162" cy="110" r="7" fill="#4A3B32" />
            <circle cx="160" cy="108" r="2.5" fill="#FFF" />
            <circle cx="164" cy="112" r="1" fill="#FFF" />
          </g>
        );
      case "wink":
        return (
          <g>
            {/* Left eye: wink */}
            <path d="M 110 110 Q 118 118 126 110" stroke="#3D3028" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Right eye: open dot */}
            <circle cx="162" cy="110" r="4.5" fill="#3D3028" />
          </g>
        );
      case "sleepy":
        return (
          <g>
            <path d="M 110 110 Q 118 102 126 110" stroke="#3D3028" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 154 110 Q 162 102 170 110" stroke="#3D3028" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      case "dot":
      default:
        return (
          <g fill="#3D3028">
            <circle cx="118" cy="110" r="4.5" />
            <circle cx="162" cy="110" r="4.5" />
          </g>
        );
    }
  };

  // Render glasses
  const renderGlasses = () => {
    if (glasses === "round") {
      return (
        <g stroke="#3A3E45" strokeWidth="2.5" fill="none">
          <circle cx="118" cy="110" r="14" />
          <circle cx="162" cy="110" r="14" />
          <line x1="132" y1="110" x2="148" y2="110" />
        </g>
      );
    }
    if (glasses === "square") {
      return (
        <g stroke="#3A3E45" strokeWidth="2.5" fill="none">
          <rect x="103" y="96" width="30" height="26" rx="3" />
          <rect x="147" y="96" width="30" height="26" rx="3" />
          <line x1="133" y1="109" x2="147" y2="109" />
        </g>
      );
    }
    return null;
  };

  // Render beard
  const renderBeard = () => {
    if (beard === "stubble") {
      return (
        <path d="M 100 120 C 100 148, 180 148, 180 120" stroke="#8C7D73" strokeWidth="4.5" strokeDasharray="2 3" fill="none" strokeLinecap="round" />
      );
    }
    if (beard === "full") {
      return (
        <path d="M 94 116 C 94 165, 186 165, 186 116 C 186 135, 170 152, 140 152 C 110 152, 94 135, 94 116 Z" fill={hairColor} />
      );
    }
    return null;
  };

  // Render accessory overlays
  const renderAccessories = () => {
    if (accessories === "beanie") {
      return (
        <g>
          <path d="M 88 85 C 88 40, 192 40, 192 85 Z" fill={sweater} />
          {/* Beanie brim */}
          <path d="M 84 85 Q 140 78 196 85" stroke={sweater} strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* Beanie pom pom */}
          <circle cx="140" cy="38" r="10" fill={shirt} />
        </g>
      );
    }
    if (accessories === "bow") {
      return (
        <path d="M 160 55 Q 170 45 180 55 Q 190 45 200 55 L 180 65 Z" fill="#D95B6A" />
      );
    }
    if (accessories === "heart") {
      return (
        <path d="M 168 76 C 164 70, 158 75, 168 83 C 178 75, 172 70, 168 76 Z" fill="#EFAFAF" />
      );
    }
    return null;
  };

  // Render the body based on poses
  const renderBody = () => {
    switch (pose) {
      case "profile":
        // Zoomed in version, shoulders barely visible at bottom
        return (
          <g>
            <path d="M 85 220 Q 140 200 195 220" stroke={sweater} strokeWidth="32" fill="none" strokeLinecap="round" />
            <path d="M 115 210 Q 140 216 165 210" stroke={shirt} strokeWidth="6" fill="none" />
          </g>
        );
      case "writing":
        // Bent down writing sweater shoulders
        return (
          <g>
            <path d="M 82 150 C 95 140, 185 140, 198 150 L 175 225 L 105 225 Z" fill={sweater} />
            <path d="M 110 152 C 120 156, 160 156, 170 152" stroke={shirt} strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Hand with pen */}
            <circle cx="165" cy="180" r="10" fill={skin} />
            <line x1="165" y1="180" x2="182" y2="162" stroke="#5C4D3C" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        );
      case "drinking-coffee":
        // Standard shoulders + hand holding coffee mug
        return (
          <g>
            <rect x="105" y="150" width="70" height="90" rx="20" fill={sweater} />
            <path d="M 125 150 Q 140 156 155 150" stroke={shirt} strokeWidth="6" fill="none" />
            {/* Coffee mug */}
            <rect x="125" y="180" width="22" height="26" rx="3.5" fill="#FAF6EE" stroke="#A88B73" strokeWidth="1.5" />
            <path d="M 147 186 Q 153 186 153 193 Q 153 200 147 200" stroke="#A88B73" strokeWidth="1.5" fill="none" />
            <circle cx="122" cy="193" r="8" fill={skin} /> {/* Hand holding cup */}
          </g>
        );
      case "hugging":
        // Tilted shoulders, arm overlay wrapping
        return (
          <g>
            <rect x="105" y="150" width="70" height="90" rx="20" fill={sweater} />
            <path d="M 125 150 Q 140 156 155 150" stroke={shirt} strokeWidth="6" fill="none" />
            {/* Wrapping arm shape */}
            <path d="M 98 175 Q 120 200 145 190" stroke={sweater} strokeWidth="14" fill="none" strokeLinecap="round" />
            <circle cx="145" cy="190" r="7" fill={skin} />
          </g>
        );
      case "standing":
      default:
        // Standard cozy sweater capsule shape
        return (
          <g>
            <rect x="105" y="150" width="70" height="90" rx="20" fill={sweater} />
            <path d="M 125 150 Q 140 156 155 150" stroke={shirt} strokeWidth="6" fill="none" />
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 280 280" className={className} {...props}>
      {/* Background soft lighting shadow */}
      {!noBackground && (
        <circle cx="140" cy="140" r="105" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2.5" />
      )}
      
      {/* Back Hair underlay */}
      {renderBackHair()}

      {/* Body / Sweater base */}
      {renderBody()}

      {/* Head base */}
      <circle cx="140" cy="112" r="44" fill={skin} />

      {/* Cheeks blush */}
      <circle cx="110" cy="120" r="7.5" fill="#F49EA8" opacity="0.45" />
      <circle cx="170" cy="120" r="7.5" fill="#F49EA8" opacity="0.45" />

      {/* Eyes layer */}
      {renderEyes()}

      {/* Beard layer */}
      {renderBeard()}

      {/* Nose */}
      <circle cx="140" cy="116" r="2.5" fill="#F49EA8" opacity="0.75" />

      {/* Smile */}
      <path d="M 134 122 Q 140 126 146 122" stroke="#3D3028" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Glasses layer */}
      {renderGlasses()}

      {/* Front Hair overlay */}
      {renderFrontHair()}

      {/* Accessories overlay */}
      {renderAccessories()}
    </svg>
  );
}
