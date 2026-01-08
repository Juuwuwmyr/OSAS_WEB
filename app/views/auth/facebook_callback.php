<?php
/**
 * Facebook OAuth Callback Handler
 * 
 * This file handles the OAuth callback from Facebook after user authorization.
 * 
 * Setup Instructions:
 * 1. Go to https://developers.facebook.com/
 * 2. Create a new app or select existing one
 * 3. Add "Facebook Login" product
 * 4. Go to Facebook Login > Settings
 * 5. Add valid OAuth redirect URI: http://yourdomain.com/app/views/auth/facebook_callback.php
 * 6. Go to Settings > Basic to get App ID and App Secret
 * 7. Copy App ID and App Secret below
 */

session_start();

// ============================================
// FACEBOOK OAUTH CONFIGURATION
// ============================================
// Replace these with your actual Facebook OAuth credentials
define('FACEBOOK_APP_ID', 'YOUR_FACEBOOK_APP_ID');
define('FACEBOOK_APP_SECRET', 'YOUR_FACEBOOK_APP_SECRET');
define('FACEBOOK_REDIRECT_URI', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . "/app/views/auth/facebook_callback.php");

// Include database connection
require_once __DIR__ . '/../../core/Database.php';

// Check if we have an authorization code
if (!isset($_GET['code'])) {
    // Check for error
    if (isset($_GET['error'])) {
        header('Location: ../../../index.php?error=facebook_auth_denied');
        exit;
    }
    header('Location: ../../../index.php?error=facebook_auth_failed');
    exit;
}

$code = $_GET['code'];
$action = $_GET['action'] ?? 'login'; // 'login' or 'signup'

try {
    // Exchange authorization code for access token
    $tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token?' . http_build_query([
        'client_id' => FACEBOOK_APP_ID,
        'client_secret' => FACEBOOK_APP_SECRET,
        'redirect_uri' => FACEBOOK_REDIRECT_URI,
        'code' => $code
    ]);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tokenUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $tokenResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('Failed to get access token from Facebook');
    }

    $tokenData = json_decode($tokenResponse, true);
    
    if (!isset($tokenData['access_token'])) {
        throw new Exception('No access token in response');
    }

    $accessToken = $tokenData['access_token'];

    // Get user info from Facebook
    $userInfoUrl = 'https://graph.facebook.com/v18.0/me?' . http_build_query([
        'fields' => 'id,name,email,first_name,last_name,picture.type(large)',
        'access_token' => $accessToken
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $userInfoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $userInfoResponse = curl_exec($ch);
    curl_close($ch);

    $userInfo = json_decode($userInfoResponse, true);

    if (!isset($userInfo['email'])) {
        // Facebook might not return email if user hasn't verified it
        // or has restricted email access
        throw new Exception('Could not get email from Facebook. Please ensure your email is verified on Facebook.');
    }

    // User data from Facebook
    $facebookId = $userInfo['id'];
    $email = $userInfo['email'];
    $name = $userInfo['name'] ?? '';
    $firstName = $userInfo['first_name'] ?? '';
    $lastName = $userInfo['last_name'] ?? '';
    $picture = isset($userInfo['picture']['data']['url']) ? $userInfo['picture']['data']['url'] : '';

    // Connect to database
    $db = Database::getInstance();

    // Check if user already exists with this email
    $existingUser = $db->query("SELECT * FROM users WHERE email = ?", [$email]);

    if ($existingUser && count($existingUser) > 0) {
        // User exists, log them in
        $user = $existingUser[0];
        
        // Update Facebook ID if not set
        if (empty($user['facebook_id'])) {
            $db->query("UPDATE users SET facebook_id = ? WHERE id = ?", [$facebookId, $user['id']]);
        }

        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];

        // Set cookies for remember me
        $expiry = time() + (30 * 24 * 60 * 60); // 30 days
        setcookie('user_id', $user['id'], $expiry, '/');
        setcookie('username', $user['username'], $expiry, '/');
        setcookie('role', $user['role'], $expiry, '/');

        // Redirect based on role
        if ($user['role'] === 'admin') {
            header('Location: ../../../includes/dashboard.php');
        } else {
            header('Location: ../../../includes/user_dashboard.php');
        }
        exit;

    } else {
        // User doesn't exist
        if ($action === 'signup') {
            // Create new user
            $username = strtolower(str_replace(' ', '', $name)) . rand(100, 999);
            
            $insertQuery = "INSERT INTO users (username, email, first_name, last_name, facebook_id, profile_picture, role, password, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, 'user', '', NOW())";
            
            $db->query($insertQuery, [$username, $email, $firstName, $lastName, $facebookId, $picture]);
            
            // Get the new user
            $newUser = $db->query("SELECT * FROM users WHERE email = ?", [$email]);
            
            if ($newUser && count($newUser) > 0) {
                $user = $newUser[0];
                
                // Set session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = 'user';
                $_SESSION['name'] = $firstName . ' ' . $lastName;

                // Set cookies
                $expiry = time() + (30 * 24 * 60 * 60);
                setcookie('user_id', $user['id'], $expiry, '/');
                setcookie('username', $user['username'], $expiry, '/');
                setcookie('role', 'user', $expiry, '/');

                header('Location: ../../../includes/user_dashboard.php');
                exit;
            }
        } else {
            // Trying to login but no account exists
            header('Location: ../../../index.php?error=no_account&email=' . urlencode($email));
            exit;
        }
    }

} catch (Exception $e) {
    error_log('Facebook OAuth Error: ' . $e->getMessage());
    header('Location: ../../../index.php?error=facebook_auth_failed&message=' . urlencode($e->getMessage()));
    exit;
}

