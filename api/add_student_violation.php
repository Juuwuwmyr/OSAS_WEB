<?php
error_reporting(E_ALL);
$isProduction = false;
ini_set('display_errors', $isProduction ? 0 : 1);
ini_set('log_errors', 1);

while (ob_get_level() > 0) {
    ob_end_clean();
}
ob_start();

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../app/core/Model.php';
    require_once __DIR__ . '/../app/models/ViolationModel.php';
    require_once __DIR__ . '/../app/models/StudentModel.php';

    $vModel = new ViolationModel();
    $sModel = new StudentModel();
    $conn = $vModel->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    if ($method === 'GET' && $action === 'check') {
        $studentId = trim($_GET['student_id'] ?? '');
        $violationTypeId = intval($_GET['violation_type'] ?? 0);

        if ($studentId === '' || $violationTypeId === 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'student_id and violation_type are required']);
            exit;
        }

        $levelsRow = null;
        $stmt = $conn->prepare("SELECT * FROM student_violation_levels WHERE student_id = ? AND violation_type = ?");
        $vt = (string)$violationTypeId;
        $stmt->bind_param("ss", $studentId, $vt);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $res->num_rows > 0) {
            $levelsRow = $res->fetch_assoc();
        }
        $stmt->close();

        $existsQuery = "SELECT COUNT(*) as total FROM violations WHERE BINARY student_id = BINARY ? AND violation_type_id = ? AND is_archived = 0";
        $stmt2 = $conn->prepare($existsQuery);
        $stmt2->bind_param("si", $studentId, $violationTypeId);
        $stmt2->execute();
        $r2 = $stmt2->get_result();
        $total = 0;
        if ($r2 && $row = $r2->fetch_assoc()) {
            $total = (int)$row['total'];
        }
        $stmt2->close();

        $lastQuery = "SELECT v.id, v.violation_level_id, vl.name as level_name, v.status, v.violation_date, v.violation_time
                      FROM violations v 
                      LEFT JOIN violation_levels vl ON v.violation_level_id = vl.id
                      WHERE BINARY v.student_id = BINARY ? AND v.violation_type_id = ? AND v.is_archived = 0
                      ORDER BY v.created_at DESC LIMIT 1";
        $stmt3 = $conn->prepare($lastQuery);
        $stmt3->bind_param("si", $studentId, $violationTypeId);
        $stmt3->execute();
        $r3 = $stmt3->get_result();
        $last = null;
        if ($r3 && $r3->num_rows > 0) {
            $last = $r3->fetch_assoc();
        }
        $stmt3->close();

        $currentLevel = $levelsRow['current_level'] ?? null;
        $status = $levelsRow['status'] ?? 'active';
        $permittedCount = (int)($levelsRow['permitted_count'] ?? 0);
        $warningCount = (int)($levelsRow['warning_count'] ?? 0);
        $totalViolations = (int)($levelsRow['total_violations'] ?? $total);

        echo json_encode([
            'status' => 'success',
            'data' => [
                'exists' => $total > 0,
                'total' => $total,
                'current_level' => $currentLevel,
                'status' => $status,
                'permitted_count' => $permittedCount,
                'warning_count' => $warningCount,
                'total_violations' => $totalViolations,
                'last' => $last
            ]
        ]);
        exit;
    }

    if ($method === 'POST' && $action === 'sync') {
        $input = $_POST;
        if (empty($input)) {
            $json = json_decode(file_get_contents('php://input'), true);
            if (is_array($json)) $input = $json;
        }

        $studentId = trim($input['studentId'] ?? '');
        $violationTypeId = intval($input['violationTypeId'] ?? 0);
        $violationLevelId = intval($input['violationLevelId'] ?? 0);
        $statusIn = trim($input['status'] ?? '');

        if ($studentId === '' || $violationTypeId === 0 || $violationLevelId === 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'studentId, violationTypeId and violationLevelId are required']);
            exit;
        }

        $lvlStmt = $conn->prepare("SELECT name FROM violation_levels WHERE id = ?");
        $lvlStmt->bind_param("i", $violationLevelId);
        $lvlStmt->execute();
        $lvlRes = $lvlStmt->get_result();
        $levelName = '';
        if ($lvlRes && $row = $lvlRes->fetch_assoc()) {
            $levelName = strtolower($row['name']);
        }
        $lvlStmt->close();

        $conn->begin_transaction();
        try {
            $sel = $conn->prepare("SELECT * FROM student_violation_levels WHERE student_id = ? AND violation_type = ?");
            $vt = (string)$violationTypeId;
            $sel->bind_param("ss", $studentId, $vt);
            $sel->execute();
            $curRes = $sel->get_result();
            $existing = $curRes && $curRes->num_rows > 0 ? $curRes->fetch_assoc() : null;
            $sel->close();

            $permittedCount = (int)($existing['permitted_count'] ?? 0);
            $warningCount = (int)($existing['warning_count'] ?? 0);
            $totalViolations = (int)($existing['total_violations'] ?? 0);
            $currentLevel = $existing['current_level'] ?? 'permitted1';
            $recordStatus = $existing['status'] ?? 'active';

            if (strpos($levelName, 'permit') !== false || strpos($levelName, 'permitted') !== false) {
                $permittedCount += 1;
                $currentLevel = $permittedCount >= 2 ? 'permitted2' : 'permitted1';
            } elseif (strpos($levelName, 'warning 1') !== false || strpos($levelName, '1st') !== false) {
                $warningCount = max($warningCount, 1);
                $currentLevel = 'warning1';
            } elseif (strpos($levelName, 'warning 2') !== false || strpos($levelName, '2nd') !== false) {
                $warningCount = max($warningCount, 2);
                $currentLevel = 'warning2';
            } elseif (strpos($levelName, 'warning 3') !== false || strpos($levelName, '3rd') !== false) {
                $warningCount = max($warningCount, 3);
                $currentLevel = 'warning3';
                $recordStatus = 'disciplinary';
            } elseif (strpos($levelName, 'disciplinary') !== false) {
                $currentLevel = 'disciplinary';
                $recordStatus = 'disciplinary';
            }

            $totalViolations += 1;

            $nowDate = date('Y-m-d');
            $nowTime = date('H:i:s');

            if ($existing) {
                $upd = $conn->prepare("UPDATE student_violation_levels SET current_level = ?, permitted_count = ?, warning_count = ?, total_violations = ?, status = ?, last_violation_date = ?, last_violation_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $id = (int)$existing['id'];
                $upd->bind_param("siiisssi", $currentLevel, $permittedCount, $warningCount, $totalViolations, $recordStatus, $nowDate, $nowTime, $id);
                $upd->execute();
                $upd->close();
            } else {
                $ins = $conn->prepare("INSERT INTO student_violation_levels (student_id, violation_type, current_level, permitted_count, warning_count, total_violations, last_violation_date, last_violation_time, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
                $ins->bind_param("sssiiisss", $studentId, $vt, $currentLevel, $permittedCount, $warningCount, $totalViolations, $nowDate, $nowTime, $recordStatus);
                $ins->execute();
                $ins->close();
            }

            $shouldDeactivate = false;
            if ($recordStatus === 'disciplinary' || $currentLevel === 'disciplinary' || $warningCount >= 3) {
                $shouldDeactivate = true;
                $stu = $sModel->query("SELECT id, status FROM students WHERE student_id = ?", [$studentId]);
                if (!empty($stu)) {
                    $sid = (int)$stu[0]['id'];
                    $conn->query("UPDATE students SET status = 'inactive', updated_at = NOW() WHERE id = " . $sid);
                }
                $conn->query("UPDATE users SET is_active = 0, updated_at = NOW() WHERE student_id = '" . $conn->real_escape_string($studentId) . "'");
            }

            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'current_level' => $currentLevel,
                    'permitted_count' => $permittedCount,
                    'warning_count' => $warningCount,
                    'total_violations' => $totalViolations,
                    'record_status' => $recordStatus,
                    'shouldDeactivate' => $shouldDeactivate
                ]
            ]);
            exit;
        } catch (Throwable $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            exit;
        }
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit;
} catch (Throwable $e) {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}
