export type WhisperMoodTag =
  | "romantic"
  | "sweet"
  | "sleepy"
  | "secret"
  | "missing-you"
  | "daily";

export interface WhisperNote {
  id: string;
  pair_id: string;
  sender_id: string;
  sender_name: string;
  frequency: number;
  title: string;
  audio_url: string;
  duration: number;
  mood_tag: WhisperMoodTag;
  listened_at: string | null;
  created_at: string;
}

export interface RadioStation {
  frequency: number;
  name: string;
  description: string;
  themeColor: string;
}

export const PRESET_STATIONS: RadioStation[] = [
  {
    frequency: 87.6,
    name: "Dawn & Morning Light",
    description: "Gentle wake up messages and first thoughts of the day.",
    themeColor: "#F59E0B",
  },
  {
    frequency: 89.2,
    name: "Afternoon Reverie",
    description: "Little reminders, midday laughs, and checking in.",
    themeColor: "#10B981",
  },
  {
    frequency: 91.7,
    name: "Our Secret Wave",
    description: "The primary station where your hearts tune in together.",
    themeColor: "#E8527D",
  },
  {
    frequency: 94.3,
    name: "Love Letters in the Air",
    description: "Long-form romantic audio letters and heartfelt confessions.",
    themeColor: "#8B5CF6",
  },
  {
    frequency: 98.1,
    name: "Midnight Whispers",
    description: "Soft bedtime murmurs, goodnights, and sleepy confessions.",
    themeColor: "#3B82F6",
  },
];

export const MIN_FREQUENCY = 87.6;
export const MAX_FREQUENCY = 98.1;
export const DEFAULT_FREQUENCY = 91.7;

export const MOOD_TAG_LABELS: Record<WhisperMoodTag, { label: string; icon: string; color: string }> = {
  romantic: { label: "Romantic", icon: "💖", color: "bg-rose-100 text-rose-700 border-rose-200" },
  sweet: { label: "Sweet", icon: "✨", color: "bg-amber-100 text-amber-700 border-amber-200" },
  sleepy: { label: "Sleepy Goodnight", icon: "🌙", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  secret: { label: "Secret For You", icon: "🗝️", color: "bg-purple-100 text-purple-700 border-purple-200" },
  "missing-you": { label: "Missing You", icon: "🕊️", color: "bg-pink-100 text-pink-700 border-pink-200" },
  daily: { label: "Daily Echo", icon: "💌", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};
