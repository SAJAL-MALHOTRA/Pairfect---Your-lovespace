const { chromium } = require('playwright-core');
const { createBrowserClient } = require('@supabase/ssr');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...rest] = trimmed.split('=');
      process.env[k.trim()] = rest.join('=').trim();
    }
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhykmhfrptyjkagwetku.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey);

// Custom helper for smooth, human-like mouse movement
async function smoothMouseMove(page, startX, startY, endX, endY, durationMs = 600, steps = 25) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Cubic bezier ease-in-out
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const x = startX + (endX - startX) * ease;
    const y = startY + (endY - startY) * ease;
    await page.mouse.move(x, y);
    await page.evaluate(({ cx, cy }) => {
      let c = document.getElementById('cinematic-cursor');
      if (c) {
        c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
    }, { cx: x, cy: y });
    await page.waitForTimeout(durationMs / steps);
  }
}

// Custom smooth scroll helper
async function smoothScroll(page, targetY, durationMs = 1200, steps = 30) {
  const currentY = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const y = currentY + (targetY - currentY) * ease;
    await page.evaluate((scrollPos) => window.scrollTo(0, scrollPos), y);
    await page.waitForTimeout(durationMs / steps);
  }
}

async function injectCinematicCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('cinematic-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'cinematic-cursor';
    cursor.innerHTML = `
      <div style="position:relative; width:22px; height:22px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 5px rgba(142,43,69,0.4));">
          <path d="M4 3L18 12L11 14L8 21L4 3Z" fill="#8E2B45" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
        <div id="cursor-glow" style="position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:50%; background:rgba(232,82,125,0.3); pointer-events:none; filter:blur(4px);"></div>
      </div>
    `;
    cursor.style.position = 'fixed';
    cursor.style.top = '0px';
    cursor.style.left = '0px';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999999';
    cursor.style.transform = 'translate3d(720px, 450px, 0)';
    cursor.style.transition = 'opacity 0.2s ease';
    document.body.appendChild(cursor);
  });
}

(async () => {
  console.log('Generating auth session for Sajal Malhotra...');
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'malhotrasajal243@gmail.com'
  });
  const otp = linkData.properties.email_otp;

  const cookiesObj = {};
  const browserClient = createBrowserClient(url, anonKey, {
    cookies: {
      getAll() { return Object.entries(cookiesObj).map(([name, value]) => ({ name, value })); },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value }) => { cookiesObj[name] = value; }); }
    }
  });

  await browserClient.auth.verifyOtp({ email: 'malhotrasajal243@gmail.com', token: otp, type: 'email' });

  const rawVideoDir = path.resolve('temp_video_raw');
  if (fs.existsSync(rawVideoDir)) {
    fs.rmSync(rawVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(rawVideoDir, { recursive: true });

  console.log('Launching Chrome with 1920x1080 resolution...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=max',
      '--force-color-profile=srgb',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const playwrightCookies = Object.entries(cookiesObj).map(([name, value]) => ({
    name, value, domain: '.pairfect.site', path: '/', httpOnly: false, secure: true, sameSite: 'Lax'
  }));
  await context.addCookies(playwrightCookies);

  const page = await context.newPage();

  // ══════════════════════════════════════════════════════════
  // SCENE 1: LANDING PAGE (0:00 - 0:05)
  // "Your relationship has a thousand little moments."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 1: Loading landing page...');
  await page.goto('https://pairfect.site', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(1500);

  // Smooth cinematic pan down landing page
  await smoothMouseMove(page, 720, 450, 960, 520, 800);
  await smoothScroll(page, 450, 1500);
  await page.waitForTimeout(1000);
  await smoothMouseMove(page, 960, 520, 1100, 300, 700);

  // ══════════════════════════════════════════════════════════
  // SCENE 2: DASHBOARD REVEAL (0:05 - 0:13)
  // "The conversations you had. The things you never want to forget."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 2: Transitioning to Dashboard...');
  await page.goto('https://pairfect.site/dashboard', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(2000);

  // Establish the couple's sanctuary
  await smoothMouseMove(page, 1100, 300, 780, 280, 1000); // Hover near Meanwhile proximity card
  await page.waitForTimeout(1200);

  // Move over anniversary countdown & wax seal keepsake
  await smoothScroll(page, 320, 1200);
  await smoothMouseMove(page, 780, 280, 550, 480, 900);
  await page.waitForTimeout(1500);

  // ══════════════════════════════════════════════════════════
  // SCENE 3: BETWEEN THE LINES / CONVERSATION (0:13 - 0:22)
  // "The games you played just to make each other laugh.
  // Pairfect brings them all into one private space — just for the two of you."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 3: Navigating to Between the Lines (AI Vibe Judge)...');
  await page.goto('https://pairfect.site/vibe-judge', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(1800);

  await smoothMouseMove(page, 550, 480, 960, 400, 1000);
  await smoothScroll(page, 280, 1200);
  await page.waitForTimeout(2000);

  // ══════════════════════════════════════════════════════════
  // SCENE 4: LETTERS EXPERIENCE & WAX SEAL (0:22 - 0:30)
  // "Ask something deeper. Leave them a letter."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 4: Navigating to Love Letters...');
  await page.goto('https://pairfect.site/love-letter', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(2000);

  // Move toward the letter envelope / wax seal
  await smoothMouseMove(page, 960, 400, 700, 420, 900);
  await page.waitForTimeout(1200);

  // Scroll gently to show correspondence archive
  await smoothScroll(page, 350, 1200);
  await smoothMouseMove(page, 700, 420, 850, 520, 900);
  await page.waitForTimeout(2000);

  // ══════════════════════════════════════════════════════════
  // SCENE 5: PLAYROOM & COUPLE GAMES (0:30 - 0:38)
  // "Challenge each other."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 5: Navigating to Play...');
  await page.goto('https://pairfect.site/play', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(1800);

  // Highlight IQ Duel, Riddle Night, and Photobooth
  await smoothMouseMove(page, 850, 520, 600, 450, 900);
  await page.waitForTimeout(1200);
  await smoothScroll(page, 300, 1200);
  await smoothMouseMove(page, 600, 450, 1100, 460, 900);
  await page.waitForTimeout(2000);

  // ══════════════════════════════════════════════════════════
  // SCENE 6: LIVING ARCHIVE & STORIES (0:38 - 0:46)
  // "Keep the moments that became your story."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 6: Navigating to Stories / Living Archive...');
  await page.goto('https://pairfect.site/stories', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(2000);

  await smoothMouseMove(page, 1100, 460, 800, 420, 1000);
  await smoothScroll(page, 380, 1400);
  await page.waitForTimeout(2200);

  // ══════════════════════════════════════════════════════════
  // SCENE 7: RETURN TO SANCTUARY DASHBOARD (0:46 - 0:53)
  // "Because your relationship isn't just something you live.
  // It's something worth keeping."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 7: Returning to Dashboard...');
  await page.goto('https://pairfect.site/dashboard', { waitUntil: 'networkidle' });
  await injectCinematicCursor(page);
  await page.waitForTimeout(1500);

  // Gentle overview of the home sanctuary
  await smoothMouseMove(page, 800, 420, 960, 380, 900);
  await smoothScroll(page, 200, 1000);
  await page.waitForTimeout(2000);

  // ══════════════════════════════════════════════════════════
  // SCENE 8: CINEMATIC OUTRO BRANDING (0:53 - 1:00)
  // "Pairfect. Conversations that connect."
  // ══════════════════════════════════════════════════════════
  console.log('Scene 8: Displaying Cinematic Outro...');
  await page.evaluate(() => {
    // Smooth cinematic overlay
    const overlay = document.createElement('div');
    overlay.id = 'cinematic-outro';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, #351020 0%, #17070F 100%);
      z-index: 99999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1);
      color: #FAF5EB;
      font-family: 'Playfair Display', Georgia, serif;
    `;
    overlay.innerHTML = `
      <div style="text-align:center; display:flex; flex-direction:column; align-items:center; transform:translateY(10px); transition:transform 1.4s ease;">
        <div style="width:64px; height:64px; border-radius:50%; background:rgba(232,82,125,0.15); border:1px solid rgba(232,82,125,0.3); display:flex; align-items:center; justify-content:center; margin-bottom:24px; box-shadow:0 0 35px rgba(232,82,125,0.25);">
          <span style="font-size:28px;">♥</span>
        </div>
        <h1 style="font-size:62px; font-weight:700; letter-spacing:4px; margin:0 0 12px 0; color:#FFFFFF; text-shadow:0 4px 20px rgba(0,0,0,0.5);">PAIRFECT</h1>
        <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:16px; font-weight:600; letter-spacing:6px; color:#E8527D; text-transform:uppercase; margin:0 0 28px 0;">CONVERSATIONS THAT CONNECT.</p>
        <div style="padding:10px 28px; border-radius:999px; background:rgba(250,245,235,0.08); border:1px solid rgba(250,245,235,0.18); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; letter-spacing:1px; color:#FAF5EB;">
          pairfect.site
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    // Hide cursor on outro
    const cur = document.getElementById('cinematic-cursor');
    if (cur) cur.style.opacity = '0';

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      const inner = overlay.firstElementChild;
      if (inner) inner.style.transform = 'translateY(0)';
    });
  });

  // Hold the final clean branded view for 6.5 seconds
  await page.waitForTimeout(6500);

  console.log('Recording finished! Closing browser context to flush video...');
  await page.close();
  await context.close();
  await browser.close();

  console.log('Capture complete!');
})();
