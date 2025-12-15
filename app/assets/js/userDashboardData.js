/**
 * User Dashboard Data Loader
 * Connects user dashboard features to database APIs
 */

// API Base Path Detection
function getUserAPIBasePath() {
    const currentPath = window.location.pathname;
    const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
    const projectBase = pathMatch ? pathMatch[1] : '';
    
    if (projectBase) {
        return projectBase + '/api/';
    }
    
    if (currentPath.includes('/app/views/')) {
        return '../../api/';
    } else if (currentPath.includes('/includes/')) {
        return '../api/';
    } else {
        return 'api/';
    }
}

const USER_API_BASE = getUserAPIBasePath();

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
        return true;
    }

    /**
     * Get user ID from session/cookies
     */
    getUserId() {
        // Try to get from cookies first
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        if (cookies.user_id) {
            return parseInt(cookies.user_id);
        }
        
        // Try localStorage
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

    /**
     * Load all user dashboard data
     */
    async loadAllData() {
        try {
            console.log('📊 Loading user dashboard data from database...');
            
            if (!this.init()) {
                console.warn('⚠️ Could not initialize user dashboard data');
                return;
            }

            // Load data in parallel
            await Promise.all([
                this.loadUserViolations(),
                this.loadAnnouncements(),
                this.loadUserProfile()
            ]);

            // Update dashboard display
            this.updateDashboardDisplay();
        } catch (error) {
            console.error('❌ Error loading user dashboard data:', error);
        }
    }

    /**
     * Load user's violations from database
     */
    async loadUserViolations() {
        try {
            console.log('🔄 Loading user violations...');
            
            // Get all violations and filter by user's student_id
            const response = await fetch(USER_API_BASE + 'violations.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to load violations');
            }

            const allViolations = data.violations || data.data || [];
            
            // Get user's student_id from profile or session
            if (!this.studentId) {
                await this.loadUserProfile();
            }
            
            // Filter violations for this user
            if (this.studentId) {
                this.violations = allViolations.filter(v => 
                    (v.student_id && parseInt(v.student_id) === parseInt(this.studentId)) ||
                    (v.studentId && parseInt(v.studentId) === parseInt(this.studentId))
                );
            } else {
                // Fallback: if we can't get student_id, show empty
                this.violations = [];
            }

            // Calculate stats
            this.calculateViolationStats();
            
            console.log(`✅ Loaded ${this.violations.length} violations for user`);
        } catch (error) {
            console.error('❌ Error loading violations:', error);
            this.violations = [];
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
            
            const response = await fetch(USER_API_BASE + 'announcements.php?action=active&limit=10');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to load announcements');
            }

            this.announcements = data.data || data.announcements || [];
            
            console.log(`✅ Loaded ${this.announcements.length} announcements`);
        } catch (error) {
            console.error('❌ Error loading announcements:', error);
            this.announcements = [];
        }
    }

    /**
     * Load user profile data
     */
    async loadUserProfile() {
        try {
            console.log('🔄 Loading user profile...');
            
            // Get user's student data
            const response = await fetch(USER_API_BASE + 'students.php');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to load profile');
            }

            const allStudents = data.data || data.students || [];
            
            // Find student by user_id
            const student = allStudents.find(s => 
                (s.user_id && parseInt(s.user_id) === parseInt(this.userId)) ||
                (s.id && parseInt(s.id) === parseInt(this.userId))
            );
            
            if (student) {
                this.userProfile = student;
                this.studentId = student.id || student.student_id;
                console.log('✅ Loaded user profile');
            } else {
                console.warn('⚠️ User profile not found');
            }
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
        }
    }

    /**
     * Update dashboard display with loaded data
     */
    updateDashboardDisplay() {
        // Update stats boxes
        this.updateStatsBoxes();
        
        // Update announcements
        this.updateAnnouncementsDisplay();
        
        // Update violations
        this.updateViolationsDisplay();
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
        const container = document.getElementById('announcementsContent');
        if (!container) return;

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
        const summaryContainer = document.querySelector('.violation-summary');
        if (!summaryContainer) return;

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
        const tbody = document.querySelector('.violation-history tbody');
        if (!tbody) return;

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
        userDashboardData.loadAllData();
    }
});

// Export for use in other scripts
window.userDashboardData = userDashboardData;

