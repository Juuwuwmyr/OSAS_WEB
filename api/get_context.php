<?php
/**
 * Database Context API
 * Returns system data for chatbot context
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../app/config/db_connect.php';

// Start session to get user info
session_start();
$user_id = $_SESSION['user_id'] ?? null;
$user_role = $_SESSION['role'] ?? null;

$context = [
    'stats' => [],
    'departments' => [],
    'sections' => [],
    'recent_students' => [],
    'recent_violations' => [],
    'user_info' => null
];

try {
    if ($conn && !$conn->connect_error) {
        // Get basic statistics
        $stats = [];
        
        // Count students
        $result = $conn->query("SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['students'] = (int)($row['count'] ?? 0);
        }
        
        // Count departments
        $result = $conn->query("SELECT COUNT(*) as count FROM departments WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['departments'] = (int)($row['count'] ?? 0);
        }
        
        // Count sections
        $result = $conn->query("SELECT COUNT(*) as count FROM sections WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['sections'] = (int)($row['count'] ?? 0);
        }
        
        // Count violations
        $result = $conn->query("SELECT COUNT(*) as count FROM violations WHERE deleted_at IS NULL");
        if ($result) {
            $row = $result->fetch_assoc();
            $stats['violations'] = (int)($row['count'] ?? 0);
        }
        
        $context['stats'] = $stats;
        
        // Get departments list (limit to 20)
        $result = $conn->query("SELECT department_code, department_name FROM departments WHERE deleted_at IS NULL ORDER BY department_name LIMIT 20");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $context['departments'][] = [
                    'code' => $row['department_code'] ?? '',
                    'name' => $row['department_name'] ?? ''
                ];
            }
        }
        
        // Get sections list (limit to 30)
        $result = $conn->query("SELECT id, section_code, section_name, department_code FROM sections WHERE deleted_at IS NULL ORDER BY section_name LIMIT 30");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $context['sections'][] = [
                    'id' => $row['id'] ?? '',
                    'code' => $row['section_code'] ?? '',
                    'name' => $row['section_name'] ?? '',
                    'department' => $row['department_code'] ?? ''
                ];
            }
        }
        
        // Get recent students (limit to 10)
        $result = $conn->query("SELECT student_id, first_name, middle_name, last_name, email, department, section_id FROM students WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $context['recent_students'][] = [
                    'id' => $row['student_id'] ?? '',
                    'name' => trim(($row['first_name'] ?? '') . ' ' . ($row['middle_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'email' => $row['email'] ?? '',
                    'department' => $row['department'] ?? '',
                    'section_id' => $row['section_id'] ?? ''
                ];
            }
        }
        
        // Get recent violations (limit to 10)
        $result = $conn->query("SELECT v.id, v.case_id, v.student_id, v.violation_type, v.violation_level, v.status, v.violation_date, 
                                       s.first_name, s.middle_name, s.last_name
                                FROM violations v
                                LEFT JOIN students s ON v.student_id = s.student_id
                                WHERE v.deleted_at IS NULL
                                ORDER BY v.violation_date DESC, v.created_at DESC
                                LIMIT 10");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $studentName = trim(($row['first_name'] ?? '') . ' ' . ($row['middle_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
                $context['recent_violations'][] = [
                    'id' => $row['id'] ?? '',
                    'case_id' => $row['case_id'] ?? '',
                    'student_id' => $row['student_id'] ?? '',
                    'student_name' => $studentName ?: 'Unknown',
                    'violation_type' => $row['violation_type'] ?? '',
                    'violation_level' => $row['violation_level'] ?? '',
                    'status' => $row['status'] ?? '',
                    'date' => $row['violation_date'] ?? ''
                ];
            }
        }
        
        // Add user-specific info
        if ($user_id && $user_role) {
            $context['user_info'] = [
                'id' => $user_id,
                'role' => $user_role
            ];
            
            if ($user_role === 'user') {
                // Get user's violation count
                $stmt = $conn->prepare("SELECT COUNT(*) as count FROM violations WHERE student_id = ? AND deleted_at IS NULL");
                if ($stmt) {
                    $stmt->bind_param("s", $user_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    if ($result) {
                        $row = $result->fetch_assoc();
                        $context['user_info']['violation_count'] = (int)($row['count'] ?? 0);
                    }
                    $stmt->close();
                }
            }
        }
        
    } else {
        throw new Exception('Database connection failed');
    }
    
    echo json_encode([
        'success' => true,
        'context' => $context
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

