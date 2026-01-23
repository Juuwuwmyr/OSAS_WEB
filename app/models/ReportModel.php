<?php
require_once __DIR__ . '/../core/Model.php';

class ReportModel extends Model {
    protected $table = 'reports';
    protected $primaryKey = 'id';
    
    /**
     * Generate or update reports from violations
     * This should be called periodically or when violations are added/updated
     */
    public function generateReportsFromViolations($startDate = null, $endDate = null) {
        // Check if reports table exists, if not create it
        $tableCheck = @$this->conn->query("SHOW TABLES LIKE 'reports'");
        if ($tableCheck === false || $tableCheck->num_rows === 0) {
            throw new Exception('Reports table does not exist. Please run database/reports_table.sql');
        }
        
        // Check if violations table exists
        $violationCheck = @$this->conn->query("SHOW TABLES LIKE 'violations'");
        if ($violationCheck === false || $violationCheck->num_rows === 0) {
            throw new Exception('Violations table does not exist.');
        }
        
        // Build query to aggregate violations by student
        $query = "SELECT 
                    s.id as student_db_id,
                    s.student_id,
                    s.first_name,
                    s.middle_name,
                    s.last_name,
                    s.contact_number,
                    s.avatar,
                    s.department as student_dept_code,
                    s.section_id,
                    s.yearlevel,
                    COALESCE(d.department_name, s.department) as department_name,
                    COALESCE(sec.section_code, 'N/A') as section_code,
                    COALESCE(sec.section_name, 'N/A') as section_name,
                    COUNT(CASE WHEN v.violation_type = 'improper_uniform' THEN 1 END) as uniform_count,
                    COUNT(CASE WHEN v.violation_type = 'improper_footwear' THEN 1 END) as footwear_count,
                    COUNT(CASE WHEN v.violation_type = 'no_id' THEN 1 END) as no_id_count,
                    COUNT(v.id) as total_violations,
                    MAX(CASE 
                        WHEN v.status = 'disciplinary' THEN 3
                        WHEN v.status = 'warning' THEN 2
                        WHEN v.status = 'permitted' THEN 1
                        ELSE 0
                    END) as max_status_level,
                    MAX(v.violation_date) as last_violation_date,
                    MIN(v.violation_date) as first_violation_date
                  FROM students s
                  INNER JOIN violations v ON BINARY v.student_id = BINARY s.student_id
                  LEFT JOIN departments d ON s.department = d.department_code
                  LEFT JOIN sections sec ON s.section_id = sec.id
                  WHERE s.status != 'archived'";
        
        $params = [];
        $types = "";
        
        // Apply date filters if provided
        if ($startDate && $endDate) {
            $query .= " AND v.violation_date BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= "ss";
        } elseif ($startDate) {
            $query .= " AND v.violation_date >= ?";
            $params[] = $startDate;
            $types .= "s";
        } elseif ($endDate) {
            $query .= " AND v.violation_date <= ?";
            $params[] = $endDate;
            $types .= "s";
        }
        
        $query .= " GROUP BY s.id, s.student_id, s.first_name, s.middle_name, s.last_name, 
                           s.contact_number, s.avatar, s.department, s.section_id, 
                           d.department_name, sec.section_code, sec.section_name
                    HAVING COUNT(v.id) > 0";
        
        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $this->conn->error);
            }
            
            if (!empty($params) && !empty($types)) {
                if (!$stmt->bind_param($types, ...$params)) {
                    throw new Exception('Bind param failed: ' . $stmt->error);
                }
            }
            
            if (!$stmt->execute()) {
                throw new Exception('Execute failed: ' . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $generated = 0;
            $updated = 0;
            
            while ($row = $result->fetch_assoc()) {
                $firstName = $row['first_name'] ?? '';
                $middleName = $row['middle_name'] ?? '';
                $lastName = $row['last_name'] ?? '';
                $fullName = trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName);
                
                if (empty($fullName)) {
                    $fullName = 'Student ' . ($row['student_id'] ?? 'Unknown');
                }
                
                // Determine status
                $maxStatusLevel = (int)($row['max_status_level'] ?? 0);
                $status = 'permitted';
                if ($maxStatusLevel >= 3) {
                    $status = 'disciplinary';
                } elseif ($maxStatusLevel >= 2) {
                    $status = 'warning';
                }
                
                // Generate report ID
                $reportId = 'R' . str_pad($row['student_db_id'], 3, '0', STR_PAD_LEFT);
                
                // Check if report exists
                $existing = $this->query("SELECT id FROM reports WHERE report_id = ?", [$reportId]);
                
                $data = [
                    'report_id' => $reportId,
                    'student_id' => $row['student_id'],
                    'student_name' => $fullName,
                    'student_contact' => $row['contact_number'] ?? null,
                    'department' => $row['department_name'] ?? ($row['student_dept_code'] ?? null),
                    'department_code' => $row['student_dept_code'] ?? null,
                    'section' => $row['section_code'] ?? null,
                    'section_id' => $row['section_id'] ?? null,
                    'yearlevel' => $row['yearlevel'] ?? 'N/A',
                    'uniform_count' => (int)($row['uniform_count'] ?? 0),
                    'footwear_count' => (int)($row['footwear_count'] ?? 0),
                    'no_id_count' => (int)($row['no_id_count'] ?? 0),
                    'total_violations' => (int)($row['total_violations'] ?? 0),
                    'status' => $status,
                    'last_violation_date' => $row['last_violation_date'] ?? null,
                    'report_period_start' => $row['first_violation_date'] ?? $startDate,
                    'report_period_end' => $row['last_violation_date'] ?? $endDate
                ];
                
                if (!empty($existing)) {
                    // Update existing report
                    $this->update($existing[0]['id'], $data);
                    $updated++;
                } else {
                    // Create new report
                    $this->create($data);
                    $generated++;
                }
            }
            
            $stmt->close();
            
            // Sync violation history and recommendations
            $this->syncReportViolations($startDate, $endDate);
            $this->syncReportRecommendations();
            
            return [
                'generated' => $generated,
                'updated' => $updated,
                'total' => $generated + $updated
            ];
            
        } catch (Exception $e) {
            if (isset($stmt)) {
                $stmt->close();
            }
            error_log("ReportModel::generateReportsFromViolations error: " . $e->getMessage());
            throw new Exception('Failed to generate reports: ' . $e->getMessage());
        }
    }
    
    /**
     * Get reports from reports table
     */
    public function getStudentReports($filters = []) {
        // Check if reports table exists
        $tableCheck = @$this->conn->query("SHOW TABLES LIKE 'reports'");
        if ($tableCheck === false || $tableCheck->num_rows === 0) {
            // If table doesn't exist, generate reports first
            try {
                $this->generateReportsFromViolations();
            } catch (Exception $e) {
                throw new Exception('Reports table does not exist and could not be generated: ' . $e->getMessage());
            }
        }
        
        $department = $filters['department'] ?? 'all';
        $section = $filters['section'] ?? 'all';
        $status = $filters['status'] ?? 'all';
        $startDate = $filters['startDate'] ?? null;
        $endDate = $filters['endDate'] ?? null;
        $search = $filters['search'] ?? '';
        
        $query = "SELECT r.*, s.avatar, s.yearlevel
                  FROM reports r
                  LEFT JOIN students s ON BINARY r.student_id = BINARY s.student_id
                  WHERE 1=1";
        
        $params = [];
        $types = "";
        
        // Apply filters
        if ($department !== 'all' && !empty($department)) {
            $query .= " AND r.department_code = ?";
            $params[] = $department;
            $types .= "s";
        }
        
        if ($section !== 'all' && !empty($section)) {
            $query .= " AND (r.section = ? OR r.section_id = ?)";
            $params[] = $section;
            $params[] = $section;
            $types .= "ss";
        }
        
        if ($status !== 'all' && !empty($status)) {
            $query .= " AND r.status = ?";
            $params[] = $status;
            $types .= "s";
        }
        
        if ($startDate && $endDate) {
            $query .= " AND r.report_period_start >= ? AND r.report_period_end <= ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= "ss";
        } elseif ($startDate) {
            $query .= " AND r.report_period_start >= ?";
            $params[] = $startDate;
            $types .= "s";
        } elseif ($endDate) {
            $query .= " AND r.report_period_end <= ?";
            $params[] = $endDate;
            $types .= "s";
        }
        
        if (!empty($search)) {
            $query .= " AND (r.student_name LIKE ? OR r.student_id LIKE ? OR r.report_id LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= "sss";
        }
        
        $query .= " ORDER BY r.total_violations DESC, r.student_name ASC";
        
        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $this->conn->error);
            }
            
            if (!empty($params) && !empty($types)) {
                if (!$stmt->bind_param($types, ...$params)) {
                    throw new Exception('Bind param failed: ' . $stmt->error);
                }
            }
            
            if (!$stmt->execute()) {
                throw new Exception('Execute failed: ' . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $reports = [];
            
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $avatar = $row['avatar'] ?? '';
                    if (empty($avatar)) {
                        $avatar = 'https://ui-avatars.com/api/?name=' . urlencode($row['student_name']) . '&background=ffd700&color=333&size=80';
                    }
                    
                    $statusLabels = [
                        'permitted' => 'Permitted',
                        'warning' => 'Warning',
                        'disciplinary' => 'Disciplinary Action'
                    ];
                    $statusLabel = $statusLabels[$row['status']] ?? ucfirst($row['status']);
                    
                    // Get violation history
                    $history = $this->getReportViolationHistory($row['id']);
                    
                    // Get recommendations
                    $recommendations = $this->getReportRecommendations($row['id']);
                    
                    $reports[] = [
                        'id' => (int)$row['id'],
                        'reportId' => $row['report_id'],
                        'studentId' => $row['student_id'],
                        'studentName' => $row['student_name'],
                        'studentImage' => $avatar,
                        'studentContact' => $row['student_contact'] ?? 'N/A',
                        'department' => $row['department'] ?? 'N/A',
                        'deptCode' => $row['department_code'] ?? '',
                        'section' => $row['section'] ?? 'N/A',
                        'sectionName' => $row['section'] ?? 'N/A',
                        'yearlevel' => $row['yearlevel'] ?? 'N/A',
                        'uniformCount' => (int)($row['uniform_count'] ?? 0),
                        'footwearCount' => (int)($row['footwear_count'] ?? 0),
                        'noIdCount' => (int)($row['no_id_count'] ?? 0),
                        'totalViolations' => (int)($row['total_violations'] ?? 0),
                        'status' => $row['status'],
                        'statusLabel' => $statusLabel,
                        'lastUpdated' => $row['last_violation_date'] ?? date('Y-m-d'),
                        'history' => $history,
                        'recommendations' => $recommendations
                    ];
                }
            }
            
            $stmt->close();
            return $reports;
            
        } catch (Exception $e) {
            if (isset($stmt)) {
                $stmt->close();
            }
            error_log("ReportModel::getStudentReports error: " . $e->getMessage());
            throw new Exception('Database query error: ' . $e->getMessage());
        }
    }
    
    /**
     * Get violation history for a report
     */
    private function getReportViolationHistory($reportId) {
        $query = "SELECT 
                    violation_type,
                    violation_level,
                    violation_date,
                    violation_time,
                    status,
                    notes
                  FROM report_violations
                  WHERE report_id = ?
                  ORDER BY violation_date DESC, violation_time DESC LIMIT 10";
        
        try {
            $results = $this->query($query, [$reportId]);
            $history = [];
            
            $violationTypeLabels = [
                'improper_uniform' => 'Improper Uniform',
                'no_id' => 'No ID',
                'improper_footwear' => 'Improper Footwear',
                'misconduct' => 'Misconduct'
            ];
            
            $violationLevelLabels = [
                'permitted1' => 'Permitted 1',
                'permitted2' => 'Permitted 2',
                'warning1' => 'Warning 1',
                'warning2' => 'Warning 2',
                'warning3' => 'Warning 3',
                'disciplinary' => 'Disciplinary'
            ];
            
            foreach ($results as $row) {
                $violationType = $violationTypeLabels[$row['violation_type']] ?? ucfirst(str_replace('_', ' ', $row['violation_type']));
                $violationLevel = $violationLevelLabels[$row['violation_level']] ?? ucfirst($row['violation_level']);
                
                $date = $row['violation_date'] ?? '';
                $formattedDate = '';
                if ($date) {
                    $dateObj = new DateTime($date);
                    $formattedDate = $dateObj->format('M d, Y');
                }
                
                $history[] = [
                    'date' => $formattedDate,
                    'title' => $violationType . ' - ' . $violationLevel,
                    'desc' => $row['notes'] ?? 'No additional notes'
                ];
            }
            
            return $history;
        } catch (Exception $e) {
            error_log("Error getting report violation history: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get recommendations for a report
     */
    private function getReportRecommendations($reportId) {
        $query = "SELECT recommendation FROM report_recommendations 
                  WHERE report_id = ? 
                  ORDER BY priority DESC, id ASC";
        
        try {
            $results = $this->query($query, [$reportId]);
            return array_column($results, 'recommendation');
        } catch (Exception $e) {
            error_log("Error getting report recommendations: " . $e->getMessage());
            return $this->generateRecommendations(0, 'permitted');
        }
    }
    
    /**
     * Sync violation history to report_violations table
     */
    private function syncReportViolations($startDate = null, $endDate = null) {
        $query = "SELECT r.id as report_id, v.id as violation_id, v.violation_type, 
                         v.violation_level, v.violation_date, v.violation_time, 
                         v.status, v.notes
                  FROM reports r
                  INNER JOIN violations v ON BINARY r.student_id = BINARY v.student_id";
        
        $params = [];
        $types = "";
        
        if ($startDate && $endDate) {
            $query .= " WHERE v.violation_date BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= "ss";
        }
        
        try {
            $stmt = $this->conn->prepare($query);
            if (!empty($params) && !empty($types)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Clear existing violations for reports in the date range (if specified)
            // We'll delete and re-insert to ensure data consistency
            if ($startDate && $endDate) {
                $clearQuery = "DELETE rv FROM report_violations rv 
                              INNER JOIN reports r ON rv.report_id = r.id
                              WHERE r.report_period_start >= ? AND r.report_period_end <= ?";
                $clearStmt = $this->conn->prepare($clearQuery);
                $clearStmt->bind_param("ss", $startDate, $endDate);
                $clearStmt->execute();
                $clearStmt->close();
            }
            
            // Insert violations
            while ($row = $result->fetch_assoc()) {
                // Check if violation already exists for this report
                $checkQuery = "SELECT id FROM report_violations 
                              WHERE report_id = ? AND violation_id = ?";
                $checkStmt = $this->conn->prepare($checkQuery);
                $checkStmt->bind_param("ii", $row['report_id'], $row['violation_id']);
                $checkStmt->execute();
                $exists = $checkStmt->get_result()->num_rows > 0;
                $checkStmt->close();
                
                if (!$exists) {
                    $insertQuery = "INSERT INTO report_violations 
                                   (report_id, violation_id, violation_type, violation_level, 
                                    violation_date, violation_time, status, notes)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    
                    $insertStmt = $this->conn->prepare($insertQuery);
                    $insertStmt->bind_param("iissssss",
                        $row['report_id'],
                        $row['violation_id'],
                        $row['violation_type'],
                        $row['violation_level'],
                        $row['violation_date'],
                        $row['violation_time'],
                        $row['status'],
                        $row['notes']
                    );
                    $insertStmt->execute();
                    $insertStmt->close();
                }
            }
            
            $stmt->close();
        } catch (Exception $e) {
            error_log("Error syncing report violations: " . $e->getMessage());
        }
    }
    
    /**
     * Sync recommendations to report_recommendations table
     */
    private function syncReportRecommendations() {
        $reports = $this->query("SELECT id, total_violations, status FROM reports");
        
        foreach ($reports as $report) {
            $recommendations = $this->generateRecommendations(
                (int)$report['total_violations'],
                $report['status']
            );
            
            // Clear existing recommendations
            $this->conn->query("DELETE FROM report_recommendations WHERE report_id = " . (int)$report['id']);
            
            // Insert new recommendations
            foreach ($recommendations as $index => $rec) {
                $priority = 'medium';
                if ($report['total_violations'] >= 5 || $report['status'] === 'disciplinary') {
                    $priority = 'high';
                } elseif ($report['total_violations'] < 2) {
                    $priority = 'low';
                }
                
                $insertQuery = "INSERT INTO report_recommendations 
                               (report_id, recommendation, priority) 
                               VALUES (?, ?, ?)";
                $insertStmt = $this->conn->prepare($insertQuery);
                $insertStmt->bind_param("iss", $report['id'], $rec, $priority);
                $insertStmt->execute();
                $insertStmt->close();
            }
        }
    }
    
    /**
     * Generate recommendations based on violation count and status
     */
    private function generateRecommendations($totalViolations, $status) {
        $recommendations = [];
        
        if ($totalViolations >= 5 || $status === 'disciplinary') {
            $recommendations[] = 'Schedule counseling session with student';
            $recommendations[] = 'Notify parents about disciplinary status';
            $recommendations[] = 'Monitor student for next 30 days';
        } elseif ($totalViolations >= 3 || $status === 'warning') {
            $recommendations[] = 'Issue written warning';
            $recommendations[] = 'Monitor uniform compliance';
            $recommendations[] = 'Schedule follow-up meeting';
        } else {
            $recommendations[] = 'Remind student about dress code policies';
            $recommendations[] = 'Monitor compliance for 2 weeks';
        }
        
        return $recommendations;
    }
    
    /**
     * Get statistics for reports
     */
    public function getReportStats($filters = []) {
        $reports = $this->getStudentReports($filters);
        
        $stats = [
            'totalViolations' => 0,
            'uniformViolations' => 0,
            'footwearViolations' => 0,
            'noIdViolations' => 0,
            'totalStudents' => count($reports)
        ];
        
        foreach ($reports as $report) {
            $stats['totalViolations'] += $report['totalViolations'];
            $stats['uniformViolations'] += $report['uniformCount'];
            $stats['footwearViolations'] += $report['footwearCount'];
            $stats['noIdViolations'] += $report['noIdCount'];
        }
        
        return $stats;
    }
}
