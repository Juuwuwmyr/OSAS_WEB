<?php
// Database configuration
// AWS: set DB_HOST, DB_USER, DB_PASS, DB_NAME as environment variables
// Local: falls back to WAMP defaults
$host   = getenv('DB_HOST') ?: 'localhost';
$user   = getenv('DB_USER') ?: 'root';
$pass   = getenv('DB_PASS') ?: '';
$dbname = getenv('DB_NAME') ?: 'osas';

$conn = @new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
} else {
    if (!$conn->set_charset("utf8mb4")) {
        error_log("Warning: Failed to set charset to utf8mb4: " . $conn->error);
    }
}
