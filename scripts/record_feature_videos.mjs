import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import ffmpegPath from "ffmpeg-static";

const publicVideosDir = path.resolve("public", "videos");
if (!fs.existsSync(publicVideosDir)) {
  fs.mkdirSync(publicVideosDir, { recursive: true });
}

const tempRecordDir = path.resolve("temp_recordings");
if (fs.existsSync(tempRecordDir)) {
  fs.rmSync(tempRecordDir, { recursive: true, force: true });
}
fs.mkdirSync(tempRecordDir, { recursive: true });

const possiblePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const executablePath = possiblePaths.find((p) => p && fs.existsSync(p));

function convertWebmToMp4(inputWebm, outputMp4) {
  console.log(`Converting ${path.basename(inputWebm)} -> ${path.basename(outputMp4)}...`);
  const args = [
    "-y",
    "-i", inputWebm,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    outputMp4,
  ];
  const res = spawnSync(ffmpegPath, args, { stdio: "inherit" });
  if (res.status !== 0) {
    console.error(`ffmpeg conversion failed for ${outputMp4}`);
  } else {
    console.log(`Successfully generated: ${outputMp4}`);
  }
}

async function recordBouquet(browser) {
  console.log("\n--- Recording 1/4: Bouquet Bloom & Ribbon Untying ---");
  const subDir = path.join(tempRecordDir, "bouquet");
  fs.mkdirSync(subDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: subDir, size: { width: 1280, height: 800 } },
  });

  const page = await context.newPage();

  const payload = {
    flowers: ["rose", "peony", "tulip", "camellia", "hydrangea"],
    wrapping: "kraft",
    ribbon: "rose",
    greenery: "eucalyptus",
    atmosphere: "petals",
    toName: "Darling",
    fromName: "With All My Love",
    message: "Handpicked for you. Thinking of you today and always.",
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64");

  await page.goto(`http://localhost:3000/bouquet?share=${b64}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Untie Ribbon button
  const untieBtn = await page.getByRole("button", { name: /Untie Ribbon/i });
  if (untieBtn) {
    console.log("Clicking Untie Ribbon & Unwrap Bouquet button...");
    await untieBtn.click();
    await page.waitForTimeout(5000);
  } else {
    await page.waitForTimeout(4000);
  }

  await page.close();
  await context.close();

  const files = fs.readdirSync(subDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const rawWebm = path.join(subDir, files[0]);
    const finalMp4 = path.join(publicVideosDir, "bouquet_animation.mp4");
    convertWebmToMp4(rawWebm, finalMp4);
  }
}

async function recordLoveLetter(browser) {
  console.log("\n--- Recording 2/4: Love Letter Wax Seal Shatter & 3D Envelope Unfold ---");
  const subDir = path.join(tempRecordDir, "letter");
  fs.mkdirSync(subDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: subDir, size: { width: 1280, height: 800 } },
  });

  const page = await context.newPage();

  const payload = {
    toName: "My Love",
    fromName: "Always Yours",
    blocks: [
      { type: "text", value: "You are the sweetest thought in my everyday life." },
      { type: "text", value: "Every second with you is a moment I treasure forever." },
    ],
    style: "classic",
    sent_at: new Date().toISOString(),
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64");

  await page.goto(`http://localhost:3000/love-letter?share=${b64}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Click wax seal button to trigger fracture, 3D flap flip, and paper rise
  const sealBtn = await page.getByRole("button", { name: /Break the seal/i });
  if (sealBtn) {
    console.log("Clicking Wax Seal Button...");
    await sealBtn.click();
    await page.waitForTimeout(6500);
  } else {
    await page.waitForTimeout(4000);
  }

  await page.close();
  await context.close();

  const files = fs.readdirSync(subDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const rawWebm = path.join(subDir, files[0]);
    const finalMp4 = path.join(publicVideosDir, "love_letter_animation.mp4");
    convertWebmToMp4(rawWebm, finalMp4);
  }
}

async function recordWhisperFM(browser) {
  console.log("\n--- Recording 3/4: Whisper FM Vacuum Tubes, Needle Inertia & Soundwaves ---");
  const subDir = path.join(tempRecordDir, "whisper");
  fs.mkdirSync(subDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: subDir, size: { width: 1280, height: 800 } },
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000/whisper", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // Step up frequency twice to demonstrate mechanical needle spring inertia
  const stepUpBtn = await page.getByTitle("Tune Up");
  if (stepUpBtn) {
    console.log("Stepping frequency up...");
    await stepUpBtn.click();
    await page.waitForTimeout(1000);
    await stepUpBtn.click();
    await page.waitForTimeout(1200);
  }

  // Scan or tune to whisper to demonstrate lock-in flash
  const scanBtn = await page.getByTitle("Scan to Next Voice Note");
  if (scanBtn) {
    console.log("Triggering auto-scan to partner frequency...");
    await scanBtn.click();
    await page.waitForTimeout(2500);
  }

  // Allow breathing vacuum tube coils and speaker wave animations to record
  await page.waitForTimeout(4000);

  await page.close();
  await context.close();

  const files = fs.readdirSync(subDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const rawWebm = path.join(subDir, files[0]);
    const finalMp4 = path.join(publicVideosDir, "whisper_fm_animation.mp4");
    convertWebmToMp4(rawWebm, finalMp4);
  }
}

async function recordPhotoboothStrip(browser) {
  console.log("\n--- Recording 4/4: Photobooth Strip Stepped Ejection & Chemical Developing ---");
  const subDir = path.join(tempRecordDir, "photobooth");
  fs.mkdirSync(subDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: subDir, size: { width: 1280, height: 800 } },
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000/photo-booth?mode=solo", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Click Capture to run sequence
  const captureBtn = await page.getByRole("button", { name: "Capture" });
  if (captureBtn) {
    console.log("Starting Capture sequence...");
    await captureBtn.click();
    console.log("Waiting for result screen...");
    await page.waitForSelector("text=Picture perfect!", { timeout: 30000 });
    // Record the stepped printer ejection and chemical developing
    await page.waitForTimeout(4500);

    // Click "Watch Print Animation Again" to replay the animation
    const replayBtn = await page.getByRole("button", { name: /Watch Print Animation Again/i });
    if (replayBtn) {
      console.log("Replaying print animation...");
      await replayBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await page.close();
  await context.close();

  const files = fs.readdirSync(subDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const rawWebm = path.join(subDir, files[0]);
    const finalMp4 = path.join(publicVideosDir, "photobooth_strip_animation.mp4");
    convertWebmToMp4(rawWebm, finalMp4);
  }
}

async function run() {
  console.log("Launching headless browser for recording...");
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });

  try {
    await recordPhotoboothStrip(browser);
    console.log("\nPhotobooth recording completed successfully!");
  } catch (err) {
    console.error("Recording error:", err);
  } finally {
    await browser.close();
    // Clean up raw webm directory
    if (fs.existsSync(tempRecordDir)) {
      try {
        fs.rmSync(tempRecordDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

run();
