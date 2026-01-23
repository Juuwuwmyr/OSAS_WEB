CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(255) NOT NULL,
  `student_contact` VARCHAR(100) NULL,
  `department` VARCHAR(255) NULL,
  `department_code` VARCHAR(50) NULL,
  `section` VARCHAR(100) NULL,
  `section_id` VARCHAR(50) NULL,
  `yearlevel` VARCHAR(20) NULL,
  `uniform_count` INT NOT NULL DEFAULT 0,
  `footwear_count` INT NOT NULL DEFAULT 0,
  `no_id_count` INT NOT NULL DEFAULT 0,
  `total_violations` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'permitted',
  `last_violation_date` DATE NULL,
  `report_period_start` DATE NULL,
  `report_period_end` DATE NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_reports_report_id` (`report_id`),
  KEY `idx_reports_student_id` (`student_id`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_total_violations` (`total_violations`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_violations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_id` INT NOT NULL,
  `violation_id` INT NOT NULL,
  `violation_type` VARCHAR(100) NOT NULL,
  `violation_level` VARCHAR(100) NULL,
  `violation_date` DATE NULL,
  `violation_time` TIME NULL,
  `status` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_report_violation` (`report_id`, `violation_id`),
  KEY `idx_report_violations_report_id` (`report_id`),
  KEY `idx_report_violations_violation_id` (`violation_id`),
  CONSTRAINT `fk_report_violations_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_recommendations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_id` INT NOT NULL,
  `recommendation` TEXT NOT NULL,
  `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_recommendations_report_id` (`report_id`),
  KEY `idx_report_recommendations_priority` (`priority`),
  CONSTRAINT `fk_report_recommendations_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
