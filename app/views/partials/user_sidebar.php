<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!-- SIDEBAR -->
<section id="sidebar">
  <a href="#" class="brand">
    <img src="<?= View::asset('img/default.png') ?>" alt="Crown Icon"
      style="width: 38px; height: 38px; vertical-align: middle; margin-right: 24px; margin-left: 10px;">
    <span class="text">Osas System</span>
  </a>

  <ul class="side-menu top">
    <li class="active">
      <a href="#" data-page="user-page/user_dashcontent">
        <i class='bx bxs-dashboard'></i>
        <span class="text">My Dashboard</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="user-page/my_violations">
        <i class='bx bxs-shield-x'></i>
        <span class="text">My Violations</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="user-page/my_profile">
        <i class='bx bxs-user'></i>
        <span class="text">My Profile</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="user-page/announcements">
        <i class='bx bxs-megaphone'></i>
        <span class="text">Announcements</span>
      </a>
    </li>
  </ul>
  <ul class="side-menu">
    <li>
      <a href="#" class="logout" onclick="alert('Settings page coming soon')">
        <i class='bx bxs-cog'></i>
        <span class="text">Settings</span>
      </a>
    </li>
    <li>
      <a href="#" class="logout" onclick="logout()">
        <i class='bx bx-log-out'></i>
        <span class="text">Logout</span>
      </a>
    </li>
  </ul>
</section>
<!-- SIDEBAR -->


