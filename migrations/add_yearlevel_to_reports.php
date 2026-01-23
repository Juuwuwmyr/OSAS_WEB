<?php
/**
 * Migration: Add yearlevel column to reports table
 * Date: 2026-01-23
 * Description: Adds yearlevel field to reports table for student year level tracking
 */

// Include database configuration
require_once __DIR__ . '/../config/db_connect.php';

class AddYearlevelToReports {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    /**
     * Run the migration
     */
    public function up() {
        try {
            // Check if yearlevel column already exists
            $checkColumn = $this->conn->query("SHOW COLUMNS FROM reports LIKE 'yearlevel'");
            
            if ($checkColumn->num_rows === 0) {
                // Add yearlevel column
                $sql = "ALTER TABLE reports ADD COLUMN yearlevel VARCHAR(20) DEFAULT NULL AFTER section_id";
                
                if ($this->conn->query($sql)) {
                    echo "✅ Successfully added yearlevel column to reports table\n";
                    
                    // Update existing reports with yearlevel from students table
                    $this->updateExistingReports();
                    
                    return true;
                } else {
                    echo "❌ Failed to add yearlevel column: " . $this->conn->error . "\n";
                    return false;
                }
            } else {
                echo "ℹ️ yearlevel column already exists in reports table\n";
                return true;
            }
        } catch (Exception $e) {
            echo "❌ Migration error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Update existing reports with yearlevel from students table
     */
    private function updateExistingReports() {
        try {
            echo "🔄 Updating existing reports with yearlevel data...\n";
            
            // Update reports with yearlevel from students table
            $sql = "UPDATE reports r 
                     LEFT JOIN students s ON BINARY r.student_id = BINARY s.student_id 
                     SET r.yearlevel = s.yearlevel 
                     WHERE r.yearlevel IS NULL AND s.yearlevel IS NOT NULL";
            
            if ($this->conn->query($sql)) {
                $affectedRows = $this->conn->affected_rows;
                echo "✅ Updated $affectedRows reports with yearlevel data\n";
            } else {
                echo "⚠️ No reports needed updating or error: " . $this->conn->error . "\n";
            }
            
        } catch (Exception $e) {
            echo "❌ Error updating existing reports: " . $e->getMessage() . "\n";
        }
    }
    
    /**
     * Rollback the migration
     */
    public function down() {
        try {
            // Check if yearlevel column exists before dropping
            $checkColumn = $this->conn->query("SHOW COLUMNS FROM reports LIKE 'yearlevel'");
            
            if ($checkColumn->num_rows > 0) {
                $sql = "ALTER TABLE reports DROP COLUMN yearlevel";
                
                if ($this->conn->query($sql)) {
                    echo "✅ Successfully dropped yearlevel column from reports table\n";
                    return true;
                } else {
                    echo "❌ Failed to drop yearlevel column: " . $this->conn->error . "\n";
                    return false;
                }
            } else {
                echo "ℹ️ yearlevel column does not exist in reports table\n";
                return true;
            }
        } catch (Exception $e) {
            echo "❌ Rollback error: " . $e->getMessage() . "\n";
            return false;
        }
    }
}

// Run migration if accessed directly
if (basename(__FILE__) === 'add_yearlevel_to_reports.php') {
    $migration = new AddYearlevelToReports($conn);
    $migration->up();
}
?>
