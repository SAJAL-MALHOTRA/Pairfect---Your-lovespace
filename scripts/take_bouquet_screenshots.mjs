import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function main() {
  const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

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

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  // Inject user mock into localStorage before loading page
  await page.addInitScript(() => {
    const mockUser = {
      id: "ca35ab49-11a8-456b-b234-8077f8adf149",
      email: "user@example.com",
      user_metadata: { name: "Darling" },
    };
    const mockSession = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: mockUser,
    };
    window.localStorage.setItem(
      "sb-vhykmhfrptyjkagwetku-auth-token",
      JSON.stringify(mockSession)
    );
  });

  // 1. Capture Bouquet Studio Builder
  console.log("Navigating to http://localhost:3000/bouquet...");
  await page.goto("http://localhost:3000/bouquet", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 2. Click "Received Bouquets" tab to show cards from partner
  console.log("Clicking Received Bouquets tab...");
  const receivedTab = await page.getByRole("button", { name: /Received Bouquets/i });
  if (receivedTab) {
    await receivedTab.click();
    await page.waitForTimeout(1500);
    console.log("Taking received gallery screenshot...");
    await page.screenshot({
      path: path.join(artifactDir, "bouquet-received-gallery-populated.png"),
      fullPage: false,
    });
  }

  // 3. Open Unwrap URL with the notification id
  console.log("Navigating to unwrap URL...");
  await page.goto("http://localhost:3000/bouquet?unwrap=e4ea987b-3d98-44a1-bf8d-92f4ec8a2b82", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 4. Click Untie Ribbon & Unwrap Bouquet button
  console.log("Clicking Untie Ribbon button...");
  const untieBtn = await page.getByRole("button", { name: /Untie Ribbon/i });
  if (untieBtn) {
    await untieBtn.click();
    await page.waitForTimeout(1500);

    console.log("Taking unwrapped reveal screenshot (blooming flowers & card)...");
    await page.screenshot({
      path: path.join(artifactDir, "bouquet-unwrap-revealed-final.png"),
      fullPage: false,
    });
  }

  await browser.close();
  console.log("All screenshots taken successfully!");
}

main().catch(console.error);
