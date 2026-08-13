import { getAllPages } from "../src/lib/seo/registry.ts";
import { validateRegistry, evaluateCandidate } from "../src/lib/seo/engine.ts";

console.log("=================================================");
console.log("PAIRFECT AUTOMATED SEO VALIDATOR & ENGINE RUNNER");
console.log("=================================================\n");

const registry = getAllPages();
console.log(`Auditing ${registry.length} registered SEO pages...\n`);

const report = validateRegistry(registry);

console.log(`📊 OVERALL REGISTRY HEALTH SCORE: ${report.overallHealthScore}/100`);
console.log(`- Total Pages: ${report.totalPages}`);
console.log(`- Valid Pages: ${report.validPages}`);
console.log(`- Duplicate Slugs: ${report.duplicateSlugs.length}`);
console.log(`- Cannibalization Risks: ${report.cannibalizationPairs.length}`);
console.log(`- Broken Internal Links: ${report.brokenLinkMap.length}`);
console.log(`- Unverified Feature Triggers: ${report.unverifiedFeatureWarnings.length}`);
console.log(`- Thin Pages: ${report.thinPages.length}\n`);

if (report.cannibalizationPairs.length > 0) {
  console.log("⚠️  CANNIBALIZATION PAIRS DETECTED:");
  report.cannibalizationPairs.forEach((pair) => {
    console.log(`   • ${pair.slugA} <--> ${pair.slugB} (${pair.similarity}% similarity)`);
  });
  console.log("");
}

if (report.brokenLinkMap.length > 0) {
  console.log("❌ BROKEN INTERNAL LINKS DETECTED:");
  report.brokenLinkMap.forEach((link) => {
    console.log(`   • Page '${link.sourceSlug}' -> Broken link target: '${link.targetUrl}'`);
  });
  console.log("");
}

if (report.unverifiedFeatureWarnings.length > 0) {
  console.log("⚠️  UNVERIFIED FEATURE WARNINGS:");
  report.unverifiedFeatureWarnings.forEach((w) => {
    console.log(`   • Page '${w.slug}' mentions unverified feature: '${w.featureMentioned}'`);
  });
  console.log("");
}

// ── TEST EVALUATION ON NEW CANDIDATES ─────────────────────────────────────────

console.log("-------------------------------------------------");
console.log("TESTING ENGINE EVALUATION ON SAMPLE CANDIDATES...");
console.log("-------------------------------------------------\n");

const candidate1 = {
  slug: "best-relationship-apps", // Cannibalization test vs best-couples-apps
  playbook: "curation",
  seo: {
    title: "Best Relationship Apps for Couples",
    metaDescription: "Find the best relationship apps.",
    primaryKeyword: "best relationship apps",
  },
  h1: "Best Relationship Apps",
  introduction: "Looking for relationship apps? Here is our guide.",
  sections: [{ heading: "Section", body: "Sample content section body text." }],
  faqs: [],
  internalLinks: [],
  relatedPages: [],
  schemaType: "CollectionPage",
  indexable: true,
};

const candidate2 = {
  slug: "couples-activities-in-chicago", // Location playbook test
  playbook: "locations",
  seo: {
    title: "Couples Activities in Chicago",
    metaDescription: "Best things to do in Chicago for couples.",
    primaryKeyword: "couples activities in chicago",
  },
  h1: "Couples Activities in Chicago",
  introduction: "Explore Chicago together as a couple with these top date ideas.",
  sections: [{ heading: "Date Ideas", body: "Visit Navy Pier and Millennium Park." }],
  faqs: [],
  internalLinks: [],
  relatedPages: [],
  schemaType: "Article",
  indexable: true,
};

const res1 = evaluateCandidate(candidate1, registry);
console.log(`Candidate 1 ('${candidate1.slug}'):`);
console.log(`  Allowed: ${res1.allowed ? "✅ YES" : "❌ NO"}`);
console.log(`  Recommendation: ${res1.recommendation}`);
console.log(`  Suggested Action: ${res1.suggestedAction}`);
console.log(`  Issues (${res1.issues.length}):`);
res1.issues.forEach((i) => console.log(`    - [${i.type}] ${i.code}: ${i.message}`));
console.log("");

const res2 = evaluateCandidate(candidate2, registry);
console.log(`Candidate 2 ('${candidate2.slug}'):`);
console.log(`  Allowed: ${res2.allowed ? "✅ YES" : "❌ NO"}`);
console.log(`  Recommendation: ${res2.recommendation}`);
console.log(`  Suggested Action: ${res2.suggestedAction}`);
console.log(`  Issues (${res2.issues.length}):`);
res2.issues.forEach((i) => console.log(`    - [${i.type}] ${i.code}: ${i.message}`));
console.log("");

if (report.overallHealthScore === 100 && report.brokenLinkMap.length === 0) {
  console.log("✅ ALL REGISTERED PAGES PASSED AUDIT WITH PERFECT HEALTH (100/100)!");
  process.exit(0);
} else {
  console.log("⚠️ AUDIT FINISHED WITH WARNINGS/ISSUES.");
  process.exit(report.brokenLinkMap.length > 0 ? 1 : 0);
}
