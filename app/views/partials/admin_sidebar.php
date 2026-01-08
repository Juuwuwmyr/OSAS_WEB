<?php
require_once __DIR__ . '/../../core/View.php';
?>
<!-- SIDEBAR -->
<section id="sidebar">
  <i class='bx bx-menu sidebar-menu-toggle'></i>
  <a href="#" class="brand">
    <img src="<?= View::asset('img/default.png') ?>" alt="Crown Icon"
      style="width: 38px; height: 38px; vertical-align: middle; margin-right: 24px; margin-left: 10px;">
    <span class="text">Osas System</span>
  </a>

  <ul class="side-menu top">
    <li class="active">
      <a href="#" data-page="admin_page/dashcontent">
        <i class='bx bxs-dashboard'></i>
        <span class="text">Dashboard</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="admin_page/Department">
        <i class='bx bxs-building'></i>
        <span class="text">Department</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="admin_page/Sections">
        <i class='bx bxs-layer'></i>
        <span class="text">Sections</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="admin_page/Students">
        <i class='bx bxs-group'></i>
        <span class="text">Students</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="admin_page/Violations">
        <i class='bx bxs-shield-x'></i>
        <span class="text">Violations</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="admin_page/Reports">
        <i class='bx bxs-file'></i>
        <span class="text">Reports</span>
      </a>
    </li>
    <li>
      <a href="#" data-page="admin_page/Announcements">
        <i class='bx bxs-megaphone'></i>
        <span class="text">Announcements</span>
      </a>
    </li>
  </ul>
  <ul class="side-menu">
    <li>
      <a href="#" data-page="admin_page/settings">
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


