<?php
require_once __DIR__ . '/../../core/View.php';
// Get user profile image or default
$userImage = View::asset('img/user.jpg');
if (!file_exists(__DIR__ . '/../../assets/img/user.jpg')) {
    $userImage = View::asset('img/default.png');
}
$username = $_SESSION['username'] ?? 'Admin';
$role = $_SESSION['role'] ?? 'admin';
?>
<!-- TOP NAVIGATION -->
<nav class="top-nav">
  <!-- Logo Section -->
  <div class="nav-brand">
    <img src="<?= View::asset('img/default.png') ?>" alt="Osas Logo" class="nav-logo">
    <span class="nav-title" title="Office of Student Affairs and Services">E-Osas</span>
    <span class="nav-title-compact" title="Office of Student Affairs and Services">OSAS</span>
  </div>

  <!-- Navigation Menu -->
  <ul class="nav-menu">
    <li class="nav-item active">
      <a href="#" data-page="admin_page/dashcontent" class="nav-link">
        <i class='bx bxs-dashboard'></i>
        <span>Dashboard</span>
      </a>
    </li>
    <li class="nav-item">
      <a href="#" data-page="admin_page/Department" class="nav-link">
        <i class='bx bxs-building'></i>
        <span>Department</span>
      </a>
    </li>
    <li class="nav-item">
      <a href="#" data-page="admin_page/Sections" class="nav-link">
        <i class='bx bxs-layer'></i>
        <span>Sections</span>
      </a>
    </li>
    <li class="nav-item">
      <a href="#" data-page="admin_page/Students" class="nav-link">
        <i class='bx bxs-group'></i>
        <span>Students</span>
      </a>
    </li>
    <li class="nav-item">
      <a href="#" data-page="admin_page/Violations" class="nav-link">
        <i class='bx bxs-shield-x'></i>
        <span>Violations</span>
      </a>
    </li>
    <li class="nav-item">
      <a href="#" data-page="admin_page/Reports" class="nav-link">
        <i class='bx bxs-file'></i>
        <span>Reports</span>
      </a>
    </li>
    <li class="nav-item">
      <a href="#" data-page="admin_page/Announcements" class="nav-link">
        <i class='bx bxs-megaphone'></i>
        <span>Announcements</span>
      </a>
    </li>
  </ul>

  <!-- User Section -->
  <div class="nav-user">
    <!-- Search -->
    <div class="nav-search">
      <form action="#" class="search-form">
        <div class="search-input-wrapper">
          <i class='bx bx-search'></i>
          <input type="search" placeholder="Search..." class="search-input">
        </div>
      </form>
    </div>
    
    <!-- Dark Mode Toggle -->
    <div class="nav-theme-toggle">
      <label class="theme-switch">
        <input type="checkbox" id="switch-mode-top">
        <span class="slider">
          <i class='bx bx-sun sun-icon'></i>
          <i class='bx bx-moon moon-icon'></i>
        </span>
      </label>
    </div>

    <!-- Notifications -->
    <div class="nav-notifications">
      <button class="notification-btn">
        <i class='bx bx-bell'></i>
        <span class="notification-badge">1</span>
      </button>
    </div>

    <!-- User Menu -->
    <div class="nav-user-menu">
      <div class="user-avatar">
        <img src="<?= $userImage ?>" alt="User Avatar">
        <span class="user-name"><?= htmlspecialchars($username) ?></span>
        <i class='bx bx-chevron-down'></i>
      </div>
      
      <div class="user-dropdown">
        <a href="#" class="dropdown-item settings-link">
          <i class='bx bx-cog'></i>
          <span>Settings</span>
        </a>
        <a href="#" class="dropdown-item logout" onclick="logout()">
          <i class='bx bx-log-out'></i>
          <span>Logout</span>
        </a>
      </div>
    </div>
  </div>
</nav>
<!-- TOP NAVIGATION -->
