-- Settings Table
-- Stores system configuration and preferences

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','integer','boolean','json') DEFAULT 'string',
  `category` varchar(50) DEFAULT 'general',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_public`) VALUES
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
('primary_color', '#FFD700', 'string', 'appearance', 'Primary color (gold)', 1),
('secondary_color', '#4a2d6d', 'string', 'appearance', 'Secondary color', 1);

