const fs = require('fs');
const path = require('path');

// 1. Update HTML files for mobile menu
const htmlFiles = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'dashboard.html', 'success.html', 'compare.html'];

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Add mobile menu button if missing
  if (!content.includes('mobile-menu-btn')) {
    content = content.replace(
      '<div class="nav-actions">',
      '<div class="nav-actions">\n        <button class="mobile-menu-btn" id="mobile-menu-btn" style="background:none; border:none; cursor:pointer; display:none; padding: 4px; color: inherit;">\n          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>\n        </button>'
    );
  }

  // Update viewport meta tag if needed
  if (!content.includes('viewport')) {
    content = content.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated HTML:', file);
});

// Update admin.html specifically for mobile sidebar toggle
if (fs.existsSync('admin.html')) {
  let content = fs.readFileSync('admin.html', 'utf8');
  if (!content.includes('admin-mobile-toggle')) {
    // Insert toggle button before admin-brand
    content = content.replace(
      '<div class="admin-brand">',
      '<div class="admin-mobile-header" style="display:none; padding:1rem 1.5rem; background:#0D0D0E; color:#fff; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:201;">\n  <a href="admin.html" style="color:#fff; text-decoration:none; font-family:var(--font-display); font-size:20px;">AURELIUS ADMIN</a>\n  <button id="admin-mobile-toggle" style="background:none;border:none;color:#fff;cursor:pointer;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>\n</div>\n    <div class="admin-brand">'
    );
    fs.writeFileSync('admin.html', content, 'utf8');
    console.log('Updated HTML: admin.html');
  }
}
