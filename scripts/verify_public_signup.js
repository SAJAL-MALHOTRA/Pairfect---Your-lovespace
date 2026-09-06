const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  // Test local signup page
  await page.goto('http://localhost:3000/signup');
  await page.waitForTimeout(2000);

  console.log('Signup URL:', page.url());
  const content = await page.content();
  console.log('Contains "Create Your Space"?', content.includes('Create Your Space'));
  console.log('Contains "Invitation Only"?', content.includes('INVITATION ONLY'));
  console.log('Contains "Enter Invite Code"?', content.includes('ENTER INVITE CODE'));
  console.log('Contains "Beta Invite Code"?', content.includes('Beta Invite Code'));
  console.log('Contains "Display Name"?', content.includes('Display Name'));
  console.log('Contains "Continue with Google"?', content.includes('Continue with Google'));

  await browser.close();
})();
