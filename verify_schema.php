<?php
require_once __DIR__ . '/config/db_connect.php';

echo "Checking database status...\n";

// Check if tables exist
$tables = ['violation_types', 'violation_levels', 'violations'];
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result && $result->num_rows > 0) {
        echo "✅ Table '$table' exists.\n";
        
        // Count rows
        $countResult = $conn->query("SELECT COUNT(*) as count FROM $table");
        $count = $countResult->fetch_assoc()['count'];
        echo "   Rows: $count\n";
        
        if ($table === 'violation_levels') {
            echo "   Checking content sample:\n";
            $sample = $conn->query("SELECT * FROM $table LIMIT 5");
            while($row = $sample->fetch_assoc()) {
                echo "   - ID: " . $row['id'] . ", Name: " . $row['name'] . "\n";
            }
        }
    } else {
        echo "❌ Table '$table' DOES NOT exist.\n";
    }
}

// Check Foreign Keys in violations table
echo "\nChecking Foreign Keys in 'violations' table:\n";
$result = $conn->query("SHOW CREATE TABLE violations");
if ($result) {
    $row = $result->fetch_row();
    echo $row[1] . "\n";
}

echo "\nDone.\n";
