<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/AnnouncementModel.php';

class AnnouncementController extends Controller {
    private $model;

    public function __construct() {
        // Don't start output buffering here - let the API file handle it
        error_reporting(E_ALL);
        ini_set('display_errors', 0);
        ini_set('log_errors', 1);
        
        // Don't set headers here - API file handles it
        // Only set header if not already sent and API file didn't set it
        // if (!headers_sent() && !isset($GLOBALS['announcements_api_headers_set'])) {
        //     header('Content-Type: application/json');
        // }
        
        @session_start();
        
        try {
            $this->model = new AnnouncementModel();
        } catch (Throwable $e) {
            error_log("AnnouncementController constructor error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            // Don't throw here, let methods handle it
            $this->model = null;
        }
    }

    public function index() {
        try {
            $filter = $this->getGet('filter', 'all');
            $search = $this->getGet('search', '');
            
            if (!$this->model) {
                $this->error('Model not initialized. Check database connection.', '', 500);
                return;
            }
            
            $announcements = $this->model->getFiltered($filter, $search);
            $this->success('Announcements retrieved successfully', $announcements);
        } catch (Throwable $e) {
            error_log("AnnouncementController::index error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->error('Failed to retrieve announcements: ' . $e->getMessage(), '', 500);
        }
    }

    public function getActive() {
        try {
            $limit = $this->getGet('limit', null);
            
            if (!$this->model) {
                $this->error('Model not initialized. Check database connection.', '', 500);
                return;
            }
            
            $announcements = $this->model->getActive($limit);
            $this->success('Active announcements retrieved successfully', $announcements);
        } catch (Throwable $e) {
            error_log("AnnouncementController::getActive error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->error('Failed to retrieve active announcements: ' . $e->getMessage(), '', 500);
        }
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $title = $this->sanitize($this->getPost('title', ''));
        $message = $this->sanitize($this->getPost('message', ''));
        $type = $this->sanitize($this->getPost('type', 'info'));
        $createdBy = $_SESSION['user_id'] ?? null;

        if (empty($title) || empty($message)) {
            $this->error('Title and message are required.');
        }

        if (!in_array($type, ['info', 'urgent', 'warning'])) {
            $type = 'info';
        }

        try {
            $data = [
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'status' => 'active',
                'created_by' => $createdBy,
                'created_at' => date('Y-m-d H:i:s')
            ];

            $id = $this->model->create($data);
            $this->success('Announcement created successfully!', ['id' => $id]);
        } catch (Exception $e) {
            $this->error('Failed to create announcement: ' . $e->getMessage());
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $id = intval($this->getPost('id', $this->getGet('id', 0)));
        if ($id === 0) {
            $this->error('Invalid announcement ID');
        }

        $title = $this->sanitize($this->getPost('title', ''));
        $message = $this->sanitize($this->getPost('message', ''));
        $type = $this->sanitize($this->getPost('type', 'info'));

        if (empty($title) || empty($message)) {
            $this->error('Title and message are required.');
        }

        if (!in_array($type, ['info', 'urgent', 'warning'])) {
            $type = 'info';
        }

        try {
            $data = [
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->model->update($id, $data);
            $this->success('Announcement updated successfully!');
        } catch (Exception $e) {
            $this->error('Failed to update announcement: ' . $e->getMessage());
        }
    }

    public function delete() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid announcement ID');
        }

        try {
            $this->model->softDelete($id);
            $this->success('Announcement deleted successfully!');
        } catch (Exception $e) {
            $this->error('Failed to delete announcement: ' . $e->getMessage());
        }
    }

    public function archive() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid announcement ID');
        }

        try {
            $this->model->archive($id);
            $this->success('Announcement archived successfully!');
        } catch (Exception $e) {
            $this->error('Failed to archive announcement: ' . $e->getMessage());
        }
    }

    public function restore() {
        $id = intval($this->getGet('id', $this->getPost('id', 0)));
        
        if ($id === 0) {
            $this->error('Invalid announcement ID');
        }

        try {
            $this->model->restore($id);
            $this->success('Announcement restored successfully!');
        } catch (Exception $e) {
            $this->error('Failed to restore announcement: ' . $e->getMessage());
        }
    }
}

