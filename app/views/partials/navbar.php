<?php
require_once __DIR__ . '/../../core/View.php';
$userImage = View::asset('img/user.jpg');
if (isset($role) && $role === 'user') {
    $userImage = View::asset('img/default.png');
}
?>
<!-- NAVBAR -->
<nav>
  <i class='bx bx-menu'></i>
  <a href="#" class="nav-link">Categories</a>
  <form action="#">
    <div class="form-input">
      <input type="search" placeholder="Search...">
      <button type="submit" class="search-btn"><i class='bx bx-search'></i></button>
    </div>
  </form>
  <input type="checkbox" id="switch-mode" hidden>
  <label for="switch-mode" class="switch-mode"></label>
  <a href="#" class="notification">
    <i class='bx bxs-bell'></i>
    <span class="num"><?= isset($notificationCount) ? $notificationCount : '1' ?></span>
  </a>
  <a href="#" class="profile">
    <img src="<?= $userImage ?>">
  </a>
</nav>
<!-- NAVBAR -->


