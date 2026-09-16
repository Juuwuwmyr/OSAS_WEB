<?php
require_once __DIR__ . '/../../core/View.php';
@session_start();
$_studentUserId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
$_studentName   = htmlspecialchars($_SESSION['full_name'] ?? ($_SESSION['username'] ?? 'Student'));
?>
<link rel="stylesheet" href="<?= View::asset('styles/messages.css') ?>?v=<?= time() ?>">

<div id="user-messages-page" class="admin-messages-root">

  <!-- ══ LEFT PANEL: Conversation list ════════════════════════════════════ -->
  <aside class="msg-sidebar" id="msgSidebar">

    <div class="msg-sidebar-header">
      <div class="msg-sidebar-title">
        <i class='bx bxs-message-rounded-dots'></i>
        <span>Messages</span>
        <span class="msg-unread-badge" id="msgTotalBadge" style="display:none"></span>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="msg-tabs">
      <button class="msg-tab active" data-tab="all">All</button>
      <button class="msg-tab" data-tab="unread">Unread</button>
    </div>

    <!-- Conversation list -->
    <div class="msg-conv-list" id="msgConvList">
      <div class="msg-conv-empty" id="msgConvEmpty">
        <i class='bx bxs-message-square-dots'></i>
        <p>No messages yet.</p>
        <small>An OSAS staff will contact you here.</small>
      </div>
    </div>

  </aside>

  <!-- ══ RIGHT PANEL: Chat window ════════════════════════════════════════ -->
  <main class="msg-chat" id="msgChat">

    <!-- Empty state -->
    <div class="msg-chat-empty" id="msgChatEmpty">
      <i class='bx bxs-message-alt-dots'></i>
      <h3>Your Messages</h3>
      <p>OSAS staff will reach out here about your violations or concerns.<br>
         Select a conversation on the left to view messages.</p>
    </div>

    <!-- Active chat -->
    <div class="msg-chat-inner" id="msgChatInner" style="display:none">

      <!-- Chat header -->
      <div class="msg-chat-header">
        <button class="msg-back-btn" id="msgBackBtn" title="Back to list">
          <i class='bx bx-chevron-left'></i>
        </button>
        <div class="msg-chat-avatar-wrap">
          <img src="" alt="OSAS" class="msg-chat-avatar" id="msgChatAvatar">
          <span class="msg-online-dot"></span>
        </div>
        <div class="msg-chat-header-info">
          <span class="msg-chat-name"  id="msgChatName"></span>
          <span class="msg-chat-sub"   id="msgChatSub">OSAS Staff</span>
        </div>
      </div>

      <!-- Messages area -->
      <div class="msg-bubbles" id="msgBubbles">
        <div class="msg-bubbles-loading" id="msgBubblesLoading">
          <div class="msg-spinner"></div>
        </div>
      </div>

      <!-- Input bar -->
      <div class="msg-input-bar">
        <textarea id="msgInput" class="msg-input"
                  placeholder="Reply to OSAS…"
                  rows="1" maxlength="5000"></textarea>
        <button class="msg-send-btn" id="msgSendBtn" title="Send">
          <i class='bx bxs-send'></i>
        </button>
      </div>

    </div><!-- /msg-chat-inner -->
  </main><!-- /msg-chat -->

</div>

<script>
window.OSAS_MSG_ROLE    = 'user';
window.OSAS_MSG_USER_ID = <?= json_encode($_studentUserId) ?>;
window.OSAS_MSG_NAME    = <?= json_encode($_studentName) ?>;
</script>
<script>
(function(){
  if (!window.messagesModuleLoaded) {
    var s = document.createElement('script');
    s.src = <?= json_encode(View::asset('js/messages.js') . '?v=' . time()) ?>;
    document.head.appendChild(s);
    window.messagesModuleLoaded = true;
  } else if (typeof window.initMessagesModule === 'function') {
    window.initMessagesModule();
  }
})();
</script>
