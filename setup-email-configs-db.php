<?php
require_once __DIR__ . '/config/db_connect.php';

echo "<h2>Setting up Email Configs Table</h2>";

if (!isset($conn) || ($conn && $conn->connect_error)) {
    echo "<p>❌ Database connection failed. Please check config/db_connect.php</p>";
    exit;
}

$sql = "
CREATE TABLE IF NOT EXISTS email_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL,
    smtp_username VARCHAR(255) NULL,
    smtp_password VARCHAR(255) NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_configs_active (is_active),
    INDEX idx_email_configs_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql) === TRUE) {
    echo "<p>✅ email_configs table created successfully</p>";
} else {
    echo "<p>❌ Error creating table: " . $conn->error . "</p>";
    $conn->close();
    exit;
}

$conn->close();
?>
