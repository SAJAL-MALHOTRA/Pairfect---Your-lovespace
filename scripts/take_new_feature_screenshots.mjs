import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function main() {
  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  let executablePath = possiblePaths.find((p) => p && fs.existsSync(p));

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 950 },
  });

  // 1. Playroom Hub with Mood Filters
  console.log("Navigating to /play...");
  await page.goto("http://localhost:3000/play", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, "screenshot-play-hub.png"),
    fullPage: false,
  });
  console.log("Captured screenshot-play-hub.png");

  // Filter click test on /play
  try {
    const quickBtn = await page.$("button:has-text('Quick & Playful')");
    if (quickBtn) {
      await quickBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(artifactDir, "screenshot-play-quick-filter.png"),
        fullPage: false,
      });
      console.log("Captured screenshot-play-quick-filter.png");
    }
  } catch (e) {
    console.error("Filter click error:", e);
  }

  // 2. Love Match Lobby
  console.log("Navigating to /play/love-match...");
  await page.goto("http://localhost:3000/play/love-match", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, "screenshot-love-match-lobby.png"),
    fullPage: false,
  });
  console.log("Captured screenshot-love-match-lobby.png");

  // 3. Relationship Calendar with Custom Important Dates
  console.log("Navigating to /calendar...");
  await page.goto("http://localhost:3000/calendar", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, "screenshot-calendar-dates.png"),
    fullPage: false,
  });
  console.log("Captured screenshot-calendar-dates.png");

  // Open the Add Date modal in Calendar
  try {
    const addDateBtn = await page.$("button:has-text('Add Important Date')");
    if (addDateBtn) {
      await addDateBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(artifactDir, "screenshot-calendar-modal.png"),
        fullPage: false,
      });
      console.log("Captured screenshot-calendar-modal.png");
    }
  } catch (e) {
    console.error("Modal click error:", e);
  }

  // 4. Love Letter Sealed Envelope
  console.log("Navigating to /love-letter...");
  await page.goto("http://localhost:3000/love-letter", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, "screenshot-love-letter-envelope.png"),
    fullPage: false,
  });
  console.log("Captured screenshot-love-letter-envelope.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((e) => {
  console.error("Screenshot error:", e);
  process.exit(1);
});
