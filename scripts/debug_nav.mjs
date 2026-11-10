import { chromium } from "playwright-core";
import fs from "fs";

async function run() {
  const session = JSON.parse(fs.readFileSync("scripts/test_session.json", "utf8"));
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });
  const ctx = await browser.newContext();
  await ctx.addCookies([{
    name: "sb-vhykmhfrptyjkagwetku-auth-token",
    value: encodeURIComponent(JSON.stringify(session)),
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax"
  }]);
  const page = await ctx.newPage();
  await page.addInitScript((sess) => {
    window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
  }, session);

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) console.log("NAVIGATED TO:", frame.url());
  });

  console.log("Navigating directly to /play...");
  await page.goto("http://localhost:3000/play");
  await page.waitForTimeout(4000);
  console.log("FINAL URL after /play:", page.url());

  console.log("Navigating to /dashboard...");
  await page.goto("http://localhost:3000/dashboard");
  await page.waitForTimeout(3000);
  console.log("On dashboard:", page.url());

  const playLink = await page.$('a[href="/play"]');
  console.log("Found play link in sidebar?", !!playLink);
  if (playLink) {
    await playLink.click();
    await page.waitForTimeout(3000);
    console.log("URL after clicking sidebar link:", page.url());
  }

  await browser.close();
}

run().catch(console.error);
