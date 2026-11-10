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
  
  const executablePath = possiblePaths.find(p => p && fs.existsSync(p));

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  // Setup auth context with cookies and localStorage for port 3002
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

  // 1. Desktop Moments Vault
  console.log("Navigating to /moments on port 3002...");
  await page.goto("http://localhost:3002/moments", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(artifactDir, "82-moments-desktop-redesign.png"),
    fullPage: false,
  });
  console.log("Captured 82-moments-desktop-redesign.png");

  // 2. Mobile Moments Vault (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  await mobileContext.addCookies([
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

  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript((sess) => {
    window.localStorage.setItem("sb-vhykmhfrptyjkagwetku-auth-token", JSON.stringify(sess));
  }, session);

  await mobilePage.goto("http://localhost:3002/moments", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2000);

  await mobilePage.screenshot({
    path: path.join(artifactDir, "83-moments-mobile-redesign.png"),
    fullPage: false,
  });
  console.log("Captured 83-moments-mobile-redesign.png");

  // 3. Mobile Scroll Down
  await mobilePage.evaluate(() => window.scrollBy(0, 480));
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({
    path: path.join(artifactDir, "84-moments-mobile-cards-redesign.png"),
    fullPage: false,
  });
  console.log("Captured 84-moments-mobile-cards-redesign.png");

  // 4. Public Shared / Demo Memory Wall View
  const publicPage = await browser.newPage({
    viewport: { width: 1280, height: 950 },
  });
  await publicPage.goto("http://localhost:3002/moments?share=demo", { waitUntil: "networkidle" });
  await publicPage.waitForTimeout(1500);
  await publicPage.screenshot({
    path: path.join(artifactDir, "85-moments-public-shared-redesign.png"),
    fullPage: false,
  });
  console.log("Captured 85-moments-public-shared-redesign.png");

  await browser.close();
  console.log("All Moments Scrapbook screenshots captured successfully!");
}

main().catch(console.error);
