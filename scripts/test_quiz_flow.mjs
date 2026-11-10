import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 }
  });

  const page = await context.newPage();

  console.log("1. Navigating to Know Me Quiz guest invite URL...");
  await page.goto("http://localhost:3000/quiz?room=KNOW7", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Capture guest modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "18-quiz-guest-join.png") });
  console.log("Captured 18-quiz-guest-join.png");

  // Fill in guest name and join
  const guestInput = page.locator("input[placeholder*='name or nickname']");
  if (await guestInput.isVisible()) {
    await guestInput.fill("Maya");
    await page.click("button:has-text('Join the Room')");
    await page.waitForTimeout(1000);
  }

  // Capture lobby with decks
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "19-quiz-lobby.png") });
  console.log("Captured 19-quiz-lobby.png");

  // Start "Solo vs Cozy Bot" on the first deck (Cute & Sweet)
  console.log("2. Starting Solo vs Cozy Bot...");
  const soloBtn = page.locator("button:has-text('Solo vs Cozy Bot')").first();
  await soloBtn.click();
  await page.waitForTimeout(1500);

  // Capture question screen
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "20-quiz-question-screen.png") });
  console.log("Captured 20-quiz-question-screen.png");

  // Play through the 5 questions
  for (let q = 0; q < 5; q++) {
    console.log(`Playing question ${q + 1}...`);
    // Type answer
    const input = page.locator("input[placeholder*='authentic answer'] , input[placeholder*='guess']").first();
    await input.waitFor({ state: "visible", timeout: 8000 });
    await input.fill(`Warm hugs and coffee (${q + 1})`);
    
    // Click Lock In Answer
    await page.click("button:has-text('Lock In Answer')");

    // Wait for reveal & grading panel
    await page.waitForSelector("button:has-text('Match!')", { timeout: 10000 });
    await page.waitForTimeout(600);

    // Grade as Match
    await page.click("button:has-text('Match!')");
    await page.waitForTimeout(1000);
  }

  // Wait for Quiz Completed scoreboard
  console.log("3. Waiting for scoreboard & keepsake card...");
  await page.waitForSelector("text=Quiz Completed!", { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Scroll to keepsake card
  const keepsake = page.locator("text=PAIRFECT KEEPSAKE : KNOW ME QUIZ").first();
  if (await keepsake.isVisible()) {
    await keepsake.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // Capture keepsake card
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "21-quiz-keepsake-card.png") });
  console.log("Captured 21-quiz-keepsake-card.png");

  // Click Pin to Memory Wall
  const pinBtn = page.locator("button:has-text('Pin to Memory Wall')");
  if (await pinBtn.isVisible()) {
    await pinBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "22-quiz-pinned-keepsake.png") });
  console.log("Captured 22-quiz-pinned-keepsake.png");

  await browser.close();
  console.log("Quiz flow tested successfully!");
}

run().catch((err) => {
  console.error("Error running test:", err);
  process.exit(1);
});
