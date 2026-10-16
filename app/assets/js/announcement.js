/**
 * Announcement Management Module — admin CRUD with server-side pagination.
 */
(function (window) {
    'use strict';

    function getAnnouncementAPIPath() {
        const p = window.location.pathname.split('/').filter(Boolean);
        const d = ['app', 'api', 'includes', 'assets', 'public'];
        return ((p.length === 0 || d.includes(p[0])) ? '' : '/' + p[0]) + '/api/announcements.php';
    }

    const ANNOUNCEMENT_API = getAnnouncementAPIPath();
    let currentFilter = 'all';
    let currentCategoryFilter = 'all';
    let announcements = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalRecords = 0;
    let totalPages = 1;
    let searchDebounce = null;

    function isAnnouncementsPage() {
        return !!document.getElementById('announcementsTableBody');
    }

    function initAnnouncementModule() {
        if (!isAnnouncementsPage()) return;
        console.log('📢 [Announcements] Initializing Module');
        ensurePaginationContainer();
        initViewToggles();
        loadAnnouncements();
    }

    function buildListUrl() {
        const searchEl = document.getElementById('announcementSearch');
        const search = searchEl ? searchEl.value.trim() : '';
        let url = `${ANNOUNCEMENT_API}?action=get&filter=${encodeURIComponent(currentFilter)}&category=${encodeURIComponent(currentCategoryFilter)}&page=${currentPage}&limit=${itemsPerPage}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
    }

    async function loadAnnouncements() {
        if (!isAnnouncementsPage()) return;

        const tbody = document.getElementById('announcementsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <div class="loading-spinner"></div>
                        <p>Loading announcements...</p>
                    </td>
                </tr>
            `;
        }

        try {
            const response = await fetch(buildListUrl(), {
                credentials: 'same-origin',
                cache: 'no-store',
                headers: { Accept: 'application/json' }
            });

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error('Server returned non-JSON response. ' + text.substring(0, 120));
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to load announcements');
            }

            const payload = data.data;
            if (Array.isArray(payload)) {
                const all = payload;
                totalRecords = all.length;
                totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
                if (currentPage > totalPages) currentPage = totalPages;
                const start = (currentPage - 1) * itemsPerPage;
                announcements = all.slice(start, start + itemsPerPage);
            } else {
                announcements = payload.announcements || [];
                totalRecords = typeof payload.total === 'number' ? payload.total : announcements.length;
                totalPages = typeof payload.pages === 'number' ? payload.pages : Math.max(1, Math.ceil(totalRecords / itemsPerPage));
                currentPage = typeof payload.page === 'number' ? payload.page : currentPage;
            }

            const totalCountEl = document.getElementById('totalCount');
            if (totalCountEl) totalCountEl.textContent = totalRecords;

            renderAnnouncements();
        } catch (error) {
            console.error('❌ [Announcements] Error loading:', error);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            <div class="empty-state" style="color: #ef4444; text-align: center; padding: 40px;">
                                <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                                <p>Error loading announcements: ${escapeHtml(error.message)}</p>
                                <button type="button" onclick="loadAnnouncements()" class="btn-submit" style="margin-top: 15px;">Retry</button>
                            </div>
                        </td>
                    </tr>
                `;
            }
            renderAnnouncementsPagination();
        }
    }

    function renderAnnouncements() {
        const tbody = document.getElementById('announcementsTableBody');
        const gridBody = document.getElementById('announcementsGridBody');
        const listBody = document.getElementById('announcementsListBody');
        
        if (!tbody) return;

        if (!announcements.length) {
            const emptyTr = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                            <p>No announcements found</p>
                        </div>
                    </td>
                </tr>
            `;
            const emptyDiv = `
                <div style="text-align: center; padding: 40px; width: 100%; grid-column: 1 / -1;">
                    <div class="empty-state">
                        <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                        <p>No announcements found</p>
                    </div>
                </div>
            `;
            if (tbody) tbody.innerHTML = emptyTr;
            if (gridBody) gridBody.innerHTML = emptyDiv;
            if (listBody) listBody.innerHTML = emptyDiv;
            renderAnnouncementsPagination();
            return;
        }

        let tableHtml = '';
        let gridHtml = '';
        let listHtml = '';

        announcements.forEach((announcement) => {
            const typeClass = announcement.type || 'info';
            const statusClass = announcement.status === 'active' ? 'active' : 'archived';
            const statusText = announcement.status === 'active' ? 'Active' : 'Archived';
            const createdDate = formatDate(announcement.created_at);
            const msg = announcement.message || '';
        const canManage = window.ANNOUNCEMENT_CAN_MANAGE === true;
            const actionBtns = announcement.status === 'archived'
                ? (canManage
                    ? `<button type="button" class="action-btn restore" onclick="restoreAnnouncement(${announcement.id})" title="Restore"><i class='bx bx-undo'></i></button>`
                    : `<button type="button" class="action-btn restore" disabled title="Only Admin and OSAS Staff can restore" style="opacity:.4;cursor:not-allowed;"><i class='bx bx-undo'></i></button>`)
                : (canManage
                    ? `<button type="button" class="action-btn edit" onclick="editAnnouncement(${announcement.id})" title="Edit"><i class='bx bx-edit'></i></button>
                   <button type="button" class="action-btn archive" onclick="archiveAnnouncement(${announcement.id})" title="Archive"><i class='bx bx-archive'></i></button>`
                    : `<button type="button" class="action-btn edit" disabled title="Only Admin and OSAS Staff can edit" style="opacity:.4;cursor:not-allowed;"><i class='bx bx-edit'></i></button>
                   <button type="button" class="action-btn archive" disabled title="Only Admin and OSAS Staff can archive" style="opacity:.4;cursor:not-allowed;"><i class='bx bx-archive'></i></button>`);

            tableHtml += `
                <tr>
                    <td data-label="Title">
                        <div class="title-cell">
                            <strong>${escapeHtml(announcement.title || 'Untitled')}</strong>
                            <small>${escapeHtml(msg.substring(0, 80))}${msg.length > 80 ? '...' : ''}</small>
                        </div>
                    </td>
                    <td data-label="Category">
                        <span class="announcement-type ${typeClass}">${escapeHtml(typeClass)}</span>
                    </td>
                    <td data-label="Status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td data-label="Date" style="white-space: nowrap;">${createdDate}</td>
                    <td data-label="Actions">
                        <div class="action-buttons">${actionBtns}</div>
                    </td>
                </tr>
            `;

            gridHtml += `
                <div class="grid-card">
                    <div class="grid-card-header">
                        <h4 class="grid-card-title">${escapeHtml(announcement.title || 'Untitled')}</h4>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <p class="grid-card-desc">${escapeHtml(msg.substring(0, 100))}${msg.length > 100 ? '...' : ''}</p>
                    <div class="grid-card-footer">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="announcement-type ${typeClass}">${escapeHtml(typeClass)}</span>
                            <small style="color: #64748b; font-size: 10px;">${createdDate}</small>
                        </div>
                        <div class="action-buttons">${actionBtns}</div>
                    </div>
                </div>
            `;

            listHtml += `
                <div class="list-item">
                    <div class="list-item-main">
                        <h4 class="list-item-title">${escapeHtml(announcement.title || 'Untitled')}</h4>
                        <p class="list-item-desc">${escapeHtml(msg.substring(0, 120))}${msg.length > 120 ? '...' : ''}</p>
                    </div>
                    <div class="list-item-meta">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                            <span class="announcement-type ${typeClass}">${escapeHtml(typeClass)}</span>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <small style="color: #64748b; font-size: 10px;">${createdDate}</small>
                        </div>
                        <div class="action-buttons" style="margin-left: 8px;">${actionBtns}</div>
                    </div>
                </div>
            `;
        });

        if (tbody) tbody.innerHTML = tableHtml;
        if (gridBody) gridBody.innerHTML = gridHtml;
        if (listBody) listBody.innerHTML = listHtml;

        renderAnnouncementsPagination();
    }

    function renderAnnouncementsPagination() {
        const info = document.getElementById('announcementsPageInfo');
        const btns = document.getElementById('announcementsPagination');
        const container = document.querySelector('.table-footer');
        
        if (!info || !btns) return;

        const start = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalRecords);

        // Update info text
        info.textContent = `Showing ${start}–${end} of ${totalRecords} announcements`;

        // Generate buttons
        let html = '';
        html += `<button type="button" class="announcement-page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="changeAnnouncementsPage(${currentPage - 1})"><i class='bx bx-chevron-left'></i></button>`;

        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        startPage = Math.max(1, endPage - maxButtons + 1);

        if (startPage > 1) {
            html += `<button type="button" class="announcement-page-btn" onclick="changeAnnouncementsPage(1)">1</button>`;
            if (startPage > 2) html += `<span class="announcements-page-ellipsis">…</span>`;
        }

        for (let p = startPage; p <= endPage; p++) {
            html += `<button type="button" class="announcement-page-btn${p === currentPage ? ' active' : ''}" onclick="changeAnnouncementsPage(${p})">${p}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="announcements-page-ellipsis">…</span>`;
            html += `<button type="button" class="announcement-page-btn" onclick="changeAnnouncementsPage(${totalPages})">${totalPages}</button>`;
        }

        html += `<button type="button" class="announcement-page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="changeAnnouncementsPage(${currentPage + 1})"><i class='bx bx-chevron-right'></i></button>`;

        btns.innerHTML = html;
        if (container) container.style.display = totalRecords > 0 ? 'flex' : 'none';
    }

    function changeAnnouncementsPage(page) {
        page = parseInt(page, 10);
        if (page < 1 || page > totalPages || page === currentPage) return;
        currentPage = page;
        loadAnnouncements();
        // Smooth scroll to top of table
        const card = document.querySelector('.content-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function ensurePaginationContainer() {
        // No longer needed as we use the containers from PHP
        return;
    }

    function openAddAnnouncementModal() {
        if (!window.ANNOUNCEMENT_CAN_MANAGE) {
            notify('Only Admin and OSAS Staff can add announcements.', 'error');
            return;
        }
        const modal = document.getElementById('announcementModal');
        if (!modal) return;

        const titleEl = document.getElementById('modalTitle');
        const subtitleEl = document.getElementById('modalSubtitle');
        if (titleEl) titleEl.textContent = 'Add New Announcement';
        if (subtitleEl) subtitleEl.textContent = 'Fill in the details below to publish a new announcement.';

        const form = document.getElementById('announcementForm');
        if (form) form.reset();
        const idEl = document.getElementById('announcementId');
        if (idEl) idEl.value = '';

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeAnnouncementModal() {
        const modal = document.getElementById('announcementModal');
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    async function fetchAnnouncementById(id) {
        const found = announcements.find((a) => a.id == id);
        if (found) return found;

        const res = await fetch(`${ANNOUNCEMENT_API}?action=get&id=${id}`, {
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const data = await res.json();
        if (data.status === 'success' && data.data) return data.data;
        return null;
    }

    async function editAnnouncement(id) {
        if (!window.ANNOUNCEMENT_CAN_MANAGE) {
            notify('Only Admin and OSAS Staff can edit announcements.', 'error');
            return;
        }
        const announcement = await fetchAnnouncementById(id);
        if (!announcement) {
            notify('Announcement not found', 'error');
            return;
        }

        const modal = document.getElementById('announcementModal');
        if (!modal) return;

        document.getElementById('modalTitle').textContent = 'Edit Announcement';
        document.getElementById('modalSubtitle').textContent = 'Modify the information below to update the announcement.';
        document.getElementById('announcementId').value = id;
        document.getElementById('announcementTitle').value = announcement.title || '';
        document.getElementById('announcementMessage').value = announcement.message || '';
        document.getElementById('announcementType').value = announcement.type || 'info';

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    let isSavingAnnouncement = false;

    async function saveAnnouncement() {
        if (isSavingAnnouncement) return; // guard against double-clicks / Enter spam

        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value.trim();
        const message = document.getElementById('announcementMessage').value.trim();
        const type = document.getElementById('announcementType').value;

        if (!title || !message) {
            notify('Title and message are required', 'error');
            return;
        }

        const form = document.getElementById('announcementForm');
        const submitBtn = form ? form.querySelector('.btn-submit') : null;
        const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
        const cancelBtn = form ? form.querySelector('.btn-cancel') : null;
        const originalBtnText = btnText ? btnText.textContent : '';

        const setLoading = (loading) => {
            isSavingAnnouncement = loading;
            if (submitBtn) {
                submitBtn.disabled = loading;
                submitBtn.classList.toggle('is-loading', loading);
            }
            if (cancelBtn) cancelBtn.disabled = loading;
            if (btnText) {
                btnText.innerHTML = loading
                    ? `<i class='bx bx-loader-alt bx-spin'></i> ${id ? 'Updating...' : 'Saving...'}`
                    : originalBtnText;
            }
        };

        setLoading(true);

        try {
            const url = id ? `${ANNOUNCEMENT_API}?action=update` : `${ANNOUNCEMENT_API}?action=create`;
            const formData = new FormData();
            formData.append('title', title);
            formData.append('message', message);
            formData.append('type', type);
            if (id) formData.append('id', id);

            const response = await fetch(url, { method: 'POST', body: formData, credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                notify(id ? 'Updated successfully!' : 'Created successfully!', 'success');
                closeAnnouncementModal();
                if (!id) currentPage = 1;
                loadAnnouncements();
            } else {
                throw new Error(data.message || 'Failed to save');
            }
        } catch (error) {
            notify('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function archiveAnnouncement(id) {
        const confirmed = await showAnnouncementConfirmModal({
            title: 'Archive Announcement?',
            message: 'This will hide the announcement from the public. You can restore it anytime from the archived list.',
            icon: 'bx-archive',
            iconBg: '#fee2e2',
            iconColor: '#ef4444',
            confirmText: 'Archive',
            confirmBg: '#ef4444',
            confirmShadow: 'rgba(239,68,68,0.3)'
        });
        if (!confirmed) return;
        try {
            const response = await fetch(`${ANNOUNCEMENT_API}?action=archive&id=${id}`, { method: 'POST', credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                notify('Archived successfully!', 'success');
                loadAnnouncements();
            } else throw new Error(data.message);
        } catch (error) {
            notify('Error: ' + error.message, 'error');
        }
    }

    /**
     * Reusable custom confirmation modal for the announcements module.
     * Returns a Promise<boolean> — resolves true on confirm, false on cancel.
     */
    function showAnnouncementConfirmModal({ title, message, icon, iconBg, iconColor, confirmText, confirmBg, confirmShadow }) {
        return new Promise((resolve) => {
            // Remove any stale instance
            const existing = document.getElementById('announcementConfirmModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'announcementConfirmModal';
            modal.style.cssText = `
                display:flex; position:fixed; inset:0; z-index:999999;
                align-items:center; justify-content:center;
                background:rgba(0,0,0,0.45);
                font-family:var(--poppins,'Poppins',sans-serif);
                animation:fadeInBg 0.18s ease;
            `;
            modal.innerHTML = `
                <div style="
                    background:#fff; border-radius:20px; padding:36px 32px 28px;
                    max-width:420px; width:90%; box-shadow:0 24px 64px rgba(0,0,0,0.18);
                    text-align:center; font-family:var(--poppins,'Poppins',sans-serif);
                    animation:slideUpIn 0.22s cubic-bezier(.34,1.56,.64,1);
                ">
                    <div style="
                        width:64px; height:64px; border-radius:50%;
                        background:${iconBg}; display:flex; align-items:center;
                        justify-content:center; margin:0 auto 20px;
                        box-shadow:0 4px 16px ${confirmShadow};
                    ">
                        <i class='bx ${icon}' style="font-size:30px; color:${iconColor};"></i>
                    </div>
                    <h3 style="
                        margin:0 0 10px; font-size:19px; font-weight:700;
                        color:#111827; letter-spacing:-0.2px;
                        font-family:var(--poppins,'Poppins',sans-serif);
                    ">${title}</h3>
                    <p style="
                        margin:0 0 28px; color:#6b7280; font-size:13.5px;
                        line-height:1.65; font-family:var(--poppins,'Poppins',sans-serif);
                    ">${message}</p>
                    <div style="display:flex; gap:10px;">
                        <button id="announcementConfirmCancel" style="
                            flex:1; padding:11px; border:1.5px solid #e5e7eb;
                            border-radius:10px; background:#fff; cursor:pointer;
                            font-size:13.5px; font-weight:600; color:#6b7280;
                            font-family:var(--poppins,'Poppins',sans-serif);
                            transition:all 0.18s;
                        ">Cancel</button>
                        <button id="announcementConfirmOk" style="
                            flex:1; padding:11px; border:none; border-radius:10px;
                            background:${confirmBg}; color:#fff; cursor:pointer;
                            font-size:13.5px; font-weight:600;
                            font-family:var(--poppins,'Poppins',sans-serif);
                            box-shadow:0 4px 12px ${confirmShadow};
                            transition:all 0.18s;
                        ">${confirmText}</button>
                    </div>
                </div>
                <style>
                    @keyframes fadeInBg   { from { opacity:0 } to { opacity:1 } }
                    @keyframes slideUpIn  { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:none } }
                </style>
            `;

            document.body.appendChild(modal);

            const cleanup = (result) => {
                modal.style.animation = 'fadeInBg 0.15s ease reverse forwards';
                setTimeout(() => modal.remove(), 150);
                resolve(result);
            };

            modal.querySelector('#announcementConfirmOk').addEventListener('click', () => cleanup(true));
            modal.querySelector('#announcementConfirmCancel').addEventListener('click', () => cleanup(false));
            // Click backdrop to cancel
            modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(false); });
        });
    }

    async function restoreAnnouncement(id) {
        try {
            const response = await fetch(`${ANNOUNCEMENT_API}?action=restore&id=${id}`, { method: 'POST', credentials: 'same-origin' });
            const data = await response.json();
            if (data.status === 'success') {
                notify('Restored successfully!', 'success');
                loadAnnouncements();
            } else throw new Error(data.message);
        } catch (error) {
            notify('Error: ' + error.message, 'error');
        }
    }

    function setFilter(filter) {
        currentFilter = filter;
        currentPage = 1;
        const dropdown = document.getElementById('announcementStatusFilter');
        if (dropdown) dropdown.value = filter;
        loadAnnouncements();
    }

    function setCategoryFilter(category) {
        currentCategoryFilter = category;
        currentPage = 1;
        const dropdown = document.getElementById('announcementCategoryFilter');
        if (dropdown) dropdown.value = category;
        loadAnnouncements();
    }

    function filterAnnouncements() {
        currentPage = 1;
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => loadAnnouncements(), 350);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function notify(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    let currentViewMode = 'list';

    function setViewMode(mode) {
        currentViewMode = mode;
        const tableView = document.getElementById('announcementsTableView');
        const gridView = document.getElementById('announcementsGridView');
        const listView = document.getElementById('announcementsListView');
        
        if (tableView) tableView.style.display = mode === 'table' ? 'block' : 'none';
        if (gridView) gridView.style.display = mode === 'grid' ? 'block' : 'none';
        if (listView) listView.style.display = mode === 'list' ? 'block' : 'none';

        document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
    }

    function initViewToggles() {
        document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', function() {
                setViewMode(this.dataset.view);
            });
        });
        // Default based on active button in HTML
        const activeBtn = document.querySelector('.view-btn.active[data-view]');
        if (activeBtn) setViewMode(activeBtn.dataset.view);
    }

    async function exportAnnouncements() {
        if (!window.ANNOUNCEMENT_CAN_MANAGE) {
            notify('Only Admin and OSAS Staff can export announcements.', 'error');
            return;
        }
        try {
            notify('Preparing export...', 'info');
            const searchEl = document.getElementById('announcementSearch');
            const search = searchEl ? searchEl.value.trim() : '';
            
            let url = `${ANNOUNCEMENT_API}?action=get&filter=${encodeURIComponent(currentFilter)}&category=${encodeURIComponent(currentCategoryFilter)}&page=1&limit=10000`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            
            const response = await fetch(url, { credentials: 'same-origin' });
            const data = await response.json();
            
            if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch data for export');
            
            let records = [];
            if (Array.isArray(data.data)) {
                records = data.data;
            } else if (data.data && Array.isArray(data.data.announcements)) {
                records = data.data.announcements;
            }

            if (records.length === 0) {
                notify('No records found to export.', 'warning');
                return;
            }

            const headers = ['Title', 'Message', 'Category', 'Audience', 'Status', 'Date Published'];
            const csvRows = [headers.join(',')];

            records.forEach(item => {
                const row = [
                    `"${(item.title || '').replace(/"/g, '""')}"`,
                    `"${(item.message || '').replace(/"/g, '""')}"`,
                    `"${(item.category || '').replace(/"/g, '""')}"`,
                    `"${(item.audience || '').replace(/"/g, '""')}"`,
                    `"${(item.status || '').replace(/"/g, '""')}"`,
                    `"${item.published_at ? formatDate(item.published_at) : 'N/A'}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const dlUrl = URL.createObjectURL(blob);
            link.setAttribute("href", dlUrl);
            link.setAttribute("download", `Announcements_Export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            notify('Export completed successfully!', 'success');
        } catch (error) {
            console.error(error);
            notify('Export failed: ' + error.message, 'error');
        }
    }

    window.initAnnouncementModule = initAnnouncementModule;
    window.openAddAnnouncementModal = openAddAnnouncementModal;
    window.closeAnnouncementModal = closeAnnouncementModal;
    window.saveAnnouncement = saveAnnouncement;
    window.editAnnouncement = editAnnouncement;
    window.archiveAnnouncement = archiveAnnouncement;
    window.restoreAnnouncement = restoreAnnouncement;
    window.exportAnnouncements = exportAnnouncements;
    window.setFilter = setFilter;
    window.setCategoryFilter = setCategoryFilter;
    window.filterAnnouncements = filterAnnouncements;
    window.loadAnnouncements = loadAnnouncements;
    window.changeAnnouncementsPage = changeAnnouncementsPage;

})(window);
