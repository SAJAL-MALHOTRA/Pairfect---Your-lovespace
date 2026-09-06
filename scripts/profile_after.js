const { chromium } = require('playwright-core');
const { createBrowserClient } = require('@supabase/ssr');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://vhykmhfrptyjkagwetku.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mjc1MjksImV4cCI6MjA5OTUwMzUyOX0.jn9tgjKXwq6Mn4VFIxvwlQ1xWu4JXRi_syC6oZVSLKc';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWttaGZycHR5amthZ3dldGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkyNzUyOSwiZXhwIjoyMDk5NTAzNTI5fQ.lUUfG5r_eqItnQ7ATQTs82PN4EoKRZ8CQ1z_hXEw_y4';

const admin = createClient(url, serviceKey);

(async () => {
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

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const playwrightCookies = Object.entries(cookiesObj).map(([name, value]) => ({
    name, value, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax'
  }));
  await context.addCookies(playwrightCookies);

  const page = await context.newPage();

  const networkRequests = [];
  page.on('request', req => {
    networkRequests.push({ url: req.url(), method: req.method(), resourceType: req.resourceType() });
  });

  const responses = [];
  page.on('response', async res => {
    try {
      const headers = res.headers();
      const size = headers['content-length'] ? parseInt(headers['content-length']) : 0;
      responses.push({ url: res.url(), status: res.status(), size });
    } catch (e) {}
  });

  console.log('Navigating to http://localhost:3000/dashboard...');
  const t0 = Date.now();
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  const loadTimeMs = Date.now() - t0;

  const perfData = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const memory = performance.memory ? {
      usedJSHeapSizeMB: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalJSHeapSizeMB: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
    } : null;

    return {
      dnsTime: (nav.domainLookupEnd - nav.domainLookupStart).toFixed(1),
      tcpTime: (nav.connectEnd - nav.connectStart).toFixed(1),
      ttfb: (nav.responseStart - nav.requestStart).toFixed(1),
      downloadTime: (nav.responseEnd - nav.responseStart).toFixed(1),
      domContentLoaded: (nav.domContentLoadedEventEnd - nav.startTime).toFixed(1),
      domInteractive: (nav.domInteractive - nav.startTime).toFixed(1),
      completeLoad: (nav.loadEventEnd - nav.startTime).toFixed(1),
      fcp: fcp ? fcp.startTime.toFixed(1) : null,
      memory
    };
  });

  console.log('\n=== AFTER OPTIMIZATION: DASHBOARD PERFORMANCE METRICS ===');
  console.log('Total Network Idle Time:', loadTimeMs + ' ms');
  console.log('TTFB:', perfData.ttfb + ' ms');
  console.log('DOM Content Loaded:', perfData.domContentLoaded + ' ms');
  console.log('DOM Interactive:', perfData.domInteractive + ' ms');
  console.log('FCP:', perfData.fcp + ' ms');
  console.log('Window Load Complete:', perfData.completeLoad + ' ms');
  console.log('Memory Usage:', perfData.memory);

  console.log('\n=== NETWORK REQUEST BREAKDOWN ===');
  console.log('Total Requests:', networkRequests.length);
  const byType = {};
  networkRequests.forEach(r => {
    byType[r.resourceType] = (byType[r.resourceType] || 0) + 1;
  });
  console.log('Requests by type:', byType);

  const totalTransferred = responses.reduce((acc, r) => acc + r.size, 0);
  console.log('Total Transferred Bytes (approx):', (totalTransferred / 1024).toFixed(1) + ' KB');

  console.log('\nTop Supabase / API requests:');
  networkRequests
    .filter(r => r.url.includes('supabase.co') || r.url.includes('/api/'))
    .forEach(r => {
      const u = new URL(r.url);
      console.log(`[${r.method}] ${u.pathname}${u.search.slice(0, 80)}`);
    });

  await browser.close();
})();
