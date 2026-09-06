const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('https://pairfect.site/signup');
  await page.waitForTimeout(2000);

  console.log('Signup page loaded. URL:', page.url());

  const content = await page.content();
  console.log('Contains INVITATION ONLY?', content.includes('INVITATION ONLY'));
  console.log('Contains Create Your Space?', content.includes('Create Your Space'));

  // Find inputs
  const inputs = await page.$$('input');
  console.log('Number of inputs found:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    const value = await inputs[i].inputValue();
    console.log(`Input #${i}: type=${type}, placeholder=${placeholder}, value=${value}`);
  }

  // Try submitting PAIRFECT2026 into first text input if found
  const textInput = await page.$('input[type="text"]');
  if (textInput) {
    await textInput.fill('PAIRFECT2026');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      console.log('Clicking submit button...');
      await submitBtn.click();
      await page.waitForTimeout(1500);
      const afterContent = await page.content();
      console.log('After submit: contains "Beta Access Granted"?', afterContent.includes('Beta Access Granted'));
      console.log('After submit: contains "Invalid invite code"?', afterContent.includes('Invalid invite code'));
    }
  }

  await browser.close();
})();
