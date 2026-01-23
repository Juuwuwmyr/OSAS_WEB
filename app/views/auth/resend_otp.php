<?php
// app/views/auth/resend_otp.php
// Resend OTP endpoint
error_reporting(E_ALL);
ini_set('display_errors', 1);
ob_start();

// Load Composer autoloader
$autoloadPaths = [
    __DIR__ . '/../../../vendor/autoload.php',
    __DIR__ . '/../../../../vendor/autoload.php'
];
foreach ($autoloadPaths as $autoloadPath) {
    if (file_exists($autoloadPath)) {
        require_once $autoloadPath;
        break;
    }
}

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
    
    ob_clean();
    
    // Validate input
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email is required.']);
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
    
    // Check if user exists and is not verified
    $checkUser = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $checkUser->bind_param("s", $email);
    $checkUser->execute();
    $userResult = $checkUser->get_result();
    
    if (!$userResult || $userResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'No account found with this email.']);
        $checkUser->close();
        ob_end_flush();
        exit;
    }
    
    $user = $userResult->fetch_assoc();
    $checkUser->close();
    
    // Check if already verified
    if ($user['email_verified_at'] !== null) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email is already verified. You can login now.']);
        ob_end_flush();
        exit;
    }
    
    // Generate new OTP
    $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
    
    // Delete existing OTPs
    $deleteOtp = $conn->prepare("DELETE FROM otps WHERE email = ?");
    $deleteOtp->bind_param("s", $email);
    $deleteOtp->execute();
    $deleteOtp->close();
    
    // Insert new OTP
    $insertOtp = $conn->prepare("INSERT INTO otps (email, code, expires_at, used) VALUES (?, ?, ?, 0)");
    $insertOtp->bind_param("sss", $email, $otpCode, $expiresAt);
    $insertOtp->execute();
    $insertOtp->close();
    
    // Send OTP email
    $emailSent = false;
    try {
        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            $smtp = null;
            $smtpQuery = $conn->query(
                "SELECT * FROM email_configs WHERE is_active = 1 ORDER BY is_default DESC, id DESC LIMIT 1"
            );
            if ($smtpQuery && $smtpQuery->num_rows > 0) {
                $smtp = $smtpQuery->fetch_assoc();
            }

            if ($smtp) {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = (string)($smtp['smtp_host'] ?? '');
                $mail->Port = (int)($smtp['smtp_port'] ?? 587);
                $mail->Username = (string)($smtp['smtp_username'] ?? '');
                $mail->Password = (string)($smtp['smtp_password'] ?? '');
                $mail->SMTPAuth = !empty($mail->Username);
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;

                $fromEmail = (string)($smtp['from_email'] ?? $mail->Username);
                $fromName = (string)($smtp['from_name'] ?? 'OSAS');
                if (!empty($fromEmail)) {
                    $mail->setFrom($fromEmail, $fromName);
                }

                $mail->addAddress($email, $user['name']);
                $mail->isHTML(true);
                $mail->Subject = 'OSAS - New Verification Code';
                $mail->Body = '
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #333;">OSAS</h1>
                            <p style="color: #666;">Office of Student Affairs and Services</p>
                        </div>
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
                            <h2 style="color: #333; margin-bottom: 20px;">New Verification Code</h2>
                            <p style="color: #666;">Hi ' . htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8') . ',</p>
                            <p style="color: #666;">Here is your new verification code:</p>
                            <div style="background: #333; color: #fff; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                                ' . $otpCode . '
                            </div>
                            <p style="color: #666;">This code will expire in <strong>15 minutes</strong>.</p>
                        </div>
                    </div>
                ';
                $mail->AltBody = "Hi {$user['name']},\n\nYour new verification code is: {$otpCode}\n\nThis code will expire in 15 minutes.";

                $mail->send();
                $emailSent = true;
            }
        }
    } catch (Throwable $e) {
        error_log('Resend OTP email failed: ' . $e->getMessage());
    }
    
    if ($emailSent) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'New verification code sent to your email.',
            'emailSent' => true
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to send verification email. Please try again.'
        ]);
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
