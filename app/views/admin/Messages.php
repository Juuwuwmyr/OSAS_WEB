<?php
require_once __DIR__ . '/../../core/View.php';
@session_start();
$_adminUserId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
$_adminName   = htmlspecialchars($_SESSION['full_name'] ?? ($_SESSION['username'] ?? 'Admin'));
?>
<link rel="stylesheet" href="<?= View::asset('styles/messages.css') ?>?v=<?= time() ?>">

<div id="admin-messages-page" class="admin-messages-root">

  <!-- ══ LEFT PANEL: Conversation list ════════════════════════════════════ -->
  <aside class="msg-sidebar" id="msgSidebar">

    <div class="msg-sidebar-header">
      <div class="msg-sidebar-title">
        <i class='bx bxs-message-rounded-dots'></i>
        <span>Messages</span>
        <span class="msg-unread-badge" id="msgTotalBadge" style="display:none"></span>
      </div>
      <button class="msg-new-btn" id="msgNewBtn" title="New conversation">
        <i class='bx bx-edit'></i>
      </button>
    </div>

    <!-- Search / New conversation panel -->
    <div class="msg-search-wrap" id="msgSearchWrap" style="display:none">
      <div class="msg-search-inner">
        <i class='bx bx-search'></i>
        <input type="text" id="msgStudentSearch"
               placeholder="Search student by name or ID…"
               autocomplete="off">
        <button class="msg-search-clear" id="msgSearchClear" style="display:none">
          <i class='bx bx-x'></i>
        </button>
      </div>
      <div class="msg-search-results" id="msgSearchResults"></div>
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
        <p>No conversations yet.</p>
        <small>Click the edit icon to start one.</small>
      </div>
    </div>

  </aside>

  <!-- ══ RIGHT PANEL: Chat window ════════════════════════════════════════ -->
  <main class="msg-chat" id="msgChat">

    <!-- Empty state (no conversation selected) -->
    <div class="msg-chat-empty" id="msgChatEmpty">
      <i class='bx bxs-message-alt-dots'></i>
      <h3>Select a conversation</h3>
      <p>Choose a student from the list to start chatting, or click<br>
         <strong>New conversation</strong> to message someone new.</p>
    </div>

    <!-- Active chat -->
    <div class="msg-chat-inner" id="msgChatInner" style="display:none">

      <!-- Chat header -->
      <div class="msg-chat-header">
        <button class="msg-back-btn" id="msgBackBtn" title="Back to list">
          <i class='bx bx-chevron-left'></i>
        </button>
        <div class="msg-chat-avatar-wrap">
          <img src="" alt="Avatar" class="msg-chat-avatar" id="msgChatAvatar">
          <span class="msg-online-dot"></span>
        </div>
        <div class="msg-chat-header-info">
          <span class="msg-chat-name"   id="msgChatName"></span>
          <span class="msg-chat-sub"    id="msgChatSub"></span>
        </div>
        <div class="msg-chat-header-actions">
          <button class="msg-violation-btn" id="msgViolationBtn" title="View violations">
            <i class='bx bxs-shield-x'></i>
            <span>Violations</span>
          </button>
        </div>
      </div>

      <!-- Messages area -->
      <div class="msg-bubbles" id="msgBubbles">
        <div class="msg-bubbles-loading" id="msgBubblesLoading">
          <div class="msg-spinner"></div>
        </div>
      </div>

      <!-- Typing / input bar -->
      <div class="msg-input-bar">
        <textarea id="msgInput" class="msg-input"
                  placeholder="Type a message…"
                  rows="1" maxlength="5000"></textarea>
        <button class="msg-send-btn" id="msgSendBtn" title="Send">
          <i class='bx bxs-send'></i>
        </button>
      </div>

    </div><!-- /msg-chat-inner -->
  </main><!-- /msg-chat -->

</div><!-- /admin-messages-page -->

<script>
window.OSAS_MSG_ROLE    = 'admin';
window.OSAS_MSG_USER_ID = <?= json_encode($_adminUserId) ?>;
window.OSAS_MSG_NAME    = <?= json_encode($_adminName) ?>;
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
