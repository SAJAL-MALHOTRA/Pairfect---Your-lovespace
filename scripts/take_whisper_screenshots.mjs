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

  // 1. Desktop Screenshot
  const page = await browser.newPage({
    viewport: { width: 1280, height: 950 },
  });

  await page.goto("http://localhost:3000/whisper", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(artifactDir, "whisper-desktop.png"),
    fullPage: false,
  });

  // 2. Open Recorder Modal
  const recordBtn = await page.$("button:has-text('Drop Whisper')");
  if (recordBtn) {
    await recordBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(artifactDir, "whisper-recorder-modal.png"),
      fullPage: false,
    });
  }

  // 3. Mobile Viewport Screenshot
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  await mobilePage.goto("http://localhost:3000/whisper", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.screenshot({
    path: path.join(artifactDir, "whisper-mobile.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("Whisper screenshots captured successfully!");
}

main().catch(console.error);
