-- ============================================
-- OSAS - AUTH / OTP / EMAIL CONFIG SETUP ONLY
-- ============================================
-- Run this file in phpMyAdmin to set up ONLY:
--   - users
--   - otps
--   - email_configs
-- ============================================

CREATE DATABASE IF NOT EXISTS osas;
USE osas;

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(100) NOT NULL,
    remember_token VARCHAR(100) NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    profile_image VARCHAR(500) NULL,
    contact_number VARCHAR(20) NULL,
    address TEXT,
    department VARCHAR(100) NULL,
    two_factor_secret VARCHAR(100) NULL,
    two_factor_recovery_codes TEXT NULL,
    two_factor_confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_deleted_at (deleted_at),
    INDEX idx_users_username (username),
    INDEX idx_users_student_id (student_id)
);

-- OTP table (email verification)
CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pending_data JSON NULL,
    INDEX idx_otps_email (email),
    INDEX idx_otps_code (code),
    INDEX idx_otps_expires (expires_at)
);

-- Email configuration table (SMTP settings)
CREATE TABLE IF NOT EXISTS email_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    smtp_host VARCHAR(100) NOT NULL,
    smtp_port INT NOT NULL,
    smtp_username VARCHAR(100) NULL,
    smtp_password VARCHAR(100) NULL,
    from_email VARCHAR(100) NOT NULL,
    from_name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_configs_active (is_active),
    INDEX idx_email_configs_default (is_default)
);

-- Optional: default email config (edit values if needed)
INSERT INTO email_configs (
    name,
    smtp_host,
    smtp_port,
    smtp_username,
    smtp_password,
    from_email,
    from_name,
    is_active,
    is_default
) VALUES (
    'Default SMTP',
    'smtp.gmail.com',
    587,
    'your_email@gmail.com',
    'your_app_password',
    'your_email@gmail.com',
    'OSAS',
    1,
    1
)
ON DUPLICATE KEY UPDATE
    smtp_host = VALUES(smtp_host),
    smtp_port = VALUES(smtp_port),
    smtp_username = VALUES(smtp_username),
    smtp_password = VALUES(smtp_password),
    from_email = VALUES(from_email),
    from_name = VALUES(from_name),
    is_active = VALUES(is_active),
    is_default = VALUES(is_default);
