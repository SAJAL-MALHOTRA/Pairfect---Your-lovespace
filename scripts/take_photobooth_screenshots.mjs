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

  const executablePath = possiblePaths.find((p) => p && fs.existsSync(p));

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  console.log("Navigating to http://localhost:3000/photo-booth...");
  await page.goto("http://localhost:3000/photo-booth", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 1. Capture screen desktop
  console.log("Taking capture screen desktop screenshot...");
  await page.screenshot({
    path: path.join(artifactDir, "photobooth-capture-desktop.png"),
    fullPage: false,
  });

  // 2. Click capture button to trigger sequence
  console.log("Clicking Capture button...");
  const captureBtn = await page.getByRole("button", { name: "Capture" });
  if (captureBtn) {
    await captureBtn.click();
    console.log("Waiting for result screen...");
    await page.waitForSelector("text=Picture perfect!", { timeout: 25000 });
    await page.waitForTimeout(1500);

    console.log("Taking result screen desktop screenshot...");
    await page.screenshot({
      path: path.join(artifactDir, "photobooth-result-desktop.png"),
      fullPage: false,
    });

    // 3. Switch style to Retro Film and take a screenshot
    const retroBtn = await page.getByRole("button", { name: "Retro Film" });
    if (retroBtn) {
      await retroBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(artifactDir, "photobooth-result-retro-desktop.png"),
        fullPage: false,
      });
    }

    // 4. Switch style to Classic and select Soft Warm filter
    const classicBtn = await page.getByRole("button", { name: "Classic" });
    if (classicBtn) {
      await classicBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(artifactDir, "photobooth-result-classic-desktop.png"),
        fullPage: false,
      });
    }
  }

  // 5. Mobile result screen
  console.log("Testing mobile viewport...");
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });

  await mobilePage.goto("http://localhost:3000/photo-booth", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1500);

  const mobileCaptureBtn = await mobilePage.getByRole("button", { name: "Capture" });
  if (mobileCaptureBtn) {
    await mobileCaptureBtn.click();
    await mobilePage.waitForSelector("text=Picture perfect!", { timeout: 25000 });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({
      path: path.join(artifactDir, "photobooth-result-mobile.png"),
      fullPage: false,
    });
  }

  await browser.close();
  console.log("All screenshots taken successfully!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
