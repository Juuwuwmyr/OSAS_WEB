<?php
// app/views/auth/register.php
// Suppress display of errors but log them
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ob_start(); // Start output buffering

// Set error handler to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_end_clean();
        http_response_code(500);
        // For development: show actual error (remove in production)
        $errorMsg = 'Server error occurred.';
        if (isset($error['message'])) {
            $errorMsg .= ' Error: ' . $error['message'] . ' in ' . basename($error['file']) . ':' . $error['line'];
        }
        echo json_encode([
            'status' => 'error', 
            'message' => $errorMsg
        ]);
        exit;
    }
});

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

// Handle GET requests for testing
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    ob_end_clean();
    http_response_code(200);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Register endpoint is accessible',
        'db_loaded' => $db_loaded ?? false,
        'db_paths_tried' => $db_paths ?? []
    ]);
    exit;
}

// Try multiple possible paths for database connection
$db_paths = [
    __DIR__ . '/../../config/db_connect.php',           // From app/views/auth/
    __DIR__ . '/../../../config/db_connect.php',        // From app/views/auth/
    __DIR__ . '/../../../app/config/db_connect.php',     // From app/views/auth/
    __DIR__ . '/../../app/config/db_connect.php',        // Alternative path
    __DIR__ . '/../../../../config/db_connect.php'       // From includes/signup.php
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
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $error_msg]);
    exit;
}

// Ensure database connection exists
if (!isset($conn)) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection not initialized.']);
    exit;
}

// Verify connection is actually working
if ($conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
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
    
    // Basic validation - only validate fields that are actually stored in users table
    if (empty($email) || empty($username) || empty($password)) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email, username, and password are required.']);
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
    if (!isset($conn)) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database connection not initialized.']);
        exit;
    }
    
    if ($conn->connect_error) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
        exit;
    }

    // Check for existing username/email
    $check = $conn->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
    if (!$check) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database prepare error: ' . ($conn->error ?? 'Unknown error')]);
        exit;
    }
    
    if (!$check->bind_param("ss", $email, $username)) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database bind error: ' . $check->error]);
        $check->close();
        exit;
    }
    
    if (!$check->execute()) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database execute error: ' . $check->error]);
        $check->close();
        exit;
    }
    
    // Use get_result() if available, otherwise use store_result()
    if (method_exists($check, 'get_result')) {
        $result = $check->get_result();
        if (!$result) {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database get_result error: ' . $check->error]);
            $check->close();
            exit;
        }
        $num_rows = $result->num_rows;
    } else {
        // Fallback for older PHP versions
        $check->store_result();
        $num_rows = $check->num_rows;
    }

    if ($num_rows > 0) {
        ob_end_clean();
        http_response_code(409); // Conflict
        echo json_encode(['status' => 'error', 'message' => 'Email or username already exists.']);
        $check->close();
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert user - try with student_id first, fallback without it if column doesn't exist
    $insert = $conn->prepare("
        INSERT INTO users (student_id, email, username, password, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    ");
    
    if (!$insert) {
        // If prepare failed, try without student_id column
        $insert = $conn->prepare("
            INSERT INTO users (email, username, password, role, is_active)
            VALUES (?, ?, ?, ?, 1)
        ");
        if (!$insert) {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . ($conn->error ?? 'Unknown error')]);
            $check->close();
            exit;
        }
        // Insert without student_id
        $insert->bind_param("ssss", $email, $username, $hashedPassword, $role);
    } else {
        // Insert with student_id
        $insert->bind_param("sssss", $student_id, $email, $username, $hashedPassword, $role);
    }

    if ($insert->execute()) {
        ob_end_clean();
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Account created successfully!']);
        $check->close();
        $insert->close();
        exit;
    } else {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to register user: ' . ($insert->error ?? 'Unknown error')]);
        $check->close();
        $insert->close();
        exit;
    }
    } catch (Exception $e) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Registration error: ' . $e->getMessage()]);
        exit;
    } catch (Error $e) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Registration error: ' . $e->getMessage()]);
        exit;
    }
} else {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}
// This should never be reached, but just in case
ob_end_clean();
http_response_code(500);
echo json_encode(['status' => 'error', 'message' => 'Unexpected error occurred.']);
exit;
?>
