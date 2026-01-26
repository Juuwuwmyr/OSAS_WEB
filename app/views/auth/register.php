<?php
// app/views/auth/register.php
// NEW FLOW: Don't save user until OTP is verified
// Store registration data temporarily in OTP table
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

// Set timezone to match MySQL
date_default_timezone_set('Asia/Manila');

// Try to load Composer autoloader (PHPMailer)
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

    // Generate 6-digit OTP
    $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Set expiration to 15 minutes from now (use MySQL format)
    $expiresAt = date('Y-m-d H:i:s', time() + (15 * 60));
    
    // Store registration data as JSON - DO NOT INSERT TO USERS TABLE YET
    $pendingData = json_encode([
        'student_id' => $student_id,
        'name' => $full_name,
        'email' => $email,
        'username' => $username,
        'password' => $hashedPassword,
        'department' => $department,
        'role' => $role
    ]);
    
    // Delete any existing OTPs for this email
    $deleteOtp = $conn->prepare("DELETE FROM otps WHERE email = ?");
    $deleteOtp->bind_param("s", $email);
    $deleteOtp->execute();
    $deleteOtp->close();
    
    // Insert OTP with pending registration data
    $insertOtp = $conn->prepare("INSERT INTO otps (email, code, expires_at, used, pending_data) VALUES (?, ?, ?, 0, ?)");
    $insertOtp->bind_param("ssss", $email, $otpCode, $expiresAt, $pendingData);
    
    if (!$insertOtp->execute()) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to generate verification code.']);
        $insertOtp->close();
        ob_end_flush();
        exit;
    }
    $insertOtp->close();
    
    // Send OTP verification email
    $emailSent = false;
    try {
        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            $smtp = null;
            $smtpQuery = $conn->query(
                "SELECT * FROM email_configs WHERE is_active = 1 ORDER BY is_default DESC LIMIT 1"
            );
            if ($smtpQuery && $smtpQuery->num_rows > 0) {
                $smtp = $smtpQuery->fetch_assoc();
            }

            if ($smtp) {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = $smtp['smtp_host'];
                $mail->Port = (int)$smtp['smtp_port'];
                $mail->Username = $smtp['smtp_username'];
                $mail->Password = $smtp['smtp_password'];
                $mail->SMTPAuth = true;
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                $mail->setFrom($smtp['from_email'], $smtp['from_name']);
                $mail->addAddress($email, $full_name);
                $mail->isHTML(true);
                $mail->Subject = 'OSAS - Email Verification Code';
                $mail->Body = '
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a;">
                        <div style="text-align: center; padding: 30px 0; border-bottom: 1px solid #333;">
                            <h1 style="color: #d4af37; margin: 0; font-size: 32px;">OSAS</h1>
                            <p style="color: #888; margin: 10px 0 0;">Office of Student Affairs and Services</p>
                        </div>
                        <div style="padding: 40px 30px; text-align: center;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #d4af37, #f4d03f); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">✉️</span>
                            </div>
                            <h2 style="color: #fff; margin-bottom: 10px;">Verify Your Email</h2>
                            <p style="color: #888; margin-bottom: 30px;">Hi ' . htmlspecialchars($full_name) . ', use this code to complete your registration:</p>
                            <div style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border: 2px solid #d4af37; border-radius: 12px; padding: 25px; margin: 20px 0;">
                                <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #d4af37; font-family: monospace;">
                                    ' . $otpCode . '
                                </div>
                            </div>
                            <p style="color: #888; font-size: 14px;">This code expires in <strong style="color: #d4af37;">15 minutes</strong></p>
                        </div>
                        <div style="text-align: center; padding: 20px; border-top: 1px solid #333;">
                            <p style="color: #666; font-size: 12px; margin: 0;">If you didn\'t request this, please ignore this email.</p>
                        </div>
                    </div>
                ';
                $mail->AltBody = "Your OSAS verification code is: {$otpCode}\n\nThis code expires in 15 minutes.";
                $mail->send();
                $emailSent = true;
            }
        }
    } catch (Throwable $e) {
        error_log('OTP email failed: ' . $e->getMessage());
    }

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Verification code sent! Please check your email.',
        'requireVerification' => true,
        'email' => $email,
        'emailSent' => $emailSent,
        'expiresIn' => 15
    ]);
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
