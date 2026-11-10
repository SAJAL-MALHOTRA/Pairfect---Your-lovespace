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
  
  const executablePath = possiblePaths.find(p => p && fs.existsSync(p));

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  // Mobile scroll down to active player card
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  await mobilePage.goto("http://localhost:3002/whisper", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.evaluate(() => window.scrollBy(0, 420));
  await mobilePage.waitForTimeout(500);

  await mobilePage.screenshot({
    path: path.join(artifactDir, "81-whisper-fm-mobile-player-card.png"),
    fullPage: false,
  });
  console.log("Captured 81-whisper-fm-mobile-player-card.png");

  await browser.close();
}

main().catch(console.error);
