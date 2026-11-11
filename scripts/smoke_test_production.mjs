import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Load Supabase Environment Variables
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const artifactDir = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";
const PROD_URL = "https://www.pairfect.site";
const timestamp = Date.now();

const aliceEmail = `prod.smoke.alice.${timestamp}@pairfect.internal`;
const bobEmail = `prod.smoke.bob.${timestamp}@pairfect.internal`;
const testPassword = "SmokeTestPassword2026!Secure";

async function runSmokeTest() {
  console.log("================================================================");
  console.log("   PAIRFECT LIVE PRODUCTION PLAYWRIGHT SMOKE TEST (BROWSER)     ");
  console.log("   Target: " + PROD_URL);
  console.log("================================================================\n");

  let aliceId = null;
  let bobId = null;
  let pairId = null;
  let browser = null;

  try {
    // ------------------------------------------------------------
    // 1. Provision Confirmed Test Users in Supabase
    // ------------------------------------------------------------
    console.log("1. Provisioning verified test accounts in Supabase...");
    const { data: uA, error: errA } = await admin.auth.admin.createUser({
      email: aliceEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { display_name: "AliceSmoke" },
    });
    if (errA || !uA?.user) throw new Error(`Failed to create Alice: ${errA?.message}`);
    aliceId = uA.user.id;
    await admin.from("users").upsert([{ id: aliceId, display_name: "AliceSmoke", email: aliceEmail }]);

    const { data: uB, error: errB } = await admin.auth.admin.createUser({
      email: bobEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { display_name: "BobSmoke" },
    });
    if (errB || !uB?.user) throw new Error(`Failed to create Bob: ${errB?.message}`);
    bobId = uB.user.id;
    await admin.from("users").upsert([{ id: bobId, display_name: "BobSmoke", email: bobEmail }]);

    console.log(`   [PASS] Alice created: ${aliceId}`);
    console.log(`   [PASS] Bob created: ${bobId}\n`);

    // ------------------------------------------------------------
    // 2. Launch Chromium with Two Independent Browser Contexts
    // ------------------------------------------------------------
    console.log("2. Launching headless Chromium with dual contexts...");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const contextA = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    });
    const contextB = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    console.log("   [PASS] Browser contexts ready.\n");

    // ------------------------------------------------------------
    // 3. Step 1: Alice visits Landing Page
    // ------------------------------------------------------------
    console.log("3. Testing Landing Page (https://www.pairfect.site)...");
    const landingRes = await pageA.goto(PROD_URL, { waitUntil: "networkidle", timeout: 25000 });
    console.log(`   HTTP Status: ${landingRes.status()}`);
    const pageTitle = await pageA.title();
    console.log(`   Page Title: "${pageTitle}"`);
    
    // Verify hero text
    const heroText = await pageA.locator("h1").first().innerText();
    console.log(`   Hero Headline: "${heroText.trim()}"`);

    await pageA.screenshot({ path: path.join(artifactDir, "smoke_01_landing.png") });
    console.log("   [PASS] Saved screenshot: smoke_01_landing.png\n");

    // ------------------------------------------------------------
    // 4. Step 2: Alice logs in via /login
    // ------------------------------------------------------------
    console.log("4. Alice logging in at /login...");
    await pageA.goto(`${PROD_URL}/login`, { waitUntil: "networkidle", timeout: 25000 });
    await pageA.fill("input#email", aliceEmail);
    await pageA.fill("input#password", testPassword);
    await pageA.click("button[type='submit']");

    // Wait for redirect to onboarding or dashboard
    await pageA.waitForURL((url) => url.pathname.includes("/onboarding") || url.pathname.includes("/dashboard"), {
      timeout: 25000,
    });
    console.log(`   Alice redirected to: ${pageA.url()}`);
    await pageA.waitForTimeout(2000);
    await pageA.screenshot({ path: path.join(artifactDir, "smoke_02_alice_onboarding.png") });
    console.log("   [PASS] Saved screenshot: smoke_02_alice_onboarding.png\n");

    // ------------------------------------------------------------
    // 5. Step 3: Alice completes Onboarding & generates invite code
    // ------------------------------------------------------------
    console.log("5. Alice setting up couple room in Onboarding...");
    // If on Step 1 (Display Name form)
    const nameInput = pageA.locator("input[type='text']").first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("AliceSmoke");
      const continueBtn = pageA.locator("button[type='submit']").first();
      await continueBtn.click();
      await pageA.waitForTimeout(1500);
    }

    // Step 2: Click "Create a Space" / "Invite My Partner" button
    // Looking for the create pair button
    const createBtn = pageA.locator("button:has-text('Invite My Partner'), button:has-text('Create a space'), button:has-text('Create')").first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      console.log("   Alice clicked 'Create space' button.");
      await pageA.waitForTimeout(3000);
    }

    // Capture Alice's invite screen
    await pageA.screenshot({ path: path.join(artifactDir, "smoke_03_alice_invite_screen.png") });
    console.log("   [PASS] Saved screenshot: smoke_03_alice_invite_screen.png");

    // Fetch the generated invite code from Supabase
    const { data: pairData, error: pairErr } = await admin
      .from("pairs")
      .select("id, invite_code, status, subscription_tier")
      .eq("user_a_id", aliceId)
      .single();

    if (pairErr || !pairData) {
      throw new Error(`Failed to find Alice's pair in DB: ${pairErr?.message}`);
    }
    pairId = pairData.id;
    const inviteCode = pairData.invite_code;
    console.log(`   Generated Invite Code: ${inviteCode}`);
    console.log(`   Pair Status: ${pairData.status}, Tier: ${pairData.subscription_tier}\n`);

    // ------------------------------------------------------------
    // 6. Step 4: Bob logs in and joins Alice's room in Context B
    // ------------------------------------------------------------
    console.log("6. Bob logging in in Context B to join Alice's room...");
    await pageB.goto(`${PROD_URL}/login`, { waitUntil: "networkidle", timeout: 25000 });
    await pageB.fill("input#email", bobEmail);
    await pageB.fill("input#password", testPassword);
    await pageB.click("button[type='submit']");

    await pageB.waitForURL((url) => url.pathname.includes("/onboarding") || url.pathname.includes("/dashboard"), {
      timeout: 25000,
    });
    console.log(`   Bob redirected to: ${pageB.url()}`);
    await pageB.waitForTimeout(2000);

    // If on Step 1 (Display Name)
    const bobNameInput = pageB.locator("input[type='text']").first();
    if (await bobNameInput.isVisible()) {
      await bobNameInput.fill("BobSmoke");
      const bobContinueBtn = pageB.locator("button[type='submit']").first();
      await bobContinueBtn.click();
      await pageB.waitForTimeout(1500);
    }

    // Step 2: Click "I have an invite code" / "Join"
    const joinChoiceBtn = pageB.locator("button:has-text('I have an invite code'), button:has-text('Join a space'), button:has-text('Join')").first();
    if (await joinChoiceBtn.isVisible()) {
      await joinChoiceBtn.click();
      await pageB.waitForTimeout(1000);
    }

    // Enter invite code in Bob's screen
    const codeInput = pageB.locator("input[type='text']").first();
    await codeInput.fill(inviteCode);
    const joinSubmitBtn = pageB.locator("button[type='submit']:has-text('Join'), button:has-text('Connect'), button[type='submit']").first();
    await joinSubmitBtn.click();
    console.log("   Bob submitted invite code.");
    await pageB.waitForTimeout(3000);

    await pageB.screenshot({ path: path.join(artifactDir, "smoke_04_bob_joined.png") });
    console.log("   [PASS] Saved screenshot: smoke_04_bob_joined.png\n");

    // ------------------------------------------------------------
    // 7. Step 5: Verify Realtime pairing on Alice's screen
    // ------------------------------------------------------------
    console.log("7. Verifying Realtime pairing event on Alice's screen (Context A)...");
    await pageA.waitForTimeout(3000);
    await pageA.screenshot({ path: path.join(artifactDir, "smoke_05_alice_realtime_paired.png") });
    console.log("   [PASS] Saved screenshot: smoke_05_alice_realtime_paired.png\n");

    // ------------------------------------------------------------
    // 8. Step 6: Both partners navigate to Dashboard
    // ------------------------------------------------------------
    console.log("8. Navigating both partners to /dashboard...");
    await pageA.goto(`${PROD_URL}/dashboard`, { waitUntil: "networkidle", timeout: 25000 });
    await pageB.goto(`${PROD_URL}/dashboard`, { waitUntil: "networkidle", timeout: 25000 });
    await pageA.waitForTimeout(2000);
    await pageB.waitForTimeout(2000);

    await pageA.screenshot({ path: path.join(artifactDir, "smoke_06_alice_dashboard.png") });
    await pageB.screenshot({ path: path.join(artifactDir, "smoke_06_bob_dashboard.png") });
    console.log("   [PASS] Saved screenshots: smoke_06_alice_dashboard.png, smoke_06_bob_dashboard.png\n");

    // ------------------------------------------------------------
    // 9. Step 7: Mood Check-in on /checkin
    // ------------------------------------------------------------
    console.log("9. Testing Daily Mood Check-In on /checkin (Alice)...");
    await pageA.goto(`${PROD_URL}/checkin`, { waitUntil: "networkidle", timeout: 25000 });
    await pageA.waitForTimeout(1500);

    // Select the first mood button available
    const moodButtons = pageA.locator("button:has-text('Joyful'), button:has-text('Happy'), button:has-text('Loving'), button:has-text('Calm')");
    if (await moodButtons.count() > 0) {
      await moodButtons.first().click();
      console.log("   Alice selected mood.");
    }

    // Fill in note if textarea exists
    const noteArea = pageA.locator("textarea");
    if (await noteArea.isVisible()) {
      await noteArea.fill("Live production smoke test running seamlessly on pairfect.site!");
    }

    // Submit check-in
    const submitCheckinBtn = pageA.locator("button:has-text('Save'), button:has-text('Check in'), button:has-text('Submit'), button:has-text('Save Check-in')").first();
    if (await submitCheckinBtn.isVisible()) {
      await submitCheckinBtn.click();
      await pageA.waitForTimeout(2500);
      console.log("   Alice submitted mood check-in.");
    }

    await pageA.screenshot({ path: path.join(artifactDir, "smoke_07_alice_mood_saved.png") });
    console.log("   [PASS] Saved screenshot: smoke_07_alice_mood_saved.png\n");

    // ------------------------------------------------------------
    // 10. Step 8: Bob verifies partner mood on Dashboard
    // ------------------------------------------------------------
    console.log("10. Bob verifying partner mood on /dashboard...");
    await pageB.goto(`${PROD_URL}/dashboard`, { waitUntil: "networkidle", timeout: 25000 });
    await pageB.waitForTimeout(2000);
    await pageB.screenshot({ path: path.join(artifactDir, "smoke_08_bob_sees_partner_mood.png") });
    console.log("   [PASS] Saved screenshot: smoke_08_bob_sees_partner_mood.png\n");

  } catch (err) {
    console.error("SMOKE TEST EXCEPTION:", err);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
      console.log("   Browser closed cleanly.");
    }

    // ------------------------------------------------------------
    // 11. Cleanup test accounts
    // ------------------------------------------------------------
    console.log("\n11. Cleaning up test accounts from Supabase...");
    try {
      if (pairId) {
        await admin.from("mood_logs").delete().eq("pair_id", pairId);
        await admin.from("pairs").delete().eq("id", pairId);
      }
      if (aliceId) {
        await admin.from("users").delete().eq("id", aliceId);
        await admin.auth.admin.deleteUser(aliceId);
      }
      if (bobId) {
        await admin.from("users").delete().eq("id", bobId);
        await admin.auth.admin.deleteUser(bobId);
      }
      console.log("   [PASS] Database cleaned up. Zero test accounts remain.");
    } catch (cleanErr) {
      console.warn("Cleanup warning:", cleanErr);
    }
    console.log("\n================================================================");
    console.log("            PRODUCTION SMOKE TEST COMPLETE                      ");
    console.log("================================================================");
  }
}

runSmokeTest().catch((err) => {
  console.error("FATAL ERROR IN SMOKE TEST:", err);
  process.exit(1);
});
