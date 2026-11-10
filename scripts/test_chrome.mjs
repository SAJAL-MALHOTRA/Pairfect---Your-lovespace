import { chromium } from "playwright";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function test() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });
  try {
    const page = await browser.newPage();
    console.log("Testing navigation to http://127.0.0.1:3002/...");
    const res = await page.goto("http://127.0.0.1:3002/", { timeout: 10000 });
    console.log("Response status:", res.status());
  } catch (err) {
    console.error("Test error:", err.message);
  } finally {
    await browser.close();
  }
}

test();
