const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpeg = require('ffmpeg-static');

const rawVideoDir = path.resolve('temp_video_raw_30s');
const audioMixFile = path.resolve('temp_audio_30s', 'cinematic_audio_30s.aac');
const desktopOutput = 'C:\\Users\\2006s\\Desktop\\pairfect_30s_launch_video.mp4';
const publicOutput = path.resolve('public', 'pairfect_30s_launch_video.mp4');

async function run() {
  if (fs.existsSync(rawVideoDir)) {
    fs.rmSync(rawVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(rawVideoDir, { recursive: true });

  console.log("1. Launching Playwright browser with 1920x1080 video recording...");
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log("2. Navigating to Launch Film player...");
  await page.goto("http://localhost:3000/launch-film", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Click start overlay to begin 30-second playback
  console.log("3. Triggering 30-second film sequence...");
  const playBtn = page.locator("text=Watch 30s Launch Film").first();
  if (await playBtn.isVisible()) {
    await playBtn.click();
  }

  // Record through full 30-second duration plus small safety margin
  console.log("4. Recording full 30.5 seconds of motion sequence...");
  await page.waitForTimeout(30500);

  // Close context to flush video to disk
  console.log("5. Finalizing video capture...");
  await page.close();
  await context.close();
  await browser.close();

  // Find recorded raw video
  const rawFiles = fs.readdirSync(rawVideoDir).filter(f => f.endsWith('.webm'));
  if (rawFiles.length === 0) {
    throw new Error("No raw webm video was recorded by Playwright.");
  }
  const rawVideoPath = path.join(rawVideoDir, rawFiles[0]);
  console.log("Captured raw video:", rawVideoPath);

  // 6. Assemble into production 1080p MP4 with synced audio
  console.log("6. Compositing raw video with master audio via FFmpeg...");
  const filterComplex = [
    `[0:v]eq=contrast=1.03:brightness=0.01:saturation=1.04,fade=t=in:st=0:d=0.5,fade=t=out:st=28.5:d=1.5[v]`,
    `[1:a]afade=t=in:st=0:d=0.3,afade=t=out:st=28.0:d=2.0[a]`
  ].join(';');

  const args = [
    '-y',
    '-i', rawVideoPath,
    '-i', audioMixFile,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-map', '[a]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', '30.0',
    desktopOutput
  ];

  const res = spawnSync(ffmpeg, args, { stdio: 'inherit' });

  if (res.status === 0) {
    console.log("Production 30s video created on Desktop:", desktopOutput);
    fs.copyFileSync(desktopOutput, publicOutput);
    console.log("Also copied to public:", publicOutput);
  } else {
    throw new Error(`FFmpeg assembly failed with exit code: ${res.status}`);
  }
}

run().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
