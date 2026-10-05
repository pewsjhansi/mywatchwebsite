const fs = require('fs');

const htmlFiles = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'dashboard.html', 'success.html'];

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '');
  content = content.replace('<script src="app.js"></script>', '<script type="module" src="app.js"></script>');
  // If checkout has <script src="app.js"></script> again, this replace covers the first one. Let's do it globally just in case.
  content = content.replace(/<script src="app\.js"><\/script>/g, '<script type="module" src="app.js"></script>');
  fs.writeFileSync(file, content);
});

let appJs = fs.readFileSync('app.js', 'utf8');

// Replace supabase init
const oldInit = `// Supabase Initialization
const supabaseUrl = 'https://ffwlyelptfpyruowjknt.supabase.co';
const supabaseKey = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';
const supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;`;

const newInit = `// Supabase Initialization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be defined in your .env file!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);`;

if (appJs.includes(oldInit)) {
  appJs = appJs.replace(oldInit, newInit);
}

// Ensure global exports
const globals = `
// EXPORT GLOBALS FOR INLINE HTML HANDLERS
window.supabase = supabase;
window.products = products;
window.cart = cart;
window.userAuth = userAuth;
window.saveCart = typeof saveCart !== 'undefined' ? saveCart : null;
window.updateCartUI = typeof updateCartUI !== 'undefined' ? updateCartUI : null;
window.addToCart = typeof addToCart !== 'undefined' ? addToCart : null;
window.updateQty = typeof updateQty !== 'undefined' ? updateQty : null;
window.removeItem = typeof removeItem !== 'undefined' ? removeItem : null;
window.openCartDrawer = typeof openCartDrawer !== 'undefined' ? openCartDrawer : null;
window.closeCartDrawer = typeof closeCartDrawer !== 'undefined' ? closeCartDrawer : null;
window.openAuthModal = typeof openAuthModal !== 'undefined' ? openAuthModal : null;
window.closeAuthModal = typeof closeAuthModal !== 'undefined' ? closeAuthModal : null;
window.setAuthMode = typeof setAuthMode !== 'undefined' ? setAuthMode : null;
window.togglePassword = typeof togglePassword !== 'undefined' ? togglePassword : null;
window.handleLogin = typeof handleLogin !== 'undefined' ? handleLogin : null;
window.handleSignup = typeof handleSignup !== 'undefined' ? handleSignup : null;
window.toggleProfileDropdown = typeof toggleProfileDropdown !== 'undefined' ? toggleProfileDropdown : null;
window.handleLogout = typeof handleLogout !== 'undefined' ? handleLogout : null;
window.selectSize = typeof selectSize !== 'undefined' ? selectSize : null;
window.selectColor = typeof selectColor !== 'undefined' ? selectColor : null;
window.handleAddToCart = typeof handleAddToCart !== 'undefined' ? handleAddToCart : null;
`;

if (!appJs.includes('window.supabase = supabase;')) {
  appJs += globals;
}

fs.writeFileSync('app.js', appJs);

console.log("Migration completed.");
