import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 }
  });

  const page = await context.newPage();

  console.log("1. Navigating to IQ Duel guest invite URL...");
  await page.goto("http://localhost:3000/iq-duel?room=COZY9", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Take screenshot of guest join modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "12-iq-duel-guest-join.png") });
  console.log("Captured 12-iq-duel-guest-join.png");

  // Fill in guest name and join
  const guestInput = page.locator("input[placeholder*='name or nickname']");
  if (await guestInput.isVisible()) {
    await guestInput.fill("Sajal");
    await page.click("button:has-text('Join the Room')");
    await page.waitForTimeout(1200);
  }

  // Take screenshot of lobby
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "13-iq-duel-lobby.png") });
  console.log("Captured 13-iq-duel-lobby.png");

  // Click 'Practice Solo vs Logic Bot'
  console.log("2. Starting Solo Bot practice duel...");
  await page.click("button:has-text('Practice Solo vs Logic Bot')");

  // Wait for questions to load
  await page.waitForSelector("text=Question 1 of 6", { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Take screenshot of question screen
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "14-iq-duel-question-screen.png") });
  console.log("Captured 14-iq-duel-question-screen.png");

  // Answer 6 questions
  for (let i = 0; i < 6; i++) {
    console.log(`Answering question ${i + 1}...`);
    // Wait for the option buttons for this question
    const option = page.locator("button.border-2").first();
    await option.waitFor({ state: "visible", timeout: 8000 });
    await option.click();
    
    // Give time for feedback animation + transition to next question (or finish)
    await page.waitForTimeout(1200);
  }

  // Wait for reveal screen
  console.log("3. Waiting for reveal & keepsake screen...");
  await page.waitForSelector("text=Duel Results", { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Take screenshot of reveal screen
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "15-iq-duel-reveal-results.png") });
  console.log("Captured 15-iq-duel-reveal-results.png");

  // Click Pin to Memory Wall
  console.log("4. Pinning to Memory Wall...");
  const pinBtn = page.locator("button:has-text('Pin to Memory Wall')");
  if (await pinBtn.isVisible()) {
    await pinBtn.click();
    await page.waitForTimeout(1000);
  }

  // Scroll into keepsake card view and capture
  const keepsakeCard = page.locator("text=PAIRFECT KEEPSAKE : LOGIC DUEL").first();
  if (await keepsakeCard.isVisible()) {
    await keepsakeCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "16-iq-duel-keepsake-card.png") });
  console.log("Captured 16-iq-duel-keepsake-card.png");

  await browser.close();
  console.log("All done successfully!");
}

run().catch((err) => {
  console.error("Error running test:", err);
  process.exit(1);
});
