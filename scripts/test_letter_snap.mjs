import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function run() {
  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });

  const sampleLetter = {
    toName: "Sajal Malhotra",
    fromName: "Tom Holland",
    blocks: [
      { type: "text", value: "You make every ordinary moment feel extraordinary. Happy anniversary, my love!" }
    ],
    style: "classic"
  };
  const shareParam = Buffer.from(unescape(encodeURIComponent(JSON.stringify(sampleLetter)))).toString("base64");
  const letterUrl = `http://localhost:3000/love-letter?share=${shareParam}`;

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) console.log("NAVIGATED TO:", frame.url());
  });

  console.log("Navigating to share URL:", letterUrl);
  await page.goto(letterUrl, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log("Current page URL:", page.url());

  await page.screenshot({
    path: path.join(artifactDir, "7-love-letter-view.png"),
    fullPage: false,
  });
  console.log("Screenshot 7-love-letter-view.png saved!");

  await browser.close();
}

run().catch(console.error);
