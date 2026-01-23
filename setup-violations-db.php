<?php
require_once __DIR__ . '/config/db_connect.php';

echo "<h2>Setting up Violations Table</h2>";

if (!isset($conn) || ($conn && $conn->connect_error)) {
    echo "<p>❌ Database connection failed. Please check config/db_connect.php</p>";
    exit;
}

$sql = "
CREATE TABLE IF NOT EXISTS violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    case_id VARCHAR(50) NOT NULL UNIQUE,
    violation_type VARCHAR(255) NOT NULL,
    description TEXT,
    violation_date DATE NOT NULL,
    status ENUM('warning', 'permitted', 'disciplinary', 'resolved') NOT NULL DEFAULT 'warning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_violations_student (student_id),
    INDEX idx_violations_status (status),
    INDEX idx_violations_date (violation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql) === TRUE) {
    echo "<p>✅ violations table created successfully</p>";
} else {
    echo "<p>❌ Error creating table: " . $conn->error . "</p>";
    $conn->close();
    exit;
}

// Insert sample violation if table is empty
$countCheck = $conn->query("SELECT COUNT(*) as cnt FROM violations");
if ($countCheck && $countCheck->fetch_assoc()['cnt'] == 0) {
    $insert = $conn->prepare("
        INSERT INTO violations (student_id, case_id, violation_type, description, violation_date, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $studentId = 'STU-2025-001';
    $caseId = 'CASE-2025-001';
    $type = 'Minor Misconduct';
    $desc = 'Late attendance in class';
    $date = '2025-01-15';
    $status = 'warning';
    $insert->bind_param('ssssss', $studentId, $caseId, $type, $desc, $date, $status);
    if ($insert->execute()) {
        echo "<p>✅ Sample violation added for testing Reports</p>";
    } else {
        echo "<p>⚠️ Could not add sample violation: " . $insert->error . "</p>";
    }
    $insert->close();
} else {
    echo "<p>ℹ️ violations table already has data; no sample added</p>";
}

$conn->close();
?>
