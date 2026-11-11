import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import assert from "node:assert";

// Load environment variables from .env.local
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

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("════════════════════════════════════════════════════════════════");
console.log("    PAIRFECT TWO-ACCOUNT RLS & PRIVILEGE INTEGRATION TEST       ");
console.log("════════════════════════════════════════════════════════════════\n");

async function main() {
  const timestamp = Date.now();
  const emailA = `test.alice.${timestamp}@pairfect.internal`;
  const emailB = `test.bob.${timestamp}@pairfect.internal`;
  const emailC = `test.charlie.${timestamp}@pairfect.internal`;
  const password = "TestPassword123!@#Secure";

  console.log("1. Setting up Test Users...");
  // Create User A (Alice), User B (Bob) in Pair 1, User C (Charlie) in Pair 2
  const { data: userAData, error: errA } = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
  });
  if (errA) throw new Error(`Failed to create Alice: ${errA.message}`);
  const userA = userAData.user;

  const { data: userBData, error: errB } = await admin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
  });
  if (errB) throw new Error(`Failed to create Bob: ${errB.message}`);
  const userB = userBData.user;

  const { data: userCData, error: errC } = await admin.auth.admin.createUser({
    email: emailC,
    password,
    email_confirm: true,
  });
  if (errC) throw new Error(`Failed to create Charlie: ${errC.message}`);
  const userC = userCData.user;

  console.log(`   Created User A (Alice): ${userA.id}`);
  console.log(`   Created User B (Bob): ${userB.id}`);
  console.log(`   Created User C (Charlie): ${userC.id}`);

  // Create public.users profiles
  await admin.from("users").upsert([
    { id: userA.id, display_name: "Alice" },
    { id: userB.id, display_name: "Bob" },
    { id: userC.id, display_name: "Charlie" },
  ]);

  console.log("\n2. Setting up Pairs (Pair 1: Alice + Bob, Pair 2: Charlie solo)...");
  const code1 = `TST${Math.floor(100 + Math.random() * 899)}`;
  const code2 = `TST${Math.floor(100 + Math.random() * 899)}`;

  const { data: pair1, error: p1Err } = await admin
    .from("pairs")
    .insert({
      user_a_id: userA.id,
      user_b_id: userB.id,
      invite_code: code1,
      status: "active",
      subscription_tier: "free",
      subscription_status: "inactive",
    })
    .select()
    .single();
  if (p1Err) throw new Error(`Failed to create Pair 1: ${p1Err.message}`);

  const { data: pair2, error: p2Err } = await admin
    .from("pairs")
    .insert({
      user_a_id: userC.id,
      invite_code: code2,
      status: "pending",
      subscription_tier: "free",
      subscription_status: "inactive",
    })
    .select()
    .single();
  if (p2Err) throw new Error(`Failed to create Pair 2: ${p2Err.message}`);

  console.log(`   Pair 1 (Alice + Bob): ${pair1.id}`);
  console.log(`   Pair 2 (Charlie): ${pair2.id}`);

  // Sign in as Alice to get authenticated client
  const clientAlice = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authA } = await clientAlice.auth.signInWithPassword({
    email: emailA,
    password,
  });
  assert(authA?.session, "Alice sign in failed");

  // Sign in as Charlie to get authenticated client
  const clientCharlie = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authC } = await clientCharlie.auth.signInWithPassword({
    email: emailC,
    password,
  });
  assert(authC?.session, "Charlie sign in failed");

  console.log("\n3. Testing Cross-Pair Isolation (SELECT)...");
  // Alice inserts a love letter into Pair 1
  const { data: letter, error: letErr } = await clientAlice
    .from("love_letters")
    .insert({
      pair_id: pair1.id,
      sender_id: userA.id,
      content: "enc:v1:secret-alice-letter",
      envelope_style: "classic",
    })
    .select()
    .single();
  
  if (letErr) {
    console.log(`   [WARNING] Alice inserting letter failed: ${letErr.message}`);
  } else {
    console.log(`   Alice created Love Letter: ${letter.id}`);

    // Charlie in Pair 2 attempts to SELECT Alice's letter
    const { data: charlieRead, error: crErr } = await clientCharlie
      .from("love_letters")
      .select("*")
      .eq("id", letter.id);
    
    const count = charlieRead ? charlieRead.length : 0;
    console.log(`   Charlie reading Alice's letter: returned ${count} rows.`);
    assert.strictEqual(count, 0, "Cross-pair isolation failed: Charlie read Alice's letter!");
    console.log("   [PASS] Cross-pair isolation verified (0 rows returned to outside user).");
  }

  console.log("\n4. Testing DELETE Policy on Love Letters...");
  if (letter) {
    // Charlie attempts to delete Alice's letter
    const { error: cdErr } = await clientCharlie
      .from("love_letters")
      .delete()
      .eq("id", letter.id);
    
    // Verify letter still exists
    const { data: checkStillThere } = await admin
      .from("love_letters")
      .select("id")
      .eq("id", letter.id)
      .maybeSingle();

    assert(checkStillThere, "Charlie should not be able to delete Alice's letter!");
    console.log("   [PASS] Outside user cannot delete letter.");

    // Alice deletes her own letter in Pair 1
    const { error: adErr } = await clientAlice
      .from("love_letters")
      .delete()
      .eq("id", letter.id);

    const { data: checkDeleted } = await admin
      .from("love_letters")
      .select("id")
      .eq("id", letter.id)
      .maybeSingle();

    if (!checkDeleted) {
      console.log("   [PASS] Alice successfully deleted her love letter under RLS!");
    } else {
      console.log("   [FAIL/PENDING] Letter still exists after delete. migration_v45 DELETE policy not yet applied on live DB.");
    }
  }

  console.log("\n5. Testing Notification Partner Restriction...");
  // Alice sends notification to Bob (valid partner in Pair 1)
  const { error: notifBobErr } = await clientAlice
    .from("notifications")
    .insert({
      pair_id: pair1.id,
      sender_id: userA.id,
      recipient_id: userB.id,
      type: "letter_sent",
      title: "New Love Letter",
      body: "You have mail!",
    });

  if (!notifBobErr) {
    console.log("   [PASS] Alice successfully sent notification to Bob (partner).");
  } else {
    console.log(`   [FAIL] Alice could not send notification to Bob: ${notifBobErr.message}`);
  }

  // Alice sends notification to Charlie (NOT in her pair - privilege escalation attempt)
  const { error: notifCharlieErr } = await clientAlice
    .from("notifications")
    .insert({
      pair_id: pair1.id,
      sender_id: userA.id,
      recipient_id: userC.id,
      type: "letter_sent",
      title: "Spam notification",
      body: "Injecting spam",
    });

  if (notifCharlieErr) {
    console.log("   [PASS] Exploitative notification correctly rejected by policy:", notifCharlieErr.message);
  } else {
    console.log("   [FAIL/PENDING] Exploitative notification was permitted! migration_v45 partner check not yet applied on live DB.");
  }

  console.log("\n6. Testing Subscription & Membership Column Tampering Protection on Pairs...");
  // Alice tries to escalate subscription tier via client update
  const { error: escalateErr } = await clientAlice
    .from("pairs")
    .update({ subscription_tier: "forever", subscription_status: "active" })
    .eq("id", pair1.id);

  if (escalateErr) {
    console.log("   [PASS] Client subscription escalation blocked by trigger:", escalateErr.message);
  } else {
    // Check if the tier actually changed on the server
    const { data: checkTier } = await admin
      .from("pairs")
      .select("subscription_tier")
      .eq("id", pair1.id)
      .single();

    if (checkTier.subscription_tier === "forever") {
      console.log("   [FAIL/PENDING] Client successfully escalated to Forever! prevent_pair_tampering trigger not yet applied on live DB.");
    } else {
      console.log("   [PASS] Subscription tier was not escalated.");
    }
  }

  // Alice tries to kick Bob and assign Charlie
  const { error: kickErr } = await clientAlice
    .from("pairs")
    .update({ user_b_id: userC.id })
    .eq("id", pair1.id);

  if (kickErr) {
    console.log("   [PASS] Client unauthorized partner reassignment blocked:", kickErr.message);
  } else {
    console.log("   [FAIL/PENDING] Reassignment did not error on client.");
  }

  // Admin server-side update should SUCCEED
  const { error: adminUpgradeErr } = await admin
    .from("pairs")
    .update({ subscription_tier: "plus", subscription_status: "active" })
    .eq("id", pair1.id);

  assert(!adminUpgradeErr, `Admin upgrade should succeed: ${adminUpgradeErr?.message}`);
  console.log("   [PASS] Server-side admin/service_role update permitted without restriction.");

  console.log("\n6b. Testing Client INSERT Path Tampering Protection on Pairs...");
  // Provision a new unpaired user (David) to attempt direct client insert with 'forever' and 'active'
  const emailD = `test.david.${timestamp}@pairfect.internal`;
  const { data: userDData } = await admin.auth.admin.createUser({
    email: emailD,
    password,
    email_confirm: true,
  });
  const userD = userDData.user;
  await admin.from("users").upsert([{ id: userD.id, display_name: "David" }]);

  const clientDavid = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await clientDavid.auth.signInWithPassword({ email: emailD, password });

  const exploitCode = `EXP${Math.floor(100 + Math.random() * 899)}`;
  const { data: insertedPair, error: insertExploitErr } = await clientDavid
    .from("pairs")
    .insert({
      user_a_id: userD.id,
      invite_code: exploitCode,
      status: "active",
      subscription_tier: "forever",
      subscription_status: "active",
    })
    .select()
    .single();

  if (insertExploitErr) {
    console.log("   [PASS] Client insert tampering rejected by PostgreSQL:", insertExploitErr.message);
  } else if (insertedPair) {
    if (insertedPair.subscription_tier === "forever" || insertedPair.status === "active") {
      console.log(`   [CONFIRMED HOLE / PENDING v46] Client inserted pair with tier '${insertedPair.subscription_tier}' and status '${insertedPair.status}'! migration_v46 BEFORE INSERT trigger required.`);
    } else {
      console.log(`   [PASS] Client insert sanitized by trigger! Tier: '${insertedPair.subscription_tier}', Status: '${insertedPair.status}'`);
    }
    await admin.from("pairs").delete().eq("id", insertedPair.id);
  }

  // Clean up David
  await admin.from("users").delete().eq("id", userD.id);
  await admin.auth.admin.deleteUser(userD.id);

  console.log("\n6c. Testing Destructive Active Pair DELETE Protection...");
  // Alice attempts to delete her active pair directly via client (which would trigger cascade wipe of all data)
  const { error: clientDeletePairErr } = await clientAlice
    .from("pairs")
    .delete()
    .eq("id", pair1.id);

  // Check if pair1 still exists in the database
  const { data: pair1StillExists } = await admin
    .from("pairs")
    .select("id, status")
    .eq("id", pair1.id)
    .maybeSingle();

  if (pair1StillExists) {
    console.log("   [PASS] Active pair is protected! Client cannot delete active pair directly.");
  } else {
    console.log("   [CONFIRMED HOLE / PENDING v46] Active pair was deleted by client! migration_v46 policy required to restrict DELETE to pending pairs.");
    // Re-create pair1 for remaining tests if deleted
    await admin.from("pairs").insert({
      id: pair1.id,
      user_a_id: userA.id,
      user_b_id: userB.id,
      invite_code: code1,
      status: "active",
      subscription_tier: "plus",
      subscription_status: "active",
    });
  }

  console.log("\n7. Testing Beta Waitlist Email Scraping Protection...");
  // Charlie attempts to read beta_waitlist
  const { data: waitlistData, error: wlErr } = await clientCharlie
    .from("beta_waitlist")
    .select("*");

  if (wlErr) {
    console.log("   [PASS] Client reading beta_waitlist denied with error:", wlErr.message);
  } else if (!waitlistData || waitlistData.length === 0) {
    console.log("   [PASS] Client reading beta_waitlist returned 0 rows.");
  } else {
    console.log(`   [FAIL/PENDING] Charlie read ${waitlistData.length} waitlist emails! migration_v45 restriction not yet applied on live DB.`);
  }

  console.log("\n8. Testing Storage Cross-Pair Isolation (Direct & API)...");
  // Alice uploads a test file to her pair's storage folder
  const testStoragePath = `${pair1.id}/test-envelope.json`;
  const testBuffer = Buffer.from(JSON.stringify({ secret: "alice-bob-key-material" }));
  const { error: uploadErr } = await admin.storage
    .from("memories")
    .upload(testStoragePath, testBuffer, { upsert: true, contentType: "application/json" });

  if (uploadErr) {
    console.log("   [WARNING] Setup upload failed:", uploadErr.message);
  } else {
    // 8a. Charlie attempts direct download via Supabase Storage client
    const { data: charlieDownload, error: cdStorageErr } = await clientCharlie.storage
      .from("memories")
      .download(testStoragePath);

    if (cdStorageErr || !charlieDownload) {
      console.log("   [PASS] Direct storage download by outside user denied by Storage RLS.");
    } else {
      console.log("   [FAIL] Charlie was able to download Alice's storage object directly!");
    }

    // 8b. Charlie attempts to fetch Alice's envelope via API route
    try {
      const apiRes = await fetch(`http://localhost:3000/api/vault/envelope?pairId=${pair1.id}`, {
        headers: {
          Authorization: `Bearer ${authC.session.access_token}`,
        },
      });
      const apiJson = await apiRes.json();
      if (apiRes.status === 403 || apiJson.error === "Forbidden.") {
        console.log("   [PASS] API route /api/vault/envelope correctly denied outside user with HTTP 403.");
      } else {
        console.log(`   [FAIL] API route returned HTTP ${apiRes.status}:`, apiJson);
      }
    } catch (apiErr) {
      console.log("   [NOTE] Local server fetch skipped or errored:", apiErr.message);
    }

    // Clean up test storage object
    await admin.storage.from("memories").remove([testStoragePath]);
  }

  console.log("\n9. Cleaning up test accounts...");
  await admin.from("pairs").delete().eq("id", pair1.id);
  await admin.from("pairs").delete().eq("id", pair2.id);
  await admin.from("users").delete().in("id", [userA.id, userB.id, userC.id]);
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
  await admin.auth.admin.deleteUser(userC.id);
  console.log("   Cleaned up test users and pairs successfully.");

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("       TWO-ACCOUNT INTEGRATION TEST HARNESS COMPLETE            ");
  console.log("════════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
