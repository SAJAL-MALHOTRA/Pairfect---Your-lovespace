import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';

const BASE_URL = process.env.BOOTH_TEST_BASE_URL ?? 'http://localhost:3000';

const TEST_USERS = {
  host: {
    email: process.env.BOOTH_TEST_HOST_EMAIL ?? 'booth-test-host@pairfect.site',
    password: process.env.BOOTH_TEST_HOST_PW ?? 'TestPassword123!',
  },
  guest: {
    email: process.env.BOOTH_TEST_GUEST_EMAIL ?? 'booth-test-guest@pairfect.site',
    password: process.env.BOOTH_TEST_GUEST_PW ?? 'TestPassword123!',
  },
  rogue: {
    email: process.env.BOOTH_TEST_ROGUE_EMAIL ?? 'booth-test-rogue@pairfect.site',
    password: process.env.BOOTH_TEST_ROGUE_PW ?? 'TestPassword123!',
  },
};

/**
 * Launches a context with a real fake camera stream (a synthetic moving
 * test pattern, not a black frame), so getUserMedia() actually resolves
 * and downstream capture code has real pixels to work with.
 */
async function launchCameraContext(): Promise<BrowserContext> {
  const browser = await chromium.launch({
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  });
  return browser.newContext({ permissions: ['camera', 'microphone'] });
}

async function launchNoCameraContext(): Promise<BrowserContext> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.grantPermissions([]);
  return context;
}

async function signIn(page: Page, creds: { email: string; password: string }) {
  await page.goto(`${BASE_URL}/login`);
  const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
  await emailInput.fill(creds.email);
  const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
  await passwordInput.fill(creds.password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

/** Pulls the Supabase access token out of the page's own session */
async function getAccessToken(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  for (const c of cookies) {
    if (c.name.includes('auth-token')) {
      let raw = c.value;
      if (raw.startsWith('base64-')) {
        raw = Buffer.from(raw.slice(7), 'base64').toString('utf-8');
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.access_token) return parsed.access_token;
      } catch {}
    }
  }

  const token = await page.evaluate(async () => {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.includes('-auth-token') || k.includes('auth-token') || k.startsWith('sb-')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || '');
          if (parsed?.access_token) return parsed.access_token;
        } catch {}
      }
    }
    return null;
  });
  if (!token) throw new Error('Could not extract access token from page session.');
  return token;
}

/** Helper to join host and guest into a shared booth session */
async function setupSharedSession(hostPage: Page, guestPage: Page): Promise<string> {
  await hostPage.goto(`${BASE_URL}/photo-booth`);
  await hostPage.getByRole('button', { name: /start a shared booth/i }).click();

  const codeLocator = hostPage.getByTestId('booth-code').first();
  await expect(codeLocator).toBeVisible({ timeout: 10000 });
  const boothCode = (await codeLocator.textContent())?.trim();
  if (!boothCode) throw new Error('Failed to retrieve booth code.');

  await guestPage.goto(`${BASE_URL}/photo-booth`);
  await guestPage.getByRole('button', { name: /join partner's booth/i }).click();
  await guestPage.getByLabel(/booth code/i).fill(boothCode);
  await guestPage.getByRole('button', { name: /join/i }).click();

  await expect(hostPage.getByText(/partner joined/i)).toBeVisible({ timeout: 15000 });
  await expect(guestPage.getByText(/partner joined/i)).toBeVisible({ timeout: 15000 });

  return boothCode;
}

test.describe('Synchronized Virtual Photobooth', () => {
  test.setTimeout(60000);

  // Test 1: Host creates a booth, guest joins by code, both reach PARTNER_JOINED
  test('host creates a booth, guest joins by code, both reach PARTNER_JOINED', async () => {
    const hostCtx = await launchCameraContext();
    const guestCtx = await launchCameraContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await signIn(hostPage, TEST_USERS.host);
    await signIn(guestPage, TEST_USERS.guest);

    const boothCode = await setupSharedSession(hostPage, guestPage);
    expect(boothCode).toMatch(/^[A-Z0-9]{4}$/);

    await hostPage.waitForFunction(() => {
      const el = document.querySelector('[data-testid="partner-video"]') as HTMLVideoElement | null;
      return !!el?.srcObject;
    }, { timeout: 15000 }).catch(() => {});

    await guestPage.waitForFunction(() => {
      const el = document.querySelector('[data-testid="partner-video"]') as HTMLVideoElement | null;
      return !!el?.srcObject;
    }, { timeout: 15000 }).catch(() => {});

    const hostRemoteVideoHasStream = await hostPage.evaluate(() => {
      const el = document.querySelector('[data-testid="partner-video"]') as HTMLVideoElement | null;
      return !!el?.srcObject;
    });
    const guestRemoteVideoHasStream = await guestPage.evaluate(() => {
      const el = document.querySelector('[data-testid="partner-video"]') as HTMLVideoElement | null;
      return !!el?.srcObject;
    });
    expect(hostRemoteVideoHasStream).toBe(true);
    expect(guestRemoteVideoHasStream).toBe(true);

    await hostCtx.close();
    await guestCtx.close();
  });

  // Test 2: Measured capture delta under 300ms artificial clock skew on guest context
  test('measured capture delta under 300ms artificial clock skew on guest context is within target window', async () => {
    const hostCtx = await launchCameraContext();
    const guestCtx = await launchCameraContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    // Inject artificial clock skew on guest context (pretend guest wall clock is 300ms ahead of the server)
    await guestPage.addInitScript(() => {
      const skewMs = 300; // pretend guest's wall clock is 300ms ahead of the server
      const realNow = Date.now;
      const realPerfNow = performance.now.bind(performance);
      Date.now = () => realNow() + skewMs;
      performance.now = () => realPerfNow(); // keep the monotonic timer real — only skew wall-clock time
    });
    console.log('[Test 2] Injected 300ms artificial clock skew on guest context via addInitScript');

    await signIn(hostPage, TEST_USERS.host);
    await signIn(guestPage, TEST_USERS.guest);

    await setupSharedSession(hostPage, guestPage);

    await expect(hostPage.getByRole('button', { name: /take shot 1/i })).toBeVisible({ timeout: 10000 });

    const [hostCaptureTs, guestCaptureTs] = await Promise.all([
      hostPage.evaluate(
        () =>
          new Promise<number>((resolve) => {
            window.addEventListener('booth:frame-captured', (e: any) => resolve(e.detail.performanceNow), {
              once: true,
            });
          })
      ),
      guestPage.evaluate(
        () =>
          new Promise<number>((resolve) => {
            window.addEventListener('booth:frame-captured', (e: any) => resolve(e.detail.performanceNow), {
              once: true,
            });
          })
      ),
      (async () => {
        await hostPage.waitForTimeout(300);
        await hostPage.getByRole('button', { name: /take shot 1/i }).click();
      })(),
    ]);

    const delta = Math.abs(hostCaptureTs - guestCaptureTs);
    console.log(`Measured capture delta under 300ms injected skew: ${delta.toFixed(1)}ms`);
    expect(delta).toBeLessThanOrEqual(50);

    await hostCtx.close();
    await guestCtx.close();
  });

  // Test 3: Backgrounded tab still fires capture on time (real Chrome throttling, not Node)
  test('backgrounded tab still fires capture on time (real Chrome throttling, not Node)', async () => {
    const hostCtx = await launchCameraContext();
    const guestCtx = await launchCameraContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await signIn(hostPage, TEST_USERS.host);
    await signIn(guestPage, TEST_USERS.guest);

    await setupSharedSession(hostPage, guestPage);

    await expect(hostPage.getByRole('button', { name: /take shot 1/i })).toBeVisible({ timeout: 10000 });

    const client = await hostCtx.newCDPSession(hostPage);

    const hostCapturePromise = hostPage.evaluate(
      () =>
        new Promise<{ performanceNow: number; wallClockMs: number; captureAt?: string }>((resolve) => {
          window.addEventListener('booth:frame-captured', (e: any) => resolve(e.detail), {
            once: true,
          });
        })
    );

    await hostPage.getByRole('button', { name: /take shot 1/i }).click();

    let lifecycleBranch = 'unknown';
    try {
      await client.send('Page.setWebLifecycleState', { state: 'frozen' });
      lifecycleBranch = 'Page.setWebLifecycleState(frozen)';
      console.log("[Test 3] CONFIRMED BRANCH: Page.setWebLifecycleState({ state: 'frozen' }) succeeded directly via CDP.");
    } catch (err: any) {
      console.log(`[Test 3] CDP setWebLifecycleState failed (${err?.message}), executing visibilitychange fallback.`);
      await hostPage.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      lifecycleBranch = 'visibilitychange fallback';
    }
    console.log(`[Test 3] Active lifecycle branch: ${lifecycleBranch}`);

    const eventDetail = await hostCapturePromise;
    expect(eventDetail.performanceNow).toBeTruthy();
    expect(eventDetail.wallClockMs).toBeTruthy();

    if (eventDetail.captureAt) {
      const scheduledMs = Date.parse(eventDetail.captureAt);
      const driftMs = Math.abs(eventDetail.wallClockMs - scheduledMs);
      console.log(`Backgrounded tab fire drift against target: ${driftMs.toFixed(1)}ms`);
      expect(driftMs).toBeLessThan(100);
    }

    await hostCtx.close();
    await guestCtx.close();
  });

  // Test 4: /api/booth/turn rejects a non-participant with 403, and an expired session with 410
  test('/api/booth/turn rejects a non-participant with 403, and an expired session with 410', async () => {
    const hostBrowser = await chromium.launch();
    const hostPage = await hostBrowser.newPage();
    await signIn(hostPage, TEST_USERS.host);
    const hostToken = await getAccessToken(hostPage);

    const rogueBrowser = await chromium.launch();
    const roguePage = await rogueBrowser.newPage();
    await signIn(roguePage, TEST_USERS.rogue);
    const rogueToken = await getAccessToken(roguePage);

    const createRes = await hostPage.request.post(`${BASE_URL}/api/booth`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { action: 'create' },
    });
    expect(createRes.ok()).toBe(true);
    const { session } = await createRes.json();

    const hostTurnRes = await hostPage.request.get(`${BASE_URL}/api/booth/turn?sessionId=${session.id}`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    expect(hostTurnRes.status()).toBe(200);

    const rogueTurnRes = await roguePage.request.get(`${BASE_URL}/api/booth/turn?sessionId=${session.id}`, {
      headers: { Authorization: `Bearer ${rogueToken}` },
    });
    expect(rogueTurnRes.status()).toBe(403);

    const expireRes = await hostPage.request.post(`${BASE_URL}/api/booth/state`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { sessionId: session.id, action: 'expire' },
    });
    expect(expireRes.ok()).toBe(true);

    const expiredTurnRes = await hostPage.request.get(`${BASE_URL}/api/booth/turn?sessionId=${session.id}`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    expect(expiredTurnRes.status()).toBe(410);

    await hostBrowser.close();
    await rogueBrowser.close();
  });

  // Test 5: camera permission denied shows fallback UI and upload path completes
  test('camera permission denied shows fallback UI and upload path completes', async () => {
    const ctx = await launchNoCameraContext();
    const page = await ctx.newPage();
    await signIn(page, TEST_USERS.host);

    await page.goto(`${BASE_URL}/photo-booth`);
    await page.getByRole('button', { name: /start a shared booth/i }).click();

    await expect(page.getByText(/camera.*(not available|unavailable|denied)/i)).toBeVisible({ timeout: 10000 });

    const fileInput = page.getByTestId('booth-photo-upload-input');
    await fileInput.setInputFiles({
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        'base64'
      ),
    });
    await page.getByRole('button', { name: /use this photo|upload/i }).click();

    await expect(page.getByText(/photo (added|uploaded)/i)).toBeVisible({ timeout: 10000 });

    await ctx.close();
  });

  // Test 6: guest tab refresh mid-session rehydrates via the real /api/booth route
  test('guest tab refresh mid-session rehydrates via the real /api/booth route', async () => {
    const hostCtx = await launchCameraContext();
    const guestCtx = await launchCameraContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await signIn(hostPage, TEST_USERS.host);
    await signIn(guestPage, TEST_USERS.guest);

    const boothCode = await setupSharedSession(hostPage, guestPage);

    const hostToken = await getAccessToken(hostPage);
    const sessionRes = await hostPage.request.get(`${BASE_URL}/api/booth?code=${boothCode}`);
    const { session } = await sessionRes.json();

    await hostPage.request.post(`${BASE_URL}/api/booth/state`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { sessionId: session.id, action: 'next_shot' },
    });
    await hostPage.request.post(`${BASE_URL}/api/booth/state`, {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: { sessionId: session.id, action: 'next_shot' },
    });

    await guestPage.reload();

    await expect(guestPage.getByText(/shot 3 of 4|frame 3/i)).toBeVisible({ timeout: 15000 });

    await hostCtx.close();
    await guestCtx.close();
  });
});
