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
            $caseId = $this->model->generateCaseId();

            $data = [
                'case_id'        => $caseId,
                'student_id'     => $studentId,
                'violation_type' => $violationType,
                'violation_level'=> $violationLevel,
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
            $this->error('Failed to save violation');
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
            'violation_type'  => $this->sanitize($input['violationType'] ?? $current['violation_type']),
            'violation_level' => $this->sanitize($input['violationLevel'] ?? $current['violation_level']),
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
}
