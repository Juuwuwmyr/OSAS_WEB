<?php
// Fix for incorrect violation statuses
// Run this script to update existing 'warning' statuses to 'permitted' where applicable

// Include necessary files
// Adjust path to config/db_connect.php
require_once __DIR__ . '/app/config/db_connect.php';

// $conn is created in db_connect.php
if (!isset($conn) || $conn->connect_error) {
    die("Connection failed: " . ($conn ? $conn->connect_error : "Unknown error"));
}

echo "Starting violation status fix...\n";

// 1. Update status to 'permitted' for violations with 'Permitted' in level name
$query1 = "
    UPDATE violations v
    JOIN violation_levels vl ON v.violation_level_id = vl.id
    SET v.status = 'permitted'
    WHERE vl.name LIKE '%Permitted%' 
    AND v.status = 'warning'
";

if ($conn->query($query1)) {
    echo "Updated " . $conn->affected_rows . " violations to 'permitted' status.\n";
} else {
    echo "Error updating permitted violations: " . $conn->error . "\n";
}

// 2. Update status to 'disciplinary' for violations with 'Disciplinary' in level name
$query2 = "
    UPDATE violations v
    JOIN violation_levels vl ON v.violation_level_id = vl.id
    SET v.status = 'disciplinary'
    WHERE vl.name LIKE '%Disciplinary%' 
    AND v.status = 'warning'
";

if ($conn->query($query2)) {
    echo "Updated " . $conn->affected_rows . " violations to 'disciplinary' status.\n";
} else {
    echo "Error updating disciplinary violations: " . $conn->error . "\n";
}

echo "Fix complete.\n";
?>
