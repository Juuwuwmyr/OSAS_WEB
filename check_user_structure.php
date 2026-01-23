<?php
/**
 * Check Users Table Structure
 */

require_once __DIR__ . '/config/db_connect.php';

header('Content-Type: application/json');

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    // Get table structure
    $result = $conn->query("DESCRIBE users");
    if (!$result) {
        throw new Exception('Failed to get table structure: ' . $conn->error);
    }
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row;
    }
    
    // Check if user exists with correct columns
    $email = 'morenojumyr0@gmail.com';
    
    // First, get all columns to build query
    $columnNames = array_column($columns, 'Field');
    $selectFields = implode(', ', $columnNames);
    
    $query = "SELECT $selectFields FROM users WHERE email = ? OR username = ?";
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
            'table_structure' => $columns,
            'suggestion' => 'This email/username does not exist in the database'
        ]);
    } else {
        $user = $result->fetch_assoc();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'User found',
            'user' => $user,
            'table_structure' => $columns,
            'login_requirements' => [
                'email_verified_at' => $user['email_verified_at'] ?? null,
                'has_password' => !empty($user['password'])
            ]
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
