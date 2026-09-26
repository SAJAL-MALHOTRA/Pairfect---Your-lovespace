export interface StoryTopic {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const STORY_TOPICS: StoryTopic[] = [
  { id: "communication", label: "Communication", description: "Not feeling heard or breaking silent habits", emoji: "🗣️" },
  { id: "long_distance", label: "Long Distance", description: "Navigating miles, time zones, and closing the gap", emoji: "✈️" },
  { id: "trust", label: "Trust", description: "Rebuilding transparency, honesty, and safety", emoji: "🛡️" },
  { id: "arguments", label: "Arguments", description: "Breaking recurring conflict patterns", emoji: "⚡" },
  { id: "feeling_disconnected", label: "Feeling Disconnected", description: "Living side-by-side yet feeling emotionally distant", emoji: "🌫️" },
  { id: "moving_in", label: "Moving In Together", description: "Merging domestic habits, chores, and space", emoji: "🏡" },
  { id: "money", label: "Money & Priorities", description: "Aligning on spending, savings, and future goals", emoji: "💳" },
  { id: "breakups", label: "Resets & Near-Breaks", description: "Navigating make-or-break crossroads together", emoji: "❤️‍🩹" },
  { id: "family", label: "Family & Boundaries", description: "Setting healthy boundaries with families and in-laws", emoji: "🪴" },
];

export interface WritingPrompt {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  defaultTag: string;
  starterQuestions: string;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "how_we_met",
    emoji: "☕",
    title: "How We Met",
    tagline: "The awkward, unexpected, or magical start.",
    defaultTag: "milestone",
    starterQuestions: "Where were you both? What was your very first impression before you spoke? What was the moment you realized this wasn't just another stranger?",
  },
  {
    id: "fight_growth",
    emoji: "⚡",
    title: "A Fight That Taught Us Something",
    tagline: "The argument that actually made you closer.",
    defaultTag: "fight",
    starterQuestions: "What were you arguing about on the surface? What were you actually scared of underneath? What did you each do that finally lowered your defenses?",
  },
  {
    id: "almost_gave_up",
    emoji: "🌧️",
    title: "A Moment We Almost Gave Up",
    tagline: "When it was genuinely hard, but you chose each other.",
    defaultTag: "turning_point",
    starterQuestions: "What was going on around that time? What gave you the clarity to try one more time? What changed after that day?",
  },
  {
    id: "first_trip",
    emoji: "🧳",
    title: "Our First Trip Together",
    tagline: "Delays, missed trains, and new memories.",
    defaultTag: "funny",
    starterQuestions: "Where did you go? What went completely wrong? What was the moment during the trip that made you laugh together?",
  },
  {
    id: "living_together",
    emoji: "🛋️",
    title: "Moving In & Daily Quirks",
    tagline: "The shift from dating to real shared daily life.",
    defaultTag: "habit",
    starterQuestions: "What surprised you most about their daily routine? Which household quirk drove you crazy at first? How did you settle into your rhythm?",
  },
  {
    id: "quiet_moment",
    emoji: "🕯️",
    title: "A Quiet Moment When I Knew",
    tagline: "No grand gestures — just quiet certainty.",
    defaultTag: "intimacy",
    starterQuestions: "What were you two doing? What did your partner say or do? Why did that simple moment stick in your memory so deeply?",
  },
];

export type MoodTag = "milestone" | "fight" | "funny" | "turning_point" | "habit" | "intimacy";

export const MOOD_TAGS: Record<MoodTag, { label: string; emoji: string; color: string; bg: string }> = {
  milestone: { label: "Milestone", emoji: "🏆", color: "#802030", bg: "#FFF0F4" },
  fight: { label: "Fight / Growth", emoji: "⚡", color: "#C05621", bg: "#FFFAF0" },
  funny: { label: "Funny", emoji: "😂", color: "#2B6CB0", bg: "#EBF8FF" },
  turning_point: { label: "Turning Point", emoji: "🌱", color: "#22543D", bg: "#F0FFF4" },
  habit: { label: "Daily Habit", emoji: "☕", color: "#744210", bg: "#FFFFF0" },
  intimacy: { label: "Intimacy", emoji: "💌", color: "#702459", bg: "#FFF5F7" },
};

export interface StoryChapter {
  id: string;
  couple_id: string;
  author_user_id: string;
  author_voice: "me" | "partner" | "joint";
  author_display?: string;
  title: string;
  body: string;
  mood_tag: MoodTag;
  what_helped?: string | null;
  photos: string[];
  chapter_date: string;
  is_shared_to_explore: boolean;
  explore_status?: "pending_review" | "live" | "rejected" | null;
  created_at: string;
  updated_at: string;
}

export interface ExploreStory {
  id: string;
  source_chapter_id?: string | null;
  author_user_id?: string | null;
  author_display?: string;
  relationship_duration: string;
  title: string;
  problem_statement?: string;
  body_anonymized: string;
  what_helped_anonymized?: string | null;
  situation_tags: string[];
  status: "pending_review" | "live" | "rejected";
  helpful_count_private?: number;
  created_at: string;
}

export const SEED_EXPLORE_STORIES: ExploreStory[] = [
  {
    id: "seed-1",
    author_display: "Anonymous Couple",
    relationship_duration: "3 years together",
    title: "We stopped talking.",
    problem_statement: "We were together every day, but somehow we hadn't really talked in months.",
    body_anonymized: "We would come home from work exhausted, scroll on our phones, ask 'how was your day?', say 'fine', and go to sleep. We became roommates living under the same roof. Neither of us wanted to admit we were lonely because we were sitting right next to each other.",
    what_helped_anonymized: "We started a strict 'No Phone Sunday Morning' rule. We walked 45 minutes to a coffee shop without phones. At first it felt awkward, then the words started pouring out. We're not perfect, but we actually talk again.",
    situation_tags: ["communication", "feeling_disconnected"],
    status: "live",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "seed-2",
    author_display: "Anonymous Couple",
    relationship_duration: "2 years long distance",
    title: "8000 miles and the same argument every Friday night.",
    problem_statement: "Time zones were eating away at our trust and patience.",
    body_anonymized: "Her day was starting when mine was ending. Every small delay in texting felt like abandonment. The anxiety of not knowing what the other person was doing in their daily life created imaginary doubts.",
    what_helped_anonymized: "Instead of constant fragmented WhatsApp texting, we switched to one 20-minute daily video call at a scheduled hour, plus sending short voice notes throughout the day. Quality of communication over constant low-effort texting.",
    situation_tags: ["long_distance", "communication", "trust"],
    status: "live",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: "seed-3",
    author_display: "Anonymous Couple",
    relationship_duration: "4 years together",
    title: "Money wasn't our problem. The way we talked about it was.",
    problem_statement: "We couldn't stop having the exact same fight about spending every Sunday.",
    body_anonymized: "One of us was a saver terrified of the future; the other was a spender wanting to enjoy the present. Every time a credit card bill arrived or a vacation conversation started, it degenerated into accusations of 'you don't care about our future' vs 'you're suffocating us'.",
    what_helped_anonymized: "We created three separate buckets: Mine, Yours, and Ours. We automated fixed contributions to joint savings and rent, and left 'Mine' and 'Yours' completely unmonitored with zero guilt.",
    situation_tags: ["money", "arguments", "moving_in"],
    status: "live",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "seed-4",
    author_display: "Anonymous Couple",
    relationship_duration: "5 years together",
    title: "We almost broke up after moving in together.",
    problem_statement: "The shock of merging daily domestic habits almost ruined 4 years of love.",
    body_anonymized: "Moving in together turned micro-annoyances into constant resentments. We went from romantic lovers to naggy housemates in 3 months. We felt guilty for feeling frustrated because 'we were supposed to be happy finally living together'.",
    what_helped_anonymized: "We made an explicit chore ownership agreement instead of assuming tasks. We also agreed to keep one room/space in the house as a quiet individual space.",
    situation_tags: ["moving_in", "arguments", "feeling_disconnected"],
    status: "live",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "seed-5",
    author_display: "Anonymous Couple",
    relationship_duration: "2 years together",
    title: "How we rebuilt trust after a breach of honesty.",
    problem_statement: "A hidden message exchange almost broke us completely.",
    body_anonymized: "He hid a text exchange with an ex for 4 months 'to avoid drama'. When I found out, the lie hurt 100x more than the texts themselves. I found myself checking his phone, questioning every delay, feeling sick with suspicion.",
    what_helped_anonymized: "Complete radical transparency. He willingly shared his schedule without me asking, answered all uncomfortable questions patiently, and we attended couples counseling. The person who broke trust must lead the effort to rebuild it.",
    situation_tags: ["trust", "communication", "breakups"],
    status: "live",
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];
