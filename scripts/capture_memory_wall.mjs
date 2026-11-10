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

  const authContext = await browser.newContext({ viewport: { width: 1280, height: 950 } });
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

  console.log("Navigating to /dashboard...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  console.log("Navigating to /moments via URL...");
  // Using client-side navigation or direct goto with domcontentloaded
  await page.goto("http://localhost:3000/moments", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  console.log("URL on moments page:", page.url());
  console.log("Capturing 11-memory-wall-with-pinned-keepsake.png...");
  await page.screenshot({
    path: path.join(artifactDir, "11-memory-wall-with-pinned-keepsake.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("Captured Memory Wall view!");
}

main().catch(console.error);
