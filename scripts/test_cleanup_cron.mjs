import assert from "assert";
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

const cronSecret = env.CRON_SECRET || process.env.CRON_SECRET || "cron_dev_secret";
const baseUrl = "http://localhost:3000";

let passed = 0;
let failed = 0;

function pass(msg) {
  passed++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg) {
  failed++;
  console.error(`  [FAIL] ${msg}`);
}

async function run() {
  console.log("========================================================================");
  console.log("  CRON TRANSPORT ENVELOPE CLEANUP TEST SUITE                            ");
  console.log("========================================================================\n");

  // 1. Reject unauthorized requests (no secret)
  console.log("1. Testing unauthenticated request rejection...");
  const resNoAuth = await fetch(`${baseUrl}/api/cron/cleanup-transport-envelopes`, {
    method: "POST",
  });
  assert(resNoAuth.status === 401 || resNoAuth.status === 503, `Expected 401 or 503, got ${resNoAuth.status}`);
  pass("Unauthenticated request rejected with status " + resNoAuth.status);

  // 2. Reject incorrect secret
  console.log("2. Testing invalid secret rejection...");
  const resBadAuth = await fetch(`${baseUrl}/api/cron/cleanup-transport-envelopes`, {
    method: "POST",
    headers: { Authorization: "Bearer wrong_secret_token" },
  });
  assert(resBadAuth.status === 401 || resBadAuth.status === 503, `Expected 401 or 503, got ${resBadAuth.status}`);
  pass("Invalid bearer token rejected with status " + resBadAuth.status);

  // 3. Accept valid secret (Bearer)
  console.log("3. Testing authorized request with Bearer token...");
  const resGoodAuth = await fetch(`${baseUrl}/api/cron/cleanup-transport-envelopes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  if (resGoodAuth.status === 503) {
    console.log("  [INFO] CRON_SECRET not set in environment (503 expected in dev without CRON_SECRET)");
    pass("Fail-closed security verified: 503 when CRON_SECRET unset");
  } else {
    assert.strictEqual(resGoodAuth.status, 200, "Must succeed with 200 OK");
    const json = await resGoodAuth.json();
    assert.strictEqual(json.success, true, "Cron response success must be true");
    assert(json.summary, "Cron response must contain summary object");
    pass(`Cron executed successfully: examined ${json.summary.pendingPairsExamined} pending and ${json.summary.activePairsExamined} active pairs`);
  }

  // 4. Accept valid secret via GET (?key=)
  console.log("4. Testing authorized GET request with query key parameter...");
  const resGetAuth = await fetch(`${baseUrl}/api/cron/cleanup-transport-envelopes?key=${cronSecret}`, {
    method: "GET",
  });
  if (resGetAuth.status === 503) {
    pass("Fail-closed security verified for GET: 503 when CRON_SECRET unset");
  } else {
    assert.strictEqual(resGetAuth.status, 200, "GET must succeed with 200 OK");
    const json = await resGetAuth.json();
    assert.strictEqual(json.success, true, "GET response success must be true");
    pass("GET cron trigger executed successfully with status 200");
  }

  console.log("\n========================================================================");
  console.log(`CLEANUP CRON SUITE: ${passed} / ${passed + failed} checks passed!`);
  console.log("========================================================================");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
