-- Reports Table
-- Stores generated violation reports for students
-- This table aggregates violation data by student for reporting purposes

CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` varchar(50) NOT NULL UNIQUE,
  `student_id` varchar(50) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `student_contact` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `department_code` varchar(20) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `uniform_count` int(11) DEFAULT 0,
  `footwear_count` int(11) DEFAULT 0,
  `no_id_count` int(11) DEFAULT 0,
  `total_violations` int(11) DEFAULT 0,
  `status` enum('permitted','warning','disciplinary') DEFAULT 'permitted',
  `last_violation_date` date DEFAULT NULL,
  `report_period_start` date DEFAULT NULL,
  `report_period_end` date DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_report_id` (`report_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_department` (`department_code`),
  KEY `idx_section` (`section_id`),
  KEY `idx_status` (`status`),
  KEY `idx_generated_at` (`generated_at`),
  KEY `idx_report_period` (`report_period_start`, `report_period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Violations History Table
-- Stores detailed violation history for each report
CREATE TABLE IF NOT EXISTS `report_violations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `violation_id` int(11) DEFAULT NULL,
  `violation_type` varchar(50) NOT NULL,
  `violation_level` varchar(50) DEFAULT NULL,
  `violation_date` date NOT NULL,
  `violation_time` time DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_id` (`report_id`),
  KEY `idx_violation_id` (`violation_id`),
  KEY `idx_violation_date` (`violation_date`),
  CONSTRAINT `fk_report_violations_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Recommendations Table
-- Stores recommendations for each report
CREATE TABLE IF NOT EXISTS `report_recommendations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `recommendation` text NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_id` (`report_id`),
  CONSTRAINT `fk_report_recommendations_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster queries
CREATE INDEX idx_reports_student_dept ON reports(student_id, department_code);
CREATE INDEX idx_reports_status_date ON reports(status, generated_at);

