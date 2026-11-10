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

  const authContext = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
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

  console.log("Navigating to dashboard...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const playLink = await page.waitForSelector('a[href="/play"]');
  await playLink.click();
  await page.waitForTimeout(1200);

  const lmCard = await page.waitForSelector('a[href="/play/love-match"]');
  await lmCard.click();
  await page.waitForTimeout(1500);

  const botBtn = await page.waitForSelector("button:has-text('Cupid Bot')");
  await botBtn.click();
  await page.waitForTimeout(1000);

  for (let q = 1; q <= 10; q++) {
    const optBtn = await page.waitForSelector("button.text-left:not([disabled])", { timeout: 8000 });
    await optBtn.click();
    const nextBtn = await page.waitForSelector("button:has-text('Next Question'), button:has-text('See Final Match Score')", { timeout: 8000 });
    await nextBtn.click();
    await page.waitForTimeout(600);
  }

  await page.waitForSelector("text=PAIRFECT KEEPSAKE · LOVE MATCH", { timeout: 10000 });
  await page.waitForTimeout(1200);

  console.log("Clicking Pin button...");
  const pinBtn = await page.waitForSelector("button:has-text('Pin to Memory Wall')", { timeout: 8000 });
  await pinBtn.click();

  console.log("Waiting for pinned confirmation badge...");
  await page.waitForSelector("button:has-text('Pinned to Memory Wall!')", { timeout: 10000 });
  await page.waitForTimeout(800);

  console.log("Saving 10-love-match-pinned-keepsake.png...");
  await page.screenshot({
    path: path.join(artifactDir, "10-love-match-pinned-keepsake.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("Finished successfully!");
}

main().catch(console.error);
