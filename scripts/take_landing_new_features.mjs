import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Hero photobooth section screenshot
  const heroElement = await page.$('#why-pairfect');
  if (heroElement) {
    await heroElement.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/landing-hero-photobooth.png',
    });
    console.log('Saved landing-hero-photobooth.png');
  }

  // 2. Click Whisper FM tab in Playground
  console.log('Clicking Whisper FM tab...');
  const whisperTabButton = page.locator('button:has-text("Whisper FM")');
  await whisperTabButton.click();
  await page.waitForTimeout(800);

  const playgroundSection = await page.$('#playground');
  if (playgroundSection) {
    await playgroundSection.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/landing-playground-whisper.png',
    });
    console.log('Saved landing-playground-whisper.png');
  }

  // 3. Click Digital Bouquet tab in Playground
  console.log('Clicking Digital Bouquet tab...');
  const bouquetTabButton = page.locator('button:has-text("Digital Bouquet")');
  await bouquetTabButton.click();
  await page.waitForTimeout(600);

  // Click Untie Ribbon
  const untieButton = page.locator('button:has-text("Untie Ribbon")');
  if (await untieButton.isVisible()) {
    await untieButton.click();
    await page.waitForTimeout(1000); // let bloom & note reveal
  }

  if (playgroundSection) {
    await playgroundSection.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/landing-playground-bouquet.png',
    });
    console.log('Saved landing-playground-bouquet.png');
  }

  // 4. Activities Showcase section screenshot
  const activitiesSection = await page.$('#activities');
  if (activitiesSection) {
    await activitiesSection.screenshot({
      path: 'C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16/landing-activities-carousel.png',
    });
    console.log('Saved landing-activities-carousel.png');
  }

  await browser.close();
  console.log('Done capturing screenshots!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
