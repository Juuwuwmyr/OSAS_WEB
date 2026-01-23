<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!-- SETTINGS PANEL -->
<div class="settings-panel-container" id="settingsPanel">
  <div class="settings-panel-header">
    <div class="settings-panel-title">
      <i class='bx bx-cog'></i>
      <h3>Settings</h3>
    </div>
    <button class="settings-panel-close" id="closeSettingsPanel">
      <i class='bx bx-x'></i>
    </button>
  </div>

  <div class="settings-panel-content">
    <!-- User Settings Section -->
    <div class="settings-section">
      <h4 class="settings-section-title">
        <i class='bx bx-user'></i>
        User Settings
      </h4>
      
      <div class="setting-item">
        <div class="setting-info">
          <label>Display Name</label>
          <span>How your name appears in the system</span>
        </div>
        <div class="setting-control">
          <input type="text" class="setting-input" id="userDisplayName" placeholder="<?= htmlspecialchars($_SESSION['username'] ?? 'Admin') ?>">
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label>Email Notifications</label>
          <span>Receive email updates and alerts</span>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" id="emailNotifications" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label>Language</label>
          <span>Preferred system language</span>
        </div>
        <div class="setting-control">
          <select class="setting-select" id="userLanguage">
            <option value="en" selected>English</option>
            <option value="tl">Filipino</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Appearance Section -->
    <div class="settings-section">
      <h4 class="settings-section-title">
        <i class='bx bx-palette'></i>
        Appearance
      </h4>
      
      <div class="setting-item">
        <div class="setting-info">
          <label>Theme</label>
          <span>Choose your preferred theme</span>
        </div>
        <div class="setting-control">
          <select class="setting-select" id="userTheme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label>Compact View</label>
          <span>Show more content with less spacing</span>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" id="compactView">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Privacy Section -->
    <div class="settings-section">
      <h4 class="settings-section-title">
        <i class='bx bx-lock'></i>
        Privacy
      </h4>
      
      <div class="setting-item">
        <div class="setting-info">
          <label>Profile Visibility</label>
          <span>Who can see your profile information</span>
        </div>
        <div class="setting-control">
          <select class="setting-select" id="profileVisibility">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="admin">Admin Only</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label>Activity Status</label>
          <span>Show when you're online</span>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" id="activityStatus" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- System Section -->
    <div class="settings-section">
      <h4 class="settings-section-title">
        <i class='bx bx-server'></i>
        System
      </h4>
      
      <div class="setting-item">
        <div class="setting-info">
          <label>Auto-save</label>
          <span>Automatically save your work</span>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" id="autoSave" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label>Page Size</label>
          <span>Items per page in tables</span>
        </div>
        <div class="setting-control">
          <select class="setting-select" id="pageSize">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="settings-panel-footer">
    <button class="btn-secondary" id="resetSettings">
      <i class='bx bx-reset'></i>
      Reset
    </button>
    <button class="btn-primary" id="saveSettings">
      <i class='bx bx-save'></i>
      Save Changes
    </button>
  </div>
</div>

<style>
/* Settings Panel Styles */
.settings-panel-container {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 380px;
  max-height: calc(100vh - 120px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: none;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--grey);
}

.settings-panel-container.show {
  display: flex;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.settings-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--grey);
  background: var(--light);
}

.settings-panel-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-panel-title i {
  font-size: 1.5rem;
  color: var(--gold);
}

.settings-panel-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--dark);
}

.settings-panel-close {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  color: var(--dark-grey);
  transition: all 0.3s ease;
}

.settings-panel-close:hover {
  background: var(--grey);
  color: var(--dark);
}

.settings-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dark-grey);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-section-title i {
  font-size: 1rem;
  color: var(--gold);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--grey);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-info label {
  display: block;
  font-weight: 500;
  color: var(--dark);
  margin-bottom: 0.25rem;
}

.setting-info span {
  display: block;
  font-size: 0.875rem;
  color: var(--dark-grey);
}

.setting-control {
  min-width: 120px;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--grey);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  background: white;
  color: var(--dark);
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(255, 198, 0, 0.1);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--gold);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.settings-panel-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--grey);
  background: var(--light);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--gold);
  color: var(--dark);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--grey);
  color: var(--dark);
}

.btn-secondary:hover {
  background: var(--dark-grey);
  color: white;
}

/* Dark Mode */
body.dark .settings-panel-container {
  background: var(--dark);
  border-color: var(--border);
}

body.dark .settings-panel-header,
body.dark .settings-panel-footer {
  background: var(--dark-grey);
  border-color: var(--border);
}

body.dark .settings-panel-title h3,
body.dark .setting-info label {
  color: var(--light);
}

body.dark .setting-info span {
  color: var(--grey);
}

body.dark .setting-item {
  border-color: var(--border);
}

body.dark .setting-input,
body.dark .setting-select {
  background: var(--dark-grey);
  border-color: var(--border);
  color: var(--light);
}

body.dark .toggle-slider {
  background-color: var(--border);
}

body.dark .btn-secondary {
  background: var(--border);
  color: var(--light);
}

body.dark .btn-secondary:hover {
  background: var(--grey);
}

/* Responsive */
@media (max-width: 768px) {
  .settings-panel-container {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: calc(100vh - 60px);
    border-radius: 0;
  }
  
  .settings-panel-content {
    padding: 1rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .setting-control {
    width: 100%;
  }
}
</style>

<script>
// Settings Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const settingsPanel = document.getElementById('settingsPanel');
  const closeBtn = document.getElementById('closeSettingsPanel');
  const saveBtn = document.getElementById('saveSettings');
  const resetBtn = document.getElementById('resetSettings');

  // Close panel
  closeBtn.addEventListener('click', function() {
    settingsPanel.classList.remove('show');
  });

  // Save settings
  saveBtn.addEventListener('click', function() {
    // Collect settings
    const settings = {
      displayName: document.getElementById('userDisplayName').value,
      emailNotifications: document.getElementById('emailNotifications').checked,
      language: document.getElementById('userLanguage').value,
      theme: document.getElementById('userTheme').value,
      compactView: document.getElementById('compactView').checked,
      profileVisibility: document.getElementById('profileVisibility').value,
      activityStatus: document.getElementById('activityStatus').checked,
      autoSave: document.getElementById('autoSave').checked,
      pageSize: document.getElementById('pageSize').value
    };

    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Show success message
    showNotification('Settings saved successfully!', 'success');
    
    // Apply theme if changed
    if (settings.theme) {
      applyTheme(settings.theme);
    }
  });

  // Reset settings
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      localStorage.removeItem('userSettings');
      loadDefaultSettings();
      showNotification('Settings reset to defaults', 'info');
    }
  });

  // Load saved settings
  loadSavedSettings();
});

function loadSavedSettings() {
  const saved = localStorage.getItem('userSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    
    // Apply saved values
    if (settings.displayName) document.getElementById('userDisplayName').value = settings.displayName;
    if (settings.emailNotifications !== undefined) document.getElementById('emailNotifications').checked = settings.emailNotifications;
    if (settings.language) document.getElementById('userLanguage').value = settings.language;
    if (settings.theme) document.getElementById('userTheme').value = settings.theme;
    if (settings.compactView !== undefined) document.getElementById('compactView').checked = settings.compactView;
    if (settings.profileVisibility) document.getElementById('profileVisibility').value = settings.profileVisibility;
    if (settings.activityStatus !== undefined) document.getElementById('activityStatus').checked = settings.activityStatus;
    if (settings.autoSave !== undefined) document.getElementById('autoSave').checked = settings.autoSave;
    if (settings.pageSize) document.getElementById('pageSize').value = settings.pageSize;
  }
}

function loadDefaultSettings() {
  document.getElementById('userDisplayName').value = '<?= htmlspecialchars($_SESSION['username'] ?? 'Admin') ?>';
  document.getElementById('emailNotifications').checked = true;
  document.getElementById('userLanguage').value = 'en';
  document.getElementById('userTheme').value = 'light';
  document.getElementById('compactView').checked = false;
  document.getElementById('profileVisibility').value = 'public';
  document.getElementById('activityStatus').checked = true;
  document.getElementById('autoSave').checked = true;
  document.getElementById('pageSize').value = '10';
}

function applyTheme(theme) {
  // Apply theme logic
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else if (theme === 'light') {
    document.body.classList.remove('dark');
  } else {
    // Auto - check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class='bx bx-${type === 'success' ? 'check-circle' : 'info-circle'}'></i>
    <span>${message}</span>
  `;
  
  // Style notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--gold)' : 'var(--grey)'};
    color: ${type === 'success' ? 'var(--dark)' : 'var(--light)'};
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
</script>
