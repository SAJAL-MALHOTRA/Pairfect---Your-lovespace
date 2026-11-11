import fs from "fs";
import crypto from "crypto";

const content = fs.readFileSync("./src/lib/crypto/bip39-wordlist.ts", "utf8");
const arrayMatch = content.match(/=\s*(\[[\s\S]*?\])\s*as\s*const/);
if (!arrayMatch) {
  throw new Error("Could not find wordlist array");
}

const words = JSON.parse(arrayMatch[1]);
console.log("Total words:", words.length);
console.log("First word:", words[0]);
console.log("Last word:", words[words.length - 1]);

const newlineJoined = words.join("\n");
const withTrailing = words.join("\n") + "\n";
const hashNoTrailing = crypto.createHash("sha256").update(newlineJoined).digest("hex");
const hashTrailing = crypto.createHash("sha256").update(withTrailing).digest("hex");
console.log("SHA-256 (no trailing newline):", hashNoTrailing);
console.log("SHA-256 (with trailing newline):", hashTrailing);
console.log("Official BIP-39 SHA-256: 2f5eed53a04dd27b7300aeb29b9e8f1a2720e6f7e3f994e14f6b2cd72b9a7004");
console.log("Matches trailing:", hashTrailing === "2f5eed53a04dd27b7300aeb29b9e8f1a2720e6f7e3f994e14f6b2cd72b9a7004");

// Fetch official raw english.txt and compare
try {
  const res = await fetch("https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt");
  const officialText = await res.text();
  const officialHash = crypto.createHash("sha256").update(officialText).digest("hex");
  console.log("Fetched official english.txt hash:", officialHash);
  const officialWords = officialText.trim().split(/\r?\n/);
  console.log("Official words count:", officialWords.length);
  let mismatches = 0;
  for (let i = 0; i < Math.max(words.length, officialWords.length); i++) {
    if (words[i] !== officialWords[i]) {
      console.log(`Mismatch at index ${i}: our word = "${words[i]}", official word = "${officialWords[i]}"`);
      mismatches++;
      if (mismatches > 5) break;
    }
  }
  if (mismatches === 0) {
    console.log("PERFECT 100% MATCH against official bitcoin/bips BIP-39 wordlist!");
  }
} catch (err) {
  console.error("Could not fetch official wordlist:", err.message);
}
