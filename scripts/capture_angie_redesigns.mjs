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
  console.log("Launching Chromium for comprehensive Angie screens capture...");
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  try {
    // ══════════════════════════════════════════════════
    // 1. Desktop Context (1440x950)
    // ══════════════════════════════════════════════════
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 2,
    });

    // 1. Dashboard Desktop
    console.log("Capturing Dashboard (Desktop)...");
    const dashPage = await setupPage(desktopCtx);
    await dashPage.goto(`http://localhost:${port}/dashboard`, { waitUntil: "networkidle", timeout: 20000 });
    await dashPage.waitForTimeout(2000);
    await dashPage.screenshot({
      path: `${artifactDir}/95-dashboard-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 95-dashboard-desktop.png");

    await dashPage.screenshot({
      path: `${artifactDir}/96-dashboard-full-desktop.png`,
      fullPage: true,
    });
    console.log("Captured 96-dashboard-full-desktop.png");

    // Paywall Modal Trigger on Dashboard (click streak card)
    console.log("Triggering Paywall Modal on Dashboard...");
    const streakCard = dashPage.locator(".bg-\\[\\#22C55E\\]").first();
    if (await streakCard.count() > 0) {
      await streakCard.click();
      await dashPage.waitForTimeout(1000);
      await dashPage.screenshot({
        path: `${artifactDir}/104-paywall-modal-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Captured 104-paywall-modal-desktop.png");
    }
    await dashPage.close();

    // 2. Play / The Love Path Desktop
    console.log("Capturing The Love Path /play (Desktop)...");
    const playPage = await setupPage(desktopCtx);
    await playPage.goto(`http://localhost:${port}/play`, { waitUntil: "networkidle", timeout: 20000 });
    await playPage.waitForTimeout(2000);
    await playPage.screenshot({
      path: `${artifactDir}/97-play-lovepath-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 97-play-lovepath-desktop.png");

    await playPage.screenshot({
      path: `${artifactDir}/98-play-lovepath-full-desktop.png`,
      fullPage: true,
    });
    console.log("Captured 98-play-lovepath-full-desktop.png");
    await playPage.close();

    // 3. Profile Desktop
    console.log("Capturing Profile (Desktop)...");
    const profilePage = await setupPage(desktopCtx);
    await profilePage.goto(`http://localhost:${port}/profile`, { waitUntil: "networkidle", timeout: 20000 });
    await profilePage.waitForTimeout(2000);
    await profilePage.screenshot({
      path: `${artifactDir}/99-profile-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 99-profile-desktop.png");

    // Trigger Paywall Modal from Profile ("Try Unlimited" button)
    console.log("Triggering Paywall Modal on Profile...");
    const tryUnlimitedBtn = profilePage.locator("button:has-text('Try Unlimited')").first();
    if (await tryUnlimitedBtn.count() > 0) {
      await tryUnlimitedBtn.click();
      await profilePage.waitForTimeout(1000);
      await profilePage.screenshot({
        path: `${artifactDir}/107-paywall-modal-profile-trigger.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Captured 107-paywall-modal-profile-trigger.png");
    }
    await profilePage.close();

    // 4. Settings Desktop
    console.log("Capturing Settings (Desktop)...");
    const settingsPage = await setupPage(desktopCtx);
    await settingsPage.goto(`http://localhost:${port}/settings`, { waitUntil: "networkidle", timeout: 20000 });
    await settingsPage.waitForTimeout(2000);
    await settingsPage.screenshot({
      path: `${artifactDir}/100-settings-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 100-settings-desktop.png");
    await settingsPage.close();

    // 5. Game Lobby /play/love-match Desktop
    console.log("Capturing Love Match Lobby (Desktop)...");
    const lobbyPage = await setupPage(desktopCtx);
    await lobbyPage.goto(`http://localhost:${port}/play/love-match`, { waitUntil: "networkidle", timeout: 20000 });
    await lobbyPage.waitForTimeout(2000);
    await lobbyPage.screenshot({
      path: `${artifactDir}/101-lovematch-lobby-desktop.png`,
      clip: { x: 0, y: 0, width: 1440, height: 950 },
    });
    console.log("Captured 101-lovematch-lobby-desktop.png");
    await lobbyPage.close();

    // ══════════════════════════════════════════════════
    // 2. Mobile Context (390x844 iPhone 14)
    // ══════════════════════════════════════════════════
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });

    // Mobile Dashboard
    console.log("Capturing Dashboard (Mobile)...");
    const mobileDashPage = await setupPage(mobileCtx);
    await mobileDashPage.goto(`http://localhost:${port}/dashboard`, { waitUntil: "networkidle", timeout: 20000 });
    await mobileDashPage.waitForTimeout(2000);
    await mobileDashPage.screenshot({
      path: `${artifactDir}/102-dashboard-mobile.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 102-dashboard-mobile.png");

    // Trigger Paywall on Mobile
    const mobileStreak = mobileDashPage.locator(".bg-\\[\\#22C55E\\]").first();
    if (await mobileStreak.count() > 0) {
      await mobileStreak.click();
      await mobileDashPage.waitForTimeout(1000);
      await mobileDashPage.screenshot({
        path: `${artifactDir}/108-paywall-modal-mobile.png`,
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
      console.log("Captured 108-paywall-modal-mobile.png");
    }
    await mobileDashPage.close();

    // Mobile Love Path
    console.log("Capturing The Love Path (Mobile)...");
    const mobilePlayPage = await setupPage(mobileCtx);
    await mobilePlayPage.goto(`http://localhost:${port}/play`, { waitUntil: "networkidle", timeout: 20000 });
    await mobilePlayPage.waitForTimeout(2000);
    await mobilePlayPage.screenshot({
      path: `${artifactDir}/103-play-lovepath-mobile.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 103-play-lovepath-mobile.png");
    await mobilePlayPage.close();

    // Mobile Profile
    console.log("Capturing Profile (Mobile)...");
    const mobileProfilePage = await setupPage(mobileCtx);
    await mobileProfilePage.goto(`http://localhost:${port}/profile`, { waitUntil: "networkidle", timeout: 20000 });
    await mobileProfilePage.waitForTimeout(2000);
    await mobileProfilePage.screenshot({
      path: `${artifactDir}/105-profile-mobile.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 105-profile-mobile.png");
    await mobileProfilePage.close();

    // Mobile Settings
    console.log("Capturing Settings (Mobile)...");
    const mobileSettingsPage = await setupPage(mobileCtx);
    await mobileSettingsPage.goto(`http://localhost:${port}/settings`, { waitUntil: "networkidle", timeout: 20000 });
    await mobileSettingsPage.waitForTimeout(2000);
    await mobileSettingsPage.screenshot({
      path: `${artifactDir}/106-settings-mobile.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 106-settings-mobile.png");
    await mobileSettingsPage.close();

    console.log("All visual verification captures completed successfully!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Visual verification script error:", err);
  process.exit(1);
});
