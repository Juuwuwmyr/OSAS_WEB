/**
 * Admin Notifications System
 * Handles disciplinary actions, slip requests, and recent violations
 * recorded by other admins/staff in the top navigation bar.
 */

// localStorage key to track which "recent violation" IDs this admin has already seen
const ADMIN_SEEN_KEY = 'osas_admin_seen_violations';

function getSeenViolationIds() {
    try { return new Set(JSON.parse(localStorage.getItem(ADMIN_SEEN_KEY) || '[]')); }
    catch (e) { return new Set(); }
}

function markViolationsSeen(ids) {
    const seen = getSeenViolationIds();
    ids.forEach(id => seen.add(String(id)));
    // Keep only the last 200 IDs so localStorage doesn't grow forever
    const trimmed = [...seen].slice(-200);
    localStorage.setItem(ADMIN_SEEN_KEY, JSON.stringify(trimmed));
}

document.addEventListener('DOMContentLoaded', function() {
    const role = (document.cookie.split(';').find(c => c.trim().startsWith('role=')) || '').split('=')[1]?.trim();
    if (!['admin', 'OSAS Staff', 'CSC Officer', 'Officer', 'Faculty Member'].includes(role)) {
        // Non-privileged users: hide badge, show info toast on click
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) notifBadge.style.display = 'none';
        const notifBtn = document.getElementById('notifBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof showNotification === 'function') {
                    showNotification('Only administrators can receive system notifications.', 'info', 'Notifications Restricted');
                }
            });
        }
        return;
    }
    initAdminNotifications();
});

function initAdminNotifications() {
    const notifBtn   = document.getElementById('notifBtn');
    const notifBadge = document.getElementById('notifBadge');
    const notifModal = document.getElementById('notifModal');
    const closeBtn   = document.querySelector('.notif-close-btn');

    if (!notifBtn || !notifBadge || !notifModal) return;

    // Initial fetch
    updateNotificationCount();

    // Poll every 15 seconds for fresh data
    setInterval(updateNotificationCount, 15000);

    // When the page becomes visible again, refresh immediately
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') updateNotificationCount();
    });

    // Toggle modal
    notifBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notifModal.classList.toggle('show');
        if (notifModal.classList.contains('show')) {
            fetchNotifications();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => notifModal.classList.remove('show'));
    }

    document.addEventListener('click', function(e) {
        if (!notifModal.contains(e.target) && !notifBtn.contains(e.target)) {
            notifModal.classList.remove('show');
        }
    });

    // Hook into realtimeAlerts.js: when it detects a new violation, immediately
    // refresh the admin bell too without waiting for the 15s interval
    window.addEventListener('osas:newViolation', updateNotificationCount);
}

// ─── Badge count ──────────────────────────────────────────────────────────────

async function updateNotificationCount() {
    try {
        const [disciplinaryRes, slipRes, recentRes] = await Promise.all([
            fetchJSON('../api/violations.php?filter=disciplinary'),
            fetchJSON('../api/violations.php?action=get_pending_slip_requests'),
            fetchJSON('../api/violations.php?action=get_recent_violations')
        ]);

        const seen = getSeenViolationIds();
        let count  = 0;

        if (disciplinaryRes.status === 'success') {
            count += disciplinaryRes.count || 0;
        }
        if (slipRes.status === 'success' && Array.isArray(slipRes.data)) {
            count += slipRes.data.filter(r => r.status === 'pending').length;
        }
        if (recentRes.status === 'success' && Array.isArray(recentRes.data)) {
            const unseen = recentRes.data.filter(v => !seen.has(String(v.id)));
            count += unseen.length;

            // If there are genuinely new violations (not seen before), fire an event
            // so the dashboard can react and show a toast
            const prevMaxId = parseInt(localStorage.getItem('osas_admin_last_violation_id') || '0', 10);
            const newOnes   = unseen.filter(v => parseInt(v.id, 10) > prevMaxId);
            if (newOnes.length > 0) {
                const newest = newOnes[0]; // already sorted DESC
                localStorage.setItem('osas_admin_last_violation_id', String(newest.id));

                if (prevMaxId > 0) {
                    // Only show toast after first run (so page load doesn't spam)
                    const studentName = [newest.first_name, newest.last_name].filter(Boolean).join(' ') || 'a student';
                    const msg = `${newest.reported_by} recorded a "${newest.violation_type_name || 'violation'}" for ${studentName}`;
                    if (typeof showNotification === 'function') {
                        showNotification(msg, 'info', 'New Violation Recorded');
                    }
                }
            }
        }

        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.style.display = count > 0 ? 'block' : 'none';
        }

    } catch (e) {
        console.warn('[AdminNotif] updateNotificationCount error:', e);
    }
}

// Updates the badge from already-fetched response objects — no new fetch, no recursion
function _updateBadgeOnly(disciplinaryRes, slipRes, recentRes) {
    try {
        const seen = getSeenViolationIds();
        let count  = 0;
        if (disciplinaryRes?.status === 'success') count += disciplinaryRes.count || 0;
        if (slipRes?.status === 'success' && Array.isArray(slipRes.data))
            count += slipRes.data.filter(r => r.status === 'pending').length;
        if (recentRes?.status === 'success' && Array.isArray(recentRes.data))
            count += recentRes.data.filter(v => !seen.has(String(v.id))).length;
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    } catch (e) { /* silent */ }
}

// ─── Dropdown content ─────────────────────────────────────────────────────────

async function fetchNotifications() {
    const notifList = document.getElementById('notifList');
    if (!notifList) return;

    notifList.innerHTML = '<div class="notif-loading">Loading notifications...</div>';

    try {
        const [disciplinaryRes, slipRes, recentRes] = await Promise.all([
            fetchJSON('../api/violations.php?filter=disciplinary'),
            fetchJSON('../api/violations.php?action=get_pending_slip_requests'),
            fetchJSON('../api/violations.php?action=get_recent_violations')
        ]);

        const notifications = [];
        const seen = getSeenViolationIds();

        // ── Pending slip requests ──────────────────────────────────────────────
        if (slipRes.status === 'success' && Array.isArray(slipRes.data)) {
            slipRes.data.filter(r => r.status === 'pending').forEach(req => {
                const name = [req.first_name, req.last_name].filter(Boolean).join(' ') || 'Unknown Student';
                notifications.push({
                    type: 'slip_request',
                    name,
                    desc: 'Requested an entrance slip',
                    date: req.request_date || req.created_at || '',
                    studentId: req.student_id_code || req.student_id || '',
                    avatar: req.avatar || '',
                    id: req.id,
                    isNew: false
                });
            });
        }

        // ── Disciplinary actions ───────────────────────────────────────────────
        if (disciplinaryRes.status === 'success' && Array.isArray(disciplinaryRes.data)) {
            disciplinaryRes.data.forEach(violation => {
                const studentName = (violation.studentName
                    || [violation.first_name, violation.middle_name, violation.last_name].filter(Boolean).join(' ')
                    || 'Unknown Student').trim();
                notifications.push({
                    type: 'disciplinary',
                    name: studentName,
                    desc: 'Has pending disciplinary action',
                    date: violation.dateReported || violation.violation_date || '',
                    studentId: violation.studentId || violation.student_id || '',
                    avatar: violation.studentImage || violation.avatar || '',
                    id: violation.id,
                    isNew: false
                });
            });
        }

        // ── Recent violations by other admins (last 24h) ───────────────────────
        const recentIds = [];
        if (recentRes.status === 'success' && Array.isArray(recentRes.data)) {
            recentRes.data.forEach(v => {
                recentIds.push(v.id);
                const studentName = [v.first_name, v.last_name].filter(Boolean).join(' ') || 'Unknown Student';
                const typeName    = v.violation_type_name || 'Violation';
                const levelName   = v.violation_level_name ? ` — ${v.violation_level_name}` : '';
                notifications.push({
                    type: 'recent_violation',
                    name: studentName,
                    desc: `${v.reported_by} recorded: ${typeName}${levelName}`,
                    date: v.created_at || '',
                    studentId: v.student_id || '',
                    avatar: v.avatar || '',
                    id: v.id,
                    caseId: v.case_id || '',
                    isNew: !seen.has(String(v.id))
                });
            });
        }

        // Mark all currently visible recent violations as "seen" now that the dropdown is open
        if (recentIds.length) markViolationsSeen(recentIds);

        if (notifications.length === 0) {
            notifList.innerHTML = '<div class="notif-empty">No notifications at this time.</div>';
        } else {
            renderNotifications(notifications);
        }

        // Refresh the badge count silently (no recursive fetchNotifications call)
        _updateBadgeOnly(disciplinaryRes, slipRes, recentRes);

    } catch (error) {
        console.error('[AdminNotif] fetchNotifications error:', error);
        notifList.innerHTML = '<div class="notif-empty">Failed to load notifications.</div>';
    }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderNotifications(notifications) {
    const notifList = document.getElementById('notifList');
    if (!notifList) return;

    notifList.innerHTML = '';

    notifications.forEach(notif => {
        const initials   = getNotifInitials(notif.name);
        const avatarHtml = notif.avatar && notif.avatar.trim()
            ? `<img src="${resolveNotifAvatar(notif.avatar)}" alt="${notif.name}" class="notif-avatar"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <span class="notif-avatar-initials" style="display:none">${initials}</span>`
            : `<span class="notif-avatar-initials">${initials}</span>`;

        let actionBtn = '';
        let badgeHtml = '';

        if (notif.type === 'slip_request') {
            actionBtn = `<button class="notif-manage-btn slip" onclick="manageSlipRequest('${notif.id}')">Review</button>`;
            badgeHtml = '<span class="notif-badge-tag slip"><i class="bx bx-file"></i> Slip</span>';
        } else if (notif.type === 'disciplinary') {
            actionBtn = `<button class="notif-manage-btn" onclick="manageViolation('${notif.studentId}')">Manage</button>`;
            badgeHtml = '<span class="notif-badge-tag disciplinary"><i class="bx bx-shield-x"></i> Disciplinary</span>';
        } else if (notif.type === 'recent_violation') {
            actionBtn = `<button class="notif-manage-btn" onclick="manageViolation('${notif.studentId}')">View</button>`;
            badgeHtml = `<span class="notif-badge-tag recent-violation"><i class="bx bx-error-circle"></i> New Violation</span>`;
        }

        const newDot = notif.isNew
            ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-left:4px;flex-shrink:0;"></span>'
            : '';

        const item = document.createElement('div');
        item.className = `notif-item notif-${notif.type}${notif.isNew ? ' notif-unread' : ''}`;
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="notif-avatar-wrap">${avatarHtml}</div>
            <div class="notif-info">
                <span class="notif-name">${notif.name}${newDot}</span>
                <span class="notif-desc">${notif.desc} ${badgeHtml}</span>
                <span class="notif-time">${formatNotifDate(notif.date)}</span>
            </div>
            ${actionBtn}
        `;

        item.addEventListener('click', function(e) {
            if (e.target.closest('.notif-manage-btn')) return;
            if (notif.type === 'slip_request') {
                manageSlipRequest(notif.id);
            } else {
                manageViolation(notif.studentId);
            }
        });

        notifList.appendChild(item);
    });

    // "View All Violations" link at the bottom
    const viewAll = document.createElement('a');
    viewAll.className = 'notif-view-all';
    viewAll.href = '#';
    viewAll.textContent = 'View All Violations →';
    viewAll.onclick = function(e) {
        e.preventDefault();
        if (typeof loadContent === 'function') loadContent('admin_page/Violations');
        document.getElementById('notifModal')?.classList.remove('show');
    };
    notifList.appendChild(viewAll);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJSON(url) {
    try {
        const res = await fetch(url, { credentials: 'same-origin' });
        return await res.json();
    } catch (e) {
        return { status: 'error' };
    }
}

function getNotifInitials(name) {
    const parts = (name || 'S').trim().split(/\s+/);
    return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0][0] || 'S').toUpperCase();
}

function resolveNotifAvatar(path) {
    if (!path || path.trim() === '') return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    if (path.startsWith('/') || path.startsWith('../')) return path;
    return `../app/assets/img/students/${path}`;
}

function formatNotifDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function manageViolation(studentId) {
    if (typeof loadContent === 'function') {
        loadContent('admin_page/Violations');
        setTimeout(() => {
            const searchInput = document.getElementById('searchViolation');
            if (searchInput) {
                searchInput.value = studentId;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 500);
    } else {
        window.location.href = 'dashboard.php?page=Violations&search=' + studentId;
    }
    document.getElementById('notifModal')?.classList.remove('show');
}

function manageSlipRequest(requestId) {
    if (typeof loadContent === 'function') {
        loadContent('admin_page/Violations');
        setTimeout(() => {
            const slipTab = document.querySelector('[data-view="requests"]');
            if (slipTab) slipTab.click();
        }, 600);
    } else {
        window.location.href = 'dashboard.php?page=Violations&view=requests';
    }
    document.getElementById('notifModal')?.classList.remove('show');
}

// Expose for external refresh calls (e.g. from realtimeAlerts.js)
window.refreshNotificationBadge   = updateNotificationCount;
window.refreshNotificationDropdown = fetchNotifications;
