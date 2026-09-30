/**
 * BouquetNote Botanical Floral Arrangement Engine.
 * 
 * Provides 12 handcrafted botanical flower varieties, 4 greenery foliage types,
 * 7 artisanal wrapping styles, 5 ribbon ties, 4 atmosphere effects,
 * and curated romantic occasion message starters.
 */

export interface FlowerType {
  id: string;
  name: string;
  symbolism: string;
  primaryColor: string;
  accentColor: string;
  petalPath: string;
  description: string;
}

export interface GreeneryType {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface WrappingStyle {
  id: string;
  name: string;
  description: string;
  bgGradient: string;
  borderColor: string;
  shadowColor: string;
  lapelFill: string;
  texturePattern?: string;
  textColor: string;
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

export interface BouquetItemConfig {
  id: string;
  flowerId: string;
  scale?: number;
  rotation?: number;
}

export interface DigitalBouquet {
  id: string;
  flowers: string[]; // flower IDs (3 to 6 items)
  wrapping: string;
  ribbon: string;
  greenery: string;
  atmosphere: string;
  toName: string;
  fromName: string;
  message: string;
  cardStyle: string;
  createdAt: number;
}

// ── 12 Botanical Flower Varieties ──────────────────────────────────────────
export const BOTANICAL_FLOWERS: Record<string, FlowerType> = {
  rose: {
    id: "rose",
    name: "Classic Rose",
    symbolism: "Deep Love & Passion",
    primaryColor: "#E11D48",
    accentColor: "#BE123C",
    petalPath: "rose",
    description: "Velvety crimson petals wound in a romantic spiral",
  },
  peony: {
    id: "peony",
    name: "Blush Peony",
    symbolism: "Romance & Prosperity",
    primaryColor: "#FB7185",
    accentColor: "#F43F5E",
    petalPath: "peony",
    description: "Lush layered ruffles with golden sunburst stamens",
  },
  tulip: {
    id: "tulip",
    name: "Golden Tulip",
    symbolism: "Devoted Affection",
    primaryColor: "#FBBF24",
    accentColor: "#F59E0B",
    petalPath: "tulip",
    description: "Graceful cup blossom in warm honey and amber hues",
  },
  daisy: {
    id: "daisy",
    name: "Meadow Daisy",
    symbolism: "Innocence & Pure Joy",
    primaryColor: "#FFFFFF",
    accentColor: "#FCD34D",
    petalPath: "daisy",
    description: "Crisp white radiating petals with sunny yellow heart",
  },
  poppy: {
    id: "poppy",
    name: "Scarlet Poppy",
    symbolism: "Sweet Remembrance",
    primaryColor: "#EA580C",
    accentColor: "#C2410C",
    petalPath: "poppy",
    description: "Delicate papery crimson petals with midnight core",
  },
  lavender: {
    id: "lavender",
    name: "French Lavender",
    symbolism: "Serenity & Calm Devotion",
    primaryColor: "#A855F7",
    accentColor: "#7E22CE",
    petalPath: "lavender",
    description: "Clustered purple buds radiating calming fragrance",
  },
  lily: {
    id: "lily",
    name: "White Lily",
    symbolism: "Elegance & Purity",
    primaryColor: "#F8FAFC",
    accentColor: "#E2E8F0",
    petalPath: "lily",
    description: "Majestic alabaster trumpet with delicate star contours",
  },
  orchid: {
    id: "orchid",
    name: "Exotic Orchid",
    symbolism: "Refined Rare Beauty",
    primaryColor: "#C084FC",
    accentColor: "#9333EA",
    petalPath: "orchid",
    description: "Butterfly petals with vivid fuchsia labellum throat",
  },
  camellia: {
    id: "camellia",
    name: "Porcelain Camellia",
    symbolism: "Longing & Adoration",
    primaryColor: "#FDA4AF",
    accentColor: "#FB7185",
    petalPath: "camellia",
    description: "Geometric concentric spirals of vintage blush silk",
  },
  sunflower: {
    id: "sunflower",
    name: "Sunny Sunburst",
    symbolism: "Warmth & Eternal Loyalty",
    primaryColor: "#F59E0B",
    accentColor: "#78350F",
    petalPath: "sunflower",
    description: "Radiant golden ray petals surrounding rich cocoa disc",
  },
  lotus: {
    id: "lotus",
    name: "Zen Lotus",
    symbolism: "Pure Soul Connection",
    primaryColor: "#F472B6",
    accentColor: "#DB2777",
    petalPath: "lotus",
    description: "Gentle unfolding waterlily with sacred petal harmony",
  },
  baby_breath: {
    id: "baby_breath",
    name: "Baby's Breath",
    symbolism: "Everlasting Romance",
    primaryColor: "#F1F5F9",
    accentColor: "#94A3B8",
    petalPath: "baby_breath",
    description: "Delicate cloud of tiny white blossoms adding airy wonder",
  },
};

export const FLOWER_LIST = Object.values(BOTANICAL_FLOWERS);

// ── 4 Greenery Foliage Types ───────────────────────────────────────────────
export const GREENERY_OPTIONS: Record<string, GreeneryType> = {
  eucalyptus: {
    id: "eucalyptus",
    name: "Silver Dollar Eucalyptus",
    description: "Circular sage-blue leaves with aromatic rustic charm",
    color: "#4D7C5B",
  },
  fern: {
    id: "fern",
    name: "Feathered Emerald Fern",
    description: "Lush arching fronds with intricate leaf texture",
    color: "#2D6A4F",
  },
  olive: {
    id: "olive",
    name: "Tuscan Olive Sprigs",
    description: "Slender silvery Mediterranean leaves",
    color: "#588157",
  },
  ruscus: {
    id: "ruscus",
    name: "Italian Ruscus",
    description: "Glossy deep forest green oval foliage",
    color: "#1B4332",
  },
};

// ── 7 Artisanal Wrapping Styles ────────────────────────────────────────────
export const WRAPPING_STYLES: Record<string, WrappingStyle> = {
  kraft: {
    id: "kraft",
    name: "Artisan Kraft",
    description: "Natural earthy brown craft paper with rustic folds",
    bgGradient: "linear-gradient(145deg, #DECCA6 0%, #CDB388 100%)",
    borderColor: "#A98E65",
    shadowColor: "rgba(92, 70, 43, 0.22)",
    lapelFill: "#DFCEAA",
    textColor: "#422810",
  },
  blush: {
    id: "blush",
    name: "Silk Blush",
    description: "Soft romantic pink paper with gentle sheen",
    bgGradient: "linear-gradient(145deg, #FCE7EB 0%, #F8D3DA 100%)",
    borderColor: "#E59BA8",
    shadowColor: "rgba(180, 80, 105, 0.18)",
    lapelFill: "#FDEDF0",
    textColor: "#881337",
  },
  burgundy: {
    id: "burgundy",
    name: "Velvet Burgundy",
    description: "Deep cabernet paper with gold stitch edge",
    bgGradient: "linear-gradient(145deg, #4A1521 0%, #2A0911 100%)",
    borderColor: "#881337",
    shadowColor: "rgba(30, 5, 10, 0.35)",
    lapelFill: "#5B1B29",
    textColor: "#FFF1F2",
  },
  gazette: {
    id: "gazette",
    name: "Vintage Gazette",
    description: "Parisian antique newsprint with romantic script",
    bgGradient: "linear-gradient(145deg, #FAF4E6 0%, #ECE0CA 100%)",
    borderColor: "#B8A382",
    shadowColor: "rgba(80, 65, 45, 0.2)",
    lapelFill: "#FDFCFA",
    textColor: "#292524",
  },
  satin: {
    id: "satin",
    name: "Ivory Satin",
    description: "Lustrous cream bridal wrap with pearlescent tone",
    bgGradient: "linear-gradient(145deg, #FAF8F5 0%, #EFE9DE 100%)",
    borderColor: "#D6CCC0",
    shadowColor: "rgba(120, 110, 95, 0.15)",
    lapelFill: "#FFFFFF",
    textColor: "#44403C",
  },
  sage: {
    id: "sage",
    name: "Sage Linen",
    description: "Calm organic botanical herbal green texture",
    bgGradient: "linear-gradient(145deg, #E2EBDE 0%, #CAD8C3 100%)",
    borderColor: "#9BB392",
    shadowColor: "rgba(45, 75, 40, 0.18)",
    lapelFill: "#EDF3EA",
    textColor: "#14532D",
  },
  midnight: {
    id: "midnight",
    name: "Midnight Noir",
    description: "Moody celestial wrap with starlight glints",
    bgGradient: "linear-gradient(145deg, #181E2E 0%, #0F131D 100%)",
    borderColor: "#2D3748",
    shadowColor: "rgba(5, 8, 15, 0.4)",
    lapelFill: "#222B40",
    textColor: "#F1F5F9",
  },
};

// ── 5 Ribbon Ties ──────────────────────────────────────────────────────────
export const RIBBON_STYLES: Record<string, RibbonStyle> = {
  rose: {
    id: "rose",
    name: "Dusty Rose Satin",
    color: "#E11D48",
    accentColor: "#BE123C",
    knotStyle: "double-bow",
  },
  gold: {
    id: "gold",
    name: "Golden Twine",
    color: "#D97706",
    accentColor: "#B45309",
    knotStyle: "cord-tie",
  },
  burgundy: {
    id: "burgundy",
    name: "Velvet Crimson",
    color: "#881337",
    accentColor: "#4C0519",
    knotStyle: "wide-ribbon",
  },
  forest: {
    id: "forest",
    name: "Forest Silk",
    color: "#166534",
    accentColor: "#14532D",
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

// ── 4 Atmosphere Effects ───────────────────────────────────────────────────
export const ATMOSPHERE_EFFECTS: Record<string, AtmosphereEffect> = {
  petals: {
    id: "petals",
    name: "Floating Rose Petals",
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

// ── 6 Occasion Starters (with curated romantic templates) ───────────────────
export const OCCASION_STARTERS: OccasionStarter[] = [
  {
    id: "anniversary",
    occasion: "Anniversary",
    title: "Another Year of Us",
    recipientTag: "To My Forever",
    defaultMessage:
      "Happy anniversary. I still think about that ordinary evening when we talked until we forgot about time. I love the life we keep building together in those small hours: the quiet laughs, the familiar rituals, and the way you make home feel like a person.",
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
    title: "Miles Can't Dim Us",
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
