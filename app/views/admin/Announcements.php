<?php
require_once __DIR__ . '/../../core/View.php';
?>
<main>
  <div class="head-title">
    <div class="left">
      <h1>Announcements Management</h1>
      <ul class="breadcrumb">
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
        <i class='bx bx-search' onclick="document.getElementById('announcementSearch').focus()"></i>
        <i class='bx bx-filter' title="Use filter buttons above"></i>
      </div>
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

<style>
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dark-grey);
}

.search-box input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid var(--dark-grey);
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.search-box input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid var(--dark-grey);
  background: var(--light);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
}

.filter-btn.active {
  background: linear-gradient(135deg, var(--gold) 0%, var(--orange) 100%);
  border-color: var(--gold);
  color: var(--dark);
  font-weight: 600;
}

#announcementsTable {
  width: 100%;
  border-collapse: collapse;
}

#announcementsTable thead th {
  background: var(--grey);
  padding: 15px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--dark-grey);
}

#announcementsTable tbody td {
  padding: 15px;
  border-bottom: 1px solid var(--grey);
}

#announcementsTable tbody tr:hover {
  background: rgba(255, 215, 0, 0.05);
}

.announcement-type {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.announcement-type.info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.announcement-type.urgent {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.announcement-type.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-btn.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-btn.edit:hover {
  background: #3b82f6;
  color: white;
}

.action-btn.archive {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.action-btn.archive:hover {
  background: #f59e0b;
  color: white;
}

.action-btn.restore {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.action-btn.restore:hover {
  background: #22c55e;
  color: white;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-panel {
  position: relative;
  background: var(--light);
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 3001;
}

.modal-header {
  padding: 24px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--orange) 100%);
  border-radius: 20px 20px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--dark);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 28px;
  color: var(--dark);
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: rotate(90deg);
}

.modal-panel form {
  padding: 24px;
}

.modal-panel label {
  display: block;
  margin-bottom: 20px;
  font-weight: 600;
  color: var(--dark);
}

.modal-panel label .required {
  color: #ef4444;
}

.modal-panel input,
.modal-panel textarea,
.modal-panel select {
  width: 100%;
  padding: 12px 16px;
  margin-top: 8px;
  border: 2px solid var(--dark-grey);
  border-radius: 10px;
  font-size: 14px;
  font-family: Arial, sans-serif;
  outline: none;
  transition: all 0.3s ease;
}

.modal-panel input:focus,
.modal-panel textarea:focus,
.modal-panel select:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

.modal-panel textarea {
  resize: vertical;
  min-height: 120px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: var(--grey);
  color: var(--dark);
}

.btn-cancel:hover {
  background: var(--dark-grey);
}

.btn-submit {
  background: linear-gradient(135deg, var(--gold) 0%, var(--orange) 100%);
  color: var(--dark);
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.loading-spinner {
  border: 3px solid var(--grey);
  border-top: 3px solid var(--gold);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

