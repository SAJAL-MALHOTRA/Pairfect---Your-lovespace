import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  console.log("1. Setting up Whisper Radio test on 92.2 FM...");
  await page.goto("http://localhost:3000/whisper", { waitUntil: "domcontentloaded" });

  await page.evaluate(() => {
    const testWhisper = {
      id: "test-sajal-whisper",
      pair_id: "local-space",
      sender_id: "user-123",
      sender_name: "Sajal Malhotra",
      frequency: 92.2,
      title: "Romantic Whisper",
      audio_url: "blob:http://localhost:3000/invalid-past-session-blob-id", // Dead blob URL from previous session
      duration: 2,
      mood_tag: "romantic",
      created_at: "2026-10-02T10:00:00.000Z",
    };
    localStorage.setItem("pairfect_whispers", JSON.stringify([testWhisper]));
  });

  // Reload to pick up the seeded whisper
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Open Audio Guide drawer and tune directly to 92.2 FM
  console.log("2. Tuning to 92.2 FM via Audio Guide...");
  const guideBtn = page.locator("button:has-text('Audio Guide')").first();
  await guideBtn.click();
  await page.waitForTimeout(800);

  // Click Tune In for the note in the drawer
  const tuneBtn = page.locator("button:has-text('Tune In')").first();
  await tuneBtn.click();
  await page.waitForTimeout(1000);

  // Capture locked frequency on 92.2 FM (matches user screenshot)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "51-whisper-locked-station.png") });
  console.log("Captured 51-whisper-locked-station.png");

  // Click the Play button
  console.log("3. Clicking Whisper Radio Play button...");
  const playBtn = page.locator("button[title='Play']").first();
  await playBtn.click();
  await page.waitForTimeout(800);

  // Capture playing state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "52-whisper-playing-state.png") });
  console.log("Captured 52-whisper-playing-state.png");

  await browser.close();
  console.log("Whisper Radio Playback test completed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
