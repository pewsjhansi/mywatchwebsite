const fs = require('fs');

let html = fs.readFileSync('dashboard.html', 'utf8');

// 1. Edit profile button
html = html.replace('<button class="btn-secondary">Edit Profile</button>', '<button class="btn-secondary" onclick="toggleEditProfile()" id="edit-profile-btn">Edit Profile</button>');

// 2. Profile Info view/edit blocks
html = html.replace(
  '<div class="dashboard-card" style="margin-bottom:2rem;">\r\n            <div class="technical-mono" style="color:var(--color-tertiary); margin-bottom:1.5rem;" id="dash-userid">User ID: WF-XXXXXX</div>\r\n            \r\n            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">\r\n              <div>\r\n                <label class="label-caps" style="color:var(--color-tertiary);">Name</label>\r\n                <div class="body-md" id="dash-info-name">John Doe</div>\r\n              </div>\r\n              <div>\r\n                <label class="label-caps" style="color:var(--color-tertiary);">Email</label>\r\n                <div class="body-md" id="dash-info-email">john@example.com</div>\r\n              </div>\r\n              <div>\r\n                <label class="label-caps" style="color:var(--color-tertiary);">Mobile</label>\r\n                <div class="body-md" id="dash-info-mobile">+91 98765 43210</div>\r\n              </div>\r\n              <div>\r\n                <label class="label-caps" style="color:var(--color-tertiary);">Gender</label>\r\n                <div class="body-md">Not Specified</div>\r\n              </div>\r\n              <div>\r\n                <label class="label-caps" style="color:var(--color-tertiary);">Occupation</label>\r\n                <div class="body-md">Not Specified</div>\r\n              </div>\r\n            </div>\r\n          </div>',
  `<div class="dashboard-card" style="margin-bottom:2rem;" id="profile-view">
            <div class="technical-mono" style="color:var(--color-tertiary); margin-bottom:1.5rem;" id="dash-userid">User ID: Loading...</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
              <div>
                <label class="label-caps" style="color:var(--color-tertiary);">Name</label>
                <div class="body-md" id="dash-info-name">Loading...</div>
              </div>
              <div>
                <label class="label-caps" style="color:var(--color-tertiary);">Email</label>
                <div class="body-md" id="dash-info-email">Loading...</div>
              </div>
              <div>
                <label class="label-caps" style="color:var(--color-tertiary);">Mobile</label>
                <div class="body-md" id="dash-info-mobile">Loading...</div>
              </div>
            </div>
          </div>
          
          <div class="dashboard-card" style="margin-bottom:2rem; display:none;" id="profile-edit">
            <h3 class="title-md" style="margin-bottom: 1.5rem;">Edit Profile</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="label-caps" style="color:var(--color-tertiary);">Name</label>
                <input type="text" id="edit-name" class="form-input" style="padding: 5px 0;">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="label-caps" style="color:var(--color-tertiary);">Mobile</label>
                <input type="text" id="edit-mobile" class="form-input" style="padding: 5px 0;">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="label-caps" style="color:var(--color-tertiary);">Email (Read Only)</label>
                <input type="email" id="edit-email" class="form-input" style="padding: 5px 0;" disabled>
              </div>
            </div>
            <div id="edit-error" class="auth-error" style="margin-bottom: 1rem;"></div>
            <button class="btn-primary" onclick="saveProfile()" id="save-profile-btn">Save Changes</button>
            <button class="btn-secondary" onclick="toggleEditProfile()">Cancel</button>
          </div>`
);

// 3. Script functionality
const oldScriptStart = `  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Protect route
      const auth = JSON.parse(localStorage.getItem('luxuryUserAuth'));
      if (!auth) {
        window.location.href = 'index.html';
        return;
      }
      
      // Populate dashboard
      document.getElementById('dash-userid').textContent = 'User ID: ' + auth.userId;
      document.getElementById('dash-info-name').textContent = auth.name;
      document.getElementById('dash-info-email').textContent = auth.email;
      document.getElementById('dash-info-mobile').textContent = auth.mobile;`;
      
const newScriptStart = `  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = 'index.html';
        return;
      }
      
      const { data: profile } = await supabase.from('customers').select('*').eq('id', session.user.id).single();
      
      if (profile) {
        window.currentProfile = profile;
        document.getElementById('dash-userid').textContent = 'User ID: ' + profile.user_id;
        document.getElementById('dash-info-name').textContent = profile.name || 'Not provided';
        document.getElementById('dash-info-email').textContent = profile.email || 'Not provided';
        document.getElementById('dash-info-mobile').textContent = profile.mobile || 'Not provided';
      }
      
      // Define missing auth var for orders rendering
      const auth = { userId: profile ? profile.user_id : session.user.id };
      `;

html = html.replace(oldScriptStart, newScriptStart);

const oldScriptEnd = `    });
    
    function handleDeleteAccount() {
      if(confirm("WARNING: Account deletion is permanent. Are you sure you want to proceed?")) {
        const otp = prompt("Secure Verification required. Please enter your 6-digit OTP (hint: 111111):");
        if (otp === '111111') {
          alert("Account successfully deleted.");
          localStorage.removeItem('luxuryUserAuth');
          window.location.href = 'index.html';
        } else {
          alert("Authentication failed. Account deletion cancelled.");
        }
      }
    }
  </script>`;

const newScriptEnd = `    });
    
    function toggleEditProfile() {
      const view = document.getElementById('profile-view');
      const edit = document.getElementById('profile-edit');
      const btn = document.getElementById('edit-profile-btn');
      
      if (edit.style.display === 'none') {
        view.style.display = 'none';
        edit.style.display = 'block';
        btn.style.display = 'none';
        
        if (window.currentProfile) {
          document.getElementById('edit-name').value = window.currentProfile.name || '';
          document.getElementById('edit-mobile').value = window.currentProfile.mobile || '';
          document.getElementById('edit-email').value = window.currentProfile.email || '';
        }
      } else {
        view.style.display = 'block';
        edit.style.display = 'none';
        btn.style.display = 'block';
      }
    }
    
    async function saveProfile() {
      const btn = document.getElementById('save-profile-btn');
      const errorMsg = document.getElementById('edit-error');
      
      const newName = document.getElementById('edit-name').value;
      const newMobile = document.getElementById('edit-mobile').value;
      
      btn.textContent = 'Saving...';
      btn.disabled = true;
      errorMsg.style.display = 'none';
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('customers')
        .update({ name: newName, mobile: newMobile })
        .eq('id', session.user.id);
        
      if (error) {
        errorMsg.textContent = 'Unable to save your changes. Please try again.';
        errorMsg.style.display = 'block';
        btn.textContent = 'Save Changes';
        btn.disabled = false;
      } else {
        document.getElementById('dash-info-name').textContent = newName || 'Not provided';
        document.getElementById('dash-info-mobile').textContent = newMobile || 'Not provided';
        window.currentProfile.name = newName;
        window.currentProfile.mobile = newMobile;
        
        btn.textContent = 'Save Changes';
        btn.disabled = false;
        toggleEditProfile();
        
        // This re-triggers header update via app.js
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
      }
    }
    
    function handleDeleteAccount() {
      alert("Please contact support to permanently delete your account.");
    }
  </script>`;

html = html.replace(oldScriptEnd, newScriptEnd);

fs.writeFileSync('dashboard.html', html);
console.log('Done replacing');
