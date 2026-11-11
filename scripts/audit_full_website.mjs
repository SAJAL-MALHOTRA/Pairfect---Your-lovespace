import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

const ROUTES = [
  { path: "/", name: "Landing Page", expectSelector: "h1" },
  { path: "/dashboard", name: "Couple Dashboard", expectSelector: "main, h1, h2, nav" },
  { path: "/moments", name: "Keepsake Sanctuary", expectSelector: "main, h1, h2" },
  { path: "/photo-booth", name: "Virtual Photobooth", expectSelector: "video, button, canvas, div" },
  { path: "/bouquet", name: "Botanical Floral Studio", expectSelector: "canvas, svg, button" },
  { path: "/fridge", name: "Keepsake Fridge", expectSelector: "h1, div, button" },
  { path: "/love-letter", name: "Wax-Sealed Love Letters", expectSelector: "textarea, button, form, div" },
  { path: "/gratitude-jar", name: "Gratitude Jar", expectSelector: "button, div" },
  { path: "/iq-duel", name: "IQ Duel", expectSelector: "button, div" },
  { path: "/riddle", name: "Riddle Night", expectSelector: "button, div" },
  { path: "/vibe-judge", name: "Between the Lines (AI Courtroom)", expectSelector: "button, div, textarea" },
  { path: "/mixtape", name: "Spotify Mixtape Sync", expectSelector: "button, div, input" },
  { path: "/checkin", name: "Daily Mood Sanctuary", expectSelector: "button, div" },
  { path: "/play", name: "Love Path Arcade", expectSelector: "button, div, svg" },
  { path: "/play/love-match", name: "Love Match Game", expectSelector: "button, div" },
  { path: "/roulette", name: "Romantic Decision Wheel", expectSelector: "button, canvas, div" },
  { path: "/whisper", name: "Voice Memo Whispers", expectSelector: "button, div" },
  { path: "/journal", name: "Shared Couple Journal", expectSelector: "button, div" },
  { path: "/calendar", name: "Couple Calendar", expectSelector: "button, div" },
  { path: "/focus", name: "Connected Focus Timer", expectSelector: "button, div" },
  { path: "/stories", name: "Couple Stories", expectSelector: "button, div" },
  { path: "/pricing", name: "Pricing & Plans", expectSelector: "h1, h2, button, div" },
  { path: "/privacy", name: "Privacy Policy & Terms", expectSelector: "h1, div" },
  { path: "/profile", name: "Profile & Room", expectSelector: "button, div" },
  { path: "/settings", name: "Settings & Privacy Controls", expectSelector: "button, div" },
  { path: "/login", name: "Sign In", expectSelector: "form, input, button" },
  { path: "/signup", name: "Sign Up", expectSelector: "form, input, button" },
  { path: "/onboarding", name: "Pair Handshake Onboarding", expectSelector: "input, button, div" },
];

async function runAudit() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("          PAIRFECT FULL PLATFORM WORKFLOW & ROUTE AUDIT         ");
  console.log("════════════════════════════════════════════════════════════════\n");

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const route of ROUTES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const targetUrl = `${BASE_URL}${route.path}`;
    let status = 0;
    let loadTimeMs = 0;
    let renderedOk = false;
    let errorMessage = null;

    try {
      const startTime = Date.now();
      const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 12000 });
      loadTimeMs = Date.now() - startTime;
      status = response ? response.status() : 0;

      await page.waitForTimeout(600);

      const hasContent = await page.evaluate((selector) => {
        return !!document.querySelector(selector);
      }, route.expectSelector);

      renderedOk = hasContent && status === 200;
    } catch (err) {
      errorMessage = err.message;
      renderedOk = false;
    }

    const testPassed = renderedOk && pageErrors.length === 0;

    results.push({
      name: route.name,
      path: route.path,
      status,
      loadTimeMs,
      renderedOk,
      pageErrors,
      consoleErrors: consoleErrors.slice(0, 3),
      passed: testPassed,
      errorMessage,
    });

    const icon = testPassed ? "✅" : "❌";
    console.log(`${icon} [${status || "ERR"}] ${route.name.padEnd(35)} ${route.path.padEnd(20)} (${loadTimeMs}ms)`);
    if (pageErrors.length > 0) {
      console.log(`   └─ Page Error: ${pageErrors[0]}`);
    }
    if (errorMessage) {
      console.log(`   └─ Exception: ${errorMessage}`);
    }

    await context.close();
  }

  await browser.close();

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log(` AUDIT SUMMARY: ${passedCount}/${totalCount} ROUTES OPERATIONAL (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log("════════════════════════════════════════════════════════════════");

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "route_audit_results.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), passedCount, totalCount, results }, null, 2),
    "utf8"
  );
}

runAudit().catch(console.error);
