<?php
/**
 * API Wrapper - Maintains backward compatibility
 * Routes to MVC Controller
 */

// Error reporting
error_reporting(E_ALL);
$isProduction = false;
ini_set('display_errors', $isProduction ? 0 : 1);
ini_set('log_errors', 1);

// Start output buffering to catch any errors/warnings
while (ob_get_level() > 0) {
    ob_end_clean();
}
ob_start();

require_once __DIR__ . '/../app/core/Model.php';
require_once __DIR__ . '/../app/core/Controller.php';
require_once __DIR__ . '/../app/models/ViolationModel.php';
require_once __DIR__ . '/../app/models/StudentModel.php';
require_once __DIR__ . '/../app/controllers/ViolationController.php';

try {
    $controller = new ViolationController();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    switch ($method) {
        case 'GET':
            if ($id > 0) {
                // Get single violation - would need to implement this
                $controller->index();
            } else {
                $controller->index();
            }
            break;
        case 'POST':
            $controller->create();
            break;
        case 'PUT':
            $controller->update();
            break;
        case 'DELETE':
            $controller->delete();
            break;
        default:
            // Output error JSON directly since error() is protected
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid request method',
                'data' => []
            ]);
            exit;
            break;
    }
} catch (Throwable $e) {
    // Catch any unhandled exceptions
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    error_log("Violations API Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage(),
        'data' => [],
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}
