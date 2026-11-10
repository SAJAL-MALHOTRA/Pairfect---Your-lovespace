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

  // Context: Authenticated
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

  console.log("Navigating to dashboard first to hydrate user context...");
  await authPage.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 20000 });
  await authPage.waitForTimeout(2000);

  // 1. Playroom Hub
  console.log("Navigating to Playroom Hub via client sidebar link...");
  const playLink = await authPage.$('a[href="/play"]');
  if (playLink) {
    await playLink.click();
  } else {
    await authPage.goto("http://localhost:3000/play");
  }
  await authPage.waitForTimeout(2000);
  console.log("Current URL on Play page:", authPage.url());

  console.log("Capturing 1-playroom-hub.png...");
  await authPage.screenshot({
    path: path.join(artifactDir, "1-playroom-hub.png"),
    fullPage: false,
  });

  // 2. Playroom Quick & Playful filter
  console.log("Clicking Quick & Playful filter...");
  try {
    const quickBtn = await authPage.$("button:has-text('Quick & Playful')");
    if (quickBtn) {
      await quickBtn.click();
      await authPage.waitForTimeout(800);
      console.log("Capturing 2-playroom-quick-filter.png...");
      await authPage.screenshot({
        path: path.join(artifactDir, "2-playroom-quick-filter.png"),
        fullPage: false,
      });
    }
  } catch (e) {
    console.error("Filter click error:", e);
  }

  // 3. Love Match Lobby
  console.log("Navigating to Love Match Lobby...");
  const loveMatchCard = await authPage.$('a[href="/play/love-match"]');
  if (loveMatchCard) {
    await loveMatchCard.click();
  } else {
    await authPage.goto("http://localhost:3000/play/love-match");
  }
  await authPage.waitForTimeout(2000);
  console.log("Current URL on Love Match page:", authPage.url());

  console.log("Capturing 3-love-match-lobby.png...");
  await authPage.screenshot({
    path: path.join(artifactDir, "3-love-match-lobby.png"),
    fullPage: false,
  });

  // 4. Cupid Bot practice game
  console.log("Launching Cupid Bot game...");
  try {
    const botBtn = await authPage.$("button:has-text('Play vs Cupid Bot')");
    if (botBtn) {
      await botBtn.click();
      await authPage.waitForTimeout(1200);
      console.log("Capturing 4-love-match-in-game.png...");
      await authPage.screenshot({
        path: path.join(artifactDir, "4-love-match-in-game.png"),
        fullPage: false,
      });
    }
  } catch (e) {
    console.error("Bot launch error:", e);
  }

  // 7. Love Letter Wax Seal
  console.log("Navigating to Love Letter with sealed sample...");
  const sampleLetter = {
    toName: "Sajal Malhotra",
    fromName: "Tom Holland",
    blocks: [
      { type: "text", value: "You make every ordinary moment feel extraordinary. Happy anniversary, my love!" }
    ],
    style: "classic"
  };
  const shareParam = Buffer.from(unescape(encodeURIComponent(JSON.stringify(sampleLetter)))).toString("base64");
  await authPage.goto(`http://localhost:3000/love-letter?share=${shareParam}`, { waitUntil: "networkidle", timeout: 20000 });
  await authPage.waitForTimeout(2000);
  console.log("Current URL on Love Letter:", authPage.url());

  console.log("Capturing 7-love-letter-view.png...");
  await authPage.screenshot({
    path: path.join(artifactDir, "7-love-letter-view.png"),
    fullPage: false,
  });

  // 8. Guest Incognito View
  console.log("Capturing 8-guest-invite-join.png with clean incognito context...");
  const guestContext = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const guestPage = await guestContext.newPage();
  await guestPage.goto("http://localhost:3000/play/love-match?room=LM-9241", { waitUntil: "networkidle", timeout: 20000 });
  await guestPage.waitForTimeout(1500);
  await guestPage.screenshot({
    path: path.join(artifactDir, "8-guest-invite-join.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("All screenshots updated successfully!");
}

main().catch(console.error);
