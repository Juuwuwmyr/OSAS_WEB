<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings | OSAS System</title>
  <link href='https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css' rel='stylesheet'>
  <link rel="stylesheet" href="<?= View::asset('styles/settings.css') ?>">
</head>
<body>
  
<main id="settings-page">
  <!-- HEADER -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage system configuration and preferences</p>
      </div>
      <div class="breadcrumb-wrapper">
        <div class="breadcrumb">
          <a href="#" class="breadcrumb-item">Dashboard</a>
          <i class='bx bx-chevron-right'></i>
          <span class="breadcrumb-item active">Settings</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SETTINGS NAVIGATION -->
  <div class="settings-nav">
    <div class="settings-tabs">
      <button class="settings-tab active" data-tab="general">
        <i class='bx bx-cog'></i>
        <span>General</span>
      </button>
      <button class="settings-tab" data-tab="notifications">
        <i class='bx bx-bell'></i>
        <span>Notifications</span>
      </button>
      <button class="settings-tab" data-tab="violations">
        <i class='bx bx-shield-quarter'></i>
        <span>Violations</span>
      </button>
      <button class="settings-tab" data-tab="reports">
        <i class='bx bx-bar-chart-alt'></i>
        <span>Reports</span>
      </button>
      <button class="settings-tab" data-tab="security">
        <i class='bx bx-lock'></i>
        <span>Security</span>
      </button>
      <button class="settings-tab" data-tab="system">
        <i class='bx bx-server'></i>
        <span>System</span>
      </button>
      <button class="settings-tab" data-tab="appearance">
        <i class='bx bx-palette'></i>
        <span>Appearance</span>
      </button>
    </div>
  </div>

  <!-- SETTINGS CONTENT -->
  <div class="settings-content">
    
    <!-- GENERAL SETTINGS -->
    <div class="settings-panel active" id="panel-general">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-cog'></i> General Settings</h3>
          <p>Configure basic system information and preferences</p>
        </div>

        <div class="settings-section">
          <h4>System Information</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>System Name</label>
              <span>Display name for the OSAS system</span>
            </div>
            <div class="setting-control">
              <input type="text" class="setting-input" id="setting-system_name" data-key="system_name" placeholder="OSAS System">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>System Email</label>
              <span>Email address for system notifications</span>
            </div>
            <div class="setting-control">
              <input type="email" class="setting-input" id="setting-system_email" data-key="system_email" placeholder="osas@school.edu">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>System Phone</label>
              <span>Contact phone number</span>
            </div>
            <div class="setting-control">
              <input type="tel" class="setting-input" id="setting-system_phone" data-key="system_phone" placeholder="+63 912 345 6789">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>System Address</label>
              <span>Physical address of the institution</span>
            </div>
            <div class="setting-control">
              <input type="text" class="setting-input" id="setting-system_address" data-key="system_address" placeholder="School Address">
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Date & Time</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Timezone</label>
              <span>System timezone</span>
            </div>
            <div class="setting-control">
              <select class="setting-select" id="setting-timezone" data-key="timezone">
                <option value="Asia/Manila">Asia/Manila (Philippines)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Date Format</label>
              <span>Format for displaying dates</span>
            </div>
            <div class="setting-control">
              <select class="setting-select" id="setting-date_format" data-key="date_format">
                <option value="Y-m-d">YYYY-MM-DD</option>
                <option value="m/d/Y">MM/DD/YYYY</option>
                <option value="d/m/Y">DD/MM/YYYY</option>
                <option value="M d, Y">Jan 01, 2024</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Time Format</label>
              <span>Format for displaying time</span>
            </div>
            <div class="setting-control">
              <select class="setting-select" id="setting-time_format" data-key="time_format">
                <option value="H:i:s">24-hour (HH:MM:SS)</option>
                <option value="h:i:s A">12-hour (HH:MM:SS AM/PM)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Display</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Items Per Page</label>
              <span>Number of items displayed per page in tables</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-items_per_page" data-key="items_per_page" min="5" max="100" value="10">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NOTIFICATIONS SETTINGS -->
    <div class="settings-panel" id="panel-notifications">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-bell'></i> Notification Settings</h3>
          <p>Configure notification preferences</p>
        </div>

        <div class="settings-section">
          <h4>Notification Channels</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Enable Notifications</label>
              <span>Enable or disable all system notifications</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-enable_notifications" data-key="enable_notifications">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-enable_notifications">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Email Notifications</label>
              <span>Send notifications via email</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-email_notifications" data-key="email_notifications">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-email_notifications">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>SMS Notifications</label>
              <span>Send notifications via SMS (requires SMS gateway)</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-sms_notifications" data-key="sms_notifications">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-sms_notifications">Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIOLATIONS SETTINGS -->
    <div class="settings-panel" id="panel-violations">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-shield-quarter'></i> Violation Settings</h3>
          <p>Configure violation tracking and escalation rules</p>
        </div>

        <div class="settings-section">
          <h4>Violation Rules</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Auto Escalate Violations</label>
              <span>Automatically escalate violations after reaching warning limit</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-violation_auto_escalate" data-key="violation_auto_escalate">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-violation_auto_escalate">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Warning Limit</label>
              <span>Number of warnings before disciplinary action</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-violation_warning_limit" data-key="violation_warning_limit" min="1" max="10" value="3">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Reminder Days</label>
              <span>Days before sending violation reminder</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-violation_reminder_days" data-key="violation_reminder_days" min="1" max="30" value="7">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- REPORTS SETTINGS -->
    <div class="settings-panel" id="panel-reports">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-bar-chart-alt'></i> Report Settings</h3>
          <p>Configure report generation and retention</p>
        </div>

        <div class="settings-section">
          <h4>Report Generation</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Auto Generate Reports</label>
              <span>Automatically generate reports daily</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-report_auto_generate" data-key="report_auto_generate">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-report_auto_generate">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Report Retention (Days)</label>
              <span>Number of days to retain reports before auto-deletion</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-report_retention_days" data-key="report_retention_days" min="30" max="3650" value="365">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECURITY SETTINGS -->
    <div class="settings-panel" id="panel-security">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-lock'></i> Security Settings</h3>
          <p>Configure security and authentication settings</p>
        </div>

        <div class="settings-section">
          <h4>Session Management</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Session Timeout (Minutes)</label>
              <span>Automatic logout after inactivity</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-session_timeout" data-key="session_timeout" min="5" max="1440" value="30">
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Password Policy</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Minimum Password Length</label>
              <span>Minimum number of characters required</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-password_min_length" data-key="password_min_length" min="6" max="32" value="8">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Require Uppercase</label>
              <span>Password must contain uppercase letter</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-password_require_uppercase" data-key="password_require_uppercase">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-password_require_uppercase">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Require Lowercase</label>
              <span>Password must contain lowercase letter</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-password_require_lowercase" data-key="password_require_lowercase">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-password_require_lowercase">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Require Number</label>
              <span>Password must contain a number</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-password_require_number" data-key="password_require_number">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-password_require_number">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Require Special Character</label>
              <span>Password must contain special character (!@#$%^&*)</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-password_require_special" data-key="password_require_special">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-password_require_special">Disabled</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Login Security</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Login Attempts Limit</label>
              <span>Maximum failed login attempts before lockout</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-login_attempts_limit" data-key="login_attempts_limit" min="3" max="10" value="5">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Lockout Duration (Minutes)</label>
              <span>Account lockout duration after failed attempts</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-lockout_duration" data-key="lockout_duration" min="5" max="60" value="15">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Two-Factor Authentication</label>
              <span>Enable 2FA for enhanced security</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-enable_2fa" data-key="enable_2fa">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-enable_2fa">Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SYSTEM SETTINGS -->
    <div class="settings-panel" id="panel-system">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-server'></i> System Settings</h3>
          <p>Configure system maintenance and backups</p>
        </div>

        <div class="settings-section">
          <h4>Maintenance</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Maintenance Mode</label>
              <span>Enable maintenance mode to restrict access</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-maintenance_mode" data-key="maintenance_mode">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-maintenance_mode">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Maintenance Message</label>
              <span>Message displayed during maintenance mode</span>
            </div>
            <div class="setting-control">
              <textarea class="setting-input" id="setting-maintenance_message" data-key="maintenance_message" rows="3" placeholder="System is under maintenance..."></textarea>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Backup</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Enable Backups</label>
              <span>Automatically backup database</span>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" id="setting-backup_enabled" data-key="backup_enabled">
                <span class="toggle-slider"></span>
              </label>
              <span class="setting-status" id="status-backup_enabled">Disabled</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Backup Frequency</label>
              <span>How often to create backups</span>
            </div>
            <div class="setting-control">
              <select class="setting-select" id="setting-backup_frequency" data-key="backup_frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Backup Retention</label>
              <span>Number of backups to retain</span>
            </div>
            <div class="setting-control">
              <input type="number" class="setting-input" id="setting-backup_retention" data-key="backup_retention" min="5" max="100" value="30">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- APPEARANCE SETTINGS -->
    <div class="settings-panel" id="panel-appearance">
      <div class="settings-card">
        <div class="settings-header">
          <h3><i class='bx bx-palette'></i> Appearance Settings</h3>
          <p>Customize system appearance and branding</p>
        </div>

        <div class="settings-section">
          <h4>Theme</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Default Theme</label>
              <span>Default theme for new users</span>
            </div>
            <div class="setting-control">
              <select class="setting-select" id="setting-theme_default" data-key="theme_default">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Branding</h4>
          
          <div class="setting-item">
            <div class="setting-info">
              <label>Logo URL</label>
              <span>URL or path to system logo</span>
            </div>
            <div class="setting-control">
              <input type="text" class="setting-input" id="setting-logo_url" data-key="logo_url" placeholder="/path/to/logo.png">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Favicon URL</label>
              <span>URL or path to favicon</span>
            </div>
            <div class="setting-control">
              <input type="text" class="setting-input" id="setting-favicon_url" data-key="favicon_url" placeholder="/path/to/favicon.ico">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Primary Color</label>
              <span>Primary brand color (hex code)</span>
            </div>
            <div class="setting-control">
              <input type="color" class="setting-input" id="setting-primary_color" data-key="primary_color" value="#FFD700">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Secondary Color</label>
              <span>Secondary brand color (hex code)</span>
            </div>
            <div class="setting-control">
              <input type="color" class="setting-input" id="setting-secondary_color" data-key="secondary_color" value="#4a2d6d">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SETTINGS ACTIONS -->
    <div class="settings-actions">
      <button class="btn-reset-settings" id="btnResetSettings">
        <i class='bx bx-reset'></i>
        <span>Reset to Defaults</span>
      </button>
      <button class="btn-save-settings" id="btnSaveSettings">
        <i class='bx bx-save'></i>
        <span>Save All Settings</span>
      </button>
    </div>
  </div>

</main>

<script src="<?= View::asset('js/settings.js') ?>"></script>
</body>
</html>

