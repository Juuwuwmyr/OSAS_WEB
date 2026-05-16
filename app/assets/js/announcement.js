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
        loadAnnouncements();
    }

    function buildListUrl() {
        const searchEl = document.getElementById('announcementSearch');
        const search = searchEl ? searchEl.value.trim() : '';
        let url = `${ANNOUNCEMENT_API}?action=get&filter=${encodeURIComponent(currentFilter)}&page=${currentPage}&limit=${itemsPerPage}`;
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
        if (!tbody) return;

        if (!announcements.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                            <p>No announcements found</p>
                        </div>
                    </td>
                </tr>
            `;
            renderAnnouncementsPagination();
            return;
        }

        tbody.innerHTML = '';
        announcements.forEach((announcement) => {
            const row = document.createElement('tr');
            const typeClass = announcement.type || 'info';
            const statusClass = announcement.status === 'active' ? 'active' : 'archived';
            const statusText = announcement.status === 'active' ? 'Active' : 'Archived';
            const createdDate = formatDate(announcement.created_at);
            const msg = announcement.message || '';

            row.innerHTML = `
                <td data-label="Title">
                    <strong>${escapeHtml(announcement.title || 'Untitled')}</strong>
                    <br>
                    <small style="color: var(--dark-grey); font-size: 11px;">${escapeHtml(msg.substring(0, 60))}${msg.length > 60 ? '...' : ''}</small>
                </td>
                <td data-label="Category">
                    <span class="announcement-type ${typeClass}">${escapeHtml(typeClass)}</span>
                </td>
                <td data-label="Status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td data-label="Date">${createdDate}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        ${announcement.status === 'archived'
                            ? `<button type="button" class="action-btn restore" onclick="restoreAnnouncement(${announcement.id})" title="Restore"><i class='bx bx-undo'></i></button>`
                            : `<button type="button" class="action-btn edit" onclick="editAnnouncement(${announcement.id})" title="Edit"><i class='bx bx-edit'></i></button>
                               <button type="button" class="action-btn archive" onclick="archiveAnnouncement(${announcement.id})" title="Archive"><i class='bx bx-archive'></i></button>`
                        }
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        renderAnnouncementsPagination();
    }

    function renderAnnouncementsPagination() {
        const container = document.querySelector('#announcements-page .announcements-pagination');
        if (!container) return;

        const start = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalRecords);

        let html = `<span class="announcements-page-info">Showing ${start}–${end} of ${totalRecords}</span>`;
        html += `<div class="announcements-page-btns">`;
        html += `<button type="button" class="announcement-page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="changeAnnouncementsPage(${currentPage - 1})"><i class='bx bx-chevron-left'></i></button>`;

        const maxButtons = 7;
        let startPage = Math.max(1, currentPage - 3);
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
        html += `</div>`;

        container.innerHTML = html;
        container.style.display = totalRecords > 0 ? 'flex' : 'none';
    }

    function changeAnnouncementsPage(page) {
        page = parseInt(page, 10);
        if (page < 1 || page > totalPages || page === currentPage) return;
        currentPage = page;
        loadAnnouncements();
        const table = document.getElementById('announcementsTable');
        if (table) table.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function ensurePaginationContainer() {
        const wrapper = document.querySelector('#announcements-page .table-wrapper');
        if (!wrapper) return;
        let pagination = wrapper.querySelector('.announcements-pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'announcements-pagination';
            wrapper.appendChild(pagination);
        }
    }

    function openAddAnnouncementModal() {
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

    async function saveAnnouncement() {
        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value.trim();
        const message = document.getElementById('announcementMessage').value.trim();
        const type = document.getElementById('announcementType').value;

        if (!title || !message) {
            notify('Title and message are required', 'error');
            return;
        }

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
        }
    }

    async function archiveAnnouncement(id) {
        if (!confirm('Archive this announcement?')) return;
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

    window.initAnnouncementModule = initAnnouncementModule;
    window.openAddAnnouncementModal = openAddAnnouncementModal;
    window.closeAnnouncementModal = closeAnnouncementModal;
    window.saveAnnouncement = saveAnnouncement;
    window.editAnnouncement = editAnnouncement;
    window.archiveAnnouncement = archiveAnnouncement;
    window.restoreAnnouncement = restoreAnnouncement;
    window.setFilter = setFilter;
    window.filterAnnouncements = filterAnnouncements;
    window.loadAnnouncements = loadAnnouncements;
    window.changeAnnouncementsPage = changeAnnouncementsPage;

})(window);
