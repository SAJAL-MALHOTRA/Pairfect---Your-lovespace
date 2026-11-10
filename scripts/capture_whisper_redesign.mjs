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

  // 1. Desktop Screenshot (1280x950)
  const page = await browser.newPage({
    viewport: { width: 1280, height: 950 },
  });

  await page.goto("http://localhost:3002/whisper", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(artifactDir, "77-whisper-fm-desktop-redesign.png"),
    fullPage: false,
  });
  console.log("Captured 77-whisper-fm-desktop-redesign.png");

  // 2. Open Recorder Modal
  const recordBtn = await page.$("button:has-text('Drop Whisper')");
  if (recordBtn) {
    await recordBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(artifactDir, "79-whisper-recorder-modal-redesign.png"),
      fullPage: false,
    });
    console.log("Captured 79-whisper-recorder-modal-redesign.png");

    // Close modal
    const closeBtn = await page.$("button:has(.lucide-x)");
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 3. Open Audio Guide Drawer
  const guideBtn = await page.$("button:has-text('Audio Guide')");
  if (guideBtn) {
    await guideBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(artifactDir, "80-whisper-audio-guide-drawer-redesign.png"),
      fullPage: false,
    });
    console.log("Captured 80-whisper-audio-guide-drawer-redesign.png");
  }

  // 4. Mobile Viewport Screenshot (390x844)
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  await mobilePage.goto("http://localhost:3002/whisper", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1500);

  await mobilePage.screenshot({
    path: path.join(artifactDir, "78-whisper-fm-mobile-redesign.png"),
    fullPage: false,
  });
  console.log("Captured 78-whisper-fm-mobile-redesign.png");

  await browser.close();
  console.log("All Whisper FM redesign screenshots captured successfully!");
}

main().catch(console.error);
