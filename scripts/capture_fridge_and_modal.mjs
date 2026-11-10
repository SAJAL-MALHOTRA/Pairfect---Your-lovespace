import { chromium } from "playwright";
import fs from "fs";

const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";
const port = 3002;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const session = JSON.parse(fs.readFileSync("C:\\Users\\2006s\\.gemini\\antigravity\\scratch\\hoedex\\scripts\\test_session.json", "utf8"));
const cookieVal = encodeURIComponent(JSON.stringify(session));

async function setupPage(ctx) {
  await ctx.addCookies([
    {
      name: "sb-vhykmhfrptyjkagwetku-auth-token",
      value: cookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
  const page = await ctx.newPage();
  await page.addInitScript((sess) => {
    window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
  }, session);
  return page;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  try {
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 2,
    });

    // 1. Landing Page Keepsake Fridge & Activities Carousel
    console.log("Navigating to Landing Page...");
    const landingPage = await desktopCtx.newPage();
    await landingPage.goto(`http://localhost:${port}/`, { waitUntil: "networkidle", timeout: 20000 });
    await landingPage.waitForTimeout(2000);

    // Scroll to Activities Carousel
    const carouselHeading = landingPage.locator("text='Pick tonight's activity'").first();
    if (await carouselHeading.count() > 0) {
      await carouselHeading.scrollIntoViewIfNeeded();
      await landingPage.waitForTimeout(1000);
      await landingPage.screenshot({
        path: `${artifactDir}/115-landing-activities-carousel.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Captured 115-landing-activities-carousel.png");
    }

    // Scroll to Keepsake Fridge
    const fridgeText = landingPage.locator("text='PAIRFECT RETRO FRIDGE'").first();
    if (await fridgeText.count() > 0) {
      await fridgeText.scrollIntoViewIfNeeded();
      await landingPage.waitForTimeout(1000);
      await landingPage.screenshot({
        path: `${artifactDir}/111-landing-fridge-desktop.png`,
      });
      console.log("Captured 111-landing-fridge-desktop.png");
    }
    await landingPage.close();

    // 2. Play Page: Milestone Modal & 3D Dice
    console.log("Navigating to /play...");
    const playPage = await setupPage(desktopCtx);
    await playPage.goto(`http://localhost:${port}/play`, { waitUntil: "networkidle", timeout: 20000 });
    await playPage.waitForTimeout(2000);

    // Click on the first node: "Online Photobooth"
    console.log("Triggering Milestone Modal on /play...");
    const nodeEl = playPage.locator("div.cursor-pointer:has-text('Online Photobooth')").first();
    if (await nodeEl.count() > 0) {
      await nodeEl.click({ force: true });
      await playPage.waitForTimeout(1000);
      await playPage.screenshot({
        path: `${artifactDir}/114-play-milestone-modal-desktop.png`,
      });
      console.log("Captured 114-play-milestone-modal-desktop.png");
    }

    // Scroll down to Chapter 3 (Play & Duel) with 3D Dice
    console.log("Scrolling to Chapter 3 with 3D Dice...");
    // Close modal if open
    await playPage.keyboard.press("Escape");
    await playPage.waitForTimeout(500);

    const ch3Heading = playPage.locator("text='Play & Duel'").first();
    if (await ch3Heading.count() > 0) {
      await ch3Heading.scrollIntoViewIfNeeded();
      await playPage.waitForTimeout(1000);
      await playPage.screenshot({
        path: `${artifactDir}/116-play-3d-dice-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Captured 116-play-3d-dice-desktop.png");
    }
    await playPage.close();

    console.log("Detailed captures done!");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
