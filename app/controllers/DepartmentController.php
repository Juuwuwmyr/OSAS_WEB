<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/DepartmentModel.php';

class DepartmentController extends Controller {
    private $model;

    public function __construct() {
        ob_start();
        header('Content-Type: application/json');
        @session_start();
        $this->model = new DepartmentModel();
    }

    public function index() {
        $filter = $this->getGet('filter', 'all');
        $search = $this->getGet('search', '');
        
        try {
            $departments = $this->model->getAllWithFilters($filter, $search);
            $this->success('Departments retrieved successfully', $departments);
        } catch (Exception $e) {
            $this->error('Failed to retrieve departments: ' . $e->getMessage());
        }
    }

    public function dropdown() {
        try {
            $departments = $this->model->getForDropdown();
            $this->success('Departments retrieved successfully', $departments);
        } catch (Exception $e) {
            $this->error('Failed to retrieve departments: ' . $e->getMessage());
        }
    }

    public function stats() {
        try {
            $stats = $this->model->getStats();
            $this->success('Statistics retrieved successfully', $stats);
        } catch (Exception $e) {
            $this->error('Failed to retrieve statistics: ' . $e->getMessage());
        }
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $name = $this->sanitize($this->getPost('departmentName', ''));
        $code = $this->sanitize($this->getPost('departmentCode', ''));

        if (empty($name) || empty($code)) {
            $this->error('Department name and code are required.');
        }

        if ($this->model->codeExists($code)) {
            $this->error('Department code already exists.');
        }

        try {
            $data = [
                'department_name' => $name,
                'department_code' => $code,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s')
            ];

            $id = $this->model->create($data);
            $this->success('Department added successfully!', ['id' => $id]);
        } catch (Exception $e) {
            $this->error('Failed to add department: ' . $e->getMessage());
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $id = intval($this->getPost('departmentId', $this->getGet('id', 0)));
        if ($id === 0) {
            $this->error('Invalid department ID');
        }

        $name = $this->sanitize($this->getPost('departmentName', ''));
        $code = $this->sanitize($this->getPost('departmentCode', ''));

        if (empty($name) || empty($code)) {
            $this->error('Department name and code are required.');
        }

        if ($this->model->codeExists($code, $id)) {
            $this->error('Department code already exists.');
        }

        try {
            $data = [
                'department_name' => $name,
                'department_code' => $code,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->model->update($id, $data);
            $this->success('Department updated successfully!');
        } catch (Exception $e) {
            $this->error('Failed to update department: ' . $e->getMessage());
        }
    }

    public function delete() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid department ID');
        }

        try {
            $this->model->archive($id);
            $this->success('Department archived successfully!');
        } catch (Exception $e) {
            $this->error('Failed to archive department: ' . $e->getMessage());
        }
    }

    public function restore() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid department ID');
        }

        try {
            $this->model->restore($id);
            $this->success('Department restored successfully!');
        } catch (Exception $e) {
            $this->error('Failed to restore department: ' . $e->getMessage());
        }
    }

    public function import() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $departmentsJson = $this->getPost('departments', '');
        if (empty($departmentsJson)) {
            $this->error('No departments data provided.');
        }

        $departments = json_decode($departmentsJson, true);
        if (!is_array($departments) || empty($departments)) {
            $this->error('Invalid departments data format.');
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($departments as $index => $dept) {
            $name = $this->sanitize($dept['name'] ?? '');
            $code = $this->sanitize($dept['code'] ?? '');
            $hod = $this->sanitize($dept['hod'] ?? '');
            $description = $this->sanitize($dept['description'] ?? '');
            $status = in_array(strtolower($dept['status'] ?? 'active'), ['active', 'archived']) 
                ? strtolower($dept['status']) 
                : 'active';

            // Validate required fields
            if (empty($name) || empty($code)) {
                $skipped++;
                $errors[] = "Row " . ($index + 1) . ": Missing required fields (name or code)";
                continue;
            }

            // Check if code already exists
            if ($this->model->codeExists($code)) {
                $skipped++;
                $errors[] = "Row " . ($index + 1) . ": Department code '{$code}' already exists";
                continue;
            }

            try {
                $data = [
                    'department_name' => $name,
                    'department_code' => $code,
                    'head_of_department' => $hod,
                    'description' => $description,
                    'status' => $status,
                    'created_at' => date('Y-m-d H:i:s')
                ];

                $this->model->create($data);
                $imported++;
            } catch (Exception $e) {
                $skipped++;
                $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }

        $message = "Imported {$imported} department(s)";
        if ($skipped > 0) {
            $message .= ", skipped {$skipped}";
        }

        $this->success($message, [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($departments),
            'errors' => $errors
        ]);
    }
}

