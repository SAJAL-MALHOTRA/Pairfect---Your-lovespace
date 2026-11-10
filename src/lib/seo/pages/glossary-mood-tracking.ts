import { SEOPage } from '@/lib/seo/types';

export const page: SEOPage = {
  slug: 'glossary/mood-tracking',
  playbook: 'glossary',
  seo: {
    title: 'What is Mood Tracking for Couples? | Pairfect Glossary',
    metaDescription: 'Learn what mood tracking means in a relationship context. Discover how tracking emotions helps couples communicate better and build empathy.',
    canonicalUrl: 'https://www.pairfect.site/glossary/mood-tracking',
    primaryKeyword: 'mood tracking for couples',
    secondaryKeywords: ['relationship mood tracker', 'emotional check in', 'tracking feelings'],
    searchIntent: 'informational',
    ogTitle: 'What is Mood Tracking for Couples? | Pairfect',
    ogDescription: 'Learn what mood tracking means in a relationship context. Discover how tracking emotions helps couples communicate better and build empathy.'
  },
  h1: 'Mood Tracking for Couples',
  introduction: 'Mood tracking for couples is the practice of consistently recording and sharing your emotional state with your partner. In a relationship context, it serves as a non-verbal tool for emotional check-ins, allowing partners to understand each other\'s feelings without requiring lengthy explanations. This simple habit fosters empathy, reduces misunderstandings, and builds deeper emotional intimacy.',
  sections: [
    {
      heading: 'How Mood Tracking Works in Relationships',
      body: 'At its core, mood tracking involves identifying how you feel-whether that\'s joyful, stressed, anxious, or content-and communicating that to your partner. This can be done through a shared journal, a whiteboard on the fridge, or, most conveniently, a digital app.\n\nWhen you use the **Mood Tracking** feature in Pairfect, you can log your emotional state with just a few taps. Your partner receives this update, giving them immediate insight into your headspace. If you log a "stressed" mood after a long workday, your partner knows to offer support rather than asking you to tackle a complex household issue immediately.'
    },
    {
      heading: 'The Benefits of Emotional Awareness',
      body: 'The primary benefit of mood tracking is the proactive communication it encourages. It removes the guesswork from relationships. You no longer have to ask, "Is everything okay?" because you already have a baseline understanding of your partner\'s mood.\n\nOver time, mood tracking helps couples identify patterns. You might notice that certain days of the week or specific life events consistently trigger stress or happiness, allowing you to navigate those periods together more effectively as a team.'
    }
  ],
  faqs: [
    {
      question: 'Is mood tracking only for couples having problems?',
      answer: 'Not at all. Mood tracking is a preventative maintenance tool. It\'s incredibly beneficial for healthy couples who want to improve their emotional intelligence and stay closely connected during busy periods.'
    },
    {
      question: 'What if I forget to log my mood?',
      answer: 'Consistency is helpful, but perfection isn\'t required. The goal is to create a habit of emotional check-ins. If you miss a day, simply pick it up the next.'
    }
  ],
  callToAction: 'Start understanding your partner on a deeper level. Try the Mood Tracking feature on Pairfect today.',
  internalLinks: [
    { url: '/relationship-building-activities', anchorText: 'relationship building activities' },
    { url: '/busy-couples-relationship-tips', anchorText: 'busy couples relationship tips' },
    { url: '/glossary/relationship-check-in', anchorText: 'relationship check in' }
  ],
  relatedPages: ['relationship-building-activities', 'busy-couples-relationship-tips', 'glossary/relationship-check-in'],
  schemaType: 'DefinedTerm',
  indexable: true
};
