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
  
  let executablePath = possiblePaths.find(p => p && fs.existsSync(p));

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Header & Hero screenshot
  await page.screenshot({
    path: path.join(artifactDir, "verify-hero.png"),
    clip: { x: 0, y: 0, width: 1280, height: 980 },
  });

  // 2. Dynamic Interactive Game Arena
  const arena = await page.$("section:has-text('LIVE MULTIPLAYER PLAYGROUND')");
  if (arena) {
    await arena.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await arena.screenshot({
      path: path.join(artifactDir, "verify-dynamic-arena.png"),
    });
  }

  // 3. Activities carousel
  const activities = await page.$("#activities");
  if (activities) {
    await activities.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await activities.screenshot({
      path: path.join(artifactDir, "verify-activities.png"),
    });
  }

  // 4. Pricing
  const pricing = await page.$("#pricing");
  if (pricing) {
    await pricing.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await pricing.screenshot({
      path: path.join(artifactDir, "verify-pricing.png"),
    });
  }

  console.log("All screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
