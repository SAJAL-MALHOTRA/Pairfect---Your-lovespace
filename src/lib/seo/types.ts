// ── SEO Content Types ────────────────────────────────────────────────────────

export interface SEOMetadata {
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  ogTitle: string;
  ogDescription: string;
}

export interface ContentSection {
  heading: string;
  body: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface InternalLink {
  url: string;
  anchorText: string;
}

export interface SEOPage {
  slug: string;
  playbook: "templates" | "curation" | "examples" | "comparisons" | "personas" | "glossary";
  seo: SEOMetadata;
  h1: string;
  introduction: string;
  sections: ContentSection[];
  faqs: FAQ[];
  callToAction: string;
  internalLinks: InternalLink[];
  relatedPages: string[];
  schemaType: "Article" | "FAQPage" | "DefinedTerm" | "HowTo" | "CollectionPage";
  indexable: boolean;
}
