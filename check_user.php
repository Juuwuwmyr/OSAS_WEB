<?php
/**
 * Check User Account Status
 */

require_once __DIR__ . '/config/db_connect.php';

header('Content-Type: application/json');

$email = 'morenojumyr0@gmail.com';

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    // Check if user exists
    $query = "SELECT id, username, email, status, email_verified_at, created_at FROM users WHERE email = ? OR username = ?";
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception('Query preparation failed: ' . $conn->error);
    }
    
    $stmt->bind_param("ss", $email, $email);
    if (!$stmt->execute()) {
        throw new Exception('Query execution failed: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found',
            'email' => $email,
            'suggestion' => 'This email/username does not exist in the database'
        ]);
    } else {
        $user = $result->fetch_assoc();
        
        $issues = [];
        if ($user['status'] !== 'active') {
            $issues[] = 'Account status is: ' . $user['status'];
        }
        if ($user['email_verified_at'] === null) {
            $issues[] = 'Email not verified (email_verified_at is NULL)';
        }
        
        echo json_encode([
            'status' => 'success',
            'message' => 'User found',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'status' => $user['status'],
                'email_verified_at' => $user['email_verified_at'],
                'created_at' => $user['created_at']
            ],
            'issues' => $issues,
            'can_login' => empty($issues)
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
