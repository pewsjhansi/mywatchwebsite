const fs = require('fs');

const indexCssUpdates = `
/* =========================================
   RESPONSIVE OVERRIDES
   ========================================= */
@media (max-width: 1024px) {
  /* Tablet Adjustments */
  .display-lg { font-size: 48px; line-height: 56px; }
  .headline-lg { font-size: 36px; line-height: 44px; }
  .pdp-layout { grid-template-columns: 1fr; gap: 2rem; }
  .dashboard-layout { grid-template-columns: 200px 1fr; gap: 2rem; }
  .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 3rem; }
}

@media (max-width: 768px) {
  /* Global Typography & Spacing */
  .display-lg { font-size: 36px; line-height: 44px; }
  .headline-lg { font-size: 28px; line-height: 36px; }
  .headline-md { font-size: 24px; line-height: 32px; }
  .section-padding { padding: 3rem 0; }
  .section-header { margin-bottom: 2rem; }

  /* Navigation Drawer */
  .mobile-menu-btn { display: block !important; }
  .nav-actions { gap: 1rem; }
  .nav-actions .auth-trigger, .nav-actions .label-caps {
    display: none !important;
  }

  .nav-links {
    position: fixed;
    top: 80px;
    left: -100%;
    width: 280px;
    height: calc(100vh - 80px);
    background: var(--color-canvas);
    flex-direction: column;
    padding: 2rem;
    gap: 1.5rem;
    transition: left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0);
    border-right: 1px solid var(--color-divider);
    z-index: 99;
  }
  .nav-links.open { left: 0; box-shadow: var(--shadow-subtle); }

  /* Injecting Auth into mobile drawer (via JS) */
  .nav-links-auth-mobile {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-divider);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Hero Section */
  .hero { height: 60vh; }
  .hero-content { padding: 1.5rem; }
  .hero-title { margin-bottom: 1.5rem; }
  
  /* Product Grid */
  .product-grid { grid-template-columns: repeat(2, 1fr); }
  .product-card { padding: 1rem; }
  
  /* Cart Drawer */
  .cart-drawer { width: 100%; }
  
  /* Footer */
  .footer-grid { grid-template-columns: 1fr; gap: 2rem; text-align: center; }

  /* Auth Modal */
  .auth-modal { max-width: 90%; padding: 2rem 1.5rem; }

  /* Checkout */
  .checkout-layout { display: flex; flex-direction: column-reverse; gap: 2rem; }
  .checkout-form-container, .checkout-summary-container { width: 100%; padding: 0; }
  .form-row-2 { grid-template-columns: 1fr; }

  /* Product Details */
  .pdp-main-img { max-height: 50vh; }

  /* Dashboard */
  .dashboard-layout { grid-template-columns: 1fr; gap: 1.5rem; padding: 2rem 0; }
  .dashboard-sidebar { border-right: none; border-bottom: 1px solid var(--color-divider); padding-right: 0; padding-bottom: 1.5rem; }
  .dashboard-menu { display: flex; overflow-x: auto; gap: 1rem; white-space: nowrap; padding-bottom: 0.5rem; }
  .dashboard-menu a { padding: 0.5rem 0; }
  .dashboard-cards { grid-template-columns: 1fr; }
  .dashboard-content-header { margin-bottom: 1.5rem; }
}

@media (max-width: 480px) {
  /* Smaller Phones */
  .product-grid { grid-template-columns: 1fr; }
  .btn-primary, .btn-secondary { padding: 14px 24px; font-size: 10px; width: 100%; text-align: center; display: block; }
  .hero { height: 50vh; }
  .display-lg { font-size: 32px; line-height: 40px; }
  .otp-container { gap: 0.25rem; }
  .otp-input { width: 35px; height: 45px; font-size: 18px; }
}
`;

const adminCssUpdates = `
/* =========================================
   ADMIN RESPONSIVE OVERRIDES
   ========================================= */
@media (max-width: 1024px) {
  .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .order-detail-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .admin-sidebar { 
    transform: translateX(-100%); 
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.0);
    box-shadow: 4px 0 24px rgba(0,0,0,0.1);
  }
  .admin-sidebar.open { transform: translateX(0); }
  .admin-main { margin-left: 0; padding: 1.5rem; }
  
  .admin-mobile-header { display: flex !important; }
  .admin-brand { display: none; } /* Hide sidebar brand on mobile, header replaces it */
  
  .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
  .admin-section-header { flex-direction: column; align-items: stretch; }
  .admin-toolbar { flex-direction: column; }
  
  .admin-table-wrap { width: 100%; overflow-x: auto; }
  
  /* Modal responsive */
  .modal-content { max-width: 95%; margin: 1rem; }
  .modal-body { padding: 1.5rem; }
  
  /* Cards */
  .admin-stats-grid { grid-template-columns: 1fr; }
  .admin-card { padding: 1.25rem; }
}
`;

if (fs.existsSync('index.css')) {
  let content = fs.readFileSync('index.css', 'utf8');
  if (!content.includes('RESPONSIVE OVERRIDES')) {
    fs.appendFileSync('index.css', '\\n' + indexCssUpdates);
    console.log('Appended to index.css');
  }
}

if (fs.existsSync('admin.css')) {
  let content = fs.readFileSync('admin.css', 'utf8');
  if (!content.includes('ADMIN RESPONSIVE OVERRIDES')) {
    fs.appendFileSync('admin.css', '\\n' + adminCssUpdates);
    console.log('Appended to admin.css');
  }
}
