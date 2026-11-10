export interface MatchOption {
  id: string;
  text: string;
  emoji?: string;
}

export interface MatchQuestion {
  id: string;
  question: string;
  subtitle?: string;
  options: MatchOption[];
}

export const MATCH_QUESTIONS: MatchQuestion[] = [
  {
    id: "q1",
    question: "Ideal Friday night ritual?",
    subtitle: "When the work week ends and it's just the two of you",
    options: [
      { id: "a", text: "Midnight Drive with Music", emoji: "🌙" },
      { id: "b", text: "Cook Ramen & Eat in Bed", emoji: "🍜" },
      { id: "c", text: "Studio Ghibli Movie Marathon", emoji: "🍿" },
      { id: "d", text: "Stargazing & Deep Chats", emoji: "✨" },
    ],
  },
  {
    id: "q2",
    question: "Who would survive longer in a zombie apocalypse?",
    subtitle: "Be completely honest about survival instincts",
    options: [
      { id: "a", text: "Definitely Me (Tactical & Fast)", emoji: "🏃" },
      { id: "b", text: "100% My Partner (The Mastermind)", emoji: "🧠" },
      { id: "c", text: "We go down fighting together", emoji: "🤝" },
      { id: "d", text: "Neither: we'd be zombies in 10 mins", emoji: "🧟" },
    ],
  },
  {
    id: "q3",
    question: "What's our dream vacation style?",
    subtitle: "If tickets and budgets were unlimited",
    options: [
      { id: "a", text: "Cozy Mountain Cabin with a Fireplace", emoji: "🌲" },
      { id: "b", text: "Sunny Seaside Villa with Ocean Views", emoji: "🏖️" },
      { id: "c", text: "Vibrant Tokyo Street Food & Arcade Tour", emoji: "🏮" },
      { id: "d", text: "Secluded Countryside Cottage & Coffee", emoji: "🏡" },
    ],
  },
  {
    id: "q4",
    question: "What is our ultimate late-night comfort snack?",
    subtitle: "At 1:30 AM when hunger strikes",
    options: [
      { id: "a", text: "Spicy Midnight Noodles", emoji: "🍜" },
      { id: "b", text: "Fresh Warm Pizza Slices", emoji: "🍕" },
      { id: "c", text: "Sweet Ice Cream in Bed", emoji: "🍨" },
      { id: "d", text: "Crispy Street Tacos", emoji: "🌮" },
    ],
  },
  {
    id: "q5",
    question: "Who is more likely to spend money impulsively?",
    subtitle: "No judgment, just facts",
    options: [
      { id: "a", text: "Guilty! Definitely me", emoji: "🛍️" },
      { id: "b", text: "Without a doubt, my partner", emoji: "💸" },
      { id: "c", text: "We are equally reckless together", emoji: "🙈" },
      { id: "d", text: "Neither: we save every penny", emoji: "🏦" },
    ],
  },
  {
    id: "q6",
    question: "Ideal rainy afternoon together?",
    subtitle: "When the sky turns gray and rain taps the window",
    options: [
      { id: "a", text: "Blanket fort with nostalgic movies", emoji: "🎥" },
      { id: "b", text: "Reading side-by-side with hot tea", emoji: "☕" },
      { id: "c", text: "Baking warm cookies from scratch", emoji: "🍪" },
      { id: "d", text: "Napping to the sound of thunder", emoji: "🌧️" },
    ],
  },
  {
    id: "q7",
    question: "Who apologizes first after a silly argument?",
    subtitle: "When pride melts and you just miss each other",
    options: [
      { id: "a", text: "Usually me (I can't stay mad)", emoji: "🕊️" },
      { id: "b", text: "My partner (The bigger person)", emoji: "🤍" },
      { id: "c", text: "Whoever breaks into laughter first", emoji: "😅" },
      { id: "d", text: "We resolve it simultaneously", emoji: "🤝" },
    ],
  },
  {
    id: "q8",
    question: "If we won the lottery tomorrow, what's step one?",
    subtitle: "First impulse before anything else",
    options: [
      { id: "a", text: "Book first-class round-the-world tickets", emoji: "✈️" },
      { id: "b", text: "Buy our dream aesthetic home", emoji: "🏡" },
      { id: "c", text: "Save & invest quietly with zero flex", emoji: "🤫" },
      { id: "d", text: "Adopt three golden retrievers immediately", emoji: "🐾" },
    ],
  },
  {
    id: "q9",
    question: "Morning bird or Night owl?",
    subtitle: "When are you truly in your element?",
    options: [
      { id: "a", text: "Early bird catching sunrise & breakfast", emoji: "🌅" },
      { id: "b", text: "Night owl alive and glowing at 1 AM", emoji: "🦉" },
      { id: "c", text: "Strictly dependent on coffee dosage", emoji: "☕" },
      { id: "d", text: "Permanently sleepy in every timezone", emoji: "😴" },
    ],
  },
  {
    id: "q10",
    question: "Our relationship theme song genre?",
    subtitle: "The soundtrack to our favorite memories",
    options: [
      { id: "a", text: "Warm Indie Acoustic vibes", emoji: "🎸" },
      { id: "b", text: "Late-night Smooth R&B / Soul", emoji: "🎷" },
      { id: "c", text: "2000s Pop Throwback Nostalgia", emoji: "🎧" },
      { id: "d", text: "Lo-Fi Beats to cuddle & study to", emoji: "☕" },
    ],
  },
];

export function getMatchFeedback(percentage: number): {
  headline: string;
  message: string;
  emoji: string;
} {
  if (percentage === 100) {
    return {
      headline: "Soulmates on the exact same wavelength.",
      message: "Okay, you two are basically the same person. Not a single miss! 😭❤️",
      emoji: "💖",
    };
  }
  if (percentage >= 80) {
    return {
      headline: "Seriously in sync.",
      message: "You read each other like an open book. Your instincts match almost effortlessly ✨",
      emoji: "💕",
    };
  }
  if (percentage >= 50) {
    return {
      headline: "Harmonious balance.",
      message: "Pretty good! Just enough shared ground to connect, and enough variety to keep life exciting 🌸",
      emoji: "💫",
    };
  }
  if (percentage >= 25) {
    return {
      headline: "Opposites attract.",
      message: "You two see the world from different angles, which makes every day a new surprise 👀",
      emoji: "✨",
    };
  }
  return {
    headline: "A delightfully spicy match.",
    message: "Yeah... you might need to grab coffee and debrief on a few of these! ☕😂",
    emoji: "🔥",
  };
}
