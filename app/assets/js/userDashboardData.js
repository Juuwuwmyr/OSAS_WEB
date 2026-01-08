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
            daysClean: 0,
            violationTypes: {}
        };
        this.violations = [];
        this.announcements = [];
        this.dashcontents = [];
        this.userProfile = null;
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

        await Promise.all([
            this.loadUserViolations(),
            this.loadAnnouncements(),
            this.loadDashcontents()
        ]);

        this.updateDashboardDisplay();
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
        if (!this.studentId) return;

        try {
            const url = `${USER_API_BASE}violations.php?student_id=${encodeURIComponent(this.studentId)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message || 'Error loading violations');

            this.violations = data.violations || data.data || [];
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

        this.stats.violationTypes = {};
        this.violations.forEach(v => {
            const type = (v.violation_type || v.type || 'unknown').toLowerCase().replace(/\s+/g, '_');
            this.stats.violationTypes[type] = (this.stats.violationTypes[type] || 0) + 1;
        });

        if (this.violations.length > 0) {
            const sorted = [...this.violations].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
            const lastDate = new Date(sorted[0].date || sorted[0].created_at);
            const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            this.stats.daysClean = diffDays;
        } else {
            this.stats.daysClean = 0;
        }
    }

    async loadAnnouncements() {
        try {
            const url = `${USER_API_BASE}announcements.php?action=active&limit=10`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message || 'Error loading announcements');

            this.announcements = data.data || data.announcements || [];
        } catch (error) {
            console.error('❌ Error loading announcements:', error);
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
        this.updateViolationSummary();
        this.updateRecentViolationsTable();
        this.updateAnnouncementsDisplay();
        this.updateDashcontents();
    }

    updateViolationSummary() {
        const container = document.querySelector('.violation-summary') || document.getElementById('violationSummary');
        if (!container) return;

        const types = ['improper_uniform', 'improper_footwear', 'no_id'];
        const typeLabels = { 'improper_uniform':'Improper Uniform', 'improper_footwear':'Improper Footwear', 'no_id':'No ID Card' };
        const typeIcons = { 'improper_uniform':'bxs-t-shirt', 'improper_footwear':'bxs-shoe', 'no_id':'bxs-id-card' };

        container.innerHTML = types.map(type => {
            const count = this.stats.violationTypes[type] || 0;
            return `
                <div class="violation-type">
                    <div class="violation-icon ${type}">
                        <i class='bx ${typeIcons[type]}'></i>
                    </div>
                    <div class="violation-details">
                        <h4>${typeLabels[type]}</h4>
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
        tbody.innerHTML = sorted.map(v => {
            const type = v.violation_type || v.type || 'Unknown';
            const date = new Date(v.date || v.created_at).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'});
            const status = (v.status || 'pending').toLowerCase();
            const statusClass = status === 'resolved' || status === 'permitted' ? 'resolved' : 'pending';
            const statusText = statusClass === 'resolved' ? 'Permitted' : 'Pending';

            let icon = 'bxs-info-circle';
            if (type.toLowerCase().includes('uniform')) icon='bxs-t-shirt';
            else if (type.toLowerCase().includes('footwear') || type.toLowerCase().includes('shoe')) icon='bxs-shoe';
            else if (type.toLowerCase().includes('id')) icon='bxs-id-card';

            return `
                <tr>
                    <td>${date}</td>
                    <td><i class='bx ${icon}'></i> ${type}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td><button class="btn-view-details" onclick="viewViolationDetails(${v.id || v.violation_id})">View Details</button></td>
                </tr>
            `;
        }).join('');
    }

    updateAnnouncementsDisplay() {
        const container = document.getElementById('announcementsContent');
        if (!container) return;

        if (this.announcements.length === 0) {
            container.innerHTML = `<p>No active announcements at this time.</p>`;
            return;
        }

        container.innerHTML = this.announcements.map(a => `<div class="announcement-item">${a.title}</div>`).join('');
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
}

// Auto-load when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const userDashboardData = new UserDashboardData();
    userDashboardData.loadAllData();
    window.userDashboardData = userDashboardData;
});
