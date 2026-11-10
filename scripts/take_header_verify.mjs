import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function main() {
  const possiblePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  let executablePath = possiblePaths.find(p => p && fs.existsSync(p));

  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

  // Capture header only
  await page.screenshot({
    path: path.join(artifactDir, "verify-new-header.png"),
    clip: { x: 0, y: 0, width: 1280, height: 110 }
  });

  // Also capture full hero top view
  await page.screenshot({
    path: path.join(artifactDir, "verify-hero-with-header.png"),
    clip: { x: 0, y: 0, width: 1280, height: 600 }
  });

  console.log("Header screenshots saved!");
  await browser.close();
}

main().catch(console.error);
