import { chromium } from "playwright";

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("[BROWSER CONSOLE]", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("[BROWSER ERROR]", err.message));

  await page.goto("http://localhost:3000/iq-duel?room=TEST1", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Join as guest
  const guestInput = page.locator("input[placeholder*='name or nickname']");
  if (await guestInput.isVisible()) {
    await guestInput.fill("GuestTester");
    await page.click("button:has-text('Join the Room')");
    await page.waitForTimeout(500);
  }

  console.log("Clicking Practice Solo...");
  await page.click("button:has-text('Practice Solo vs Logic Bot')");

  // Wait 4 seconds and check what screen is showing
  await page.waitForTimeout(4000);
  const text = await page.innerText("main");
  console.log("Main text after 4s:", text.substring(0, 300));

  await browser.close();
}

test().catch(console.error);
