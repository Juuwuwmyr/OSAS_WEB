/**
 * User Dashboard Data Loader
 * Connects user dashboard features to database APIs
 */

const USER_API_BASE = (function() {
    const pathParts = window.location.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) return '/' + pathParts[0] + '/api/';
    return '/api/';
})();

console.log('🔗 User API Base Path:', USER_API_BASE);

class UserDashboardData {
    constructor() {
        this.userId = null;
        this.studentId = null;
        this.stats = {
            activeViolations: 0,
            totalViolations: 0,
            resolvedViolations: 0,
            daysClean: 0,
            violationTypes: {}
        };
        this.violations = [];
        this.announcements = [];
        this.dashcontents = [];
    }

    /**
     * Initialize dashboard
     */
    init() {
        // Get student ID directly from HTML attribute
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('⚠️ Main content container not found');
            return false;
        }

        this.studentId = mainContent.dataset.studentId;
        if (!this.studentId) {
            console.error('⚠️ Student ID not found in main-content data attribute');
            return false;
        }

        console.log('✅ Student ID detected:', this.studentId);
        return true;
    }

    async loadAllData() {
        if (!this.init()) {
            this.displayNoStudentIdMessage();
            return;
        }

        console.log('🔄 Loading all dashboard data...');
        
        try {
            await Promise.all([
                this.loadUserViolations(),
                this.loadAnnouncements(),
                this.loadDashcontents()
            ]);

            console.log('✅ All data loaded, updating display...');
            this.updateDashboardDisplay();
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            // Still try to update display even if there's an error
            this.updateDashboardDisplay();
        }
    }

    displayNoStudentIdMessage() {
        const tbody = document.querySelector('.violation-history tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; color:red; padding:40px;">
                        Student ID not found. Please login again.
                    </td>
                </tr>
            `;
        }
    }

    async loadUserViolations() {
        if (!this.studentId) {
            console.warn('⚠️ Student ID not available for loading violations');
            return;
        }

        try {
            const url = `${USER_API_BASE}violations.php`;
            console.log('🔄 Loading violations from:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            console.log('📦 Violations API response:', data);
            if (data.status === 'error') throw new Error(data.message || 'Error loading violations');

            this.violations = data.violations || data.data || [];
            console.log('✅ Loaded', this.violations.length, 'violations');
            
            // SYNC with userViolations.js so viewViolationDetails works
            if (typeof window.userViolations !== 'undefined') {
                window.userViolations = this.violations;
                console.log('🔗 Synced violations with userViolations.js');
            } else {
                window.userViolations = this.violations; // Define it if not exists
            }

            this.calculateViolationStats();
        } catch (error) {
            console.error('❌ Error loading violations:', error);
            this.violations = [];
            this.calculateViolationStats();
        }
    }

    calculateViolationStats() {
        this.stats.totalViolations = this.violations.length;
        this.stats.activeViolations = this.violations.filter(v => {
            const status = (v.status || '').toLowerCase();
            return status !== 'resolved' && status !== 'permitted' && status !== 'cleared';
        }).length;

        this.stats.resolvedViolations = this.violations.filter(v => {
            const status = (v.status || '').toLowerCase();
            return status === 'resolved' || status === 'permitted' || status === 'cleared';
        }).length;

        this.stats.violationTypes = {};
        this.violations.forEach(v => {
            const type = (v.violation_type || v.type || 'unknown').toLowerCase().replace(/\s+/g, '_');
            this.stats.violationTypes[type] = (this.stats.violationTypes[type] || 0) + 1;
        });

        if (this.violations.length > 0) {
            const sorted = [...this.violations].sort((a, b) => new Date(b.date || b.created_at || b.violation_date) - new Date(a.date || a.created_at || a.violation_date));
            const lastDate = new Date(sorted[0].date || sorted[0].created_at || sorted[0].violation_date);
            const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            this.stats.daysClean = diffDays;
        } else {
            this.stats.daysClean = 'Always'; // No violations ever
        }
    }

    async loadAnnouncements() {
        try {
            const url = `${USER_API_BASE}announcements.php?action=active&limit=10`;
            console.log('🔄 Loading announcements from:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('📦 Announcements API raw response:', responseText.substring(0, 500));
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON:', parseError);
                console.error('Response text:', responseText);
                throw new Error('Invalid JSON response from announcements API');
            }
            
            console.log('📦 Announcements API parsed response:', data);
            
            if (data.status === 'error') {
                console.error('❌ API returned error:', data.message);
                throw new Error(data.message || 'Error loading announcements');
            }

            // Handle different response formats
            this.announcements = data.data || data.announcements || [];
            
            if (Array.isArray(this.announcements)) {
                console.log('✅ Loaded', this.announcements.length, 'announcements');
            } else {
                console.warn('⚠️ Announcements data is not an array:', this.announcements);
                this.announcements = [];
            }
        } catch (error) {
            console.error('❌ Error loading announcements:', error);
            console.error('Error details:', error.message, error.stack);
            this.announcements = [];
        }
    }

    async loadDashcontents() {
        try {
            const url = `${USER_API_BASE}dashcontents.php?action=active&audience=user`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message || 'Error loading dashcontents');

            this.dashcontents = data.data || [];
        } catch (error) {
            console.error('❌ Error loading dashcontents:', error);
            this.dashcontents = [];
        }
    }

    updateDashboardDisplay() {
        console.log('🔄 Updating dashboard display...');

        // Update Stats
        const setStat = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setStat('statActiveViolations', this.stats.activeViolations);
        setStat('statTotalViolations', this.stats.totalViolations);
        setStat('statResolvedViolations', this.stats.resolvedViolations);
        setStat('statDaysClean', this.stats.daysClean);

        this.updateViolationSummary();
        this.updateRecentViolationsTable();
        this.updateAnnouncementsDisplay();
        this.updateDashcontents();
        console.log('✅ Dashboard display updated');
    }

    updateViolationSummary() {
        const container = document.querySelector('.violation-summary') || document.getElementById('violationSummary');
        if (!container) return;

        // Group violations by type label
        const typeCounts = {};
        this.violations.forEach(v => {
            const label = v.violationTypeLabel || v.violation_type_name || 'Other';
            typeCounts[label] = (typeCounts[label] || 0) + 1;
        });

        // Sort by count descending
        const sortedTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // Show top 3

        // Helper for icons
        const getIcon = (label) => {
            const lower = label.toLowerCase();
            if (lower.includes('uniform')) return 'bxs-t-shirt';
            if (lower.includes('footwear') || lower.includes('shoe')) return 'bxs-shopping-bag-alt';
            if (lower.includes('id')) return 'bxs-id-card';
            if (lower.includes('hair') || lower.includes('cut')) return 'bxs-face';
            if (lower.includes('conduct') || lower.includes('behavior')) return 'bxs-user-x';
            return 'bxs-error-circle'; // Default icon
        };

        if (sortedTypes.length === 0) {
            container.innerHTML = `
                <div class="violation-type" style="width:100%; justify-content:center;">
                    <div class="violation-details">
                        <h4>No Violations</h4>
                        <p>Keep it up!</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedTypes.map(([label, count]) => {
            const icon = getIcon(label);
            return `
                <div class="violation-type">
                    <div class="violation-icon" style="background: var(--light-blue); color: var(--blue);">
                        <i class='bx ${icon}'></i>
                    </div>
                    <div class="violation-details">
                        <h4>${label}</h4>
                        <p>Violations: <span class="count">${count}</span></p>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateRecentViolationsTable() {
        const tbody = document.querySelector('.violation-history tbody') || document.getElementById('recentViolationsTableBody');
        if (!tbody) return;

        if (this.violations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding:40px;">
                        <i class='bx bx-info-circle' style="font-size:48px;"></i>
                        <p>No violations found</p>
                    </td>
                </tr>
            `;
            return;
        }

        const sorted = [...this.violations].sort((a,b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)).slice(0,10);
        
        // Helper for icons (reused)
        const getIcon = (label) => {
            const lower = (label || '').toLowerCase();
            if (lower.includes('uniform')) return 'bxs-t-shirt';
            if (lower.includes('footwear') || lower.includes('shoe')) return 'bxs-shopping-bag-alt';
            if (lower.includes('id')) return 'bxs-id-card';
            if (lower.includes('hair') || lower.includes('cut')) return 'bxs-face';
            if (lower.includes('conduct') || lower.includes('behavior')) return 'bxs-user-x';
            return 'bxs-info-circle';
        };

        tbody.innerHTML = sorted.map(v => {
            // Use dynamic label
            const typeLabel = v.violationTypeLabel || v.violation_type || v.type || 'Unknown';
            const date = new Date(v.date || v.created_at || v.violation_date).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'});
            
            const status = (v.status || 'pending').toLowerCase();
            const level = v.violation_level_name || v.violationLevelLabel || v.level || v.offense_level || '1';
            const levelVal = String(level).toLowerCase();
            const isDisciplinary = levelVal.includes('warning 3') || levelVal.includes('3rd') || levelVal.includes('disciplinary');

            let statusClass = 'pending';
            let statusText = 'Pending';

            if (status === 'resolved' || status === 'permitted') {
                statusClass = 'completed'; // Changed from success to match dashboard style usually, or keep 'resolved'
                statusText = isDisciplinary ? 'Resolved' : 'Permitted';
            } else if (isDisciplinary || status === 'disciplinary') {
                 statusClass = 'process';
                 statusText = 'Disciplinary';
            } else if (status === 'warning') {
                statusClass = 'pending';
                statusText = 'Warning';
            }

            // Note: The original code used 'resolved', 'pending', 'process' classes.
            // Let's map our statusClass to those.
            // pending -> orange/yellow
            // completed -> green
            // process -> red/purple
            
            let badgeClass = 'pending';
            if (statusText === 'Resolved' || statusText === 'Permitted') badgeClass = 'completed';
            else if (statusText === 'Disciplinary') badgeClass = 'process';
            else badgeClass = 'pending'; // Warning/Pending

            const icon = getIcon(typeLabel);

            return `
                <tr>
                    <td>${date}</td>
                    <td><i class='bx ${icon}'></i> ${this.escapeHtml(typeLabel)}</td>
                    <td><span class="status ${badgeClass}">${statusText}</span></td>
                    <td><button class="btn-view-details" onclick="viewViolationDetails(${v.id || v.violation_id})">View Details</button></td>
                </tr>
            `;
        }).join('');
    }

    updateAnnouncementsDisplay() {
        const container = document.getElementById('announcementsContent');
        if (!container) {
            console.warn('⚠️ Announcements container not found, retrying in 500ms...');
            // Retry after a short delay in case the container hasn't loaded yet
            setTimeout(() => this.updateAnnouncementsDisplay(), 500);
            return;
        }

        console.log('🔄 Updating announcements display...', {
            announcementsCount: this.announcements ? this.announcements.length : 0,
            announcements: this.announcements
        });

        // Clear content first (like admin side)
        container.innerHTML = '';

        if (!this.announcements || this.announcements.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                    <p style="color: var(--dark-grey);">No active announcements at this time.</p>
                </div>
            `;
            console.log('⚠️ No announcements to display');
            return;
        }

        // Display announcements (similar to admin side - using forEach and appendChild)
        this.announcements.forEach(announcement => {
            const type = announcement.type || 'info';
            const typeClass = type === 'urgent' ? 'urgent' : type === 'warning' ? 'warning' : 'general';
            
            let icon = 'bxs-info-circle';
            if (type === 'urgent') icon = 'bxs-error-circle';
            else if (type === 'warning') icon = 'bxs-error';
            else if (type === 'info') icon = 'bxs-info-circle';
            else icon = 'bxs-bell';

            const timeAgo = this.formatTimeAgo(announcement.created_at || announcement.createdAt);
            const category = type === 'urgent' ? 'Urgent' : type === 'warning' ? 'Warning' : 'General';

            const item = document.createElement('div');
            item.className = `announcement-item ${typeClass}`;
            item.innerHTML = `
                <div class="announcement-icon ${typeClass}">
                    <i class='bx ${icon}'></i>
                </div>
                <div class="announcement-details">
                    <h4>${this.escapeHtml(announcement.title || 'Untitled')}</h4>
                    <p>${this.escapeHtml(announcement.message || announcement.content || '')}</p>
                    <div class="announcement-meta">
                        <span class="announcement-time">${timeAgo}</span>
                        <span class="announcement-category ${typeClass}">${category}</span>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
        
        console.log('✅ Announcements displayed:', this.announcements.length);
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'Recently';
        
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
        
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    updateDashcontents() {
        // Update tips and guidelines in user dashboard
        const tipsContainer = document.querySelector('.tips-container .tips-content');
        if (tipsContainer && this.dashcontents.length > 0) {
            const tips = this.dashcontents.filter(dc => dc.content_type === 'tip' && (dc.target_audience === 'user' || dc.target_audience === 'both'));
            if (tips.length > 0) {
                tipsContainer.innerHTML = tips.map(tip => `
                    <div class="tip-item">
                        <div class="tip-icon">
                            <i class='bx ${tip.icon || 'bxs-info-circle'}'></i>
                        </div>
                        <div class="tip-details">
                            <h4>${this.escapeHtml(tip.title || '')}</h4>
                            <p>${this.escapeHtml(tip.content || '')}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatViolationType(type) {
        if (!type) return 'Unknown';
        
        const typeMap = {
            'improper_uniform': 'Improper Uniform',
            'improper_footwear': 'Improper Footwear',
            'no_id': 'No ID Card',
            'misconduct': 'Misconduct'
        };
        
        // Check if it's already formatted
        if (typeMap[type.toLowerCase()]) {
            return typeMap[type.toLowerCase()];
        }
        
        // If it contains the key, return the formatted version
        const lowerType = type.toLowerCase();
        for (const [key, value] of Object.entries(typeMap)) {
            if (lowerType.includes(key.replace('_', ' ')) || lowerType === key) {
                return value;
            }
        }
        
        // Otherwise, format it nicely
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Auto-load when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for main-content to be available
    setTimeout(() => {
        if (!window.userDashboardData) {
            window.userDashboardData = new UserDashboardData();
        }
        // Only load if we're on dashboard page
        const mainContent = document.getElementById('main-content');
        if (mainContent && (mainContent.innerHTML.includes('My Dashboard') || mainContent.innerHTML.includes('violation-history'))) {
            window.userDashboardData.loadAllData();
        }
    }, 100);
});

// Function to initialize dashboard data (can be called from other scripts)
window.initializeUserDashboard = function() {
    if (!window.userDashboardData) {
        window.userDashboardData = new UserDashboardData();
    }
    window.userDashboardData.loadAllData();
};
