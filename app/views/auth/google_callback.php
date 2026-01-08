<?php
/**
 * Google OAuth Callback Handler
 * 
 * This file handles the OAuth callback from Google after user authorization.
 * 
 * Setup Instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google+ API
 * 4. Go to Credentials > Create Credentials > OAuth Client ID
 * 5. Set Application type to "Web application"
 * 6. Add authorized redirect URI: http://yourdomain.com/app/views/auth/google_callback.php
 * 7. Copy Client ID and Client Secret below
 */

session_start();

// ============================================
// GOOGLE OAUTH CONFIGURATION
// ============================================
// Replace these with your actual Google OAuth credentials
define('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET');
define('GOOGLE_REDIRECT_URI', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . "/app/views/auth/google_callback.php");

// Include database connection
require_once __DIR__ . '/../../core/Database.php';

// Check if we have an authorization code
if (!isset($_GET['code'])) {
    // No code, redirect to login with error
    header('Location: ../../../index.php?error=google_auth_failed');
    exit;
}

$code = $_GET['code'];
$action = $_GET['action'] ?? 'login'; // 'login' or 'signup'

try {
    // Exchange authorization code for access token
    $tokenUrl = 'https://oauth2.googleapis.com/token';
    $tokenData = [
        'code' => $code,
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri' => GOOGLE_REDIRECT_URI,
        'grant_type' => 'authorization_code'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $tokenResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('Failed to get access token from Google');
    }

    $tokenData = json_decode($tokenResponse, true);
    
    if (!isset($tokenData['access_token'])) {
        throw new Exception('No access token in response');
    }

    $accessToken = $tokenData['access_token'];

    // Get user info from Google
    $userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $userInfoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    
    $userInfoResponse = curl_exec($ch);
    curl_close($ch);

    $userInfo = json_decode($userInfoResponse, true);

    if (!isset($userInfo['email'])) {
        throw new Exception('Could not get email from Google');
    }

    // User data from Google
    $googleId = $userInfo['id'];
    $email = $userInfo['email'];
    $name = $userInfo['name'] ?? '';
    $firstName = $userInfo['given_name'] ?? '';
    $lastName = $userInfo['family_name'] ?? '';
    $picture = $userInfo['picture'] ?? '';

    // Connect to database
    $db = Database::getInstance();

    // Check if user already exists with this email
    $existingUser = $db->query("SELECT * FROM users WHERE email = ?", [$email]);

    if ($existingUser && count($existingUser) > 0) {
        // User exists, log them in
        $user = $existingUser[0];
        
        // Update Google ID if not set
        if (empty($user['google_id'])) {
            $db->query("UPDATE users SET google_id = ? WHERE id = ?", [$googleId, $user['id']]);
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
            
            $insertQuery = "INSERT INTO users (username, email, first_name, last_name, google_id, profile_picture, role, password, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, 'user', '', NOW())";
            
            $db->query($insertQuery, [$username, $email, $firstName, $lastName, $googleId, $picture]);
            
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
    error_log('Google OAuth Error: ' . $e->getMessage());
    header('Location: ../../../index.php?error=google_auth_failed&message=' . urlencode($e->getMessage()));
    exit;
}

