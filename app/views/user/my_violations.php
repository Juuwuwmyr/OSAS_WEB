<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!-- My Violations Page -->
<main>
  <div class="head-title">
    <div class="left">
      <h1>My Violations</h1>
      <ul class="breadcrumb">
        <li>
          <a href="#">Dashboard</a>
        </li>
        <li><i class='bx bx-chevron-right'></i></li>
        <li>
          <a class="active" href="#">My Violations</a>
        </li>
      </ul>
    </div>
    <a href="#" class="btn-download">
      <i class='bx bxs-download'></i>
      <span class="text">Download Report</span>
    </a>
  </div>

  <!-- Violation Summary Cards -->
  <ul class="box-info" id="violationStatsBoxes">
    <li>
      <i class='bx bxs-t-shirt'></i>
      <span class="text">
        <h3>0</h3>
        <p>Improper Uniform</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-shoe'></i>
      <span class="text">
        <h3>0</h3>
        <p>Improper Footwear</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-id-card'></i>
      <span class="text">
        <h3>0</h3>
        <p>No ID Card</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-calendar-check'></i>
      <span class="text">
        <h3>0</h3>
        <p>Total Violations</p>
      </span>
    </li>
  </ul>

  <!-- Violation History Table -->
  <div class="table-data">
    <div class="violation-history">
      <div class="head">
        <h3>Violation History</h3>
        <div class="filter-options">
          <select id="violationFilter">
            <option value="all">All Violations</option>
            <option value="improper_uniform">Improper Uniform</option>
            <option value="improper_footwear">Improper Footwear</option>
            <option value="no_id">No ID Card</option>
          </select>
          <select id="statusFilter">
            <option value="all">All Status</option>
            <option value="resolved">Resolved</option>
            <option value="pending">Pending</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Violation Type</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="violationsTableBody">
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="loading-spinner"></div>
              <p>Loading violations...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Violation Details Modal (Hidden by default) -->
  <div id="violationModal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Violation Details</h3>
        <button class="modal-close" onclick="closeViolationModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="violation-detail">
          <div class="detail-row">
            <label>Date:</label>
            <span id="modalDate">-</span>
          </div>
          <div class="detail-row">
            <label>Type:</label>
            <span id="modalType">-</span>
          </div>
          <div class="detail-row">
            <label>Description:</label>
            <span id="modalDescription">-</span>
          </div>
          <div class="detail-row">
            <label>Status:</label>
            <span id="modalStatus">-</span>
          </div>
          <div class="detail-row">
            <label>Reported By:</label>
            <span id="modalReportedBy">-</span>
          </div>
          <div class="detail-row">
            <label>Resolution:</label>
            <span id="modalResolution">-</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-close" onclick="closeViolationModal()">Close</button>
      </div>
    </div>
  </div>
</main>

  <script src="<?= View::asset('js/userViolations.js') ?>"></script>


