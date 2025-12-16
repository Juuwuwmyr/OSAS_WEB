<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/SectionModel.php';

class SectionController extends Controller {
    private $model;

    public function __construct() {
        ob_start();
        header('Content-Type: application/json');
        @session_start();
        $this->model = new SectionModel();
    }

    public function index() {
        $filter = $this->getGet('filter', 'all');
        $search = $this->getGet('search', '');
        
        try {
            $sections = $this->model->getAllWithFilters($filter, $search);
            $this->success('Sections retrieved successfully', $sections);
        } catch (Exception $e) {
            $this->error('Failed to retrieve sections: ' . $e->getMessage());
        }
    }

    public function getByDepartment() {
        $deptCode = $this->getGet('department_code', '');
        
        if (empty($deptCode)) {
            $this->error('Department code is required');
        }

        try {
            $sections = $this->model->getByDepartment($deptCode);
            $this->success('Sections retrieved successfully', $sections);
        } catch (Exception $e) {
            $this->error('Failed to retrieve sections: ' . $e->getMessage());
        }
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $name = $this->sanitize($this->getPost('sectionName', ''));
        $code = $this->sanitize($this->getPost('sectionCode', ''));
        $deptId = intval($this->getPost('departmentId', 0));

        if (empty($name) || empty($code) || $deptId === 0) {
            $this->error('Section name, code, and department are required.');
        }

        if ($this->model->codeExists($code)) {
            $this->error('Section code already exists.');
        }

        try {
            $data = [
                'section_name' => $name,
                'section_code' => $code,
                'department_id' => $deptId,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s')
            ];

            $id = $this->model->create($data);
            $this->success('Section added successfully!', ['id' => $id]);
        } catch (Exception $e) {
            $this->error('Failed to add section: ' . $e->getMessage());
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $id = intval($this->getPost('sectionId', $this->getGet('id', 0)));
        if ($id === 0) {
            $this->error('Invalid section ID');
        }

        $name = $this->sanitize($this->getPost('sectionName', ''));
        $code = $this->sanitize($this->getPost('sectionCode', ''));
        $deptId = intval($this->getPost('departmentId', 0));

        if (empty($name) || empty($code) || $deptId === 0) {
            $this->error('Section name, code, and department are required.');
        }

        if ($this->model->codeExists($code, $id)) {
            $this->error('Section code already exists.');
        }

        try {
            $data = [
                'section_name' => $name,
                'section_code' => $code,
                'department_id' => $deptId,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->model->update($id, $data);
            $this->success('Section updated successfully!');
        } catch (Exception $e) {
            $this->error('Failed to update section: ' . $e->getMessage());
        }
    }

    public function delete() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid section ID');
        }

        try {
            $this->model->archive($id);
            $this->success('Section archived successfully!');
        } catch (Exception $e) {
            $this->error('Failed to archive section: ' . $e->getMessage());
        }
    }

    public function restore() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid section ID');
        }

        try {
            $this->model->restore($id);
            $this->success('Section restored successfully!');
        } catch (Exception $e) {
            $this->error('Failed to restore section: ' . $e->getMessage());
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

    public function import() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $sectionsJson = $this->getPost('sections', '');
        if (empty($sectionsJson)) {
            $this->error('No sections data provided.');
        }

        $sections = json_decode($sectionsJson, true);
        if (!is_array($sections) || empty($sections)) {
            $this->error('Invalid sections data format.');
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($sections as $index => $sect) {
            $name = $this->sanitize($sect['name'] ?? '');
            $code = $this->sanitize($sect['code'] ?? '');
            $deptCode = $this->sanitize($sect['department'] ?? '');
            $description = $this->sanitize($sect['description'] ?? '');
            $status = in_array(strtolower($sect['status'] ?? 'active'), ['active', 'archived']) 
                ? strtolower($sect['status']) 
                : 'active';

            if (empty($name)) {
                $skipped++;
                $errors[] = "Row " . ($index + 1) . ": Missing required field (name)";
                continue;
            }

            // Get department ID from code
            $deptId = 0;
            if (!empty($deptCode)) {
                $deptQuery = "SELECT id FROM departments WHERE department_code = ? LIMIT 1";
                $deptStmt = $this->model->getConnection()->prepare($deptQuery);
                $deptStmt->bind_param("s", $deptCode);
                $deptStmt->execute();
                $deptResult = $deptStmt->get_result();
                if ($deptRow = $deptResult->fetch_assoc()) {
                    $deptId = $deptRow['id'];
                }
                $deptStmt->close();
            }

            if ($deptId === 0) {
                $skipped++;
                $errors[] = "Row " . ($index + 1) . ": Invalid or missing department code '{$deptCode}'";
                continue;
            }

            if ($this->model->codeExists($code)) {
                $skipped++;
                $errors[] = "Row " . ($index + 1) . ": Section code '{$code}' already exists";
                continue;
            }

            try {
                $data = [
                    'section_name' => $name,
                    'section_code' => $code ?: $name,
                    'department_id' => $deptId,
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

        $message = "Imported {$imported} section(s)";
        if ($skipped > 0) {
            $message .= ", skipped {$skipped}";
        }

        $this->success($message, [
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($sections),
            'errors' => $errors
        ]);
    }
}

