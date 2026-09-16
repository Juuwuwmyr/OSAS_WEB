-- ============================================================
-- OSAS Messenger Feature — Direct Messaging Tables
-- Run once against the `osas` database.
-- ============================================================

-- ── conversations: one row per admin↔student pair ────────────────────────────
CREATE TABLE IF NOT EXISTS `conversations` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `admin_user_id`   INT          NOT NULL COMMENT 'users.id of the admin/staff',
  `student_user_id` INT          NOT NULL COMMENT 'users.id of the student',
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pair` (`admin_user_id`, `student_user_id`),
  KEY `idx_admin`   (`admin_user_id`),
  KEY `idx_student` (`student_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── direct_messages: individual chat messages ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `direct_messages` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `conversation_id`  INT          NOT NULL,
  `sender_id`        INT          NOT NULL COMMENT 'users.id of the sender',
  `body`             TEXT         NOT NULL,
  `is_read`          TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv`     (`conversation_id`),
  KEY `idx_sender`   (`sender_id`),
  CONSTRAINT `fk_dm_conv` FOREIGN KEY (`conversation_id`)
    REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
