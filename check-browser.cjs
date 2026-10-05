const { chromium } = require('playwright');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('Navigating to admin page...');
  try {
    await page.goto('http://localhost:5173/admin.html', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('Page loaded. Checking #admin-loading visibility...');
    
    const loadingVisible = await page.evaluate(() => {
      const el = document.getElementById('admin-loading');
      return el ? window.getComputedStyle(el).display : 'missing';
    });
    console.log('Admin loading display:', loadingVisible);
    
    const authErrorVisible = await page.evaluate(() => {
      const el = document.getElementById('admin-auth-error');
      return el ? window.getComputedStyle(el).display : 'missing';
    });
    console.log('Auth error display:', authErrorVisible);
    
  } catch(e) {
    console.log('Navigation failed:', e.message);
  }
  
  await browser.close();
}
main();
