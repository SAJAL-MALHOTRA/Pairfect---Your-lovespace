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
  const page = await browser.newPage({ viewport: { width: 1200, height: 600 } });
  
  const imgPath = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/.user_uploaded/media_1790689658967.png";
  const b64 = fs.readFileSync(imgPath).toString("base64");
  const html = `
    <html>
      <body style="margin:0;padding:0;background:#fff;">
        <img id="myimg" src="data:image/png;base64,${b64}" style="display:block;" />
      </body>
    </html>
  `;
  await page.setContent(html);
  await page.waitForTimeout(500);

  const artifactDir = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

  // 1. Logo and wordmark
  await page.screenshot({
    path: path.join(artifactDir, "crop-logo.png"),
    clip: { x: 80, y: 20, width: 160, height: 50 }
  });

  // 2. Top ribbon
  await page.screenshot({
    path: path.join(artifactDir, "crop-top.png"),
    clip: { x: 300, y: 0, width: 420, height: 26 }
  });

  // 3. Middle nav
  await page.screenshot({
    path: path.join(artifactDir, "crop-nav.png"),
    clip: { x: 230, y: 20, width: 440, height: 50 }
  });

  // 4. Right controls
  await page.screenshot({
    path: path.join(artifactDir, "crop-right.png"),
    clip: { x: 670, y: 20, width: 340, height: 50 }
  });

  console.log("All crops saved successfully");
  await browser.close();
}

main().catch(console.error);
