/**
 * User Announcements Page
 * Connects to database to show announcements
 */

// API Base Path
function getUserAPIBasePath() {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(p => p);
    
    // Find project root (typically the first directory in the path)
    // For paths like /OSAS_WEB/app/entry/user_dashboard.php
    // Project root is OSAS_WEB, so API is at /OSAS_WEB/api/
    if (pathParts.length > 0) {
        const projectRoot = pathParts[0];
        return '/' + projectRoot + '/api/';
    }
    
    // Fallback to relative path
    if (currentPath.includes('/includes/') || currentPath.includes('/app/entry/')) {
        return '../api/';
    } else if (currentPath.includes('/app/views/')) {
        return '../../api/';
    }
    
    return '/api/';
}

const USER_API_BASE = getUserAPIBasePath();
console.log('🔗 User Announcements API Base Path:', USER_API_BASE);

let announcements = [];
let readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');

// Initialize function
function initializeUserAnnouncements() {
    console.log('🔄 Initializing announcements module...');
    
    // Make sure we're on the announcements page
    const container = document.querySelector('.announcements-list') || document.getElementById('announcementsListContainer');
    if (!container) {
        console.warn('⚠️ Announcements container not found, not on announcements page');
        return;
    }
    
    // Check if announcements are already rendered from PHP
    const existingCards = container.querySelectorAll('.announcement-card');
    if (existingCards.length > 0) {
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
    setTimeout(() => {
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterAnnouncements);
            console.log('✅ Category filter listener added');
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', filterAnnouncements);
            console.log('✅ Status filter listener added');
        }
    }, 200);
}

// Initialize immediately if DOM is ready, or wait for it
function initializeAnnouncementsModule() {
    // Check if we're on the announcements page
    const announcementsPage = document.getElementById('announcementsListContainer') || 
                             document.querySelector('.announcements-list') ||
                             document.getElementById('categoryFilter');
    
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
        const container = document.querySelector('.announcements-list') || document.getElementById('announcementsListContainer');
        if (!container) {
            console.warn('⚠️ Announcements container not found, retrying in 500ms...');
            setTimeout(loadAnnouncements, 500);
            return;
        }

        console.log('🔄 Loading announcements from:', USER_API_BASE + 'announcements.php?action=active');
        container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p>Loading announcements...</p></div>';

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
        const container = document.querySelector('.announcements-list') || document.getElementById('announcementsListContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>Error loading announcements: ${error.message}</p>
                    <button onclick="loadAnnouncements()" style="margin-top: 10px; padding: 8px 16px; background: var(--gold); border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }
}

function renderAnnouncements() {
    const container = document.querySelector('.announcements-list') || document.getElementById('announcementsListContainer');
    if (!container) {
        console.warn('⚠️ Announcements container not found');
        return;
    }

    if (!Array.isArray(announcements) || announcements.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                <p>No announcements available</p>
            </div>
        `;
        return;
    }

    console.log('Rendering', announcements.length, 'announcements');
    
    try {
        container.innerHTML = announcements.map(announcement => {
            const type = announcement.type || 'info';
            const typeClass = type === 'urgent' ? 'urgent' : type === 'warning' ? 'warning' : 'general';
            const announcementId = announcement.id || 0;
            const isRead = readAnnouncements.includes(announcementId);
            const readClass = isRead ? 'read' : 'unread';
            
            let icon = 'bxs-info-circle';
            if (type === 'urgent') icon = 'bxs-error-circle';
            else if (type === 'warning') icon = 'bxs-error';
            else if (type === 'info') icon = 'bxs-info-circle';
            else icon = 'bxs-bell';

            const timeAgo = formatTimeAgo(announcement.created_at || announcement.createdAt || '');
            const category = type === 'urgent' ? 'Urgent' : type === 'warning' ? 'Warning' : 'General';
            const title = escapeHtml(announcement.title || 'Untitled');
            const message = escapeHtml(announcement.message || announcement.content || '');

            return `
                <div class="announcement-card ${typeClass} ${readClass}" data-category="${type}">
                    <div class="announcement-header">
                        <div class="announcement-icon ${typeClass}">
                            <i class='bx ${icon}'></i>
                        </div>
                        <div class="announcement-title">
                            <h3>${title}</h3>
                            <div class="announcement-meta">
                                <span class="announcement-date">${timeAgo}</span>
                                <span class="announcement-category ${typeClass}">${category}</span>
                            </div>
                        </div>
                        <div class="announcement-actions">
                            <button class="btn-mark-read" onclick="markAsRead(${announcementId}, this)" style="display: ${isRead ? 'none' : 'block'};">
                                <i class='bx bxs-check-circle'></i>
                            </button>
                        </div>
                    </div>
                    <div class="announcement-content">
                        <p>${message}</p>
                        <div class="announcement-tags">
                            <span class="tag">${category}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Announcements rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering announcements:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>Error rendering announcements: ${error.message}</p>
            </div>
        `;
    }
}

// Parse existing announcements from DOM (rendered by PHP)
function parseExistingAnnouncements() {
    const cards = document.querySelectorAll('.announcement-card');
    announcements = [];
    
    cards.forEach(card => {
        const announcementId = parseInt(card.querySelector('.btn-mark-read')?.getAttribute('onclick')?.match(/\d+/)?.[0] || '0');
        const title = card.querySelector('h3')?.textContent || '';
        const message = card.querySelector('.announcement-content p')?.textContent || '';
        const category = card.getAttribute('data-category') || 'info';
        const type = category;
        const isRead = card.classList.contains('read');
        
        announcements.push({
            id: announcementId,
            title: title,
            message: message,
            type: type,
            created_at: new Date().toISOString() // Approximate, since we don't have exact date from DOM
        });
        
        if (isRead && !readAnnouncements.includes(announcementId)) {
            readAnnouncements.push(announcementId);
        }
    });
    
    localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    console.log(`✅ Parsed ${announcements.length} announcements from DOM`);
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
    const cards = document.querySelectorAll('.announcement-card');
    
    cards.forEach(card => {
        const category = card.getAttribute('data-category');
        const isRead = card.classList.contains('read');
        
        let showCard = true;
        
        if (categoryFilter !== 'all' && category !== categoryFilter) {
            showCard = false;
        }
        
        if (statusFilter === 'read' && !isRead) {
            showCard = false;
        } else if (statusFilter === 'unread' && isRead) {
            showCard = false;
        }
        
        card.style.display = showCard ? 'block' : 'none';
    });
}

function searchAnnouncements() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.announcement-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const content = card.querySelector('.announcement-content p')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function markAsRead(announcementId, button) {
    if (!readAnnouncements.includes(announcementId)) {
        readAnnouncements.push(announcementId);
        localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    }
    
    const card = button.closest('.announcement-card');
    card.classList.remove('unread');
    card.classList.add('read');
    button.style.display = 'none';
    
    updateUnreadCount();
    showNotification('Announcement marked as read', 'success');
}

function markAllAsRead() {
    announcements.forEach(announcement => {
        if (!readAnnouncements.includes(announcement.id)) {
            readAnnouncements.push(announcement.id);
        }
    });
    
    localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    
    const cards = document.querySelectorAll('.announcement-card.unread');
    cards.forEach(card => {
        card.classList.remove('unread');
        card.classList.add('read');
        const button = card.querySelector('.btn-mark-read');
        if (button) button.style.display = 'none';
    });
    
    updateUnreadCount();
    showNotification('All announcements marked as read', 'success');
}

function updateUnreadCount() {
    const unreadCount = document.querySelectorAll('.announcement-card.unread').length;
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

// Export functions
window.filterAnnouncements = filterAnnouncements;
window.searchAnnouncements = searchAnnouncements;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.refreshAnnouncements = refreshAnnouncements;
window.loadMoreAnnouncements = loadMoreAnnouncements;
window.loadAnnouncements = loadAnnouncements;
