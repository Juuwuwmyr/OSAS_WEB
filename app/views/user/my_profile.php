<?php
require_once __DIR__ . '/../../core/View.php';
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
            <img src="<?= View::asset('img/user.jpg') ?>" alt="Profile Picture" id="profilePicture">
            <button class="change-photo-btn" onclick="changeProfilePicture()">
              <i class='bx bxs-camera'></i>
            </button>
          </div>
          <div class="profile-info">
            <h2 id="userName">Loading...</h2>
            <p id="userRole">Student</p>
            <p id="studentId">Student ID: Loading...</p>
            <div class="profile-status">
              <span class="status-badge good" id="profileStatusBadge">Loading...</span>
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
            <span id="fullName">Loading...</span>
          </div>
          <div class="info-item">
            <label>Student ID:</label>
            <span id="studentIdValue">Loading...</span>
          </div>
          <div class="info-item">
            <label>Email:</label>
            <span id="email">Loading...</span>
          </div>
          <div class="info-item">
            <label>Phone:</label>
            <span id="phone">Loading...</span>
          </div>
          <div class="info-item">
            <label>Date of Birth:</label>
            <span id="dateOfBirth">Loading...</span>
          </div>
          <div class="info-item">
            <label>Gender:</label>
            <span id="gender">Loading...</span>
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
            <span id="department">Loading...</span>
          </div>
          <div class="info-item">
            <label>Year Level:</label>
            <span id="yearLevel">Loading...</span>
          </div>
          <div class="info-item">
            <label>Section:</label>
            <span id="section">Loading...</span>
          </div>
          <div class="info-item">
            <label>Advisor:</label>
            <span id="advisor">N/A</span>
          </div>
          <div class="info-item">
            <label>Enrollment Date:</label>
            <span id="enrollmentDate">Loading...</span>
          </div>
          <div class="info-item">
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
          <div style="text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p>Loading violation summary...</p>
          </div>
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
            <label>Address:</label>
            <span id="address">Loading...</span>
          </div>
          <div class="info-item">
            <label>Emergency Contact:</label>
            <span id="emergencyContact">N/A</span>
          </div>
          <div class="info-item">
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


