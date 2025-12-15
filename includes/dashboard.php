<?php
// Start session and check authentication
session_start();

// Check if user is logged in - check cookies first (more reliable)
if (isset($_COOKIE['user_id']) && isset($_COOKIE['role'])) {
    // Restore session from cookies
    $_SESSION['user_id'] = $_COOKIE['user_id'];
    $_SESSION['username'] = $_COOKIE['username'] ?? '';
    $_SESSION['role'] = $_COOKIE['role'];
} elseif (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
    // No session or cookies, redirect to login
    header('Location: ../index.php');
    exit;
}

// Check if user is admin (required for admin dashboard)
if ($_SESSION['role'] !== 'admin') {
    // If user is not admin, redirect to appropriate dashboard
    if ($_SESSION['role'] === 'user') {
        header('Location: user_dashboard.php');
    } else {
        header('Location: ../index.php');
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href='https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css' rel='stylesheet'>
  <title>E-OSAS SYSTEM</title>
  <link rel="stylesheet" href="../app/assets/styles/dashboard.css">
  <link rel="stylesheet" href="../app/assets/styles/chatbot.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://js.puter.com/v2/"></script>
</head>

<body>
  <?php
  require_once __DIR__ . '/../app/core/View.php';
  View::partial('admin_sidebar');
  ?>

  <!-- CONTENT -->
  <section id="content">
    <!-- NAVBAR -->
    <nav>
      <i class='bx bx-menu'></i>
      <a href="#" class="nav-link">Categories</a>
      <form action="#">
        <div class="form-input">
          <input type="search" placeholder="Search...">
          <button type="submit" class="search-btn"><i class='bx bx-search'></i></button>
        </div>
      </form>
      <input type="checkbox" id="switch-mode" hidden>
      <label for="switch-mode" class="switch-mode"></label>
      <a href="#" class="notification">
        <i class='bx bxs-bell'></i>
        <span class="num">1</span>
      </a>
      <a href="#" class="profile">
        <img src="../app/assets/img/user.jpg">
      </a>
    </nav>
    <!-- NAVBAR -->

    <!-- MAIN CONTENT CONTAINER -->
    <div id="main-content">
      <!-- Content will be loaded here dynamically -->
    </div>
  </section>
  <!-- CONTENT -->

  <script src="../app/assets/js/dashboard.js"></script>
  <script src="../app/assets/js/utils/notification.js"></script>
  <script src="../app/assets/js/dashboardData.js"></script>
  <script src="../app/assets/js/modules/dashboardModule.js"></script>
  <script src="../app/assets/js/utils/theme.js"></script>


  
  <script src="../app/assets/js/department.js"></script>
  <script src="../app/assets/js/section.js"></script>
  <script src="../app/assets/js/student.js"></script>
  <script src="../app/assets/js/violation.js"></script>
  <script src="../app/assets/js/reports.js"></script>
  <script src="../app/assets/js/announcement.js"></script>
  <script src="../app/assets/js/chatbot.js"></script>
</body>

</html>