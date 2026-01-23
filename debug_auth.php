<?php
/**
 * Debug Login and Signup Issues
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 OSAS Login/Signup Debug Tool</h1>";

// Test 1: Database Connection
echo "<div style='margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
echo "<h2>📊 Test 1: Database Connection</h2>";

try {
    // Try to load database config
    $db_paths = [
        __DIR__ . '/config/db_connect.php',
        __DIR__ . '/app/config/db_connect.php',
    ];
    
    $db_loaded = false;
    foreach ($db_paths as $path) {
        if (file_exists($path)) {
            echo "<p style='color: green;'>✅ Found db config at: $path</p>";
            require_once $path;
            $db_loaded = true;
            break;
        } else {
            echo "<p style='color: orange;'>⚠️ Not found: $path</p>";
        }
    }
    
    if (!$db_loaded) {
        echo "<p style='color: red;'>❌ Database configuration not found!</p>";
    } else {
        echo "<p style='color: green;'>✅ Database configuration loaded</p>";
        
        if (isset($conn)) {
            if ($conn->connect_error) {
                echo "<p style='color: red;'>❌ Database connection failed: " . htmlspecialchars($conn->connect_error) . "</p>";
            } else {
                echo "<p style='color: green;'>✅ Database connection successful</p>";
                
                // Test basic query
                $result = $conn->query("SELECT 1 as test");
                if ($result) {
                    echo "<p style='color: green;'>✅ Basic query test passed</p>";
                } else {
                    echo "<p style='color: red;'>❌ Basic query failed: " . htmlspecialchars($conn->error) . "</p>";
                }
                
                // Check if users table exists
                $result = $conn->query("SHOW TABLES LIKE 'users'");
                if ($result && $result->num_rows > 0) {
                    echo "<p style='color: green;'>✅ Users table exists</p>";
                    
                    // Count users
                    $result = $conn->query("SELECT COUNT(*) as count FROM users");
                    if ($result) {
                        $count = $result->fetch_assoc()['count'];
                        echo "<p style='color: blue;'>📊 Users table has $count records</p>";
                    }
                } else {
                    echo "<p style='color: red;'>❌ Users table does not exist!</p>";
                }
            }
        } else {
            echo "<p style='color: red;'>❌ \$conn variable not set after loading config</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Exception: " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "</div>";

// Test 2: Check Required Files
echo "<div style='margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
echo "<h2>📁 Test 2: Required Files</h2>";

$required_files = [
    'app/core/Controller.php',
    'app/core/Model.php',
    'app/models/UserModel.php',
    'app/controllers/AuthController.php',
    'app/views/auth/login.php',
    'app/views/auth/register.php',
    'app/assets/js/login.js',
    'app/assets/js/register.js'
];

foreach ($required_files as $file) {
    if (file_exists($file)) {
        echo "<p style='color: green;'>✅ $file</p>";
    } else {
        echo "<p style='color: red;'>❌ $file - NOT FOUND</p>";
    }
}

echo "</div>";

// Test 3: Test Login Endpoint Directly
echo "<div style='margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
echo "<h2>🔐 Test 3: Login Endpoint</h2>";

echo "<p>Testing login endpoint with invalid credentials (should return error):</p>";

// Use cURL to test the login endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/app/views/auth/login.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'username=test&password=test');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p><strong>HTTP Status:</strong> $http_code</p>";
echo "<p><strong>Response:</strong></p>";
echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;'>" . htmlspecialchars($response) . "</pre>";

echo "</div>";

// Test 4: Test Signup Endpoint
echo "<div style='margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
echo "<h2>📝 Test 4: Signup Endpoint</h2>";

echo "<p>Testing signup endpoint with invalid data (should return validation error):</p>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/app/views/auth/register.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'first_name=&last_name=&email=invalid');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p><strong>HTTP Status:</strong> $http_code</p>";
echo "<p><strong>Response:</strong></p>";
echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto; max-height: 200px;'>" . htmlspecialchars($response) . "</pre>";

echo "</div>";

// Test 5: PHP Environment
echo "<div style='margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
echo "<h2>⚙️ Test 5: PHP Environment</h2>";

echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
echo "<p><strong>Server API:</strong> " . PHP_SAPI . "</p>";
echo "<p><strong>Memory Limit:</strong> " . ini_get('memory_limit') . "</p>";
echo "<p><strong>Max Execution Time:</strong> " . ini_get('max_execution_time') . "s</p>";
echo "<p><strong>Upload Max Filesize:</strong> " . ini_get('upload_max_filesize') . "</p>";
echo "<p><strong>Post Max Size:</strong> " . ini_get('post_max_size') . "</p>";

// Check required extensions
$required_extensions = ['mysqli', 'json', 'mbstring'];
foreach ($required_extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<p style='color: green;'>✅ Extension '$ext' is loaded</p>";
    } else {
        echo "<p style='color: red;'>❌ Extension '$ext' is NOT loaded</p>";
    }
}

echo "</div>";

echo "<div style='margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 5px;'>";
echo "<h3>🔧 Quick Fixes</h3>";
echo "<ul>";
echo "<li><strong>Server Error:</strong> Usually means database connection failed or PHP error</li>";
echo "<li><strong>Signup Button:</strong> Check browser console for JavaScript errors</li>";
echo "<li><strong>Privacy Checkbox:</strong> Make sure checkbox has proper event listener</li>";
echo "<li><strong>Check Network Tab:</strong> Look at browser dev tools network tab for failed requests</li>";
echo "</ul>";
echo "</div>";

echo "<div style='margin: 20px 0;'>";
echo "<a href='index.php?direct=true' style='padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;'>🔐 Test Login</a>";
echo "<a href='includes/signup.php' style='padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;'>📝 Test Signup</a>";
echo "</div>";
?>
