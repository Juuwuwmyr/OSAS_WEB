<?php
// Check if user is already logged in
session_start();

// Check cookies first (more reliable than session)
if (isset($_COOKIE['user_id']) && isset($_COOKIE['role'])) {
    // Restore session from cookies
    $_SESSION['user_id'] = $_COOKIE['user_id'];
    $_SESSION['username'] = $_COOKIE['username'] ?? '';
    $_SESSION['role'] = $_COOKIE['role'];
    
    // Redirect to appropriate dashboard
    if ($_SESSION['role'] === 'admin') {
        header('Location: includes/dashboard.php');
        exit;
    } elseif ($_SESSION['role'] === 'user') {
        header('Location: includes/user_dashboard.php');
        exit;
    }
}

// Also check session (fallback)
if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
    if ($_SESSION['role'] === 'admin') {
        header('Location: includes/dashboard.php');
        exit;
    } elseif ($_SESSION['role'] === 'user') {
        header('Location: includes/user_dashboard.php');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSAS | Login</title>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4a2d6d">
    <link rel="apple-touch-icon" href="app/assets/img/default.png">
    <meta name="apple-mobile-web-app-capable" content="yes">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="./app/assets/styles/login.css">
    <style>
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  --primary: #1a365d;
  --primary-dark: #0f2547;
  --primary-light: #2c5282;
  --secondary: #2d9cdb;
  --secondary-dark: #1d7cb5;
  --surface: #ffffff;
  --surface-alt: #f8f9fa;
  --border: #e2e8f0;
  --border-dark: #cbd5e0;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --text-tertiary: #718096;
  --success: #38a169;
  --error: #e53e3e;
  --warning: #d69e2e;
  --info: #3182ce;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html, body {
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: var(--text-primary);
  background: #f0f2f5;
}

/* Layout Structure */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

/* Sidebar */
.sidebar {
  width: 260px;
  height: 100%;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: var(--transition);
  position: relative;
  z-index: 100;
}

.sidebar.hidden {
  width: 70px;
  transform: translateX(-190px);
}

/* Sidebar Header */
.sidebar-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  height: 70px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--secondary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar.hidden .logo-text {
  display: none;
}

/* OSAS Label */
.sidebar-label {
  padding: 0 24px 16px;
  margin-top: -4px;
}

.label-text {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.sidebar.hidden .sidebar-label {
  display: none;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.nav-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  padding: 0 24px 12px;
  white-space: nowrap;
}

.sidebar.hidden .section-label {
  display: none;
}

.nav-items {
  list-style: none;
}

.nav-item {
  position: relative;
  margin: 0 12px 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  position: relative;
  white-space: nowrap;
}

.nav-link:hover {
  background: var(--surface-alt);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--secondary);
  color: white;
  font-weight: 600;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: var(--secondary);
  border-radius: 0 2px 2px 0;
}

.nav-link .icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.nav-link.active .icon {
  color: white;
}

.nav-link .badge {
  margin-left: auto;
  background: var(--error);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: #f0f2f5;
}

/* Top Bar */
.top-bar {
  height: 64px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 24px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 90;
}

/* Menu Toggle */
.menu-toggle {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.menu-toggle:hover {
  background: var(--surface-alt);
  color: var(--text-primary);
}

/* Search */
.search-container {
  flex: 1;
  max-width: 480px;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 16px 0 40px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  transition: var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--secondary);
  background: var(--surface);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

/* Top Bar Actions */
.top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.action-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.action-button:hover {
  background: var(--surface-alt);
  color: var(--text-primary);
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: var(--error);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface);
}

/* User Menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.user-menu:hover {
  background: var(--surface-alt);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-role {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Content Area */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f0f2f5;
}

.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

/* Page Header */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: var(--transition);
}

.stat-card:hover {
  border-color: var(--border-dark);
  box-shadow: var(--shadow-md);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary);
  font-size: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  line-height: 1;
}

.stat-change {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: var(--success);
}

.stat-change.negative {
  color: var(--error);
}

/* Data Tables */
.data-table-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 24px;
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.table-actions {
  display: flex;
  gap: 12px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  padding: 16px 24px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.table td {
  padding: 16px 24px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background: var(--surface-alt);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }
  
  .sidebar.hidden {
    width: 70px;
    transform: translateX(-170px);
  }
}

@media (max-width: 992px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);
  }
  
  .sidebar.visible {
    transform: translateX(0);
  }
  
  .main-content {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .top-bar {
    padding: 0 16px;
    gap: 16px;
  }
  
  .content-area {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .user-info {
    display: none;
  }
  
  .search-container {
    max-width: 200px;
  }
}

@media (max-width: 576px) {
  .top-actions {
    gap: 8px;
  }
  
  .action-button {
    width: 32px;
    height: 32px;
  }
  
  .user-menu {
    padding: 4px;
  }
  
  .search-container {
    display: none;
  }
  
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .table-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

/* Utility Classes */
.hidden {
  display: none !important;
}

.visible {
  display: flex !important;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flex-1 {
  flex: 1;
}

.ml-auto {
  margin-left: auto;
}

/* Loading States */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.loading::after {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--secondary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-left: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.empty-state-description {
  font-size: 14px;
  max-width: 400px;
  margin: 0 auto;
}/* Error toast styles */
        .error-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        }

        .error-toast i {
            font-size: 1.2rem;
        }

        .error-toast button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.1rem;
            padding: 0;
            margin-left: auto;
        }

        .error-toast button:hover {
            opacity: 0.8;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }

            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        /* Loading spinner */
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        /* Background animation for light mode */
        @keyframes backgroundShift {

            0%,
            100% {
                background-position: 0% 50%;
            }

            50% {
                background-position: 100% 50%;
            }
        }



        /* 🔹 Toast Notification Styles */
        .toast {
            position: fixed;
            top: -60px;
            right: 20px;
            background: #222;
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.4s ease;
            z-index: 9999;
            font-size: 0.95rem;
        }

        .toast.show {
            top: 20px;
            opacity: 1;
            transform: translateY(0);
        }

        .toast i {
            font-size: 1.2rem;
        }

        .toast.success {
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
        }

        .toast.error {
            background: linear-gradient(135deg, #E53935, #B71C1C);
        }

        /* 🔹 Spinner on Login Button */
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #fff;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            margin-right: 8px;
            animation: spin 0.8s linear infinite;
            display: inline-block;
            vertical-align: middle;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }

        .login-button {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
        }

        .login-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
    </style>
</head>

<body>
    <div class="login-container">
        <div class="login-card">
            <div class="gold-border"></div>

            <div class="theme-toggle" id="themeToggle">
                <i class="fas fa-sun"></i>
            </div>

            <div class="login-header">
                <div class="logo">
                    <img src="./app/assets/img/default.png" alt="Logo" width="55" height="55">
                </div>
                <h2>Welcome Back</h2>
                <p>Please enter your credentials to login</p>
            </div>

            <?php if (!empty($error)): ?>
                <div class="error-toast">
                    <i class="fas fa-exclamation-circle"></i>
                    <span><?= htmlspecialchars($error) ?></span>
                    <button onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            <?php endif; ?>

            <form id="loginForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="username">Username or Email</label>
                        <input id="username" name="username" type="text" placeholder="Enter your username or email" required>
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="password-input-wrapper">
                            <input id="password" name="password" type="password" placeholder="Enter your password" required>
                            <button type="button" class="toggle-password" id="passwordToggle">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-options">
                    <label class="remember-me">
                        <input type="checkbox" id="rememberMe">
                        <span class="checkmark"></span>
                        Remember me
                    </label>
                    <a href="./includes/forgot_password.php" class="forgot-password">Forgot password?</a>
                </div>

                <button type="submit" class="login-button" id="loginButton">
                    <span>Login</span>
                </button>

                <div class="social-login">
                    <div class="divider">
                        <span class="divider-line"></span>
                        <span class="divider-text">OR</span>
                        <span class="divider-line"></span>
                    </div>
                    <div class="social-buttons">
                        <button type="button" class="social-button google">
                            <i class="fab fa-google"></i>
                            Continue with Google
                        </button>
                        <button type="button" class="social-button facebook">
                            <i class="fab fa-facebook-f"></i>
                            Continue with Facebook
                        </button>
                    </div>
                </div>
            </form>

            <div class="login-footer">
                <p>Don't have an account?
                    <a href="./includes/signup.php" class="signup-link">Sign up</a>
                </p>
            </div>
        </div>
    </div>

    <button id="installPWA" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 18px;
    border-radius: 10px;
    background:#4a2d6d;
    color:white;
    border:none;
    cursor:pointer;
    display:none;">
        Install App
    </button>

    <script src="service-worker.js"></script>
    <script src="app/assets/js/pwa.js"></script>
    <script src="app/assets/js/session.js"></script>
    <script src="app/assets/js/login.js"></script>

</body>

</html>