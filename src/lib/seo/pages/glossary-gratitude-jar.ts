import { SEOPage } from '@/lib/seo/types';

export const page: SEOPage = {
  slug: 'glossary/gratitude-jar',
  playbook: 'glossary',
  seo: {
    title: 'What is a Gratitude Jar? | Pairfect Glossary',
    metaDescription: 'Learn what a gratitude jar is and how couples use it to foster appreciation, positivity, and connection in their relationship.',
    canonicalUrl: 'https://www.pairfect.site/glossary/gratitude-jar',
    primaryKeyword: 'what is a gratitude jar',
    secondaryKeywords: ['digital gratitude jar', 'couples gratitude', 'gratitude practice for relationships'],
    searchIntent: 'informational',
    ogTitle: 'What is a Gratitude Jar? | Pairfect',
    ogDescription: 'Learn what a gratitude jar is and how couples use it to foster appreciation, positivity, and connection in their relationship.'
  },
  h1: 'Gratitude Jar',
  introduction: 'A gratitude jar is a dedicated space-physical or digital-where individuals or couples collect notes of thankfulness and appreciation. In relationships, a gratitude jar serves as a powerful tool to shift focus from daily frustrations to positive moments, reinforcing the value you see in your partner and the life you are building together.',
  sections: [
    {
      heading: 'The Psychology Behind Gratitude in Relationships',
      body: 'Psychological studies consistently show that practicing gratitude increases happiness and relationship satisfaction. When couples get comfortable, it\'s easy to take each other for granted. A gratitude jar interrupts this habit by requiring you to actively look for things to be thankful for.\n\nWhether it\'s thanking your partner for making the bed, handling a tough situation gracefully, or simply being themselves, acknowledging these moments builds a reservoir of positive sentiment that buffers the relationship during stressful times.'
    },
    {
      heading: 'How a Digital Gratitude Jar Works',
      body: 'While traditional gratitude jars are physical glass jars filled with slips of paper, digital versions offer incredible convenience for modern couples. \n\nPairfect\'s **Gratitude Jar** feature allows you to drop a note of appreciation anytime, anywhere, right from your phone. You don\'t need to wait until you are home to express your thanks. Over time, this digital jar becomes a beautiful, searchable archive of love and appreciation that you can look back on whenever you need a reminder of why your relationship is special.'
    }
  ],
  faqs: [
    {
      question: 'How often should we use a gratitude jar?',
      answer: 'Many couples find success by adding to it daily or weekly. The most important thing is finding a cadence that feels natural and sustainable for your relationship.'
    },
    {
      question: 'What kind of things should I write in a gratitude jar?',
      answer: 'Anything! From big things (like support during a career change) to tiny moments (like bringing you a glass of water). Specific, detailed notes often carry the most impact.'
    }
  ],
  callToAction: 'Start building a habit of appreciation. Begin filling your digital Gratitude Jar on Pairfect today.',
  internalLinks: [
    { url: '/gratitude-jar-ideas', anchorText: 'gratitude jar ideas' },
    { url: '/glossary/mood-tracking', anchorText: 'mood tracking' },
    { url: '/couples-routines-and-traditions', anchorText: 'couples routines and traditions' }
  ],
  relatedPages: ['gratitude-jar-ideas', 'glossary/mood-tracking', 'couples-routines-and-traditions'],
  schemaType: 'DefinedTerm',
  indexable: true
};
