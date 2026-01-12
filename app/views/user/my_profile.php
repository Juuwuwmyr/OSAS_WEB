<?php
require_once __DIR__ . '/../../core/View.php';
require_once __DIR__ . '/../../core/Model.php';
require_once __DIR__ . '/../../models/UserModel.php';
require_once __DIR__ . '/../../models/StudentModel.php';
require_once __DIR__ . '/../../models/ViolationModel.php';

// Start session if not started
@session_start();

// Get user_id from session or cookie
$userId = $_SESSION['user_id'] ?? $_COOKIE['user_id'] ?? null;

// Initialize student data variables
$studentData = null;
$fullName = 'N/A';
$studentId = 'N/A';
$email = 'N/A';
$phone = 'N/A';
$address = 'N/A';
$department = 'N/A';
$section = 'N/A';
$yearLevel = 'N/A';
$enrollmentDate = 'N/A';
$avatar = View::asset('img/default.png');

// Initialize violations data
$violations = [];

// Get student data from database
if ($userId) {
    try {
        $userModel = new UserModel();
        $user = $userModel->getById($userId);
        
        if ($user && !empty($user['student_id'])) {
            $studentIdCode = $user['student_id'];
            
            // Get student data from students table
            $studentModel = new StudentModel();
            $studentData = $studentModel->getByStudentId($studentIdCode);
            
            if ($studentData) {
                // Format full name
                $firstName = trim($studentData['first_name'] ?? $studentData['firstName'] ?? '');
                $middleName = trim($studentData['middle_name'] ?? $studentData['middleName'] ?? '');
                $lastName = trim($studentData['last_name'] ?? $studentData['lastName'] ?? '');
                $fullName = trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName) ?: 'N/A';
                
                // Get other fields
                $studentId = $studentData['student_id'] ?? $studentData['studentId'] ?? 'N/A';
                $email = $studentData['email'] ?? 'N/A';
                $phone = $studentData['contact_number'] ?? $studentData['contact'] ?? $studentData['phone'] ?? 'N/A';
                $address = $studentData['address'] ?? 'N/A';
                $department = $studentData['department'] ?? $studentData['department_name'] ?? 'N/A';
                $section = $studentData['section'] ?? $studentData['section_code'] ?? $studentData['section_name'] ?? 'N/A';
                $yearLevel = $studentData['year_level'] ?? $studentData['yearLevel'] ?? $studentData['year'] ?? 'N/A';
                $enrollmentDate = $studentData['created_at'] ?? $studentData['createdAt'] ?? $studentData['enrollment_date'] ?? $studentData['enrollmentDate'] ?? null;
                
                // Format dates
                if ($enrollmentDate && $enrollmentDate !== 'N/A') {
                    $enrollmentDate = date('F d, Y', strtotime($enrollmentDate));
                } else {
                    $enrollmentDate = 'N/A';
                }
                
                // Handle avatar
                if (!empty($studentData['avatar']) && trim($studentData['avatar']) !== '') {
                    $avatarPath = $studentData['avatar'];
                    if (strpos($avatarPath, 'app/assets/img/students/') !== false || strpos($avatarPath, 'assets/img/students/') !== false) {
                        if (strpos($avatarPath, 'app/assets/') === false) {
                            $avatarPath = str_replace('assets/', 'app/assets/', $avatarPath);
                        }
                        $avatar = '../' . $avatarPath;
                    } else {
                        $avatar = '../app/assets/img/students/' . basename($avatarPath);
                    }
                }
                
                // Load violations for this student
                if ($studentId && $studentId !== 'N/A') {
                    try {
                        $violationModel = new ViolationModel();
                        $violations = $violationModel->getAllWithStudentInfo('all', '', $studentId);
                    } catch (Exception $e) {
                        error_log("Error loading violations in my_profile.php: " . $e->getMessage());
                        $violations = [];
                    }
                }
            }
        }
    } catch (Exception $e) {
        error_log("Error loading student data in my_profile.php: " . $e->getMessage());
    }
}
?>
<!-- My Profile Page -->
<main>
    <div class="head-title">
      <div class="left">
        <h1>My Profile</h1>
        <ul class="breadcrumb">
          <li>
            <a href="#">Dashboard</a>
          </li>
          <li><i class='bx bx-chevron-right'></i></li>
          <li>
            <a class="active" href="#">My Profile</a>
          </li>
        </ul>
      </div>
      <button class="btn-download" onclick="editProfile()">
        <i class='bx bxs-edit'></i>
        <span class="text">Edit Profile</span>
      </button>
    </div>
  
    <!-- Profile Information -->
    <div class="profile-container">
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <img src="<?= htmlspecialchars($avatar) ?>" alt="Profile Picture" id="profilePicture">
            <button class="change-photo-btn" onclick="changeProfilePicture()">
              <i class='bx bxs-camera'></i>
            </button>
          </div>
          <div class="profile-info">
            <h2 id="userName"><?= htmlspecialchars($fullName) ?></h2>
            <p id="userRole">Student</p>
            <p id="studentId">Student ID: <?= htmlspecialchars($studentId) ?></p>
            <div class="profile-status">
              <span class="status-badge good" id="profileStatusBadge">Good Standing</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Personal Information -->
      <div class="info-section">
        <div class="section-header">
          <h3><i class='bx bxs-user'></i> Personal Information</h3>
          <button class="edit-btn" onclick="editPersonalInfo()">
            <i class='bx bxs-edit'></i> Edit
          </button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Full Name:</label>
            <span id="fullName"><?= htmlspecialchars($fullName) ?></span>
          </div>
          <div class="info-item">
            <label>Student ID:</label>
            <span id="studentIdValue"><?= htmlspecialchars($studentId) ?></span>
          </div>
          <div class="info-item">
            <label>Email:</label>
            <span id="email"><?= htmlspecialchars($email) ?></span>
          </div>
          <div class="info-item">
            <label>Phone:</label>
            <span id="phone"><?= htmlspecialchars($phone) ?></span>
          </div>
        </div>
      </div>
  
      <!-- Academic Information -->
      <div class="info-section">
        <div class="section-header">
          <h3><i class='bx bxs-graduation'></i> Academic Information</h3>
          <button class="edit-btn" onclick="editAcademicInfo()">
            <i class='bx bxs-edit'></i> Edit
          </button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Department:</label>
            <span id="department"><?= htmlspecialchars($department) ?></span>
          </div>
          <div class="info-item">
            <label>Year Level:</label>
            <span id="yearLevel"><?= htmlspecialchars($yearLevel) ?></span>
          </div>
          <div class="info-item">
            <label>Section:</label>
            <span id="section"><?= htmlspecialchars($section) ?></span>
          </div>
          <div class="info-item" id="advisorItem" style="display: none;">
            <label>Advisor:</label>
            <span id="advisor">N/A</span>
          </div>
          <div class="info-item">
            <label>Enrollment Date:</label>
            <span id="enrollmentDate"><?= htmlspecialchars($enrollmentDate) ?></span>
          </div>
          <div class="info-item" id="graduationDateItem" style="display: none;">
            <label>Expected Graduation:</label>
            <span id="graduationDate">N/A</span>
          </div>
        </div>
      </div>
  
      <!-- Violation Summary -->
      <div class="info-section">
        <div class="section-header">
          <h3><i class='bx bxs-shield-x'></i> Violation Summary</h3>
        </div>
        <div class="violation-summary-cards" id="profileViolationSummary">
          <?php
          // Count violations by type
          $typeCounts = [
              'improper_uniform' => 0,
              'improper_footwear' => 0,
              'no_id' => 0
          ];
          $lastViolations = [
              'improper_uniform' => null,
              'improper_footwear' => null,
              'no_id' => null
          ];
          
          foreach ($violations as $violation) {
              $type = strtolower(str_replace(' ', '_', $violation['violationType'] ?? $violation['violation_type'] ?? ''));
              if (isset($typeCounts[$type])) {
                  $typeCounts[$type]++;
                  $violationDate = $violation['dateReported'] ?? $violation['violation_date'] ?? $violation['created_at'] ?? '';
                  if ($violationDate && $violationDate !== '') {
                      $currentLast = $lastViolations[$type] ?? '';
                      if ($currentLast === '' || strtotime($violationDate) > strtotime($currentLast)) {
                          $lastViolations[$type] = $violationDate;
                      }
                  }
              }
          }
          
          // Helper function to format time ago
          function formatTimeAgo($dateString) {
              if (!$dateString) return 'Never';
              $date = new DateTime($dateString);
              $now = new DateTime();
              $diff = $now->diff($date);
              
              if ($diff->days === 0) return 'Today';
              if ($diff->days === 1) return 'Yesterday';
              if ($diff->days < 7) return $diff->days . ' days ago';
              if ($diff->days < 30) return floor($diff->days / 7) . ' week' . (floor($diff->days / 7) > 1 ? 's' : '') . ' ago';
              if ($diff->days < 365) return floor($diff->days / 30) . ' month' . (floor($diff->days / 30) > 1 ? 's' : '') . ' ago';
              return $date->format('M d, Y');
          }
          
          if (empty($violations)): ?>
            <div style="text-align: center; padding: 40px;">
              <i class='bx bx-check-circle' style="font-size: 48px; color: #10b981; margin-bottom: 10px;"></i>
              <p>No violations recorded</p>
            </div>
          <?php else: ?>
            <div class="summary-card">
              <div class="card-icon improper-uniform">
                <i class='bx bxs-t-shirt'></i>
              </div>
              <div class="card-content">
                <h4>Improper Uniform</h4>
                <p class="count"><?= $typeCounts['improper_uniform'] ?> violation<?= $typeCounts['improper_uniform'] !== 1 ? 's' : '' ?></p>
                <p class="last-violation">Last: <?= formatTimeAgo($lastViolations['improper_uniform']) ?></p>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon improper-footwear">
                <i class='bx bxs-shoe'></i>
              </div>
              <div class="card-content">
                <h4>Improper Footwear</h4>
                <p class="count"><?= $typeCounts['improper_footwear'] ?> violation<?= $typeCounts['improper_footwear'] !== 1 ? 's' : '' ?></p>
                <p class="last-violation">Last: <?= formatTimeAgo($lastViolations['improper_footwear']) ?></p>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon no-id">
                <i class='bx bxs-id-card'></i>
              </div>
              <div class="card-content">
                <h4>No ID Card</h4>
                <p class="count"><?= $typeCounts['no_id'] ?> violation<?= $typeCounts['no_id'] !== 1 ? 's' : '' ?></p>
                <p class="last-violation">Last: <?= formatTimeAgo($lastViolations['no_id']) ?></p>
              </div>
            </div>
          <?php endif; ?>
        </div>
      </div>
  
      <!-- Contact Information -->
      <div class="info-section">
        <div class="section-header">
          <h3><i class='bx bxs-phone'></i> Contact Information</h3>
          <button class="edit-btn" onclick="editContactInfo()">
            <i class='bx bxs-edit'></i> Edit
          </button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Phone:</label>
            <span id="contactPhone"><?= htmlspecialchars($phone) ?></span>
          </div>
          <div class="info-item">
            <label>Address:</label>
            <span id="address"><?= htmlspecialchars($address) ?></span>
          </div>
          <div class="info-item" id="emergencyContactItem" style="display: none;">
            <label>Emergency Contact:</label>
            <span id="emergencyContact">N/A</span>
          </div>
          <div class="info-item" id="guardianItem" style="display: none;">
            <label>Guardian:</label>
            <span id="guardian">N/A</span>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Edit Profile Modal -->
    <div id="editModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modalTitle">Edit Information</h3>
          <button class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="editForm">
            <div class="form-group">
              <label for="editFullName">Full Name:</label>
              <input type="text" id="editFullName" name="fullName">
            </div>
            <div class="form-group">
              <label for="editEmail">Email:</label>
              <input type="email" id="editEmail" name="email">
            </div>
            <div class="form-group">
              <label for="editPhone">Phone:</label>
              <input type="tel" id="editPhone" name="phone">
            </div>
            <div class="form-group">
              <label for="editAddress">Address:</label>
              <textarea id="editAddress" name="address" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeEditModal()">Cancel</button>
          <button class="btn-save" onclick="saveProfile()">Save Changes</button>
        </div>
      </div>
    </div>
  </main>
  
  <script src="<?= View::asset('js/userProfile.js') ?>"></script>


