const fs = require('fs');

const files = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'dashboard.html', 'admin.html'];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/g, 'supabase.js');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
