// Mock Database
const products = [
  {
    id: 'p1',
    name: 'The Obsidian Alligator',
    material: 'Genuine Alligator Leather',
    price: 350.00,
    colors: [{ name: 'Black', hex: '#000000' }],
    sizes: ['18mm', '20mm', '22mm'],
    image: 'https://images.unsplash.com/photo-1548171915-e7589d129208?auto=format&fit=crop&q=80&w=600',
    bestSeller: true,
    newArrival: false
  },
  {
    id: 'p2',
    name: 'Saddle Calfskin Vintage',
    material: 'Vegetable Tanned Calfskin',
    price: 180.00,
    colors: [{ name: 'Brown', hex: '#654321' }],
    sizes: ['20mm', '22mm'],
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=600',
    bestSeller: true,
    newArrival: true
  },
  {
    id: 'p3',
    name: 'Milanese Steel Mesh',
    material: '316L Stainless Steel',
    price: 210.00,
    colors: [{ name: 'Silver', hex: '#c0c0c0' }, { name: 'Gold', hex: '#d4af37' }],
    sizes: ['18mm', '20mm'],
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5278?auto=format&fit=crop&q=80&w=600',
    bestSeller: true,
    newArrival: false
  },
  {
    id: 'p4',
    name: 'Navy Sailcloth Minimal',
    material: 'Woven Sailcloth & Rubber',
    price: 145.00,
    colors: [{ name: 'Navy', hex: '#000080' }],
    sizes: ['20mm', '22mm'],
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=600',
    bestSeller: true,
    newArrival: true
  }
];

let cart = JSON.parse(localStorage.getItem('luxuryCart')) || [];
let userAuth = JSON.parse(localStorage.getItem('luxuryUserAuth')) || null;

function saveCart() {
  localStorage.setItem('luxuryCart', JSON.stringify(cart));
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
  
  if (cartBody && cartSubtotal) {
    cartBody.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
      cartBody.innerHTML = '<p class="body-md" style="text-align:center; padding: 2rem 0; color: var(--color-tertiary);">Your cart is empty.</p>';
    } else {
      cart.forEach((item, index) => {
        total += item.price * item.quantity;
        cartBody.innerHTML += `
          <div class="cart-item">
            <img src="${item.image}" class="cart-item-img" alt="${item.name}">
            <div class="cart-item-info">
              <div class="cart-item-title title-md">${item.name}</div>
              <div class="cart-item-meta label-caps">${item.color} | ${item.size}</div>
              <div class="technical-mono">$${item.price.toFixed(2)}</div>
              <div class="cart-item-actions" style="margin-top: 1rem;">
                <div class="qty-ctrl">
                  <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                  <span class="technical-mono">${item.quantity}</span>
                  <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeItem(${index})">Remove</button>
              </div>
            </div>
          </div>
        `;
      });
    }
    cartSubtotal.textContent = `$${total.toFixed(2)}`;
  }
}

function addToCart(product, size, color, quantity = 1) {
  const existingItem = cart.find(i => i.id === product.id && i.size === size && i.color === color);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, size, color, quantity });
  }
  saveCart();
  openCartDrawer();
}

function updateQty(index, change) {
  if (cart[index]) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
  }
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
}

function openCartDrawer() {
  document.getElementById('cart-drawer-overlay').style.display = 'block';
  setTimeout(() => {
    document.getElementById('cart-drawer').classList.add('open');
  }, 10);
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
  setTimeout(() => {
    document.getElementById('cart-drawer-overlay').style.display = 'none';
  }, 400);
}

// Auth Logic
let authState = { mode: 'login' };

function injectAuthModal() {
  const modalHTML = `
  <div class="auth-modal-overlay" id="auth-modal-overlay">
    <div class="auth-modal" id="auth-modal">
      <button class="auth-close" id="auth-close-btn">&times;</button>
      <div class="auth-logo">AURELIUS</div>
      <div id="auth-modal-content"></div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('auth-close-btn').addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal-overlay') closeAuthModal();
  });
}

function openAuthModal() {
  setAuthMode('login');
  document.getElementById('auth-modal-overlay').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('auth-modal').classList.add('open');
  }, 10);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('open');
  setTimeout(() => {
    document.getElementById('auth-modal-overlay').style.display = 'none';
  }, 400);
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
        <button class="auth-tab active">Sign In</button>
        <button class="auth-tab" onclick="setAuthMode('signup')">Sign Up</button>
      </div>
      <div class="form-group" style="text-align:left;">
        <input type="text" id="auth-email" class="form-input" placeholder="Email / Username" required>
      </div>
      <div class="form-group" style="position:relative; text-align:left;">
        <input type="password" id="auth-password" class="form-input" placeholder="Password" required>
        <span class="password-toggle" onclick="togglePassword('auth-password')">👁️</span>
      </div>
      <div style="text-align:right; margin-bottom:1.5rem;">
        <a href="#" style="font-size:12px; color:var(--color-tertiary); text-decoration:none;">Forgot Password?</a>
      </div>
      <div class="auth-error" id="auth-error-msg" style="margin-bottom:1rem;"></div>
      <button class="btn-primary" id="auth-submit-btn" style="width:100%;" onclick="handleAuthSubmit()">Login</button>
    `;
  } else if (authState.mode === 'signup') {
    container.innerHTML = `
      <div class="auth-tabs">
        <button class="auth-tab" onclick="setAuthMode('login')">Sign In</button>
        <button class="auth-tab active">Sign Up</button>
      </div>
      <div style="text-align:left;">
        <div class="form-group" style="margin-bottom: 0.5rem;"><input type="text" id="reg-name" class="form-input" placeholder="Full Name" required></div>
        <div class="form-group" style="margin-bottom: 0.5rem;"><input type="email" id="reg-email" class="form-input" placeholder="Email" required></div>
        <div class="form-group" style="margin-bottom: 0.5rem;"><input type="tel" id="reg-mobile" class="form-input" placeholder="Mobile Number" required></div>
        <div class="form-group" style="margin-bottom: 0.5rem;"><input type="text" id="reg-username" class="form-input" placeholder="Username" required></div>
        <div class="form-group" style="position:relative; margin-bottom: 0.5rem;">
          <input type="password" id="reg-password" class="form-input" placeholder="Password" required>
          <span class="password-toggle" onclick="togglePassword('reg-password')">👁️</span>
        </div>
        <div class="form-group" style="position:relative; margin-bottom: 0.5rem;">
          <input type="password" id="reg-confirm" class="form-input" placeholder="Confirm Password" required>
          <span class="password-toggle" onclick="togglePassword('reg-confirm')">👁️</span>
        </div>
      </div>
      <div class="auth-error" id="auth-error-msg" style="margin-bottom:1rem;"></div>
      <button class="btn-primary" id="auth-submit-btn" style="width:100%; margin-top:1rem;" onclick="handleAuthSubmit()">Continue</button>
    `;
  } else if (authState.mode === 'otp') {
    container.innerHTML = `
      <h2 class="title-lg auth-title">Verification</h2>
      <p class="body-md" style="color:var(--color-tertiary); margin-bottom: 2rem;">Enter the OTP sent to your registered email/mobile. <br><span style="font-size:11px;">(Default OTP: 111111)</span></p>
      
      <div class="otp-container">
        <input type="text" class="otp-input" maxlength="1" onkeyup="moveToNext(this, event)">
        <input type="text" class="otp-input" maxlength="1" onkeyup="moveToNext(this, event)">
        <input type="text" class="otp-input" maxlength="1" onkeyup="moveToNext(this, event)">
        <input type="text" class="otp-input" maxlength="1" onkeyup="moveToNext(this, event)">
        <input type="text" class="otp-input" maxlength="1" onkeyup="moveToNext(this, event)">
        <input type="text" class="otp-input" maxlength="1" onkeyup="moveToNext(this, event)">
      </div>
      
      <div class="auth-error" id="auth-error-msg" style="margin-bottom:1rem; text-align:center;"></div>
      <button class="btn-primary" id="auth-submit-btn" style="width:100%; margin-bottom:1rem;" onclick="verifyOTP()">Verify OTP</button>
      
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span style="color:var(--color-tertiary);">Resend OTP in 00:59</span>
        <a href="#" onclick="setAuthMode('login')" style="color:var(--color-primary);">Change email/mobile</a>
      </div>
    `;
    setTimeout(() => {
      document.querySelector('.otp-input').focus();
    }, 100);
  } else if (authState.mode === 'success') {
    container.innerHTML = `
      <svg width="48" height="48" style="color:var(--color-secondary); margin-bottom:1rem; margin-top:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h2 class="title-lg auth-title" style="margin-bottom: 1rem;">Login Successful</h2>
      <p class="body-md" style="color:var(--color-tertiary); margin-bottom: 2rem;">Welcome to your bespoke experience.</p>
    `;
    setTimeout(() => {
      closeAuthModal();
      updateAuthUI();
    }, 2000);
  }
}

function togglePassword(id) {
  const el = document.getElementById(id);
  if (el.type === 'password') {
    el.type = 'text';
  } else {
    el.type = 'password';
  }
}

function moveToNext(input, event) {
  if (input.value.length === 1) {
    const next = input.nextElementSibling;
    if (next) next.focus();
  }
  if (event.key === 'Backspace') {
    const prev = input.previousElementSibling;
    if (prev) prev.focus();
  }
}

function handleAuthSubmit() {
  const btn = document.getElementById('auth-submit-btn');
  const errorMsg = document.getElementById('auth-error-msg');
  
  if (authState.mode === 'login') {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    if (!email || !pass) {
      errorMsg.textContent = 'Please enter both email/username and password.';
      errorMsg.style.display = 'block';
      return;
    }
  } else {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const conf = document.getElementById('reg-confirm').value;
    if (!email || !pass || pass !== conf) {
      errorMsg.textContent = 'Please fill all required fields and ensure passwords match.';
      errorMsg.style.display = 'block';
      return;
    }
  }
  
  errorMsg.style.display = 'none';
  btn.textContent = 'Processing...';
  
  setTimeout(() => {
    setAuthMode('otp');
  }, 1000);
}

function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const otp = Array.from(inputs).map(i => i.value).join('');
  const btn = document.getElementById('auth-submit-btn');
  const errorMsg = document.getElementById('auth-error-msg');
  
  if (otp.length < 6) {
    errorMsg.textContent = 'Invalid OTP. Please try again.';
    errorMsg.style.display = 'block';
    return;
  }
  
  errorMsg.style.display = 'none';
  btn.textContent = 'Verifying...';
  
  setTimeout(() => {
    if (otp === '000000') {
      errorMsg.textContent = 'OTP expired. Please request a new OTP.';
      errorMsg.style.display = 'block';
      btn.textContent = 'Verify OTP';
      return;
    }
    
    if (otp !== '111111') {
      errorMsg.textContent = 'Invalid OTP. Please try again.';
      errorMsg.style.display = 'block';
      btn.textContent = 'Verify OTP';
      return;
    }
    
    if (!userAuth || !userAuth.userId) {
       const nameInput = document.getElementById('reg-name');
       const emailInput = document.getElementById('reg-email');
       const phoneInput = document.getElementById('reg-mobile');
       
       userAuth = {
         id: 'u_' + Date.now(),
         userId: 'WF-' + Math.floor(100000 + Math.random() * 900000),
         name: nameInput && nameInput.value ? nameInput.value : 'John Doe',
         email: emailInput && emailInput.value ? emailInput.value : 'john@example.com',
         mobile: phoneInput && phoneInput.value ? phoneInput.value : '+91 98765 43210'
       };
    }
    localStorage.setItem('luxuryUserAuth', JSON.stringify(userAuth));
    setAuthMode('success');
  }, 1200);
}

function updateAuthUI() {
  const authNavs = document.querySelectorAll('.auth-trigger');
  authNavs.forEach(nav => {
    if (userAuth && userAuth.userId) {
      nav.innerHTML = `
        <div class="profile-dropdown-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="cursor:pointer;" onclick="toggleProfileDropdown(event)"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <div class="profile-dropdown" id="profile-dropdown">
            <div class="profile-dropdown-header">
              <div class="title-md">${userAuth.name}</div>
              <div class="technical-mono" style="margin: 0.5rem 0;">User ID: ${userAuth.userId}</div>
              <div class="body-sm" style="color:var(--color-tertiary);">${userAuth.email}</div>
            </div>
            <ul class="profile-dropdown-menu">
              <li><a href="dashboard.html#profile">Profile Info</a></li>
              <li><a href="dashboard.html#orders">My Orders</a></li>
              <li><a href="dashboard.html#security">Security</a></li>
              <div class="profile-dropdown-divider"></div>
              <li><a href="#" onclick="handleLogout(event)">Logout</a></li>
            </ul>
          </div>
        </div>
      `;
      nav.onclick = null;
    } else {
      nav.innerHTML = 'Sign Up';
      nav.onclick = openAuthModal;
    }
  });
}

function toggleProfileDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown && dropdown.classList.contains('open') && !e.target.closest('.profile-dropdown-wrap')) {
    dropdown.classList.remove('open');
  }
});

function handleLogout(e) {
  e.preventDefault();
  if(confirm("Are you sure you want to log out?")) {
    userAuth = null;
    localStorage.removeItem('luxuryUserAuth');
    updateAuthUI();
    if(window.location.pathname.includes('dashboard.html')) {
      window.location.href = 'index.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectAuthModal();
  updateCartUI();
  updateAuthUI();

  // Attach drawer listeners
  const overlay = document.getElementById('cart-drawer-overlay');
  const closeBtn = document.getElementById('cart-close-btn');
  const openBtns = document.querySelectorAll('.open-cart');

  if(overlay) overlay.addEventListener('click', closeCartDrawer);
  if(closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  openBtns.forEach(btn => btn.addEventListener('click', openCartDrawer));

  // If on homepage, render best sellers
  const grid = document.getElementById('best-sellers-grid');
  if (grid) {
    products.filter(p => p.bestSeller).forEach(product => {
      grid.innerHTML += `
        <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
          <div class="product-card">
            <div class="product-image-wrap">
              <img src="${product.image}" class="product-image" alt="${product.name}">
            </div>
            <div class="product-info">
              <div class="product-title title-md">${product.name}</div>
              <div class="product-material label-caps">${product.material}</div>
              <div class="product-price technical-mono">$${product.price.toFixed(2)}</div>
            </div>
          </div>
        </a>
      `;
    });
  }

  // If on product page, render details
  if (window.location.pathname.includes('product.html')) {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id') || 'p1';
    const product = products.find(p => p.id === pid);
    
    if (product) {
      document.getElementById('pdp-img').src = product.image;
      document.getElementById('pdp-title').textContent = product.name;
      document.getElementById('pdp-price').textContent = `$${product.price.toFixed(2)}`;
      
      const sizeContainer = document.getElementById('pdp-sizes');
      product.sizes.forEach((s, idx) => {
        sizeContainer.innerHTML += `<button class="size-chip technical-mono ${idx===0?'active':''}" onclick="selectSize(this)">${s}</button>`;
      });

      const colorContainer = document.getElementById('pdp-colors');
      product.colors.forEach((c, idx) => {
        colorContainer.innerHTML += `
          <div class="swatch ${idx===0?'active':''}" onclick="selectColor(this)" data-color="${c.name}" title="${c.name}">
            <div class="swatch-inner" style="background-color: ${c.hex}"></div>
          </div>
        `;
      });

      window.selectedSize = product.sizes[0];
      window.selectedColor = product.colors[0].name;
      window.currentProduct = product;
    }
  }
});

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
