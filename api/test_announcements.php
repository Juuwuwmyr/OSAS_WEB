<?php
/**
 * Test script for announcements API
 * Use this to debug database connection and table issues
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$response = [
    'status' => 'info',
    'checks' => []
];

try {
    // Check 1: Database config file
    $dbConfigPath = realpath(__DIR__ . '/../config/db_connect.php');
    if ($dbConfigPath && file_exists($dbConfigPath)) {
        $response['checks']['db_config'] = 'OK: ' . $dbConfigPath;
        include $dbConfigPath;
        
        // Check 2: Database connection
        if (isset($conn) && $conn) {
            $response['checks']['db_connection'] = 'OK';
            
            // Check 3: Table exists
            $tableCheck = $conn->query("SHOW TABLES LIKE 'announcements'");
            if ($tableCheck && $tableCheck->num_rows > 0) {
                $response['checks']['table_exists'] = 'OK';
                
                // Check 4: Table structure
                $structure = $conn->query("DESCRIBE announcements");
                if ($structure) {
                    $columns = [];
                    while ($row = $structure->fetch_assoc()) {
                        $columns[] = $row['Field'];
                    }
                    $response['checks']['table_structure'] = 'OK';
                    $response['checks']['columns'] = $columns;
                    
                    // Check 5: Try to query
                    $testQuery = $conn->query("SELECT COUNT(*) as count FROM announcements WHERE deleted_at IS NULL");
                    if ($testQuery) {
                        $row = $testQuery->fetch_assoc();
                        $response['checks']['query_test'] = 'OK';
                        $response['checks']['record_count'] = $row['count'];
                        $response['status'] = 'success';
                        $response['message'] = 'All checks passed!';
                    } else {
                        $response['checks']['query_test'] = 'FAILED: ' . $conn->error;
                    }
                } else {
                    $response['checks']['table_structure'] = 'FAILED: ' . $conn->error;
                }
            } else {
                $response['checks']['table_exists'] = 'FAILED: Table does not exist. Please run database/announcements_table.sql';
            }
        } else {
            $response['checks']['db_connection'] = 'FAILED: Connection variable not set';
        }
    } else {
        $response['checks']['db_config'] = 'FAILED: Config file not found at ' . __DIR__ . '/../config/db_connect.php';
    }
    
} catch (Exception $e) {
    $response['status'] = 'error';
    $response['message'] = $e->getMessage();
    $response['checks']['exception'] = $e->getTraceAsString();
}

echo json_encode($response, JSON_PRETTY_PRINT);

