/**
 * OSAS Messenger — messages.js
 * Handles both admin and student (user) sides.
 * Loaded once; subsequent SPA navigations call initMessagesModule().
 */

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────────────────────
  const POLL_INTERVAL   = 3000;   // ms — poll for new messages
  const BADGE_INTERVAL  = 8000;   // ms — poll unread count for sidebar badge

  // ── State ────────────────────────────────────────────────────────────────
  let currentConvId    = null;
  let lastMsgId        = 0;
  let pollTimer        = null;
  let badgeTimer       = null;
  let currentTab       = 'all';
  let allConversations = [];
  let isMobile         = window.innerWidth <= 768;
  let _newBtnDefaultLabel = '';

  // ── DOM refs (resolved per init) ─────────────────────────────────────────
  let $convList, $convEmpty, $chatEmpty, $chatInner, $bubbles,
      $bubblesLoading, $input, $sendBtn, $chatName, $chatSub,
      $chatAvatar, $totalBadge, $newBtn, $searchWrap, $searchInput,
      $searchClear, $searchResults, $backBtn, $sidebar, $chat,
      $violationBtn;

  const role    = () => window.OSAS_MSG_ROLE    || 'admin';
  const myId    = () => window.OSAS_MSG_USER_ID || 0;
  const isAdmin = () => role() === 'admin';

  // ── API base ─────────────────────────────────────────────────────────────
  function apiBase() {
    const p = location.pathname.split('/').filter(Boolean);
    const d = ['app', 'api', 'includes', 'assets', 'public'];
    return ((p.length === 0 || d.includes(p[0])) ? '' : '/' + p[0]) + '/api/messages.php';
  }

  async function apiFetch(params, body) {
    const qs  = new URLSearchParams(params).toString();
    const url = apiBase() + (qs ? '?' + qs : '');
    const opts = body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { method: 'GET' };
    const res  = await fetch(url, opts);
    return res.json();
  }

  // ── Init (entry point) ───────────────────────────────────────────────────
  let _eventsbound = false;

  window.initMessagesModule = function () {
    resolveDOM();
    if (!$convList) return;   // view not in DOM yet — badge poller already running globally

    // Always stop any previous poll when re-entering the view
    stopPoll();

    // Reset state for fresh view load
    currentConvId    = null;
    lastMsgId        = 0;
    currentTab       = 'all';
    allConversations = [];
    _eventsbound = false;  // view was re-injected into DOM, re-bind

    bindEvents();
    loadConversations();
    // Badge poller may already be running globally; restart to reset interval
    startBadgePoller();
  };

  // Global badge poller — starts when the script loads (even if the view isn't active)
  // so the sidebar badge is always up to date.
  window.initMessagesBadge = function () {
    startBadgePoller();
  };

  function resolveDOM() {
    $convList      = document.getElementById('msgConvList');
    $convEmpty     = document.getElementById('msgConvEmpty');
    $chatEmpty     = document.getElementById('msgChatEmpty');
    $chatInner     = document.getElementById('msgChatInner');
    $bubbles       = document.getElementById('msgBubbles');
    $bubblesLoading= document.getElementById('msgBubblesLoading');
    $input         = document.getElementById('msgInput');
    $sendBtn       = document.getElementById('msgSendBtn');
    $chatName      = document.getElementById('msgChatName');
    $chatSub       = document.getElementById('msgChatSub');
    $chatAvatar    = document.getElementById('msgChatAvatar');
    $totalBadge    = document.getElementById('msgTotalBadge');
    $newBtn        = document.getElementById('msgNewBtn');
    $searchWrap    = document.getElementById('msgSearchWrap');
    $searchInput   = document.getElementById('msgStudentSearch');
    $searchClear   = document.getElementById('msgSearchClear');
    $searchResults = document.getElementById('msgSearchResults');
    $backBtn       = document.getElementById('msgBackBtn');
    $sidebar       = document.getElementById('msgSidebar');
    $chat          = document.getElementById('msgChat');
    $violationBtn  = document.getElementById('msgViolationBtn');
  }

  function bindEvents() {
    // Tab switching
    document.querySelectorAll('.msg-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.msg-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        renderConversationList();
      });
    });

    // New conversation button (admin: search students / student: pick admin)
    _newBtnDefaultLabel = isAdmin()
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Conversation'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Message OSAS Staff';
    const _newBtnCancelLabel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel';

    if ($newBtn) {
      $newBtn.addEventListener('click', () => {
        const open = $searchWrap.style.display !== 'none';
        $searchWrap.style.display = open ? 'none' : 'block';
        // Toggle button label and style
        if (open) {
          $newBtn.innerHTML = _newBtnDefaultLabel;
          $newBtn.classList.remove('msg-new-btn--cancel');
        } else {
          $newBtn.innerHTML = _newBtnCancelLabel;
          $newBtn.classList.add('msg-new-btn--cancel');
          if (isAdmin()) {
            if ($searchInput) { $searchInput.focus(); }
            if ($searchResults) $searchResults.innerHTML = '';
          } else {
            loadAdminList();
          }
        }
      });
    }

    // Student search input
    if ($searchInput) {
      let debounce;
      $searchInput.addEventListener('input', () => {
        const q = $searchInput.value.trim();
        $searchClear.style.display = q ? 'block' : 'none';
        clearTimeout(debounce);
        debounce = setTimeout(() => searchStudents(q), 300);
      });
    }

    if ($searchClear) {
      $searchClear.addEventListener('click', () => {
        $searchInput.value = '';
        $searchClear.style.display = 'none';
        $searchResults.innerHTML = '';
        $searchInput.focus();
      });
    }

    // Send button
    if ($sendBtn) {
      $sendBtn.addEventListener('click', sendMessage);
    }

    // Textarea — Enter to send, Shift+Enter for newline; auto-resize
    if ($input) {
      $input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      $input.addEventListener('input', () => autoResizeTextarea($input));
    }

    // Back button (mobile)
    if ($backBtn) {
      $backBtn.addEventListener('click', () => {
        showSidebar();
      });
    }

    // Violation shortcut (admin only)
    if ($violationBtn) {
      $violationBtn.addEventListener('click', () => {
        if (typeof loadContent === 'function') {
          loadContent('admin_page/Violations');
        }
      });
    }

    // Window resize
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 768;
    });
  }

  // ── Conversations ────────────────────────────────────────────────────────
  async function loadConversations() {
    try {
      const data = await apiFetch({ action: 'conversations' });
      if (data.success) {
        allConversations = data.conversations || [];
        renderConversationList();
      }
    } catch (e) {
      console.warn('loadConversations error:', e);
    }
  }

  function renderConversationList() {
    const list = currentTab === 'unread'
      ? allConversations.filter(c => parseInt(c.unread) > 0)
      : allConversations;

    if (list.length === 0) {
      if ($convEmpty) $convEmpty.style.display = 'flex';
      // Remove all conv items
      document.querySelectorAll('.msg-conv-item').forEach(el => el.remove());
      return;
    }

    if ($convEmpty) $convEmpty.style.display = 'none';

    // Remove old items
    document.querySelectorAll('.msg-conv-item').forEach(el => el.remove());

    list.forEach(conv => {
      const item = buildConvItem(conv);
      $convList.appendChild(item);
    });
  }

  function buildConvItem(conv) {
    const div = document.createElement('div');
    div.className = 'msg-conv-item' +
      (parseInt(conv.unread) > 0 ? ' has-unread' : '') +
      (currentConvId === parseInt(conv.id) ? ' active' : '');
    div.dataset.convId = conv.id;

    const name    = isAdmin() ? (conv.student_name || 'Student') : (conv.admin_name || 'OSAS Admin');
    const sub     = isAdmin()
      ? (conv.student_code ? conv.student_code + (conv.department ? ' · ' + conv.department : '') : '')
      : 'OSAS Staff';
    const avatar  = isAdmin()
      ? (conv.student_avatar ? resolveAsset(conv.student_avatar) : defaultAvatar())
      : (conv.admin_avatar   || defaultAvatar());
    const preview = conv.last_message ? truncate(conv.last_message, 45) : 'No messages yet';
    const time    = conv.last_at ? formatTime(conv.last_at) : '';
    const unread  = parseInt(conv.unread) || 0;

    div.innerHTML = `
      <div class="msg-conv-avatar-wrap">
        <img class="msg-conv-avatar" src="${esc(avatar)}" alt="${esc(name)}"
             onerror="this.src='${defaultAvatar()}'">
        <span class="msg-conv-online"></span>
      </div>
      <div class="msg-conv-body">
        <div class="msg-conv-name">${esc(name)}</div>
        <div class="msg-conv-preview">${esc(preview)}</div>
      </div>
      <div class="msg-conv-meta">
        <span class="msg-conv-time">${esc(time)}</span>
        ${unread > 0 ? `<span class="msg-conv-unread-dot">${unread > 9 ? '9+' : unread}</span>` : ''}
      </div>
    `;

    div.addEventListener('click', (e) => {
      if (e.target.closest('.msg-conv-delete-btn')) return;
      openConversation(conv);
    });

    if (isAdmin()) {
      const delBtn = document.createElement('button');
      delBtn.className = 'msg-conv-delete-btn';
      delBtn.title = 'Delete conversation';
      delBtn.setAttribute('aria-label', 'Delete conversation');
      delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(parseInt(conv.id));
      });
      div.appendChild(delBtn);
    }

    return div;
  }

  // ── Open a conversation ──────────────────────────────────────────────────
  async function openConversation(conv) {
    // Clear previous poll
    stopPoll();
    currentConvId = parseInt(conv.id);
    lastMsgId = 0;

    // Update active item
    document.querySelectorAll('.msg-conv-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.convId) === currentConvId);
    });

    // Show chat panel
    if ($chatEmpty) $chatEmpty.style.display  = 'none';
    if ($chatInner) $chatInner.style.display  = 'flex';

    // Populate header
    const name   = isAdmin() ? (conv.student_name || 'Student') : (conv.admin_name || 'OSAS Admin');
    const sub    = isAdmin()
      ? (conv.student_code ? conv.student_code + (conv.department ? ' · ' + conv.department : '') : 'Student')
      : 'OSAS Staff';
    const avatar = isAdmin()
      ? (conv.student_avatar ? resolveAsset(conv.student_avatar) : defaultAvatar())
      : (conv.admin_avatar || defaultAvatar());

    if ($chatName)   $chatName.textContent   = name;
    if ($chatSub)    $chatSub.textContent    = sub;
    if ($chatAvatar) { $chatAvatar.src = avatar; $chatAvatar.onerror = () => { $chatAvatar.src = defaultAvatar(); }; }

    // Mobile: show chat, hide sidebar
    if (isMobile) showChat();

    // Show loading
    if ($bubblesLoading) $bubblesLoading.style.display = 'flex';
    // Clear old bubbles
    Array.from($bubbles.children).forEach(el => {
      if (el !== $bubblesLoading) el.remove();
    });

    // Load messages
    await loadMessages(conv.id);

    // Start polling
    startPoll();

    // Mark conv as read in local state
    conv.unread = 0;
    renderConversationList();
    // Re-activate correct item
    document.querySelectorAll('.msg-conv-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.convId) === currentConvId);
    });
  }

  async function loadMessages(convId) {
    try {
      const data = await apiFetch({ action: 'messages', conv_id: convId });
      if ($bubblesLoading) $bubblesLoading.style.display = 'none';
      if (!data.success) {
        appendDateSep('Could not load messages. Try again.');
        return;
      }

      const msgs = data.messages || [];
      if (msgs.length === 0) {
        appendDateSep('No messages yet — say hello!');
        return;
      }

      let lastDate = '';
      msgs.forEach(msg => {
        const d = formatDate(msg.created_at);
        if (d !== lastDate) { appendDateSep(d); lastDate = d; }
        appendBubble(msg);
      });

      if (msgs.length > 0) lastMsgId = parseInt(msgs[msgs.length - 1].id);
      scrollToBottom();
    } catch (e) {
      if ($bubblesLoading) $bubblesLoading.style.display = 'none';
      appendDateSep('Network error. Please try again.');
      console.warn('loadMessages error:', e);
    }
  }

  // ── Polling ──────────────────────────────────────────────────────────────
  function startPoll() {
    stopPoll();
    pollTimer = setInterval(() => pollMessages(), POLL_INTERVAL);
  }

  function stopPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  async function pollMessages() {
    if (!currentConvId) return;
    try {
      const data = await apiFetch({ action: 'poll', conv_id: currentConvId, after: lastMsgId });
      if (!data.success || !data.messages || data.messages.length === 0) return;

      let lastDate = lastDateInBubbles();
      data.messages.forEach(msg => {
        const d = formatDate(msg.created_at);
        if (d !== lastDate) { appendDateSep(d); lastDate = d; }
        appendBubble(msg);
      });
      lastMsgId = parseInt(data.messages[data.messages.length - 1].id);
      scrollToBottom();

      // Refresh conv list to update preview + unread
      loadConversations();
    } catch (e) {
      // silent
    }
  }

  // ── Render bubbles ────────────────────────────────────────────────────────
  function appendDateSep(label) {
    const sep = document.createElement('div');
    sep.className = 'msg-date-sep';
    sep.textContent = label;
    $bubbles.insertBefore(sep, $bubblesLoading);
  }

  function appendBubble(msg) {
    const isMine = parseInt(msg.sender_id) === myId();
    const row    = document.createElement('div');
    row.className = 'msg-row ' + (isMine ? 'sent' : 'recv');
    row.dataset.msgId = msg.id;

    const time   = formatTimeShort(msg.created_at);
    const read   = isMine && parseInt(msg.is_read) === 1;
    const tick   = isMine
      ? `<span class="msg-read-tick ${read ? 'read' : 'unread'}">✓✓</span>`
      : '';

    row.innerHTML = `
      <div class="msg-bubble-wrap">
        ${isMine ? `<button class="msg-delete-btn" title="Delete message" aria-label="Delete message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>` : ''}
        <div class="msg-bubble">${escHtml(msg.body)}</div>
        <div class="msg-bubble-meta">
          ${tick}
          <span>${esc(time)}</span>
        </div>
      </div>
    `;
    if (isMine) {
      const delBtn = row.querySelector('.msg-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteMessage(parseInt(msg.id), row);
        });
      }
    }
    $bubbles.insertBefore(row, $bubblesLoading);
  }

  function lastDateInBubbles() {
    const seps = $bubbles.querySelectorAll('.msg-date-sep');
    return seps.length > 0 ? seps[seps.length - 1].textContent : '';
  }

  // ── Send ─────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const body = ($input.value || '').trim();
    if (!body || !currentConvId) return;
    if ($sendBtn) $sendBtn.disabled = true;

    $input.value = '';
    autoResizeTextarea($input);

    try {
      const data = await apiFetch({}, { action: 'send', conv_id: currentConvId, body });
      if (data.success) {
        // Optimistic bubble already not added; poll will pick it up OR we add now
        const fakeMsg = {
          id: data.msg_id,
          sender_id: myId(),
          body,
          is_read: 0,
          created_at: data.sent_at || new Date().toISOString(),
          sender_name: window.OSAS_MSG_NAME || 'Me',
          sender_role: role(),
        };
        const d = formatDate(fakeMsg.created_at);
        if (d !== lastDateInBubbles()) appendDateSep(d);
        appendBubble(fakeMsg);
        lastMsgId = parseInt(data.msg_id);
        scrollToBottom();
        loadConversations();
      } else {
        showToastMsg(data.error || 'Failed to send.', false);
      }
    } catch (e) {
      showToastMsg('Network error, try again.', false);
    } finally {
      if ($sendBtn) $sendBtn.disabled = false;
      $input.focus();
    }
  }

  // ── Delete a message ─────────────────────────────────────────────────────
  async function deleteMessage(msgId, rowEl) {
    if (!await osasConfirm('Delete Message', 'Delete this message for everyone?', 'Delete', 'danger')) return;
    try {
      const data = await apiFetch({}, { action: 'delete_message', msg_id: msgId });
      if (data.success) {
        rowEl.remove();
        loadConversations(); // refresh preview
      } else {
        showToastMsg(data.error || 'Could not delete message.', false);
      }
    } catch (e) {
      showToastMsg('Network error.', false);
    }
  }

  // ── Delete a conversation (admin only) ───────────────────────────────────
  async function deleteConversation(convId) {
    if (!await osasConfirm('Delete Conversation', 'Delete this entire conversation and all messages? This cannot be undone.', 'Delete', 'danger')) return;
    try {
      const data = await apiFetch({}, { action: 'delete_conversation', conv_id: convId });
      if (data.success) {
        // If this was the open conversation, go back to empty state
        if (currentConvId === convId) {
          stopPoll();
          currentConvId = null;
          if ($chatInner) $chatInner.style.display = 'none';
          if ($chatEmpty) $chatEmpty.style.display  = 'flex';
        }
        loadConversations();
      } else {
        showToastMsg(data.error || 'Could not delete conversation.', false);
      }
    } catch (e) {
      showToastMsg('Network error.', false);
    }
  }

  // ── Admin: Start new conversation ────────────────────────────────────────
  async function startConversation(studentUserId, studentInfo) {
    try {
      const data = await apiFetch({}, { action: 'start', student_user_id: studentUserId });
      if (!data.success) { showToastMsg(data.error || 'Error starting conversation.', false); return; }

      // Hide search panel
      if ($searchWrap)  $searchWrap.style.display = 'none';
      if ($searchInput) $searchInput.value = '';
      if ($searchResults) $searchResults.innerHTML = '';
      if ($newBtn) { $newBtn.innerHTML = _newBtnDefaultLabel; $newBtn.classList.remove('msg-new-btn--cancel'); }

      // Reload conversations then open
      await loadConversations();

      // Find the conv in the list and open it
      const conv = allConversations.find(c => parseInt(c.id) === parseInt(data.conv_id));
      if (conv) {
        openConversation(conv);
      } else {
        // Build a minimal conv object
        openConversation({
          id: data.conv_id,
          student_user_id: studentUserId,
          student_name: studentInfo.full_name || 'Student',
          student_code: studentInfo.student_code || '',
          student_avatar: studentInfo.avatar || null,
          department: studentInfo.department || '',
          year_level: studentInfo.year_level || '',
          last_message: null,
          last_at: null,
          unread: 0,
        });
      }
    } catch (e) {
      showToastMsg('Network error.', false);
    }
  }

  // ── Student search ────────────────────────────────────────────────────────
  async function searchStudents(q) {
    if (!$searchResults) return;
    if (!q) { $searchResults.innerHTML = ''; return; }

    $searchResults.innerHTML = '<div class="msg-search-empty">Searching…</div>';

    try {
      const data = await apiFetch({ action: 'search_students', q });
      if (!data.success) { $searchResults.innerHTML = '<div class="msg-search-empty">Error searching.</div>'; return; }

      const students = data.students || [];
      if (students.length === 0) {
        $searchResults.innerHTML = '<div class="msg-search-empty">No students found.</div>';
        return;
      }

      $searchResults.innerHTML = '';
      students.forEach(s => {
        const item = document.createElement('div');
        item.className = 'msg-search-item';
        const avatar = s.avatar ? resolveAsset(s.avatar) : defaultAvatar();
        item.innerHTML = `
          <img class="msg-search-item-avatar" src="${esc(avatar)}" alt="${esc(s.full_name)}"
               onerror="this.src='${defaultAvatar()}'">
          <div class="msg-search-item-info">
            <strong>${esc(s.full_name)}</strong>
            <small>${esc(s.student_code || '')} ${s.department ? '· ' + esc(s.department) : ''}</small>
          </div>
        `;
        item.addEventListener('click', () => startConversation(parseInt(s.user_id), s));
        $searchResults.appendChild(item);
      });
    } catch (e) {
      $searchResults.innerHTML = '<div class="msg-search-empty">Network error.</div>';
    }
  }

  // ── Student: load admin/staff list to start a conversation ───────────────
  async function loadAdminList() {
    if (!$searchResults) return;
    $searchResults.innerHTML = '<div class="msg-search-empty">Loading staff…</div>';

    try {
      const data = await apiFetch({ action: 'get_admins' });
      if (!data.success || !data.admins || data.admins.length === 0) {
        $searchResults.innerHTML = '<div class="msg-search-empty">No staff available.</div>';
        return;
      }

      $searchResults.innerHTML = '';
      data.admins.forEach(a => {
        const item = document.createElement('div');
        item.className = 'msg-search-item';
        const avatar = a.avatar ? resolveAsset(a.avatar) : defaultAvatar();
        item.innerHTML = `
          <img class="msg-search-item-avatar" src="${esc(avatar)}" alt="${esc(a.full_name)}"
               onerror="this.src='${defaultAvatar()}'">
          <div class="msg-search-item-info">
            <strong>${esc(a.full_name)}</strong>
            <small>${esc(a.role)}</small>
          </div>
        `;
        item.addEventListener('click', () => startConversationWithAdmin(parseInt(a.user_id), a));
        $searchResults.appendChild(item);
      });
    } catch (e) {
      $searchResults.innerHTML = '<div class="msg-search-empty">Network error.</div>';
    }
  }

  // ── Student: start or resume a conversation with an admin ────────────────
  async function startConversationWithAdmin(adminUserId, adminInfo) {
    try {
      const data = await apiFetch({}, { action: 'start', admin_user_id: adminUserId });
      if (!data.success) { showToastMsg(data.error || 'Error starting conversation.', false); return; }

      if ($searchWrap)  $searchWrap.style.display = 'none';
      if ($searchResults) $searchResults.innerHTML = '';
      if ($searchInput) $searchInput.value = '';
      if ($newBtn) { $newBtn.innerHTML = _newBtnDefaultLabel; $newBtn.classList.remove('msg-new-btn--cancel'); }

      await loadConversations();

      const conv = allConversations.find(c => parseInt(c.id) === parseInt(data.conv_id));
      if (conv) {
        openConversation(conv);
      } else {
        openConversation({
          id: data.conv_id,
          admin_user_id: adminUserId,
          admin_name: adminInfo.full_name || 'OSAS Staff',
          admin_avatar: adminInfo.avatar || null,
          last_message: null,
          last_at: null,
          unread: 0,
        });
      }
    } catch (e) {
      showToastMsg('Network error.', false);
    }
  }

  // ── Sidebar badge (unread count) ─────────────────────────────────────────
  function startBadgePoller() {
    stopBadgePoller();
    updateSidebarBadge();
    badgeTimer = setInterval(updateSidebarBadge, BADGE_INTERVAL);
  }

  function stopBadgePoller() {
    if (badgeTimer) { clearInterval(badgeTimer); badgeTimer = null; }
  }

  async function updateSidebarBadge() {
    try {
      const data = await apiFetch({ action: 'unread_count' });
      if (!data.success) return;
      const count = parseInt(data.unread) || 0;

      // In-page total badge
      if ($totalBadge) {
        $totalBadge.textContent = count > 9 ? '9+' : count;
        $totalBadge.style.display = count > 0 ? 'inline-flex' : 'none';
      }

      // Sidebar nav badge
      updateNavBadge(count);
    } catch (e) { /* silent */ }
  }

  function updateNavBadge(count) {
    // Find the nav link for messages in the sidebar
    const link = document.querySelector('#sidebar [data-page="admin_page/Messages"], #sidebar [data-page="user-page/messages"]');
    if (!link) return;

    let badge = link.querySelector('.msg-nav-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'msg-nav-badge';
        link.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : count;
    } else {
      if (badge) badge.remove();
    }
  }

  // ── Mobile helpers ────────────────────────────────────────────────────────
  function showChat() {
    if ($sidebar) $sidebar.classList.add('slide-out');
    if ($chat)    $chat.classList.add('slide-in');
  }

  function showSidebar() {
    if ($sidebar) $sidebar.classList.remove('slide-out');
    if ($chat)    $chat.classList.remove('slide-in');
    stopPoll();
    currentConvId = null;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function scrollToBottom() {
    if ($bubbles) $bubbles.scrollTop = $bubbles.scrollHeight;
  }

  function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escHtml(str) {
    return esc(str).replace(/\n/g, '<br>');
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  function defaultAvatar() {
    const p = location.pathname.split('/').filter(Boolean);
    const d = ['app', 'api', 'includes', 'assets', 'public'];
    const root = (p.length === 0 || d.includes(p[0])) ? '' : '/' + p[0];
    return root + '/app/assets/img/default.png';
  }

  function resolveAsset(path) {
    if (!path) return defaultAvatar();
    if (path.startsWith('http') || path.startsWith('/')) return path;
    const p = location.pathname.split('/').filter(Boolean);
    const d = ['app', 'api', 'includes', 'assets', 'public'];
    const root = (p.length === 0 || d.includes(p[0])) ? '' : '/' + p[0];
    return root + '/app/assets/' + path;
  }

  function formatTime(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) {
      return d.toLocaleDateString([], { weekday: 'short' }) + ' ' +
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function formatTimeShort(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dt) {
    if (!dt) return '';
    const d   = new Date(dt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = today - msgDay;
    if (diff === 0) return 'Today';
    if (diff === 86400000) return 'Yesterday';
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function showToastMsg(msg, ok = true) {
    const t = document.createElement('div');
    t.style.cssText = [
      'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:9999', 'padding:10px 18px', 'border-radius:10px',
      'color:#fff', 'font-size:13px', 'font-family:sans-serif',
      'box-shadow:0 4px 14px rgba(0,0,0,.2)',
      'background:' + (ok ? '#16a34a' : '#dc2626'),
    ].join(';');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  // On load: always start badge poller globally (sidebar badge),
  // then try to init the full view if already in DOM.
  // -- Custom confirm dialog -------------------------------------------------
  function osasConfirm(title, message, confirmLabel, type) {
    confirmLabel = confirmLabel || 'Confirm';
    type = type || 'danger';
    return new Promise(function(resolve) {
      var existing = document.getElementById('osas-confirm-modal');
      if (existing) existing.remove();
      var modal = document.createElement('div');
      modal.id = 'osas-confirm-modal';
      modal.className = 'osas-confirm-overlay';
      var icon = type === 'danger'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="24" height="24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="24" height="24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      modal.innerHTML = '<div class="osas-confirm-box">'
        + '<div class="osas-confirm-icon osas-confirm-icon--' + type + '">' + icon + '</div>'
        + '<div class="osas-confirm-body">'
        + '<div class="osas-confirm-title">' + title + '</div>'
        + '<div class="osas-confirm-msg">' + message + '</div>'
        + '</div>'
        + '<div class="osas-confirm-actions">'
        + '<button class="osas-confirm-cancel">Cancel</button>'
        + '<button class="osas-confirm-ok osas-confirm-ok--' + type + '">' + confirmLabel + '</button>'
        + '</div></div>';
      document.body.appendChild(modal);
      requestAnimationFrame(function() { modal.classList.add('osas-confirm-visible'); });
      function cleanup(result) {
        modal.classList.remove('osas-confirm-visible');
        setTimeout(function() { if (modal.parentNode) modal.remove(); }, 200);
        resolve(result);
      }
      modal.querySelector('.osas-confirm-cancel').addEventListener('click', function() { cleanup(false); });
      modal.querySelector('.osas-confirm-ok').addEventListener('click', function() { cleanup(true); });
      modal.addEventListener('click', function(e) { if (e.target === modal) cleanup(false); });
    });
  }
  // Expose globally so chatbot.js (loaded separately) can also use it
  window.osasConfirm = osasConfirm;
  function bootstrap() {
    window.initMessagesBadge();   // sidebar badge — works even without the view
    window.initMessagesModule();  // full view init — exits early if view not in DOM

    // Hook into the SPA's loadContent to stop polling when leaving Messages.
    // dashboard.js / user_dashboard.js may not be loaded yet — defer slightly.
    setTimeout(function hookLoadContent() {
      if (typeof window.loadContent === 'function') {
        const _orig = window.loadContent;
        window.loadContent = function (page) {
          if (page !== 'admin_page/Messages' && page !== 'user-page/messages') {
            stopPoll();
          }
          return _orig.apply(this, arguments);
        };
      } else {
        // Dashboard JS not ready yet — retry once
        setTimeout(hookLoadContent, 500);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
