<?php
// Database configuration
// LOCAL WAMP SETTINGS (for development)
$host = "sql103.infinityfree.com";  // or "127.0.0.1"
$user = "if0_41102022";       // default WAMP MySQL user
$pass = "Jmzqn2379BKH";           // default WAMP MySQL password (usually empty)
$dbname = "if0_41102022_osas";       // your local database name


// Create connection
$conn = @new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    // Log error but don't die - let the calling code handle it
    error_log("Database connection failed: " . $conn->connect_error);
    // Keep $conn as the mysqli object (even with error) so Model can check connect_error
    // Don't set to null - let Model handle the error
} else {
// Set charset to UTF-8 for proper character encoding
    if (!$conn->set_charset("utf8mb4")) {
        error_log("Warning: Failed to set charset to utf8mb4: " . $conn->error);
    }
}
?>
