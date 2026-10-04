/**
 * Botanical Floral Arrangement Engine.
 * Powered by high-resolution botanical illustrations from Digibouquet.
 */

export interface FlowerType {
  id: string;
  name: string;
  symbolism: string;
  meaning: string;
  image: string;
  monoImage: string;
  primaryColor: string;
  accentColor: string;
  description: string;
}

export interface GreeneryType {
  id: string;
  name: string;
  description: string;
  baseImage: string;
  topImage: string;
  monoBaseImage: string;
  monoTopImage: string;
}

export interface WrappingStyle {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  bgGradient: string;
  borderColor: string;
  shadowColor: string;
  textColor: string;
  isVase?: boolean;
}

export interface RibbonStyle {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  knotStyle: string;
}

export interface AtmosphereEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface OccasionStarter {
  id: string;
  occasion: string;
  title: string;
  recipientTag: string;
  defaultMessage: string;
}

export interface BouquetTemplate {
  id: string;
  name: string;
  emoji: string;
  flowers: string[];
  wrappingId: string;
}

export interface ArrangementPosition {
  flowerId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

export interface DigitalBouquet {
  id: string;
  flowers: string[];
  wrapping: string;
  ribbon: string;
  greenery: string;
  atmosphere: string;
  toName: string;
  fromName: string;
  message: string;
  createdAt: number;
}

// 12 Authentic Botanical Flower Varieties
export const BOTANICAL_FLOWERS: Record<string, FlowerType> = {
  rose: {
    id: "rose",
    name: "Rose",
    symbolism: "Passion & True Love",
    meaning: "Passion and true love",
    image: "/bouquet/color/flowers/rose.png",
    monoImage: "/bouquet/mono/flowers/rose.png",
    primaryColor: "#E11D48",
    accentColor: "#BE123C",
    description: "Deep velvety crimson petals radiating romance and lifelong devotion",
  },
  peony: {
    id: "peony",
    name: "Peony",
    symbolism: "Romance & Prosperity",
    meaning: "Romance and prosperity",
    image: "/bouquet/color/flowers/peony.png",
    monoImage: "/bouquet/mono/flowers/peony.png",
    primaryColor: "#FB7185",
    accentColor: "#F43F5E",
    description: "Lush layered blush ruffles evoking gentle affection and happiness",
  },
  tulip: {
    id: "tulip",
    name: "Tulip",
    symbolism: "Perfect Deep Love",
    meaning: "Perfect deep love",
    image: "/bouquet/color/flowers/tulip.png",
    monoImage: "/bouquet/mono/flowers/tulip.png",
    primaryColor: "#FBBF24",
    accentColor: "#F59E0B",
    description: "Graceful sculpted bloom expressing unconditional warmth",
  },
  daisy: {
    id: "daisy",
    name: "Daisy",
    symbolism: "Innocence & Pure Joy",
    meaning: "Innocence and purity",
    image: "/bouquet/color/flowers/daisy.png",
    monoImage: "/bouquet/mono/flowers/daisy.png",
    primaryColor: "#FFFFFF",
    accentColor: "#FCD34D",
    description: "Crisp radiating petals with sunny golden heart celebrating cheerful love",
  },
  lily: {
    id: "lily",
    name: "Lily",
    symbolism: "Pure Love & Devotion",
    meaning: "Pure love and devotion",
    image: "/bouquet/color/flowers/lily.png",
    monoImage: "/bouquet/mono/flowers/lily.png",
    primaryColor: "#F8FAFC",
    accentColor: "#CBD5E1",
    description: "Majestic alabaster blossom carrying elegance and peaceful presence",
  },
  sunflower: {
    id: "sunflower",
    name: "Sunflower",
    symbolism: "Adoration & Loyalty",
    meaning: "Adoration and loyalty",
    image: "/bouquet/color/flowers/sunflower.png",
    monoImage: "/bouquet/mono/flowers/sunflower.png",
    primaryColor: "#F59E0B",
    accentColor: "#78350F",
    description: "Bright golden ray florets bringing sunshine and unwavering faith",
  },
  orchid: {
    id: "orchid",
    name: "Orchid",
    symbolism: "Refinement & Rare Beauty",
    meaning: "Refinement and rare beauty",
    image: "/bouquet/color/flowers/orchid.png",
    monoImage: "/bouquet/mono/flowers/orchid.png",
    primaryColor: "#C084FC",
    accentColor: "#9333EA",
    description: "Exotic delicate petals capturing precious unique admiration",
  },
  carnation: {
    id: "carnation",
    name: "Carnation",
    symbolism: "Fascination & Love",
    meaning: "Fascination and love",
    image: "/bouquet/color/flowers/carnation.png",
    monoImage: "/bouquet/mono/flowers/carnation.png",
    primaryColor: "#FB7185",
    accentColor: "#E11D48",
    description: "Soft ruffled lace petals symbolising tender fascination",
  },
  dahlia: {
    id: "dahlia",
    name: "Dahlia",
    symbolism: "Elegance & Inner Strength",
    meaning: "Elegance and inner strength",
    image: "/bouquet/color/flowers/dahlia.png",
    monoImage: "/bouquet/mono/flowers/dahlia.png",
    primaryColor: "#BE185D",
    accentColor: "#831843",
    description: "Geometric concentric layers expressing dignity and grace",
  },
  ranunculus: {
    id: "ranunculus",
    name: "Ranunculus",
    symbolism: "Charm & Radiant Attraction",
    meaning: "Charm and attractiveness",
    image: "/bouquet/color/flowers/ranunculus.png",
    monoImage: "/bouquet/mono/flowers/ranunculus.png",
    primaryColor: "#F472B6",
    accentColor: "#BE185D",
    description: "Tissue-thin swirl petals radiating charming elegance",
  },
  anemone: {
    id: "anemone",
    name: "Anemone",
    symbolism: "Anticipation & Excitement",
    meaning: "Anticipation and excitement",
    image: "/bouquet/color/flowers/anemone.png",
    monoImage: "/bouquet/mono/flowers/anemone.png",
    primaryColor: "#9333EA",
    accentColor: "#18181B",
    description: "Velvety petals with dramatic midnight core anticipating sweet moments",
  },
  zinnia: {
    id: "zinnia",
    name: "Zinnia",
    symbolism: "Lasting Affection & Endurance",
    meaning: "Endurance and lasting affection",
    image: "/bouquet/color/flowers/zinnia.png",
    monoImage: "/bouquet/mono/flowers/zinnia.png",
    primaryColor: "#EA580C",
    accentColor: "#C2410C",
    description: "Bold vibrant petals celebrating timeless bond across time and distance",
  },

  // Graceful fallbacks for legacy flower IDs
  poppy: {
    id: "poppy",
    name: "Scarlet Anemone",
    symbolism: "Sweet Remembrance",
    meaning: "Anticipation and excitement",
    image: "/bouquet/color/flowers/anemone.png",
    monoImage: "/bouquet/mono/flowers/anemone.png",
    primaryColor: "#EA580C",
    accentColor: "#C2410C",
    description: "Delicate papery crimson bloom with midnight core",
  },
  lavender: {
    id: "lavender",
    name: "Violet Dahlia",
    symbolism: "Serenity & Calm Devotion",
    meaning: "Elegance and inner strength",
    image: "/bouquet/color/flowers/dahlia.png",
    monoImage: "/bouquet/mono/flowers/dahlia.png",
    primaryColor: "#A855F7",
    accentColor: "#7E22CE",
    description: "Layered purple petals radiating calming comfort",
  },
  camellia: {
    id: "camellia",
    name: "Blush Carnation",
    symbolism: "Longing & Adoration",
    meaning: "Fascination and love",
    image: "/bouquet/color/flowers/carnation.png",
    monoImage: "/bouquet/mono/flowers/carnation.png",
    primaryColor: "#FDA4AF",
    accentColor: "#FB7185",
    description: "Silk blush petals expressing tender adoration",
  },
  lotus: {
    id: "lotus",
    name: "Water Lily",
    symbolism: "Pure Soul Connection",
    meaning: "Pure love and devotion",
    image: "/bouquet/color/flowers/lily.png",
    monoImage: "/bouquet/mono/flowers/lily.png",
    primaryColor: "#F472B6",
    accentColor: "#DB2777",
    description: "Gentle unfolding petals with serene harmony",
  },
  baby_breath: {
    id: "baby_breath",
    name: "Ranunculus Cloud",
    symbolism: "Everlasting Romance",
    meaning: "Charm and attractiveness",
    image: "/bouquet/color/flowers/ranunculus.png",
    monoImage: "/bouquet/mono/flowers/ranunculus.png",
    primaryColor: "#F1F5F9",
    accentColor: "#94A3B8",
    description: "Delicate layered bloom adding airy elegance",
  },
};

// 12 primary flowers for picking
export const FLOWER_LIST = [
  BOTANICAL_FLOWERS.rose,
  BOTANICAL_FLOWERS.peony,
  BOTANICAL_FLOWERS.tulip,
  BOTANICAL_FLOWERS.daisy,
  BOTANICAL_FLOWERS.lily,
  BOTANICAL_FLOWERS.sunflower,
  BOTANICAL_FLOWERS.orchid,
  BOTANICAL_FLOWERS.carnation,
  BOTANICAL_FLOWERS.dahlia,
  BOTANICAL_FLOWERS.ranunculus,
  BOTANICAL_FLOWERS.anemone,
  BOTANICAL_FLOWERS.zinnia,
];

export function getFlowerById(id: string): FlowerType {
  const norm = (id || "rose").toLowerCase().replace("-", "_");
  return BOTANICAL_FLOWERS[norm] || BOTANICAL_FLOWERS.rose;
}

// 3 Botanical Greenery Foliage Bush Varieties
export const GREENERY_OPTIONS: Record<string, GreeneryType> = {
  eucalyptus: {
    id: "eucalyptus",
    name: "Lush Eucalyptus Meadow",
    description: "Sage rounded leaves offering botanical balance",
    baseImage: "/bouquet/color/bush/bush-1.png",
    topImage: "/bouquet/color/bush/bush-1-top.png",
    monoBaseImage: "/bouquet/mono/bush/bush-2.png",
    monoTopImage: "/bouquet/mono/bush/bush-2-top.png",
  },
  fern: {
    id: "fern",
    name: "Forest Fern Grove",
    description: "Deep emerald arching fronds with rich texture",
    baseImage: "/bouquet/color/bush/bush-2.png",
    topImage: "/bouquet/color/bush/bush-2-top.png",
    monoBaseImage: "/bouquet/mono/bush/bush-2.png",
    monoTopImage: "/bouquet/mono/bush/bush-2-top.png",
  },
  sprigs: {
    id: "sprigs",
    name: "Wild Botanical Sprigs",
    description: "Airy herbal branches giving an organic garden touch",
    baseImage: "/bouquet/color/bush/bush-3.png",
    topImage: "/bouquet/color/bush/bush-3-top.png",
    monoBaseImage: "/bouquet/mono/bush/bush-2.png",
    monoTopImage: "/bouquet/mono/bush/bush-2-top.png",
  },
};

export const GREENERY_KEYS = ["eucalyptus", "fern", "sprigs"] as const;

export function getGreeneryData(idOrIndex: string | number, isMono = false) {
  let key: string;
  if (typeof idOrIndex === "number") {
    key = GREENERY_KEYS[Math.abs(idOrIndex) % GREENERY_KEYS.length];
  } else {
    key = idOrIndex && GREENERY_OPTIONS[idOrIndex] ? idOrIndex : "eucalyptus";
  }
  const option = GREENERY_OPTIONS[key] || GREENERY_OPTIONS.eucalyptus;

  return {
    base: isMono ? option.monoBaseImage : option.baseImage,
    top: isMono ? option.monoTopImage : option.topImage,
    key,
    name: option.name,
  };
}

// 7 Artisanal Wrapping Styles (wraps and vases)
export const WRAPPING_STYLES: Record<string, WrappingStyle> = {
  classic: {
    id: "classic",
    name: "Classic Cream",
    description: "Warm linen cream wrap with soft natural folds",
    cssClass: "wrap-classic",
    bgGradient: "linear-gradient(175deg, #FAF7EE 0%, #E6DFD1 100%)",
    borderColor: "#D2C5B0",
    shadowColor: "rgba(180, 160, 130, 0.25)",
    textColor: "#44392E",
  },
  rose: {
    id: "rose",
    name: "Blushing Rose",
    description: "Dusty petal pink wrap with romantic pastel sheen",
    cssClass: "wrap-rose",
    bgGradient: "linear-gradient(175deg, #FDECEF 0%, #DCB3B3 100%)",
    borderColor: "#CCA0A0",
    shadowColor: "rgba(220, 140, 150, 0.25)",
    textColor: "#5A252B",
  },
  sage: {
    id: "sage",
    name: "Sage Garden",
    description: "Calm organic herbal sage texture",
    cssClass: "wrap-sage",
    bgGradient: "linear-gradient(175deg, #EDF2E8 0%, #C1C8BA 100%)",
    borderColor: "#AAB3A2",
    shadowColor: "rgba(120, 150, 120, 0.22)",
    textColor: "#2B3A28",
  },
  slate: {
    id: "slate",
    name: "Midnight Slate",
    description: "Moody charcoal slate paper with gold contrast",
    cssClass: "wrap-slate",
    bgGradient: "linear-gradient(175deg, #4A5568 0%, #2D3748 100%)",
    borderColor: "#718096",
    shadowColor: "rgba(30, 41, 59, 0.35)",
    textColor: "#F7FAFC",
  },
  kraft: {
    id: "kraft",
    name: "Artisan Kraft",
    description: "Rustic earthy brown craft paper with handcrafted charm",
    cssClass: "wrap-kraft",
    bgGradient: "linear-gradient(175deg, #E6D3B3 0%, #CDB388 100%)",
    borderColor: "#A98E65",
    shadowColor: "rgba(110, 80, 45, 0.24)",
    textColor: "#3F2A14",
  },
  glass: {
    id: "glass",
    name: "Glass Vase",
    description: "Translucent crystal glass with soft water refraction",
    cssClass: "vase-glass",
    bgGradient: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "rgba(100, 120, 140, 0.2)",
    textColor: "#1E293B",
    isVase: true,
  },
  ceramic: {
    id: "ceramic",
    name: "Ceramic Pot",
    description: "Warm artisanal ceramic pot with glazed pottery rim",
    cssClass: "vase-ceramic",
    bgGradient: "linear-gradient(175deg, #F3ECE0 0%, #E0D5C1 100%)",
    borderColor: "#BFAFA0",
    shadowColor: "rgba(140, 120, 100, 0.25)",
    textColor: "#3E3024",
    isVase: true,
  },
};

export function getWrappingStyle(id?: string): WrappingStyle {
  if (!id) return WRAPPING_STYLES.classic;
  // Handle legacy naming like "wrap-classic", "wrap-rose", etc.
  const cleanId = id.replace("wrap-", "").replace("vase-", "");
  return WRAPPING_STYLES[cleanId] || WRAPPING_STYLES.classic;
}

// 5 Ribbon Ties
export const RIBBON_STYLES: Record<string, RibbonStyle> = {
  gold: {
    id: "gold",
    name: "Golden Twine",
    color: "#D97706",
    accentColor: "#F59E0B",
    knotStyle: "cord-tie",
  },
  rose: {
    id: "rose",
    name: "Dusty Rose",
    color: "#E11D48",
    accentColor: "#FB7185",
    knotStyle: "double-bow",
  },
  burgundy: {
    id: "burgundy",
    name: "Velvet Crimson",
    color: "#881337",
    accentColor: "#BE123C",
    knotStyle: "wide-ribbon",
  },
  forest: {
    id: "forest",
    name: "Forest Silk",
    color: "#166534",
    accentColor: "#22C55E",
    knotStyle: "double-bow",
  },
  ivory: {
    id: "ivory",
    name: "Pearl Chiffon",
    color: "#F8FAFC",
    accentColor: "#CBD5E1",
    knotStyle: "soft-tie",
  },
};

// 4 Atmosphere Effects
export const ATMOSPHERE_EFFECTS: Record<string, AtmosphereEffect> = {
  petals: {
    id: "petals",
    name: "Floating Petals",
    description: "Soft velvety petals drifting gently across the screen",
    icon: "🌸",
  },
  sparkles: {
    id: "sparkles",
    name: "Golden Stardust",
    description: "Twinkling golden fairy lights and gentle warm glows",
    icon: "✨",
  },
  hearts: {
    id: "hearts",
    name: "Tender Hearts",
    description: "Delicate blush floating hearts rising with affection",
    icon: "💖",
  },
  none: {
    id: "none",
    name: "Calm Studio",
    description: "Clean still presentation with natural soft lighting",
    icon: "🌿",
  },
};

// Curated Bouquet Templates
export const BOUQUET_TEMPLATES: BouquetTemplate[] = [
  {
    id: "anniversary",
    name: "Anniversary Love",
    emoji: "💕",
    flowers: ["rose", "rose", "peony", "tulip", "tulip", "carnation"],
    wrappingId: "rose",
  },
  {
    id: "birthday",
    name: "Golden Birthday",
    emoji: "🎂",
    flowers: ["sunflower", "sunflower", "daisy", "dahlia", "zinnia", "tulip"],
    wrappingId: "sage",
  },
  {
    id: "thinking",
    name: "Thinking of You",
    emoji: "💭",
    flowers: ["orchid", "ranunculus", "anemone", "peony", "carnation", "daisy"],
    wrappingId: "classic",
  },
  {
    id: "gratitude",
    name: "Pure Gratitude",
    emoji: "🕊️",
    flowers: ["lily", "lily", "daisy", "carnation", "rose", "anemone"],
    wrappingId: "slate",
  },
];

// Occasion Starters for Personalized Letters
export const OCCASION_STARTERS: OccasionStarter[] = [
  {
    id: "anniversary",
    occasion: "Anniversary",
    title: "Another Year of Us",
    recipientTag: "To My Forever",
    defaultMessage:
      "Happy anniversary. I still think about that ordinary evening when we talked until we forgot about time. I love the life we keep building together: the quiet laughs, the familiar rituals, and the way you make home feel like a person.",
  },
  {
    id: "birthday",
    occasion: "Birthday",
    title: "The Brightest Day",
    recipientTag: "To the Birthday Star",
    defaultMessage:
      "Happy birthday. I keep thinking about how much you handled this year with patience, humor, and quiet courage. I hope the year ahead gives you more time for the things that make you feel alive, and plenty of ordinary days that turn out better than expected.",
  },
  {
    id: "distance",
    occasion: "Missing You",
    title: "Miles Cannot Dim Us",
    recipientTag: "Across the Distance",
    defaultMessage:
      "A handpicked bouquet to sit beside you today. Even with the miles between us, you are the first thought when I wake and the quiet comfort when the day settles down. Counting down the moments until these blooms can be real and in your hands.",
  },
  {
    id: "gratitude",
    occasion: "Thank You",
    title: "Grateful for You",
    recipientTag: "To Someone Special",
    defaultMessage:
      "Thank you for being my anchor when things felt heavy. Your patience, your smile, and your quiet reassurance turned an overwhelming week into something bearable. I noticed what you did, it mattered deeply, and I carry that warmth with me.",
  },
  {
    id: "just_because",
    occasion: "Just Because",
    title: "Thinking of You",
    recipientTag: "For My Favorite Person",
    defaultMessage:
      "No special reason today other than wanting to make you smile. You deserve flowers on random Tuesdays just as much as on anniversaries. Thank you for making everyday life so much sweeter simply by being in it.",
  },
  {
    id: "apology",
    occasion: "Gentle Apology",
    title: "From My Heart",
    recipientTag: "With Love & Care",
    defaultMessage:
      "I am truly sorry for how I spoke. You mean far too much to me for words to get in the way of our kindness. I want to listen, understand you better, and hold your hand through this. Let us take a breath together.",
  },
];

// Organic Golden-Angle Phyllotaxis Arrangement Engine
export function generateArrangement(
  flowerList: string[],
  seed = 0.5,
  canvasWidth = 460,
  canvasHeight = 540
): ArrangementPosition[] {
  let s = Math.floor(seed * 100000) || 12345;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const positions: ArrangementPosition[] = [];
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight * 0.38;

  const count = flowerList.length;

  flowerList.forEach((flowerId, i) => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = i * goldenAngle + rand() * 0.65;
    const t = i / Math.max(count - 1, 1);
    const radius = 24 + t * 105 + rand() * 32;

    const x = centerX + Math.cos(angle) * radius * 0.95 - 55;
    const y = centerY + Math.sin(angle) * radius * 0.72 - 55;
    const rotation = (rand() - 0.5) * 28;
    const scale = 0.76 + rand() * 0.32;
    const zIndex = 3 + Math.floor(rand() * 10);

    positions.push({
      flowerId,
      x: Math.max(canvasWidth * 0.05, Math.min(canvasWidth * 0.76, x)),
      y: Math.max(canvasHeight * 0.05, Math.min(canvasHeight * 0.58, y)),
      rotation,
      scale,
      zIndex,
    });
  });

  // Sort by Y so lower flowers naturally layer in front
  positions.sort((a, b) => a.y - b.y);
  return positions;
}
