export interface StoryTopic {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const STORY_TOPICS: StoryTopic[] = [
  { id: "communication", label: "Communication", description: "We stopped talking / Not feeling heard", emoji: "🗣️" },
  { id: "long_distance", label: "Long Distance", description: "Miles between us / Closing the gap", emoji: "✈️" },
  { id: "trust", label: "Trust", description: "Rebuilding trust & vulnerability", emoji: "🛡️" },
  { id: "arguments", label: "Arguments", description: "Stopping the same recurring fight", emoji: "⚡" },
  { id: "feeling_disconnected", label: "Feeling Disconnected", description: "Together every day but feeling distant", emoji: "🌫️" },
  { id: "breakups", label: "Breakups & Reset", description: "Almost breaking up / Finding ourselves again", emoji: "❤️‍🩹" },
  { id: "moving_in", label: "Moving In Together", description: "Living together / Merging daily routines", emoji: "🏡" },
  { id: "money", label: "Money & Priorities", description: "Financial stress & different goals", emoji: "💳" },
  { id: "family", label: "Family & Boundaries", description: "In-laws & family expectations", emoji: "🪴" },
];

export interface ExploreStory {
  id: string;
  pair_id?: string;
  author_id?: string;
  author_display: string;
  is_anonymous: boolean;
  relationship_duration: string;
  title: string;
  problem_statement: string;
  quote_excerpt: string;
  what_happened: string;
  what_made_difficult: string;
  what_we_tried: string;
  where_are_we_now: string;
  what_to_tell_others: string;
  topic_tags: string[];
  helped_count: number;
  relate_count: number;
  perspective_count: number;
  going_through_count: number;
  created_at: string;
  story_status: "published" | "draft" | "archived";
  visibility: "community" | "private";
}

export const SEED_EXPLORE_STORIES: ExploreStory[] = [
  {
    id: "seed-1",
    author_display: "Anonymous Couple",
    is_anonymous: true,
    relationship_duration: "3 years together · Mumbai",
    title: "We stopped talking.",
    problem_statement: "We were together every day, but somehow we hadn't really talked in months.",
    quote_excerpt: "There wasn't one big fight. It was hundreds of tiny conversations we just stopped having.",
    what_happened: "We'd come home from work exhausted, scroll on our phones, ask 'how was your day?', say 'fine', and go to sleep. We became roommates living under the same roof.",
    what_made_difficult: "Neither of us wanted to admit we were lonely because we were sitting right next to each other.",
    what_we_tried: "We started a strict 'No Phone Sunday Morning' rule. We walked 45 minutes to a coffee shop without phones. At first it felt awkward, then the words started pouring out.",
    where_are_we_now: "We're still together. We're not perfect, but we actually talk again. We look forward to Sunday mornings all week.",
    what_to_tell_others: "Don't wait until the relationship feels broken to start fixing the silence. Don't confuse being comfortable with being connected.",
    topic_tags: ["communication", "feeling_disconnected"],
    helped_count: 2412,
    relate_count: 1840,
    perspective_count: 920,
    going_through_count: 1450,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    story_status: "published",
    visibility: "community",
  },
  {
    id: "seed-2",
    author_display: "M & A",
    is_anonymous: true,
    relationship_duration: "2 years LDR · Delhi & London",
    title: "8000 miles and the same argument every Friday night.",
    problem_statement: "Time zones were eating away at our trust and patience.",
    quote_excerpt: "Her day was starting when mine was ending. Every small delay in texting felt like abandonment.",
    what_happened: "We spent 18 months across 5.5 hours time zone difference. I'd wait up late till 2 AM just to get a 5-minute call while she was busy at work.",
    what_made_difficult: "The anxiety of not knowing what the other person was doing in their daily life created imaginary doubts.",
    what_we_tried: "Instead of constant fragmented WhatsApp texts, we switched to one 20-minute daily video call at 7:30 PM her time / 1:00 AM my time, plus sending short voice notes throughout the day.",
    where_are_we_now: "We closed the distance last month! She moved back to Mumbai and we look back at those LDR notes as our treasure.",
    what_to_tell_others: "Quality of communication over quantity. Constant low-effort texting creates LDR burnout; scheduled focused time creates connection.",
    topic_tags: ["long_distance", "communication", "trust"],
    helped_count: 1890,
    relate_count: 1420,
    perspective_count: 760,
    going_through_count: 1120,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    story_status: "published",
    visibility: "community",
  },
  {
    id: "seed-3",
    author_display: "Anonymous Couple",
    is_anonymous: true,
    relationship_duration: "4 years together · Bangalore",
    title: "Money wasn't our problem. The way we talked about it was.",
    problem_statement: "We couldn't stop having the exact same fight about spending every Sunday.",
    quote_excerpt: "One of us was a saver terrified of the future; the other was a spender wanting to enjoy the present.",
    what_happened: "Every time a credit card bill arrived or a vacation planning conversation started, it degenerated into accusations of 'you don't care about our future' vs 'you're suffocating us'.",
    what_made_difficult: "We brought our parents' financial traumas into our relationship without realizing it.",
    what_we_tried: "We created three separate buckets: Mine, Yours, and Ours. We automated fixed contributions to joint savings and rent, and left 'Mine' and 'Yours' completely unmonitored with zero guilt.",
    where_are_we_now: "Zero fights about money in 14 months. We even saved enough for our first joint international trip.",
    what_to_tell_others: "Money talks are actually security talks in disguise. Understand what money represents to your partner before arguing about numbers.",
    topic_tags: ["money", "arguments", "moving_in"],
    helped_count: 3120,
    relate_count: 2150,
    perspective_count: 1340,
    going_through_count: 1890,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    story_status: "published",
    visibility: "community",
  },
  {
    id: "seed-4",
    author_display: "Anonymous Couple",
    is_anonymous: true,
    relationship_duration: "5 years together · Pune",
    title: "We almost broke up after moving in together.",
    problem_statement: "The shock of merging daily domestic habits almost ruined 4 years of love.",
    quote_excerpt: "It's easy to love someone for 4 hours on a date. It's harder when they leave wet towels on the bed for the 10th time.",
    what_happened: "Moving in together turned micro-annoyances into constant resentments. We went from romantic lovers to naggy housemates in 3 months.",
    what_made_difficult: "We felt guilty for feeling frustrated because 'we were supposed to be happy finally living together'.",
    what_we_tried: "We made an explicit 'Chore Ownership Contract' instead of assuming tasks. We also agreed to keep one room/space in the house as a quiet individual sanctuary.",
    where_are_we_now: "Happily living together for 2 years now. We laugh at our initial towel fights.",
    what_to_tell_others: "Love is romantic, but living together is logistical. Don't let unsaid domestic expectations erode emotional tenderness.",
    topic_tags: ["moving_in", "arguments", "feeling_disconnected"],
    helped_count: 2780,
    relate_count: 1980,
    perspective_count: 1100,
    going_through_count: 1640,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    story_status: "published",
    visibility: "community",
  },
  {
    id: "seed-5",
    author_display: "R & K",
    is_anonymous: true,
    relationship_duration: "2 years together · Chandigarh",
    title: "How we rebuilt trust after a breach of honesty.",
    problem_statement: "A hidden friendship almost broke us completely.",
    quote_excerpt: "Forgiveness wasn't a single decision. It was a commitment we had to make every single day for 6 months.",
    what_happened: "He hid a text exchange with an ex for 4 months 'to avoid drama'. When I found out, the lie hurt 100x more than the texts themselves.",
    what_made_difficult: "Hyper-vigilance. I found myself checking his phone, questioning every delay, feeling sick with suspicion.",
    what_we_tried: "Complete radical transparency. He willingly shared his whereabouts without me asking, answered all uncomfortable questions patiently, and we attended couples counseling.",
    where_are_we_now: "Trust is back, stronger than before because it's built on proven transparency rather than blind assumption.",
    what_to_tell_others: "The person who broke the trust must lead the effort to rebuild it. Patience and radical honesty are non-negotiable.",
    topic_tags: ["trust", "communication", "breakups"],
    helped_count: 1950,
    relate_count: 1310,
    perspective_count: 880,
    going_through_count: 950,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    story_status: "published",
    visibility: "community",
  },
];

/**
 * Calculate multi-factor relevance score for Explore ranking.
 * Prevents pure popularity algorithm traps.
 */
export function calculateRelevanceScore(
  story: ExploreStory,
  activeTopic: string,
  targetStoryId?: string
): number {
  let score = 0;

  // 1. Topic Match (High weight)
  if (activeTopic === "all" || story.topic_tags.includes(activeTopic)) {
    score += 50;
  }

  // 2. Target story similarity match
  if (targetStoryId && story.id !== targetStoryId) {
    const targetStory = SEED_EXPLORE_STORIES.find((s) => s.id === targetStoryId);
    if (targetStory) {
      const sharedTags = story.topic_tags.filter((tag) => targetStory.topic_tags.includes(tag));
      score += sharedTags.length * 30;
    }
  }

  // 3. Meaningful signals ("This helped me" + "I'm going through this")
  score += Math.min(story.helped_count * 0.01, 20);
  score += Math.min(story.going_through_count * 0.015, 25);

  // 4. Freshness boost
  const daysOld = (Date.now() - new Date(story.created_at).getTime()) / (86400000);
  if (daysOld < 7) score += 15;
  else if (daysOld < 30) score += 8;

  return score;
}
