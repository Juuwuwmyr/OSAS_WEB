<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ViolationModel.php';
require_once __DIR__ . '/../models/StudentModel.php';

class ViolationController extends Controller
{
    private $model;
    private $studentModel;

    public function __construct()
    {
        header('Content-Type: application/json');
        @session_start();

        $this->model = new ViolationModel();
        $this->studentModel = new StudentModel();
    }

    /**
     * GET /api/violations.php?student_id=123 (optional)
     * If student_id is provided, returns violations for that student
     * If role is 'user', automatically filters by their student_id
     * If not provided and role is admin, returns all violations
     */
    public function index()
    {
        $action = $this->getGet('action', '');

        if ($action === 'types') {
            $this->get_types();
            return;
        }

        if ($action === 'generate_slip') {
            $this->generate_slip();
            return;
        }

        $studentId = $this->getGet('student_id', '');
        $filter    = $this->getGet('filter', 'all');
        $search    = $this->getGet('search', '');

        if (isset($_SESSION['role']) && $_SESSION['role'] === 'user') {
            $studentId = $_SESSION['student_id_code'] ?? '';
            if (empty($studentId)) {
                $this->error('Student ID not found. Please login again.', '', 401);
            }
        }

        try {
            $violations = $this->model->getAllWithStudentInfo(
                $filter,
                $search,
                $studentId  // Empty string means get all violations
            );

            $this->json([
                'status'  => 'success',
                'message' => count($violations) > 0
                    ? 'Violations retrieved successfully'
                    : 'No violations found',
                'violations' => $violations,  // Also include 'violations' key for compatibility
                'data'    => $violations,
                'count'   => count($violations)
            ]);

        } catch (Exception $e) {
            error_log('ViolationController@index: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            $this->error('Failed to retrieve violations: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/violations.php
     */
    public function create()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

        $studentId      = $this->sanitize($input['studentId'] ?? '');
        $violationType  = $this->sanitize($input['violationType'] ?? '');
        $violationLevel = $this->sanitize($input['violationLevel'] ?? '');
        $violationDate  = $this->sanitize($input['violationDate'] ?? '');
        $violationTime  = $this->sanitize($input['violationTime'] ?? '');
        $location       = $this->sanitize($input['location'] ?? '');
        $reportedBy     = $this->sanitize($input['reportedBy'] ?? '');
        $status         = $this->sanitize($input['status'] ?? 'warning');
        $notes          = $this->sanitize($input['notes'] ?? '');

        if (
            empty($studentId) || empty($violationType) || empty($violationLevel) ||
            empty($violationDate) || empty($violationTime) ||
            empty($location) || empty($reportedBy)
        ) {
            $this->error('All required fields must be filled');
        }

        // Get student info
        $student = $this->studentModel->query(
            "SELECT s.*, COALESCE(d.department_name, s.department) AS department_name
             FROM students s
             LEFT JOIN departments d ON d.department_code = s.department
             WHERE s.student_id = ?",
            [$studentId]
        );

        if (!$student) {
            $this->error('Student not found');
        }

        try {
            // Check for duplicate violation (Double Submission Check)
            // We check if a violation with the same details was already created
            // This prevents "2 copies of the same violation"
            $existingId = $this->model->checkDuplicateSubmission(
               $studentId, 
               $violationType, 
               $violationLevel,
               $violationDate, 
               $violationTime, 
               $location
            );
            
            if ($existingId) {
                // If it exists, we check if it was created very recently (e.g. < 10 seconds ago) to treat it as a double-submit
                // Or just block it entirely as "Duplicate".
                // User said "prevent duplicate of the same violation only one", so blocking duplicates is correct.
                $this->error('This violation has already been recorded.', ['existing_id' => $existingId]);
                return;
            }

            // Generate unique case ID with retry mechanism
            $maxRetries = 3;
            $caseId = null;
            
            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                $caseId = $this->model->generateCaseId();
                
                if (!$this->model->caseIdExists($caseId)) {
                    break; // Found unique case ID
                }
                
                if ($attempt === $maxRetries - 1) {
                    $this->error('Unable to generate unique case ID. Please try again.');
                    return;
                }
                
                // Wait a moment before retrying
                usleep(100000); // 0.1 seconds
            }

            $data = [
                'case_id'        => $caseId,
                'student_id'     => $studentId,
                'violation_type_id' => $violationType,
                'violation_level_id'=> $violationLevel,
                'department'     => $student[0]['department_name'] ?? 'N/A',
                'section'        => $student[0]['section_id'] ?? '',
                'violation_date' => $violationDate,
                'violation_time' => $violationTime,
                'location'       => $location,
                'reported_by'    => $reportedBy,
                'status'         => $status,
                'notes'          => $notes ?: null,
                'created_at'     => date('Y-m-d H:i:s')
            ];

            $id = $this->model->create($data);

            $this->success('Violation recorded successfully', [
                'id'      => $id,
                'case_id' => $caseId
            ]);

        } catch (Exception $e) {
            // Check if it's a duplicate key error
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                $this->error('A violation with this case ID already exists. Please try again.');
            } else {
                $this->error('Failed to save violation: ' . $e->getMessage());
            }
        }
    }

    /**
     * PUT /api/violations.php?id=1
     */
    public function update()
    {
        $id = intval($this->getGet('id', 0));
        if ($id === 0) {
            $this->error('Violation ID required');
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $current = $this->model->getById($id);

        if (!$current) {
            $this->error('Violation not found');
        }

        $data = [
            'violation_type_id'  => $this->sanitize($input['violationType'] ?? $current['violation_type_id']),
            'violation_level_id' => $this->sanitize($input['violationLevel'] ?? $current['violation_level_id']),
            'violation_date'  => $this->sanitize($input['violationDate'] ?? $current['violation_date']),
            'violation_time'  => $this->sanitize($input['violationTime'] ?? $current['violation_time']),
            'location'        => $this->sanitize($input['location'] ?? $current['location']),
            'reported_by'     => $this->sanitize($input['reportedBy'] ?? $current['reported_by']),
            'status'          => $this->sanitize($input['status'] ?? $current['status']),
            'notes'           => $this->sanitize($input['notes'] ?? $current['notes']),
            'updated_at'      => date('Y-m-d H:i:s')
        ];

        try {
            $this->model->update($id, $data);
            $this->success('Violation updated successfully');
        } catch (Exception $e) {
            $this->error('Failed to update violation');
        }
    }

    /**
     * DELETE /api/violations.php?id=1
     */
    public function delete()
    {
        $id = intval($this->getGet('id', 0));
        if ($id === 0) {
            $this->error('Violation ID required');
        }

        try {
            $this->model->delete($id);
            $this->success('Violation deleted successfully');
        } catch (Exception $e) {
            $this->error('Failed to delete violation');
        }
    }

    /**
     * Get violation types and levels
     */
    private function get_types() {
        try {
            $types = $this->model->getViolationTypes();
            $result = [];
            
            // If types are returned as assoc array with 'id' key (single row) or array of arrays
            // Check structure of getViolationTypes return
            if ($types && count($types) > 0) {
                foreach ($types as $type) {
                    $levels = $this->model->getViolationLevels($type['id']);
                    $type['levels'] = $levels;
                    $result[] = $type;
                }
            }
            
            $this->success('Violation types retrieved successfully', $result);
        } catch (Exception $e) {
            error_log("Error getting types: " . $e->getMessage());
            $this->error('Failed to retrieve violation types: ' . $e->getMessage());
        }
    }

    /**
     * Generate Entrance Slip DOCX
     */
    private function generate_slip()
    {
        // 1. Get Violation Data
        $violationId = $this->getGet('violation_id', '');
        if (empty($violationId)) {
            $this->error('Violation ID is required');
        }

        // Use getAllWithStudentInfo to search by Case ID and get FULL details (joined tables)
        // We pass 'all' as filter and the case ID as search term
        $violations = $this->model->getAllWithStudentInfo('all', $violationId);
        
        if (empty($violations)) {
            $this->error('Violation not found');
        }

        // Get the first match
        $violation = $violations[0];

        // 2. Load Template (Native PHP ZipArchive)
        // Updated to use SLIP.docx as requested
        $templatePath = __DIR__ . '/../assets/SLIP.docx';
        if (!file_exists($templatePath)) {
            // Fallback to old template if new one missing
            $templatePath = __DIR__ . '/../assets/EntranceSlip.docx';
            if (!file_exists($templatePath)) {
                $this->error('Template file not found: ' . $templatePath);
            }
        }

        // Create temp file
        $tempDir = sys_get_temp_dir();
        $tempFile = $tempDir . '/EntranceSlip_' . $violationId . '_' . time() . '.docx';
        if (!copy($templatePath, $tempFile)) {
            $this->error('Failed to create temporary file');
        }

        // 3. Prepare Data (Using camelCase keys from getAllWithStudentInfo)
        $studentName = $violation['studentName'] ?? 'N/A';
        $studentId = $violation['studentId'] ?? 'N/A';
        $dept = $violation['studentDept'] ?? 'N/A';
        $year = $violation['studentYearlevel'] ?? 'N/A';
        $courseYear = "$dept - $year";
        
        $vType = strtolower($violation['violationTypeLabel'] ?? '');
        $vLevel = strtolower($violation['violationLevelLabel'] ?? '');

        // Checkmark Logic
        $checkUniform = (strpos($vType, 'uniform') !== false) ? '✔' : ' ';
        $checkFootwear = (strpos($vType, 'foot') !== false || strpos($vType, 'shoe') !== false) ? '✔' : ' ';
        $checkID = (strpos($vType, 'id') !== false || strpos($vType, 'identification') !== false) ? '✔' : ' ';
        
        $check1st = (strpos($vLevel, '1st') !== false) ? '✔' : ' ';
        $check2nd = (strpos($vLevel, '2nd') !== false) ? '✔' : ' ';
        $check3rd = (strpos($vLevel, '3rd') !== false) ? '✔' : ' ';

        // 4. Modify XML
        $zip = new ZipArchive;
        if ($zip->open($tempFile) === TRUE) {
            $xml = $zip->getFromName('word/document.xml');

            // EXACT STRING REPLACEMENT (Based on user's file structure)
            // Uses robust regex to handle both contiguous and split-tag scenarios
            // Adds 'w:u' (underline) tag to the replaced value to simulate the underscore line
            
            // Define XML structure to break out of current tag, add underlined value, and resume
            // Pattern: Close <w:t> and <w:r>, Start <w:r> with <w:u> (underline), Add value, Close underline run, Resume <w:r><w:t>
            
            // Name
            $nameUnderline = "</w:t></w:r><w:r><w:rPr><w:u w:val=\"single\"/></w:rPr><w:t>$studentName</w:t></w:r><w:r><w:t>";
            // Case 1: Contiguous
            $xml = preg_replace('/Name: _+/', "Name: $nameUnderline", $xml);
            // Case 2: Split
            $xml = preg_replace('/(Name:\s*<\/w:t>.*?<w:t[^>]*>)_+/', "$1$nameUnderline", $xml);

            // ID Number
            $idUnderline = "</w:t></w:r><w:r><w:rPr><w:u w:val=\"single\"/></w:rPr><w:t>$studentId</w:t></w:r><w:r><w:t>";
            // Case 1: Contiguous
            $xml = preg_replace('/ID Number: _+/', "ID Number: $idUnderline", $xml);
            // Case 2: Split
            $xml = preg_replace('/(ID Number:\s*<\/w:t>.*?<w:t[^>]*>)_+/', "$1$idUnderline", $xml);

            // Course and Year
            $courseUnderline = "</w:t></w:r><w:r><w:rPr><w:u w:val=\"single\"/></w:rPr><w:t>$courseYear</w:t></w:r><w:r><w:t>";
            // Case 1: Contiguous
            $xml = preg_replace('/Course and Year:_+/', "Course and Year: $courseUnderline", $xml);
            // Case 2: Split
            $xml = preg_replace('/(Course and Year:\s*<\/w:t>.*?<w:t[^>]*>)_+/', "$1$courseUnderline", $xml);

            // Violations (Text replacement)
            $xml = str_replace('Improper Uniform', "Improper Uniform $checkUniform", $xml);
            $xml = str_replace('Improper Foot Wear', "Improper Foot Wear $checkFootwear", $xml);
            $xml = str_replace('No ID', "No ID $checkID", $xml);
            
            $xml = str_replace('1st Offense', "1st Offense $check1st", $xml);
            $xml = str_replace('2nd Offense', "2nd Offense $check2nd", $xml);
            $xml = str_replace('3rd Offense', "3rd Offense $check3rd", $xml);

            // Write back
            $zip->addFromString('word/document.xml', $xml);
            $zip->close();

            // 5. Download
            // Clean output buffer to avoid corrupting the file
            if (ob_get_level()) ob_end_clean();
            
            header('Content-Description: File Transfer');
            header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            header('Content-Disposition: attachment; filename="Entrance_Slip_' . $studentId . '.docx"');
            header('Content-Transfer-Encoding: binary');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($tempFile));
            readfile($tempFile);
            
            // Cleanup
            unlink($tempFile);
            exit;
        } else {
            $this->error('Failed to open DOCX template');
        }
    }
}
