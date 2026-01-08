/**
 * User Dashboard Data Loader
 * Connects user dashboard features to database APIs
 */

// API Base Path Detection
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
console.log('🔗 User API Base Path:', USER_API_BASE);

// User Dashboard Data Manager
class UserDashboardData {
    constructor() {
        this.userId = null;
        this.studentId = null;
        this.stats = {
            activeViolations: 0,
            totalViolations: 0,
            daysClean: 0,
            violationTypes: {}
        };
        this.violations = [];
        this.announcements = [];
        this.userProfile = null;
    }

    /**
     * Initialize and get user ID from session
     */
    init() {
        // Get user ID from session/cookies
        const userId = this.getUserId();
        if (!userId) {
            console.warn('⚠️ User ID not found in session');
            return false;
        }
        this.userId = userId;
        console.log('✅ User ID initialized:', this.userId);
        return true;
    }

    /**
     * Get user ID from session/cookies
     */
    getUserId() {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        if (cookies.user_id) {
            return parseInt(cookies.user_id);
        }
        
        try {
            const session = localStorage.getItem('userSession');
            if (session) {
                const parsed = JSON.parse(session);
                return parsed.user_id || parsed.id;
            }
        } catch (e) {
            console.warn('Could not parse user session:', e);
        }
        
        return null;
    }
    
    getStudentId() {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        if (cookies.student_id) {
            return cookies.student_id;
        }
        
        if (cookies.student_id_code) {
            return cookies.student_id_code;
        }
        
        const storedId = localStorage.getItem('student_id');
        if (storedId) {
            return storedId;
        }
        
        const storedCode = localStorage.getItem('student_id_code');
        if (storedCode) {
            return storedCode;
        }
        
        try {
            const session = localStorage.getItem('userSession');
            if (session) {
                const parsed = JSON.parse(session);
                return parsed.studentId || parsed.studentIdCode;
            }
        } catch (e) {
            console.warn('Could not parse user session:', e);
        }
        
        return null;
    }

    /**
     * Load all user dashboard data
     */
    async loadAllData() {
        try {
            console.log('📊 Loading user dashboard data from database...');
            console.log('API Base Path:', USER_API_BASE);
            
            if (!this.init()) {
                console.warn('⚠️ Could not initialize user dashboard data - user ID not found');
                await this.loadAnnouncements();
                this.updateAnnouncementsDisplay();
                return;
            }

            console.log('✅ User ID initialized:', this.userId);

            this.studentId = this.getStudentId();
            
            if (!this.studentId) {
                console.log('⚠️ Student ID not in session, fetching from profile...');
                await this.loadUserProfile();
            } else {
                console.log('✅ Student ID found in session:', this.studentId);
            }
            
            if (!this.studentId) {
                console.warn('⚠️ Student ID not found, cannot load user-specific data');
                await this.loadAnnouncements();
                this.updateAnnouncementsDisplay();
                return;
            }

            await Promise.all([
                this.loadUserViolations(),
                this.loadAnnouncements()
            ]);

            this.updateDashboardDisplay();
            console.log('✅ Dashboard data loaded and displayed');
        } catch (error) {
            console.error('❌ Error loading user dashboard data:', error);
            console.error('Error stack:', error.stack);
        }
    }

    /**
     * Load user's violations from database
     */
    async loadUserViolations() {
        try {
            if (!this.studentId) {
                console.warn('⚠️ Student ID not set, cannot load violations');
                this.violations = [];
                this.calculateViolationStats();
                return;
            }

            console.log('🔄 Loading user violations...');
            console.log('Filtering for student_id:', this.studentId);
            const url = USER_API_BASE + 'violations.php?student_id=' + encodeURIComponent(this.studentId);
            console.log('Fetching from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Violations API response (first 500 chars):', responseText.substring(0, 500));
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                console.error('Response was:', responseText);
                throw new Error('Invalid JSON response from violations API');
            }
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to load violations');
            }

            this.violations = data.violations || data.data || [];
            console.log(`✅ Loaded ${this.violations.length} violations for student_id: ${this.studentId}`);

            this.calculateViolationStats();
        } catch (error) {
            console.error('❌ Error loading violations:', error);
            console.error('Error details:', error.message, error.stack);
            this.violations = [];
            this.calculateViolationStats();
        }
    }

    /**
     * Calculate violation statistics
     */
    calculateViolationStats() {
        this.stats.totalViolations = this.violations.length;
        
        // Count active violations (not resolved)
        this.stats.activeViolations = this.violations.filter(v => {
            const status = (v.status || '').toLowerCase();
            return status !== 'resolved' && status !== 'permitted' && status !== 'cleared';
        }).length;

        // Count violations by type
        this.stats.violationTypes = {};
        this.violations.forEach(v => {
            const type = v.violation_type || v.type || 'unknown';
            this.stats.violationTypes[type] = (this.stats.violationTypes[type] || 0) + 1;
        });

        // Calculate days clean (days since last violation)
        if (this.violations.length > 0) {
            const sortedViolations = [...this.violations].sort((a, b) => {
                const dateA = new Date(a.date || a.created_at || a.violation_date);
                const dateB = new Date(b.date || b.created_at || b.violation_date);
                return dateB - dateA;
            });
            
            const lastViolationDate = new Date(sortedViolations[0].date || sortedViolations[0].created_at || sortedViolations[0].violation_date);
            const today = new Date();
            const diffTime = Math.abs(today - lastViolationDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            this.stats.daysClean = diffDays;
        } else {
            this.stats.daysClean = 0;
        }
    }

    /**
     * Load active announcements
     */
    async loadAnnouncements() {
        try {
            console.log('🔄 Loading announcements...');
            const url = USER_API_BASE + 'announcements.php?action=active&limit=10';
            console.log('Fetching from:', url);
            
            const response = await fetch(url);
            
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

            this.announcements = data.data || data.announcements || [];
            
            console.log(`✅ Loaded ${this.announcements.length} announcements`);
        } catch (error) {
            console.error('❌ Error loading announcements:', error);
            console.error('Error details:', error.message, error.stack);
            this.announcements = [];
        }
    }

    /**
     * Load user profile data
     */
    async loadUserProfile() {
        try {
            console.log('🔄 Loading user profile to get student_id...');
            console.log('Looking for user_id:', this.userId);
            const url = USER_API_BASE + 'students.php';
            console.log('Fetching from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Students API response (first 500 chars):', responseText.substring(0, 500));
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                console.error('Response was:', responseText);
                throw new Error('Invalid JSON response from students API');
            }
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to load profile');
            }

            const allStudents = data.data || data.students || [];
            console.log(`📋 Total students in database: ${allStudents.length}`);
            
            const student = allStudents.find(s => {
                const match = s.user_id && parseInt(s.user_id) === parseInt(this.userId);
                if (match) {
                    console.log('✅ Found matching student:', s);
                }
                return match;
            });
            
            if (student) {
                this.userProfile = student;
                this.studentId = student.student_id || student.studentId || student.id;
                console.log('✅ Loaded user profile, student_id:', this.studentId);
                console.log('Student data:', { id: student.id, student_id: student.student_id, studentId: student.studentId });
            } else {
                console.warn('⚠️ Student not found for user_id:', this.userId);
                console.log('Available students (first 3):', allStudents.slice(0, 3));
            }
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            console.error('Error details:', error.message, error.stack);
        }
    }

    /**
     * Update dashboard display with loaded data
     */
    updateDashboardDisplay() {
        console.log('🔄 Updating dashboard display...');
        console.log('Stats:', this.stats);
        console.log('Violations count:', this.violations.length);
        console.log('Announcements count:', this.announcements.length);
        
        this.updateStatsBoxes();
        this.updateAnnouncementsDisplay();
        this.updateViolationsDisplay();
        
        console.log('✅ Dashboard display updated');
    }

    /**
     * Update stats boxes on dashboard
     */
    updateStatsBoxes() {
        // Active Violations
        const activeViolationsEl = document.querySelector('.box-info li:nth-child(1) h3');
        if (activeViolationsEl) {
            activeViolationsEl.textContent = this.stats.activeViolations;
        }

        // Total Violations
        const totalViolationsEl = document.querySelector('.box-info li:nth-child(2) h3');
        if (totalViolationsEl) {
            totalViolationsEl.textContent = this.stats.totalViolations;
        }

        // Days Clean
        const daysCleanEl = document.querySelector('.box-info li:nth-child(4) h3');
        if (daysCleanEl) {
            daysCleanEl.textContent = this.stats.daysClean;
        }

        // Status (Good/Permitted)
        const statusEl = document.querySelector('.box-info li:nth-child(3) h3');
        if (statusEl) {
            statusEl.textContent = this.stats.activeViolations === 0 ? 'Good' : 'Warning';
        }
    }

    /**
     * Update announcements display
     */
    updateAnnouncementsDisplay() {
        const container = document.getElementById('announcementsContent') || 
                         document.querySelector('#announcementsContent') ||
                         document.querySelector('.announcements-content');
        if (!container) {
            console.warn('⚠️ Announcements container not found');
            return;
        }

        if (this.announcements.length === 0) {
            container.innerHTML = `
                <div class="announcement-item">
                    <div class="announcement-icon">
                        <i class='bx bx-info-circle'></i>
                    </div>
                    <div class="announcement-details">
                        <h4>No announcements</h4>
                        <p>There are no active announcements at this time.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.announcements.map(announcement => {
            const type = announcement.type || 'info';
            const typeClass = type === 'urgent' ? 'urgent' : type === 'warning' ? 'warning' : '';
            const icon = type === 'urgent' ? 'bxs-error-circle' : type === 'warning' ? 'bxs-error' : 'bxs-info-circle';
            const timeAgo = this.formatTimeAgo(announcement.created_at);
            
            return `
                <div class="announcement-item ${typeClass}">
                    <div class="announcement-icon">
                        <i class='bx ${icon}'></i>
                    </div>
                    <div class="announcement-details">
                        <h4>${this.escapeHtml(announcement.title || 'Untitled')}</h4>
                        <p>${this.escapeHtml((announcement.message || '').substring(0, 100))}${(announcement.message || '').length > 100 ? '...' : ''}</p>
                        <span class="announcement-time">${timeAgo}</span>
                    </div>
                    <div class="announcement-actions">
                        <button class="btn-read-more" onclick="viewAnnouncementDetails(${announcement.id})">Read More</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update violations display on dashboard
     */
    updateViolationsDisplay() {
        // Update violation summary
        this.updateViolationSummary();
        
        // Update recent violations table
        this.updateRecentViolationsTable();
    }

    /**
     * Update violation summary cards
     */
    updateViolationSummary() {
        const summaryContainer = document.querySelector('.violation-summary') || document.getElementById('violationSummary');
        if (!summaryContainer) {
            console.warn('⚠️ Violation summary container not found');
            return;
        }

        const types = ['improper_uniform', 'improper_footwear', 'no_id'];
        const typeLabels = {
            'improper_uniform': 'Improper Uniform',
            'improper_footwear': 'Improper Footwear',
            'no_id': 'No ID Card'
        };
        const typeIcons = {
            'improper_uniform': 'bxs-t-shirt',
            'improper_footwear': 'bxs-shoe',
            'no_id': 'bxs-id-card'
        };

        summaryContainer.innerHTML = types.map(type => {
            const count = this.stats.violationTypes[type] || 0;
            const violationsOfType = this.violations.filter(v => {
                const vType = (v.violation_type || v.type || '').toLowerCase().replace(/\s+/g, '_');
                return vType === type;
            });
            
            let lastViolation = 'Never';
            if (violationsOfType.length > 0) {
                const sorted = [...violationsOfType].sort((a, b) => {
                    const dateA = new Date(a.date || a.created_at || a.violation_date);
                    const dateB = new Date(b.date || b.created_at || b.violation_date);
                    return dateB - dateA;
                });
                lastViolation = this.formatTimeAgo(sorted[0].date || sorted[0].created_at || sorted[0].violation_date);
            }

            const status = count === 0 ? 'resolved' : 'pending';
            
            return `
                <div class="violation-type">
                    <div class="violation-icon ${type}">
                        <i class='bx ${typeIcons[type]}'></i>
                    </div>
                    <div class="violation-details">
                        <h4>${typeLabels[type]}</h4>
                        <p>Violations: <span class="count">${count}</span></p>
                        <span class="last-violation">Last: ${lastViolation}</span>
                    </div>
                    <div class="violation-status">
                        <span class="status ${status}">${status === 'resolved' ? 'Permitted' : 'Pending'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update recent violations table
     */
    updateRecentViolationsTable() {
        const tbody = document.querySelector('.violation-history tbody') || document.getElementById('recentViolationsTableBody');
        if (!tbody) {
            console.warn('⚠️ Recent violations table body not found');
            return;
        }

        if (this.violations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px;">
                        <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                        <p>No violations found</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by date (newest first)
        const sortedViolations = [...this.violations].sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || a.violation_date);
            const dateB = new Date(b.date || b.created_at || b.violation_date);
            return dateB - dateA;
        }).slice(0, 10); // Show only latest 10

        tbody.innerHTML = sortedViolations.map(violation => {
            const type = violation.violation_type || violation.type || 'Unknown';
            const date = this.formatDate(violation.date || violation.created_at || violation.violation_date);
            const status = (violation.status || 'pending').toLowerCase();
            const statusClass = status === 'resolved' || status === 'permitted' ? 'resolved' : 'pending';
            const statusText = status === 'resolved' || status === 'permitted' ? 'Permitted' : 'Pending';
            
            // Get icon based on type
            let icon = 'bxs-info-circle';
            if (type.toLowerCase().includes('uniform')) icon = 'bxs-t-shirt';
            else if (type.toLowerCase().includes('footwear') || type.toLowerCase().includes('shoe')) icon = 'bxs-shoe';
            else if (type.toLowerCase().includes('id')) icon = 'bxs-id-card';

            return `
                <tr>
                    <td>${date}</td>
                    <td>
                        <div class="violation-info">
                            <i class='bx ${icon}'></i>
                            <span>${this.escapeHtml(type)}</span>
                        </div>
                    </td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn-view-details" onclick="viewViolationDetails(${violation.id || violation.violation_id})">View Details</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /**
     * Format time ago
     */
    formatTimeAgo(dateString) {
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
        return this.formatDate(dateString);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize user dashboard data
const userDashboardData = new UserDashboardData();

// Auto-load when dashboard content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the dashboard page
    if (document.querySelector('.box-info') || document.getElementById('announcementsContent')) {
        console.log('🔄 Auto-loading user dashboard data on DOMContentLoaded...');
        userDashboardData.loadAllData().catch(error => {
            console.error('❌ Error auto-loading dashboard data:', error);
        });
    }
});

// Also listen for when content is dynamically loaded
if (typeof window !== 'undefined') {
    // Create a custom event listener for when content is loaded
    window.addEventListener('userDashboardContentLoaded', function() {
        console.log('🔄 User dashboard content loaded event triggered');
        if (typeof userDashboardData !== 'undefined' && userDashboardData) {
            userDashboardData.loadAllData().catch(error => {
                console.error('❌ Error loading dashboard data:', error);
            });
        }
    });
}

// Export for use in other scripts
window.userDashboardData = userDashboardData;
