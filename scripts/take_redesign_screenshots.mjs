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

  const desktopContext = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    permissions: ["camera", "microphone"],
  });

  // 1. Whisper Desktop
  const whisperPage = await desktopContext.newPage();
  await whisperPage.goto("http://localhost:3000/whisper", { waitUntil: "networkidle" });
  await whisperPage.waitForTimeout(1200);
  await whisperPage.screenshot({
    path: path.join(artifactDir, "whisper-redesign-desktop.png"),
  });
  console.log("Captured whisper-redesign-desktop.png");

  // 2. Mixtape Desktop
  const mixtapePage = await desktopContext.newPage();
  await mixtapePage.goto("http://localhost:3000/mixtape", { waitUntil: "networkidle" });
  await mixtapePage.waitForTimeout(1200);
  await mixtapePage.screenshot({
    path: path.join(artifactDir, "mixtape-redesign-desktop.png"),
  });
  console.log("Captured mixtape-redesign-desktop.png");

  // 3. Photobooth Solo Lens Studio Desktop
  const boothPage = await desktopContext.newPage();
  await boothPage.goto("http://localhost:3000/photo-booth", { waitUntil: "networkidle" });
  await boothPage.waitForTimeout(1000);

  // Click "Solo Photobooth" if on lobby screen
  const soloBtn = await boothPage.$("button:has-text('Solo Photobooth')");
  if (soloBtn) {
    await soloBtn.click();
    await boothPage.waitForTimeout(1500);
  }

  await boothPage.screenshot({
    path: path.join(artifactDir, "photobooth-redesign-desktop.png"),
  });
  console.log("Captured photobooth-redesign-desktop.png");

  // 4. Mobile Context
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    permissions: ["camera", "microphone"],
  });

  const mWhisper = await mobileContext.newPage();
  await mWhisper.goto("http://localhost:3000/whisper", { waitUntil: "networkidle" });
  await mWhisper.waitForTimeout(1000);
  await mWhisper.screenshot({
    path: path.join(artifactDir, "whisper-redesign-mobile.png"),
  });

  const mMixtape = await mobileContext.newPage();
  await mMixtape.goto("http://localhost:3000/mixtape", { waitUntil: "networkidle" });
  await mMixtape.waitForTimeout(1000);
  await mMixtape.screenshot({
    path: path.join(artifactDir, "mixtape-redesign-mobile.png"),
  });

  await browser.close();
  console.log("All redesign screenshots captured!");
}

main().catch(console.error);
