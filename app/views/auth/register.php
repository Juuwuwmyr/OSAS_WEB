<?php
// app/views/auth/register.php
// NEW FLOW: Don't save user until OTP is verified
// Store registration data temporarily in OTP table
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Set timezone to match MySQL
date_default_timezone_set('Asia/Manila');

// Set headers
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    ob_end_flush();
    exit;
}

// Load database connection
$db_paths = [
    __DIR__ . '/../../config/db_connect.php',
    __DIR__ . '/../../../config/db_connect.php',
];

$db_loaded = false;
foreach ($db_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $db_loaded = true;
        break;
    }
}

if (!$db_loaded) {
    ob_clean();
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found.']);
    ob_end_flush();
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Sanitize input
    $student_id = htmlspecialchars(trim($_POST['student_id'] ?? ''));
    $first_name = htmlspecialchars(trim($_POST['first_name'] ?? ''));
    $last_name  = htmlspecialchars(trim($_POST['last_name'] ?? ''));
    $department = htmlspecialchars(trim($_POST['department'] ?? ''));
    $email      = htmlspecialchars(trim($_POST['email'] ?? ''));
    $username   = htmlspecialchars(trim($_POST['username'] ?? ''));
    $password   = $_POST['password'] ?? '';
    $role       = 'user';

    ob_clean();
    
    // Basic validation
    if (empty($first_name) || empty($last_name) || empty($email) || empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'All required fields must be filled out.']);
        ob_end_flush();
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address.']);
        ob_end_flush();
        exit;
    }
    
    // Check database connection
    if (!isset($conn) || ($conn && $conn->connect_error)) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
        ob_end_flush();
        exit;
    }

    // Validate student ID (must exist in students table)
    if (empty($student_id)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Student ID is required.']);
        ob_end_flush();
        exit;
    }

    $studentCheck = $conn->prepare("SELECT 1 FROM students WHERE student_id = ? LIMIT 1");
    $studentCheck->bind_param("s", $student_id);
    $studentCheck->execute();
    $studentResult = $studentCheck->get_result();
    $studentExists = $studentResult && $studentResult->num_rows > 0;
    $studentCheck->close();

    if (!$studentExists) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid Student ID. Please use a registered Student ID.']);
        ob_end_flush();
        exit;
    }

    // Check for existing email/username in users table
    $check = $conn->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
    $check->bind_param("ss", $email, $username);
    $check->execute();
    $result = $check->get_result();

    if ($result && $result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => 'Email or username already exists.']);
        $check->close();
        ob_end_flush();
        exit;
    }
    $check->close();

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $full_name = trim($first_name . ' ' . $last_name);

    // Direct registration without OTP
    $insertUser = $conn->prepare("INSERT INTO users (student_id, full_name, email, username, password, role, is_active, status) VALUES (?, ?, ?, ?, ?, ?, 1, 'active')");
    $insertUser->bind_param("ssssss", $student_id, $full_name, $email, $username, $hashedPassword, $role);
    
    if ($insertUser->execute()) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Account created successfully! You can now log in.',
            'requireVerification' => false
        ]);
        $insertUser->close();
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to create account. ' . $insertUser->error]);
        $insertUser->close();
    }
    ob_end_flush();
    exit;
} else {
    ob_clean();
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    ob_end_flush();
    exit;
}
?>
