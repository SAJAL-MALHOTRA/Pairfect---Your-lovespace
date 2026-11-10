import { chromium } from "playwright-core";
import fs from "fs";

async function main() {
  const session = JSON.parse(fs.readFileSync("scripts/test_session.json", "utf8"));
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.addCookies([{
    name: "sb-vhykmhfrptyjkagwetku-auth-token",
    value: encodeURIComponent(JSON.stringify(session)),
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }]);
  const page = await ctx.newPage();
  await page.addInitScript((sess) => {
    window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
  }, session);

  await page.goto("http://localhost:3000/dashboard");
  await page.waitForTimeout(1500);

  const playLink = await page.$('a[href="/play"]');
  if (playLink) await playLink.click();
  await page.waitForTimeout(1500);

  const lmCard = await page.$('a[href="/play/love-match"]');
  if (lmCard) await lmCard.click();
  await page.waitForTimeout(1500);

  console.log("On Love Match lobby:", page.url());
  const botBtn = await page.$("button:has-text('Cupid Bot')");
  if (botBtn) {
    console.log("Clicking Cupid Bot button...");
    await botBtn.click();
  }
  await page.waitForTimeout(1000);

  const optBtn = await page.$("button.text-left");
  console.log("Found option button?", !!optBtn);
  if (optBtn) {
    console.log("Clicking option button...");
    await optBtn.click();
  }

  for (let i = 1; i <= 6; i++) {
    await page.waitForTimeout(1000);
    const bodyText = await page.innerText("body");
    const hasNext = bodyText.includes("Next Question") || bodyText.includes("Next");
    const hasLocked = bodyText.includes("LOCKED IN");
    const hasComparing = bodyText.includes("Comparing") || bodyText.includes("Thinking");
    console.log(`T+${i}s: hasNext=${hasNext}, hasLocked=${hasLocked}, hasComparing=${hasComparing}`);
    if (hasNext) {
      console.log("Next button is available!");
      break;
    }
  }

  await browser.close();
}

main().catch(console.error);
