import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

  await page.goto("http://localhost:3000/play", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Expand the soundscape bar
  const expandBtn = page.locator("button[title*='soundscape'] , button[title*='ambient'] , button:has-text('Soundscape')").first();
  if (await expandBtn.isVisible()) {
    // Click chevron to expand
    const chevron = page.locator("button[title*='Change soundscape']").first();
    if (await chevron.isVisible()) {
      await chevron.click();
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "17-playroom-soundscape-bar.png") });
  console.log("Captured 17-playroom-soundscape-bar.png");

  await browser.close();
}

run().catch(console.error);
