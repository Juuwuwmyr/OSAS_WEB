<?php
require_once __DIR__ . '/../app/core/Model.php';
require_once __DIR__ . '/../app/core/Controller.php';
require_once __DIR__ . '/../app/models/UserModel.php';
require_once __DIR__ . '/../app/controllers/UserController.php';

$controller = new UserController();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && ($action === 'admins' || $action === '')) {
    $controller->listAdmins();
} elseif ($method === 'POST' && $action === 'addAdmin') {
    $controller->createAdmin();
} else {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request',
        'data' => []
    ]);
    exit;
}

