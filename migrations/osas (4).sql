-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jan 23, 2026 at 03:03 AM
-- Server version: 8.3.0
-- PHP Version: 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `osas`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','urgent','warning') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `message`, `type`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'System Maintenance', 'The system will undergo maintenance tonight at 10 PM.', '', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 18:03:17', NULL),
(2, 'Enrollment Open', 'Enrollment for the next semester is now open.', 'info', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 18:03:25', NULL),
(3, 'Holiday Notice', 'Classes are suspended due to a public holiday.', 'info', 'active', 2, '2025-12-15 16:25:36', '2025-12-15 18:03:35', NULL),
(4, 'Exam Schedule', 'The final exam schedule has been posted.', '', 'archived', 2, '2025-12-15 16:25:36', '2026-01-08 20:55:52', NULL),
(5, 'Server Downtime', 'Temporary server downtime may occur this weekend.', 'warning', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(6, 'New Policy Update', 'Please review the updated student handbook.', 'info', 'active', 3, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(7, 'Payment Deadline', 'Tuition payment deadline is on Friday.', 'warning', 'active', 3, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(8, 'Library Closed', 'The library will be closed for renovation.', '', 'active', 2, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(9, 'Seminar Announcement', 'A leadership seminar will be held in the auditorium.', '', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(10, 'System Upgrade', 'New system features have been deployed.', 'info', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(11, 'Network Issue', 'Some users may experience network interruptions.', 'warning', '', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(12, 'Sports Fest', 'Annual sports fest starts next week.', '', 'active', 2, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(13, 'ID Registration', 'Student ID registration is ongoing.', 'info', 'active', 3, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(14, 'Class Resumption', 'Classes will resume on Monday.', 'info', 'active', 2, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(15, 'Fire Drill', 'A campus-wide fire drill will be conducted.', '', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(16, 'Parking Advisory', 'Limited parking slots available today.', 'warning', 'active', 3, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(17, 'System Bug Fix', 'Reported bugs have been fixed.', '', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(18, 'Workshop Invite', 'Join the career development workshop.', '', 'active', 2, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(19, 'Account Security', 'Enable two-factor authentication for security.', 'warning', 'active', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL),
(20, 'Announcement Test', 'This is a test announcement record.', 'info', '', 1, '2025-12-15 16:25:36', '2025-12-15 16:25:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dashcontents`
--

DROP TABLE IF EXISTS `dashcontents`;
CREATE TABLE IF NOT EXISTS `dashcontents` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('tip','guideline','statistic','announcement','widget') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tip',
  `target_audience` enum('admin','user','both') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dashcontents_status_index` (`status`),
  KEY `dashcontents_target_audience_index` (`target_audience`),
  KEY `dashcontents_display_order_index` (`display_order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `head_of_department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_code` (`department_code`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `department_name`, `department_code`, `head_of_department`, `description`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Computer Science', 'CS', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(2, 'Business Administration', 'BA', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(3, 'Nursing', 'NUR', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(4, 'Bachelor of Science in Information System', 'BSIS', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(5, 'Welding and Fabrication Technology', 'WFT', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(6, 'Bachelor of Technical-Vocational Education and Training', 'BTVTEd', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(7, 'BS Information Technology', 'BSIT', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(8, 'BS Computer Science', 'BSCS', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(9, 'BS Business Administration', 'BSBA', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(10, 'BS Nursing', 'BSN', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(11, 'Bachelor of Elementary Education', 'BEED', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL),
(12, 'Bachelor of Secondary Education', 'BSED', NULL, NULL, 'active', '2025-12-14 09:38:55', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement_id` int NOT NULL,
  `sender_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_role` enum('admin','user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_announcement_id` (`announcement_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `announcement_id`, `sender_id`, `sender_role`, `sender_name`, `message`, `is_read`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 5, '2023-0195', 'user', 'Unknown', 'why', 1, '2026-01-12 15:35:08', '2026-01-12 23:35:49', NULL),
(2, 5, '2023-0195', 'user', 'Unknown', 'hey', 1, '2026-01-12 15:35:24', '2026-01-12 23:35:49', NULL),
(3, 5, '2023', 'admin', 'Unknown', 'kasi maan ngayun', 1, '2026-01-12 15:36:11', '2026-01-12 23:36:29', NULL),
(4, 7, '2023-0195', 'user', 'Jumyr Manalo Moreno', 'hey', 1, '2026-01-12 15:41:01', '2026-01-12 23:47:26', NULL),
(5, 7, '2023-0195', 'user', 'Jumyr Manalo Moreno', 'bakit ganun', 1, '2026-01-12 15:46:20', '2026-01-12 23:47:26', NULL),
(6, 5, '2023-0195', 'user', 'Jumyr Manalo Moreno', 'oh', 1, '2026-01-12 15:46:54', '2026-01-12 23:47:20', NULL),
(7, 5, '2023-0195', 'user', 'Jumyr Manalo Moreno', 'huuuuu', 1, '2026-01-12 15:52:17', '2026-01-13 00:18:07', NULL),
(8, 5, '2023-0195', 'admin', 'Unknown', 'jijij', 0, '2026-01-12 16:00:15', '2026-01-13 00:00:15', NULL),
(9, 5, '2023-0195', 'user', 'Jumyr Moreno', 'bat ganun', 1, '2026-01-12 16:13:13', '2026-01-13 00:18:07', NULL),
(10, 5, '2023-0195', 'user', 'Jumyr Moreno', 'hala ka', 1, '2026-01-12 16:13:26', '2026-01-13 00:18:07', NULL),
(11, 5, '2023-0195', 'user', 'Jumyr Moreno', 'saan na', 1, '2026-01-12 16:14:35', '2026-01-13 00:18:07', NULL),
(12, 5, '2023-0195', 'user', 'Jumyr Moreno', 'diko makita', 1, '2026-01-12 16:14:39', '2026-01-13 00:18:07', NULL),
(13, 5, '2023', 'admin', 'jumyr', 'hgcfgfc', 1, '2026-01-12 16:24:41', '2026-01-13 09:37:11', NULL),
(14, 19, '2023', 'admin', 'jumyr', 'any feedback', 0, '2026-01-12 16:26:15', '2026-01-13 00:26:15', NULL),
(15, 19, '2023', 'admin', 'jumyr', 'lol', 0, '2026-01-12 16:26:40', '2026-01-13 00:26:40', NULL),
(16, 19, '2023', 'admin', 'jumyr', 'lol', 0, '2026-01-12 16:26:45', '2026-01-13 00:26:45', NULL),
(17, 19, '2023', 'admin', 'jumyr', 'hoho', 0, '2026-01-12 16:26:56', '2026-01-13 00:26:56', NULL),
(18, 19, '2023', 'admin', 'jumyr', 'j', 0, '2026-01-12 16:27:21', '2026-01-13 00:27:21', NULL),
(19, 19, '2023', 'admin', 'jumyr', 'k', 0, '2026-01-12 16:27:23', '2026-01-13 00:27:23', NULL),
(20, 19, '2023', 'admin', 'jumyr', 'k', 0, '2026-01-12 16:27:23', '2026-01-13 00:27:23', NULL),
(21, 19, '2023', 'admin', 'jumyr', 'k', 0, '2026-01-12 16:27:24', '2026-01-13 00:27:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_resets_table', 2),
(3, '2019_08_19_000000_create_failed_jobs_table', 3),
(4, '2019_12_14_000001_create_personal_access_tokens_table', 4),
(5, '2026_01_12_143205_create_departments_table', 5),
(6, '2026_01_12_143215_create_sections_table', 5),
(7, '2026_01_12_143226_create_students_table', 5),
(8, '2026_01_12_143236_create_violations_table', 5),
(9, '2026_01_12_143246_create_announcements_table', 5),
(10, '2026_01_12_143255_create_reports_table', 5),
(11, '2026_01_12_143305_create_dashcontents_table', 5),
(12, '2026_01_12_143325_create_settings_table', 5),
(13, '2026_01_12_143905_add_fields_to_users_table', 5),
(15, '2026_01_12_144409_add_soft_deletes_to_tables', 6),
(16, '2026_01_13_021322_add_custom_fields_to_users_table', 7);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE IF NOT EXISTS `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_contact` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `yearlevel` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uniform_count` int DEFAULT '0',
  `footwear_count` int DEFAULT '0',
  `no_id_count` int DEFAULT '0',
  `total_violations` int DEFAULT '0',
  `status` enum('permitted','warning','disciplinary') COLLATE utf8mb4_unicode_ci DEFAULT 'permitted',
  `last_violation_date` date DEFAULT NULL,
  `report_period_start` date DEFAULT NULL,
  `report_period_end` date DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_id` (`report_id`),
  UNIQUE KEY `unique_report_id` (`report_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_department` (`department_code`),
  KEY `idx_section` (`section_id`),
  KEY `idx_status` (`status`),
  KEY `idx_generated_at` (`generated_at`),
  KEY `idx_report_period` (`report_period_start`,`report_period_end`),
  KEY `idx_reports_student_dept` (`student_id`,`department_code`),
  KEY `idx_reports_status_date` (`status`,`generated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `report_id`, `student_id`, `student_name`, `student_contact`, `department`, `department_code`, `section`, `section_id`, `yearlevel`, `uniform_count`, `footwear_count`, `no_id_count`, `total_violations`, `status`, `last_violation_date`, `report_period_start`, `report_period_end`, `generated_at`, `updated_at`, `deleted_at`) VALUES
(1, 'R004', '2024-004', 'Anna Marie Rodriguez', '+63 945 678 9012', 'BS Business Administration', 'BSBA', 'BSIT-1A', 1, '1st Year', 2, 0, 0, 2, 'permitted', '2025-12-15', '2024-02-08', '2025-12-15', '2026-01-08 11:19:03', '2026-01-23 10:11:08', NULL),
(2, 'R001', '2024-001', 'John Michael Doe', '+63 912 345 6789', 'Bachelor of Elementary Education', 'BEED', 'BEED-1B', 22, '1st Year', 1, 0, 0, 1, 'permitted', '2024-02-15', '2024-02-15', '2024-02-15', '2026-01-08 11:19:03', '2026-01-23 10:11:08', NULL),
(3, 'R008', '2023-0195', 'Jumyr Manalo Moreno', '+639099999999', 'Bachelor of Elementary Education', 'BEED', 'BEED-2B', 24, '1st Year', 4, 0, 0, 4, 'permitted', '2025-12-17', '2025-12-15', '2025-12-17', '2026-01-08 11:19:03', '2026-01-23 10:11:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `report_recommendations`
--

DROP TABLE IF EXISTS `report_recommendations`;
CREATE TABLE IF NOT EXISTS `report_recommendations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `recommendation` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_id` (`report_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_recommendations`
--

INSERT INTO `report_recommendations` (`id`, `report_id`, `recommendation`, `priority`, `created_at`) VALUES
(8, 1, 'Remind student about dress code policies', 'medium', '2026-01-08 11:19:03'),
(9, 1, 'Monitor compliance for 2 weeks', 'medium', '2026-01-08 11:19:03'),
(10, 2, 'Remind student about dress code policies', 'low', '2026-01-08 11:19:03'),
(11, 2, 'Monitor compliance for 2 weeks', 'low', '2026-01-08 11:19:03'),
(12, 3, 'Issue written warning', 'medium', '2026-01-08 11:19:03'),
(13, 3, 'Monitor uniform compliance', 'medium', '2026-01-08 11:19:03'),
(14, 3, 'Schedule follow-up meeting', 'medium', '2026-01-08 11:19:03');

-- --------------------------------------------------------

--
-- Table structure for table `report_violations`
--

DROP TABLE IF EXISTS `report_violations`;
CREATE TABLE IF NOT EXISTS `report_violations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `violation_id` int DEFAULT NULL,
  `violation_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `violation_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `violation_date` date NOT NULL,
  `violation_time` time DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_id` (`report_id`),
  KEY `idx_violation_id` (`violation_id`),
  KEY `idx_violation_date` (`violation_date`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_violations`
--

INSERT INTO `report_violations` (`id`, `report_id`, `violation_id`, `violation_type`, `violation_level`, `violation_date`, `violation_time`, `status`, `notes`, `created_at`) VALUES
(8, 1, 4, 'improper_uniform', 'warning3', '2024-02-08', '09:15:00', 'resolved', 'Third warning for improper uniform. Student has been repeatedly reminded about the uniform policy.', '2026-01-08 11:19:03'),
(9, 2, 1, 'improper_uniform', 'warning2', '2024-02-15', '08:15:00', 'resolved', 'Student was found wearing improper uniform - wearing colored undershirt instead of the required white undershirt. This is the second offense for improper uniform violation.', '2026-01-08 11:19:03'),
(10, 1, 6, 'improper_uniform', 'permitted2', '2025-12-15', '08:37:00', 'resolved', 'kughk', '2026-01-08 11:19:03'),
(11, 3, 7, 'improper_uniform', 'permitted1', '2025-12-15', '16:59:00', 'permitted', 'kn', '2026-01-08 11:19:03'),
(12, 3, 8, 'improper_uniform', 'permitted1', '2025-12-15', '16:59:00', 'permitted', 'kn', '2026-01-08 11:19:03'),
(13, 3, 9, 'improper_uniform', 'warning3', '2025-12-17', '11:52:00', 'resolved', 'gh', '2026-01-08 11:19:03'),
(14, 3, 10, 'improper_uniform', 'permitted1', '2025-12-17', '11:52:00', 'permitted', 'gh', '2026-01-08 11:19:03');

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS `sections`;
CREATE TABLE IF NOT EXISTS `sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `section_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_code` (`section_code`),
  KEY `department_id` (`department_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `section_name`, `section_code`, `department_id`, `academic_year`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'BSIT First Year Section A', 'BSIT-1A', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(2, 'BSIT First Year Section B', 'BSIT-1B', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(3, 'BSIT Second Year Section A', 'BSIT-2A', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(4, 'BSIT Second Year Section B', 'BSIT-2B', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(5, 'BSIT Third Year Section A', 'BSIT-3A', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(6, 'BSIT Third Year Section B', 'BSIT-3B', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(7, 'BSIT Fourth Year Section A', 'BSIT-4A', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(8, 'BSIT Fourth Year Section B', 'BSIT-4B', 7, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(9, 'BSCS First Year Section A', 'BSCS-1A', 8, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(10, 'BSCS First Year Section B', 'BSCS-1B', 8, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(11, 'BSCS Second Year Section A', 'BSCS-2A', 8, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(12, 'BSCS Second Year Section B', 'BSCS-2B', 8, '2024-2025', 'active', '2025-12-14 09:38:55', NULL, NULL),
(13, 'BSBA First Year Section A', 'BSBA-1A', 9, '2024-2025', 'archived', '2025-12-14 09:38:56', '2025-12-14 14:19:24', NULL),
(14, 'BSBA First Year Section B', 'BSBA-1B', 9, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(15, 'BSBA Second Year Section A', 'BSBA-2A', 9, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(16, 'BSBA Second Year Section B', 'BSBA-2B', 9, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(17, 'BSN First Year Section A', 'BSN-1A', 10, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(18, 'BSN First Year Section B', 'BSN-1B', 10, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(19, 'BSN Second Year Section A', 'BSN-2A', 10, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(20, 'BSN Second Year Section B', 'BSN-2B', 10, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(21, 'BEED First Year Section A', 'BEED-1A', 11, '2024-2025', 'active', '2025-12-14 09:38:56', '2025-12-16 06:18:21', NULL),
(22, 'BEED First Year Section B', 'BEED-1B', 11, '2024-2025', 'archived', '2025-12-14 09:38:56', '2025-12-15 03:24:29', NULL),
(23, 'BEED Second Year Section A', 'BEED-2A', 11, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(24, 'BEED Second Year Section B', 'BEED-2B', 11, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(25, 'BSED First Year Section A', 'BSED-1A', 12, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(26, 'BSED First Year Section B', 'BSED-1B', 12, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(27, 'BSED Second Year Section A', 'BSED-2A', 12, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL),
(28, 'BSED Second Year Section B', 'BSED-2B', 12, '2024-2025', 'active', '2025-12-14 09:38:56', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','integer','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  UNIQUE KEY `unique_setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  KEY `idx_is_public` (`is_public`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_public`, `created_at`, `updated_at`) VALUES
(1, 'system_name', 'OSAS System', 'string', 'general', 'System name displayed in the application', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(2, 'system_email', 'osas@school.edu', 'string', 'general', 'System email address for notifications', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(3, 'system_phone', '+63 912 345 6789', 'string', 'general', 'System contact phone number', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(4, 'system_address', 'School Address', 'string', 'general', 'System physical address', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(5, 'timezone', 'Asia/Manila', 'string', 'general', 'System timezone', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(6, 'date_format', 'Y-m-d', 'string', 'general', 'Date format for display', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(7, 'time_format', 'H:i:s', 'string', 'general', 'Time format for display', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(8, 'items_per_page', '10', 'integer', 'general', 'Number of items per page in tables', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(9, 'enable_notifications', '1', 'boolean', 'notifications', 'Enable system notifications', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(10, 'email_notifications', '1', 'boolean', 'notifications', 'Enable email notifications', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(11, 'sms_notifications', '0', 'boolean', 'notifications', 'Enable SMS notifications', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(12, 'violation_auto_escalate', '1', 'boolean', 'violations', 'Automatically escalate violations after warnings', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(13, 'violation_warning_limit', '3', 'integer', 'violations', 'Number of warnings before disciplinary action', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(14, 'violation_reminder_days', '7', 'integer', 'violations', 'Days before sending violation reminder', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(15, 'report_auto_generate', '0', 'boolean', 'reports', 'Automatically generate reports daily', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(16, 'report_retention_days', '365', 'integer', 'reports', 'Number of days to retain reports', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(17, 'session_timeout', '30', 'integer', 'security', 'Session timeout in minutes', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(18, 'password_min_length', '8', 'integer', 'security', 'Minimum password length', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(19, 'password_require_uppercase', '1', 'boolean', 'security', 'Require uppercase letter in password', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(20, 'password_require_lowercase', '1', 'boolean', 'security', 'Require lowercase letter in password', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(21, 'password_require_number', '1', 'boolean', 'security', 'Require number in password', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(22, 'password_require_special', '0', 'boolean', 'security', 'Require special character in password', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(23, 'login_attempts_limit', '5', 'integer', 'security', 'Maximum login attempts before lockout', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(24, 'lockout_duration', '15', 'integer', 'security', 'Account lockout duration in minutes', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(25, 'enable_2fa', '0', 'boolean', 'security', 'Enable two-factor authentication', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(26, 'maintenance_mode', '0', 'boolean', 'system', 'Enable maintenance mode', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(27, 'maintenance_message', 'System is under maintenance. Please check back later.', 'string', 'system', 'Maintenance mode message', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(28, 'backup_enabled', '1', 'boolean', 'system', 'Enable automatic backups', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(29, 'backup_frequency', 'daily', 'string', 'system', 'Backup frequency (daily, weekly, monthly)', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(30, 'backup_retention', '30', 'integer', 'system', 'Number of backups to retain', 0, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(31, 'theme_default', 'light', 'string', 'appearance', 'Default theme (light, dark, auto)', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(32, 'logo_url', '', 'string', 'appearance', 'System logo URL', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(33, 'favicon_url', '', 'string', 'appearance', 'Favicon URL', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(34, 'primary_color', '#000000', 'string', 'appearance', 'Primary color (gold)', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39'),
(35, 'secondary_color', '#E3E3E3', 'string', 'appearance', 'Secondary color', 1, '2026-01-08 11:39:32', '2026-01-09 02:02:39');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `department` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `yearlevel` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1st Year',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','graduating','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `email` (`email`),
  KEY `section_id` (`section_id`),
  KEY `status` (`status`),
  KEY `department` (`department`),
  KEY `idx_students_year_level` (`year_level`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_id`, `first_name`, `middle_name`, `last_name`, `email`, `contact_number`, `address`, `department`, `section_id`, `yearlevel`, `year_level`, `avatar`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '2024-001', 'John', 'Michael', 'Doe', 'john.doe@student.edu', '+63 912 345 6789', '123 Main Street, Quezon City', 'BEED', 22, '1st Year', '1st Year', 'assets/img/students/student_1765729847_693ee637d33c3.png', 'active', '2025-12-14 09:38:56', '2026-01-23 09:52:21', NULL),
(2, '2024-002', 'Maria', 'Clara', 'Santos', 'maria.santos@student.edu', '+63 923 456 7890', '456 Oak Avenue, Manila', 'BSIT', 2, '1st Year', '1st Year', NULL, 'archived', '2025-12-14 09:38:56', '2026-01-23 09:56:14', NULL),
(3, '2024-003', 'Robert', 'James', 'Chen', 'robert.chen@student.edu', '+63 934 567 8901', '789 Pine Road, Makati', 'BEED', 23, NULL, '1st Year', 'app/assets/img/students/student_1765759118_693f588eaae14.jpg', 'archived', '2025-12-14 09:38:56', '2025-12-15 10:03:53', NULL),
(4, '2024-004', 'Anna', 'Marie', 'Rodriguez', 'anna.rodriguez@student.edu', '+63 945 678 9012', '321 Elm Street, Pasig', 'BSBA', 1, '1st Year', '1st Year', NULL, 'active', '2025-12-14 09:38:56', '2026-01-23 09:52:21', NULL),
(5, '2024-005', 'Michael', 'Anthony', 'Garcia', 'michael.garcia@student.edu', '+63 956 789 0123', '654 Maple Drive, Taguig', 'BSIT', 5, NULL, '1st Year', NULL, 'archived', '2025-12-14 09:38:56', '2026-01-08 17:21:10', NULL),
(6, '2023-0206', 'Christian', 'Manalo', 'Moreno', 'morenojumyr0@gmail.com', '+639099999999', 'Street 6', 'BSIT', 4, NULL, '1st Year', 'assets/img/students/student_1765706780_693e8c1c7aec5.jpg', 'archived', '2025-12-14 18:06:20', '2025-12-14 21:57:00', NULL),
(7, '2023-02065', 'Christian', 'Manalo', 'Moreno', 'morenojumyrw0@gmail.com', '+639099999999', 'Street 6', 'BEED', 22, NULL, '1st Year', 'assets/img/students/student_1765724438_693ed11651a2e.webp', 'archived', '2025-12-14 15:00:38', '2025-12-14 15:19:11', NULL),
(8, '2023-0195', 'Jumyr', 'Manalo', 'Moreno', 'morenochristian20051225@gmail.com', '+639099999999', 'Street 6', 'BEED', 24, '1st Year', '1st Year', 'app/assets/img/students/student_1765788746_693fcc4a4ee38.jpg', 'active', '2025-12-15 08:52:26', '2026-01-23 09:52:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `full_name` varchar(100) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_google_id` (`google_id`(250)),
  KEY `idx_users_facebook_id` (`facebook_id`(250))
) ENGINE=MyISAM AUTO_INCREMENT=2026 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `google_id`, `facebook_id`, `profile_picture`, `password`, `role`, `full_name`, `student_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@osas.com', NULL, NULL, NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', NULL, 1, '2025-10-14 02:46:08', '2025-10-14 02:46:08'),
(2, 'osas_admin', 'osas@admin.com', NULL, NULL, NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'OSAS Admin', NULL, 1, '2025-10-14 02:46:08', '2025-10-14 02:46:08'),
(3, 'student', 'student@example.com', NULL, NULL, NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'John Doe', '2024-001', 1, '2025-10-14 02:46:08', '2025-10-14 02:46:08'),
(4, 'test_student', 'test@example.com', NULL, NULL, NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Jane Smith', '2024-002', 1, '2025-10-14 02:46:08', '2025-10-14 02:46:08'),
(2023, 'jumyr', 'morenojumyr0@gmail.com', NULL, NULL, NULL, '$2y$10$166a7LG0mS7E.HOwr2wqhuuF.PkU8LcVCa3tRuhIZsY7YKqfk3Hau', 'admin', 'Jumyr Moreno', '2023-0195', 1, '2025-10-14 03:21:09', '2025-12-27 00:40:09'),
(2024, 'jumyrrr', 'morenojumfyr0@gmail.com', NULL, NULL, NULL, '$2y$10$mOc68KLw6GdJ7WMsWODp8.E06FHP.09CCrNpZE0e9d7iw7TBti7rS', 'user', 'Christian Moreno', '2023-0206', 1, '2026-01-08 12:27:54', '2026-01-12 11:24:59'),
(2025, 'hihihihi', 'morenojumyr099@gmail.com', NULL, NULL, NULL, '$2y$10$h79f5X6OmqFfq3mOSmwBIe.7jkkdW8RESunP3Pl7t4qpJw63xzUmS', 'user', 'Christian Moreno', '2023-0195', 1, '2026-01-09 03:30:51', '2026-01-12 09:36:41');

-- --------------------------------------------------------

--
-- Table structure for table `violations`
--

DROP TABLE IF EXISTS `violations`;
CREATE TABLE IF NOT EXISTS `violations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` varchar(20) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `violation_type` enum('improper_uniform','no_id','improper_footwear','misconduct') NOT NULL,
  `violation_level` enum('permitted1','permitted2','warning1','warning2','warning3','disciplinary') NOT NULL,
  `department` enum('BSIS','WFT','BTVTED','CHS') NOT NULL,
  `section` varchar(20) NOT NULL,
  `violation_date` date NOT NULL,
  `violation_time` time NOT NULL,
  `location` enum('gate_1','gate_2','classroom','library','cafeteria','gym','others') NOT NULL,
  `reported_by` varchar(100) NOT NULL,
  `notes` text,
  `status` enum('permitted','warning','disciplinary','resolved') NOT NULL DEFAULT 'warning',
  `attachments` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `case_id` (`case_id`),
  KEY `idx_case_id` (`case_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_department` (`department`),
  KEY `idx_status` (`status`),
  KEY `idx_violation_date` (`violation_date`),
  KEY `idx_violation_type` (`violation_type`),
  KEY `idx_violation_level` (`violation_level`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `violations`
--

INSERT INTO `violations` (`id`, `case_id`, `student_id`, `violation_type`, `violation_level`, `department`, `section`, `violation_date`, `violation_time`, `location`, `reported_by`, `notes`, `status`, `attachments`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'VIOL-2024-001', '2024-001', 'improper_uniform', 'warning2', '', 'BSIT-3A', '2024-02-15', '08:15:00', 'gate_1', 'Officer Maria Santos', 'Student was found wearing improper uniform - wearing colored undershirt instead of the required white undershirt. This is the second offense for improper uniform violation.', 'resolved', NULL, '2025-12-14 01:38:56', '2025-12-14 10:36:23', NULL),
(2, 'VIOL-2024-002', '2024-002', 'no_id', 'permitted1', '', 'BSIT-1B', '2024-02-14', '07:30:00', 'gate_2', 'Officer Juan Dela Cruz', 'Student forgot to bring ID. First offense.', 'resolved', NULL, '2025-12-14 01:38:56', '2025-12-14 16:37:02', NULL),
(3, 'VIOL-2024-003', '2024-003', 'improper_footwear', 'disciplinary', '', 'BSIT-2A', '2024-02-10', '08:30:00', 'classroom', 'Professor Ana Reyes', 'Student was wearing sneakers instead of the required black leather shoes in violation of school uniform policy.', 'resolved', NULL, '2025-12-14 01:38:56', '2025-12-14 23:04:22', NULL),
(4, 'VIOL-2024-004', '2024-004', 'improper_uniform', 'warning3', '', 'BSIT-1A', '2024-02-08', '09:15:00', 'library', 'Librarian Pedro Gomez', 'Third warning for improper uniform. Student has been repeatedly reminded about the uniform policy.', 'resolved', NULL, '2025-12-14 01:38:56', '2025-12-14 01:38:56', NULL),
(5, 'VIOL-2025-005', '2023-0206', 'no_id', 'permitted1', '', '4', '2025-12-14', '18:06:00', 'classroom', 'soeaifjsoidjfos', ',', 'resolved', NULL, '2025-12-14 10:07:00', '2025-12-14 10:20:48', NULL),
(6, 'VIOL-2025-006', '2024-004', 'improper_uniform', 'permitted2', '', '1', '2025-12-15', '08:37:00', 'classroom', 'soeaifjsoidjfos', 'kughk', 'resolved', NULL, '2025-12-14 16:37:46', '2025-12-14 19:24:14', NULL),
(7, 'VIOL-2025-007', '2023-0195', 'improper_uniform', 'permitted1', '', '24', '2025-12-15', '16:59:00', 'classroom', 'soeaifjsoidjfos', 'kn', 'permitted', NULL, '2025-12-15 01:00:02', '2025-12-15 09:00:02', NULL),
(8, 'VIOL-2025-008', '2023-0195', 'improper_uniform', 'permitted1', '', '24', '2025-12-15', '16:59:00', 'classroom', 'soeaifjsoidjfos', 'kn', 'permitted', NULL, '2025-12-15 01:00:02', '2025-12-15 09:00:02', NULL),
(9, 'VIOL-2025-009', '2023-0195', 'improper_uniform', 'warning3', '', '24', '2025-12-17', '11:52:00', 'gate_2', 'soeaifjsoidjfos', 'gh', 'resolved', NULL, '2025-12-16 19:54:09', '2025-12-16 19:55:03', NULL),
(10, 'VIOL-2025-010', '2023-0195', 'improper_uniform', 'permitted1', '', '24', '2025-12-17', '11:52:00', 'gate_2', 'soeaifjsoidjfos', 'gh', 'permitted', NULL, '2025-12-16 19:54:09', '2025-12-17 03:54:09', NULL),
(11, 'VIOL-2026-001', '2024-001', 'improper_uniform', 'warning1', '', '22', '2026-01-12', '00:15:00', 'gate_1', 'soeaifjsoidjfos', NULL, 'warning', NULL, '2026-01-12 08:15:52', '2026-01-12 16:15:52', NULL);

-- --------------------------------------------------------

DROP TABLE IF EXISTS `otps`;
CREATE TABLE IF NOT EXISTS `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pending_data` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_otps_email` (`email`),
  KEY `idx_otps_code` (`code`),
  KEY `idx_otps_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

DROP TABLE IF EXISTS `email_configs`;
CREATE TABLE IF NOT EXISTS `email_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `smtp_host` varchar(255) NOT NULL,
  `smtp_port` int NOT NULL,
  `smtp_username` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(255) DEFAULT NULL,
  `from_email` varchar(255) NOT NULL,
  `from_name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_configs_active` (`is_active`),
  KEY `idx_email_configs_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `email_configs` (`name`, `smtp_host`, `smtp_port`, `smtp_username`, `smtp_password`, `from_email`, `from_name`, `is_active`, `is_default`)
VALUES ('OSAS Primary Gmail', 'smtp.gmail.com', 587, 'belugaw6@gmail.com', 'chrqrylpqhrtqytl', 'belugaw6@gmail.com', 'OSAS', 1, 1);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_recommendations`
--
ALTER TABLE `report_recommendations`
  ADD CONSTRAINT `fk_report_recommendations_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_violations`
--
ALTER TABLE `report_violations`
  ADD CONSTRAINT `fk_report_violations_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
