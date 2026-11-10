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
  await page.waitForTimeout(1000);

  // 1. Lobby screen
  console.log("Taking lobby screenshot...");
  await page.screenshot({
    path: path.join(artifactDir, "photobooth-lobby-desktop.png"),
    fullPage: false,
  });

  // 2. Click Launch Solo Photobooth
  console.log("Clicking Launch Solo Photobooth...");
  const soloBtn = page.getByRole("button", { name: /Launch Solo Photobooth/i });
  await soloBtn.click();
  await page.waitForTimeout(1500);

  console.log("Taking solo capture view screenshot...");
  await page.screenshot({
    path: path.join(artifactDir, "photobooth-solo-desktop.png"),
    fullPage: false,
  });

  // 3. Click Modes to return to lobby
  console.log("Clicking Modes back button...");
  const modesBtn = page.getByRole("button", { name: /Modes/i });
  await modesBtn.click();
  await page.waitForTimeout(1000);

  // 4. Click Invite Duo with Code
  console.log("Clicking Invite Duo with Code...");
  const duoBtn = page.getByRole("button", { name: /Invite Duo with Code/i });
  await duoBtn.click();
  await page.waitForTimeout(1500);

  console.log("Taking duo capture view with modal screenshot...");
  await page.screenshot({
    path: path.join(artifactDir, "photobooth-duo-invite-desktop.png"),
    fullPage: false,
  });

  // 5. Close modal to view the duo viewfinder with friendly waiting state
  const closeBtn = page.getByRole("button", { name: /Close|Got it/i });
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(600);
    console.log("Taking duo viewfinder waiting state screenshot...");
    await page.screenshot({
      path: path.join(artifactDir, "photobooth-duo-waiting-desktop.png"),
      fullPage: false,
    });
  }

  await browser.close();
  console.log("All mode screenshots taken successfully!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
