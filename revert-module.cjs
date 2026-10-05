const fs = require('fs');

const htmlFiles = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'dashboard.html', 'success.html'];

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>')) {
    content = content.replace('<script type="module" src="app.js"></script>', '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n  <script src="app.js"></script>');
  }
  fs.writeFileSync(file, content);
});

let appJs = fs.readFileSync('app.js', 'utf8');

// Replace new init back to old with proper error handling
const oldInit = `// Supabase Initialization
const supabaseUrl = 'https://ffwlyelptfpyruowjknt.supabase.co';
const supabaseKey = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';
let supabase = null;
if (window.supabase) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
  console.error("FATAL ERROR: Supabase CDN failed to load. Authentication and database functions will not work.");
  alert("Connection to the store is temporarily unavailable. Please check your internet connection or disable your adblocker.");
}`;

// Use regex to replace the import block since we might not match the exact string
appJs = appJs.replace(/\/\/ Supabase Initialization[\s\S]*?export const supabase = createClient\(supabaseUrl, supabaseKey\);/, oldInit);

// Remove the global exports block
appJs = appJs.replace(/\/\/ EXPORT GLOBALS FOR INLINE HTML HANDLERS[\s\S]*?window\.handleAddToCart = typeof handleAddToCart !== 'undefined' \? handleAddToCart : null;/g, '');

fs.writeFileSync('app.js', appJs);

console.log("Reverted to CDN with strict error handling.");
