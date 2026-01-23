<?php
/**
 * Simple Login Test
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');

try {
    // Load database connection
    require_once __DIR__ . '/config/db_connect.php';
    
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    // Test basic query
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    
    $count = $result->fetch_assoc()['count'];
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection working',
        'user_count' => $count
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
