<?php
require_once __DIR__ . '/../../core/View.php';
require_once __DIR__ . '/../../core/Model.php';
require_once __DIR__ . '/../../models/AnnouncementModel.php';

// Start session if not started
@session_start();

// Get active announcements from database
$announcements = [];
try {
    $announcementModel = new AnnouncementModel();
    $announcements = $announcementModel->getActive();
} catch (Exception $e) {
    error_log("Error loading announcements in announcements.php: " . $e->getMessage());
    $announcements = [];
}

// Helper function to format time ago
function formatTimeAgo($dateString) {
    if (!$dateString) return 'Unknown';
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

// Helper function to escape HTML
function escapeHtml($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}
?>
<!-- Announcements Page -->
<div id="announcements-page">
  <main>
    <div class="announcements-head-title">
      <div class="left">
        <h1>Announcements</h1>
        <p class="announcements-subtitle">Stay updated with the latest news and information from the institution</p>
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
      <div class="announcement-actions">
        <button class="btn-mark-all-read" onclick="markAllAsRead()">
          <i class='bx bxs-check-circle'></i>
          <span class="text">Mark All Read</span>
        </button>
        <button class="btn-refresh" onclick="refreshAnnouncements()">
          <i class='bx bx-refresh'></i>
          <span class="text">Refresh</span>
        </button>
      </div>
    </div>
  
    <!-- Filter and Search -->
    <div class="announcement-filters">
      <div class="filter-group">
        <label for="categoryFilter">Category:</label>
        <select id="categoryFilter" onchange="filterAnnouncements()">
          <option value="all">All Categories</option>
          <option value="urgent">Urgent</option>
          <option value="warning">Warning</option>
          <option value="info">General</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="statusFilter">Status:</label>
        <select id="statusFilter" onchange="filterAnnouncements()">
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
      <div class="search-group">
        <i class='bx bx-search'></i>
        <input type="text" id="searchInput" placeholder="Search announcements..." onkeyup="searchAnnouncements()">
      </div>
    </div>
  
    <!-- Announcements List -->
    <div class="table-data" id="announcementsTableContainer">
      <div class="order">
        <div class="head">
          <h3>Recent Announcements</h3>
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
              <?php if (empty($announcements)): ?>
                <tr>
                  <td colspan="5" class="empty-row">
                    <div class="empty-state">
                      <i class='bx bx-info-circle'></i>
                      <p>No announcements available</p>
                    </div>
                  </td>
                </tr>
              <?php else: ?>
                <?php foreach ($announcements as $announcement): ?>
                  <?php $isRead = $announcement['is_read'] ?? false; ?>
                  <tr data-id="<?= $announcement['id'] ?>" class="<?= $isRead ? 'read' : 'unread' ?>">
                    <td>
                      <div class="announcement-title-cell">
                        <span class="title-text"><?= escapeHtml($announcement['title']) ?></span>
                      </div>
                    </td>
                    <td>
                      <span class="announcement-type <?= strtolower($announcement['category'] ?? 'info') ?>">
                        <?= escapeHtml($announcement['category'] ?? 'General') ?>
                      </span>
                    </td>
                    <td>
                      <span class="status-badge <?= $isRead ? 'read' : 'unread' ?>">
                        <?= $isRead ? 'Read' : 'Unread' ?>
                      </span>
                    </td>
                    <td>
                      <span class="date-text"><?= date('M d, Y', strtotime($announcement['created_at'] ?? 'now')) ?></span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="action-btn view" onclick="viewAnnouncement(<?= $announcement['id'] ?>)" title="View">
                          <i class='bx bx-show'></i>
                        </button>
                        <?php if (!$isRead): ?>
                          <button class="action-btn mark-read" onclick="markAsRead(<?= $announcement['id'] ?>)" title="Mark as Read">
                            <i class='bx bx-check'></i>
                          </button>
                        <?php endif; ?>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  
    <!-- Load More Button -->
    <div class="load-more-container" id="loadMoreContainer" style="display: <?= count($announcements) >= 10 ? 'flex' : 'none' ?>;">
      <button class="btn-load-more" onclick="loadMoreAnnouncements()">
        <i class='bx bx-plus'></i>
        <span>Load More Announcements</span>
      </button>
    </div>
  </main>
</div>
  
  <script src="<?= View::asset('js/userAnnouncements.js') ?>"></script>


