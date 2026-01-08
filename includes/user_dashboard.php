<?php
session_start();

// Restore session from cookies if available
if (isset($_COOKIE['user_id']) && isset($_COOKIE['role'])) {
    $_SESSION['user_id'] = $_COOKIE['user_id'];
    $_SESSION['username'] = $_COOKIE['username'] ?? '';
    $_SESSION['role'] = $_COOKIE['role'];
    $_SESSION['student_id'] = $_COOKIE['student_id'] ?? null;
    $_SESSION['student_id_code'] = $_COOKIE['student_id_code'] ?? null;
}

// Redirect if session is missing
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

<script>
    // Inject PHP student ID into JS
    window.STUDENT_ID = <?= json_encode($student_id) ?>;
</script>
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
        <?php
        $role = $_SESSION['role'] ?? 'user';
        $notificationCount = 7;
        View::partial('navbar', ['role' => $role, 'notificationCount' => $notificationCount]);
        ?>

        <!-- MAIN CONTENT -->
        <div id="main-content" data-student-id="<?= htmlspecialchars($student_id) ?>">
            <!-- Dynamic content will be loaded here -->
        </div>
    </section>
    <!-- CONTENT -->

    <!-- JS Scripts -->
    <script src="../app/assets/js/utils/theme.js"></script>
    <script src="../app/assets/js/utils/eyeCare.js"></script>
    <script src="../app/assets/js/initModules.js"></script>
    <script src="../app/assets/js/user_dashboard.js"></script>
    <script src="../app/assets/js/userDashboardData.js"></script>
    <script src="../app/assets/js/chatbot.js"></script>
</body>

</html>
