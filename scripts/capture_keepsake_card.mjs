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

  const page = await authContext.newPage();
  await page.addInitScript((sess) => {
    window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
  }, session);

  console.log("Hydrating session on /dashboard...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log("Navigating to /play via sidebar...");
  const playLink = await page.waitForSelector('a[href="/play"]', { timeout: 8000 });
  await playLink.click();
  await page.waitForTimeout(1500);

  console.log("Navigating to /play/love-match card...");
  const lmCard = await page.waitForSelector('a[href="/play/love-match"]', { timeout: 8000 });
  await lmCard.click();
  await page.waitForTimeout(2000);

  console.log("Current URL:", page.url());

  console.log("Launching Cupid Bot solo match...");
  const botBtn = await page.waitForSelector("button:has-text('Cupid Bot')", { timeout: 8000 });
  await botBtn.click();
  await page.waitForTimeout(1000);

  for (let q = 1; q <= 10; q++) {
    console.log(`Round ${q} / 10: Picking option...`);
    const optBtn = await page.waitForSelector("button.text-left:not([disabled])", { timeout: 8000 });
    await optBtn.click();

    console.log(`Round ${q} / 10: Waiting for Next button...`);
    const nextBtn = await page.waitForSelector("button:has-text('Next Question'), button:has-text('See Final Match Score')", { timeout: 8000 });
    await nextBtn.click();
    await page.waitForTimeout(800);
  }

  console.log("Waiting for Completion Keepsake Card to appear...");
  await page.waitForSelector("text=PAIRFECT KEEPSAKE · LOVE MATCH", { timeout: 10000 });
  await page.waitForTimeout(1500);

  console.log("Capturing 9-love-match-keepsake-card.png...");
  await page.screenshot({
    path: path.join(artifactDir, "9-love-match-keepsake-card.png"),
    fullPage: false,
  });

  console.log("Clicking 'Pin to Memory Wall 📌' button...");
  const pinBtn = await page.waitForSelector("button:has-text('Pin to Memory Wall')", { timeout: 8000 });
  await pinBtn.click();
  await page.waitForTimeout(2000);

  console.log("Capturing 10-love-match-pinned-keepsake.png...");
  await page.screenshot({
    path: path.join(artifactDir, "10-love-match-pinned-keepsake.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("All keepsake card screenshots successfully captured!");
}

main().catch(console.error);
