<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!-- User Dashboard Content -->
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
      <a href="#" class="btn-download">
        <i class='bx bxs-download'></i>
        <span class="text">Download Report</span>
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
      <i class='bx bxs-user-check'></i>
      <span class="text">
        <h3>0</h3>
        <p>Active Violations</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-calendar-check'></i>
      <span class="text">
        <h3>3</h3>
        <p>Total Violations</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-shield-check'></i>
      <span class="text">
        <h3>Good</h3>
        <p>Permitted</p>
      </span>
    </li>
    <li>
      <i class='bx bxs-time'></i>
      <span class="text">
        <h3>7</h3>
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
          <i class='bx bxs-shoe'></i>
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



