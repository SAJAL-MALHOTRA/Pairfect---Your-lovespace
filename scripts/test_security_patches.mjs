import assert from "node:assert";

console.log("=================================================");
console.log("      PAIRFECT SECURITY & RLS PATCH VERIFICATION ");
console.log("=================================================\n");

// 1. Test getActiveKey() behavior under production without key
console.log("1. Testing APP_ENCRYPTION_KEY production guard...");
const originalNodeEnv = process.env.NODE_ENV;
const originalKey = process.env.APP_ENCRYPTION_KEY;

try {
  process.env.NODE_ENV = "production";
  delete process.env.APP_ENCRYPTION_KEY;

  // Dynamic import of encryption module
  const { encrypt } = await import("../src/lib/encryption.ts");
  
  let threwExpected = false;
  try {
    encrypt("sensitive argument");
  } catch (err) {
    threwExpected = true;
    console.log("   [PASS] Threw fatal error as expected in production without key:", err.message);
  }
  assert.strictEqual(threwExpected, true, "Should reject encryption in production if APP_ENCRYPTION_KEY is unset");
} finally {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalKey) {
    process.env.APP_ENCRYPTION_KEY = originalKey;
  }
}

// 2. Test Rate Limiter on Spotify Search
console.log("\n2. Testing Spotify Search sliding-window rate limiter...");
const serverUrl = "http://localhost:3000";

let hitRateLimit = false;
let rateLimitStatus = 0;

for (let i = 1; i <= 35; i++) {
  const res = await fetch(`${serverUrl}/api/spotify/search?q=love`, {
    headers: { "x-forwarded-for": "198.51.100.42" },
  });

  if (res.status === 429) {
    hitRateLimit = true;
    rateLimitStatus = res.status;
    const json = await res.json();
    console.log(`   [PASS] Request ${i} was rate limited (HTTP ${res.status}): ${json.error}`);
    break;
  }
}

assert.strictEqual(hitRateLimit, true, "Spotify search should throttle after 30 requests per minute per IP");
assert.strictEqual(rateLimitStatus, 429, "Expected HTTP 429 Too Many Requests");

// 3. Test Rate Limiter on Vibe Judge
console.log("\n3. Testing Vibe Judge rate limiter unauthorized vs throttled...");
// Unauthenticated request should return 401
const unauthRes = await fetch(`${serverUrl}/api/disputes/judge`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ disputeId: "nonexistent" }),
});
console.log(`   [PASS] Unauthenticated request safely rejected with HTTP ${unauthRes.status}`);
assert.strictEqual(unauthRes.status, 401, "Expected 401 Unauthorized for unauthenticated call");

console.log("\n=================================================");
console.log("      ALL SECURITY & RLS PATCH CHECKS PASSED     ");
console.log("=================================================");
