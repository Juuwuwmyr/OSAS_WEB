<?php
/**
 * Direct Login Endpoint Test
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST['username'] = 'test';
$_POST['password'] = 'test';
$_POST['rememberMe'] = 'false';

echo "<h2>🔍 Testing Login Endpoint Directly</h2>";

try {
    // Load the AuthController
    require_once __DIR__ . '/app/core/Controller.php';
    require_once __DIR__ . '/app/core/Model.php';
    require_once __DIR__ . '/app/models/UserModel.php';
    require_once __DIR__ . '/app/controllers/AuthController.php';
    
    echo "<p style='color: green;'>✅ All files loaded successfully</p>";
    
    // Create controller instance
    $controller = new AuthController();
    echo "<p style='color: green;'>✅ AuthController created successfully</p>";
    
    // Test the login method
    echo "<p>🔄 Testing login method...</p>";
    
    // Capture output
    ob_start();
    $controller->login();
    $output = ob_get_clean();
    
    echo "<p><strong>Output:</strong></p>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 3px;'>" . htmlspecialchars($output) . "</pre>";
    
    // Try to parse as JSON
    $data = json_decode($output, true);
    if ($data) {
        echo "<p style='color: green;'>✅ Valid JSON response</p>";
        echo "<p><strong>Status:</strong> " . htmlspecialchars($data['status'] ?? 'unknown') . "</p>";
        echo "<p><strong>Message:</strong> " . htmlspecialchars($data['message'] ?? 'no message') . "</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ Not JSON response (might be HTML error page)</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Exception: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Stack Trace:</strong></p>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 3px;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
} catch (Error $e) {
    echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Stack Trace:</strong></p>";
    echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 3px;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "<hr>";
echo "<h3>🔧 Next Steps</h3>";
echo "<ul>";
echo "<li>If you see 'Invalid username or password' - the endpoint is working correctly</li>";
echo "<li>If you see an exception - there's a code issue that needs fixing</li>";
echo "<li>If you see HTML output - there might be a PHP error or syntax issue</li>";
echo "</ul>";

echo "<p><a href='index.php?direct=true'>🔐 Try Login Page</a></p>";
?>
