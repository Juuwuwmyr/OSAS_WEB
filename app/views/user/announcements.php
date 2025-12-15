<?php
require_once __DIR__ . '/../../core/View.php';
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
          <option value="policy">Policy Updates</option>
          <option value="event">Events</option>
          <option value="general">General</option>
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
      <div style="text-align: center; padding: 40px;">
        <div class="loading-spinner"></div>
        <p>Loading announcements...</p>
      </div>
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


