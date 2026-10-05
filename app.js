// ============================================================
// AURELIUS — app.js  (updated with MRP, GST, Promo support)
// ============================================================

const supabaseUrl = 'https://ffwlyelptfpyruowjknt.supabase.co';
const supabaseKey = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
  console.error('FATAL ERROR: Supabase CDN failed to load.');
}

let products = [];
let cart = JSON.parse(localStorage.getItem('luxuryCart')) || [];
let userAuth = null;

// Applied promo state
let appliedPromo = JSON.parse(localStorage.getItem('aureliusPromo')) || null;

// ─── MONEY HELPERS ───────────────────────────────────────────
function fmtINR(n) {
  return '₹' + Number(n || 0).toFixed(2);
}

function calcDiscountPct(mrp, selling) {
  if (!mrp || mrp <= 0 || selling >= mrp) return 0;
  return Math.round(((mrp - selling) / mrp) * 100 * 100) / 100;
}

function getProductPrice(product) {
  return {
    mrp: Number(product.mrp || product.price || 0),
    selling: Number(product.selling_price || product.price || 0),
    gstRate: Number(product.gst_rate != null ? product.gst_rate : 18)
  };
}

// ─── CART ────────────────────────────────────────────────────
function saveCart() {
  localStorage.setItem('luxuryCart', JSON.stringify(cart));
  localStorage.setItem('aureliusPromo', JSON.stringify(appliedPromo));
  updateCartUI();
}

function updateCartUI() {
  const countEls = document.querySelectorAll('.cart-count');
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  countEls.forEach(el => {
    el.textContent = itemCount;
    el.style.display = itemCount > 0 ? 'flex' : 'none';
  });

  const cartBody = document.getElementById('cart-items');
  const cartSubtotal = document.getElementById('cart-subtotal');

  if (!cartBody || !cartSubtotal) return;

  cartBody.innerHTML = '';
  let mrpTotal = 0;
  let sellingTotal = 0;

  if (cart.length === 0) {
    cartBody.innerHTML = '<p class="body-md" style="text-align:center;padding:2rem 0;color:var(--color-tertiary)">Your cart is empty.</p>';
  } else {
    cart.forEach((item, index) => {
      const selling = Number(item.selling_price || item.price || 0);
      const mrp = Number(item.mrp || item.price || selling);
      mrpTotal += mrp * item.quantity;
      sellingTotal += selling * item.quantity;

      cartBody.innerHTML += `
        <div class="cart-item">
          <img src="${item.image}" class="cart-item-img" alt="${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-title title-md">${item.name}</div>
            <div class="cart-item-meta label-caps">${item.color || ''} | ${item.size || ''}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:4px">
              ${mrp > selling ? `<span style="text-decoration:line-through;color:var(--color-tertiary);font-size:12px">${fmtINR(mrp)}</span>` : ''}
              <span class="technical-mono" style="font-size:13px">${fmtINR(selling)}</span>
              ${mrp > selling ? `<span style="background:var(--color-secondary);color:var(--color-primary);font-size:9px;font-weight:700;padding:2px 6px">${calcDiscountPct(mrp, selling)}% OFF</span>` : ''}
            </div>
            <div class="cart-item-actions" style="margin-top:1rem">
              <div class="qty-ctrl">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <span class="technical-mono">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
              </div>
              <button class="remove-item" onclick="removeItem(${index})">Remove</button>
            </div>
          </div>
        </div>`;
    });
  }

  // Breakdown
  const productDiscount = mrpTotal - sellingTotal;
  let promoDiscount = 0;

  if (appliedPromo && sellingTotal > 0) {
    if (appliedPromo.discount_type === 'fixed') {
      promoDiscount = Math.min(appliedPromo.discount_value, sellingTotal);
    } else if (appliedPromo.discount_type === 'percentage') {
      promoDiscount = Math.round(sellingTotal * appliedPromo.discount_value / 100 * 100) / 100;
      if (appliedPromo.max_discount_amount) {
        promoDiscount = Math.min(promoDiscount, appliedPromo.max_discount_amount);
      }
    }
    promoDiscount = Math.round(promoDiscount * 100) / 100;
  }

  const grandTotal = Math.max(sellingTotal - promoDiscount, 0);

  // Build footer summary
  let summaryHTML = `
    <div style="border-top:1px solid var(--color-divider);padding-top:1rem;margin-bottom:1rem">
      ${productDiscount > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:13px">
          <span style="color:var(--color-tertiary)">MRP Total</span><span>${fmtINR(mrpTotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:13px;color:#047857">
          <span>Product Discount</span><span>- ${fmtINR(productDiscount)}</span>
        </div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:13px">
        <span>Subtotal</span><span>${fmtINR(sellingTotal)}</span>
      </div>
      ${appliedPromo ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:13px;color:#6d28d9">
          <span>${appliedPromo.code} applied</span><span>- ${fmtINR(promoDiscount)}</span>
        </div>` : ''}
      <div style="font-size:10px;color:var(--color-tertiary);margin-bottom:0.75rem;letter-spacing:0.1em;text-transform:uppercase">GST included in price</div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:1.5rem">
      <span class="title-md">Total</span>
      <span class="title-md">${fmtINR(grandTotal)}</span>
    </div>`;

  // Promo input
  const promoSectionEl = document.getElementById('cart-promo-section');
  const cartFooter = document.getElementById('cart-footer-content');
  if (cartFooter) {
    cartFooter.innerHTML = summaryHTML;
  } else {
    cartSubtotal.textContent = fmtINR(grandTotal);
  }

  updatePromoUI();
}

function updatePromoUI() {
  const promoSection = document.getElementById('cart-promo-section');
  if (!promoSection) return;
  if (appliedPromo) {
    promoSection.innerHTML = `
      <div style="background:#f3e8ff;border:1px solid #c4b5fd;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div>
          <span style="font-size:12px;font-weight:700;color:#6d28d9">${appliedPromo.code}</span>
          <span style="font-size:12px;color:#6d28d9;margin-left:8px">applied ✓</span>
        </div>
        <button onclick="removePromo()" style="background:none;border:none;font-size:11px;cursor:pointer;text-decoration:underline;color:#6d28d9">Remove</button>
      </div>`;
  } else {
    promoSection.innerHTML = `
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
        <input type="text" id="promo-code-input" class="form-input" placeholder="Promo code" style="padding:10px;font-size:13px">
        <button class="btn-secondary" onclick="applyPromo()" style="padding:10px 16px;font-size:11px;white-space:nowrap">Apply</button>
      </div>
      <div id="promo-msg" style="font-size:12px;margin-bottom:0.5rem"></div>`;
  }
}

async function applyPromo() {
  const codeEl = document.getElementById('promo-code-input');
  const msgEl = document.getElementById('promo-msg');
  if (!codeEl) return;
  const code = codeEl.value.trim().toUpperCase();
  if (!code) return;

  const sellingTotal = cart.reduce((acc, i) => acc + Number(i.selling_price || i.price || 0) * i.quantity, 0);

  msgEl.textContent = 'Validating...';
  msgEl.style.color = 'var(--color-tertiary)';

  try {
    const { data, error } = await supabaseClient.rpc('validate_promo_code', {
      p_code: code,
      p_cart_total: sellingTotal
    });

    if (error || !data) {
      msgEl.textContent = 'Error validating promo code: ' + (error?.message || 'Unknown error');
      msgEl.style.color = 'var(--color-error)';
      return;
    }

    if (!data.valid) {
      msgEl.textContent = data.message;
      msgEl.style.color = 'var(--color-error)';
      return;
    }

    appliedPromo = data;
    msgEl.textContent = '';
    saveCart();
  } catch (err) {
    msgEl.textContent = 'Exception validating code: ' + err.message;
    msgEl.style.color = 'var(--color-error)';
  }
}

function removePromo() {
  appliedPromo = null;
  localStorage.removeItem('aureliusPromo');
  updateCartUI();
}

function addToCart(product, size, color, quantity = 1) {
  const { mrp, selling } = getProductPrice(product);
  const existingItem = cart.find(i => i.id === product.id && i.size === size && i.color === color);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      ...product,
      mrp,
      selling_price: selling,
      price: selling, // legacy compat
      size,
      color,
      quantity
    });
  }
  saveCart();
  openCartDrawer();
}

function updateQty(index, change) {
  if (cart[index]) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart();
  }
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
}

function openCartDrawer() {
  document.getElementById('cart-drawer-overlay').style.display = 'block';
  setTimeout(() => document.getElementById('cart-drawer').classList.add('open'), 10);
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
  setTimeout(() => document.getElementById('cart-drawer-overlay').style.display = 'none', 400);
}

// ─── AUTH ────────────────────────────────────────────────────
let authState = { mode: 'login' };

function injectAuthModal() {
  const modalHTML = `
  <div class="auth-modal-overlay" id="auth-modal-overlay">
    <div class="auth-modal" id="auth-modal">
      <button class="auth-close" id="auth-close-btn">&times;</button>
      <div class="auth-logo">AURELIUS</div>
      <div id="auth-modal-content"></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('auth-close-btn').addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal-overlay') closeAuthModal();
  });
}

function openAuthModal() {
  setAuthMode('login');
  document.getElementById('auth-modal-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('auth-modal').classList.add('open'), 10);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('open');
  setTimeout(() => document.getElementById('auth-modal-overlay').style.display = 'none', 400);
}

function setAuthMode(mode) {
  authState.mode = mode;
  renderAuthView();
}

function renderAuthView() {
  const container = document.getElementById('auth-modal-content');
  if (authState.mode === 'login') {
    container.innerHTML = `
      <div class="auth-tabs">
        <button class="auth-tab active">Login</button>
        <button class="auth-tab" onclick="setAuthMode('signup')">Sign Up</button>
      </div>
      <div class="form-group" style="text-align:left"><input type="email" id="auth-email" class="form-input" placeholder="Email" required></div>
      <div class="form-group" style="position:relative;text-align:left">
        <input type="password" id="auth-password" class="form-input" placeholder="Password" required>
        <span class="password-toggle" onclick="togglePassword('auth-password')">👁️</span>
      </div>
      <div class="auth-error" id="auth-error-msg" style="margin-bottom:1rem"></div>
      <button class="btn-primary" id="auth-submit-btn" style="width:100%" onclick="handleLogin()">Login</button>`;
  } else {
    container.innerHTML = `
      <div class="auth-tabs">
        <button class="auth-tab" onclick="setAuthMode('login')">Login</button>
        <button class="auth-tab active">Sign Up</button>
      </div>
      <div style="text-align:left">
        <div class="form-group" style="margin-bottom:0.5rem"><input type="text" id="reg-name" class="form-input" placeholder="Full Name" required></div>
        <div class="form-group" style="margin-bottom:0.5rem"><input type="email" id="reg-email" class="form-input" placeholder="Email" required></div>
        <div class="form-group" style="margin-bottom:0.5rem"><input type="tel" id="reg-mobile" class="form-input" placeholder="Mobile Number"></div>
        <div class="form-group" style="position:relative;margin-bottom:0.5rem">
          <input type="password" id="reg-password" class="form-input" placeholder="Password" required>
          <span class="password-toggle" onclick="togglePassword('reg-password')">👁️</span>
        </div>
        <div class="form-group" style="position:relative;margin-bottom:0.5rem">
          <input type="password" id="reg-confirm" class="form-input" placeholder="Confirm Password" required>
          <span class="password-toggle" onclick="togglePassword('reg-confirm')">👁️</span>
        </div>
      </div>
      <div class="auth-error" id="auth-error-msg" style="margin-bottom:1rem"></div>
      <button class="btn-primary" id="auth-submit-btn" style="width:100%;margin-top:1rem" onclick="handleSignup()">Sign Up</button>`;
  }
}

function togglePassword(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

async function handleLogin() {
  const btn = document.getElementById('auth-submit-btn');
  const errorMsg = document.getElementById('auth-error-msg');
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-password').value;
  if (!email || !pass) { errorMsg.textContent = 'Please enter email and password.'; errorMsg.style.display = 'block'; return; }
  errorMsg.style.display = 'none';
  btn.textContent = 'Signing in...'; btn.disabled = true;
  
  // 1. Supabase Auth signIn
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  
  // 3. Verify Authentication First
  if (error) {
    errorMsg.textContent = error.message === 'Invalid login credentials' ? 'Invalid email or password.' : error.message;
    errorMsg.style.display = 'block';
    btn.textContent = 'Login'; btn.disabled = false;
    return;
  }
  
  if (!data || !data.session || !data.user) {
    errorMsg.textContent = 'Authentication succeeded but no session was returned (Check Email Confirmation).';
    errorMsg.style.display = 'block';
    btn.textContent = 'Login'; btn.disabled = false;
    return;
  }

  // 4. Role lookup
  const { data: adminRole, error: roleErr } = await supabaseClient
    .from('admin_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();
    
  const isAdmin = adminRole && adminRole.role === 'admin';
  
  closeAuthModal();

  // Redirect based on role unless on checkout
  if (!window.location.pathname.includes('checkout.html')) {
    if (isAdmin) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    // If on checkout, just update UI
    updateAuthUI();
  }
}

async function handleSignup() {
  const btn = document.getElementById('auth-submit-btn');
  const errorMsg = document.getElementById('auth-error-msg');
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const mobile = document.getElementById('reg-mobile').value;
  const pass = document.getElementById('reg-password').value;
  const conf = document.getElementById('reg-confirm').value;
  if (!email || !pass || pass !== conf || !name) {
    errorMsg.textContent = 'Please fill all fields and ensure passwords match.';
    errorMsg.style.display = 'block'; return;
  }
  errorMsg.style.display = 'none';
  btn.textContent = 'Creating account...'; btn.disabled = true;
  const { data, error } = await supabaseClient.auth.signUp({
    email, password: pass,
    options: { data: { full_name: name, mobile } }
  });
  if (error) {
    errorMsg.textContent = error.message; errorMsg.style.display = 'block';
    btn.textContent = 'Sign Up'; btn.disabled = false;
  } else {
    if (data.user && data.session) {
      // 8. Customer Profile Creation
      const { error: insertErr } = await supabaseClient.from('customers').insert([{
        id: data.user.id,
        user_id: 'WF-' + Math.floor(100000 + Math.random() * 900000),
        name, email,
        mobile: mobile || '',
        created_at: new Date().toISOString()
      }]);
      // Do not block login if profile insertion fails
      
      closeAuthModal();
      
      if (!window.location.pathname.includes('checkout.html')) {
        window.location.href = 'dashboard.html';
      } else {
        updateAuthUI();
      }
    } else {
      errorMsg.textContent = 'Account created. Please check your email to verify before logging in.';
      errorMsg.style.display = 'block';
      btn.textContent = 'Sign Up'; btn.disabled = false;
    }
  }
}

async function updateAuthUI() {
  const authNavs = document.querySelectorAll('.auth-trigger');
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    userAuth = session.user;
    let profileName = userAuth.user_metadata?.full_name || userAuth.email;
    const { data: profile } = await supabaseClient.from('customers').select('*').eq('id', userAuth.id).single();
    if (profile) profileName = profile.name;

    // Check admin
    const { data: adminRole } = await supabaseClient.from('admin_roles').select('role').eq('user_id', userAuth.id).single();
    const isAdmin = adminRole && adminRole.role === 'admin';

    authNavs.forEach(nav => {
      nav.innerHTML = `
        <div class="profile-dropdown-wrap">
          <div style="display:flex;align-items:center;gap:0.5rem;cursor:pointer" onclick="toggleProfileDropdown(event)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span style="text-transform:none;font-size:13px;letter-spacing:0">${profileName}</span>
          </div>
          <div class="profile-dropdown" id="profile-dropdown">
            <div class="profile-dropdown-header">
              <div class="title-md">${profileName}</div>
              <div class="body-sm" style="color:var(--color-tertiary)">${userAuth.email}</div>
            </div>
            <ul class="profile-dropdown-menu">
              <li><a href="dashboard.html#profile" style="font-weight:bold;color:var(--color-primary)">My Account</a></li>
              <li><a href="dashboard.html#profile">My Profile</a></li>
              <li><a href="dashboard.html#orders">My Orders</a></li>
              <li><a href="dashboard.html#addresses">Delivery Addresses</a></li>
              <li><a href="dashboard.html#wishlist">Wishlist</a></li>
              <li><a href="dashboard.html#saved">Saved Watches</a></li>
              <li><a href="dashboard.html#payments">Payment Methods</a></li>
              <li><a href="dashboard.html#security">Account Settings</a></li>
              ${isAdmin ? '<li><a href="admin.html" style="color:var(--color-secondary)">⚙ Admin Panel</a></li>' : ''}
              <div class="profile-dropdown-divider"></div>
              <li><a href="#" onclick="handleLogout(event)">Logout</a></li>
            </ul>
          </div>
        </div>`;
      nav.onclick = null;
    });
  } else {
    userAuth = null;
    authNavs.forEach(nav => {
      nav.innerHTML = 'Login | Sign Up';
      nav.onclick = openAuthModal;
    });
  }
}

function toggleProfileDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown && dropdown.classList.contains('open') && !e.target.closest('.profile-dropdown-wrap')) {
    dropdown.classList.remove('open');
  }
});

async function handleLogout(e) {
  e.preventDefault();
  if (confirm('Are you sure you want to log out?')) {
    if (supabaseClient) await supabaseClient.auth.signOut();
    userAuth = null; updateAuthUI();
    if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('admin.html')) {
      window.location.href = 'index.html';
    }
  }
}

// ─── PRODUCT CARD RENDERER ───────────────────────────────────
function renderProductCard(product) {
  const { mrp, selling } = getProductPrice(product);
  const disc = calcDiscountPct(mrp, selling);
  const showDisc = disc > 0 && mrp > selling;
  return `
    <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit">
      <div class="product-card">
        ${showDisc ? `<div style="position:absolute;top:1rem;left:1rem;background:var(--color-secondary);color:var(--color-primary);font-size:10px;font-weight:700;padding:3px 8px;z-index:2">${disc}% OFF</div>` : ''}
        <div class="product-image-wrap">
          <img src="${product.image || ''}" class="product-image" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-title title-md">${product.name}</div>
          <div class="product-material label-caps">${product.material || ''}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap">
            ${showDisc ? `<span style="text-decoration:line-through;color:var(--color-tertiary);font-size:12px">${fmtINR(mrp)}</span>` : ''}
            <span class="product-price technical-mono" style="font-size:14px">${fmtINR(selling)}</span>
          </div>
          <div style="font-size:10px;color:var(--color-tertiary);margin-top:2px;letter-spacing:0.1em;text-transform:uppercase">Incl. GST</div>
        </div>
      </div>
    </a>`;
}

// ─── DOMContentLoaded ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  injectAuthModal();
  updateCartUI();
  updateAuthUI();

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(() => updateAuthUI());

    const { data, error } = await supabaseClient.from('products').select('*').eq('active', true);
    if (!error && data && data.length > 0) products = data;
    // Also load inactive for admin preview
    else if (!error && data) products = data;
  }

  // Attach drawer listeners
  const overlay = document.getElementById('cart-drawer-overlay');
  const closeBtn = document.getElementById('cart-close-btn');
  const openBtns = document.querySelectorAll('.open-cart');
  if (overlay) overlay.addEventListener('click', closeCartDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  openBtns.forEach(btn => btn.addEventListener('click', openCartDrawer));

  // Homepage best sellers
  const grid = document.getElementById('best-sellers-grid');
  if (grid && products.length > 0) {
    const bestSellers = products.filter(p => p.best_seller || p.bestSeller);
    if (bestSellers.length > 0) {
      grid.innerHTML = bestSellers.map(renderProductCard).join('');
    }
  }


  // Shop page rendering is handled by shop.html's own productsLoaded listener.

  // Product detail page
  if (window.location.pathname.includes('product.html')) {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id');
    const product = products.find(p => p.id === pid);

    if (product) {
      const { mrp, selling, gstRate } = getProductPrice(product);
      const disc = calcDiscountPct(mrp, selling);

      const titleEl = document.getElementById('pdp-title');
      const priceEl = document.getElementById('pdp-price');
      const imgEl = document.getElementById('pdp-img');

      if (titleEl) titleEl.textContent = product.name;
      if (imgEl) imgEl.src = product.image || '';

      if (priceEl) {
        priceEl.innerHTML = `
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
            ${mrp > selling ? `<span style="text-decoration:line-through;color:var(--color-tertiary);font-size:16px">${fmtINR(mrp)}</span>` : ''}
            <span style="font-size:24px;font-weight:600">${fmtINR(selling)}</span>
            ${disc > 0 ? `<span style="background:var(--color-secondary);color:var(--color-primary);font-size:12px;font-weight:700;padding:4px 10px">${disc}% OFF</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--color-tertiary);margin-top:4px;letter-spacing:0.1em;text-transform:uppercase">
            Price inclusive of ${gstRate}% GST
          </div>`;
      }

      const sizeContainer = document.getElementById('pdp-sizes');
      if (sizeContainer) {
        const sizesArray = Array.isArray(product.sizes) ? product.sizes : (typeof product.sizes === 'string' ? JSON.parse(product.sizes || '[]') : []);
        sizeContainer.innerHTML = sizesArray.map((s, idx) =>
          `<button class="size-chip technical-mono ${idx === 0 ? 'active' : ''}" onclick="selectSize(this)">${s}</button>`
        ).join('');
      }

      const colorContainer = document.getElementById('pdp-colors');
      if (colorContainer) {
        const colorsArray = Array.isArray(product.colors) ? product.colors : (typeof product.colors === 'string' ? JSON.parse(product.colors || '[]') : []);
        colorContainer.innerHTML = colorsArray.map((c, idx) =>
          `<div class="swatch ${idx === 0 ? 'active' : ''}" onclick="selectColor(this)" data-color="${c.name}" title="${c.name}">
            <div class="swatch-inner" style="background-color:${c.hex}"></div>
          </div>`
        ).join('');
        if (colorsArray.length > 0) window.selectedColor = colorsArray[0].name;
      }

      const sizesArray2 = Array.isArray(product.sizes) ? product.sizes : (typeof product.sizes === 'string' ? JSON.parse(product.sizes || '[]') : []);
      if (sizesArray2.length > 0) window.selectedSize = sizesArray2[0];
      window.currentProduct = product;
    }
  }

  document.dispatchEvent(new Event('productsLoaded'));
});

// ─── SIZE/COLOR SELECT ───────────────────────────────────────
function selectSize(btn) {
  document.querySelectorAll('.size-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window.selectedSize = btn.textContent;
}

function selectColor(btn) {
  document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window.selectedColor = btn.dataset.color;
}

function handleAddToCart() {
  if (window.currentProduct && window.selectedSize && window.selectedColor) {
    addToCart(window.currentProduct, window.selectedSize, window.selectedColor, 1);
  }
}


// =========================================
// RESPONSIVE MOBILE MENU
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      // Create mobile auth link if not exists
      if (navLinks.classList.contains('open') && !document.getElementById('mobile-auth-trigger')) {
        const authTrigger = document.querySelector('.auth-trigger');
        if (authTrigger) {
          const mobileAuth = document.createElement('div');
          mobileAuth.className = 'nav-links-auth-mobile';
          mobileAuth.innerHTML = '<a href="#" id="mobile-auth-trigger" style="text-decoration:none; color:var(--color-primary); font-family:var(--font-body); font-size:13px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase;">' + (authTrigger.textContent || 'Login | Sign Up') + '</a>';
          navLinks.appendChild(mobileAuth);
          
          document.getElementById('mobile-auth-trigger').addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.classList.remove('open');
            authTrigger.click(); // trigger original modal
          });
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }
});
