<?php
require_once __DIR__ . '/../../core/View.php';
?>
<link rel="stylesheet" href="<?= View::asset('styles/announcements.css') ?>">
<main id="announcements-page">

  <!-- Header -->
  <div class="announcements-head-title">
    <div class="left">
      <h1>Announcements Management</h1>
      <p class="announcements-subtitle">Manage and publish announcements for students and staff.</p>
      <ul class="announcements-breadcrumb">
        <li><a href="#">Dashboard</a></li>
        <li><i class='bx bx-chevron-right'></i></li>
        <li><a class="active" href="#">Announcements</a></li>
      </ul>
    </div>
    <div class="announcement-actions">
      <button class="btn-mark-all-read" onclick="openAddAnnouncementModal()">
        <i class='bx bx-plus'></i>
        <span class="text">Add Announcement</span>
      </button>
    </div>
  </div>

  <!-- Filters and Search -->
  <div class="announcement-filters">
    <div class="filter-group">
      <label>Status:</label>
      <select id="announcementStatusFilter" onchange="setFilter(this.value)">
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
    </div>
    <div class="search-group">
      <i class='bx bx-search'></i>
      <input type="text" id="announcementSearch" placeholder="Search announcements..." onkeyup="filterAnnouncements()">
    </div>
  </div>

  <!-- Announcements Table -->
  <div class="table-data">
    <div class="order">
      <div class="head">
        <h3>Announcements</h3>
      </div>
      <div class="table-wrapper">
        <table id="announcementsTable">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="announcementsTableBody">
            <tr>
              <td colspan="5" style="text-align:center; padding:40px;">
                <div class="loading-spinner"></div>
                <p>Loading announcements...</p>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="announcements-pagination"></div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Modal -->
  <div id="announcementModal" class="announcement-modal">
    <div class="announcement-modal-backdrop" onclick="closeAnnouncementModal()"></div>
    <div class="announcement-modal-panel">
      <header class="announcement-modal-header">
        <div class="header-icon">
          <i class='bx bxs-megaphone'></i>
        </div>
        <div class="header-text">
          <h3 id="modalTitle">Add New Announcement</h3>
          <p id="modalSubtitle">Fill in the details below to publish a new announcement.</p>
        </div>
        <button class="announcement-modal-close" onclick="closeAnnouncementModal()">
          <i class='bx bx-x'></i>
        </button>
      </header>

      <form id="announcementForm" class="modern-form" onsubmit="event.preventDefault(); saveAnnouncement();">
        <input type="hidden" id="announcementId" value="">

        <div class="form-group">
          <label for="announcementTitle">Title <span class="required">*</span></label>
          <div class="input-wrapper">
            <i class='bx bx-heading'></i>
            <input type="text" id="announcementTitle" placeholder="e.g. Enrollment for Next Semester" required>
          </div>
        </div>

        <div class="form-group">
          <label for="announcementType">Announcement Type</label>
          <div class="input-wrapper">
            <i class='bx bx-category'></i>
            <select id="announcementType">
              <option value="info">General Information</option>
              <option value="urgent">Urgent / Critical</option>
              <option value="warning">Important Warning</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="announcementMessage">Message <span class="required">*</span></label>
          <div class="textarea-wrapper">
            <textarea id="announcementMessage" placeholder="Type your announcement message here..." rows="6" required></textarea>
          </div>
        </div>

        <div class="announcement-modal-footer">
          <button type="button" class="btn-cancel" onclick="closeAnnouncementModal()">Cancel</button>
          <button type="submit" class="btn-submit">
            <span class="btn-text">Save Announcement</span>
            <i class='bx bx-send'></i>
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    if (typeof window.initAnnouncementModule === 'function') {
      window.initAnnouncementModule();
    }
  </script>
</main>
