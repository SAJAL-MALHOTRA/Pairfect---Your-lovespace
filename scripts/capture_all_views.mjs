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

  // ── Context A: Authenticated Context ──
  const authContext = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });

  const cookieVal = encodeURIComponent(JSON.stringify(session));
  await authContext.addCookies([
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

  const authPage = await authContext.newPage();
  await authPage.addInitScript((sess) => {
    window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
  }, session);

  // 1. Playroom Hub (All Activities)
  console.log("Capturing 1. Playroom Hub...");
  await authPage.goto("http://localhost:3000/play", { waitUntil: "networkidle", timeout: 20000 });
  await authPage.waitForTimeout(1000);
  await authPage.screenshot({
    path: path.join(artifactDir, "1-playroom-hub.png"),
    fullPage: false,
  });

  // 2. Playroom Hub Filtered (Quick & Playful)
  console.log("Capturing 2. Playroom Filtered...");
  try {
    const quickPill = await authPage.$("button:has-text('Quick & Playful')");
    if (quickPill) {
      await quickPill.click();
      await authPage.waitForTimeout(600);
      await authPage.screenshot({
        path: path.join(artifactDir, "2-playroom-quick-filter.png"),
        fullPage: false,
      });
    }
  } catch (e) {
    console.error("Filter error:", e);
  }

  // 3. Love Match Lobby (Authenticated / Host)
  console.log("Capturing 3. Love Match Lobby...");
  await authPage.goto("http://localhost:3000/play/love-match", { waitUntil: "networkidle", timeout: 20000 });
  await authPage.waitForTimeout(1000);
  await authPage.screenshot({
    path: path.join(artifactDir, "3-love-match-lobby.png"),
    fullPage: false,
  });

  // 4. Love Match In-Game (vs Cupid Bot solo mode)
  console.log("Capturing 4. Love Match In-Game (Cupid Bot)...");
  try {
    const botBtn = await authPage.$("button:has-text('Play vs Cupid Bot')");
    if (botBtn) {
      await botBtn.click();
      await authPage.waitForTimeout(1000);
      await authPage.screenshot({
        path: path.join(artifactDir, "4-love-match-in-game.png"),
        fullPage: false,
      });
    }
  } catch (e) {
    console.error("Bot launch error:", e);
  }

  // 5. Relationship Calendar with Custom Dates
  console.log("Capturing 5. Calendar Page...");
  await authPage.goto("http://localhost:3000/calendar", { waitUntil: "networkidle", timeout: 20000 });
  await authPage.waitForTimeout(1000);
  await authPage.screenshot({
    path: path.join(artifactDir, "5-calendar-milestones.png"),
    fullPage: false,
  });

  // 6. Calendar "Add Important Date" Modal
  console.log("Capturing 6. Add Date Modal...");
  try {
    const addDateBtn = await authPage.$("button:has-text('Add Important Date')");
    if (addDateBtn) {
      await addDateBtn.click();
      await authPage.waitForTimeout(600);
      await authPage.screenshot({
        path: path.join(artifactDir, "6-calendar-add-modal.png"),
        fullPage: false,
      });
    }
  } catch (e) {
    console.error("Modal open error:", e);
  }

  // 7. Love Letter Sealed Envelope Reader
  console.log("Capturing 7. Love Letter Wax Seal...");
  // Load letter inbox or create test preview
  await authPage.goto("http://localhost:3000/love-letter", { waitUntil: "networkidle", timeout: 20000 });
  await authPage.waitForTimeout(1500);

  // Check if there are letters in inbox to click "Read" or "Break Seal"
  const unsealBtn = await authPage.$("button:has-text('Break Seal'), button:has-text('Unseal'), button:has-text('Read')");
  if (unsealBtn) {
    await unsealBtn.click();
    await authPage.waitForTimeout(1000);
  }
  await authPage.screenshot({
    path: path.join(artifactDir, "7-love-letter-view.png"),
    fullPage: false,
  });

  // ── Context B: Guest Incognito Context (Unauthenticated Guest Joining via Link) ──
  console.log("Capturing 8. Guest One-Click Join View...");
  const guestContext = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const guestPage = await guestContext.newPage();
  await guestPage.goto("http://localhost:3000/play/love-match?room=LM-9241", { waitUntil: "networkidle", timeout: 20000 });
  await guestPage.waitForTimeout(1000);
  await guestPage.screenshot({
    path: path.join(artifactDir, "8-guest-invite-join.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("All screenshots successfully captured!");
}

main().catch((e) => {
  console.error("Execution error:", e);
  process.exit(1);
});
