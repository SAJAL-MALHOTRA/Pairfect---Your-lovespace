import { chromium, devices } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      env[k.trim()] = v.join("=").trim();
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = "http://localhost:3000";
const artifactDir = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testUsers = [];

async function provisionTestAccount(label) {
  const email = `mobile_${label.toLowerCase()}_${Date.now()}@test.pairfect.local`;
  const password = "TestPassword123!@#Secure";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: label },
  });
  if (error) throw new Error(`Failed to create ${label}: ${error.message}`);
  const userId = data.user.id;
  testUsers.push(userId);

  await admin.from("users").upsert({
    id: userId,
    email,
    display_name: label,
  });

  return { userId, email, password };
}

async function checkHorizontalOverflow(page, screenName) {
  const result = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const overflows = [];
    if (docWidth > winWidth + 1) {
      // Find elements causing overflow
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > winWidth + 1) {
          overflows.push({
            tag: el.tagName,
            id: el.id,
            className: (el.className || "").toString().slice(0, 80),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            scrollWidth: el.scrollWidth,
          });
        }
      }
    }
    return {
      docWidth,
      winWidth,
      hasOverflow: docWidth > winWidth + 1,
      overflowElements: overflows.slice(0, 5),
    };
  });

  if (result.hasOverflow) {
    console.warn(`  [OVERFLOW] ${screenName}: docWidth=${result.docWidth}px > winWidth=${result.winWidth}px (+${result.docWidth - result.winWidth}px)`);
    console.warn("  Top overflowing elements:", JSON.stringify(result.overflowElements, null, 2));
  } else {
    console.log(`  [OK] ${screenName}: No horizontal overflow (${result.docWidth}px <= ${result.winWidth}px)`);
  }
  return result;
}

async function run() {
  console.log("========================================================================");
  console.log("  PAIRFECT MOBILE SCREEN AUDIT & BUG DETECTION                          ");
  console.log("========================================================================\n");

  const iphone = devices["iPhone 13"];
  const browser = await chromium.launch({ headless: true });

  try {
    const user = await provisionTestAccount("Alice");
    const context = await browser.newContext({
      ...iphone,
      locale: "en-US",
    });
    const page = await context.newPage();
    page.on("console", (msg) => console.log(`[Mobile Console] ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => console.error(`[Mobile PageError] ${err.message}`));

    // 1. Audit Login Screen
    console.log("1. Auditing /login on iPhone 13 (390x844)...");
    await page.goto(`${baseUrl}/login`);
    await page.waitForLoadState("networkidle");
    await checkHorizontalOverflow(page, "/login");
    await page.screenshot({ path: path.join(artifactDir, "mobile_01_login.png") });

    // Login user
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname.includes("/onboarding") || url.pathname.includes("/dashboard"));
    await page.waitForLoadState("networkidle");

    // 2. Audit Onboarding Step 1
    if (page.url().includes("/onboarding")) {
      console.log("2. Auditing Onboarding Step 1 (Nickname)...");
      await page.waitForSelector('input[placeholder*="Alex"]', { timeout: 10000 });
      await page.waitForTimeout(1500); // Wait for profile sync into tempDisplayName
      await checkHorizontalOverflow(page, "Onboarding Step 1");
      await page.screenshot({ path: path.join(artifactDir, "mobile_02_onboarding_step1.png") });

      const currentVal = await page.inputValue('input[placeholder*="Alex"]');
      if (!currentVal || !currentVal.trim()) {
        await page.fill('input[placeholder*="Alex"]', "Alice");
        await page.waitForTimeout(300);
      }
      await page.locator('button[type="submit"]').click();

      // 3. Audit Onboarding Step 2
      console.log("3. Auditing Onboarding Step 2 (Choose path)...");
      try {
        await page.waitForSelector('button:has-text("Create our space")', { timeout: 20000 });
      } catch (err) {
        await page.screenshot({ path: path.join(artifactDir, "step1_fail.png") });
        const body = await page.innerText("body");
        console.error("Step 1 -> Step 2 timeout! Current URL:", page.url(), "\nBody:\n", body);
        throw err;
      }
      await checkHorizontalOverflow(page, "Onboarding Step 2");
      await page.screenshot({ path: path.join(artifactDir, "mobile_03_onboarding_step2.png") });

      // Click "Create our space" -> Step 3A Word Re-entry Gate
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Create our space")').first().click();
      try {
        await page.waitForSelector('text="Keep your couple vault safe"', { timeout: 35000 });
      } catch (err) {
        await page.screenshot({ path: path.join(artifactDir, "step2_fail.png") });
        const body = await page.innerText("body");
        console.error("Step 2 -> Step 3A timeout! Current URL:", page.url(), "\nBody:\n", body);
        throw err;
      }

      // 4. Audit Onboarding Step 3A: Word Re-entry Gate
      console.log("4. Auditing Onboarding Step 3A (Word Re-entry Gate)...");
      await checkHorizontalOverflow(page, "Onboarding Step 3A (Re-entry Gate)");
      await page.screenshot({ path: path.join(artifactDir, "mobile_04_onboarding_gate.png") });

      // Read words & positions and solve gate
      const wordElements = await page.$$('div[class*="bg-white border"] span[class*="font-semibold"]');
      const words = [];
      for (const el of wordElements) words.push(((await el.textContent()) || "").trim());

      const posLabels = await page.$$('label:has-text("Word #")');
      const pos1Text = (await posLabels[0].textContent()) || "";
      const pos2Text = (await posLabels[1].textContent()) || "";
      const pos1 = parseInt(pos1Text.replace(/\D/g, ""), 10);
      const pos2 = parseInt(pos2Text.replace(/\D/g, ""), 10);

      const input1 = await page.locator(`input[placeholder="Word #${pos1}"]`);
      const input2 = await page.locator(`input[placeholder="Word #${pos2}"]`);
      await input1.fill(words[pos1 - 1]);
      await input2.fill(words[pos2 - 1]);
      await page.screenshot({ path: path.join(artifactDir, "mobile_04b_gate_filled.png") });

      // Click verify to view invite screen if still present
      const isStillGate = await page.$('button:has-text("Verify and view invite code")');
      if (isStillGate) {
        await page.click('button:has-text("Verify and view invite code")').catch(() => {});
      }
      await page.waitForSelector('text="Send this invite to your partner"', { timeout: 15000 });

      // 5. Audit Onboarding Step 3A: Space Ready Invite Screen
      console.log("5. Auditing Onboarding Step 3A (Space Ready Invite Screen)...");
      await checkHorizontalOverflow(page, "Onboarding Step 3A (Invite Screen)");
      await page.screenshot({ path: path.join(artifactDir, "mobile_05_onboarding_invite.png") });
    }

    // 6. Audit Onboarding Step 3B (Join with Code) and Step 3C (Restore Screen) with Bob
    console.log("\n6. Auditing Onboarding Step 3B (Join with Code) with Bob...");
    const bob = await provisionTestAccount("BobMobile");
    const contextBob = await browser.newContext({ ...iphone, locale: "en-US" });
    const pageBob = await contextBob.newPage();
    pageBob.on("console", (msg) => console.log(`[Bob Console] ${msg.type()}: ${msg.text()}`));
    await pageBob.goto(`${baseUrl}/login`);
    await pageBob.waitForLoadState("networkidle");
    await pageBob.fill('input[type="email"]', bob.email);
    await pageBob.fill('input[type="password"]', bob.password);
    await pageBob.click('button[type="submit"]');
    await pageBob.waitForURL((url) => url.pathname.includes("/onboarding") || url.pathname.includes("/dashboard"));
    await pageBob.waitForLoadState("networkidle");

    // Bob visits /onboarding?code=K7M2QX
    await pageBob.goto(`${baseUrl}/onboarding?code=K7M2QX`);
    await pageBob.waitForLoadState("networkidle");
    await pageBob.waitForSelector('input[value="K7M2QX"]', { timeout: 10000 }).catch(() => {});
    await checkHorizontalOverflow(pageBob, "Onboarding Step 3B (Join Screen)");
    await pageBob.screenshot({ path: path.join(artifactDir, "mobile_06_onboarding_join.png") });

    // 7. Audit Onboarding Step 3C (Restore Screen)
    console.log("7. Auditing Onboarding Step 3C (Restore Screen)...");
    await pageBob.goto(`${baseUrl}/onboarding?mode=restore`);
    await pageBob.waitForLoadState("networkidle");
    await pageBob.waitForSelector('textarea[placeholder*="apple banana"]', { timeout: 10000 });
    await checkHorizontalOverflow(pageBob, "Onboarding Step 3C (Restore Screen)");
    await pageBob.screenshot({ path: path.join(artifactDir, "mobile_07_onboarding_restore.png") });
    await contextBob.close();

    // 8. Provision paired couple and audit Dashboard on mobile
    console.log("\n8. Pairing Alice and Bob to audit /dashboard on mobile...");
    const { data: existingPairs } = await admin
      .from("pairs")
      .select("*")
      .eq("user_a_id", user.userId)
      .eq("status", "pending")
      .limit(1);

    let pairId = "";
    if (existingPairs && existingPairs.length > 0) {
      pairId = existingPairs[0].id;
      await admin.from("pairs").update({ user_b_id: bob.userId, status: "active" }).eq("id", pairId);
    } else {
      const { data: newPair } = await admin
        .from("pairs")
        .insert({
          user_a_id: user.userId,
          user_b_id: bob.userId,
          status: "active",
          invite_code: "MB" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        })
        .select()
        .single();
      pairId = newPair.id;
    }

    // Reload page to enter dashboard
    console.log("9. Auditing /dashboard on iPhone 13 (390x844)...");
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('h1:has-text("Hi")', { timeout: 20000 });
    await checkHorizontalOverflow(page, "/dashboard");
    await page.screenshot({ path: path.join(artifactDir, "mobile_08_dashboard_top.png") });

    // Scroll down to check middle and bottom of dashboard
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await checkHorizontalOverflow(page, "/dashboard (scrolled 600px)");
    await page.screenshot({ path: path.join(artifactDir, "mobile_09_dashboard_middle.png") });

    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(500);
    await checkHorizontalOverflow(page, "/dashboard (scrolled 1600px)");
    await page.screenshot({ path: path.join(artifactDir, "mobile_10_dashboard_bottom.png") });

    // 10. Audit Photobooth on mobile
    console.log("10. Auditing /photo-booth on mobile...");
    await page.goto(`${baseUrl}/photo-booth`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await checkHorizontalOverflow(page, "/photo-booth");
    await page.screenshot({ path: path.join(artifactDir, "mobile_11_photobooth.png") });

    // 11. Audit Play on mobile
    console.log("11. Auditing /play on mobile...");
    await page.goto(`${baseUrl}/play`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await checkHorizontalOverflow(page, "/play");
    await page.screenshot({ path: path.join(artifactDir, "mobile_12_play.png") });

    // 12. Audit Settings on mobile
    console.log("12. Auditing /settings on mobile...");
    await page.goto(`${baseUrl}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await checkHorizontalOverflow(page, "/settings");
    await page.screenshot({ path: path.join(artifactDir, "mobile_13_settings.png") });

    // Teardown
    for (const uid of testUsers) {
      try {
        const { data: pairs } = await admin.from("pairs").select("id").or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
        if (pairs) {
          for (const p of pairs) {
            await admin.storage.from("memories").remove([
              `${p.id}/transport-envelope.json`,
              `${p.id}/recovery-envelope.json`,
              `${p.id}/vault-envelope.json`,
            ]);
            await admin.from("pairs").delete().eq("id", p.id);
          }
        }
        await admin.from("users").delete().eq("id", uid);
        await admin.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn(`Teardown warning for ${uid}:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }
  console.log("\nMobile audit completed!");
}

run().catch((e) => {
  console.error("Audit error:", e);
  process.exit(1);
});
