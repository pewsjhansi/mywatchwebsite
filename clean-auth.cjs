const fs = require('fs');
const files = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'dashboard.html', 'success.html'];

files.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  
  // Find the nav-actions block and remove the auth-trigger inside it
  // Using Regex to be completely safe against whitespace issues
  
  const navActionsPattern = /<div class="nav-actions">([\s\S]*?)<\/div>/g;
  
  html = html.replace(navActionsPattern, (match, p1) => {
    // inside the nav-actions div, remove auth-trigger entirely
    const cleaned = p1.replace(/<div class="auth-trigger[^>]*><\/div>\s*/g, '');
    return `<div class="nav-actions">${cleaned}</div>`;
  });
  
  fs.writeFileSync(f, html);
});
console.log('Duplicates removed.');
