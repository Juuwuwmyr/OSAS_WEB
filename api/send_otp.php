<?php
// API endpoint for sending OTP to email
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
        // Get and validate email
        $email = htmlspecialchars(trim($_POST['email'] ?? ''));
        
        if (empty($email)) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Email is required.']);
            exit;
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address.']);
            exit;
        }
        
        // Check if email already exists in users table
        $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
        if ($check && $check->bind_param("s", $email)) {
            $check->execute();
            if (method_exists($check, 'get_result')) {
                $result = $check->get_result();
                if ($result->num_rows > 0) {
                    ob_end_clean();
                    http_response_code(409);
                    echo json_encode(['status' => 'error', 'message' => 'Email already exists. Please use a different email.']);
                    $check->close();
                    exit;
                }
            } else {
                $check->store_result();
                if ($check->num_rows > 0) {
                    ob_end_clean();
                    http_response_code(409);
                    echo json_encode(['status' => 'error', 'message' => 'Email already exists. Please use a different email.']);
                    $check->close();
                    exit;
                }
            }
            $check->close();
        }
        
        // Generate 6-digit OTP
        $otp_code = sprintf('%06d', rand(0, 999999));
        
        // Set expiration time (10 minutes from now)
        $expires_at = date('Y-m-d H:i:s', time() + 600);
        
        // Delete any existing unverified OTPs for this email
        $delete = $conn->prepare("DELETE FROM email_otps WHERE email = ? AND verified = 0");
        if ($delete) {
            $delete->bind_param("s", $email);
            $delete->execute();
            $delete->close();
        }
        
        // Insert new OTP
        $insert = $conn->prepare("INSERT INTO email_otps (email, otp_code, expires_at) VALUES (?, ?, ?)");
        if (!$insert) {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $insert->bind_param("sss", $email, $otp_code, $expires_at);
        
        if (!$insert->execute()) {
            ob_end_clean();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to generate OTP: ' . $insert->error]);
            $insert->close();
            exit;
        }
        
        $insert->close();
        
        // Send OTP via email
        $subject = "Email Verification - OSAS System";
        $message = "Your OTP code for email verification is: " . $otp_code . "\n\n";
        $message .= "This code will expire in 10 minutes.\n\n";
        $message .= "If you did not request this code, please ignore this email.\n\n";
        $message .= "Best regards,\nOSAS System";
        
        $headers = "From: OSAS System <noreply@osas.edu>\r\n";
        $headers .= "Reply-To: noreply@osas.edu\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        // Send email (using PHP mail function)
        // Note: In production, consider using PHPMailer or similar library for better reliability
        $mail_sent = @mail($email, $subject, $message, $headers);
        
        ob_end_clean();
        http_response_code(200);
        echo json_encode([
            'status' => 'success', 
            'message' => 'OTP has been sent to your email address. Please check your inbox.',
            // For development/testing, include OTP in response (remove in production)
            'otp' => $otp_code // Remove this line in production!
        ]);
        exit;
        
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
