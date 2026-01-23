<?php
require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/UserModel.php';

class AuthController extends Controller {
    private $model;

    public function __construct() {
        ob_start();
        header('Content-Type: application/json');
        
        // Only start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        try {
            $this->model = new UserModel();
        } catch (Exception $e) {
            error_log('AuthController constructor error: ' . $e->getMessage());
            $this->error('System initialization failed. Please try again.');
        }
    }

    public function login() {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->error('Invalid request method');
                return;
            }

            $username = trim($this->getPost('username', ''));
            $password = trim($this->getPost('password', ''));
            $remember = isset($_POST['rememberMe']) && $_POST['rememberMe'] === 'true';

            if (empty($username) || empty($password)) {
                $this->error('Please fill in all fields.');
                return;
            }

            // Log login attempt for debugging
            error_log("Login attempt for username: " . $username);

            $user = $this->model->authenticate($username, $password);

            if ($user) {
                $studentId = null;
                $studentIdCode = null;
                
                if ($user['role'] === 'user') {
                    // Get student_id directly from users table (it's stored there!)
                    if (!empty($user['student_id'])) {
                        $studentIdCode = $user['student_id'];
                        // Try to get the database ID from students table if it exists
                        try {
                            require_once __DIR__ . '/../models/StudentModel.php';
                            $studentModel = new StudentModel();
                            $student = $studentModel->query(
                                "SELECT id FROM students WHERE student_id = ? LIMIT 1",
                                [$studentIdCode]
                            );
                            if (!empty($student)) {
                                $studentId = $student[0]['id'];
                            }
                        } catch (Exception $e) {
                            error_log("Error fetching student database ID: " . $e->getMessage());
                        }
                    }
                }
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];
                if ($studentIdCode) {
                    $_SESSION['student_id_code'] = $studentIdCode;
                    if ($studentId) {
                        $_SESSION['student_id'] = $studentId;
                    }
                }

                $expiryTime = time() + ($remember ? 30*24*60*60 : 6*60*60);

                setcookie("user_id", $user['id'], $expiryTime, "/", "", false, false);
                setcookie("username", $user['username'], $expiryTime, "/", "", false, false);
                setcookie("role", $user['role'], $expiryTime, "/", "", false, false);
                if ($studentIdCode) {
                    setcookie("student_id_code", $studentIdCode, $expiryTime, "/", "", false, false);
                    if ($studentId) {
                        setcookie("student_id", $studentId, $expiryTime, "/", "", false, false);
                    }
                }

                $responseData = [
                    'role' => $user['role'],
                    'name' => $user['username'],
                    'studentId' => $studentId,
                    'studentIdCode' => $studentIdCode,
                    'expires' => $expiryTime
                ];
                
                error_log("Login successful for username: " . $username . ", role: " . $user['role']);
                $this->success('Login successful', $responseData);
            } else {
                error_log("Login failed for username: " . $username . " - invalid credentials");
                $this->error('Invalid username or password.');
            }
        } catch (Exception $e) {
            error_log("Login method exception: " . $e->getMessage());
            $this->error('Login failed. Please try again.');
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

