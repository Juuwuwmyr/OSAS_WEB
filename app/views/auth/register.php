<?php
// app/views/auth/register.php
// Suppress all output and errors to ensure clean JSON response
error_reporting(0);
ini_set('display_errors', 0);
ob_start(); // Start output buffering

// Set headers first, before any output
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean(); // Clear any output
    http_response_code(200);
    exit;
}

// Try multiple possible paths for database connection
$db_paths = [
    __DIR__ . '/../../config/db_connect.php',           // From app/views/auth/
    __DIR__ . '/../../../config/db_connect.php',        // From app/views/auth/
    __DIR__ . '/../../../app/config/db_connect.php',     // From app/views/auth/
    __DIR__ . '/../../app/config/db_connect.php'         // Alternative path
];

$db_loaded = false;
$db_error = '';
foreach ($db_paths as $path) {
    if (file_exists($path)) {
        try {
            // Suppress any output from the included file
            $temp_ob = ob_get_level();
            require_once $path;
            // Clean any output that might have been generated
            while (ob_get_level() > $temp_ob) {
                ob_end_clean();
            }
            $db_loaded = true;
            break;
        } catch (Exception $e) {
            $db_error = $e->getMessage();
            continue;
        } catch (Error $e) {
            $db_error = $e->getMessage();
            continue;
        }
    }
}

if (!$db_loaded) {
    ob_end_clean(); // Clear any output
    $error_msg = 'Database configuration file not found.';
    if ($db_error) {
        $error_msg .= ' Error: ' . $db_error;
    }
    echo json_encode(['status' => 'error', 'message' => $error_msg]);
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
    $role       = htmlspecialchars(trim($_POST['role'] ?? 'user')); // default role

    // Clear any output before JSON
    ob_clean();
    
    // Basic validation
    if (empty($first_name) || empty($last_name) || empty($email) || empty($username) || empty($password)) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'All required fields must be filled out.']);
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address.']);
        exit;
    }
    
    // Check database connection
    if (!isset($conn) || ($conn && $conn->connect_error)) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed. Please try again later.']);
        exit;
    }

    // Check for existing username/email
    $check = $conn->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
    if (!$check) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . ($conn->error ?? 'Unknown error')]);
        exit;
    }
    $check->bind_param("ss", $email, $username);
    $check->execute();
    $result = $check->get_result();

    if ($result && $result->num_rows > 0) {
        ob_end_clean();
        http_response_code(409); // Conflict
        echo json_encode(['status' => 'error', 'message' => 'Email or username already exists.']);
        $check->close();
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $insert = $conn->prepare("
        INSERT INTO users (student_id, first_name, last_name, department, email, username, password, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    if (!$insert) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . ($conn->error ?? 'Unknown error')]);
        $check->close();
        exit;
    }

    $insert->bind_param(
        "ssssssss",
        $student_id,
        $first_name,
        $last_name,
        $department,
        $email,
        $username,
        $hashedPassword,
        $role
    );

    if ($insert->execute()) {
        ob_end_clean();
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Account created successfully!']);
    } else {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to register user: ' . ($insert->error ?? 'Unknown error')]);
    }

    $check->close();
    $insert->close();
} else {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
}
ob_end_flush();
?>
