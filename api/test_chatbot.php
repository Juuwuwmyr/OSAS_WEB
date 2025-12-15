<?php
/**
 * Chatbot API Test Endpoint
 * Use this to test if your API key is working
 */

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/../app/config/db_connect.php';

// Load AI API configuration
$ai_config_file = __DIR__ . '/../app/config/ai_config.php';
if (file_exists($ai_config_file)) {
    require_once $ai_config_file;
} else {
    die('<h1>Error: ai_config.php not found</h1>');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Chatbot API Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .success { color: green; background: #e8f5e9; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .error { color: red; background: #ffebee; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .info { color: blue; background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Chatbot API Configuration Test</h1>
    
    <?php
    // Test 1: Check if constants are defined
    echo '<h2>1. Configuration Check</h2>';
    
    $config_ok = true;
    
    if (defined('AI_API_KEY')) {
        $key_length = strlen(AI_API_KEY);
        if (empty(AI_API_KEY) || $key_length < 20) {
            echo '<div class="error">❌ AI_API_KEY is empty or too short (length: ' . $key_length . ')</div>';
            $config_ok = false;
        } else {
            $masked_key = substr(AI_API_KEY, 0, 7) . '...' . substr(AI_API_KEY, -4);
            echo '<div class="success">✅ AI_API_KEY is set (length: ' . $key_length . ', starts with: ' . substr(AI_API_KEY, 0, 7) . '...)</div>';
        }
    } else {
        echo '<div class="error">❌ AI_API_KEY is not defined</div>';
        $config_ok = false;
    }
    
    if (defined('AI_API_TYPE')) {
        echo '<div class="info">ℹ️ AI_API_TYPE: ' . AI_API_TYPE . '</div>';
    } else {
        echo '<div class="error">❌ AI_API_TYPE is not defined</div>';
        $config_ok = false;
    }
    
    if (defined('AI_API_URL')) {
        echo '<div class="info">ℹ️ AI_API_URL: ' . AI_API_URL . '</div>';
    } else {
        echo '<div class="error">❌ AI_API_URL is not defined</div>';
        $config_ok = false;
    }
    
    if (defined('AI_MODEL')) {
        echo '<div class="info">ℹ️ AI_MODEL: ' . AI_MODEL . '</div>';
    } else {
        echo '<div class="error">❌ AI_MODEL is not defined</div>';
        $config_ok = false;
    }
    
    // Test 2: Check CURL
    echo '<h2>2. CURL Extension Check</h2>';
    if (function_exists('curl_init')) {
        echo '<div class="success">✅ CURL extension is enabled</div>';
    } else {
        echo '<div class="error">❌ CURL extension is NOT enabled. Please enable it in php.ini</div>';
        $config_ok = false;
    }
    
    // Test 3: Test API call
    if ($config_ok) {
        echo '<h2>3. API Connection Test</h2>';
        echo '<div class="info">Testing API connection...</div>';
        
        // Define the function inline for testing
        function testCallOpenAI($messages) {
            if (!function_exists('curl_init')) {
                return ['success' => false, 'error' => 'CURL is not enabled'];
            }
            
            if (empty(AI_API_KEY) || strlen(AI_API_KEY) < 20) {
                return ['success' => false, 'error' => 'Invalid API key'];
            }
            
            $ch = curl_init(AI_API_URL);
            if (!$ch) {
                return ['success' => false, 'error' => 'Failed to initialize CURL'];
            }
            
            $data = [
                'model' => AI_MODEL,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 50
            ];
            
            // SSL Configuration - disable for local development
            $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : false;
            $is_local = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
                        strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
            
            if ($is_local && !defined('VERIFY_SSL_CERTIFICATE')) {
                $verify_ssl = false;
            }
            
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . AI_API_KEY
                ],
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => $verify_ssl,
                CURLOPT_SSL_VERIFYHOST => $verify_ssl ? 2 : 0
            ]);
            
            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);
            
            if ($curl_error) {
                return ['success' => false, 'error' => 'CURL Error: ' . $curl_error];
            }
            
            if ($http_code !== 200) {
                $error_data = json_decode($response, true);
                $error_message = 'API request failed with HTTP code ' . $http_code;
                if (isset($error_data['error']['message'])) {
                    $error_message = $error_data['error']['message'];
                }
                return ['success' => false, 'error' => $error_message];
            }
            
            $data = json_decode($response, true);
            if (isset($data['choices'][0]['message']['content'])) {
                return [
                    'success' => true,
                    'message' => trim($data['choices'][0]['message']['content'])
                ];
            }
            
            return ['success' => false, 'error' => 'Invalid API response format'];
        }
        
        $test_messages = [
            ['role' => 'system', 'content' => 'You are a helpful assistant.'],
            ['role' => 'user', 'content' => 'Say "Hello, API is working!" and nothing else.']
        ];
        
        $result = testCallOpenAI($test_messages);
        
        if ($result['success']) {
            echo '<div class="success">✅ API call successful!</div>';
            echo '<div class="info"><strong>Response:</strong> ' . htmlspecialchars($result['message']) . '</div>';
        } else {
            echo '<div class="error">❌ API call failed</div>';
            echo '<div class="error"><strong>Error:</strong> ' . htmlspecialchars($result['error']) . '</div>';
        }
    } else {
        echo '<h2>3. API Connection Test</h2>';
        echo '<div class="error">⚠️ Skipping API test due to configuration errors above</div>';
    }
    
    // Test 4: File paths
    echo '<h2>4. File Paths Check</h2>';
    echo '<div class="info">Config file: ' . $ai_config_file . '</div>';
    echo '<div class="info">Config exists: ' . (file_exists($ai_config_file) ? 'Yes' : 'No') . '</div>';
    echo '<div class="info">Chatbot API: ' . __DIR__ . '/chatbot.php</div>';
    echo '<div class="info">Chatbot exists: ' . (file_exists(__DIR__ . '/chatbot.php') ? 'Yes' : 'No') . '</div>';
    ?>
    
    <h2>5. Next Steps</h2>
    <ul>
        <li>If all tests pass, your chatbot should work!</li>
        <li>If API call fails, check:
            <ul>
                <li>Your API key is valid and has credits</li>
                <li>Your server can make outbound HTTPS requests</li>
                <li>No firewall is blocking the connection</li>
            </ul>
        </li>
        <li>Check browser console (F12) for JavaScript errors</li>
        <li>Check PHP error logs for server-side errors</li>
    </ul>
    
    <p><a href="../index.php">← Back to Login</a></p>
</body>
</html>

