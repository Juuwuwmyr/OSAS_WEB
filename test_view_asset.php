<?php
/**
 * Test View::asset() path generation
 */
require_once __DIR__ . '/app/core/View.php';

echo "<h2>Testing View::asset() Path Generation</h2>";
echo "<pre>";

echo "DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET') . "\n";
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'NOT SET') . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NOT SET') . "\n\n";

$appDir = dirname(__DIR__);
echo "App Directory: $appDir\n";
echo "Project Root: " . dirname($appDir) . "\n\n";

// Test path extraction logic
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
echo "DEBUG - Path Extraction:\n";
if ($scriptName) {
    $basePath = dirname($scriptName);
    $relativePath = ltrim($basePath, '/');
    echo "  SCRIPT_NAME: $scriptName\n";
    echo "  dirname(SCRIPT_NAME): $basePath\n";
    echo "  ltrim(dirname, '/'): $relativePath\n";
    echo "  Final path would be: /$relativePath/app/assets/[path]\n\n";
} else {
    echo "  SCRIPT_NAME is empty!\n\n";
}

// Test various asset paths
$testPaths = [
    'styles/Dashcontent.css',
    'js/department.js',
    'img/default.png',
    'img/students/student_123.jpg',
    'styles/dashboard.css'
];

echo "Generated Paths:\n";
echo str_repeat("=", 60) . "\n";
foreach ($testPaths as $testPath) {
    $generated = View::asset($testPath);
    echo "View::asset('$testPath')\n";
    echo "  => $generated\n\n";
}

echo "</pre>";

// Check if files exist
echo "<h3>File Existence Check:</h3>";
echo "<pre>";
$basePath = dirname(__DIR__);
foreach ($testPaths as $testPath) {
    $fullPath = $basePath . '/app/assets/' . $testPath;
    $exists = file_exists($fullPath);
    echo ($exists ? "✓" : "✗") . " $fullPath\n";
}
echo "</pre>";
