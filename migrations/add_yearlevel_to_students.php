<?php
/**
 * Migration: Add yearlevel column to students table
 * Date: 2026-01-23
 * Description: Adds yearlevel field to students table for tracking student year level
 */

// Include database configuration
require_once __DIR__ . '/../config/db_connect.php';

class AddYearlevelToStudents {
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
            $checkColumn = $this->conn->query("SHOW COLUMNS FROM students LIKE 'yearlevel'");
            
            if ($checkColumn->num_rows === 0) {
                // Add yearlevel column
                $sql = "ALTER TABLE students ADD COLUMN yearlevel VARCHAR(20) DEFAULT NULL AFTER section_id";
                
                if ($this->conn->query($sql)) {
                    echo "✅ Successfully added yearlevel column to students table\n";
                    
                    // Update existing students with default yearlevel if needed
                    $this->seedDefaultYearlevels();
                    
                    return true;
                } else {
                    echo "❌ Failed to add yearlevel column: " . $this->conn->error . "\n";
                    return false;
                }
            } else {
                echo "ℹ️ yearlevel column already exists in students table\n";
                return true;
            }
        } catch (Exception $e) {
            echo "❌ Migration error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Rollback the migration
     */
    public function down() {
        try {
            // Check if yearlevel column exists before dropping
            $checkColumn = $this->conn->query("SHOW COLUMNS FROM students LIKE 'yearlevel'");
            
            if ($checkColumn->num_rows > 0) {
                $sql = "ALTER TABLE students DROP COLUMN yearlevel";
                
                if ($this->conn->query($sql)) {
                    echo "✅ Successfully dropped yearlevel column from students table\n";
                    return true;
                } else {
                    echo "❌ Failed to drop yearlevel column: " . $this->conn->error . "\n";
                    return false;
                }
            } else {
                echo "ℹ️ yearlevel column does not exist in students table\n";
                return true;
            }
        } catch (Exception $e) {
            echo "❌ Rollback error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Seed default yearlevels for existing students
     */
    private function seedDefaultYearlevels() {
        try {
            // Set default yearlevel for existing students based on their status or created_at
            $sql = "UPDATE students SET yearlevel = '1st Year' WHERE yearlevel IS NULL AND status = 'active'";
            $this->conn->query($sql);
            
            echo "✅ Updated existing students with default yearlevel\n";
        } catch (Exception $e) {
            echo "⚠️ Warning: Could not seed default yearlevels: " . $e->getMessage() . "\n";
        }
    }
}

// Run migration if this file is executed directly
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    echo "🚀 Running migration: Add yearlevel to students table\n";
    echo "================================================\n";
    
    $migration = new AddYearlevelToStudents($conn);
    
    if ($migration->up()) {
        echo "\n✅ Migration completed successfully!\n";
    } else {
        echo "\n❌ Migration failed!\n";
    }
}
?>
