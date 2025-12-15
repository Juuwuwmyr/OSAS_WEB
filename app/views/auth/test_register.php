<?php
// Test endpoint to verify register.php is accessible
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'Register endpoint is accessible!',
    'path' => __FILE__,
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
]);
?>



