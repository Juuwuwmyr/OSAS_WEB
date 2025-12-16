<?php
/**
 * Chatbot API Endpoint
 * Handles chat messages and integrates with AI API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../app/config/db_connect.php';

// Load AI API configuration
$ai_config_file = __DIR__ . '/../app/config/ai_config.php';
if (file_exists($ai_config_file)) {
    require_once $ai_config_file;
} else {
    // Default configuration
    define('AI_API_TYPE', 'openai'); // 'openai' or 'custom'
    define('AI_API_KEY', ''); // Set your API key here
    define('AI_API_URL', 'https://api.openai.com/v1/chat/completions');
    define('AI_MODEL', 'gpt-3.5-turbo');
    define('USE_DATABASE_CONTEXT', true); // Whether to include database context in prompts
}

// Verify configuration is loaded
if (!defined('AI_API_KEY')) {
    define('AI_API_KEY', '');
}
if (!defined('AI_API_TYPE')) {
    define('AI_API_TYPE', 'openai');
}
if (!defined('AI_API_URL')) {
    define('AI_API_URL', 'https://api.openai.com/v1/chat/completions');
}
if (!defined('AI_MODEL')) {
    define('AI_MODEL', 'gpt-3.5-turbo');
}
if (!defined('USE_DATABASE_CONTEXT')) {
    define('USE_DATABASE_CONTEXT', true);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';
$conversation_history = $input['history'] ?? [];

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

// Get user context from session if available
session_start();
$user_id = $_SESSION['user_id'] ?? null;
$user_role = $_SESSION['role'] ?? null;

// Build system prompt with optional database context
$system_prompt = "You are a helpful assistant for the OSAS (Office of Student Affairs System). ";
$system_prompt .= "You help users with questions about students, departments, sections, violations, and reports. ";
$system_prompt .= "Be friendly, professional, and concise in your responses.";

// Optionally add database context
if (USE_DATABASE_CONTEXT && $conn && !$conn->connect_error) {
    $context = getDatabaseContext($conn, $user_id, $user_role);
    if ($context) {
        $system_prompt .= "\n\nCurrent system context:\n" . $context;
    }
}

// Prepare messages for AI API
$messages = [
    ['role' => 'system', 'content' => $system_prompt]
];

// Add conversation history
foreach ($conversation_history as $msg) {
    $messages[] = [
        'role' => $msg['role'] ?? 'user',
        'content' => $msg['content'] ?? ''
    ];
}

// Add current message
$messages[] = ['role' => 'user', 'content' => $message];

// Call AI API
try {
    $response = callAIAPI($messages);
    
    if ($response['success']) {
        echo json_encode([
            'success' => true,
            'response' => $response['message'],
            'usage' => $response['usage'] ?? null
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $response['error'] ?? 'Failed to get AI response'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log("Chatbot API Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}

/**
 * Get database context for the chatbot
 */
function getDatabaseContext($conn, $user_id, $user_role) {
    $context = [];
    
    try {
        // Get basic stats
        $stats = [];
        
        // Count students
        $result = $conn->query("SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['students'] = $row['count'] ?? 0;
        }
        
        // Count departments
        $result = $conn->query("SELECT COUNT(*) as count FROM departments WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['departments'] = $row['count'] ?? 0;
        }
        
        // Count violations
        $result = $conn->query("SELECT COUNT(*) as count FROM violations WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['violations'] = $row['count'] ?? 0;
        }
        
        if (!empty($stats)) {
            $context[] = "System Statistics: " . json_encode($stats);
        }
        
        // Add user-specific context if logged in
        if ($user_id && $user_role) {
            $context[] = "Current user role: " . $user_role;
            
            if ($user_role === 'user') {
                // Get user's violation count
                $stmt = $conn->prepare("SELECT COUNT(*) as count FROM violations WHERE student_id = ? AND deleted_at IS NULL");
                if ($stmt) {
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    if ($result) {
                        $row = $result->fetch_assoc();
                        $context[] = "User has " . ($row['count'] ?? 0) . " violations";
                    }
                    $stmt->close();
                }
            }
        }
        
    } catch (Exception $e) {
        error_log("Error getting database context: " . $e->getMessage());
    }
    
    return implode("\n", $context);
}

/**
 * Call AI API (OpenAI, Groq, Hugging Face, Cohere, Gemini, or custom)
 */
function callAIAPI($messages) {
    // Check if constants are defined
    if (!defined('AI_API_KEY') || empty(AI_API_KEY) || AI_API_KEY === '') {
        return [
            'success' => false,
            'error' => 'AI API key not configured. Please set AI_API_KEY in app/config/ai_config.php'
        ];
    }
    
    // Check if API type is defined
    $api_type = defined('AI_API_TYPE') ? AI_API_TYPE : 'openai';
    
    // Route to appropriate API handler
    switch ($api_type) {
        case 'groq':
            return callGroqAPI($messages);
        case 'huggingface':
            return callHuggingFaceAPI($messages);
        case 'cohere':
            return callCohereAPI($messages);
        case 'gemini':
            return callGeminiAPI($messages);
        case 'openai':
            return callOpenAI($messages);
        default:
            return callCustomAI($messages);
    }
}

/**
 * Call OpenAI API
 */
function callOpenAI($messages) {
    // Check if CURL is available
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'CURL is not enabled on this server. Please enable the PHP CURL extension.'];
    }
    
    // Validate API key
    if (empty(AI_API_KEY) || strlen(AI_API_KEY) < 20) {
        return ['success' => false, 'error' => 'Invalid API key. Please check your API key in app/config/ai_config.php'];
    }
    
    $ch = curl_init(AI_API_URL);
    
    if (!$ch) {
        return ['success' => false, 'error' => 'Failed to initialize CURL'];
    }
    
    $data = [
        'model' => AI_MODEL,
        'messages' => $messages,
        'temperature' => 0.7,
        'max_tokens' => 500
    ];
    
    $json_data = json_encode($data);
    if (json_last_error() !== JSON_ERROR_NONE) {
        curl_close($ch);
        return ['success' => false, 'error' => 'Failed to encode request data: ' . json_last_error_msg()];
    }
    
    // SSL Configuration
    // Check if SSL verification should be disabled (for local development)
    $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : true;
    
    // Auto-detect local development environment
    $is_local = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) || 
                strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false ||
                strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false ||
                strpos($_SERVER['HTTP_HOST'] ?? '', '.local') !== false;
    
    // Use config setting, but allow auto-disable for local development if not explicitly set
    if (!$verify_ssl || ($is_local && !defined('VERIFY_SSL_CERTIFICATE'))) {
        $verify_ssl = false;
    }
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $json_data,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . AI_API_KEY
        ],
        CURLOPT_TIMEOUT => 30,
        // SSL verification - disabled for local development by default
        // WARNING: Always enable in production!
        CURLOPT_SSL_VERIFYPEER => $verify_ssl,
        CURLOPT_SSL_VERIFYHOST => $verify_ssl ? 2 : 0
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    // Log for debugging (remove in production)
    error_log("OpenAI API Response Code: " . $http_code);
    if ($curl_error) {
        error_log("CURL Error: " . $curl_error);
    }
    
    if ($curl_error) {
        return ['success' => false, 'error' => 'Connection error: ' . $curl_error];
    }
    
    if ($http_code !== 200) {
        $error_data = json_decode($response, true);
        $error_message = 'API request failed';
        
        if (isset($error_data['error']['message'])) {
            $error_message = $error_data['error']['message'];
        } elseif (isset($error_data['error'])) {
            $error_message = is_string($error_data['error']) ? $error_data['error'] : 'Unknown API error';
        } else {
            $error_message = 'API request failed with HTTP code ' . $http_code;
            if ($response) {
                $error_message .= '. Response: ' . substr($response, 0, 200);
            }
        }
        
        return [
            'success' => false,
            'error' => $error_message
        ];
    }
    
    if (empty($response)) {
        return ['success' => false, 'error' => 'Empty response from API'];
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['success' => false, 'error' => 'Failed to parse API response: ' . json_last_error_msg()];
    }
    
    if (isset($data['choices'][0]['message']['content'])) {
        return [
            'success' => true,
            'message' => trim($data['choices'][0]['message']['content']),
            'usage' => $data['usage'] ?? null
        ];
    }
    
    // Log the response for debugging
    error_log("Unexpected API response format: " . substr($response, 0, 500));
    
    return ['success' => false, 'error' => 'Invalid API response format. Check server logs for details.'];
}

/**
 * Call Groq API (FREE - Very Fast!)
 */
function callGroqAPI($messages) {
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'CURL is not enabled on this server.'];
    }
    
    $ch = curl_init(AI_API_URL);
    if (!$ch) {
        return ['success' => false, 'error' => 'Failed to initialize CURL'];
    }
    
    $data = [
        'model' => AI_MODEL,
        'messages' => $messages,
        'temperature' => 0.7,
        'max_tokens' => 500
    ];
    
    $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : false;
    
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
        return ['success' => false, 'error' => 'Connection error: ' . $curl_error];
    }
    
    if ($http_code !== 200) {
        $error_data = json_decode($response, true);
        $error_message = isset($error_data['error']['message']) ? $error_data['error']['message'] : 'API request failed with code ' . $http_code;
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

/**
 * Call Hugging Face API (FREE)
 */
function callHuggingFaceAPI($messages) {
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'CURL is not enabled on this server.'];
    }
    
    // Convert messages to prompt format
    $prompt = '';
    foreach ($messages as $msg) {
        if ($msg['role'] === 'system') {
            $prompt .= $msg['content'] . "\n\n";
        } elseif ($msg['role'] === 'user') {
            $prompt .= "User: " . $msg['content'] . "\n";
        } elseif ($msg['role'] === 'assistant') {
            $prompt .= "Assistant: " . $msg['content'] . "\n";
        }
    }
    $prompt .= "Assistant: ";
    
    $ch = curl_init(AI_API_URL);
    if (!$ch) {
        return ['success' => false, 'error' => 'Failed to initialize CURL'];
    }
    
    $data = ['inputs' => $prompt];
    $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : false;
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . AI_API_KEY
        ],
        CURLOPT_TIMEOUT => 60,
        CURLOPT_SSL_VERIFYPEER => $verify_ssl,
        CURLOPT_SSL_VERIFYHOST => $verify_ssl ? 2 : 0
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        if (isset($data[0]['generated_text'])) {
            $text = $data[0]['generated_text'];
            // Extract assistant response
            $parts = explode('Assistant: ', $text);
            $assistant_response = end($parts);
            return [
                'success' => true,
                'message' => trim($assistant_response)
            ];
        }
    }
    
    return ['success' => false, 'error' => 'Hugging Face API call failed'];
}

/**
 * Call Cohere API (FREE Tier)
 */
function callCohereAPI($messages) {
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'CURL is not enabled on this server.'];
    }
    
    $ch = curl_init(AI_API_URL);
    if (!$ch) {
        return ['success' => false, 'error' => 'Failed to initialize CURL'];
    }
    
    // Convert messages format for Cohere
    $chat_history = [];
    $message = '';
    foreach ($messages as $msg) {
        if ($msg['role'] === 'user') {
            if (!empty($message)) {
                $chat_history[] = ['role' => 'assistant', 'message' => $message];
                $message = '';
            }
            $message = $msg['content'];
        } elseif ($msg['role'] === 'assistant') {
            $message = $msg['content'];
        }
    }
    
    $data = [
        'model' => AI_MODEL,
        'message' => $message,
        'chat_history' => $chat_history
    ];
    
    $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : false;
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . AI_API_KEY,
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => $verify_ssl,
        CURLOPT_SSL_VERIFYHOST => $verify_ssl ? 2 : 0
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        if (isset($data['text'])) {
            return [
                'success' => true,
                'message' => trim($data['text'])
            ];
        }
    }
    
    return ['success' => false, 'error' => 'Cohere API call failed'];
}

/**
 * Call Google Gemini API (FREE Tier)
 */
function callGeminiAPI($messages) {
    if (!function_exists('curl_init')) {
        return ['success' => false, 'error' => 'CURL is not enabled on this server.'];
    }
    
    $url = AI_API_URL . '?key=' . AI_API_KEY;
    $ch = curl_init($url);
    if (!$ch) {
        return ['success' => false, 'error' => 'Failed to initialize CURL'];
    }
    
    // Convert messages format for Gemini
    $parts = [];
    foreach ($messages as $msg) {
        if ($msg['role'] !== 'system') {
            $parts[] = [
                'role' => $msg['role'] === 'user' ? 'user' : 'model',
                'parts' => [['text' => $msg['content']]]
            ];
        }
    }
    
    $data = ['contents' => $parts];
    $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : false;
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => $verify_ssl,
        CURLOPT_SSL_VERIFYHOST => $verify_ssl ? 2 : 0
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return [
                'success' => true,
                'message' => trim($data['candidates'][0]['content']['parts'][0]['text'])
            ];
        }
    }
    
    return ['success' => false, 'error' => 'Gemini API call failed'];
}

/**
 * Call Custom AI API (for other providers)
 */
function callCustomAI($messages) {
    // Implement custom AI API call here
    // This is a placeholder for other AI providers
    
    $ch = curl_init(AI_API_URL);
    
    $data = [
        'messages' => $messages
    ];
    
    $verify_ssl = defined('VERIFY_SSL_CERTIFICATE') ? VERIFY_SSL_CERTIFICATE : false;
    
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
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        return [
            'success' => true,
            'message' => $data['response'] ?? $data['message'] ?? 'Response received'
        ];
    }
    
    return ['success' => false, 'error' => 'Custom AI API call failed'];
}

