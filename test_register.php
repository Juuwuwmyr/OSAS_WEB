<?php
// Test script to debug registration issues
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>OSAS Registration Debug Test</h2>";

// Test 1: Database connection
echo "<h3>1. Database Connection Test:</h3>";
require_once __DIR__ . '/config/db_connect.php';

if ($conn->connect_error) {
    echo "<p style='color:red'>❌ Database connection FAILED: " . $conn->connect_error . "</p>";
} else {
    echo "<p style='color:green'>✅ Database connection successful!</p>";
}

// Test 2: Check if users table exists
echo "<h3>2. Users Table Test:</h3>";
$result = $conn->query("SHOW TABLES LIKE 'users'");
if ($result && $result->num_rows > 0) {
    echo "<p style='color:green'>✅ Users table exists!</p>";
    
    // Test 3: Check users table structure
    echo "<h3>3. Users Table Structure:</h3>";
    $columns = $conn->query("SHOW COLUMNS FROM users");
    echo "<table border='1'><tr><th>Column</th><th>Type</th></tr>";
    $hasUsername = false;
    while ($col = $columns->fetch_assoc()) {
        echo "<tr><td>" . $col['Field'] . "</td><td>" . $col['Type'] . "</td></tr>";
        if ($col['Field'] == 'username') {
            $hasUsername = true;
        }
    }
    echo "</table>";
    
    if ($hasUsername) {
        echo "<p style='color:green'>✅ Username column exists!</p>";
    } else {
        echo "<p style='color:red'>❌ Username column MISSING! Run osas_complete_setup.sql first!</p>";
    }
} else {
    echo "<p style='color:red'>❌ Users table does NOT exist! Run osas_complete_setup.sql first!</p>";
}

// Test 4: Check email_configs table
echo "<h3>4. Email Config Test:</h3>";
$result = $conn->query("SELECT * FROM email_configs WHERE is_default = 1 LIMIT 1");
if ($result && $result->num_rows > 0) {
    $config = $result->fetch_assoc();
    echo "<p style='color:green'>✅ Email config found: " . $config['name'] . "</p>";
    echo "<p>SMTP Host: " . $config['smtp_host'] . "</p>";
    echo "<p>SMTP Username: " . $config['smtp_username'] . "</p>";
} else {
    echo "<p style='color:red'>❌ No email config found!</p>";
}

// Test 5: Check register.php path
echo "<h3>5. Register.php Path Test:</h3>";
$registerPath = __DIR__ . '/app/views/auth/register.php';
if (file_exists($registerPath)) {
    echo "<p style='color:green'>✅ register.php exists at: " . $registerPath . "</p>";
} else {
    echo "<p style='color:red'>❌ register.php NOT found!</p>";
}

echo "<hr>";
echo "<h3>Summary:</h3>";
echo "<p>If any tests failed, run the <b>osas_complete_setup.sql</b> file in phpMyAdmin first.</p>";
echo "<p>URL: <a href='http://localhost/phpmyadmin'>http://localhost/phpmyadmin</a></p>";

$conn->close();
?>
