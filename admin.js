// ============================================================
// AURELIUS ADMIN PANEL — admin.js
// ============================================================

// Failsafe error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
  const loadingEl = document.getElementById('admin-loading');
  if (loadingEl) loadingEl.style.display = 'none';
  
  const errStr = `Error: ${msg}\nLine: ${lineNo}\nCol: ${columnNo}`;
  const errorDiv = document.getElementById('admin-auth-error') || document.body;
  if (errorDiv === document.body) {
    document.body.innerHTML = `<div style="padding:2rem;color:red;background:#fee;font-family:monospace">${errStr}</div>`;
  } else {
    errorDiv.style.display = 'flex';
    document.getElementById('admin-login-form').style.display = 'none';
    const denied = document.getElementById('admin-access-denied');
    denied.style.display = 'block';
    denied.querySelector('p').textContent = errStr;
    denied.querySelector('h2').textContent = 'JavaScript Error';
  }
  return false;
};



const SUPABASE_URL = 'https://ffwlyelptfpyruowjknt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IZtDTHTofCFF_nPbuz6bsQ_bFWOT2eb';
let supabaseClient = null;
let adminUser = null;
let allOrders = [];
let allProducts = [];
let allCustomers = [];
let allPromos = [];
let confirmCallback = null;

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
      showAuthError('Supabase client not loaded.');
      return;
    }

    const dateEl = document.getElementById('dashboard-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    }

    const { data: { session }, error: sessionErr } = await supabaseClient.auth.getSession();
    if (sessionErr) throw sessionErr;
    if (!session) { 
      showAuthError('Please log in using the store front first.'); 
      return; 
    }

    adminUser = session.user;

    // Check admin role
    const { data: roleRow, error: roleErr } = await supabaseClient
      .from('admin_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .single();

    if (roleErr || !roleRow || roleRow.role !== 'admin') { 
      console.warn('Admin check failed:', roleErr || 'Not admin');
      showAuthError(`Your account (${adminUser.email}) does not have admin privileges.\n\nTo fix this, go to Supabase SQL Editor and run:\n\nINSERT INTO public.admin_roles (user_id, role) VALUES ('${adminUser.id}', 'admin');`, true); 
      return; 
    }

    // Show UI
    document.getElementById('admin-loading').style.display = 'none';
    document.getElementById('admin-sidebar').style.visibility = 'visible';
    document.getElementById('section-dashboard').style.display = 'block';

    const name = adminUser.user_metadata?.full_name || adminUser.email;
    document.getElementById('admin-user-name').textContent = name;
    document.getElementById('admin-user-email').textContent = adminUser.email;
    document.getElementById('admin-avatar-initials').textContent = (name || 'A')[0].toUpperCase();

    await loadDashboard();
    await loadPaymentConfig();
  } catch (err) {
    console.error('Admin init error:', err);
    showAuthError('An error occurred during initialization: ' + err.message);
  }
});

function showAuthError(msg, isDenied = false) {
  document.getElementById('admin-loading').style.display = 'none';
  const errDiv = document.getElementById('admin-auth-error');
  errDiv.style.display = 'flex';
  
  if (isDenied) {
    document.getElementById('admin-login-form').style.display = 'none';
    document.getElementById('admin-access-denied').style.display = 'block';
    if (msg) {
      document.querySelector('#admin-access-denied p').textContent = msg;
    }
  } else {
    document.getElementById('admin-login-form').style.display = 'block';
    document.getElementById('admin-access-denied').style.display = 'none';
    if (msg) {
      document.getElementById('admin-auth-msg').textContent = msg;
    }
  }
}

async function handleAdminLogin() {
  const email = document.getElementById('admin-login-email').value;
  const pass = document.getElementById('admin-login-password').value;
  const btn = document.getElementById('admin-login-btn');
  const err = document.getElementById('admin-login-error');
  
  if (!email || !pass) {
    err.textContent = 'Please enter email and password.';
    err.style.display = 'block';
    return;
  }
  
  err.style.display = 'none';
  btn.textContent = 'Logging in...';
  btn.disabled = true;
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  
  if (error) {
    err.textContent = error.message;
    err.style.display = 'block';
    btn.textContent = 'Log In';
    btn.disabled = false;
    return;
  }
  
  // Reload page to re-run the init flow which checks admin role
  window.location.reload();
}

async function handleAdminLogout(e) {
  if (e) e.preventDefault();
  if (confirm('Are you sure you want to log out?')) {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  }
}

// ─── NAVIGATION ─────────────────────────────────────────────
function showSection(name, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.admin-nav-item').forEach(a => a.classList.remove('active'));
  document.getElementById('section-' + name).style.display = 'block';
  if (el) el.classList.add('active');
  if (name === 'dashboard') loadDashboard();
  if (name === 'products') loadProducts();
  if (name === 'orders') loadOrders();
  if (name === 'promos') loadPromos();
  if (name === 'customers') loadCustomers();
}


// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.className = 'admin-toast' + (type ? ' ' + type : '');
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}

// ─── CONFIRM DIALOG ──────────────────────────────────────────
function openConfirm(title, message, callback, showReason = false) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-reason-wrap').style.display = showReason ? 'block' : 'none';
  document.getElementById('confirm-reason').value = '';
  document.getElementById('confirm-modal-overlay').style.display = 'flex';
  confirmCallback = callback;
}

function closeConfirm() {
  document.getElementById('confirm-modal-overlay').style.display = 'none';
  confirmCallback = null;
}

function executeConfirm() {
  const reason = document.getElementById('confirm-reason').value;
  if (confirmCallback) confirmCallback(reason);
  closeConfirm();
}

// ─── MONEY HELPERS ───────────────────────────────────────────
function fmt(n) {
  return '₹' + Number(n || 0).toFixed(2);
}

function calcDiscount(mrp, selling) {
  if (!mrp || mrp <= 0 || selling >= mrp) return 0;
  return Math.round(((mrp - selling) / mrp) * 100 * 100) / 100;
}

// ─── DASHBOARD ───────────────────────────────────────────────
async function loadDashboard() {
  const [prodRes, orderRes, custRes, promoRes] = await Promise.all([
    supabaseClient.from('products').select('id, active', { count: 'exact' }),
    supabaseClient.from('orders').select('id, status', { count: 'exact' }),
    supabaseClient.from('customers').select('id', { count: 'exact' }),
    supabaseClient.from('promo_codes').select('id, active', { count: 'exact' })
  ]);

  const products = prodRes.data || [];
  const orders = orderRes.data || [];
  const customers = custRes.data || [];
  const promos = promoRes.data || [];

  document.getElementById('stat-products').textContent = products.filter(p => p.active !== false).length;
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-pending').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('stat-approved').textContent = orders.filter(o => o.status === 'approved').length;
  document.getElementById('stat-dispatched').textContent = orders.filter(o => o.status === 'dispatched').length;
  document.getElementById('stat-cancelled').textContent = orders.filter(o => o.status === 'cancelled').length;
  document.getElementById('stat-customers').textContent = customers.length;
  document.getElementById('stat-promos').textContent = promos.filter(p => p.active).length;

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const badge = document.getElementById('pending-orders-badge');
  if (pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  // Recent orders
  const { data: recent } = await supabaseClient
    .from('orders')
    .select('id, order_number, customer_id, grand_total, total_amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(8);

  const tbody = document.getElementById('recent-orders-body');
  if (!recent || recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty">No orders yet.</td></tr>';
    return;
  }

  // Fetch customer names for recent orders
  const custIds = [...new Set(recent.map(o => o.customer_id).filter(Boolean))];
  let custMap = {};
  if (custIds.length > 0) {
    const { data: custs } = await supabaseClient.from('customers').select('id, name, email').in('id', custIds);
    (custs || []).forEach(c => { custMap[c.id] = c; });
  }

  tbody.innerHTML = recent.map(o => {
    const cust = custMap[o.customer_id] || {};
    const total = o.grand_total || o.total_amount || 0;
    return `<tr>
      <td><strong>${o.order_number || o.id?.substring(0,8) || '—'}</strong></td>
      <td>${cust.name || cust.email || '—'}</td>
      <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
      <td>${fmt(total)}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td><button class="tbl-btn primary" onclick="openOrderDetail('${o.id}')">View</button></td>
    </tr>`;
  }).join('');
}

// ─── PRODUCTS ────────────────────────────────────────────────
async function loadProducts() {
  const { data, error } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error loading products', 'error'); return; }
  allProducts = data || [];
  renderProducts(allProducts);
}

function renderProducts(list) {
  const tbody = document.getElementById('products-tbody');
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-table-empty">No products found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => {
    const mrp = p.mrp || p.price || 0;
    const selling = p.selling_price || p.price || 0;
    const disc = calcDiscount(mrp, selling);
    const active = p.active !== false;
    return `<tr>
      <td><img src="${p.image || ''}" class="admin-prod-thumb" alt="${p.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2260%22><rect width=%2248%22 height=%2260%22 fill=%22%23F5F3EF%22/></svg>'"></td>
      <td><strong>${p.name}</strong><br><span style="color:var(--color-tertiary);font-size:11px">${p.material || ''}</span></td>
      <td>${fmt(mrp)}</td>
      <td>${fmt(selling)}</td>
      <td>${disc > 0 ? `<span style="color:#047857;font-weight:600">${disc}% OFF</span>` : '—'}</td>
      <td>${p.gst_rate != null ? p.gst_rate + '%' : '18%'}</td>
      <td><span class="status-badge status-${active ? 'active' : 'inactive'}">${active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="tbl-btn primary" onclick="editProduct('${p.id}')">Edit</button>
        <button class="tbl-btn" onclick="toggleProduct('${p.id}', ${!active})">${active ? 'Deactivate' : 'Activate'}</button>
        <button class="tbl-btn danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function filterProducts() {
  const q = document.getElementById('product-search').value.toLowerCase();
  const status = document.getElementById('product-filter-status').value;
  let list = allProducts.filter(p => {
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.material || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    const matchStatus = !status || (status === 'active' && p.active !== false) || (status === 'inactive' && p.active === false);
    return matchQ && matchStatus;
  });
  renderProducts(list);
}


function toggleWarrantyFields() {
  const val = document.getElementById('p-warranty-avail').value;
  document.querySelectorAll('.warranty-field').forEach(el => el.style.display = val === 'true' ? 'flex' : 'none');
}

function addSpecRow(name = '', value = '') {
  const container = document.getElementById('p-specs-container');
  const row = document.createElement('div');
  row.className = 'form-row-2 spec-row';
  row.style.marginBottom = '1rem';
  row.innerHTML = `
    <div class="form-group" style="margin:0"><input type="text" class="admin-input spec-name" placeholder="Name (e.g. Movement)" value="${name}"></div>
    <div class="form-group" style="margin:0; display:flex; gap:0.5rem">
      <input type="text" class="admin-input spec-value" placeholder="Value (e.g. Quartz)" value="${value}" style="flex:1">
      <button type="button" class="btn-secondary" onclick="this.closest('.spec-row').remove()" style="padding:0 12px; color:var(--color-error)">X</button>
    </div>
  `;
  container.appendChild(row);
}

// ─── PRODUCT MODAL ───────────────────────────────────────────
function openProductModal(product = null) {
  document.getElementById('product-modal-title').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('product-id-field').value = product ? product.id : '';
  document.getElementById('p-name').value = product ? product.name : '';
  document.getElementById('p-category').value = product ? (product.category || '') : '';
  document.getElementById('p-description').value = product ? (product.description || '') : '';
  document.getElementById('p-material').value = product ? (product.material || '') : '';
  document.getElementById('p-sku').value = product ? (product.sku || '') : '';
  document.getElementById('p-stock').value = product ? (product.stock_quantity || '') : '';
  document.getElementById('p-image').value = product ? (product.image || '') : '';
  document.getElementById('p-mrp').value = product ? (product.mrp || product.price || '') : '';
  document.getElementById('p-selling-price').value = product ? (product.selling_price || product.price || '') : '';
  document.getElementById('p-active').value = product ? (product.active !== false ? 'true' : 'false') : 'true';
  document.getElementById('p-best-seller').value = product ? (product.best_seller ? 'true' : 'false') : 'false';
  document.getElementById('p-new-arrival').value = product ? (product.new_arrival ? 'true' : 'false') : 'false';

  // Sizes
  if (product && product.sizes) {
    const sz = Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes;
    document.getElementById('p-sizes').value = sz;
  } else {
    document.getElementById('p-sizes').value = '';
  }

  // Colors
  if (product && product.colors) {
    document.getElementById('p-colors').value = JSON.stringify(Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors));
  } else {
    document.getElementById('p-colors').value = '';
  }

  // GST
  const gst = product ? (product.gst_rate != null ? product.gst_rate : 18) : 18;
  const standardRates = [0, 5, 12, 18, 28];
  const sel = document.getElementById('p-gst-select');
  if (standardRates.includes(Number(gst))) {
    sel.value = String(gst);
    document.getElementById('custom-gst-wrap').style.display = 'none';
  } else {
    sel.value = 'custom';
    document.getElementById('custom-gst-wrap').style.display = 'block';
    document.getElementById('p-gst-custom').value = gst;
  }


  document.getElementById('p-additional-images').value = '';
  document.getElementById('p-video-url').value = product ? (product.video_url || '') : '';
  
  document.getElementById('p-warranty-avail').value = product && product.warranty_available ? 'true' : 'false';
  document.getElementById('p-warranty-duration').value = product ? (product.warranty_duration || '') : '';
  document.getElementById('p-warranty-type').value = product ? (product.warranty_type || '') : '';
  document.getElementById('p-warranty-terms').value = product ? (product.warranty_terms || '') : '';
  toggleWarrantyFields();

  document.getElementById('p-specs-container').innerHTML = '';
  document.getElementById('p-recommendations').value = '';
  
  if (product && product.id) {
    supabaseClient.from('product_images').select('image_url').eq('product_id', product.id).eq('is_primary', false).order('sort_order').then(({data}) => {
      if (data && data.length) document.getElementById('p-additional-images').value = JSON.stringify(data.map(d=>d.image_url));
    });
    supabaseClient.from('product_specifications').select('*').eq('product_id', product.id).order('sort_order').then(({data}) => {
      if (data) data.forEach(s => addSpecRow(s.spec_name, s.spec_value));
    });
    supabaseClient.from('product_recommendations').select('recommended_product_id').eq('product_id', product.id).order('sort_order').then(({data}) => {
      if (data) document.getElementById('p-recommendations').value = data.map(d=>d.recommended_product_id).join(', ');
    });
  }

  document.getElementById('price-error').style.display = 'none';
  updateProductCalc();
  document.getElementById('product-modal-overlay').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').style.display = 'none';
}

function editProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (p) openProductModal(p);
}

function handleGstSelect() {
  const val = document.getElementById('p-gst-select').value;
  document.getElementById('custom-gst-wrap').style.display = val === 'custom' ? 'block' : 'none';
}

function updateProductCalc() {
  const mrp = parseFloat(document.getElementById('p-mrp').value) || 0;
  const selling = parseFloat(document.getElementById('p-selling-price').value) || 0;
  const preview = document.getElementById('price-calc-preview');
  const errEl = document.getElementById('price-error');

  if (mrp > 0 || selling > 0) {
    preview.style.display = 'block';
    document.getElementById('calc-mrp').textContent = fmt(mrp);
    document.getElementById('calc-selling').textContent = fmt(selling);
    const disc = calcDiscount(mrp, selling);
    document.getElementById('calc-discount').textContent = disc > 0 ? disc + '% OFF' : 'No discount';
    if (selling > mrp && mrp > 0) {
      errEl.style.display = 'block';
    } else {
      errEl.style.display = 'none';
    }
  } else {
    preview.style.display = 'none';
    errEl.style.display = 'none';
  }
}

async function saveProduct() {
  const id = document.getElementById('product-id-field').value;
  const name = document.getElementById('p-name').value.trim();
  const mrp = parseFloat(document.getElementById('p-mrp').value) || 0;
  const selling = parseFloat(document.getElementById('p-selling-price').value) || 0;

  if (!name) { showToast('Product name is required', 'error'); return; }
  if (mrp <= 0) { showToast('MRP is required', 'error'); return; }
  if (selling <= 0) { showToast('Selling price is required', 'error'); return; }
  if (selling > mrp) { showToast('Selling price cannot exceed MRP', 'error'); return; }

  const gstSel = document.getElementById('p-gst-select').value;
  let gstRate = gstSel === 'custom'
    ? parseFloat(document.getElementById('p-gst-custom').value) || 0
    : parseFloat(gstSel);

  if (isNaN(gstRate) || gstRate < 0) { showToast('Invalid GST rate', 'error'); return; }

  // Parse sizes
  let sizes = [];
  const sizesRaw = document.getElementById('p-sizes').value.trim();
  if (sizesRaw) sizes = sizesRaw.split(',').map(s => s.trim()).filter(Boolean);

  // Parse colors
  let colors = [];
  const colorsRaw = document.getElementById('p-colors').value.trim();
  if (colorsRaw) {
    try { colors = JSON.parse(colorsRaw); } catch(e) { showToast('Colors JSON is invalid', 'error'); return; }
  }

  const payload = {
    name,
    category: document.getElementById('p-category').value.trim() || null,
    description: document.getElementById('p-description').value.trim() || null,
    material: document.getElementById('p-material').value.trim() || null,
    sku: document.getElementById('p-sku').value.trim() || null,
    stock_quantity: parseInt(document.getElementById('p-stock').value) || null,
    image: document.getElementById('p-image').value.trim() || null,
    mrp: Math.round(mrp * 100) / 100,
    selling_price: Math.round(selling * 100) / 100,
    price: Math.round(selling * 100) / 100, // keep legacy price in sync
    gst_rate: gstRate,
    active: document.getElementById('p-active').value === 'true',
    best_seller: document.getElementById('p-best-seller').value === 'true',
    new_arrival: document.getElementById('p-new-arrival').value === 'true',
    sizes: sizes.length ? sizes : null,
    colors: colors.length ? colors : null,
    warranty_available: document.getElementById('p-warranty-avail').value === 'true',
    warranty_duration: document.getElementById('p-warranty-duration').value.trim() || null,
    warranty_type: document.getElementById('p-warranty-type').value.trim() || null,
    warranty_terms: document.getElementById('p-warranty-terms').value.trim() || null,
    video_url: document.getElementById('p-video-url').value.trim() || null,
    updated_at: new Date().toISOString()
  };

  const btn = document.getElementById('save-product-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('products').update(payload).eq('id', id));
  } else {
    payload.id = 'p' + Date.now();
    payload.created_at = new Date().toISOString();
    ({ error } = await supabaseClient.from('products').insert([payload]));
  }

  btn.textContent = 'Save Product';
  btn.disabled = false;

  if (error) {
    showToast('Error saving product: ' + error.message, 'error');
  } else {
    const targetId = id || payload.id;
    
    // Save Specs
    await supabaseClient.from('product_specifications').delete().eq('product_id', targetId);
    const specRows = document.querySelectorAll('.spec-row');
    const specs = [];
    specRows.forEach((r, idx) => {
      const n = r.querySelector('.spec-name').value.trim();
      const v = r.querySelector('.spec-value').value.trim();
      if (n && v) specs.push({ product_id: targetId, spec_name: n, spec_value: v, sort_order: idx });
    });
    if (specs.length) await supabaseClient.from('product_specifications').insert(specs);
    
    // Save Images
    await supabaseClient.from('product_images').delete().eq('product_id', targetId);
    const addImagesRaw = document.getElementById('p-additional-images').value.trim();
    if (addImagesRaw) {
      try {
        const arr = JSON.parse(addImagesRaw);
        const imgPayload = arr.map((url, i) => ({ product_id: targetId, image_url: url, is_primary: false, sort_order: i }));
        await supabaseClient.from('product_images').insert(imgPayload);
      } catch(e) { console.error('Images json error', e); }
    }

    // Save Recommendations
    await supabaseClient.from('product_recommendations').delete().eq('product_id', targetId);
    const recsRaw = document.getElementById('p-recommendations').value.trim();
    if (recsRaw) {
      const recs = recsRaw.split(',').map(r => r.trim()).filter(Boolean);
      const recPayload = recs.map((rId, i) => ({ product_id: targetId, recommended_product_id: rId, sort_order: i }));
      for(const r of recPayload) {
        try { await supabaseClient.from('product_recommendations').insert([r]); } catch(e){}
      }
    }

    showToast(id ? 'Product updated!' : 'Product added!', 'success');
    closeProductModal();
    await loadProducts();
  }
}

async function toggleProduct(id, makeActive) {
  const { error } = await supabaseClient.from('products').update({ active: makeActive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { showToast('Error updating product', 'error'); return; }
  showToast(makeActive ? 'Product activated' : 'Product deactivated', 'success');
  await loadProducts();
}

async function deleteProduct(id) {
  // Check if product has orders
  const { data: items } = await supabaseClient.from('order_items').select('id').eq('product_id', id).limit(1);
  if (items && items.length > 0) {
    openConfirm(
      'Cannot Hard Delete',
      'This product has order history. It will be deactivated instead to preserve order records.',
      async () => { await toggleProduct(id, false); }
    );
    return;
  }
  openConfirm(
    'Delete Product',
    'Are you sure you want to permanently delete this product?',
    async () => {
      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      if (error) { showToast('Error deleting product', 'error'); return; }
      showToast('Product deleted', 'success');
      await loadProducts();
    }
  );
}

// ─── ORDERS ──────────────────────────────────────────────────
async function loadOrders() {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { showToast('Error loading orders', 'error'); return; }
  allOrders = data || [];

  // Get customer info
  const custIds = [...new Set(allOrders.map(o => o.customer_id).filter(Boolean))];
  if (custIds.length > 0) {
    const { data: custs } = await supabaseClient.from('customers').select('id, name, email, mobile').in('id', custIds);
    const custMap = {};
    (custs || []).forEach(c => { custMap[c.id] = c; });
    allOrders.forEach(o => { o._customer = custMap[o.customer_id] || {}; });
  }

  renderOrders(allOrders);
  document.getElementById('orders-list-view').style.display = 'block';
  document.getElementById('order-detail-view').style.display = 'none';
  document.getElementById('dispatch-label-area').style.display = 'none';

  // Update badge
  const pendingCount = allOrders.filter(o => o.status === 'pending').length;
  const badge = document.getElementById('pending-orders-badge');
  badge.textContent = pendingCount;
  badge.style.display = pendingCount > 0 ? 'flex' : 'none';
}

function renderOrders(list) {
  const tbody = document.getElementById('orders-tbody');
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-table-empty">No orders found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => {
    const cust = o._customer || {};
    const total = o.grand_total || o.total_amount || 0;
    const itemCount = Array.isArray(o.items) ? o.items.length : '—';
    return `<tr>
      <td><strong>${o.order_number || o.id?.substring(0,8) || '—'}</strong></td>
      <td>
        <div>${cust.name || '—'}</div>
        <div style="font-size:11px;color:var(--color-tertiary)">${cust.email || ''}</div>
      </td>
      <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
      <td>${itemCount}</td>
      <td><strong>${fmt(total)}</strong></td>
      <td><span style="font-size:11px">${o.payment_method || 'online'}</span></td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td><button class="tbl-btn primary" onclick="openOrderDetail('${o.id}')">View</button></td>
    </tr>`;
  }).join('');
}

function filterOrders() {
  const q = (document.getElementById('order-search').value || '').toLowerCase();
  const status = document.getElementById('order-filter-status').value;
  const sort = document.getElementById('order-sort').value;

  let list = allOrders.filter(o => {
    const cust = o._customer || {};
    const matchQ = !q ||
      (o.order_number || '').toLowerCase().includes(q) ||
      (cust.name || '').toLowerCase().includes(q) ||
      (cust.email || '').toLowerCase().includes(q) ||
      (cust.mobile || '').toLowerCase().includes(q);
    const matchStatus = !status || o.status === status;
    return matchQ && matchStatus;
  });

  list = list.slice().sort((a, b) => {
    const da = new Date(a.created_at), db = new Date(b.created_at);
    return sort === 'oldest' ? da - db : db - da;
  });

  renderOrders(list);
}

// ─── ORDER DETAIL ────────────────────────────────────────────
async function openOrderDetail(orderId) {
  document.getElementById('orders-list-view').style.display = 'none';
  document.getElementById('order-detail-view').style.display = 'block';
  document.getElementById('dispatch-label-area').style.display = 'none';

  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('order-detail-number').textContent = 'Order ' + (order.order_number || '#' + orderId.substring(0,8));

  // Status badge
  const statusBadge = document.getElementById('order-detail-status-badge');
  statusBadge.innerHTML = `<span class="status-badge status-${order.status}" style="font-size:14px;padding:8px 16px">${order.status.toUpperCase()}</span>`;

  // Order info
  document.getElementById('order-info-section').innerHTML = `
    <span class="info-key">Order Number</span><span class="info-val">${order.order_number || '—'}</span>
    <span class="info-key">Order Date</span><span class="info-val">${new Date(order.created_at).toLocaleString('en-IN')}</span>
    <span class="info-key">Payment Gateway</span><span class="info-val" style="text-transform:uppercase">${order.payment_gateway || order.payment_method || 'online'}</span>
    <span class="info-key">Payment Status</span><span class="info-val">
      ${order.payment_status === 'paid' ? '<span style="color:#047857;font-weight:600">PAID</span>' : 
        order.payment_status === 'failed' ? '<span style="color:#dc2626;font-weight:600">FAILED</span>' : 
        '<span style="color:#d97706;font-weight:600">PENDING</span>'}
    </span>
    ${order.payment_transaction_id ? `<span class="info-key">Transaction ID</span><span class="info-val" style="font-family:monospace">${order.payment_transaction_id}</span>` : ''}
  `;

  // Customer info
  const cust = order._customer || {};
  document.getElementById('order-customer-section').innerHTML = `
    <div class="info-grid">
      <span class="info-key">Name</span><span class="info-val">${cust.name || '—'}</span>
      <span class="info-key">Email</span><span class="info-val">${cust.email || '—'}</span>
      <span class="info-key">Mobile</span><span class="info-val">${cust.mobile || '—'}</span>
    </div>
  `;

  // Address
  const addr = order.delivery_address || {};
  document.getElementById('order-address-section').innerHTML = `
    <div>${addr.name || cust.name || '—'}</div>
    <div>${addr.house || addr.flat || ''}</div>
    <div>${addr.street || addr.locality || ''}</div>
    <div>${addr.city || ''}${addr.state ? ', ' + addr.state : ''}</div>
    <div>${addr.country || 'India'} — ${addr.pin || addr.pincode || ''}</div>
    ${cust.mobile ? `<div style="margin-top:0.5rem">📞 ${cust.mobile}</div>` : ''}
  `;

  // Timeline
  renderTimeline(order);

  // Order Items — fetch from order_items table
  const { data: items } = await supabaseClient
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  const itemsTbody = document.getElementById('order-items-tbody');
  if (!items || items.length === 0) {
    // Fallback: render from JSONB items column
    const legacyItems = Array.isArray(order.items) ? order.items : [];
    if (legacyItems.length > 0) {
      itemsTbody.innerHTML = legacyItems.map(i => `<tr>
        <td>${i.name || i.product_name_snapshot || '—'}</td>
        <td>${i.color || ''} ${i.size || ''}</td>
        <td>${fmt(i.mrp || i.price)}</td>
        <td>${fmt(i.selling_price || i.price)}</td>
        <td>—</td>
        <td>${i.quantity || 1}</td>
        <td>${fmt((i.selling_price || i.price) * (i.quantity || 1))}</td>
      </tr>`).join('');
    } else {
      itemsTbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty">No items found</td></tr>';
    }
  } else {
    itemsTbody.innerHTML = items.map(i => `<tr>
      <td>
        ${i.image_snapshot ? `<img src="${i.image_snapshot}" style="width:36px;height:44px;object-fit:cover;vertical-align:middle;margin-right:8px">` : ''}
        <strong>${i.product_name_snapshot}</strong>
        ${i.sku_snapshot ? `<div style="font-size:11px;color:var(--color-tertiary)">${i.sku_snapshot}</div>` : ''}
      </td>
      <td>${[i.color_snapshot, i.variant_snapshot].filter(Boolean).join(' / ') || '—'}</td>
      <td>${fmt(i.mrp_snapshot)}</td>
      <td>${fmt(i.selling_price_snapshot)}</td>
      <td>${i.gst_rate_snapshot}%</td>
      <td>${i.quantity}</td>
      <td><strong>${fmt(i.line_total)}</strong></td>
    </tr>`).join('');
  }

  // Pricing breakdown
  document.getElementById('order-pricing-section').innerHTML = `
    <div class="pricing-row"><span>MRP Total</span><span>${fmt((order.subtotal || 0) + (order.product_discount || 0))}</span></div>
    <div class="pricing-row discount"><span>Product Discount</span><span>- ${fmt(order.product_discount || 0)}</span></div>
    <div class="pricing-row"><span>Subtotal</span><span>${fmt(order.subtotal || 0)}</span></div>
    ${order.promo_code ? `<div class="pricing-row promo"><span>Promo (${order.promo_code})</span><span>- ${fmt(order.promo_discount || 0)}</span></div>` : ''}
    <div class="pricing-row" style="color:var(--color-tertiary);font-size:12px"><span>GST (incl. in price)</span><span>${fmt(order.gst_amount || 0)}</span></div>
    <div class="pricing-row"><span>Shipping</span><span>${order.shipping_amount > 0 ? fmt(order.shipping_amount) : 'Free'}</span></div>
    <div class="pricing-row"><span>Grand Total</span><span>${fmt(order.grand_total || order.total_amount || 0)}</span></div>
  `;

  // Action buttons
  renderOrderActions(order);

  // Store current order ID for label
  document.getElementById('order-detail-view').dataset.orderId = orderId;
}

function renderTimeline(order) {
  const steps = [
    { label: 'Order Placed', time: order.created_at, done: true, icon: '✓' },
    {
      label: order.status === 'cancelled' ? 'Cancelled' : 'Approved',
      time: order.approved_at || order.cancelled_at,
      done: ['approved','dispatched','cancelled'].includes(order.status),
      icon: order.status === 'cancelled' ? '✕' : '✓',
      cancelled: order.status === 'cancelled',
      extra: order.cancellation_reason ? `Reason: ${order.cancellation_reason}` : null
    },
    { label: 'Label Printed', time: order.label_printed_at, done: !!order.label_printed_at, icon: '✓', skip: order.status === 'cancelled' },
    { label: 'Dispatched', time: order.dispatched_at, done: order.status === 'dispatched', icon: '✓', skip: order.status === 'cancelled' }
  ];

  document.getElementById('order-timeline-section').innerHTML = `<div class="timeline">${
    steps.filter(s => !s.skip || s.done).map(s => `
      <div class="timeline-item">
        <div class="timeline-dot ${s.done ? (s.cancelled ? 'cancelled' : 'done') : 'pending'}">${s.icon}</div>
        <div class="timeline-content">
          <div class="timeline-label">${s.label}</div>
          ${s.done && s.time ? `<div class="timeline-time">${new Date(s.time).toLocaleString('en-IN')}</div>` : ''}
          ${s.extra ? `<div class="timeline-time">${s.extra}</div>` : ''}
        </div>
      </div>
    `).join('')
  }</div>`;
}

function renderOrderActions(order) {
  const container = document.getElementById('order-action-buttons');
  let html = '<div class="admin-action-group">';

  if (order.status === 'pending') {
    html += `
      <button class="btn-primary btn-approve" onclick="approveOrder('${order.id}')">✓ Approve Order</button>
      <button class="btn-secondary btn-cancel-order" onclick="cancelOrder('${order.id}')">✕ Cancel Order</button>
    `;
  } else if (order.status === 'approved') {
    html += `
      <button class="btn-primary btn-label" onclick="printDispatchLabel('${order.id}')">🖨 Print Dispatch Label</button>
      <button class="btn-primary btn-dispatch" onclick="dispatchOrder('${order.id}')">🚚 Mark to Dispatch</button>
    `;
    if (!order.label_printed_at) {
      html += `<span style="font-size:12px;color:var(--color-tertiary);align-self:center">Print label before dispatching</span>`;
    }
  } else if (order.status === 'dispatched') {
    html += `<div style="color:#1d4ed8;font-weight:600;font-size:14px">✓ Order has been dispatched on ${new Date(order.dispatched_at).toLocaleString('en-IN')}</div>`;
  } else if (order.status === 'cancelled') {
    html += `<div style="color:var(--color-error);font-weight:600;font-size:14px">✕ Order was cancelled${order.cancellation_reason ? ': ' + order.cancellation_reason : ''}</div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function closeOrderDetail() {
  document.getElementById('orders-list-view').style.display = 'block';
  document.getElementById('order-detail-view').style.display = 'none';
  document.getElementById('dispatch-label-area').style.display = 'none';
}

// ─── ORDER ACTIONS ───────────────────────────────────────────
async function approveOrder(orderId) {
  openConfirm('Approve Order', 'Are you sure you want to approve this order?', async () => {
    const { data, error } = await supabaseClient.rpc('admin_approve_order', { p_order_id: orderId });
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Order approved!', 'success');
    await loadOrders();
    await openOrderDetail(orderId);
  });
}

async function cancelOrder(orderId) {
  openConfirm('Cancel Order', 'Are you sure you want to cancel this order?', async (reason) => {
    const { data, error } = await supabaseClient.rpc('admin_cancel_order', {
      p_order_id: orderId,
      p_reason: reason || null
    });
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Order cancelled', 'success');
    await loadOrders();
    await openOrderDetail(orderId);
  }, true);
}

async function dispatchOrder(orderId) {
  openConfirm('Mark as Dispatched', 'Mark this order as dispatched? This cannot be undone.', async () => {
    const { error } = await supabaseClient.rpc('admin_dispatch_order', { p_order_id: orderId });
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    // mark label printed too
    await supabaseClient.rpc('admin_mark_label_printed', { p_order_id: orderId });
    showToast('Order dispatched!', 'success');
    await loadOrders();
    await openOrderDetail(orderId);
  });
}

// ─── DISPATCH LABEL ──────────────────────────────────────────
async function printDispatchLabel(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  // Mark label printed
  await supabaseClient.rpc('admin_mark_label_printed', { p_order_id: orderId });

  const cust = order._customer || {};
  const addr = order.delivery_address || {};

  const { data: items } = await supabaseClient.from('order_items').select('*').eq('order_id', orderId);
  const legacyItems = Array.isArray(order.items) ? order.items : [];
  const displayItems = (items && items.length > 0) ? items : legacyItems;

  const total = order.grand_total || order.total_amount || 0;
  const now = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

  const labelHTML = `
    <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:1rem;margin-bottom:1rem">
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;font-family:serif">AURELIUS</div>
      <div style="font-size:11px;letter-spacing:3px;margin-top:4px">DISPATCH LABEL</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
      <div>
        <div style="font-size:10px;letter-spacing:2px;font-weight:700;margin-bottom:4px">ORDER ID</div>
        <div style="font-size:18px;font-weight:700">${order.order_number || orderId.substring(0,8)}</div>
      </div>
      <div>
        <div style="font-size:10px;letter-spacing:2px;font-weight:700;margin-bottom:4px">ORDER DATE</div>
        <div>${new Date(order.created_at).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</div>
      </div>
    </div>

    <div style="border:2px solid #000;padding:1rem;margin-bottom:1.5rem">
      <div style="font-size:10px;letter-spacing:2px;font-weight:700;margin-bottom:0.75rem">SHIP TO</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:4px">${addr.name || cust.name || '—'}</div>
      <div>📞 ${cust.mobile || addr.mobile || '—'}</div>
      <div style="margin-top:0.5rem;line-height:1.8">
        ${addr.house || addr.flat || ''}${addr.house || addr.flat ? '<br>' : ''}
        ${addr.street || addr.locality || ''}${addr.street || addr.locality ? '<br>' : ''}
        ${addr.city || ''}${addr.state ? ', ' + addr.state : ''}<br>
        ${addr.country || 'India'} — PIN: ${addr.pin || addr.pincode || ''}
      </div>
    </div>

    <div style="margin-bottom:1.5rem">
      <div style="font-size:10px;letter-spacing:2px;font-weight:700;margin-bottom:0.75rem;border-bottom:1px solid #000;padding-bottom:0.5rem">ITEMS</div>
      ${displayItems.map(i => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc">
          <div>
            <div style="font-weight:600">${i.product_name_snapshot || i.name || '—'}</div>
            <div style="font-size:11px">${[i.color_snapshot || i.color, i.variant_snapshot || i.size].filter(Boolean).join(' / ')}</div>
          </div>
          <div style="text-align:right">
            <div>Qty: ${i.quantity || 1}</div>
            <div>₹${Number(i.line_total || (i.price * i.quantity) || 0).toFixed(2)}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;border-top:2px solid #000;padding-top:1rem;font-size:18px;font-weight:700">
      <span>TOTAL</span>
      <span>₹${Number(total).toFixed(2)}</span>
    </div>

    <div style="text-align:center;margin-top:1.5rem;font-size:10px;color:#666;border-top:1px solid #ccc;padding-top:1rem">
      Printed: ${now} | Aurelius Atelier Horlogerie | Total Items: ${displayItems.length}
    </div>
  `;

  document.getElementById('dispatch-label-content').innerHTML = labelHTML;
  document.getElementById('orders-list-view').style.display = 'none';
  document.getElementById('order-detail-view').style.display = 'none';
  document.getElementById('dispatch-label-area').style.display = 'block';
  window.scrollTo(0, 0);
  showToast('Label ready to print!', 'success');

  // Update local order record
  const idx = allOrders.findIndex(o => o.id === orderId);
  if (idx >= 0) allOrders[idx].label_printed_at = new Date().toISOString();
}

function closeLabel() {
  document.getElementById('dispatch-label-area').style.display = 'none';
  document.getElementById('orders-list-view').style.display = 'block';
}

// ─── PROMO CODES ─────────────────────────────────────────────
async function loadPromos() {
  const { data, error } = await supabaseClient.from('promo_codes').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error loading promos', 'error'); return; }
  allPromos = data || [];
  renderPromos(allPromos);
}

function renderPromos(list) {
  const tbody = document.getElementById('promos-tbody');
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="admin-table-empty">No promo codes found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => {
    const discStr = p.discount_type === 'fixed' ? fmt(p.discount_value) : p.discount_value + '%';
    const expiry = p.expires_at ? new Date(p.expires_at).toLocaleDateString('en-IN') : '—';
    const usageStr = p.usage_limit ? `${p.usage_count}/${p.usage_limit}` : p.usage_count;
    return `<tr>
      <td><strong style="letter-spacing:1px">${p.code}</strong></td>
      <td>${p.discount_type}</td>
      <td>${discStr}</td>
      <td>${p.min_order_amount ? fmt(p.min_order_amount) : '—'}</td>
      <td>${p.max_discount_amount ? fmt(p.max_discount_amount) : '—'}</td>
      <td>${expiry}</td>
      <td>${usageStr}</td>
      <td><span class="status-badge status-${p.active ? 'active' : 'inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="tbl-btn primary" onclick="editPromo('${p.id}')">Edit</button>
        <button class="tbl-btn" onclick="togglePromo('${p.id}', ${!p.active})">${p.active ? 'Disable' : 'Enable'}</button>
        <button class="tbl-btn danger" onclick="deletePromo('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function openPromoModal(promo = null) {
  document.getElementById('promo-modal-title').textContent = promo ? 'Edit Promo Code' : 'Create Promo Code';
  document.getElementById('promo-id-field').value = promo ? promo.id : '';
  document.getElementById('promo-code').value = promo ? promo.code : '';
  document.getElementById('promo-type').value = promo ? promo.discount_type : 'fixed';
  document.getElementById('promo-value').value = promo ? promo.discount_value : '';
  document.getElementById('promo-min').value = promo ? (promo.min_order_amount || '') : '';
  document.getElementById('promo-max').value = promo ? (promo.max_discount_amount || '') : '';
  document.getElementById('promo-limit').value = promo ? (promo.usage_limit || '') : '';
  document.getElementById('promo-active').value = promo ? (promo.active ? 'true' : 'false') : 'true';
  document.getElementById('promo-error').style.display = 'none';

  if (promo && promo.starts_at) {
    document.getElementById('promo-start').value = new Date(promo.starts_at).toISOString().slice(0,16);
  } else {
    document.getElementById('promo-start').value = '';
  }
  if (promo && promo.expires_at) {
    document.getElementById('promo-expiry').value = new Date(promo.expires_at).toISOString().slice(0,16);
  } else {
    document.getElementById('promo-expiry').value = '';
  }

  updatePromoForm();
  document.getElementById('promo-modal-overlay').style.display = 'flex';
}

function closePromoModal() {
  document.getElementById('promo-modal-overlay').style.display = 'none';
}

function editPromo(id) {
  const p = allPromos.find(x => x.id === id);
  if (p) openPromoModal(p);
}

function updatePromoForm() {
  const type = document.getElementById('promo-type').value;
  document.getElementById('promo-value-label').textContent =
    type === 'fixed' ? 'Discount Value (₹) *' : 'Discount Value (%) *';
  document.getElementById('promo-max-wrap').style.display = type === 'percentage' ? 'block' : 'none';
}

async function savePromo() {
  const id = document.getElementById('promo-id-field').value;
  const code = document.getElementById('promo-code').value.trim().toUpperCase();
  const type = document.getElementById('promo-type').value;
  const value = parseFloat(document.getElementById('promo-value').value);
  const errEl = document.getElementById('promo-error');

  if (!code) { errEl.textContent = 'Promo code is required.'; errEl.style.display = 'block'; return; }
  if (!value || value <= 0) { errEl.textContent = 'Discount value must be positive.'; errEl.style.display = 'block'; return; }
  if (type === 'percentage' && value > 100) { errEl.textContent = 'Percentage cannot exceed 100%.'; errEl.style.display = 'block'; return; }

  const startVal = document.getElementById('promo-start').value;
  const expiryVal = document.getElementById('promo-expiry').value;

  const payload = {
    code,
    discount_type: type,
    discount_value: Math.round(value * 100) / 100,
    min_order_amount: parseFloat(document.getElementById('promo-min').value) || 0,
    max_discount_amount: parseFloat(document.getElementById('promo-max').value) || null,
    starts_at: startVal ? new Date(startVal).toISOString() : new Date().toISOString(),
    expires_at: expiryVal ? new Date(expiryVal).toISOString() : null,
    usage_limit: parseInt(document.getElementById('promo-limit').value) || null,
    active: document.getElementById('promo-active').value === 'true',
    updated_at: new Date().toISOString()
  };

  const btn = document.getElementById('save-promo-btn');
  btn.textContent = 'Saving...'; btn.disabled = true;

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('promo_codes').update(payload).eq('id', id));
  } else {
    payload.usage_count = 0;
    payload.created_at = new Date().toISOString();
    ({ error } = await supabaseClient.from('promo_codes').insert([payload]));
  }

  btn.textContent = 'Save Promo Code'; btn.disabled = false;

  if (error) {
    errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'block';
  } else {
    showToast(id ? 'Promo updated!' : 'Promo created!', 'success');
    closePromoModal();
    await loadPromos();
  }
}

async function togglePromo(id, makeActive) {
  const { error } = await supabaseClient.from('promo_codes').update({ active: makeActive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast(makeActive ? 'Promo enabled' : 'Promo disabled', 'success');
  await loadPromos();
}

async function deletePromo(id) {
  openConfirm('Delete Promo Code', 'Are you sure you want to delete this promo code?', async () => {
    const { error } = await supabaseClient.from('promo_codes').delete().eq('id', id);
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    showToast('Promo deleted', 'success');
    await loadPromos();
  });
}

// ─── CUSTOMERS ───────────────────────────────────────────────
async function loadCustomers() {
  const { data, error } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error loading customers', 'error'); return; }
  allCustomers = data || [];

  // Get order counts per customer
  const { data: orderCounts } = await supabaseClient.from('orders').select('customer_id');
  const countMap = {};
  (orderCounts || []).forEach(o => { countMap[o.customer_id] = (countMap[o.customer_id] || 0) + 1; });
  allCustomers.forEach(c => { c._orderCount = countMap[c.id] || 0; });

  renderCustomers(allCustomers);
}

function renderCustomers(list) {
  const tbody = document.getElementById('customers-tbody');
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty">No customers found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `<tr>
    <td><strong>${c.name || '—'}</strong></td>
    <td>${c.email || '—'}</td>
    <td>${c.mobile || '—'}</td>
    <td><span style="font-size:11px;color:var(--color-tertiary)">${c.user_id || c.id?.substring(0,12) || '—'}</span></td>
    <td>${c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</td>
    <td><span class="status-badge status-active">${c._orderCount} orders</span></td>
  </tr>`).join('');
}

function filterCustomers() {
  const q = document.getElementById('customer-search').value.toLowerCase();
  const list = allCustomers.filter(c =>
    !q ||
    (c.name || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.mobile || '').toLowerCase().includes(q)
  );
  renderCustomers(list);
}

// ─── UTILS ───────────────────────────────────────────────────

function showToast(msg, type = 'success') {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.style.background = type === 'error' ? 'var(--color-error)' : 'var(--color-primary)';
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// ─── PAYMENT CONFIGURATION ───────────────────────────────────

async function loadPaymentConfig() {
  try {
    const { data, error } = await supabaseClient.functions.invoke('payment-handler', {
      body: { action: 'get-admin-config' }
    });
    if (error || !data) return;

    let hasGatewayEnabled = false;

    data.forEach(config => {
      const gw = config.gateway;
      if (gw === 'razorpay' || gw === 'cashfree') {
        const enabled = config.enabled;
        if (enabled) hasGatewayEnabled = true;
        
        document.getElementById(`config-enable-${gw}`).checked = enabled;
        document.querySelector(`input[name="${gw === 'razorpay' ? 'rzp_env' : 'cf_env'}"][value="${config.environment}"]`).checked = true;
        
        if (config.public_key) {
          document.getElementById(gw === 'razorpay' ? 'rzp_key_id' : 'cf_client_id').value = config.public_key;
        }
        if (config.secret_key) {
          // If secret exists, show placeholder mask
          document.getElementById(gw === 'razorpay' ? 'rzp_key_secret' : 'cf_secret_key').value = '••••••••••••••••';
        }

        const badge = document.getElementById(`status-badge-${gw}`);
        if (config.public_key && config.secret_key) {
          badge.textContent = enabled ? 'Configured & Enabled' : 'Configured (Disabled)';
          badge.style.background = enabled ? '#dcfce7' : '#f3f4f6';
          badge.style.color = enabled ? '#166534' : '#374151';
        }
      }
    });

    document.getElementById('config-enable-none').checked = !hasGatewayEnabled;
    toggleConfigForm('razorpay');
    toggleConfigForm('cashfree');
  } catch (err) {
    console.error("Failed to load payment config", err);
  }
}

function toggleConfigForm(gateway) {
  const isEnabled = document.getElementById(`config-enable-${gateway}`).checked;
  const block = document.getElementById(`config-block-${gateway}`);
  
  // Show block if enabled OR if it has a public key (meaning it's configured, so admin can edit it)
  const isConfigured = document.getElementById(gateway === 'razorpay' ? 'rzp_key_id' : 'cf_client_id').value.length > 0;
  
  if (isEnabled || isConfigured) {
    block.style.display = 'block';
  } else {
    block.style.display = 'none';
  }

  if (isEnabled) {
    document.getElementById('config-enable-none').checked = false;
  }
}

function toggleConfigNone() {
  const isNone = document.getElementById('config-enable-none').checked;
  if (isNone) {
    document.getElementById('config-enable-razorpay').checked = false;
    document.getElementById('config-enable-cashfree').checked = false;
    toggleConfigForm('razorpay');
    toggleConfigForm('cashfree');
    
    // Auto save the none state
    saveGatewayConfig('razorpay', true);
    saveGatewayConfig('cashfree', true);
  }
}

async function saveGatewayConfig(gateway, skipConfirmation = false) {
  const enabled = document.getElementById(`config-enable-${gateway}`).checked;
  const environment = document.querySelector(`input[name="${gateway === 'razorpay' ? 'rzp_env' : 'cf_env'}"]:checked`).value;
  const publicKey = document.getElementById(gateway === 'razorpay' ? 'rzp_key_id' : 'cf_client_id').value.trim();
  const secretKey = document.getElementById(gateway === 'razorpay' ? 'rzp_key_secret' : 'cf_secret_key').value.trim();

  if (enabled && (!publicKey || !secretKey || secretKey === '••••••••••••••••')) {
    // If it's enabling, make sure a real secret exists on server
    const currentBadge = document.getElementById(`status-badge-${gateway}`).textContent;
    if (!currentBadge.includes('Configured')) {
      showToast(`Cannot enable ${gateway}. Missing credentials.`, 'error');
      document.getElementById(`config-enable-${gateway}`).checked = false;
      return;
    }
  }

  if (!skipConfirmation && environment === 'live') {
    // Check if confirm modal is available
    if (typeof openConfirm === 'function') {
      openConfirm('Switch to Live', `You are switching ${gateway} to LIVE/PRODUCTION mode. Real customer payments may be processed. Are you sure?`, async () => {
        await executeSaveConfig(gateway, enabled, environment, publicKey, secretKey);
      }, true);
    } else {
      if(confirm(`You are switching ${gateway} to LIVE/PRODUCTION mode. Real customer payments may be processed. Are you sure?`)) {
        await executeSaveConfig(gateway, enabled, environment, publicKey, secretKey);
      }
    }
  } else {
    await executeSaveConfig(gateway, enabled, environment, publicKey, secretKey);
  }
}

async function executeSaveConfig(gateway, enabled, environment, publicKey, secretKey) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('payment-handler', {
      body: { 
        action: 'save-config', 
        gateway_name: gateway, 
        enabled, 
        environment, 
        public_key: publicKey, 
        secret_key: secretKey 
      }
    });

    if (error || !data.success) throw new Error(error?.message || "Failed to save");
    
    showToast(`${gateway} configuration saved successfully!`);
    loadPaymentConfig();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function testGatewayConnection(gateway) {
  const resultDiv = document.getElementById(`test-result-${gateway}`);
  resultDiv.style.color = 'var(--color-tertiary)';
  resultDiv.textContent = 'Testing connection...';

  const environment = document.querySelector(`input[name="${gateway === 'razorpay' ? 'rzp_env' : 'cf_env'}"]:checked`).value;
  const publicKey = document.getElementById(gateway === 'razorpay' ? 'rzp_key_id' : 'cf_client_id').value.trim();
  const secretKey = document.getElementById(gateway === 'razorpay' ? 'rzp_key_secret' : 'cf_secret_key').value.trim();

  try {
    const { data, error } = await supabaseClient.functions.invoke('payment-handler', {
      body: { 
        action: 'test-connection', 
        gateway_name: gateway, 
        environment, 
        public_key: publicKey, 
        secret_key: secretKey 
      }
    });

    if (error) throw error;
    
    resultDiv.style.color = '#166534';
    resultDiv.textContent = '✓ Connection successful';
  } catch (err) {
    resultDiv.style.color = 'var(--color-error)';
    resultDiv.textContent = `✕ Connection failed: ${err.message.replace('Edge Function returned a non-2xx status code', 'Invalid Credentials')}`;
  }
}
\n
// =========================================
// ADMIN RESPONSIVE SIDEBAR
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  const adminMobileToggle = document.getElementById('admin-mobile-toggle');
  const adminSidebar = document.querySelector('.admin-sidebar');
  
  if (adminMobileToggle && adminSidebar) {
    adminMobileToggle.addEventListener('click', () => {
      adminSidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && adminSidebar.classList.contains('open')) {
        if (!adminSidebar.contains(e.target) && !adminMobileToggle.contains(e.target) && !e.target.closest('.admin-mobile-header')) {
          adminSidebar.classList.remove('open');
        }
      }
    });
    
    // Close sidebar when clicking a nav item on mobile
    const navItems = adminSidebar.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          adminSidebar.classList.remove('open');
        }
      });
    });
  }
});
