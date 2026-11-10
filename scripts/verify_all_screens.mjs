import { spawn } from "child_process";
import { chromium } from "playwright";

const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";
const port = 3002;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const hoedexDir = "C:\\Users\\2006s\\.gemini\\antigravity\\scratch\\hoedex";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 307 || res.status === 308) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await sleep(800);
  }
  throw new Error("Server failed to respond within " + timeoutMs + "ms");
}

async function main() {
  console.log("Starting Next.js server in the same process session...");
  const serverProcess = spawn("npx.cmd", ["next", "dev", "-p", String(port), "--webpack"], {
    cwd: hoedexDir,
    stdio: "pipe",
    shell: true,
  });

  serverProcess.stdout.on("data", (data) => {
    const msg = data.toString();
    if (msg.includes("Ready") || msg.includes("Compiled")) {
      console.log("[Next.js]", msg.trim());
    }
  });

  serverProcess.stderr.on("data", (data) => {
    // suppress minor stderr
  });

  try {
    console.log("Waiting for http://127.0.0.1:" + port + " to be ready...");
    await waitForServer(`http://127.0.0.1:${port}/`, 35000);
    console.log("Server is ready and responding!");

    console.log("Launching Chromium...");
    const browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
    });

    try {
      // 1. Desktop Context (1440x950)
      const desktopCtx = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 2,
      });
      const desktopPage = await desktopCtx.newPage();

      // 1. Dashboard
      console.log("Capturing Dashboard (Desktop)...");
      await desktopPage.goto(`http://127.0.0.1:${port}/dashboard`, { waitUntil: "networkidle", timeout: 25000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: `${artifactDir}/95-dashboard-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Saved 95-dashboard-desktop.png");

      // 2. Play / The Love Path
      console.log("Capturing The Love Path (Desktop)...");
      await desktopPage.goto(`http://127.0.0.1:${port}/play`, { waitUntil: "networkidle", timeout: 25000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: `${artifactDir}/97-play-lovepath-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Saved 97-play-lovepath-desktop.png");

      // 3. Profile
      console.log("Capturing Profile (Desktop)...");
      await desktopPage.goto(`http://127.0.0.1:${port}/profile`, { waitUntil: "networkidle", timeout: 25000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: `${artifactDir}/99-profile-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Saved 99-profile-desktop.png");

      // 4. Settings
      console.log("Capturing Settings (Desktop)...");
      await desktopPage.goto(`http://127.0.0.1:${port}/settings`, { waitUntil: "networkidle", timeout: 25000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: `${artifactDir}/100-settings-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Saved 100-settings-desktop.png");

      // 5. Game Lobby /play/love-match
      console.log("Capturing Love Match Game Lobby (Desktop)...");
      await desktopPage.goto(`http://127.0.0.1:${port}/play/love-match`, { waitUntil: "networkidle", timeout: 25000 });
      await desktopPage.waitForTimeout(2000);
      await desktopPage.screenshot({
        path: `${artifactDir}/101-lovematch-lobby-desktop.png`,
        clip: { x: 0, y: 0, width: 1440, height: 950 },
      });
      console.log("Saved 101-lovematch-lobby-desktop.png");

      // 2. Mobile Context (390x844 iPhone 14)
      const mobileCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      });
      const mobilePage = await mobileCtx.newPage();

      // Mobile Dashboard
      console.log("Capturing Dashboard (Mobile)...");
      await mobilePage.goto(`http://127.0.0.1:${port}/dashboard`, { waitUntil: "networkidle", timeout: 25000 });
      await mobilePage.waitForTimeout(2000);
      await mobilePage.screenshot({
        path: `${artifactDir}/102-dashboard-mobile.png`,
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
      console.log("Saved 102-dashboard-mobile.png");

      // Mobile Love Path
      console.log("Capturing The Love Path (Mobile)...");
      await mobilePage.goto(`http://127.0.0.1:${port}/play`, { waitUntil: "networkidle", timeout: 25000 });
      await mobilePage.waitForTimeout(2000);
      await mobilePage.screenshot({
        path: `${artifactDir}/103-play-lovepath-mobile.png`,
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
      console.log("Saved 103-play-lovepath-mobile.png");

      console.log("All screenshots captured successfully!");
    } finally {
      await browser.close();
    }
  } finally {
    console.log("Stopping background server...");
    serverProcess.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
