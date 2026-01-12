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
<main>
    <div class="head-title">
      <div class="left">
        <h1>Announcements</h1>
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
        <input type="text" id="searchInput" placeholder="Search announcements..." onkeyup="searchAnnouncements()">
        <button class="search-btn" onclick="searchAnnouncements()">
          <i class='bx bx-search'></i>
        </button>
      </div>
    </div>
  
    <!-- Announcements List -->
    <div class="announcements-list" id="announcementsListContainer">
      <?php if (empty($announcements)): ?>
        <div style="text-align: center; padding: 40px;">
          <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
          <p>No announcements available</p>
        </div>
      <?php else: ?>
        <?php foreach ($announcements as $announcement): ?>
          <?php
            $type = $announcement['type'] ?? 'info';
            $typeClass = $type === 'urgent' ? 'urgent' : ($type === 'warning' ? 'warning' : 'general');
            $announcementId = $announcement['id'] ?? 0;
            $title = escapeHtml($announcement['title'] ?? 'Untitled');
            $message = escapeHtml($announcement['message'] ?? '');
            $timeAgo = formatTimeAgo($announcement['created_at'] ?? '');
            $category = $type === 'urgent' ? 'Urgent' : ($type === 'warning' ? 'Warning' : 'General');
            
            $icon = 'bxs-info-circle';
            if ($type === 'urgent') $icon = 'bxs-error-circle';
            else if ($type === 'warning') $icon = 'bxs-error';
            else if ($type === 'info') $icon = 'bxs-info-circle';
            else $icon = 'bxs-bell';
          ?>
          <div class="announcement-card <?= $typeClass ?> unread" data-category="<?= $type ?>">
            <div class="announcement-header">
              <div class="announcement-icon <?= $typeClass ?>">
                <i class='bx <?= $icon ?>'></i>
              </div>
              <div class="announcement-title">
                <h3><?= $title ?></h3>
                <div class="announcement-meta">
                  <span class="announcement-date"><?= $timeAgo ?></span>
                  <span class="announcement-category <?= $typeClass ?>"><?= $category ?></span>
                </div>
              </div>
              <div class="announcement-actions">
                <button class="btn-mark-read" onclick="markAsRead(<?= $announcementId ?>, this)">
                  <i class='bx bxs-check-circle'></i>
                </button>
              </div>
            </div>
            <div class="announcement-content">
              <p><?= $message ?></p>
              <div class="announcement-tags">
                <span class="tag"><?= $category ?></span>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  
    <!-- Load More Button -->
    <div class="load-more-container">
      <button class="btn-load-more" onclick="loadMoreAnnouncements()">
        <i class='bx bx-plus'></i>
        <span>Load More Announcements</span>
      </button>
    </div>
  </main>
  
  <script src="<?= View::asset('js/userAnnouncements.js') ?>"></script>


