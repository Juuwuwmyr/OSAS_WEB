<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!-- USER DASHBOARD CONTENT - NOT ADMIN -->
<script>console.log('✅ USER dashcontent.php loaded (NOT admin)');</script>
<main>
  <!-- Header Section -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="page-title">My Dashboard</h1>
        <p class="page-subtitle">Overview of your violations and account information</p>
      </div>
      <div class="breadcrumb-wrapper">
        <div class="breadcrumb">
          <a href="#" class="breadcrumb-item">Dashboard</a>
          <i class='bx bx-chevron-right'></i>
          <span class="breadcrumb-item active">My Profile</span>
        </div>
      </div>
    </div>
    <div class="header-actions">
      <a href="#" class="Violations-btn primary" id="btnDashDownloadReport" style="text-decoration: none;">
        <i class='bx bxs-download'></i> Download Report
      </a>
    </div>
  </div>

  <!-- Announcements Section -->
  <div class="announcements-container">
    <div class="announcements-header">
      <h3><i class='bx bxs-megaphone'></i> Latest Announcements</h3>
      <button class="announcement-toggle" onclick="toggleAnnouncements()">
        <i class='bx bx-chevron-down'></i>
      </button>
    </div>
    <div class="announcements-content" id="announcementsContent">
      <div style="text-align: center; padding: 40px;">
        <div class="loading-spinner"></div>
        <p>Loading announcements...</p>
      </div>
    </div>
  </div>

  <!-- Personal Stats -->
  <ul class="box-info">
    <li>
      <i class='bx bxs-error-circle'></i>
      <span class="text">
        <h3 id="statActiveViolations">0</h3>
        <p>Active Violations</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-folder-open'></i>
      <span class="text">
        <h3 id="statTotalViolations">0</h3>
        <p>Total Violations</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-check-circle'></i>
      <span class="text">
        <h3 id="statResolvedViolations">0</h3>
        <p>Resolved / Permitted</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-time-five'></i>
      <span class="text">
        <h3 id="statDaysClean">0</h3>
        <p>Days Clean</p>
      </span>
    </li>
  </ul>

  <!-- My Violations Section -->
  <div class="table-data">
    <div class="my-violations">
      <div class="head">
        <h3>My Violations</h3>
        <i class='bx bx-refresh'></i>
        <i class='bx bx-filter'></i>
      </div>
      <div class="violation-summary" id="violationSummary">
        <div style="text-align: center; padding: 40px;">
          <div class="loading-spinner"></div>
          <p>Loading violation summary...</p>
        </div>
      </div>
    </div>

    <!-- Recent Violations History -->
    <div class="violation-history">
      <div class="head">
        <h3>Recent Violations</h3>
        <i class='bx bx-search'></i>
        <i class='bx bx-filter'></i>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Violation Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="recentViolationsTableBody">
          <tr>
            <td colspan="4" style="text-align: center; padding: 40px;">
              <div class="loading-spinner"></div>
              <p>Loading violations...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tips and Guidelines -->
  <div class="tips-container">
    <div class="tips-header">
      <h3><i class='bx bxs-lightbulb'></i> Tips to Avoid Violations</h3>
    </div>
    <div class="tips-content">
      <div class="tip-item">
        <div class="tip-icon">
          <i class='bx bxs-t-shirt'></i>
        </div>
        <div class="tip-details">
          <h4>Proper Uniform</h4>
          <p>Always wear the complete school uniform with proper fit and cleanliness.</p>
        </div>
      </div>
      <div class="tip-item">
        <div class="tip-icon">
          <i class='bx bxs-shopping-bag-alt'></i>
        </div>
        <div class="tip-details">
          <h4>Appropriate Footwear</h4>
          <p>Wear school-approved shoes that are clean and in good condition.</p>
        </div>
      </div>
      <div class="tip-item">
        <div class="tip-icon">
          <i class='bx bxs-id-card'></i>
        </div>
        <div class="tip-details">
          <h4>ID Card</h4>
          <p>Always carry your school ID card and display it when required.</p>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- DETAILS MODAL (Same as my_violations.php) -->
<div id="ViolationDetailsModal" class="Violations-modal" style="display: none;">
    <div class="Violations-modal-overlay" id="modalOverlay" onclick="closeViolationModal()"></div>
    <div class="Violations-modal-container">
        <div class="Violations-modal-header">
            <h2>
                <i class='bx bxs-info-circle'></i>
                <span>Violation Details</span>
            </h2>
            <button class="Violations-close-btn" onclick="closeViolationModal()">
                <i class='bx bx-x'></i>
            </button>
        </div>

        <div class="violation-details-content">
            <!-- Case Header -->
            <div class="case-header">
                <span class="case-id">Case: <span id="detailCaseId">-</span></span>
                <span class="case-status-badge" id="detailStatusBadge">-</span>
            </div>

            <!-- Student Info -->
            <div class="violation-student-info-card detailed">
                <div class="violation-student-image">
                    <img id="detailStudentImage" 
                         src="https://ui-avatars.com/api/?name=Student&background=ffd700&color=333&size=80" 
                         alt="Student"
                         onerror="this.src='https://ui-avatars.com/api/?name=Student&background=ffd700&color=333&size=80'">
                </div>
                <div class="violation-student-details">
                    <h3 id="detailStudentName">Student Name</h3>
                    <div class="student-meta">
                        <span class="student-id">ID: <span id="detailStudentId">-</span></span>
                        <span class="student-dept badge" id="detailStudentDept">-</span>
                        <span class="student-section">Section: <span id="detailStudentSection">-</span></span>
                    </div>
                    <div class="student-contact">
                        <i class='bx bx-phone'></i> <span id="detailStudentContact">-</span>
                    </div>
                </div>
            </div>

            <div class="violation-details-grid">
                <div class="detail-item">
                    <span class="detail-label">Violation Type:</span>
                    <span class="detail-value badge" id="detailViolationType">-</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Level:</span>
                    <span class="detail-value badge warning" id="detailViolationLevel">-</span>
                </div>
                 <div class="detail-item">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value" id="detailDateTime">-</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value" id="detailLocation">-</span>
                </div>
                 <div class="detail-item">
                    <span class="detail-label">Reported By:</span>
                    <span class="detail-value" id="detailReportedBy">-</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value badge warning" id="detailStatus">-</span>
                </div>
            </div>

            <div class="violation-notes-section">
                <h4>Violation Description</h4>
                <div class="notes-content">
                    <p id="detailNotes">-</p>
                </div>
            </div>
            
             <div class="violation-notes-section" id="resolutionSection" style="display:none;">
                <h4>Resolution</h4>
                <div class="notes-content">
                    <p id="detailResolution">-</p>
                </div>
            </div>

            <!-- History Timeline -->
            <div class="violation-history">
                <h4>Violation History</h4>
                <div class="timeline" id="detailTimeline">
                    <!-- Populated dynamically -->
                    <p style="color: #6c757d; font-size: 14px;">No history available.</p>
                </div>
            </div>

            <div class="Violations-form-actions">
                <button class="Violations-btn primary" onclick="printViolationSlip()">
                    <i class='bx bxs-printer'></i> Print Slip
                </button>
                <button class="Violations-btn-outline" onclick="closeViolationModal()">Close</button>
            </div>
        </div>
    </div>
</div>



