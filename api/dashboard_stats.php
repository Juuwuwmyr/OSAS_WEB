<?php
/**
 * Dashboard Statistics API
 * Returns all statistics needed for the dashboard
 */

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../app/config/db_connect.php';

// Get student ID if user is logged in as 'user' role
$userRole = $_SESSION['role'] ?? null;
$studentId = null;
if ($userRole === 'user') {
    // Prefer student_id_code (the actual student ID string) over student_id (database ID)
    $studentId = $_SESSION['student_id_code'] ?? $_SESSION['student_id'] ?? null;
}

try {
    // Use the $conn from db_connect.php
    
    // Get students count (check if deleted_at column exists, otherwise use status)
    $studentsCount = 0;
    // Try with status column first (students table uses status, not deleted_at)
    $studentsResult = $conn->query("SELECT COUNT(*) as count FROM students WHERE status != 'archived' OR status IS NULL");
    if ($studentsResult) {
        $row = $studentsResult->fetch_assoc();
        $studentsCount = (int)$row['count'];
    } else {
        // Fallback: count all students
        $studentsResult = $conn->query("SELECT COUNT(*) as count FROM students");
        if ($studentsResult) {
            $row = $studentsResult->fetch_assoc();
            $studentsCount = (int)$row['count'];
        }
    }
    
    // Get departments count (use status column)
    $departmentsResult = $conn->query("SELECT COUNT(*) as count FROM departments WHERE status = 'active' OR status IS NULL");
    $departmentsCount = 0;
    if ($departmentsResult) {
        $row = $departmentsResult->fetch_assoc();
        $departmentsCount = (int)$row['count'];
    } else {
        // Fallback: count all departments
        $departmentsResult = $conn->query("SELECT COUNT(*) as count FROM departments");
        if ($departmentsResult) {
            $row = $departmentsResult->fetch_assoc();
            $departmentsCount = (int)$row['count'];
        }
    }
    
    // Get sections count (use status column)
    $sectionsResult = $conn->query("SELECT COUNT(*) as count FROM sections WHERE status = 'active' OR status IS NULL");
    $sectionsCount = 0;
    if ($sectionsResult) {
        $row = $sectionsResult->fetch_assoc();
        $sectionsCount = (int)$row['count'];
    } else {
        // Fallback: count all sections
        $sectionsResult = $conn->query("SELECT COUNT(*) as count FROM sections");
        if ($sectionsResult) {
            $row = $sectionsResult->fetch_assoc();
            $sectionsCount = (int)$row['count'];
        }
    }
    
    // Build WHERE clause for user filtering
    $whereClause = '';
    $whereParams = [];
    $whereTypes = '';
    if ($studentId) {
        $whereClause = " WHERE BINARY v.student_id = BINARY ?";
        $whereParams[] = $studentId;
        $whereTypes = 's';
    }
    
    // Get violations count
    $violationsQuery = "SELECT COUNT(*) as count FROM violations v" . $whereClause;
    $violationsStmt = $conn->prepare($violationsQuery);
    if ($studentId && $violationsStmt) {
        $violationsStmt->bind_param($whereTypes, ...$whereParams);
        $violationsStmt->execute();
        $violationsResult = $violationsStmt->get_result();
    } else {
        $violationsResult = $conn->query($violationsQuery);
    }
    $violationsCount = 0;
    if ($violationsResult) {
        $row = $violationsResult->fetch_assoc();
        $violationsCount = (int)$row['count'];
    }
    if (isset($violationsStmt)) $violationsStmt->close();
    
    // Get unique violators count (students with at least one violation)
    // For users, this will always be 1 (themselves) or 0
    if ($studentId) {
        $violatorsCount = $violationsCount > 0 ? 1 : 0;
    } else {
        $violatorsResult = $conn->query("SELECT COUNT(DISTINCT student_id) as count FROM violations WHERE student_id IS NOT NULL AND student_id != ''");
        $violatorsCount = 0;
        if ($violatorsResult) {
            $row = $violatorsResult->fetch_assoc();
            $violatorsCount = (int)$row['count'];
        }
    }
    
    // Get penalties count (violations with disciplinary status or disciplinary level)
    $penaltiesQuery = "SELECT COUNT(*) as count FROM violations v WHERE (v.status = 'disciplinary' OR v.violation_level = 'disciplinary')" . ($studentId ? " AND BINARY v.student_id = BINARY ?" : "");
    $penaltiesStmt = $conn->prepare($penaltiesQuery);
    if ($studentId && $penaltiesStmt) {
        $penaltiesStmt->bind_param('s', $studentId);
        $penaltiesStmt->execute();
        $penaltiesResult = $penaltiesStmt->get_result();
    } else {
        $penaltiesResult = $conn->query($penaltiesQuery);
    }
    $penaltiesCount = 0;
    if ($penaltiesResult) {
        $row = $penaltiesResult->fetch_assoc();
        $penaltiesCount = (int)$row['count'];
    }
    if (isset($penaltiesStmt)) $penaltiesStmt->close();
    
    // Get recent violations (last 10)
    $recentViolationsQuery = "
        SELECT v.id,
               v.case_id,
               v.student_id,
               v.violation_type,
               v.violation_level,
               v.violation_date,
               v.violation_time,
               v.status,
               v.location,
               v.reported_by,
               v.notes,
               v.created_at,
               v.updated_at,
               s.first_name, 
               s.last_name, 
               s.avatar,
               s.department
        FROM violations v
        LEFT JOIN students s ON BINARY v.student_id = BINARY s.student_id" .
        ($studentId ? " WHERE BINARY v.student_id = BINARY ?" : "") . "
        ORDER BY v.created_at DESC
        LIMIT 10
    ";
    $recentViolationsStmt = $conn->prepare($recentViolationsQuery);
    if ($studentId && $recentViolationsStmt) {
        $recentViolationsStmt->bind_param('s', $studentId);
        $recentViolationsStmt->execute();
        $recentViolationsResult = $recentViolationsStmt->get_result();
    } else {
        $recentViolationsResult = $conn->query($recentViolationsQuery);
    }
    $recentViolations = [];
    if ($recentViolationsResult) {
        while ($row = $recentViolationsResult->fetch_assoc()) {
            $recentViolations[] = $row;
        }
    }
    if (isset($recentViolationsStmt)) $recentViolationsStmt->close();
    
    // Get top violators (students with most violations)
    // For users, this will only show themselves if they have violations
    if ($studentId) {
        $topViolatorsQuery = "
            SELECT 
                v.student_id,
                s.first_name,
                s.last_name,
                s.avatar,
                COUNT(*) as violation_count
            FROM violations v
            LEFT JOIN students s ON BINARY v.student_id = BINARY s.student_id
            WHERE BINARY v.student_id = BINARY ?
            GROUP BY v.student_id, s.first_name, s.last_name, s.avatar
            ORDER BY violation_count DESC
            LIMIT 5
        ";
        $topViolatorsStmt = $conn->prepare($topViolatorsQuery);
        if ($topViolatorsStmt) {
            $topViolatorsStmt->bind_param('s', $studentId);
            $topViolatorsStmt->execute();
            $topViolatorsResult = $topViolatorsStmt->get_result();
        } else {
            $topViolatorsResult = false;
        }
    } else {
        $topViolatorsResult = $conn->query("
            SELECT 
                v.student_id,
                s.first_name,
                s.last_name,
                s.avatar,
                COUNT(*) as violation_count
            FROM violations v
            LEFT JOIN students s ON BINARY v.student_id = BINARY s.student_id
            WHERE v.student_id IS NOT NULL AND v.student_id != ''
            GROUP BY v.student_id, s.first_name, s.last_name, s.avatar
            ORDER BY violation_count DESC
            LIMIT 5
        ");
    }
    $topViolators = [];
    if ($topViolatorsResult) {
        while ($row = $topViolatorsResult->fetch_assoc()) {
            $topViolators[] = $row;
        }
    }
    if (isset($topViolatorsStmt)) $topViolatorsStmt->close();
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'stats' => [
                'students' => $studentsCount,
                'departments' => $departmentsCount,
                'sections' => $sectionsCount,
                'violations' => $violationsCount,
                'violators' => $violatorsCount,
                'penalties' => $penaltiesCount
            ],
            'recentViolations' => $recentViolations,
            'topViolators' => $topViolators
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Dashboard Stats API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to retrieve dashboard statistics',
        'error' => $e->getMessage()
    ]);
}

