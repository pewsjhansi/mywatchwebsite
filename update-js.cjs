const fs = require('fs');

const appJsUpdates = `
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
`;

const adminJsUpdates = `
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
`;

if (fs.existsSync('app.js')) {
  let content = fs.readFileSync('app.js', 'utf8');
  if (!content.includes('RESPONSIVE MOBILE MENU')) {
    fs.appendFileSync('app.js', '\\n' + appJsUpdates);
    console.log('Appended to app.js');
  }
}

if (fs.existsSync('admin.js')) {
  let content = fs.readFileSync('admin.js', 'utf8');
  if (!content.includes('ADMIN RESPONSIVE SIDEBAR')) {
    fs.appendFileSync('admin.js', '\\n' + adminJsUpdates);
    console.log('Appended to admin.js');
  }
}
