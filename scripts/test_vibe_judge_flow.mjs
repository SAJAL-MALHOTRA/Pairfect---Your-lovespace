import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 }
  });

  const page = await context.newPage();

  console.log("1. Navigating to Vibe Judge guest URL...");
  await page.goto("http://localhost:3000/vibe-judge?room=VIBE7", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);

  // Check if guest modal appears
  const guestInput = page.locator("input[placeholder*='name or nickname']");
  if (await guestInput.isVisible()) {
    console.log("Guest modal is visible. Capturing screenshot...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "38-vibe-judge-guest-join.png") });
    console.log("Captured 38-vibe-judge-guest-join.png");

    await guestInput.fill("Taylor");
    await page.click("button:has-text('Enter the Court')");
    await page.waitForTimeout(1200);
  }

  // Capture lobby view
  console.log("2. Capturing Vibe Judge lobby view...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "39-vibe-judge-lobby.png") });
  console.log("Captured 39-vibe-judge-lobby.png");

  // Click "Debate with Cozy Bot 🤖"
  console.log("3. Starting solo debate mode with Cozy Bot...");
  const botBtn = page.locator("button:has-text('Debate with Cozy Bot')").first();
  await botBtn.click();
  await page.waitForTimeout(1500);

  // Capture debate case screen
  console.log("4. Capturing debate case screen...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "40-vibe-judge-case-screen.png") });
  console.log("Captured 40-vibe-judge-case-screen.png");

  // Type plea and lock in
  console.log("5. Submitting player case plea...");
  const textarea = page.locator("textarea[placeholder*='Write your plea']").first();
  await textarea.fill("Your Honor, morning preparation is an art form. Every extra minute guarantees peak emotional readiness!");
  await page.waitForTimeout(500);

  const lockBtn = page.locator("button:has-text('Lock In My Case')").first();
  await lockBtn.click();
  console.log("Locked in case. Waiting for Cozy Bot and AI verdict...");

  // Wait for verdict screen (Cozy Bot answers, judging takes ~2s)
  await page.waitForSelector("text=PAIRFECT KEEPSAKE : COURT OF PETTY LOVERS", { timeout: 14000 });
  await page.waitForTimeout(1200);

  // Capture Verdict and Keepsake Certificate Card
  console.log("6. Capturing Verdict and Keepsake Certificate Card...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "41-vibe-judge-verdict-screen.png") });
  console.log("Captured 41-vibe-judge-verdict-screen.png");

  // Click Pin to Memory Wall
  console.log("7. Clicking Pin to Memory Wall...");
  const pinBtn = page.locator("button:has-text('Pin to Memory Wall'), button:has-text('Pinned to Memories')").first();
  if (await pinBtn.isVisible()) {
    await pinBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "42-vibe-judge-pinned-keepsake.png") });
    console.log("Captured 42-vibe-judge-pinned-keepsake.png");
  }

  await browser.close();
  console.log("All Vibe Judge tests passed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
