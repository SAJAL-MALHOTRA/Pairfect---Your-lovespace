import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1];
const supabaseAdmin = createClient(url, key);

async function run() {
  const testEmail = `auto_e2ee_${Date.now()}@pairfect.site`;
  const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { display_name: "Test Partner" }
  });

  if (createErr) {
    console.error("Create user error:", createErr);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Log in
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill("Password123!");
    await page.locator('button:has-text("SIGN IN")').click();

    await page.waitForURL("**/onboarding**", { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Screenshot choice screen
    await page.screenshot({ path: "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/52-onboarding-choice-screen.png" });
    console.log("Choice screen screenshot 52 saved");

    // 2. Click 'Create a new pair'
    await page.locator('button:has-text("Create a new pair")').click();
    await page.waitForTimeout(2500);

    // Screenshot create screen showing the 1-Tap Share button, 6-character code, and zero-knowledge badge
    await page.screenshot({ path: "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/53-onboarding-create-pair-auto-e2ee.png" });
    console.log("Create screen screenshot 53 saved");

  } finally {
    // Clean up test user
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    console.log("Cleaned up test user");
    await browser.close();
  }
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
