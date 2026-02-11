-- ============================================
-- OSAS - COMPLETE DATABASE SETUP
-- ============================================
-- Run this entire file in phpMyAdmin to set up everything
-- This includes: Database, Tables, Default Users, and Email Config
-- ============================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS osas;
USE osas;

-- ============================================
-- Step 2: Create Tables
-- ============================================

-- Users table for authentication and management
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NULL, -- Added for compatibility with legacy system
    email VARCHAR(100) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(100) NOT NULL,
    remember_token VARCHAR(100) NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    is_active TINYINT(1) DEFAULT 1, -- Added for compatibility with legacy system
    profile_image VARCHAR(500) NULL,
    profile_picture VARCHAR(500) NULL, -- Added for compatibility with legacy system
    google_id VARCHAR(255) NULL,
    facebook_id VARCHAR(255) NULL,
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
    INDEX idx_users_student_id (student_id),
    INDEX idx_users_google_id (google_id),
    INDEX idx_users_facebook_id (facebook_id)
);

-- OTP table for email verification
CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Store pending registration data here until verified
    pending_data JSON NULL,
    INDEX idx_otps_email (email),
    INDEX idx_otps_code (code),
    INDEX idx_otps_expires (expires_at)
);

-- Email configuration table for SMTP settings
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

-- Departments table for academic departments
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50) NOT NULL UNIQUE,
    head_of_department VARCHAR(100) NULL,
    description TEXT,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_status (status)
);

-- Sections table for class sections
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL,
    section_code VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    academic_year VARCHAR(20) NULL,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_department_id (department_id),
    INDEX idx_status (status),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Students table for student information
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contact_number VARCHAR(20) NULL,
    address TEXT,
    department VARCHAR(50) NULL,
    section_id INT NULL,
    yearlevel VARCHAR(20) NULL,
    year_level VARCHAR(20) NOT NULL DEFAULT '1st Year',
    avatar VARCHAR(500) NULL,
    status ENUM('active', 'inactive', 'graduating', 'archived') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_section_id (section_id),
    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_students_year_level (year_level),
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

-- Violation Types table
CREATE TABLE IF NOT EXISTS violation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Violation Levels table
CREATE TABLE IF NOT EXISTS violation_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    violation_type_id INT NOT NULL,
    level_order INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id) ON DELETE CASCADE
);

-- Violations table (Main record)
CREATE TABLE IF NOT EXISTS violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL,
    violation_type_id INT NOT NULL,
    violation_level_id INT NOT NULL,
    department VARCHAR(50) NOT NULL,
    section VARCHAR(20) NOT NULL,
    violation_date DATE NOT NULL,
    violation_time TIME NOT NULL,
    location ENUM('gate_1','gate_2','classroom','library','cafeteria','gym','others') NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    notes TEXT,
    status ENUM('permitted','warning','disciplinary','resolved') NOT NULL DEFAULT 'warning',
    attachments JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_case_id (case_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_violation_date (violation_date),
    FOREIGN KEY (violation_type_id) REFERENCES violation_types(id),
    FOREIGN KEY (violation_level_id) REFERENCES violation_levels(id)
);

-- Student Violation Levels (Tracking current state)
CREATE TABLE IF NOT EXISTS student_violation_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    current_level ENUM('permitted1','permitted2','warning1','warning2','warning3','disciplinary') NOT NULL DEFAULT 'permitted1',
    permitted_count INT NOT NULL DEFAULT '0',
    warning_count INT NOT NULL DEFAULT '0',
    total_violations INT NOT NULL DEFAULT '0',
    last_violation_date DATE DEFAULT NULL,
    last_violation_time TIME DEFAULT NULL,
    last_location VARCHAR(50) DEFAULT NULL,
    last_reported_by VARCHAR(100) DEFAULT NULL,
    last_notes TEXT,
    status ENUM('active','resolved','disciplinary') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_violation (student_id, violation_type),
    INDEX idx_student_id (student_id),
    INDEX idx_violation_type (violation_type)
);

-- Violation History (Log of level changes)
CREATE TABLE IF NOT EXISTS violation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_violation_level_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    previous_level VARCHAR(50) DEFAULT NULL,
    new_level VARCHAR(50) NOT NULL,
    violation_date DATE NOT NULL,
    violation_time TIME NOT NULL,
    location VARCHAR(50) NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    notes TEXT,
    case_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_violation_level_id (student_violation_level_id),
    INDEX idx_student_id (student_id),
    INDEX idx_case_id (case_id),
    FOREIGN KEY (student_violation_level_id) REFERENCES student_violation_levels(id) ON DELETE CASCADE
);

-- Reports table for violation reports
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    student_contact VARCHAR(20) NULL,
    department VARCHAR(100) NULL,
    department_code VARCHAR(20) NULL,
    section VARCHAR(50) NULL,
    section_id INT NULL,
    yearlevel VARCHAR(20) NULL,
    uniform_count INT DEFAULT 0,
    footwear_count INT DEFAULT 0,
    no_id_count INT DEFAULT 0,
    total_violations INT DEFAULT 0,
    status ENUM('permitted', 'warning', 'disciplinary') DEFAULT 'permitted',
    last_violation_date DATE NULL,
    report_period_start DATE NULL,
    report_period_end DATE NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_department (department_code),
    INDEX idx_section (section_id),
    INDEX idx_status (status),
    INDEX idx_generated_at (generated_at),
    INDEX idx_report_period (report_period_start, report_period_end),
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);

-- Report violations table for detailed violation records
CREATE TABLE IF NOT EXISTS report_violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    violation_id INT NULL,
    violation_type VARCHAR(50) NOT NULL,
    violation_level VARCHAR(50) NULL,
    violation_date DATE NOT NULL,
    violation_time TIME NULL,
    status VARCHAR(50) NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_id (report_id),
    INDEX idx_violation_id (violation_id),
    INDEX idx_violation_date (violation_date),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Report recommendations table for disciplinary actions
CREATE TABLE IF NOT EXISTS report_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    recommendation TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_id (report_id),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Announcements table for system announcements
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'urgent', 'warning') NOT NULL DEFAULT 'info',
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    created_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Messages table for communication system
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    sender_role ENUM('admin', 'user') NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_announcement_id (announcement_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

-- Dashboard content table
CREATE TABLE IF NOT EXISTS dashcontents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('tip', 'guideline', 'statistic', 'announcement', 'widget') NOT NULL DEFAULT 'tip',
    target_audience ENUM('admin', 'user', 'both') NOT NULL DEFAULT 'both',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_target_audience (target_audience),
    INDEX idx_display_order (display_order)
);

-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_public (is_public)
);

-- Packages table for membership packages
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    tag VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_tag (tag)
);

-- System tables for authentication and jobs
CREATE TABLE IF NOT EXISTS migrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    migration VARCHAR(100) NOT NULL,
    batch INT NOT NULL,
    UNIQUE KEY uniq_migration (migration)
);

CREATE TABLE IF NOT EXISTS password_resets (
    email VARCHAR(100) NOT NULL,
    token VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL,
    KEY idx_password_resets_email (email),
    KEY idx_password_resets_token (token)
);

CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(100) NOT NULL UNIQUE,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload LONGTEXT NOT NULL,
    exception LONGTEXT NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(100) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_tokenable (tokenable_type, tokenable_id)
);

-- ============================================
-- Step 3: Insert Default Data
-- ============================================

-- Insert default admin user
-- Email: admin@osas.com
-- Password: admin123
-- Bcrypt hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (name, full_name, email, username, password, role, status, is_active, email_verified_at) 
VALUES (
    'OSAS Administrator',
    'OSAS Administrator',
    'admin@osas.com',
    'admin',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    'active',
    1,
    NOW()
);

-- Insert default demo user
-- Email: user@osas.com
-- Password: user123
-- Bcrypt hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (name, full_name, email, username, password, role, contact_number, address, status, is_active, email_verified_at) 
VALUES (
    'Juan Dela Cruz',
    'Juan Dela Cruz',
    'user@osas.com',
    'user',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'user',
    '0917-123-4567',
    'Manila, Philippines',
    'active',
    1,
    NOW()
);

-- ============================================
-- Step 4: Insert Default Departments
-- ============================================

INSERT IGNORE INTO departments (department_name, department_code, status) VALUES
('Computer Science', 'CS', 'active'),
('Business Administration', 'BA', 'active'),
('Nursing', 'NUR', 'active'),
('Bachelor of Science in Information System', 'BSIS', 'active'),
('Welding and Fabrication Technology', 'WFT', 'active'),
('Bachelor of Technical-Vocational Education and Training', 'BTVTEd', 'active'),
('BS Information Technology', 'BSIT', 'active'),
('BS Computer Science', 'BSCS', 'active'),
('BS Business Administration', 'BSBA', 'active'),
('BS Nursing', 'BSN', 'active'),
('Bachelor of Elementary Education', 'BEED', 'active'),
('Bachelor of Secondary Education', 'BSED', 'active');

-- ============================================
-- Step 5: Insert Default Sections
-- ============================================

INSERT IGNORE INTO sections (section_name, section_code, department_id, academic_year, status) VALUES
('BSIT First Year Section A', 'BSIT-1A', 7, '2024-2025', 'active'),
('BSIT First Year Section B', 'BSIT-1B', 7, '2024-2025', 'active'),
('BSIT Second Year Section A', 'BSIT-2A', 7, '2024-2025', 'active'),
('BSIT Second Year Section B', 'BSIT-2B', 7, '2024-2025', 'active'),
('BSIT Third Year Section A', 'BSIT-3A', 7, '2024-2025', 'active'),
('BSIT Third Year Section B', 'BSIT-3B', 7, '2024-2025', 'active'),
('BSIT Fourth Year Section A', 'BSIT-4A', 7, '2024-2025', 'active'),
('BSIT Fourth Year Section B', 'BSIT-4B', 7, '2024-2025', 'active'),
('BSCS First Year Section A', 'BSCS-1A', 8, '2024-2025', 'active'),
('BSCS First Year Section B', 'BSCS-1B', 8, '2024-2025', 'active'),
('BSBA First Year Section A', 'BSBA-1A', 9, '2024-2025', 'active'),
('BSBA First Year Section B', 'BSBA-1B', 9, '2024-2025', 'active'),
('BSN First Year Section A', 'BSN-1A', 10, '2024-2025', 'active'),
('BSN First Year Section B', 'BSN-1B', 10, '2024-2025', 'active'),
('BEED First Year Section A', 'BEED-1A', 11, '2024-2025', 'active'),
('BEED First Year Section B', 'BEED-1B', 11, '2024-2025', 'active'),
('BSED First Year Section A', 'BSED-1A', 12, '2024-2025', 'active'),
('BSED First Year Section B', 'BSED-1B', 12, '2024-2025', 'active');

-- ============================================
-- Step 6: Email Configuration
-- ============================================

-- Delete any existing default configs first
DELETE FROM email_configs WHERE is_default = TRUE;

-- Insert email configuration with Gmail App Password
-- Email: belugaw6@gmail.com
-- App Password: chrq rylp qhrt qytl (spaces removed from: chrq rylp qhrt qytl)
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
) 
VALUES (
    'OSAS Primary Gmail',
    'smtp.gmail.com',
    587,
    'belugaw6@gmail.com',
    'chrqrylpqhrtqytl',  -- Gmail App Password (spaces removed)
    'belugaw6@gmail.com',
    'OSAS',
    TRUE,
    TRUE
);

-- ============================================
-- Step 7: Insert Default Settings
-- ============================================

INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('system_name', 'OSAS System', 'string', 'general', 'System name displayed in the application', 1),
('system_email', 'osas@school.edu', 'string', 'general', 'System email address for notifications', 0),
('system_phone', '+63 912 345 6789', 'string', 'general', 'System contact phone number', 1),
('system_address', 'School Address', 'string', 'general', 'System physical address', 1),
('timezone', 'Asia/Manila', 'string', 'general', 'System timezone', 0),
('date_format', 'Y-m-d', 'string', 'general', 'Date format for display', 0),
('time_format', 'H:i:s', 'string', 'general', 'Time format for display', 0),
('items_per_page', '10', 'integer', 'general', 'Number of items per page in tables', 0),
('enable_notifications', '1', 'boolean', 'notifications', 'Enable system notifications', 0),
('email_notifications', '1', 'boolean', 'notifications', 'Enable email notifications', 0),
('sms_notifications', '0', 'boolean', 'notifications', 'Enable SMS notifications', 0),
('violation_auto_escalate', '1', 'boolean', 'violations', 'Automatically escalate violations after warnings', 0),
('violation_warning_limit', '3', 'integer', 'violations', 'Number of warnings before disciplinary action', 0),
('violation_reminder_days', '7', 'integer', 'violations', 'Days before sending violation reminder', 0),
('report_auto_generate', '0', 'boolean', 'reports', 'Automatically generate reports daily', 0),
('report_retention_days', '365', 'integer', 'reports', 'Number of days to retain reports', 0),
('session_timeout', '30', 'integer', 'security', 'Session timeout in minutes', 0),
('password_min_length', '8', 'integer', 'security', 'Minimum password length', 0),
('password_require_uppercase', '1', 'boolean', 'security', 'Require uppercase letter in password', 0),
('password_require_lowercase', '1', 'boolean', 'security', 'Require lowercase letter in password', 0),
('password_require_number', '1', 'boolean', 'security', 'Require number in password', 0),
('password_require_special', '0', 'boolean', 'security', 'Require special character in password', 0),
('login_attempts_limit', '5', 'integer', 'security', 'Maximum login attempts before lockout', 0),
('lockout_duration', '15', 'integer', 'security', 'Account lockout duration in minutes', 0),
('enable_2fa', '0', 'boolean', 'security', 'Enable two-factor authentication', 0),
('maintenance_mode', '0', 'boolean', 'system', 'Enable maintenance mode', 0),
('maintenance_message', 'System is under maintenance. Please check back later.', 'string', 'system', 'Maintenance mode message', 1),
('backup_enabled', '1', 'boolean', 'system', 'Enable automatic backups', 0),
('backup_frequency', 'daily', 'string', 'system', 'Backup frequency (daily, weekly, monthly)', 0),
('backup_retention', '30', 'integer', 'system', 'Number of backups to retain', 0),
('theme_default', 'light', 'string', 'appearance', 'Default theme (light, dark, auto)', 1),
('logo_url', '', 'string', 'appearance', 'System logo URL', 1),
('favicon_url', '', 'string', 'appearance', 'Favicon URL', 1),
('primary_color', '#000000', 'string', 'appearance', 'Primary color', 1),
('secondary_color', '#E3E3E3', 'string', 'appearance', 'Secondary color', 1);

-- ============================================
-- Step 8: Insert Default Packages
-- ============================================

INSERT IGNORE INTO packages (name, duration, price, tag, description) VALUES
('Walk-in Pass', '1 Day', 200.00, 'Basic', 'Perfect for trying out our facilities'),
('Weekly Pass', '7 Days', 500.00, 'Popular', 'Great for short-term fitness goals'),
('Monthly Membership', '30 Days', 1500.00, 'Best Value', 'Most popular choice for regular gym-goers'),
('3-Month Package', '90 Days', 4000.00, 'Premium', 'Save more with our 3-month package'),
('Annual Membership', '1 Year', 15000.00, 'VIP', 'Best value for long-term commitment');

-- ============================================
-- Step 9: Insert Sample Students
-- ============================================

INSERT IGNORE INTO students (student_id, first_name, last_name, email, contact_number, address, department, section_id, year_level, status) VALUES
('2024-001', 'John', 'Doe', 'john.doe@student.edu', '+63 912 345 6789', '123 Main Street, Quezon City', 'BEED', 15, '1st Year', 'active'),
('2024-002', 'Maria', 'Santos', 'maria.santos@student.edu', '+63 923 456 7890', '456 Oak Avenue, Manila', 'BSIT', 1, '1st Year', 'active'),
('2024-003', 'Robert', 'Chen', 'robert.chen@student.edu', '+63 934 567 8901', '789 Pine Road, Makati', 'BEED', 17, '1st Year', 'active'),
('2024-004', 'Anna', 'Rodriguez', 'anna.rodriguez@student.edu', '+63 945 678 9012', '321 Elm Street, Pasig', 'BSBA', 13, '1st Year', 'active'),
('2024-005', 'Carlos', 'Garcia', 'carlos.garcia@student.edu', '+63 956 789 0123', '654 Maple Drive, Mandaluyong', 'BSN', 17, '1st Year', 'active');

-- ============================================
-- Step 10: Insert Sample Announcements
-- ============================================

INSERT IGNORE INTO announcements (title, message, type, status, created_by) VALUES
('System Maintenance', 'The system will undergo maintenance tonight at 10 PM.', 'warning', 'active', 1),
('Enrollment Open', 'Enrollment for the next semester is now open.', 'info', 'active', 1),
('Holiday Notice', 'Classes are suspended due to a public holiday.', 'info', 'active', 1),
('New Policy Update', 'Please review the updated student handbook.', 'info', 'active', 1),
('Payment Deadline', 'Tuition payment deadline is on Friday.', 'warning', 'active', 1);

-- ============================================
-- Step 11: Insert Violation Types and Levels
-- ============================================

INSERT INTO `violation_types` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Improper Uniform', 'Wearing colored undershirt, improper pants, etc.', '2026-02-04 21:42:49', NULL),
(2, 'No ID', 'Failure to wear or bring student ID', '2026-02-04 21:42:49', NULL),
(3, 'Improper Footwear', 'Wearing slippers, open-toed shoes, etc.', '2026-02-04 21:42:49', NULL),
(4, 'Misconduct', 'Behavioral violations', '2026-02-04 21:42:49', NULL);

INSERT INTO `violation_levels` (`id`, `violation_type_id`, `level_order`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Permitted 1', 'First permitted instance', '2026-02-04 21:42:49', NULL),
(2, 1, 2, 'Permitted 2', 'Second permitted instance', '2026-02-04 21:42:49', NULL),
(3, 1, 3, 'Warning 1', 'First warning', '2026-02-04 21:42:49', NULL),
(4, 1, 4, 'Warning 2', 'Second warning', '2026-02-04 21:42:49', NULL),
(5, 1, 5, 'Warning 3', 'Final warning', '2026-02-04 21:42:49', NULL),
(6, 1, 6, 'Disciplinary Action', 'Referral to discipline office', '2026-02-04 21:42:49', NULL),
(7, 2, 1, 'Permitted 1', 'First permitted instance', '2026-02-04 21:42:49', NULL),
(8, 2, 2, 'Permitted 2', 'Second permitted instance', '2026-02-04 21:42:49', NULL),
(9, 2, 3, 'Warning 1', 'First warning', '2026-02-04 21:42:49', NULL),
(10, 2, 4, 'Warning 2', 'Second warning', '2026-02-04 21:42:49', NULL),
(11, 2, 5, 'Warning 3', 'Final warning', '2026-02-04 21:42:49', NULL),
(12, 2, 6, 'Disciplinary Action', 'Referral to discipline office', '2026-02-04 21:42:49', NULL),
(13, 3, 1, 'Permitted 1', 'First permitted instance', '2026-02-04 21:42:49', NULL),
(14, 3, 2, 'Permitted 2', 'Second permitted instance', '2026-02-04 21:42:49', NULL),
(15, 3, 3, 'Warning 1', 'First warning', '2026-02-04 21:42:49', NULL),
(16, 3, 4, 'Warning 2', 'Second warning', '2026-02-04 21:42:49', NULL),
(17, 3, 5, 'Warning 3', 'Final warning', '2026-02-04 21:42:49', NULL),
(18, 3, 6, 'Disciplinary Action', 'Referral to discipline office', '2026-02-04 21:42:49', NULL),
(19, 4, 1, 'Permitted 1', 'First permitted instance', '2026-02-04 21:42:49', NULL),
(20, 4, 2, 'Permitted 2', 'Second permitted instance', '2026-02-04 21:42:49', NULL),
(21, 4, 3, 'Warning 1', 'First warning', '2026-02-04 21:42:49', NULL),
(22, 4, 4, 'Warning 2', 'Second warning', '2026-02-04 21:42:49', NULL),
(23, 4, 5, 'Warning 3', 'Final warning', '2026-02-04 21:42:49', NULL),
(24, 4, 6, 'Disciplinary Action', 'Referral to discipline office', '2026-02-04 21:42:49', NULL);

-- ============================================
-- Step 12: Create Stored Procedures and Functions
-- ============================================

DELIMITER $$
DROP PROCEDURE IF EXISTS `add_student_violation`$$
CREATE PROCEDURE `add_student_violation` (IN `p_student_id` VARCHAR(50), IN `p_violation_type` VARCHAR(50), IN `p_violation_date` DATE, IN `p_violation_time` TIME, IN `p_location` VARCHAR(50), IN `p_reported_by` VARCHAR(100), IN `p_notes` TEXT, IN `p_case_id` VARCHAR(50))   BEGIN
        DECLARE v_current_level VARCHAR(50) DEFAULT NULL;
        DECLARE v_previous_level VARCHAR(50) DEFAULT NULL;
        DECLARE v_permitted_count INT DEFAULT 0;
        DECLARE v_warning_count INT DEFAULT 0;
        DECLARE v_total_violations INT DEFAULT 0;
        DECLARE v_level_id INT DEFAULT NULL;
        DECLARE v_new_level VARCHAR(50) DEFAULT NULL;
        
        -- Check if student violation level exists
        SELECT id, current_level, permitted_count, warning_count, total_violations
        INTO v_level_id, v_current_level, v_permitted_count, v_warning_count, v_total_violations
        FROM student_violation_levels
        WHERE student_id = p_student_id 
          AND violation_type = p_violation_type;
        
        IF v_level_id IS NULL THEN
            -- Create new violation level record
            INSERT INTO student_violation_levels (
                student_id, violation_type, current_level, 
                permitted_count, warning_count, total_violations,
                last_violation_date, last_violation_time, last_location,
                last_reported_by, last_notes, status
            ) VALUES (
                p_student_id, p_violation_type, 'permitted1',
                1, 0, 1,
                p_violation_date, p_violation_time, p_location,
                p_reported_by, p_notes, 'active'
            );
            
            SET v_level_id = LAST_INSERT_ID();
            SET v_previous_level = NULL;
            SET v_new_level = 'permitted1';
            SET v_total_violations = 1;
        ELSE
            -- Update existing record
            SET v_previous_level = v_current_level;
            SET v_total_violations = v_total_violations + 1;
            
            -- Determine new level based on total violations
            SET v_new_level = get_next_violation_level(v_current_level, v_total_violations);
            
            -- Update counts based on new level
            IF v_new_level LIKE 'permitted%' THEN
                SET v_permitted_count = v_permitted_count + 1;
            ELSEIF v_new_level LIKE 'warning%' THEN
                SET v_warning_count = v_warning_count + 1;
            END IF;
            
            -- Update the violation level record
            UPDATE student_violation_levels SET
                current_level = v_new_level,
                permitted_count = v_permitted_count,
                warning_count = v_warning_count,
                total_violations = v_total_violations,
                last_violation_date = p_violation_date,
                last_violation_time = p_violation_time,
                last_location = p_location,
                last_reported_by = p_reported_by,
                last_notes = p_notes,
                status = IF(v_new_level = 'disciplinary', 'disciplinary', 'active'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_level_id;
        END IF;
        
        -- Add to history
        INSERT INTO violation_history (
            student_violation_level_id, student_id, violation_type,
            previous_level, new_level, violation_date, violation_time,
            location, reported_by, notes, case_id
        ) VALUES (
            v_level_id, p_student_id, p_violation_type,
            v_previous_level, v_new_level, p_violation_date, p_violation_time,
            p_location, p_reported_by, p_notes, p_case_id
        );
        
        -- Return the result
        SELECT 
            v_level_id as id,
            p_student_id as student_id,
            p_violation_type as violation_type,
            v_new_level as current_level,
            v_permitted_count as permitted_count,
            v_warning_count as warning_count,
            v_total_violations as total_violations,
            p_case_id as case_id;
    END$$

DROP FUNCTION IF EXISTS `get_next_violation_level`$$
CREATE FUNCTION `get_next_violation_level` (`current_level` VARCHAR(50), `total_violations` INT) RETURNS VARCHAR(50) DETERMINISTIC READS SQL DATA BEGIN
        DECLARE next_level VARCHAR(50);
        
        CASE current_level
            WHEN 'permitted1' THEN
                SET next_level = IF(total_violations >= 2, 'permitted2', 'permitted1');
            WHEN 'permitted2' THEN
                SET next_level = IF(total_violations >= 3, 'warning1', 'permitted2');
            WHEN 'warning1' THEN
                SET next_level = IF(total_violations >= 4, 'warning2', 'warning1');
            WHEN 'warning2' THEN
                SET next_level = IF(total_violations >= 5, 'warning3', 'warning2');
            WHEN 'warning3' THEN
                SET next_level = IF(total_violations >= 6, 'disciplinary', 'warning3');
            ELSE
                SET next_level = 'disciplinary';
        END CASE;
        
        RETURN next_level;
    END$$
DELIMITER ;

-- ============================================
-- Step 13: Record Initial Migration
-- ============================================

INSERT IGNORE INTO migrations (migration, batch) VALUES
('initial_osas_setup', 1);

-- ============================================
-- Step 12: Verify Setup
-- ============================================

-- Check if everything was created successfully
SELECT 'OSAS Database Setup Complete!' AS Status;

SELECT 
    'Users Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM users
UNION ALL
SELECT 
    'Departments Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM departments
UNION ALL
SELECT 
    'Sections Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM sections
UNION ALL
SELECT 
    'Students Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM students
UNION ALL
SELECT 
    'Violations Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM violations
UNION ALL
SELECT 
    'Reports Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM reports
UNION ALL
SELECT 
    'Announcements Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM announcements
UNION ALL
SELECT 
    'Settings Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM settings
UNION ALL
SELECT 
    'Email Configs Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM email_configs
UNION ALL
SELECT 
    'Packages Table' AS TableName,
    COUNT(*) AS RecordCount 
FROM packages;

-- Show email configuration
SELECT 
    name,
    smtp_host,
    smtp_port,
    smtp_username,
    CASE 
        WHEN smtp_password IS NOT NULL AND smtp_password != '' THEN '***SET***'
        ELSE 'NOT SET'
    END AS password_status,
    from_email,
    from_name,
    is_active,
    is_default
FROM email_configs
WHERE is_default = TRUE;

-- Show default users
SELECT 
    name,
    email,
    role,
    status,
    CASE 
        WHEN email_verified_at IS NOT NULL THEN 'VERIFIED'
        ELSE 'NOT VERIFIED'
    END AS email_status
FROM users
WHERE role IN ('admin', 'user')
ORDER BY role, name;

-- ============================================
-- Setup Complete!
-- ============================================
-- Next Steps:
-- 1. Test email: Visit http://localhost/OSAS_WEB/test-smtp.php
-- 2. Test login: Go to your website and login with:
--    - Admin: admin@osas.com / admin123
--    - User: user@osas.com / user123
-- 3. Check inbox at belugaw6@gmail.com for OTP verification
-- 4. Access admin panels:
--    - Departments: http://localhost/OSAS_WEB/app/views/admin/department.php
--    - Students: http://localhost/OSAS_WEB/app/views/admin/students.php
--    - Violations: http://localhost/OSAS_WEB/app/views/admin/violations.php
--    - Reports: http://localhost/OSAS_WEB/app/views/admin/reports.php
--    - Announcements: http://localhost/OSAS_WEB/app/views/admin/announcements.php
-- 5. Run migrations if needed: php migrate.php
-- ============================================
