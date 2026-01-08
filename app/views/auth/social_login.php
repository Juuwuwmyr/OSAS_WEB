<?php
/**
 * Social Login Handler (Firebase)
 * 
 * This file handles social login requests from Firebase Authentication.
 * It receives user data from the frontend and creates/updates the user in the database.
 */

header('Content-Type: application/json');
session_start();

// Include database connection
require_once __DIR__ . '/../../core/Database.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request data'
    ]);
    exit;
}

// Extract user data
$uid = $input['uid'] ?? '';
$email = $input['email'] ?? '';
$displayName = $input['displayName'] ?? '';
$firstName = $input['firstName'] ?? '';
$lastName = $input['lastName'] ?? '';
$photoURL = $input['photoURL'] ?? '';
$provider = $input['provider'] ?? '';
$token = $input['token'] ?? '';

// Validate required fields
if (empty($email) || empty($uid)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email and UID are required'
    ]);
    exit;
}

try {
    // Connect to database
    $db = Database::getInstance();

    // Verify required columns exist (check by trying to select them)
    try {
        $testQuery = $db->query("SELECT google_id, facebook_id, profile_picture FROM users LIMIT 1");
    } catch (Exception $colError) {
        // Columns don't exist - return helpful error
        echo json_encode([
            'status' => 'error',
            'message' => 'Database columns missing. Please run the migration SQL: database/migrations/add_social_login_columns.sql',
            'details' => 'Required columns: google_id, facebook_id, profile_picture'
        ]);
        exit;
    }

    // Check if user already exists with this email
    $existingUser = $db->query("SELECT * FROM users WHERE email = ?", [$email]);

    if ($existingUser && count($existingUser) > 0) {
        // User exists, update social provider ID and log them in
        $user = $existingUser[0];
        
        // Update provider ID based on login method
        if ($provider === 'google' && empty($user['google_id'])) {
            $db->query("UPDATE users SET google_id = ? WHERE id = ?", [$uid, $user['id']]);
        } elseif ($provider === 'facebook' && empty($user['facebook_id'])) {
            $db->query("UPDATE users SET facebook_id = ? WHERE id = ?", [$uid, $user['id']]);
        }

        // Update profile picture if not set
        if (empty($user['profile_picture']) && !empty($photoURL)) {
            $db->query("UPDATE users SET profile_picture = ? WHERE id = ?", [$photoURL, $user['id']]);
        }

        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];

        // Set cookies for remember me (30 days)
        $expiry = time() + (30 * 24 * 60 * 60);
        setcookie('user_id', $user['id'], $expiry, '/');
        setcookie('username', $user['username'], $expiry, '/');
        setcookie('role', $user['role'], $expiry, '/');

        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful',
            'name' => $user['first_name'] . ' ' . $user['last_name'],
            'role' => $user['role'],
            'user_id' => $user['id'],
            'expires' => $expiry
        ]);

    } else {
        // User doesn't exist, create new account
        $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $displayName)) . rand(100, 999);
        
        // Make sure username is unique
        $usernameCheck = $db->query("SELECT id FROM users WHERE username = ?", [$username]);
        while ($usernameCheck && count($usernameCheck) > 0) {
            $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $displayName)) . rand(1000, 9999);
            $usernameCheck = $db->query("SELECT id FROM users WHERE username = ?", [$username]);
        }

        // Prepare provider-specific fields
        $googleId = ($provider === 'google') ? $uid : null;
        $facebookId = ($provider === 'facebook') ? $uid : null;

        // Insert new user
        $insertQuery = "INSERT INTO users (username, email, first_name, last_name, google_id, facebook_id, profile_picture, role, password, created_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, 'user', '', NOW())";
        
        $db->query($insertQuery, [
            $username,
            $email,
            $firstName ?: $displayName,
            $lastName ?: '',
            $googleId,
            $facebookId,
            $photoURL
        ]);

        // Get the new user
        $newUser = $db->query("SELECT * FROM users WHERE email = ?", [$email]);

        if ($newUser && count($newUser) > 0) {
            $user = $newUser[0];

            // Set session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = 'user';
            $_SESSION['name'] = ($firstName ?: $displayName) . ' ' . $lastName;

            // Set cookies (30 days)
            $expiry = time() + (30 * 24 * 60 * 60);
            setcookie('user_id', $user['id'], $expiry, '/');
            setcookie('username', $user['username'], $expiry, '/');
            setcookie('role', 'user', $expiry, '/');

            echo json_encode([
                'status' => 'success',
                'message' => 'Account created and logged in successfully',
                'name' => ($firstName ?: $displayName) . ' ' . $lastName,
                'role' => 'user',
                'user_id' => $user['id'],
                'expires' => $expiry
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to create account'
            ]);
        }
    }

} catch (Exception $e) {
    error_log('Social Login Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    
    // Provide more detailed error message for debugging
    $errorMessage = 'An error occurred during login';
    if (strpos($e->getMessage(), 'Column') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
        $errorMessage = 'Database column missing. Please run the migration SQL to add google_id, facebook_id, and profile_picture columns.';
    } elseif (strpos($e->getMessage(), 'Table') !== false) {
        $errorMessage = 'Database table not found. Please check your database configuration.';
    } elseif (strpos($e->getMessage(), 'SQL') !== false) {
        $errorMessage = 'Database error: ' . $e->getMessage();
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => $errorMessage,
        'debug' => (defined('DEBUG') && DEBUG) ? $e->getMessage() : null
    ]);
}

