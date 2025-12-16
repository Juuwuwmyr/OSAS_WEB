-- Announcements Table
-- Create announcements table for OSAS system

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','urgent','warning') NOT NULL DEFAULT 'info',
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (optional)
-- INSERT INTO `announcements` (`title`, `message`, `type`, `status`, `created_by`) VALUES
-- ('Important: New Violation Policies', 'Effective immediately, new disciplinary policies have been implemented. Please review the updated guidelines.', 'urgent', 'active', 1),
-- ('Violation Exemption', 'Students are allowed to wear a plain white T-shirt tomorrow due to extreme heat conditions. Regular dress code will resume the following day.', 'info', 'active', 1);

