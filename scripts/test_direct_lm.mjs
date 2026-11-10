import { chromium } from "playwright-core";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000/play/love-match", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const botBtn = await page.$("button:has-text('Cupid Bot')");
  if (botBtn) await botBtn.click();
  await page.waitForTimeout(1000);

  console.log("Clicking first option button on Q1...");
  const optBtn = await page.$("button.text-left");
  if (optBtn) await optBtn.click();

  console.log("Waiting for Next Question button...");
  const nextBtn = await page.waitForSelector("button:has-text('Next Question'), button:has-text('See Final Match Score')", { timeout: 10000 });
  console.log("Next button appeared successfully?", !!nextBtn);

  await browser.close();
}

main().catch(console.error);
