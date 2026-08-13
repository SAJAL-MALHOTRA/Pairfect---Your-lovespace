import { SEOPage } from '@/lib/seo/types';

export const page: SEOPage = {
  slug: 'glossary/relationship-check-in',
  playbook: 'glossary',
  seo: {
    title: 'What is a Relationship Check-In? | Pairfect Glossary',
    metaDescription: 'Discover what a relationship check-in is. Learn why regular emotional and logistical check-ins are vital for a healthy, communicative partnership.',
    canonicalUrl: 'https://www.pairfect.site/glossary/relationship-check-in',
    primaryKeyword: 'relationship check-in',
    secondaryKeywords: ['couples check in', 'relationship meeting', 'emotional check in'],
    searchIntent: 'informational',
    ogTitle: 'What is a Relationship Check-In? | Pairfect',
    ogDescription: 'Discover what a relationship check-in is. Learn why regular emotional and logistical check-ins are vital for a healthy, communicative partnership.'
  },
  h1: 'Relationship Check-In',
  introduction: 'A relationship check-in is an intentional, structured conversation between partners designed to assess the health of the relationship, share feelings, and address any lingering issues. It is a proactive approach to communication, ensuring that both partners feel heard and valued before minor frustrations can escalate into major conflicts.',
  sections: [
    {
      heading: 'Why Regular Check-Ins Matter',
      body: 'Life gets busy, and couples can easily slip into "roommate mode," managing logistics rather than connecting emotionally. A dedicated relationship check-in forces a pause. It creates a safe, dedicated space to discuss what is going well and what needs improvement.\n\nThese check-ins foster transparency and emotional intimacy. They prove that you prioritize the relationship enough to dedicate time specifically to its maintenance, much like you would service a car to keep it running smoothly.'
    },
    {
      heading: 'Facilitating Check-Ins with Pairfect',
      body: 'A relationship check-in doesn\'t always have to be a formal sit-down meeting. You can facilitate daily, micro check-ins using technology.\n\nPairfect\'s **Mood Tracking** is an excellent tool for a quick daily check-in. By seeing your partner\'s logged mood, you have an immediate entry point to ask, "I saw you logged that you\'re feeling overwhelmed today; how can I help?" If you want to dive deeper or keep the conversation light, checking the **Between the Lines (AI Vibe Judge)** can offer a playful, objective look at how your communication has been flowing lately.'
    }
  ],
  faqs: [
    {
      question: 'How often should couples have a relationship check-in?',
      answer: 'It varies. Some couples prefer a brief daily check-in, while others thrive on a deeper, dedicated weekly or monthly meeting. Find what works for your schedule.'
    },
    {
      question: 'What topics should we cover during a check-in?',
      answer: 'Common topics include expressing appreciation, discussing any unresolved tensions, aligning on upcoming schedules, and checking in on each other\'s individual stress levels.'
    }
  ],
  callToAction: 'Make emotional check-ins a seamless part of your day. Use Pairfect\'s Mood Tracking to stay aligned with your partner.',
  internalLinks: [
    { url: '/conversation-starters-for-couples', anchorText: 'conversation starters for couples' },
    { url: '/glossary/mood-tracking', anchorText: 'mood tracking' },
    { url: '/couples-routines-and-traditions', anchorText: 'couples routines and traditions' }
  ],
  relatedPages: ['conversation-starters-for-couples', 'glossary/mood-tracking', 'couples-routines-and-traditions'],
  schemaType: 'DefinedTerm',
  indexable: true
};
