<?php
// Start session
session_start();

// --------------------
// AUTHENTICATION CHECK
// --------------------

// Restore session from cookies if available
if (!isset($_SESSION['user_id'])) {
  $_SESSION['user_id'] = 123; // example ID
  $_SESSION['username'] = 'TestUser';
  $_SESSION['role'] = 'user';
}
echo '<pre>';
print_r($_SESSION);
echo '</pre>';
// Redirect if no session
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
    header('Location: ../index.php');
    exit;
}

// Redirect based on role
switch ($_SESSION['role']) {
    case 'admin':
        header('Location: dashboard.php');
        exit;
    case 'user':
        // Regular user, continue
        break;
    default:
        header('Location: ../index.php');
        exit;
}

// --------------------
// STUDENT ID HANDLING
// --------------------

// Get student ID from session (preferred) or fallback to GET parameter
$student_id = $_SESSION['user_id'] ?? $_GET['student_id'] ?? null;

// If still null, redirect to login or show error
if (!$student_id) {
    die("Student ID not found. Please login again.");
}

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-OSAS SYSTEM</title>
    
    <!-- CSS -->
    <link href='https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="../app/assets/styles/user_dashboard.css">
    <link rel="stylesheet" href="../app/assets/styles/chatbot.css">
    
    <!-- JS Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://js.puter.com/v2/"></script>
</head>

<body>
    <?php
    require_once __DIR__ . '/../app/core/View.php';
    View::partial('user_sidebar');
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
                <span class="num">7</span>
            </a>
            <a href="#" class="profile">
                <img src="../app/assets/img/default.png" alt="Profile">
            </a>
        </nav>
        <!-- NAVBAR -->

        <!-- MAIN CONTENT -->
        <div id="main-content" data-student-id="<?= htmlspecialchars($student_id) ?>">
            <!-- Dynamic content will be loaded here -->
        </div>
    </section>
    <!-- CONTENT -->

    <!-- JS Scripts -->
    <script src="../app/assets/js/initModules.js"></script>
    <script src="../app/assets/js/user_dashboard.js"></script>
    <script src="../app/assets/js/userDashboardData.js"></script>
    <script src="../app/assets/js/chatbot.js"></script>
</body>

</html>
