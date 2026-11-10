import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  // 1. Test Quick-Drop Guest Station
  console.log("1. Navigating to Gratitude Jar quick-drop station...");
  await page.goto("http://localhost:3000/gratitude-jar?drop=test_pair_123", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Capture Quick-Drop Station
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "43-gratitude-quick-drop-station.png") });
  console.log("Captured 43-gratitude-quick-drop-station.png");

  // Fill in quick drop note
  const nameInput = page.locator("input[placeholder*='Maya']").first();
  await nameInput.fill("Jordan");
  const noteInput = page.locator("textarea[placeholder*='grateful for today']").first();
  await noteInput.fill("Thank you for the warm coffee and infectious laughter this morning!");
  
  const dropBtn = page.locator("button:has-text('Fold & Drop into Jar')").first();
  await dropBtn.click();
  await page.waitForTimeout(1000);

  // Capture Drop Success
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "44-gratitude-drop-success.png") });
  console.log("Captured 44-gratitude-drop-success.png");

  // 2. Test Interactive Jar View with Demo Notes
  console.log("2. Navigating to Interactive Gratitude Jar demo...");
  await page.goto("http://localhost:3000/gratitude-jar?demo=true", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Capture Jar view with slips inside and wooden shelf
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "45-gratitude-jar-view.png") });
  console.log("Captured 45-gratitude-jar-view.png");

  // Click "Pick a random memory"
  console.log("3. Drawing a random memory from jar...");
  const drawBtn = page.locator("button:has-text('Pick a random memory')").first();
  await drawBtn.click();
  await page.waitForTimeout(2500);

  // Capture Drawn Note with Polaroid Export & Pin Actions
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "46-gratitude-drawn-polaroid.png") });
  console.log("Captured 46-gratitude-drawn-polaroid.png");

  // Click Pin to Memory Wall
  console.log("4. Pinning to Memory Wall...");
  const pinBtn = page.locator("button:has-text('Pin to Memory Wall'), button:has-text('Pinned to Memories')").first();
  if (await pinBtn.isVisible()) {
    await pinBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "47-gratitude-pinned-keepsake.png") });
    console.log("Captured 47-gratitude-pinned-keepsake.png");
  }

  await browser.close();
  console.log("All Gratitude Jar tests completed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
