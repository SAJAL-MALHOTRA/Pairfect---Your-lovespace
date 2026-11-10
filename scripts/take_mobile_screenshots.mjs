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
  // Test iPhone 14/15/16 viewport: 390x844
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForSelector('#why-pairfect', { timeout: 20000 });
  await page.waitForTimeout(500);

  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

  // 1. Mobile Hero & Header (390x844)
  await page.screenshot({
    path: path.join(artifactDir, "mobile-hero.png"),
    clip: { x: 0, y: 0, width: 390, height: 844 }
  });

  // 2. Extra small mobile check (375x667)
  const page375 = await browser.newPage({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page375.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page375.waitForSelector('#why-pairfect', { timeout: 20000 });
  await page375.waitForTimeout(500);
  await page375.screenshot({
    path: path.join(artifactDir, "mobile-hero-375.png"),
    clip: { x: 0, y: 0, width: 375, height: 667 }
  });
  await page375.close();

  // 3. Mobile Photobooth Kiosk
  const kiosk = await page.$(".photobooth-cabinet");
  if (kiosk) {
    await kiosk.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await kiosk.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(artifactDir, "mobile-kiosk.png"),
        clip: { x: 0, y: Math.max(0, box.y - 40), width: 390, height: 750 }
      });
    }
  }

  // 4. Dynamic Arena - Wax Letter Tab
  const arena = await page.$("#playground");
  if (arena) {
    await arena.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const letterTab = await page.$("button:has-text('Wax Letter')");
    if (letterTab) {
      await letterTab.click();
      await page.waitForTimeout(500);

      const box = await arena.boundingBox();
      if (box) {
        // Screenshot 4a: Sealed State
        await page.screenshot({
          path: path.join(artifactDir, "mobile-wax-sealed.png"),
          clip: { x: 0, y: Math.max(0, box.y), width: 390, height: 800 }
        });

        // Click Wax Seal to trigger Break & Unseal
        const sealButton = await page.$("button:has-text('Tap Seal to Break Wax')");
        if (sealButton) {
          console.log("Clicking wax seal to break...");
          await sealButton.click();
          await page.waitForTimeout(700); // allow shard animation and unseal

          // Screenshot 4b: Unsealed State with Polaroid & Reseal Button
          await page.screenshot({
            path: path.join(artifactDir, "mobile-wax-unsealed.png"),
            clip: { x: 0, y: Math.max(0, box.y), width: 390, height: 820 }
          });

          // Click Pack & Reseal Capsule Button
          const resealButton = await page.$("button:has-text('Pack & Reseal Capsule')");
          if (resealButton) {
            console.log("Clicking pack & reseal capsule...");
            await resealButton.click();
            await page.waitForTimeout(700); // allow pack animation

            // Screenshot 4c: Resealed State
            await page.screenshot({
              path: path.join(artifactDir, "mobile-wax-resealed.png"),
              clip: { x: 0, y: Math.max(0, box.y), width: 390, height: 800 }
            });
          }
        }
      }
    }
  }

  // 5. Mobile Activities
  const activities = await page.$("#activities");
  if (activities) {
    await activities.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await activities.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(artifactDir, "mobile-activities.png"),
        clip: { x: 0, y: Math.max(0, box.y), width: 390, height: 800 }
      });
    }
  }

  // 6. Mobile Pricing
  const pricing = await page.$("#pricing");
  if (pricing) {
    await pricing.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await pricing.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(artifactDir, "mobile-pricing.png"),
        clip: { x: 0, y: Math.max(0, box.y), width: 390, height: 800 }
      });
    }
  }

  console.log("All mobile screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
