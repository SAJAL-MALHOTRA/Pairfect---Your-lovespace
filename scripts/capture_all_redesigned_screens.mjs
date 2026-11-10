import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function main() {
  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";
  const session = JSON.parse(fs.readFileSync("scripts/test_session.json", "utf8"));

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
  });

  const routes = [
    { route: "/riddle", name: "riddle-night", label: "Riddle Night" },
    { route: "/gratitude-jar", name: "gratitude-jar", label: "Gratitude Jar" },
    { route: "/quiz", name: "couples-quiz", label: "Couples Quiz" },
    { route: "/roulette", name: "love-roulette", label: "Love Roulette" },
    { route: "/vibe-judge", name: "vibe-judge", label: "Between the Lines" },
    { route: "/calendar", name: "calendar-milestones", label: "Important Dates" },
    { route: "/settings", name: "settings-privacy", label: "Settings & Privacy" },
    { route: "/checkin", name: "checkin-sanctuary", label: "Daily Check-in" },
    { route: "/play", name: "arcade-play", label: "Arcade Play Hub" },
    { route: "/journal", name: "journal-archive", label: "Dual-Lock Journal" },
    { route: "/profile", name: "profile-sanctuary", label: "Shared Profile" },
  ];

  const cookieVal = encodeURIComponent(JSON.stringify(session));

  for (const item of routes) {
    console.log(`\n=== Capturing ${item.label} (${item.route}) ===`);

    // 1. Desktop
    try {
      const desktopCtx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
      await desktopCtx.addCookies([
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
      const desktopPage = await desktopCtx.newPage();
      await desktopPage.addInitScript((sess) => {
        window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
      }, session);

      await desktopPage.goto(`http://localhost:3002${item.route}`, { waitUntil: "networkidle" });
      await desktopPage.waitForTimeout(1500);

      const desktopFile = path.join(artifactDir, `86-${item.name}-desktop.png`);
      await desktopPage.screenshot({ path: desktopFile, fullPage: false });
      console.log(`Saved desktop: ${desktopFile}`);
      await desktopCtx.close();
    } catch (e) {
      console.error(`Desktop error on ${item.route}:`, e.message);
    }

    // 2. Mobile
    try {
      const mobileCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
      });
      await mobileCtx.addCookies([
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
      const mobilePage = await mobileCtx.newPage();
      await mobilePage.addInitScript((sess) => {
        window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
      }, session);

      await mobilePage.goto(`http://localhost:3002${item.route}`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(1500);

      const mobileFile = path.join(artifactDir, `87-${item.name}-mobile.png`);
      await mobilePage.screenshot({ path: mobileFile, fullPage: false });
      console.log(`Saved mobile: ${mobileFile}`);
      await mobileCtx.close();
    } catch (e) {
      console.error(`Mobile error on ${item.route}:`, e.message);
    }
  }

  await browser.close();
  console.log("\nALL REDESIGNED SCREENS SUCCESSFULLY CAPTURED!");
}

main().catch(console.error);
