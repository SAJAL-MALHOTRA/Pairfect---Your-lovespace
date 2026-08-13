// ── PAIRFECT AUTOMATED SEO VALIDATOR & CANNIBALIZATION ENGINE ────────────────

import { SEOPage } from "./types";

// ── Verified Features Registry ───────────────────────────────────────────────
export const VERIFIED_PAIRFECT_FEATURES = [
  "Mood Tracking",
  "IQ Duel",
  "Riddle Night",
  "Gratitude Jar",
  "Virtual Photobooth",
  "Shared Canvas",
  "Love Letter",
  "Love Letter with GIPHY stickers",
  "Spotify Song Search",
  "Between the Lines",
  "AI Vibe Judge",
] as const;

// Words commonly associated with unverified/forbidden features
const UNVERIFIED_FEATURE_TRIGGERS = [
  "budget tracker",
  "shared calendar",
  "expense splitter",
  "sex dice",
  "horoscope compatibility",
  "astrology matching",
  "location tracker",
  "gps sharing",
  "chores checklist",
  "therapy session",
];

// ── Engine Interfaces ────────────────────────────────────────────────────────

export interface PageWorthinessScores {
  searchValue: number; // 1-10
  intentDistinctiveness: number; // 1-10
  pairfectRelevance: number; // 1-10
  dataCompleteness: number; // 1-10
  contentDepthPotential: number; // 1-10
  uniqueness: number; // 1-10
  internalLinkingValue: number; // 1-10
  evergreenValue: number; // 1-10
  averageScore: number;
}

export type RejectionReason =
  | "DUPLICATE_SLUG"
  | "KEYWORD_CANNIBALIZATION"
  | "DUPLICATE_INTENT"
  | "UNSUPPORTED_FACTS"
  | "INSUFFICIENT_DATA"
  | "THIN_CONTENT"
  | "LOW_SEARCH_VALUE"
  | "LOW_PAIRFECT_RELEVANCE"
  | "BROKEN_INTERNAL_LINKS"
  | "INVALID_METADATA";

export interface PageValidationIssue {
  type: "ERROR" | "WARNING";
  code: RejectionReason;
  message: string;
  competingSlug?: string;
  details?: Record<string, unknown>;
}

export interface CandidateEvaluationResult {
  slug: string;
  allowed: boolean;
  scores: PageWorthinessScores;
  issues: PageValidationIssue[];
  recommendation: "APPROVE" | "REJECT" | "MERGE_INTO_EXISTING";
  suggestedAction?: string;
}

export interface RegistryHealthReport {
  totalPages: number;
  validPages: number;
  duplicateSlugs: string[];
  cannibalizationPairs: Array<{ slugA: string; slugB: string; similarity: number }>;
  brokenLinkMap: Array<{ sourceSlug: string; targetUrl: string }>;
  unverifiedFeatureWarnings: Array<{ slug: string; featureMentioned: string }>;
  thinPages: string[];
  overallHealthScore: number; // 0-100
}

// ── Similarity & Token Utilities ─────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

function calculateJaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/^\/+|\/+$/g, "");
}

function getPageTotalWordCount(page: SEOPage): number {
  const introWords = page.introduction ? page.introduction.trim().split(/\s+/).length : 0;
  const sectionWords = page.sections
    ? page.sections.reduce((acc, s) => {
        const hWords = s.heading ? s.heading.trim().split(/\s+/).length : 0;
        const bWords = s.body ? s.body.trim().split(/\s+/).length : 0;
        return acc + hWords + bWords;
      }, 0)
    : 0;
  const faqWords = page.faqs
    ? page.faqs.reduce((acc, f) => {
        const qWords = f.question ? f.question.trim().split(/\s+/).length : 0;
        const aWords = f.answer ? f.answer.trim().split(/\s+/).length : 0;
        return acc + qWords + aWords;
      }, 0)
    : 0;
  const ctaWords = page.callToAction ? page.callToAction.trim().split(/\s+/).length : 0;
  return introWords + sectionWords + faqWords + ctaWords;
}

// ── Automated Scoring & Intent Engine ────────────────────────────────────────

export function calculateWorthinessScores(page: SEOPage): PageWorthinessScores {
  const isGlossary = page.playbook === "glossary";
  const wordCount = getPageTotalWordCount(page);

  // 1. Data completeness score
  const hasMeta = !!(page.seo?.title && page.seo?.metaDescription);
  const hasFaqs = page.faqs.length >= (isGlossary ? 1 : 2);
  const hasLinks = page.internalLinks.length >= (isGlossary ? 2 : 3);
  const dataCompleteness = (hasMeta ? 3 : 0) + (hasFaqs ? 4 : 0) + (hasLinks ? 3 : 0);

  // 2. Content depth score
  let contentDepthPotential = 5;
  if (wordCount >= (isGlossary ? 250 : 500)) contentDepthPotential += 3;
  if (page.sections.length >= (isGlossary ? 2 : 3)) contentDepthPotential += 2;
  contentDepthPotential = Math.min(10, contentDepthPotential);

  // 3. Pairfect relevance score
  let pairfectRelevance = 7;
  const fullText = (page.introduction + " " + page.sections.map((s) => s.body).join(" ")).toLowerCase();
  const verifiedMentions = VERIFIED_PAIRFECT_FEATURES.filter((f) =>
    fullText.includes(f.toLowerCase())
  );
  if (verifiedMentions.length >= 2) pairfectRelevance += 2;
  if (verifiedMentions.length >= 4) pairfectRelevance += 1;
  pairfectRelevance = Math.min(10, pairfectRelevance);

  // 4. Default baseline estimates for key metrics
  const searchValue = isGlossary ? 7 : 8;
  const intentDistinctiveness = 8;
  const uniqueness = 8;
  const internalLinkingValue = page.internalLinks.length > 3 ? 9 : 7;
  const evergreenValue = 9;

  const total =
    searchValue +
    intentDistinctiveness +
    pairfectRelevance +
    dataCompleteness +
    contentDepthPotential +
    uniqueness +
    internalLinkingValue +
    evergreenValue;

  const averageScore = Math.round((total / 8) * 10) / 10;

  return {
    searchValue,
    intentDistinctiveness,
    pairfectRelevance,
    dataCompleteness,
    contentDepthPotential,
    uniqueness,
    internalLinkingValue,
    evergreenValue,
    averageScore,
  };
}

// ── Candidate Evaluation Engine ──────────────────────────────────────────────

export function evaluateCandidate(
  candidate: SEOPage,
  existingRegistry: SEOPage[]
): CandidateEvaluationResult {
  const issues: PageValidationIssue[] = [];
  const normalizedCandidateSlug = normalizeSlug(candidate.slug);

  // 1. Check duplicate slug
  const duplicateSlugMatch = existingRegistry.find(
    (p) => normalizeSlug(p.slug) === normalizedCandidateSlug
  );
  if (duplicateSlugMatch) {
    issues.push({
      type: "ERROR",
      code: "DUPLICATE_SLUG",
      message: `Slug '${candidate.slug}' is already registered in the system.`,
      competingSlug: duplicateSlugMatch.slug,
    });
  }

  // 2. Keyword & Intent Cannibalization Check
  const candidateKeyword = candidate.seo?.primaryKeyword || candidate.slug;
  for (const existing of existingRegistry) {
    if (normalizeSlug(existing.slug) === normalizedCandidateSlug) continue;

    const existingKeyword = existing.seo?.primaryKeyword || existing.slug;
    const kwSimilarity = calculateJaccardSimilarity(candidateKeyword, existingKeyword);
    const slugSimilarity = calculateJaccardSimilarity(candidate.slug, existing.slug);
    const maxSim = Math.max(kwSimilarity, slugSimilarity);

    if (maxSim >= 0.7) {
      issues.push({
        type: "ERROR",
        code: "KEYWORD_CANNIBALIZATION",
        message: `High keyword cannibalization risk (${Math.round(maxSim * 100)}% match) with existing page '${existing.slug}'.`,
        competingSlug: existing.slug,
        details: { candidateKeyword, existingKeyword, similarity: maxSim },
      });
    } else if (maxSim >= 0.45) {
      issues.push({
        type: "WARNING",
        code: "DUPLICATE_INTENT",
        message: `Moderate search intent overlap (${Math.round(maxSim * 100)}% match) with existing page '${existing.slug}'. Ensure distinct angles.`,
        competingSlug: existing.slug,
      });
    }
  }

  // 3. Playbook Specific Policy Enforcement
  const fullText = (
    candidate.h1 +
    " " +
    candidate.introduction +
    " " +
    candidate.sections.map((s) => s.body).join(" ")
  ).toLowerCase();

  // Enforce unverified feature check
  for (const trigger of UNVERIFIED_FEATURE_TRIGGERS) {
    if (fullText.includes(trigger)) {
      issues.push({
        type: "ERROR",
        code: "UNSUPPORTED_FACTS",
        message: `Candidate references unverified feature concept '${trigger}'. Only confirmed Pairfect features are permitted.`,
      });
    }
  }

  // Enforce playbook constraints
  if (normalizedCandidateSlug.includes("activities-in-") || normalizedCandidateSlug.includes("couples-in-")) {
    issues.push({
      type: "ERROR",
      code: "INSUFFICIENT_DATA",
      message: "Location playbook pages are restricted unless city-specific partner dataset is attached.",
    });
  }

  if (candidate.playbook === "comparisons" && normalizedCandidateSlug.includes("vs-")) {
    const isDigitalVsPhysical = normalizedCandidateSlug === "digital-vs-physical-date-ideas";
    if (!isDigitalVsPhysical) {
      issues.push({
        type: "ERROR",
        code: "INSUFFICIENT_DATA",
        message: "Competitor comparison pages are restricted without verified competitor matrix dataset.",
      });
    }
  }

  // 4. Content Quality & Thinness Check
  const wordCount = getPageTotalWordCount(candidate);
  const minWordCount = candidate.playbook === "glossary" ? 250 : 450;
  if (wordCount < minWordCount) {
    issues.push({
      type: "ERROR",
      code: "THIN_CONTENT",
      message: `Content length (${wordCount} words) is below the required minimum of ${minWordCount} words for ${candidate.playbook} playbook.`,
    });
  }

  // 5. Calculate scores & determine final status
  const scores = calculateWorthinessScores(candidate);
  const hasErrors = issues.some((i) => i.type === "ERROR");
  const allowed = !hasErrors && scores.averageScore >= 7.0;

  let recommendation: CandidateEvaluationResult["recommendation"] = allowed ? "APPROVE" : "REJECT";
  let suggestedAction = allowed
    ? "Page meets all intent, depth, and non-cannibalization criteria. Ready for registration."
    : "Resolve validation errors before registering.";

  const cannibalizationError = issues.find((i) => i.code === "KEYWORD_CANNIBALIZATION");
  if (cannibalizationError && cannibalizationError.competingSlug) {
    recommendation = "MERGE_INTO_EXISTING";
    suggestedAction = `Merge proposed topic into H2 section of existing page '/${cannibalizationError.competingSlug}' to prevent cannibalization.`;
  }

  return {
    slug: candidate.slug,
    allowed,
    scores,
    issues,
    recommendation,
    suggestedAction,
  };
}

// ── Registry Health Audit ───────────────────────────────────────────────────

export function validateRegistry(registry: SEOPage[]): RegistryHealthReport {
  const duplicateSlugs: string[] = [];
  const cannibalizationPairs: Array<{ slugA: string; slugB: string; similarity: number }> = [];
  const brokenLinkMap: Array<{ sourceSlug: string; targetUrl: string }> = [];
  const unverifiedFeatureWarnings: Array<{ slug: string; featureMentioned: string }> = [];
  const thinPages: string[] = [];

  const registeredSlugs = new Set(registry.map((p) => "/" + normalizeSlug(p.slug)));
  registeredSlugs.add("/"); // Home page is always valid

  const seenSlugs = new Set<string>();

  for (let i = 0; i < registry.length; i++) {
    const page = registry[i];
    const normSlug = normalizeSlug(page.slug);

    // Duplicate check
    if (seenSlugs.has(normSlug)) {
      duplicateSlugs.push(page.slug);
    }
    seenSlugs.add(normSlug);

    // Thin page check
    const wordCount = getPageTotalWordCount(page);
    const minWords = page.playbook === "glossary" ? 250 : 450;
    if (wordCount < minWords) {
      thinPages.push(page.slug);
    }

    // Cannibalization scan against other pages in registry
    for (let j = i + 1; j < registry.length; j++) {
      const other = registry[j];
      const kwA = page.seo?.primaryKeyword || page.slug;
      const kwB = other.seo?.primaryKeyword || other.slug;
      const sim = calculateJaccardSimilarity(kwA, kwB);
      if (sim >= 0.7) {
        cannibalizationPairs.push({
          slugA: page.slug,
          slugB: other.slug,
          similarity: Math.round(sim * 100),
        });
      }
    }

    // Link integrity scan
    for (const link of page.internalLinks) {
      const targetNorm = normalizeSlug(link.url);
      if (!registeredSlugs.has("/" + targetNorm) && !registeredSlugs.has(targetNorm)) {
        brokenLinkMap.push({
          sourceSlug: page.slug,
          targetUrl: link.url,
        });
      }
    }

    // Unverified feature scan
    const text = (page.introduction + " " + page.sections.map((s) => s.body).join(" ")).toLowerCase();
    for (const trigger of UNVERIFIED_FEATURE_TRIGGERS) {
      if (text.includes(trigger)) {
        unverifiedFeatureWarnings.push({
          slug: page.slug,
          featureMentioned: trigger,
        });
      }
    }
  }

  // Health Score Calculation
  let health = 100;
  health -= duplicateSlugs.length * 25;
  health -= cannibalizationPairs.length * 15;
  health -= brokenLinkMap.length * 10;
  health -= unverifiedFeatureWarnings.length * 10;
  health -= thinPages.length * 5;
  health = Math.max(0, health);

  return {
    totalPages: registry.length,
    validPages: registry.length - (duplicateSlugs.length + thinPages.length),
    duplicateSlugs,
    cannibalizationPairs,
    brokenLinkMap,
    unverifiedFeatureWarnings,
    thinPages,
    overallHealthScore: health,
  };
}
