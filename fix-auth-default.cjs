const fs = require('fs');

// Files to fix - all HTML files with auth-trigger
const htmlFiles = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'success.html'];

const defaultAuthHTML = `<span id="auth-btn-text" style="white-space:nowrap;">Login | Sign Up</span>`;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace empty auth-trigger divs with one that has visible default content
  // Pattern: <div class="auth-trigger ..."></div>  (empty)
  content = content.replace(
    /(<div class="auth-trigger[^"]*"[^>]*>)\s*(<\/div>)/g,
    `$1Login | Sign Up$2`
  );

  fs.writeFileSync(file, content);
  console.log(`Fixed: ${file}`);
});

console.log('\nAll HTML files updated — Login | Sign Up is now hardcoded as default.');
