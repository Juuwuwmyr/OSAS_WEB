/**
 * Announcement Management Module
 * Handles CRUD operations for announcements
 */

// API Base Path Detection
function getAnnouncementAPIPath() {
    const currentPath = window.location.pathname;
    const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
    const projectBase = pathMatch ? pathMatch[1] : '';
    
    if (projectBase) {
        return projectBase + '/api/announcements.php';
    }
    
    if (currentPath.includes('/app/views/')) {
        return '../../api/announcements.php';
    } else if (currentPath.includes('/includes/')) {
        return '../api/announcements.php';
    } else {
        return 'api/announcements.php';
    }
}

const ANNOUNCEMENT_API = getAnnouncementAPIPath();
let currentFilter = 'all';
let announcements = [];

// Initialize Announcement Module
function initAnnouncementModule() {
    console.log('📢 Initializing Announcement Module');
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
        console.log('📢 Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('📢 Response status:', response.status, response.statusText);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('📢 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response received:', text.substring(0, 200));
            throw new Error('Server returned HTML instead of JSON. The announcements table may not exist. Please run the SQL file: database/announcements_table.sql');
        }
        
        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
                console.error('Error response body:', errorText);
                // Try to parse as JSON
                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        console.error('Error data:', errorData);
                        if (errorData.message) {
                            throw new Error(`HTTP ${response.status}: ${errorData.message}`);
                        }
                    } catch (e) {
                        // Not JSON, use as-is
                    }
                }
            } catch (e) {
                console.error('Failed to read error response:', e);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📢 Announcements API Response:', data);
        
        if (data.status === 'success' || data.status === 'error') {
            announcements = data.data || [];
            console.log('📢 Parsed announcements:', announcements);
            console.log('📢 Announcements count:', announcements.length);
            renderAnnouncements();
        } else {
            // Handle array response
            announcements = Array.isArray(data) ? data : [];
            console.log('📢 Parsed announcements (array):', announcements);
            console.log('📢 Announcements count:', announcements.length);
            renderAnnouncements();
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        const tbody = document.getElementById('announcementsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>Error loading announcements: ${error.message}</p>
                        <p style="font-size: 12px; margin-top: 10px; color: var(--dark-grey);">
                            Make sure you have run the SQL file: <code>database/announcements_table.sql</code>
                        </p>
                        <button onclick="loadAnnouncements()" style="margin-top: 10px; padding: 8px 16px; background: var(--gold); border: none; border-radius: 6px; cursor: pointer;">Retry</button>
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

    if (announcements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                    <p>No announcements found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    announcements.forEach(announcement => {
        const row = document.createElement('tr');
        const typeClass = announcement.type || 'info';
        const statusClass = announcement.status === 'active' ? 'completed' : 'pending';
        const statusText = announcement.status === 'active' ? 'Active' : 'Archived';
        const createdDate = formatDate(announcement.created_at);

        row.innerHTML = `
            <td>
                <strong>${escapeHtml(announcement.title || 'Untitled')}</strong>
                <br>
                <small style="color: var(--dark-grey);">${escapeHtml((announcement.message || '').substring(0, 60))}${(announcement.message || '').length > 60 ? '...' : ''}</small>
            </td>
            <td>
                <span class="announcement-type ${typeClass}">${typeClass}</span>
            </td>
            <td>
                <span class="status ${statusClass}">${statusText}</span>
            </td>
            <td>${createdDate}</td>
            <td>
                <div class="action-buttons">
                    ${announcement.status === 'archived' 
                        ? `<button class="action-btn restore" onclick="restoreAnnouncement(${announcement.id})" title="Restore">
                             <i class='bx bx-undo'></i> Restore
                           </button>`
                        : `<button class="action-btn edit" onclick="editAnnouncement(${announcement.id})" title="Edit">
                             <i class='bx bx-edit'></i> Edit
                           </button>
                           <button class="action-btn archive" onclick="archiveAnnouncement(${announcement.id})" title="Archive">
                             <i class='bx bx-archive'></i> Archive
                           </button>`
                    }
                    <button class="action-btn delete" onclick="deleteAnnouncement(${announcement.id})" title="Delete">
                      <i class='bx bx-trash'></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter announcements
function setFilter(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    loadAnnouncements();
}

// Search announcements
function filterAnnouncements() {
    const searchTerm = document.getElementById('announcementSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#announcementsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Open add announcement modal
function openAddAnnouncementModal() {
    document.getElementById('modalTitle').innerHTML = '<i class=\'bx bxs-megaphone\'></i> Add New Announcement';
    document.getElementById('announcementForm').reset();
    document.getElementById('announcementId').value = '';
    document.getElementById('announcementModal').style.display = 'flex';
}

// Close announcement modal
function closeAnnouncementModal() {
    document.getElementById('announcementModal').style.display = 'none';
    document.getElementById('announcementForm').reset();
    document.getElementById('announcementId').value = '';
}

// Edit announcement
function editAnnouncement(id) {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;

    document.getElementById('modalTitle').innerHTML = '<i class=\'bx bxs-megaphone\'></i> Edit Announcement';
    document.getElementById('announcementId').value = id;
    document.getElementById('announcementTitle').value = announcement.title || '';
    document.getElementById('announcementMessage').value = announcement.message || '';
    document.getElementById('announcementType').value = announcement.type || 'info';
    document.getElementById('announcementModal').style.display = 'flex';
}

// Save announcement (create or update)
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
        if (id) {
            formData.append('id', id);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            showNotification(id ? 'Announcement updated successfully!' : 'Announcement created successfully!', 'success');
            closeAnnouncementModal();
            loadAnnouncements();
        } else {
            throw new Error(data.message || 'Failed to save announcement');
        }
    } catch (error) {
        console.error('Error saving announcement:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Archive announcement
async function archiveAnnouncement(id) {
    if (!confirm('Are you sure you want to archive this announcement?')) {
        return;
    }

    try {
        const response = await fetch(`${ANNOUNCEMENT_API}?action=archive&id=${id}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.status === 'success') {
            showNotification('Announcement archived successfully!', 'success');
            loadAnnouncements();
        } else {
            throw new Error(data.message || 'Failed to archive announcement');
        }
    } catch (error) {
        console.error('Error archiving announcement:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Restore announcement
async function restoreAnnouncement(id) {
    try {
        const response = await fetch(`${ANNOUNCEMENT_API}?action=restore&id=${id}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.status === 'success') {
            showNotification('Announcement restored successfully!', 'success');
            loadAnnouncements();
        } else {
            throw new Error(data.message || 'Failed to restore announcement');
        }
    } catch (error) {
        console.error('Error restoring announcement:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Delete announcement
async function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${ANNOUNCEMENT_API}?action=delete&id=${id}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.status === 'success') {
            showNotification('Announcement deleted successfully!', 'success');
            loadAnnouncements();
        } else {
            throw new Error(data.message || 'Failed to delete announcement');
        }
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification (use existing notification system)
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Export for global use
window.initAnnouncementModule = initAnnouncementModule;
window.openAddAnnouncementModal = openAddAnnouncementModal;
window.closeAnnouncementModal = closeAnnouncementModal;
window.setFilter = setFilter;
window.filterAnnouncements = filterAnnouncements;

