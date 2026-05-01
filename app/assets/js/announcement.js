/**
 * Announcement Management Module
 * Handles CRUD operations for announcements
 */

// Define functions in global scope early to ensure availability
(function(window) {
    // API Base Path Detection
    function getAnnouncementAPIPath() {
        const p = window.location.pathname.split('/').filter(Boolean);
        const d = ['app','api','includes','assets','public'];
        return ((p.length===0||d.includes(p[0]))?'':'/'+p[0])+'/api/announcements.php';
    }

    const ANNOUNCEMENT_API = getAnnouncementAPIPath();
    let currentFilter = 'all';
    let announcements = [];

    // Pagination state
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalRecords = 0;
    let totalPages = 1;

    // Initialize Announcement Module
    function initAnnouncementModule() {
        console.log('📢 [Announcements] Initializing Module');
        ensurePaginationContainer();
        loadAnnouncements();
    }

    // Load announcements from API
    async function loadAnnouncements() {
        try {
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

            const url = `${ANNOUNCEMENT_API}?filter=${currentFilter}`;
            console.log('📢 [Announcements] Fetching from URL:', url);
            
            const response = await fetch(url);
            console.log('📢 [Announcements] Response status:', response.status, response.statusText);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response received:', text.substring(0, 200));
                throw new Error('Server returned non-JSON response. Check API configuration.');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📢 [Announcements] API Response:', data);
            
            if (data.status === 'success') {
                announcements = data.data || [];
                renderAnnouncements();
            } else {
                throw new Error(data.message || 'Failed to load announcements');
            }
        } catch (error) {
            console.error('❌ [Announcements] Error loading:', error);
            const tbody = document.getElementById('announcementsTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            <div class="empty-state" style="color: #ef4444; text-align: center; padding: 40px;">
                                <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                                <p>Error loading announcements: ${error.message}</p>
                                <p style="font-size: 12px; margin-top: 10px; color: var(--dark-grey);">
                                    Check API connectivity and database tables.
                                </p>
                                <button onclick="loadAnnouncements()" class="btn-submit" style="margin-top: 15px;">Retry Connection</button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Render announcements table
    function renderAnnouncements() {
        const tbody = document.getElementById('announcementsTableBody');
        if (!tbody) return;

        const searchTermEl = document.getElementById('announcementSearch');
        const searchTerm = searchTermEl ? searchTermEl.value.toLowerCase().trim() : '';

        let filtered = announcements;
        if (searchTerm) {
            filtered = announcements.filter(a => {
                const title = (a.title || '').toLowerCase();
                const msg = (a.message || '').toLowerCase();
                return title.includes(searchTerm) || msg.includes(searchTerm);
            });
        }

        // Filter by status if filter is not 'all'
        if (currentFilter === 'active') {
            filtered = filtered.filter(a => a.status === 'active');
        } else if (currentFilter === 'archived') {
            filtered = filtered.filter(a => a.status === 'archived');
        }

        // Pagination
        totalRecords = filtered.length;
        totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(start, start + itemsPerPage);

        if (pageItems.length === 0) {
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
        pageItems.forEach(announcement => {
            const row = document.createElement('tr');
            const typeClass = announcement.type || 'info';
            const statusClass = announcement.status === 'active' ? 'active' : 'archived';
            const statusText = announcement.status === 'active' ? 'Active' : 'Archived';
            const createdDate = formatDate(announcement.created_at);

            row.innerHTML = `
                <td data-label="Title">
                    <strong>${escapeHtml(announcement.title || 'Untitled')}</strong>
                    <br>
                    <small style="color: var(--dark-grey); font-size: 13px;">${escapeHtml((announcement.message || '').substring(0, 60))}${(announcement.message || '').length > 60 ? '...' : ''}</small>
                </td>
                <td data-label="Type">
                    <span class="announcement-type ${typeClass}">${typeClass}</span>
                </td>
                <td data-label="Status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td data-label="Date Created">${createdDate}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        ${announcement.status === 'archived' 
                            ? `<button class="action-btn restore" onclick="restoreAnnouncement(${announcement.id})" title="Restore">
                                 <i class='bx bx-undo'></i>
                               </button>`
                            : `<button class="action-btn edit" onclick="editAnnouncement(${announcement.id})" title="Edit">
                                 <i class='bx bx-edit'></i>
                               </button>
                               <button class="action-btn archive" onclick="archiveAnnouncement(${announcement.id})" title="Archive">
                                 <i class='bx bx-archive'></i>
                               </button>`
                        }
                        <button class="action-btn delete" onclick="deleteAnnouncement(${announcement.id})" title="Delete">
                          <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        renderAnnouncementsPagination();
    }

    // Modal Functions
    function openAddAnnouncementModal() {
        console.log('🔔 [Announcements] Triggering open modal');
        const modal = document.getElementById('announcementModal');
        if (!modal) {
            console.error('❌ [Announcements] Modal element NOT found!');
            return;
        }
        
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
        console.log('✅ [Announcements] Modal class "show" added');
    }

    function closeAnnouncementModal() {
        const modal = document.getElementById('announcementModal');
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    function editAnnouncement(id) {
        console.log('📝 [Announcements] Editing announcement ID:', id);
        
        // Use == for comparison to handle string vs number IDs
        const announcement = announcements.find(a => a.id == id);
        
        if (!announcement) {
            console.error('❌ [Announcements] Announcement not found for ID:', id);
            console.log('Available announcements:', announcements);
            showNotification('Error: Announcement not found', 'error');
            return;
        }

        const modal = document.getElementById('announcementModal');
        if (!modal) {
            console.error('❌ [Announcements] Modal element NOT found!');
            return;
        }
        
        const titleEl = document.getElementById('modalTitle');
        const subtitleEl = document.getElementById('modalSubtitle');
        if (titleEl) titleEl.textContent = 'Edit Announcement';
        if (subtitleEl) subtitleEl.textContent = 'Modify the information below to update the announcement.';
        
        // Safely set form values
        const idInput = document.getElementById('announcementId');
        const titleInput = document.getElementById('announcementTitle');
        const messageInput = document.getElementById('announcementMessage');
        const typeInput = document.getElementById('announcementType');
        
        if (idInput) idInput.value = id;
        if (titleInput) titleInput.value = announcement.title || '';
        if (messageInput) messageInput.value = announcement.message || '';
        if (typeInput) typeInput.value = announcement.type || 'info';
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('✅ [Announcements] Edit modal opened for:', announcement.title);
    }

    async function saveAnnouncement() {
        const id = document.getElementById('announcementId').value;
        const title = document.getElementById('announcementTitle').value.trim();
        const message = document.getElementById('announcementMessage').value.trim();
        const type = document.getElementById('announcementType').value;

        if (!title || !message) {
            showNotification('Title and message are required', 'error');
            return;
        }

        try {
            const url = id ? `${ANNOUNCEMENT_API}?action=update` : `${ANNOUNCEMENT_API}?action=create`;
            const formData = new FormData();
            formData.append('title', title);
            formData.append('message', message);
            formData.append('type', type);
            if (id) formData.append('id', id);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.status === 'success') {
                showNotification(id ? 'Updated successfully!' : 'Created successfully!', 'success');
                closeAnnouncementModal();
                loadAnnouncements();
            } else {
                throw new Error(data.message || 'Failed to save');
            }
        } catch (error) {
            console.error('❌ [Announcements] Save error:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    }

    async function archiveAnnouncement(id) {
        if (!confirm('Archive this announcement?')) return;
        try {
            const response = await fetch(`${ANNOUNCEMENT_API}?action=archive&id=${id}`, { method: 'POST' });
            const data = await response.json();
            if (data.status === 'success') {
                showNotification('Archived successfully!', 'success');
                loadAnnouncements();
            } else throw new Error(data.message);
        } catch (error) { showNotification('Error: ' + error.message, 'error'); }
    }

    async function restoreAnnouncement(id) {
        try {
            const response = await fetch(`${ANNOUNCEMENT_API}?action=restore&id=${id}`, { method: 'POST' });
            const data = await response.json();
            if (data.status === 'success') {
                showNotification('Restored successfully!', 'success');
                loadAnnouncements();
            } else throw new Error(data.message);
        } catch (error) { showNotification('Error: ' + error.message, 'error'); }
    }

    async function deleteAnnouncement(id) {
        if (!confirm('Delete permanently? This cannot be undone.')) return;
        try {
            const response = await fetch(`${ANNOUNCEMENT_API}?action=delete&id=${id}`, { method: 'POST' });
            const data = await response.json();
            if (data.status === 'success') {
                showNotification('Deleted successfully!', 'success');
                loadAnnouncements();
            } else throw new Error(data.message);
        } catch (error) { showNotification('Error: ' + error.message, 'error'); }
    }

    function setFilter(filter) {
        currentFilter = filter;
        currentPage = 1;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        loadAnnouncements();
    }

    function filterAnnouncements() {
        currentPage = 1;
        renderAnnouncements();
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return dateString; }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else alert(message);
    }

    function ensurePaginationContainer() {
        const wrapper = document.querySelector('.table-wrapper');
        if (!wrapper) return;
        let pagination = document.querySelector('.announcements-pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'announcements-pagination';
            wrapper.appendChild(pagination);
            pagination.addEventListener('click', handleAnnouncementsPaginationClick);
        }
    }

    function renderAnnouncementsPagination() {
        const container = document.querySelector('.announcements-pagination');
        if (!container) return;
        container.innerHTML = '';
        const makeBtn = (label, opts = {}) => {
            const btn = document.createElement('button');
            btn.className = 'announcement-page-btn' + (opts.active ? ' active' : '');
            btn.textContent = label;
            if (opts.disabled) btn.disabled = true;
            if (opts.page) btn.dataset.page = String(opts.page);
            if (opts.action) btn.dataset.action = opts.action;
            return btn;
        };
        container.appendChild(makeBtn('‹', { disabled: currentPage === 1, action: 'prev' }));
        for (let p = 1; p <= totalPages; p++) {
            container.appendChild(makeBtn(String(p), { active: p === currentPage, page: p }));
        }
        container.appendChild(makeBtn('›', { disabled: currentPage === totalPages, action: 'next' }));
    }

    function handleAnnouncementsPaginationClick(e) {
        const target = e.target.closest('button');
        if (!target) return;
        const action = target.dataset.action;
        const pageAttr = target.dataset.page;
        if (action === 'prev') { if (currentPage > 1) currentPage--; }
        else if (action === 'next') { if (currentPage < totalPages) currentPage++; }
        else if (pageAttr) currentPage = parseInt(pageAttr, 10);
        renderAnnouncements();
    }

    // Assign to window object to make them globally accessible
    window.initAnnouncementModule = initAnnouncementModule;
    window.openAddAnnouncementModal = openAddAnnouncementModal;
    window.closeAnnouncementModal = closeAnnouncementModal;
    window.saveAnnouncement = saveAnnouncement;
    window.editAnnouncement = editAnnouncement;
    window.archiveAnnouncement = archiveAnnouncement;
    window.restoreAnnouncement = restoreAnnouncement;
    window.deleteAnnouncement = deleteAnnouncement;
    window.setFilter = setFilter;
    window.filterAnnouncements = filterAnnouncements;
    window.loadAnnouncements = loadAnnouncements;

})(window);

// Auto-initialize when DOM is ready (safe guard)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementModule);
} else {
    setTimeout(initAnnouncementModule, 300);
}
