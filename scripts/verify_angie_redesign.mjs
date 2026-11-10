import { chromium } from "playwright";

const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";
const port = 3002;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  console.log("Launching browser for Angie redesign visual verification...");
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  try {
    // 1. Desktop Context (1440x950)
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopCtx.newPage();

    console.log("Navigating to Landing Page (Desktop)...");
    await desktopPage.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(2000);

    // Hero Section
    await desktopPage.screenshot({
      path: `${artifactDir}/88-landing-hero-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 88-landing-hero-desktop.png");

    // Full Landing Page
    await desktopPage.screenshot({
      path: `${artifactDir}/89-landing-full-desktop.png`,
      fullPage: true,
    });
    console.log("Captured 89-landing-full-desktop.png");

    // Activities Carousel Section
    const activitiesSection = desktopPage.locator("#activities");
    if (await activitiesSection.count() > 0) {
      await activitiesSection.scrollIntoViewIfNeeded();
      await desktopPage.waitForTimeout(1000);
      await desktopPage.screenshot({
        path: `${artifactDir}/90-landing-activities-carousel.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Captured 90-landing-activities-carousel.png");
    }

    // Photobooth Lobby Screen (/photo-booth)
    console.log("Navigating to /photo-booth...");
    await desktopPage.goto(`http://localhost:${port}/photo-booth`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(2000);

    await desktopPage.screenshot({
      path: `${artifactDir}/91-photobooth-lobby-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 91-photobooth-lobby-desktop.png");

    // 2. Mobile Context (390x844 iPhone 14)
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileCtx.newPage();

    console.log("Navigating to Landing Page (Mobile)...");
    await mobilePage.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(2000);

    await mobilePage.screenshot({
      path: `${artifactDir}/92-landing-hero-mobile.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 92-landing-hero-mobile.png");

    await mobilePage.screenshot({
      path: `${artifactDir}/93-landing-full-mobile.png`,
      fullPage: true,
    });
    console.log("Captured 93-landing-full-mobile.png");

    console.log("Navigating to /photo-booth (Mobile)...");
    await mobilePage.goto(`http://localhost:${port}/photo-booth`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(2000);

    await mobilePage.screenshot({
      path: `${artifactDir}/94-photobooth-lobby-mobile.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 94-photobooth-lobby-mobile.png");

    console.log("All visual verification captures complete!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
