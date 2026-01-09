<?php
// API endpoint for verifying OTP
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ob_start();

// Set headers
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

// Try multiple possible paths for database connection
$db_paths = [
    __DIR__ . '/../app/config/db_connect.php',
    __DIR__ . '/../config/db_connect.php',
    __DIR__ . '/../../config/db_connect.php'
];

$db_loaded = false;
foreach ($db_paths as $path) {
    if (file_exists($path)) {
        try {
            require_once $path;
            $db_loaded = true;
            break;
        } catch (Exception $e) {
            continue;
        }
    }
}

if (!$db_loaded || !isset($conn) || $conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get and validate inputs
        $email = htmlspecialchars(trim($_POST['email'] ?? ''));
        $otp_code = htmlspecialchars(trim($_POST['otp'] ?? ''));
        
        if (empty($email) || empty($otp_code)) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Email and OTP code are required.']);
            exit;
        }
        
        // Find OTP record
        $query = "SELECT * FROM email_otps WHERE email = ? AND otp_code = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param("ss", $email, $otp_code);
        
        if (!$stmt->execute()) {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $stmt->error]);
            $stmt->close();
            exit;
        }
        
        $result = method_exists($stmt, 'get_result') ? $stmt->get_result() : null;
        
        if ($result && $result->num_rows > 0) {
            $otp_record = $result->fetch_assoc();
            
            // Check if OTP has expired
            $current_time = date('Y-m-d H:i:s');
            if ($otp_record['expires_at'] < $current_time) {
                ob_end_clean();
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'OTP has expired. Please request a new one.']);
                $stmt->close();
                exit;
            }
            
            // Check attempts (max 5 attempts)
            if ($otp_record['attempts'] >= 5) {
                ob_end_clean();
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Maximum verification attempts exceeded. Please request a new OTP.']);
                $stmt->close();
                exit;
            }
            
            // Mark OTP as verified
            $update = $conn->prepare("UPDATE email_otps SET verified = 1 WHERE id = ?");
            if ($update) {
                $update->bind_param("i", $otp_record['id']);
                $update->execute();
                $update->close();
            }
            
            $stmt->close();
            
            ob_end_clean();
            http_response_code(200);
            echo json_encode([
                'status' => 'success', 
                'message' => 'Email verified successfully!',
                'email' => $email
            ]);
            exit;
            
        } else {
            // Increment attempts if OTP doesn't match
            $increment = $conn->prepare("UPDATE email_otps SET attempts = attempts + 1 WHERE email = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1");
            if ($increment) {
                $increment->bind_param("s", $email);
                $increment->execute();
                $increment->close();
            }
            
            $stmt->close();
            
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid OTP code. Please try again.']);
            exit;
        }
        
    } catch (Exception $e) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        exit;
    }
} else {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}
?>
