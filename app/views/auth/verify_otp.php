<?php
// app/views/auth/verify_otp.php
// Creates user ONLY after successful OTP verification
error_reporting(E_ALL);
ini_set('display_errors', 1);
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
    $email = htmlspecialchars(trim($_POST['email'] ?? ''));
    $code = htmlspecialchars(trim($_POST['code'] ?? ''));
    
    ob_clean();
    
    // Validate input
    if (empty($email) || empty($code)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email and verification code are required.']);
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
    
    // Get current time for comparison
    $currentTime = date('Y-m-d H:i:s');
    
    // Find valid OTP with pending data
    $stmt = $conn->prepare("SELECT * FROM otps WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1");
    $stmt->bind_param("ss", $email, $code);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $otp = $result->fetch_assoc();
        
        // Check if expired (compare timestamps)
        $expiresAt = strtotime($otp['expires_at']);
        $now = time();
        
        if ($now > $expiresAt) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error', 
                'message' => 'Verification code has expired. Please request a new one.',
                'expired' => true
            ]);
            $stmt->close();
            ob_end_flush();
            exit;
        }
        
        // Get pending registration data
        $pendingData = json_decode($otp['pending_data'], true);
        
        if (!$pendingData) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Registration data not found. Please register again.']);
            $stmt->close();
            ob_end_flush();
            exit;
        }
        
        // NOW create the user in the users table
        $insertUser = $conn->prepare("
            INSERT INTO users (student_id, name, email, username, password, department, role, status, email_verified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
        ");
        
        $insertUser->bind_param(
            "sssssss",
            $pendingData['student_id'],
            $pendingData['name'],
            $pendingData['email'],
            $pendingData['username'],
            $pendingData['password'],
            $pendingData['department'],
            $pendingData['role']
        );
        
        if ($insertUser->execute()) {
            // Mark OTP as used
            $updateOtp = $conn->prepare("UPDATE otps SET used = 1 WHERE id = ?");
            $updateOtp->bind_param("i", $otp['id']);
            $updateOtp->execute();
            $updateOtp->close();
            
            // Delete all OTPs for this email
            $deleteOtps = $conn->prepare("DELETE FROM otps WHERE email = ?");
            $deleteOtps->bind_param("s", $email);
            $deleteOtps->execute();
            $deleteOtps->close();
            
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Email verified successfully! Your account is now active.',
                'verified' => true
            ]);
        } else {
            // Check if duplicate entry error
            if ($conn->errno == 1062) {
                http_response_code(409);
                echo json_encode(['status' => 'error', 'message' => 'Account already exists with this email or username.']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to create account. Please try again.']);
            }
        }
        $insertUser->close();
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid verification code. Please check and try again.']);
    }
    
    $stmt->close();
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
