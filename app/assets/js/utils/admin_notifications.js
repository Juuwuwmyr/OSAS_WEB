/**
 * Admin Notifications System
 * Handles disciplinary actions, slip requests, and recent violations in the top navigation bar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Only admin gets full notification functionality
    const role = (document.cookie.split(';').find(c => c.trim().startsWith('role=')) || '').split('=')[1]?.trim();
    if (role !== 'admin') {
        // Keep bell visible but show a toast when clicked
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) notifBadge.style.display = 'none';

        const notifBtn = document.getElementById('notifBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showNotification(
                    'Only administrators can receive system notifications.',
                    'info',
                    'Notifications Restricted'
                );
            });
        }
        return;
    }
    initAdminNotifications();
});

function initAdminNotifications() {
    const notifBtn = document.getElementById('notifBtn');
    const notifBadge = document.getElementById('notifBadge');
    const notifModal = document.getElementById('notifModal');
    const notifList = document.getElementById('notifList');
    const closeBtn = document.querySelector('.notif-close-btn');

    if (!notifBtn || !notifBadge || !notifModal) return;

    // Expose for realtimeAlerts.js to call when new violation is detected
    window.updateNotificationCount = updateNotificationCount;

    // Initial count fetch
    updateNotificationCount();

    // Refresh count every 30 seconds
    setInterval(updateNotificationCount, 30000);

    // Toggle modal
    notifBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notifModal.classList.toggle('show');
        if (notifModal.classList.contains('show')) {
            fetchNotifications();
        }
    });

    // Close modal on close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            notifModal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (!notifModal.contains(e.target) && !notifBtn.contains(e.target)) {
            notifModal.classList.remove('show');
        }
    });
}

async function updateNotificationCount() {
    try {
        const [disciplinaryRes, slipRes, recentRes] = await Promise.all([
            fetch('../api/violations.php?filter=disciplinary').then(r => r.json()).catch(() => ({ status: 'error' })),
            fetch('../api/violations.php?action=get_pending_slip_requests').then(r => r.json()).catch(() => ({ status: 'error' })),
            fetch('../api/violations.php?action=get_recent&limit=10').then(r => r.json()).catch(() => ({ status: 'error' }))
        ]);

        let count = 0;
        if (disciplinaryRes.status === 'success') {
            count += disciplinaryRes.count || 0;
        }
        if (slipRes.status === 'success' && Array.isArray(slipRes.data)) {
            count += slipRes.data.filter(r => r.status === 'pending').length;
        }
        // Count recent violations not yet seen by admin
        if (recentRes.status === 'success' && Array.isArray(recentRes.data)) {
            const seen = JSON.parse(localStorage.getItem('admin_seen_recent_violations') || '[]');
            count += recentRes.data.filter(v => !seen.includes(String(v.id))).length;
        }

        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            notifBadge.textContent = count;
            notifBadge.style.display = count > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error fetching notification count:', error);
    }
}

async function fetchNotifications() {
    const notifList = document.getElementById('notifList');
    if (!notifList) return;

    notifList.innerHTML = '<div class="notif-loading">Loading notifications...</div>';

    try {
        const [disciplinaryRes, slipRes, recentRes] = await Promise.all([
            fetch('../api/violations.php?filter=disciplinary').then(r => r.json()).catch(() => ({ status: 'error' })),
            fetch('../api/violations.php?action=get_pending_slip_requests').then(r => r.json()).catch(() => ({ status: 'error' })),
            fetch('../api/violations.php?action=get_recent&limit=10').then(r => r.json()).catch(() => ({ status: 'error' }))
        ]);

        const notifications = [];

        // Add pending slip requests
        if (slipRes.status === 'success' && Array.isArray(slipRes.data)) {
            slipRes.data.filter(r => r.status === 'pending').forEach(req => {
                const name = [req.first_name, req.last_name].filter(Boolean).join(' ') || 'Unknown Student';
                notifications.push({
                    type: 'slip_request',
                    name: name,
                    desc: 'Requested an entrance slip',
                    date: req.request_date || req.created_at || '',
                    studentId: req.student_id_code || req.student_id || '',
                    avatar: req.avatar || '',
                    id: req.id
                });
            });
        }

        // Add disciplinary actions
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
                    id: violation.id
                });
            });
        }

        // Add recent violations recorded by other staff
        if (recentRes.status === 'success' && Array.isArray(recentRes.data)) {
            // Mark all as seen now
            const seenIds = recentRes.data.map(v => String(v.id));
            localStorage.setItem('admin_seen_recent_violations', JSON.stringify(seenIds));

            // Avoid duplicating violations already shown in disciplinary
            const disciplinaryIds = new Set(
                (disciplinaryRes.status === 'success' && Array.isArray(disciplinaryRes.data))
                    ? disciplinaryRes.data.map(v => String(v.id))
                    : []
            );

            recentRes.data.forEach(violation => {
                if (disciplinaryIds.has(String(violation.id))) return; // skip duplicates
                const studentName = (violation.studentName
                    || [violation.first_name, violation.middle_name, violation.last_name].filter(Boolean).join(' ')
                    || 'Unknown Student').trim();
                const recorder = violation.reported_by || violation.recorded_by || violation.created_by || '';
                notifications.push({
                    type: 'recent_violation',
                    name: studentName,
                    desc: 'New violation recorded' + (recorder ? ' by ' + recorder : ''),
                    violationType: violation.violation_type_name || violation.violation_type || '',
                    date: violation.dateReported || violation.violation_date || violation.created_at || '',
                    studentId: violation.studentId || violation.student_id || '',
                    avatar: violation.studentImage || violation.avatar || '',
                    id: violation.id
                });
            });
        }

        if (notifications.length === 0) {
            notifList.innerHTML = '<div class="notif-empty">No notifications at this time.</div>';
        } else {
            renderNotifications(notifications);
        }

        // Refresh badge count now that we've seen recent violations
        updateNotificationCount();

    } catch (error) {
        console.error('Error fetching notifications:', error);
        notifList.innerHTML = '<div class="notif-empty">Failed to load notifications.</div>';
    }
}

function getNotifInitials(name) {
    const parts = (name || 'S').trim().split(/\s+/);
    return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0][0] || 'S').toUpperCase();
}

function renderNotifications(notifications) {
    const notifList = document.getElementById('notifList');
    if (!notifList) return;

    notifList.innerHTML = '';

    notifications.forEach(notif => {
        const initials = getNotifInitials(notif.name);
        const avatarHtml = notif.avatar && notif.avatar.trim()
            ? `<img src="${resolveNotifAvatar(notif.avatar)}" alt="${notif.name}" class="notif-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="notif-avatar-initials" style="display:none">${initials}</span>`
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
            badgeHtml = '<span class="notif-badge-tag recent-violation"><i class="bx bx-error-circle"></i> New</span>';
        }

        const descText = notif.type === 'recent_violation' && notif.violationType
            ? `${notif.desc} — <em>${notif.violationType}</em> ${badgeHtml}`
            : `${notif.desc} ${badgeHtml}`;

        const item = document.createElement('div');
        item.className = `notif-item notif-${notif.type}`;
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="notif-avatar-wrap">${avatarHtml}</div>
            <div class="notif-info">
                <span class="notif-name">${notif.name}</span>
                <span class="notif-desc">${descText}</span>
                <span class="notif-time">${formatNotifDate(notif.date)}</span>
            </div>
            ${actionBtn}
        `;

        // Clicking anywhere on the card triggers the same action as the button
        item.addEventListener('click', function(e) {
            // Don't double-fire if the button itself was clicked
            if (e.target.closest('.notif-manage-btn')) return;
            if (notif.type === 'slip_request') {
                manageSlipRequest(notif.id);
            } else {
                manageViolation(notif.studentId);
            }
        });

        notifList.appendChild(item);
    });

    // Add "View All" link
    const viewAll = document.createElement('a');
    viewAll.className = 'notif-view-all';
    viewAll.href = '#';
    viewAll.textContent = 'View All Violations →';
    viewAll.onclick = function(e) {
        e.preventDefault();
        if (typeof loadContent === 'function') {
            loadContent('admin_page/Violations');
        }
        document.getElementById('notifModal').classList.remove('show');
    };
    notifList.appendChild(viewAll);
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
    document.getElementById('notifModal').classList.remove('show');
}

function manageSlipRequest(requestId) {
    if (typeof loadContent === 'function') {
        loadContent('admin_page/Violations');
        // Switch to Slip Requests tab after loading
        setTimeout(() => {
            const slipTab = document.querySelector('[data-view="requests"]');
            if (slipTab) slipTab.click();
        }, 600);
    } else {
        window.location.href = 'dashboard.php?page=Violations&view=requests';
    }
    document.getElementById('notifModal').classList.remove('show');
}
