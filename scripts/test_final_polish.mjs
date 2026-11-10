import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  // 1. Test Landing Page Hero with Launch Film CTA
  console.log("1. Navigating to Landing Page...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Capture landing page hero with 30s film button
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "48-landing-page-hero-film-cta.png") });
  console.log("Captured 48-landing-page-hero-film-cta.png");

  // Click Watch 30s Film button
  console.log("2. Opening 30s launch video modal...");
  const watchBtn = page.locator("button:has-text('Watch 30s Film')").first();
  await watchBtn.click();
  await page.waitForTimeout(1200);

  // Capture video modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "49-landing-page-film-modal.png") });
  console.log("Captured 49-landing-page-film-modal.png");

  // Close video modal
  const closeBtn = page.locator("button[aria-label='Close launch video']").first();
  await closeBtn.click();
  await page.waitForTimeout(500);

  // 3. Test Public Shared Memory Wall View
  console.log("3. Navigating to Public Shared Memory Wall...");
  await page.goto("http://localhost:3000/moments?share=demo", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Capture shared memory wall
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "50-public-shared-memory-wall.png") });
  console.log("Captured 50-public-shared-memory-wall.png");

  await browser.close();
  console.log("All final polish tests passed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
