<?php
/**
 * Debug version of announcements API
 * Shows detailed error information
 */

// Enable error display for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');

$response = [
    'status' => 'error',
    'message' => 'Unknown error',
    'data' => [],
    'debug' => []
];

try {
    $response['debug']['step'] = 'Starting initialization';
    
    // Check if files exist
    $modelPath = __DIR__ . '/../app/core/Model.php';
    $controllerPath = __DIR__ . '/../app/core/Controller.php';
    $announcementModelPath = __DIR__ . '/../app/models/AnnouncementModel.php';
    $announcementControllerPath = __DIR__ . '/../app/controllers/AnnouncementController.php';
    
    $response['debug']['files'] = [
        'Model.php' => file_exists($modelPath) ? 'EXISTS' : 'NOT FOUND: ' . $modelPath,
        'Controller.php' => file_exists($controllerPath) ? 'EXISTS' : 'NOT FOUND: ' . $controllerPath,
        'AnnouncementModel.php' => file_exists($announcementModelPath) ? 'EXISTS' : 'NOT FOUND: ' . $announcementModelPath,
        'AnnouncementController.php' => file_exists($announcementControllerPath) ? 'EXISTS' : 'NOT FOUND: ' . $announcementControllerPath,
    ];
    
    $response['debug']['step'] = 'Requiring files';
    require_once $modelPath;
    $response['debug']['model_required'] = 'OK';
    
    require_once $controllerPath;
    $response['debug']['controller_required'] = 'OK';
    
    require_once $announcementModelPath;
    $response['debug']['announcement_model_required'] = 'OK';
    
    require_once $announcementControllerPath;
    $response['debug']['announcement_controller_required'] = 'OK';
    
    $response['debug']['step'] = 'Creating controller';
    $controller = new AnnouncementController();
    $response['debug']['controller_created'] = 'OK';
    
    $response['debug']['step'] = 'Getting action and method';
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];
    $response['debug']['action'] = $action;
    $response['debug']['method'] = $method;
    
    $response['debug']['step'] = 'Calling index method';
    ob_start();
    $controller->index();
    $output = ob_get_clean();
    
    $response['debug']['output'] = $output;
    $response['debug']['step'] = 'Method called';
    
    // If we got here, something went wrong because index() should exit
    $response['message'] = 'Controller method did not exit properly';
    
} catch (Throwable $e) {
    $response['status'] = 'error';
    $response['message'] = $e->getMessage();
    $response['file'] = $e->getFile();
    $response['line'] = $e->getLine();
    $response['trace'] = explode("\n", $e->getTraceAsString());
    $response['debug']['exception'] = get_class($e);
}

echo json_encode($response, JSON_PRETTY_PRINT);

