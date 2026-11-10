import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log("1. Opening launch film page...");
  await page.goto("http://localhost:3000/launch-film", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Scene 0: Start screen with play button overlay
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "26-launch-film-start.png") });
  console.log("Captured 26-launch-film-start.png");

  // Click to start playing
  const playBtn = page.locator("text=Watch 30s Launch Film").first();
  if (await playBtn.isVisible()) {
    await playBtn.click();
    console.log("Clicked Play!");
  }
  await page.waitForTimeout(500);

  // Scene 1: The Noise (0-3s)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "27-launch-film-noise.png") });
  console.log("Captured 27-launch-film-noise.png");

  // Wait for scene 2 (thesis) around t=5s
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "28-launch-film-thesis.png") });
  console.log("Captured 28-launch-film-thesis.png");

  // Wait for scene 3 (roulette) around t=9s
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "29-launch-film-roulette.png") });
  console.log("Captured 29-launch-film-roulette.png");

  // Wait for photobooth scene around t=12.5s
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "30-launch-film-photobooth.png") });
  console.log("Captured 30-launch-film-photobooth.png");

  // Wait for sanctuary scene around t=20s
  await page.waitForTimeout(7000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "31-launch-film-sanctuary.png") });
  console.log("Captured 31-launch-film-sanctuary.png");

  // Wait for final lockup around t=26s
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "32-launch-film-lockup.png") });
  console.log("Captured 32-launch-film-lockup.png");

  await browser.close();
  console.log("All launch film screenshots captured!");
}

run().catch(console.error);
