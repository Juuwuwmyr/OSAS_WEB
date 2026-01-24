<?php
// app/views/auth/verify_otp.php
// Creates user ONLY after successful OTP verification
error_reporting(E_ALL);
ini_set('display_errors', 0);
ob_start();

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (ob_get_length()) {
            ob_clean();
        }
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Server error. Please try again.']);
        if (ob_get_level()) {
            ob_end_flush();
        }
    }
});

function bindParamsByRef($stmt, string $types, array $params): bool {
    $refs = [];
    $refs[] = $types;
    foreach ($params as $k => $v) {
        $refs[] = &$params[$k];
    }
    return call_user_func_array([$stmt, 'bind_param'], $refs);
}

set_exception_handler(function (Throwable $e) {
    if (ob_get_length()) {
        ob_clean();
    }
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error. Please try again.']);
    if (ob_get_level()) {
        ob_end_flush();
    }
    exit;
});

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
    
    // Find valid OTP with pending data
    $stmt = $conn->prepare("SELECT id, email, code, expires_at, used, pending_data FROM otps WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Server error. Please try again.']);
        ob_end_flush();
        exit;
    }
    $stmt->bind_param("ss", $email, $code);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Server error. Please try again.']);
        $stmt->close();
        ob_end_flush();
        exit;
    }

    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $otp = [];
        $stmt->bind_result($otpId, $otpEmail, $otpCode, $otpExpiresAt, $otpUsed, $otpPendingData);
        $stmt->fetch();
        $otp['id'] = $otpId;
        $otp['email'] = $otpEmail;
        $otp['code'] = $otpCode;
        $otp['expires_at'] = $otpExpiresAt;
        $otp['used'] = $otpUsed;
        $otp['pending_data'] = $otpPendingData;
        
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

        if (empty($pendingData['name']) || empty($pendingData['email']) || empty($pendingData['username']) || empty($pendingData['password']) || empty($pendingData['role'])) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Registration data is incomplete. Please register again.']);
            $stmt->close();
            ob_end_flush();
            exit;
        }
        
        // NOW create the user in the users table
        // Support both schemas:
        // - Legacy schema: full_name, is_active
        // - New schema: name, status, email_verified_at, department
        $columns = [];
        try {
            $colRes = $conn->query('SHOW COLUMNS FROM users');
            if ($colRes) {
                while ($row = $colRes->fetch_assoc()) {
                    if (!empty($row['Field'])) {
                        $columns[$row['Field']] = true;
                    }
                }
            }
        } catch (Throwable $e) {
            $columns = [];
        }

        $hasFullName = isset($columns['full_name']);
        $hasIsActive = isset($columns['is_active']);
        $hasStatus = isset($columns['status']);
        $hasEmailVerifiedAt = isset($columns['email_verified_at']);
        $hasDepartment = isset($columns['department']);

        $studentId = isset($pendingData['student_id']) ? (string)$pendingData['student_id'] : null;
        $fullName = (string)$pendingData['name'];
        $dept = isset($pendingData['department']) ? (string)$pendingData['department'] : null;
        $roleVal = (string)$pendingData['role'];

        // Prefer legacy schema if present (matches your current phpMyAdmin screenshot)
        if ($hasFullName && $hasIsActive) {
            $insertUser = $conn->prepare("
                INSERT INTO users (username, email, password, role, full_name, student_id, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            ");
        } else {
            // Newer schema
            $cols = ['student_id', 'name', 'email', 'username', 'password', 'role'];
            $vals = ['?', '?', '?', '?', '?', '?'];
            $types = 'ssssss';
            $bind = [$studentId, $fullName, (string)$pendingData['email'], (string)$pendingData['username'], (string)$pendingData['password'], $roleVal];

            if ($hasDepartment) {
                $cols[] = 'department';
                $vals[] = '?';
                $types .= 's';
                $bind[] = $dept;
            }
            if ($hasStatus) {
                $cols[] = 'status';
                $vals[] = "'active'";
            }
            if ($hasEmailVerifiedAt) {
                $cols[] = 'email_verified_at';
                $vals[] = 'NOW()';
            }

            $sql = 'INSERT INTO users (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $vals) . ')';
            $insertUser = $conn->prepare($sql);
        }

        if (!$insertUser) {
            error_log('verify_otp: prepare insertUser failed: ' . ($conn->errno ?? '') . ' ' . ($conn->error ?? ''));
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to create account. Please try again.',
                'error_code' => $conn->errno ?? null,
                'hint' => 'Prepare failed'
            ]);
            $stmt->close();
            ob_end_flush();
            exit;
        }

        if ($hasFullName && $hasIsActive) {
            $insertUser->bind_param(
                'ssssss',
                $pendingData['username'],
                $pendingData['email'],
                $pendingData['password'],
                $roleVal,
                $fullName,
                $studentId
            );
        } else {
            // Rebuild bind params for the dynamically-built query
            $types = 'ssssss';
            $bind = [$studentId, $fullName, (string)$pendingData['email'], (string)$pendingData['username'], (string)$pendingData['password'], $roleVal];
            if ($hasDepartment) {
                $types .= 's';
                $bind[] = $dept;
            }
            if (!bindParamsByRef($insertUser, $types, $bind)) {
                error_log('verify_otp: bind_param failed');
            }
        }
        
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
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Account already exists with this email or username.',
                    'error_code' => 1062
                ]);
            } else {
                error_log('verify_otp: insertUser execute failed: ' . ($conn->errno ?? '') . ' ' . ($conn->error ?? ''));
                http_response_code(500);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to create account. Please try again.',
                    'error_code' => $conn->errno ?? null,
                    'hint' => 'Insert failed'
                ]);
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
