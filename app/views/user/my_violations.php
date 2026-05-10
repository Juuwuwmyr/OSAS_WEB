<?php
require_once __DIR__ . '/../../core/View.php';
?>
<link rel="stylesheet" href="<?= View::asset('styles/violation.css') ?>">

<main id="Violations-page" class="uv-page">

  <!-- ── PAGE HEADER ── -->
  <div class="uv-header">
    <div class="uv-header__left">
      <div class="uv-header__icon"><i class='bx bxs-shield-x'></i></div>
      <div>
        <h1 class="uv-header__title">My Violations</h1>
        <nav class="uv-breadcrumb">
          <a href="#">Dashboard</a>
          <i class='bx bx-chevron-right'></i>
          <span>My Violations</span>
        </nav>
      </div>
    </div>
    <a href="#" class="uv-dl-btn" id="btnDownloadReport">
      <i class='bx bxs-download'></i> Download Report
    </a>
  </div>

  <!-- ── STAT CARDS ── -->
  <div class="uv-stats">
    <div class="uv-stat uv-stat--purple">
      <div class="uv-stat__icon"><i class='bx bxs-t-shirt'></i></div>
      <div class="uv-stat__body">
        <span class="uv-stat__val" id="statUniform">0</span>
        <span class="uv-stat__lbl">Improper Uniform</span>
      </div>
      <div class="uv-stat__blob"></div>
    </div>
    <div class="uv-stat uv-stat--teal">
      <div class="uv-stat__icon"><i class='bx bxs-shopping-bag-alt'></i></div>
      <div class="uv-stat__body">
        <span class="uv-stat__val" id="statFootwear">0</span>
        <span class="uv-stat__lbl">Improper Footwear</span>
      </div>
      <div class="uv-stat__blob"></div>
    </div>
    <div class="uv-stat uv-stat--blue">
      <div class="uv-stat__icon"><i class='bx bxs-id-card'></i></div>
      <div class="uv-stat__body">
        <span class="uv-stat__val" id="statId">0</span>
        <span class="uv-stat__lbl">No ID Card</span>
      </div>
      <div class="uv-stat__blob"></div>
    </div>
    <div class="uv-stat uv-stat--gold">
      <div class="uv-stat__icon"><i class='bx bxs-calendar-check'></i></div>
      <div class="uv-stat__body">
        <span class="uv-stat__val" id="statTotal">0</span>
        <span class="uv-stat__lbl">Total Violations</span>
      </div>
      <div class="uv-stat__blob"></div>
    </div>
  </div>

  <!-- ── VIOLATION HISTORY CARD ── -->
  <div class="uv-card">

    <!-- Card Header -->
    <div class="uv-card__head">
      <div class="uv-card__title-wrap">
        <span class="uv-card__icon-badge"><i class='bx bx-list-ul'></i></span>
        <div>
          <h2 class="uv-card__title">Violation History</h2>
          <p class="uv-card__sub">Showing <span id="showingViolationsCount">0</span> records</p>
        </div>
      </div>
      <div class="uv-card__controls">
        <div class="uv-search">
          <i class='bx bx-search'></i>
          <input type="text" id="searchViolation" placeholder="Search…">
        </div>
        <select id="violationFilter" class="uv-select" onchange="filterViolations()">
          <option value="all">All Types</option>
          <option value="improper_uniform">Improper Uniform</option>
          <option value="improper_footwear">Improper Footwear</option>
          <option value="no_id">No ID Card</option>
        </select>
        <select id="statusFilter" class="uv-select" onchange="filterViolations()">
          <option value="all">All Status</option>
          <option value="resolved">Resolved / Permitted</option>
          <option value="pending">Pending</option>
          <option value="warning">Warning</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="uv-table-wrap">
      <table class="uv-table">
        <thead>
          <tr>
            <th>Violation Type</th>
            <th>Offense Level</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="violationsTableBody">
          <tr>
            <td colspan="5">
              <div class="uv-loading">
                <div class="uv-spinner"></div>
                <span>Loading violations…</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div><!-- /uv-card -->

  <!-- ── DETAILS MODAL ── -->
  <div id="ViolationDetailsModal" class="Violations-modal" style="display:none;">
    <div class="Violations-modal-overlay" id="modalOverlay" onclick="closeViolationModal()"></div>
    <div class="Violations-modal-container">
      <div class="Violations-modal-header">
        <h2><i class='bx bxs-info-circle'></i><span>Violation Details</span></h2>
        <button class="Violations-close-btn" onclick="closeViolationModal()"><i class='bx bx-x'></i></button>
      </div>
      <div class="violation-details-content">
        <div class="case-header">
          <span class="case-id">Case: <span id="detailCaseId">-</span></span>
          <span class="case-status-badge" id="detailStatusBadge">-</span>
        </div>
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
            <div class="student-contact"><i class='bx bx-phone'></i> <span id="detailStudentContact">-</span></div>
          </div>
        </div>
        <div class="violation-details-grid">
          <div class="detail-item"><span class="detail-label">Violation Type:</span><span class="detail-value badge" id="detailViolationType">-</span></div>
          <div class="detail-item"><span class="detail-label">Level:</span><span class="detail-value badge warning" id="detailViolationLevel">-</span></div>
          <div class="detail-item"><span class="detail-label">Date &amp; Time:</span><span class="detail-value" id="detailDateTime">-</span></div>
          <div class="detail-item"><span class="detail-label">Location:</span><span class="detail-value" id="detailLocation">-</span></div>
          <div class="detail-item"><span class="detail-label">Reported By:</span><span class="detail-value" id="detailReportedBy">-</span></div>
          <div class="detail-item"><span class="detail-label">Status:</span><span class="detail-value badge warning" id="detailStatus">-</span></div>
        </div>
        <div class="violation-notes-section">
          <h4>Violation Description</h4>
          <div class="notes-content"><p id="detailNotes">-</p></div>
        </div>
        <div class="violation-evidence-section" id="evidenceSection">
          <h4>Evidence / Attachments</h4>
          <div id="detailAttachments" class="attachments-grid">
            <p class="no-attachments">No attachments available.</p>
          </div>
        </div>
        <div class="violation-notes-section" id="resolutionSection" style="display:none;">
          <h4>Resolution</h4>
          <div class="notes-content"><p id="detailResolution">-</p></div>
        </div>
        <div class="violation-history">
          <h4>Violation History</h4>
          <div class="timeline" id="detailTimeline">
            <p style="color:var(--dark-grey);font-size:.82rem;">No history available.</p>
          </div>
        </div>
        <div class="Violations-form-actions">
          <button id="requestSlipBtn" class="Violations-btn warning" onclick="handleStudentSlipRequest()" style="display:none;">
            <i class='bx bx-paper-plane'></i> Request Receipt
          </button>
          <button id="downloadSlipBtn" class="Violations-btn success" onclick="printViolationSlip()" style="display:none;">
            <i class='bx bxs-download'></i> Download Slip
          </button>
          <button class="Violations-btn-outline" onclick="closeViolationModal()">Close</button>
        </div>
      </div>
    </div>
  </div>

</main>
