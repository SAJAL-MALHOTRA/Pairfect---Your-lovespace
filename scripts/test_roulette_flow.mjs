import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 }
  });

  const page = await context.newPage();

  page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", err => console.log("BROWSER ERR:", err.message));

  console.log("1. Navigating to Date Night Roulette guest URL...");
  await page.goto("http://localhost:3000/roulette?room=SPIN9", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Check if guest modal appears
  const guestInput = page.locator("input[placeholder*='name or nickname']");
  if (await guestInput.isVisible()) {
    console.log("Guest modal is visible. Capturing guest modal...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "23-roulette-guest-join.png") });
    console.log("Captured 23-roulette-guest-join.png");

    await guestInput.fill("Devon");
    await page.click("button:has-text('Join the Room')");
    await page.waitForTimeout(1200);
  }

  // Find center spin button specifically by ID
  console.log("2. Locating Center Spin button #roulette-spin-button...");
  const spinBtn = page.locator("#roulette-spin-button");
  console.log("Is #roulette-spin-button visible?", await spinBtn.isVisible());

  // Click center spin button
  await spinBtn.click();
  console.log("Clicked #roulette-spin-button!");

  // Wait 6 seconds for spin animation
  await page.waitForTimeout(6000);

  // Check if decree card is visible
  const decree = page.locator("text=Tonight's Decree");
  const isDecreeVisible = await decree.isVisible();
  console.log("Is Tonight's Decree visible now?", isDecreeVisible);

  // Capture decree screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "24-roulette-decree-keepsake.png") });
  console.log("Captured 24-roulette-decree-keepsake.png");

  // Check and click Pin to Memories
  const pinBtn = page.locator("button:has-text('Pin to Memories')").first();
  if (await pinBtn.isVisible()) {
    console.log("Clicking Pin to Memories...");
    await pinBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "25-roulette-pinned-keepsake.png") });
    console.log("Captured 25-roulette-pinned-keepsake.png");
  }

  await browser.close();
  console.log("Finished test run successfully!");
}

run().catch(console.error);
