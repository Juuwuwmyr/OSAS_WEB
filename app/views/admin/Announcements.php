<?php
require_once __DIR__ . '/../../core/View.php';
?>
<link rel="stylesheet" href="<?= View::asset('styles/announcements.css') ?>">
<main id="announcements-page">
  <div class="announcements-head-title">
    <div class="announcements-left">
      <h1>Announcements Management</h1>
      <ul class="announcements-breadcrumb">
        <li>
          <a href="#">Dashboard</a>
        </li>
        <li><i class='bx bx-chevron-right'></i></li>
        <li>
          <a class="active" href="#">Announcements</a>
        </li>
      </ul>
    </div>
    <button class="btn-download" onclick="openAddAnnouncementModal()">
      <i class='bx bx-plus'></i>
      <span class="text">Add Announcement</span>
    </button>
  </div>

  <!-- Filters and Search -->
  <div class="table-controls">
    <div class="search-box">
      <i class='bx bx-search'></i>
      <input type="text" id="announcementSearch" placeholder="Search announcements..." onkeyup="filterAnnouncements()">
    </div>
    <div class="filter-buttons">
      <button class="filter-btn active" data-filter="all" onclick="setFilter('all')">All</button>
      <button class="filter-btn" data-filter="active" onclick="setFilter('active')">Active</button>
      <button class="filter-btn" data-filter="archived" onclick="setFilter('archived')">Archived</button>
    </div>
  </div>

  <!-- Announcements Table -->
  <div class="table-data">
    <div class="order">
      <div class="head">
        <h3>Announcements</h3>
        <div>
          <i class='bx bx-search' onclick="document.getElementById('announcementSearch').focus()"></i>
          <i class='bx bx-filter' title="Use filter buttons above"></i>
        </div>
      </div>
      <div class="table-wrapper">
        <table id="announcementsTable">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="announcementsTableBody">
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
              <div class="loading-spinner"></div>
              <p>Loading announcements...</p>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>

  <!-- Add/Edit Announcement Modal -->
  <div id="announcementModal" class="modal" style="display: none;">
    <div class="modal-backdrop" onclick="closeAnnouncementModal()"></div>
    <div class="modal-panel">
      <header class="modal-header">
        <h3 id="modalTitle"><i class='bx bxs-megaphone'></i> Add New Announcement</h3>
        <button class="modal-close" onclick="closeAnnouncementModal()">&times;</button>
      </header>

      <form id="announcementForm" onsubmit="event.preventDefault(); saveAnnouncement();">
        <input type="hidden" id="announcementId" value="">

        <label>
          Title <span class="required">*</span>
          <input type="text" id="announcementTitle" placeholder="Enter announcement title" required>
        </label>

        <label>
          Message <span class="required">*</span>
          <textarea id="announcementMessage" placeholder="Enter announcement message" rows="5" required></textarea>
        </label>

        <label>
          Type
          <select id="announcementType">
            <option value="info">Info</option>
            <option value="urgent">Urgent</option>
            <option value="warning">Warning</option>
          </select>
        </label>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeAnnouncementModal()">Cancel</button>
          <button type="submit" class="btn-submit">Save Announcement</button>
        </div>
      </form>
    </div>
  </div>
</main>

