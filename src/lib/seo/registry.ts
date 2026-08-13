// ── SEO Content Registry ─────────────────────────────────────────────────────
// Auto-imports all page content files and exposes lookup utilities.

import type { SEOPage } from "./types";

// ── Import all page content ──────────────────────────────────────────────────
import { page as bestCouplesApps } from "./pages/best-couples-apps";
import { page as onlineGamesForCouples } from "./pages/online-games-for-couples";
import { page as longDistanceRelationshipActivities } from "./pages/long-distance-relationship-activities";
import { page as dateNightIdeas } from "./pages/date-night-ideas";
import { page as conversationStartersForCouples } from "./pages/conversation-starters-for-couples";
import { page as relationshipMemoryIdeas } from "./pages/relationship-memory-ideas";
import { page as gratitudeJarIdeas } from "./pages/gratitude-jar-ideas";
import { page as couplesQuizzes } from "./pages/couples-quizzes";
import { page as loveletterIdeas } from "./pages/love-letter-ideas";
import { page as coupleChallengeideas } from "./pages/couple-challenge-ideas";
import { page as couplesPlaylistIdeas } from "./pages/couples-playlist-ideas";
import { page as relationshipBuildingActivities } from "./pages/relationship-building-activities";
import { page as couplesRoutinesAndTraditions } from "./pages/couples-routines-and-traditions";
import { page as couplesPhotoIdeas } from "./pages/couples-photo-ideas";
import { page as riddlesForCouples } from "./pages/riddles-for-couples";
import { page as romanticActivitiesAtHome } from "./pages/romantic-activities-at-home";
import { page as busyCouplesRelationshipTips } from "./pages/busy-couples-relationship-tips";
import { page as newlywedActivities } from "./pages/newlywed-activities";
import { page as digitalVsPhysicalDateIdeas } from "./pages/digital-vs-physical-date-ideas";
import { page as glossaryMoodTracking } from "./pages/glossary-mood-tracking";
import { page as glossaryGratitudeJar } from "./pages/glossary-gratitude-jar";
import { page as glossaryRelationshipCheckIn } from "./pages/glossary-relationship-check-in";

// ── Page Registry ────────────────────────────────────────────────────────────

const pages: SEOPage[] = [
  bestCouplesApps,
  onlineGamesForCouples,
  longDistanceRelationshipActivities,
  dateNightIdeas,
  conversationStartersForCouples,
  relationshipMemoryIdeas,
  gratitudeJarIdeas,
  couplesQuizzes,
  loveletterIdeas,
  coupleChallengeideas,
  couplesPlaylistIdeas,
  relationshipBuildingActivities,
  couplesRoutinesAndTraditions,
  couplesPhotoIdeas,
  riddlesForCouples,
  romanticActivitiesAtHome,
  busyCouplesRelationshipTips,
  newlywedActivities,
  digitalVsPhysicalDateIdeas,
  glossaryMoodTracking,
  glossaryGratitudeJar,
  glossaryRelationshipCheckIn,
];

// ── Lookup Utilities ─────────────────────────────────────────────────────────

const slugIndex = new Map<string, SEOPage>(pages.map((p) => [p.slug, p]));

/** Get a page by its slug (e.g. 'date-night-ideas' or 'glossary/mood-tracking') */
export function getPageBySlug(slug: string): SEOPage | undefined {
  return slugIndex.get(slug);
}

/** Get all registered slugs */
export function getAllSlugs(): string[] {
  return pages.map((p) => p.slug);
}

/** Get all pages */
export function getAllPages(): SEOPage[] {
  return [...pages];
}

/** Get pages by playbook type */
export function getPagesByPlaybook(playbook: SEOPage["playbook"]): SEOPage[] {
  return pages.filter((p) => p.playbook === playbook);
}
