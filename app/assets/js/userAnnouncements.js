/**
 * User Announcements Page
 * Connects to database to show announcements
 */

// API Base Path
function getUserAPIBasePath() { const p=window.location.pathname.split('/').filter(Boolean); const d=['app','api','includes','assets','public']; return ((p.length===0||d.includes(p[0]))?'':'/'+p[0])+'/api/'; }

const USER_API_BASE = getUserAPIBasePath();
console.log('🔗 User Announcements API Base Path:', USER_API_BASE);

let announcements = [];
let readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');

// Initialize function
function initializeUserAnnouncements() {
    console.log('🔄 Initializing announcements module...');
    
    // Make sure we're on the announcements page
    const tableContainer = document.getElementById('announcementsTableContainer');

    if (!tableContainer) {
        console.warn('⚠️ Announcements table container not found, not on announcements page');
        return;
    }
    
    // Restore collapsed state if applicable (for dashboard widget)
    restoreAnnouncementState();
    
    // Check if announcements are already rendered from PHP
    const existingRows = document.querySelectorAll('tbody#announcementsTableBody tr');
    if (existingRows.length > 0 && !existingRows[0].classList.contains('empty-row')) {
        console.log('✅ Announcements already rendered from PHP, parsing existing data...');
        // Parse existing announcements from DOM
        parseExistingAnnouncements();
        // Setup filter listeners but don't reload
        setupFilterListeners();
        return;
    }
    
    // If no existing announcements, load from API
    loadAnnouncements();
    
    // Setup filter listeners
    setupFilterListeners();
}

// Initialize immediately if DOM is ready, or wait for it
function initializeAnnouncementsModule() {
    // Check if we're on the announcements page
    const announcementsPage = document.getElementById('announcementsListContainer') || 
                             document.querySelector('.announcements-list') ||
                             document.getElementById('categoryFilter') ||
                             document.getElementById('announcementsContent');
    
    if (announcementsPage) {
        // Page elements exist, initialize immediately
        console.log('✅ Announcements page detected, initializing...');
        initializeUserAnnouncements();
    } else if (document.readyState === 'loading') {
        // Wait for DOM
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOM loaded, initializing announcements...');
            initializeUserAnnouncements();
        });
    } else {
        // DOM ready but page not loaded yet, try again later
        console.log('⚠️ Announcements page not found, retrying...');
        setTimeout(initializeAnnouncementsModule, 500);
    }
}

window.initAnnouncementsModule = initializeUserAnnouncements;
window.initializeUserAnnouncements = initializeUserAnnouncements;

// Initialize when script loads
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🔄 Script loaded, checking for announcements page...');
    initializeAnnouncementsModule();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 DOMContentLoaded, checking for announcements page...');
        initializeAnnouncementsModule();
    });
}

async function loadAnnouncements() {
    try {
        const tableBody = document.getElementById('announcementsTableBody');

        if (!tableBody) {
            console.warn('⚠️ Announcements table body not found, retrying in 500ms...');
            setTimeout(loadAnnouncements, 500);
            return;
        }

        console.log('🔄 Loading announcements from:', USER_API_BASE + 'announcements.php?action=active');
        // Only show loading if empty
        if (!tableBody.innerHTML.trim() || tableBody.innerHTML.includes('No announcements')) {
             tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p>Loading announcements...</p></td></tr>';
        }

        const response = await fetch(USER_API_BASE + 'announcements.php?action=active');
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('Announcements API response (first 500 chars):', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.error('Response was:', responseText);
            throw new Error('Invalid JSON response from announcements API');
        }
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Failed to load announcements');
        }

        // Handle both data and announcements keys
        announcements = data.data || data.announcements || [];
        console.log(`✅ Loaded ${announcements.length} announcements`);
        console.log('Announcements data:', announcements);
        
        // Make sure we have an array
        if (!Array.isArray(announcements)) {
            console.warn('⚠️ Announcements is not an array:', announcements);
            announcements = [];
        }
        
        renderAnnouncements();
    } catch (error) {
        console.error('❌ Error loading announcements:', error);
        console.error('Error details:', error.message, error.stack);
        const tableBody = document.getElementById('announcementsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>Error loading announcements: ${error.message}</p>
                        <button onclick="loadAnnouncements()" style="margin-top: 10px; padding: 8px 16px; background: var(--gold); border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                    </td>
                </tr>
            `;
        }
    }
}

function renderAnnouncements() {
    const tableBody = document.getElementById('announcementsTableBody');
    const loadMoreContainer = document.getElementById('loadMoreContainer');

    if (!tableBody) {
        console.warn('⚠️ Announcements table body not found');
        return;
    }

    if (!Array.isArray(announcements) || announcements.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    <div class="empty-state">
                        <i class='bx bx-info-circle'></i>
                        <p>No announcements available</p>
                    </div>
                </td>
            </tr>
        `;
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }

    // Toggle Load More button based on count (10 or more)
    if (loadMoreContainer) {
        loadMoreContainer.style.display = announcements.length >= 10 ? 'flex' : 'none';
    }

    console.log('Rendering', announcements.length, 'announcements into table');
    
    try {
        tableBody.innerHTML = announcements.map(announcement => {
            const type = announcement.type || announcement.category || 'info';
            const typeClass = type === 'urgent' ? 'urgent' : type === 'warning' ? 'warning' : 'info';
            const announcementId = announcement.id || 0;
            const isRead = readAnnouncements.includes(announcementId);
            const readClass = isRead ? 'read' : 'unread';
            
            const timeAgo = formatTimeAgo(announcement.created_at || announcement.createdAt || '');
            const category = type.charAt(0).toUpperCase() + type.slice(1);
            const title = escapeHtml(announcement.title || 'Untitled');

            return `
                <tr data-id="${announcementId}" class="${readClass}">
                    <td>
                        <div class="announcement-title-cell">
                            <span class="title-text">${title}</span>
                        </div>
                    </td>
                    <td>
                        <span class="announcement-type ${typeClass}">
                            ${category}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${readClass}">
                            ${isRead ? 'Read' : 'Unread'}
                        </span>
                    </td>
                    <td>
                        <span class="date-text">${timeAgo}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="viewAnnouncement(${announcementId})" title="View">
                                <i class='bx bx-show'></i>
                            </button>
                            ${!isRead ? `
                                <button class="action-btn mark-read" onclick="markAsRead(${announcementId}, this)" title="Mark as Read">
                                    <i class='bx bx-check'></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('✅ Announcements rendered successfully in table');
    } catch (error) {
        console.error('❌ Error rendering announcements:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>Error rendering announcements: ${error.message}</p>
                </td>
            </tr>
        `;
    }
}

// Parse existing announcements from DOM (rendered by PHP)
function parseExistingAnnouncements() {
    const rows = document.querySelectorAll('tbody#announcementsTableBody tr');
    announcements = [];
    
    rows.forEach(row => {
        if (row.classList.contains('empty-row')) return;
        
        const announcementId = parseInt(row.getAttribute('data-id') || '0');
        const title = row.querySelector('.title-text')?.textContent || '';
        const categoryBadge = row.querySelector('.announcement-type');
        const category = categoryBadge ? categoryBadge.textContent.trim().toLowerCase() : 'info';
        const isRead = row.classList.contains('read');
        
        announcements.push({
            id: announcementId,
            title: title,
            category: category,
            type: category,
            is_read: isRead,
            created_at: new Date().toISOString() // Approximate
        });
        
        if (isRead && !readAnnouncements.includes(announcementId)) {
            readAnnouncements.push(announcementId);
        }
    });
    
    localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    console.log(`✅ Parsed ${announcements.length} announcements from table rows`);
}

// Setup filter listeners
function setupFilterListeners() {
    setTimeout(() => {
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterAnnouncements);
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', filterAnnouncements);
        }
        if (searchInput) {
            searchInput.addEventListener('keyup', searchAnnouncements);
        }
    }, 100);
}

function filterAnnouncements() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const rows = document.querySelectorAll('tbody#announcementsTableBody tr');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    let visibleCount = 0;
    rows.forEach(row => {
        if (row.classList.contains('empty-row')) return;
        
        const categoryBadge = row.querySelector('.announcement-type');
        const category = categoryBadge ? categoryBadge.textContent.trim().toLowerCase() : '';
        const isRead = row.classList.contains('read');
        
        let showRow = true;
        
        if (categoryFilter !== 'all' && category !== categoryFilter) {
            showRow = false;
        }
        
        if (statusFilter === 'read' && !isRead) {
            showRow = false;
        } else if (statusFilter === 'unread' && isRead) {
            showRow = false;
        }
        
        if (showRow) {
            row.style.display = 'table-row';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Toggle Load More button based on visible count (10 or more)
    if (loadMoreContainer) {
        loadMoreContainer.style.display = visibleCount >= 10 ? 'flex' : 'none';
    }
}

function searchAnnouncements() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('tbody#announcementsTableBody tr');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    let visibleCount = 0;
    rows.forEach(row => {
        if (row.classList.contains('empty-row')) return;
        
        const title = row.querySelector('.title-text')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm)) {
            row.style.display = 'table-row';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Toggle Load More button based on visible count (10 or more)
    if (loadMoreContainer) {
        loadMoreContainer.style.display = visibleCount >= 10 ? 'flex' : 'none';
    }
}

function markAsRead(announcementId, button) {
    if (!readAnnouncements.includes(announcementId)) {
        readAnnouncements.push(announcementId);
        localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    }
    
    const row = button.closest('tr');
    if (row) {
        row.classList.remove('unread');
        row.classList.add('read');
        
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.classList.remove('unread');
            statusBadge.classList.add('read');
            statusBadge.textContent = 'Read';
        }
    }
    
    button.remove();
    
    updateUnreadCount();
    showNotification('Announcement marked as read', 'success');
}

function viewAnnouncement(announcementId) {
    const announcement = announcements.find(a => a.id === announcementId);
    if (!announcement) return;
    
    // Create and show modal with details
    showModernAlert({
        title: announcement.title,
        message: announcement.content || announcement.message || 'No content available.',
        icon: 'info',
        confirmText: 'Close',
        showCancel: false
    });
    
    // Mark as read if not already
    if (!readAnnouncements.includes(announcementId)) {
        const row = document.querySelector(`tr[data-id="${announcementId}"]`);
        const markReadBtn = row?.querySelector('.action-btn.mark-read');
        if (markReadBtn) markAsRead(announcementId, markReadBtn);
    }
}

function markAllAsRead() {
    announcements.forEach(announcement => {
        if (!readAnnouncements.includes(announcement.id)) {
            readAnnouncements.push(announcement.id);
        }
    });
    
    localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    
    const rows = document.querySelectorAll('tbody#announcementsTableBody tr.unread');
    rows.forEach(row => {
        row.classList.remove('unread');
        row.classList.add('read');
        
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.classList.remove('unread');
            statusBadge.classList.add('read');
            statusBadge.textContent = 'Read';
        }
        
        const markReadBtn = row.querySelector('.action-btn.mark-read');
        if (markReadBtn) markReadBtn.remove();
    });
    
    updateUnreadCount();
    showNotification('All announcements marked as read', 'success');
}

function updateUnreadCount() {
    const unreadCount = document.querySelectorAll('tbody#announcementsTableBody tr.unread').length;
    const countElement = document.querySelector('.unread-count');
    if (countElement) {
        countElement.textContent = unreadCount;
    }
}

function refreshAnnouncements() {
    showNotification('Refreshing announcements...', 'info');
    loadAnnouncements().then(() => {
        showNotification('Announcements refreshed', 'success');
    });
}

function loadMoreAnnouncements() {
    showNotification('Loading more announcements...', 'info');
    // In future, implement pagination
    setTimeout(() => {
        showNotification('No more announcements to load', 'info');
    }, 1000);
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type) {
    // Simple notification - can be enhanced
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can integrate with your notification system here
}

function toggleAnnouncements() {
    const content = document.getElementById('announcementsContent');
    const toggle = document.querySelector('.announcement-toggle');
    
    if (content && toggle) {
        content.classList.toggle('collapsed');
        toggle.classList.toggle('rotated');
        
        // Save state to localStorage
        const isCollapsed = content.classList.contains('collapsed');
        localStorage.setItem('announcementsCollapsed', isCollapsed);
    }
}

function restoreAnnouncementState() {
    const savedState = localStorage.getItem('announcementsCollapsed');
    const content = document.getElementById('announcementsContent');
    const toggle = document.querySelector('.announcement-toggle');
    
    if (content && toggle && savedState === 'true') {
        content.classList.add('collapsed');
        toggle.classList.add('rotated');
    }
}

// Export functions
window.toggleAnnouncements = toggleAnnouncements;
window.restoreAnnouncementState = restoreAnnouncementState;
window.filterAnnouncements = filterAnnouncements;
window.searchAnnouncements = searchAnnouncements;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.refreshAnnouncements = refreshAnnouncements;
window.loadMoreAnnouncements = loadMoreAnnouncements;
window.loadAnnouncements = loadAnnouncements;
