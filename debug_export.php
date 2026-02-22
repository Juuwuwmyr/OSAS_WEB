<?php
require_once __DIR__ . '/app/core/Model.php';
require_once __DIR__ . '/app/models/ReportModel.php';

// Mock DB connection if needed, but Model handles it
$model = new ReportModel();

// 1. Check existing reports and their departments
echo "--- Existing Reports ---\n";
$reports = $model->getStudentReports(['department' => 'all']);
foreach ($reports as $r) {
    echo "ID: {$r['id']}, Student: {$r['studentName']}, Dept: {$r['deptCode']}, Period: {$r['lastUpdated']}\n";
    // Check internal dates if possible
}

// 2. Test fetching with specific department filter (simulating Controller logic)
$testDept = 'BSBA'; // Changed to existing
echo "\n--- Testing Filter: $testDept ---\n";
$filtered = $model->getStudentReports(['department' => $testDept]);
echo "Found " . count($filtered) . " reports for $testDept.\n";

// 3. Test fetching with comma-separated filter
$testDepts = 'BSBA,BEED';
echo "\n--- Testing Filter: $testDepts ---\n";
$multiFiltered = $model->getStudentReports(['department' => $testDepts]);
echo "Found " . count($multiFiltered) . " reports for $testDepts.\n";

// 4. Test fetching with date range
// Assuming we have reports today
$today = date('Y-m-d');
echo "\n--- Testing Date Filter: $today to $today ---\n";
$dateFiltered = $model->getStudentReports([
    'department' => 'all', 
    'startDate' => '2025-01-01', // Wider range to catch older reports
    'endDate' => '2026-12-31'
]);
echo "Found " . count($dateFiltered) . " reports for wide range.\n";

?>
