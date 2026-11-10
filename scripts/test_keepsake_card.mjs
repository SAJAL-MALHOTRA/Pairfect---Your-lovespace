import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function main() {
  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";
  const session = JSON.parse(fs.readFileSync("scripts/test_session.json", "utf8"));

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const authContext = await browser.newContext({
    viewport: { width: 1280, height: 1100 },
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

  console.log("Navigating to dashboard first...");
  await authPage.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await authPage.waitForTimeout(2000);

  console.log("Navigating to Love Match via sidebar...");
  const playLink = await authPage.$('a[href="/play"]');
  if (playLink) await playLink.click();
  await authPage.waitForTimeout(1500);

  const loveMatchCard = await authPage.$('a[href="/play/love-match"]');
  if (loveMatchCard) await loveMatchCard.click();
  await authPage.waitForTimeout(2000);

  console.log("Starting Cupid Bot solo game...");
  const botBtn = await authPage.$("button:has-text('Play vs Cupid Bot')");
  if (botBtn) await botBtn.click();
  await authPage.waitForTimeout(1500);

  console.log("Playing through questions...");
  for (let q = 1; q <= 10; q++) {
    console.log(`Answering Question ${q}...`);
    const optBtn = await authPage.waitForSelector("button.text-left:not([disabled])", { timeout: 8000 });
    await optBtn.click();

    console.log(`Waiting for reveal and next button on Question ${q}...`);
    const nextBtn = await authPage.waitForSelector("button:has-text('Next Question'), button:has-text('See Final Match Score')", { timeout: 8000 });
    await nextBtn.click();
    await authPage.waitForTimeout(600);
  }

  console.log("Waiting for Completion Screen & Keepsake Card animation...");
  await authPage.waitForSelector("text=PAIRFECT KEEPSAKE · LOVE MATCH", { timeout: 8000 });
  await authPage.waitForTimeout(1500);

  console.log("Capturing 9-love-match-keepsake-card.png...");
  await authPage.screenshot({
    path: path.join(artifactDir, "9-love-match-keepsake-card.png"),
    fullPage: false,
  });

  // Click Pin to Memory Wall
  const pinBtn = await authPage.$("button:has-text('Pin to Memory Wall')");
  if (pinBtn) {
    console.log("Clicking Pin to Memory Wall button...");
    await pinBtn.click();
    await authPage.waitForTimeout(1500);
    console.log("Capturing 10-love-match-pinned-keepsake.png...");
    await authPage.screenshot({
      path: path.join(artifactDir, "10-love-match-pinned-keepsake.png"),
      fullPage: false,
    });
  }

  await browser.close();
  console.log("Post-Game Keepsake Card verification completed!");
}

main().catch(console.error);
