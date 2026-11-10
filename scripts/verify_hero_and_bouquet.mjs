import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1340, height: 1000 } });
  const page = await context.newPage();

  console.log('1. Loading landing page to capture extrusion animation...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  // Wait 750ms so extrusion is actively emerging from slot
  await page.waitForTimeout(750);
  const heroElement = await page.$('#why-pairfect');
  if (heroElement) {
    await heroElement.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/hero-extrusion.png',
    });
    console.log('Saved hero-extrusion.png');
  }

  // Wait until extrusion settles completely
  await page.waitForTimeout(1600);
  if (heroElement) {
    await heroElement.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/hero-perfected.png',
    });
    console.log('Saved hero-perfected.png');
  }

  // 2. Click Digital Bouquet tab in DynamicInteractiveGameArena
  console.log('2. Clicking Digital Bouquet tab...');
  const bouquetTabButton = page.locator('button:has-text("Digital Bouquet")');
  await bouquetTabButton.scrollIntoViewIfNeeded();
  await bouquetTabButton.click();
  await page.waitForTimeout(1000);

  const arenaSection = page.locator('#playground');
  await arenaSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await arenaSection.screenshot({
    path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/bouquet-canvas-wrapped.png',
  });
  console.log('Saved bouquet-canvas-wrapped.png');

  // 3. Click Untie Ribbon & Unwrap Bouquet
  console.log('3. Clicking untie ribbon...');
  const untieBtn = page.locator('button:has-text("Untie Ribbon & Unwrap Bouquet")');
  if (await untieBtn.isVisible()) {
    await untieBtn.click();
    await page.waitForTimeout(1500); // let bloom & note reveal
    await arenaSection.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/bouquet-canvas-unwrapped.png',
    });
    console.log('Saved bouquet-canvas-unwrapped.png');
  }

  await browser.close();
  console.log('All verification screenshots captured!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
