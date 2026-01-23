<?php
/**
 * Main Entry Point - Redirects to Landing Page
 * This file serves as the main entry point and redirects to the landing page
 * or login page based on user authentication status
 */

// Check if user wants to go directly to login (bypass landing page)
$directLogin = isset($_GET['direct']) && $_GET['direct'] === 'true';

// Check if user is already logged in
session_start();
if (isset($_COOKIE['user_id']) && isset($_COOKIE['role'])) {
    // Restore session from cookies
    $_SESSION['user_id'] = $_COOKIE['user_id'];
    $_SESSION['username'] = $_COOKIE['username'] ?? '';
    $_SESSION['role'] = $_COOKIE['role'];
    
    // Redirect to appropriate dashboard
    if ($_SESSION['role'] === 'admin') {
        header('Location: includes/dashboard.php');
        exit;
    } elseif ($_SESSION['role'] === 'user') {
        header('Location: includes/user_dashboard.php');
        exit;
    }
}

// Also check session (fallback)
if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
    if ($_SESSION['role'] === 'admin') {
        header('Location: includes/dashboard.php');
        exit;
    } elseif ($_SESSION['role'] === 'user') {
        header('Location: includes/user_dashboard.php');
        exit;
    }
}

// If user is not logged in and not requesting direct login, redirect to landing page
if (!$directLogin) {
    header('Location: landing.php');
    exit;
}

// If direct login is requested, show the login page
// Include the original login page content
require_once __DIR__ . '/login_page.php';
?>
