<?php
require_once __DIR__ . '/../../core/View.php';
$userImage = View::asset('img/user.jpg');
if (isset($role) && $role === 'user') {
    $userImage = View::asset('img/default.png');
}
?>
<!-- NAVBAR -->
<nav class="top-navbar">
  <input type="checkbox" id="switch-mode" hidden>
  <label for="switch-mode" class="switch-mode"></label>
  <input type="checkbox" id="eye-care-toggle" hidden>
  <label for="eye-care-toggle" class="eye-care-toggle" title="Eye Care (Light Mode Only)">
    <i class='bx bx-brightness'></i>
  </label>
  <a href="#" class="notification">
    <i class='bx bxs-bell'></i>
    <span class="num"><?= isset($notificationCount) ? $notificationCount : '1' ?></span>
  </a>
  <a href="#" class="nav-settings" id="openSettingsModal" title="Settings">
    <i class='bx bxs-cog'></i>
  </a>
  <a href="#" class="profile">
    <img src="<?= $userImage ?>">
  </a>
</nav>
<!-- NAVBAR -->


