-- ============================================================
-- Migration: Rename violation levels to 1st–5th Offense
-- Run this against your OSAS database
-- ============================================================

-- Update violation_levels table names (all 4 violation types × 5 levels)
UPDATE `violation_levels` SET `name` = '1st Offense', `description` = 'First offense' WHERE `level_order` = 1;
UPDATE `violation_levels` SET `name` = '2nd Offense', `description` = 'Second offense' WHERE `level_order` = 2;
UPDATE `violation_levels` SET `name` = '3rd Offense', `description` = 'Third offense' WHERE `level_order` = 3;
UPDATE `violation_levels` SET `name` = '4th Offense', `description` = 'Fourth offense' WHERE `level_order` = 4;
UPDATE `violation_levels` SET `name` = '5th Offense', `description` = 'Fifth offense — triggers disciplinary action' WHERE `level_order` = 5;
-- Level 6 (Disciplinary Action) stays as-is

-- Update student_violation_levels ENUM to new values
ALTER TABLE `student_violation_levels`
  MODIFY COLUMN `current_level`
    ENUM('offense1','offense2','offense3','offense4','offense5','disciplinary')
    NOT NULL DEFAULT 'offense1';

-- Migrate existing student_violation_levels data
UPDATE `student_violation_levels` SET `current_level` = 'offense1' WHERE `current_level` = 'permitted1';
UPDATE `student_violation_levels` SET `current_level` = 'offense2' WHERE `current_level` = 'permitted2';
UPDATE `student_violation_levels` SET `current_level` = 'offense3' WHERE `current_level` = 'warning1';
UPDATE `student_violation_levels` SET `current_level` = 'offense4' WHERE `current_level` = 'warning2';
UPDATE `student_violation_levels` SET `current_level` = 'offense5' WHERE `current_level` = 'warning3';
-- 'disciplinary' stays as-is

-- Update the stored function
DROP FUNCTION IF EXISTS `get_next_violation_level`;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` FUNCTION `get_next_violation_level` (
    `current_level` VARCHAR(50),
    `total_violations` INT
) RETURNS VARCHAR(50) CHARSET utf8mb4 DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE next_level VARCHAR(50);

    CASE current_level
        WHEN 'offense1' THEN
            SET next_level = IF(total_violations >= 2, 'offense2', 'offense1');
        WHEN 'offense2' THEN
            SET next_level = IF(total_violations >= 3, 'offense3', 'offense2');
        WHEN 'offense3' THEN
            SET next_level = IF(total_violations >= 4, 'offense4', 'offense3');
        WHEN 'offense4' THEN
            SET next_level = IF(total_violations >= 5, 'offense5', 'offense4');
        WHEN 'offense5' THEN
            SET next_level = IF(total_violations >= 6, 'disciplinary', 'offense5');
        ELSE
            SET next_level = 'disciplinary';
    END CASE;

    RETURN next_level;
END$$

DELIMITER ;
