const fs = require('fs');
const files = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'dashboard.html', 'success.html'];

files.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  
  // Remove auth-trigger from nav-actions
  html = html.replace('<div class="auth-trigger label-caps" style="cursor:pointer; display:flex; align-items:center;"></div>\n        ', '');
  
  // Add it next to the brand
  html = html.replace('<a href="index.html" class="brand">AURELIUS</a>', '<div style="display:flex; align-items:center; gap: 2rem;">\n        <div class="auth-trigger label-caps" style="cursor:pointer; display:flex; align-items:center;"></div>\n        <a href="index.html" class="brand">AURELIUS</a>\n      </div>');
  
  fs.writeFileSync(f, html);
});
console.log('HTML files updated successfully.');
