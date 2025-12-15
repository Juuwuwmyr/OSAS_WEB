<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/UserModel.php';

class AuthController extends Controller {
    private $model;

    public function __construct() {
        ob_start();
        header('Content-Type: application/json');
        @session_start();
        $this->model = new UserModel();
    }

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Invalid request method');
        }

        $username = trim($this->getPost('username', ''));
        $password = trim($this->getPost('password', ''));
        $remember = isset($_POST['rememberMe']) && $_POST['rememberMe'] === 'true';

        if (empty($username) || empty($password)) {
            $this->error('Please fill in all fields.');
        }

        $user = $this->model->authenticate($username, $password);

        if ($user) {
            $studentId = null;
            $studentIdCode = null;
            
            if ($user['role'] === 'user') {
                require_once __DIR__ . '/../models/StudentModel.php';
                $studentModel = new StudentModel();
                try {
                    $student = $studentModel->query(
                        "SELECT id, student_id FROM students WHERE user_id = ? LIMIT 1",
                        [$user['id']]
                    );
                    if (!empty($student)) {
                        $studentId = $student[0]['id'];
                        $studentIdCode = $student[0]['student_id'];
                    }
                } catch (Exception $e) {
                    error_log("Error fetching student_id: " . $e->getMessage());
                }
            }
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            if ($studentId) {
                $_SESSION['student_id'] = $studentId;
                $_SESSION['student_id_code'] = $studentIdCode;
            }

            $expiryTime = time() + ($remember ? 30*24*60*60 : 6*60*60);

            setcookie("user_id", $user['id'], $expiryTime, "/", "", false, false);
            setcookie("username", $user['username'], $expiryTime, "/", "", false, false);
            setcookie("role", $user['role'], $expiryTime, "/", "", false, false);
            if ($studentId) {
                setcookie("student_id", $studentId, $expiryTime, "/", "", false, false);
                setcookie("student_id_code", $studentIdCode, $expiryTime, "/", "", false, false);
            }

            $responseData = [
                'role' => $user['role'],
                'name' => $user['username'],
                'studentId' => $studentId,
                'studentIdCode' => $studentIdCode,
                'expires' => $expiryTime
            ];
            
            $this->success('Login successful', $responseData);
        } else {
            $this->error('Invalid username or password.');
        }
    }

    public function logout() {
        session_start();
        session_destroy();
        setcookie("user_id", "", time() - 3600, "/");
        setcookie("username", "", time() - 3600, "/");
        setcookie("role", "", time() - 3600, "/");
        
        $this->success('Logged out successfully');
    }

    public function check() {
        session_start();
        if (isset($_SESSION['user_id'])) {
            $this->success('User is authenticated', [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role']
            ]);
        } else {
            $this->error('User is not authenticated', '', 401);
        }
    }
}

