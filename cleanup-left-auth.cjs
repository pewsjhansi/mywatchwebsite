const fs = require('fs');

// Fix each file: remove the duplicate left-side auth-trigger, keep only the right nav-actions one
const htmlFiles = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'success.html'];

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Remove the duplicate auth-trigger that's INSIDE the brand div (left side)
  // Pattern: <div style="display:flex; align-items:center; gap: 2rem;">
  //            <div class="auth-trigger ...">Login | Sign Up</div>   <-- remove this
  //            <a href=... class="brand">AURELIUS</a>
  //          </div>
  content = content.replace(
    /(<div style="display:flex; align-items:center; gap: 2rem;">\s*)\n(\s*<div class="auth-trigger[^>]*>Login \| Sign Up<\/div>\s*\n)(\s*<a href="[^"]*" class="brand">)/g,
    '$1\n$3'
  );

  fs.writeFileSync(file, content);
  console.log(`Cleaned: ${file}`);
});

console.log('\nDone. Only the right-side nav-actions auth-trigger remains on each page.');
