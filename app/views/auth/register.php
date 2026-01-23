<?php
// app/views/auth/register.php
// Suppress all output and errors to ensure clean JSON response
error_reporting(0);
ini_set('display_errors', 0);
ob_start(); // Start output buffering

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

// Set headers first, before any output
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_clean(); // Clear any output but keep buffer active
    http_response_code(200);
    ob_end_flush();
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
    ob_clean(); // Clear any output but keep buffer active
    $error_msg = 'Database configuration file not found.';
    if ($db_error) {
        $error_msg .= ' Error: ' . $db_error;
    }
    echo json_encode(['status' => 'error', 'message' => $error_msg]);
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
    $role       = htmlspecialchars(trim($_POST['role'] ?? 'user')); // default role

    // Clear any output before JSON
    ob_clean();
    
    // Basic validation
    if (empty($first_name) || empty($last_name) || empty($email) || empty($username) || empty($password)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'All required fields must be filled out.']);
        ob_end_flush();
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address.']);
        ob_end_flush();
        exit;
    }
    
    // Check database connection
    if (!isset($conn) || ($conn && $conn->connect_error)) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed. Please try again later.']);
        ob_end_flush();
        exit;
    }

    // Check for existing username/email
    $check = $conn->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
    if (!$check) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . ($conn->error ?? 'Unknown error')]);
        ob_end_flush();
        exit;
    }
    $check->bind_param("ss", $email, $username);
    $check->execute();
    $result = $check->get_result();

    if ($result && $result->num_rows > 0) {
        ob_clean();
        http_response_code(409); // Conflict
        echo json_encode(['status' => 'error', 'message' => 'Email or username already exists.']);
        $check->close();
        ob_end_flush();
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Combine first_name and last_name into full_name (matching database schema)
    $full_name = trim($first_name . ' ' . $last_name);

    // Insert user - matching actual database schema: student_id, full_name, email, username, password, role
    $insert = $conn->prepare("
        INSERT INTO users (student_id, full_name, email, username, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    if (!$insert) {
        ob_clean();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . ($conn->error ?? 'Unknown error')]);
        $check->close();
        ob_end_flush();
        exit;
    }

    $insert->bind_param(
        "ssssss",
        $student_id,
        $full_name,
        $email,
        $username,
        $hashedPassword,
        $role
    );

    if ($insert->execute()) {
        // Try to send welcome email (do not block signup if it fails)
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

                    $mail->addAddress($email, $full_name);
                    $mail->isHTML(true);
                    $mail->Subject = 'Welcome to OSAS';
                    $mail->Body = '<p>Hi ' . htmlspecialchars($full_name, ENT_QUOTES, 'UTF-8') . ',</p>'
                        . '<p>Your account has been created successfully.</p>'
                        . '<p>You can now log in using your username: <b>' . htmlspecialchars($username, ENT_QUOTES, 'UTF-8') . '</b></p>';
                    $mail->AltBody = "Hi {$full_name},\n\nYour account has been created successfully.\n\nUsername: {$username}\n";

                    $mail->send();
                }
            }
        } catch (Throwable $e) {
            error_log('Signup email send failed: ' . $e->getMessage());
        }

        ob_clean();
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Account created successfully!']);
    } else {
        ob_clean();
        http_response_code(500);
        $error_msg = 'Failed to register user.';
        if ($insert->error) {
            $error_msg .= ' Error: ' . $insert->error;
        } elseif ($conn->error) {
            $error_msg .= ' Error: ' . $conn->error;
        }
        echo json_encode(['status' => 'error', 'message' => $error_msg]);
    }

    $check->close();
    $insert->close();
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
