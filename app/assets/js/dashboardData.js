/**
 * Dashboard Data Loader
 * Connects dashboard to database APIs for real-time data
 */

// API Base Path Detection
function getAPIBasePath() {
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

const API_BASE = getAPIBasePath();

// Dashboard Data Manager
class DashboardData {
    constructor() {
        this.stats = {
            students: 0,
            departments: 0,
            sections: 0,
            violations: 0,
            violators: 0
        };
        this.violations = [];
        this.students = [];
        this.departments = [];
        this.sections = [];
        this.announcements = [];
    }

    /**
     * Load all dashboard data from APIs
     */
    async loadAllData() {
        try {
            console.log('📊 Loading dashboard data from database...');
            
            // Load all data in parallel
            const [studentsRes, departmentsRes, sectionsRes, violationsRes, announcementsRes] = await Promise.allSettled([
                fetch(API_BASE + 'students.php'),
                fetch(API_BASE + 'departments.php'),
                fetch(API_BASE + 'sections.php'),
                fetch(API_BASE + 'violations.php'),
                fetch(API_BASE + 'announcements.php?action=active&limit=5')
            ]);

            // Parse students
            if (studentsRes.status === 'fulfilled' && studentsRes.value && studentsRes.value.ok) {
                const data = await studentsRes.value.json();
                this.students = data.data || data.students || [];
                this.stats.students = this.students.length;
            }

            // Parse departments
            if (departmentsRes.status === 'fulfilled' && departmentsRes.value && departmentsRes.value.ok) {
                const data = await departmentsRes.value.json();
                this.departments = data.data || data.departments || [];
                this.stats.departments = this.departments.length;
            }

            // Parse sections
            if (sectionsRes.status === 'fulfilled' && sectionsRes.value && sectionsRes.value.ok) {
                const data = await sectionsRes.value.json();
                this.sections = data.data || data.sections || [];
                this.stats.sections = this.sections.length;
            }

            // Parse violations
            if (violationsRes.status === 'fulfilled' && violationsRes.value && violationsRes.value.ok) {
                const data = await violationsRes.value.json();
                this.violations = data.data || data.violations || [];
                this.stats.violations = this.violations.length;
                
                // Count unique violators
                const uniqueViolators = new Set(this.violations.map(v => v.studentId || v.student_id).filter(Boolean));
                this.stats.violators = uniqueViolators.size;
            }

            // Parse announcements
            if (announcementsRes.status === 'fulfilled' && announcementsRes.value && announcementsRes.value.ok) {
                try {
                    const data = await announcementsRes.value.json();
                    this.announcements = data.data || data.announcements || [];
                } catch (e) {
                    console.warn('Error parsing announcements data:', e);
                }
            }

            console.log('✅ Dashboard data loaded:', this.stats);
            
            // Update UI with real data
            this.updateStats();
            this.updateCharts();
            this.updateRecentViolators();
            this.updateTopViolators();
            this.updateAnnouncements();

        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
        }
    }

    /**
     * Update statistics boxes
     */
    updateStats() {
        const statsBoxes = document.querySelectorAll('.box-info li');
        
        if (statsBoxes.length >= 4) {
            // Violators
            const violatorsBox = statsBoxes[0];
            if (violatorsBox) {
                const h3 = violatorsBox.querySelector('h3');
                if (h3) h3.textContent = this.stats.violators || 0;
            }

            // Students
            const studentsBox = statsBoxes[1];
            if (studentsBox) {
                const h3 = studentsBox.querySelector('h3');
                if (h3) h3.textContent = this.stats.students || 0;
            }

            // Departments
            const departmentsBox = statsBoxes[2];
            if (departmentsBox) {
                const h3 = departmentsBox.querySelector('h3');
                if (h3) h3.textContent = this.stats.departments || 0;
            }

            // Penalties (using violations count)
            const penaltiesBox = statsBoxes[3];
            if (penaltiesBox) {
                const h3 = penaltiesBox.querySelector('h3');
                if (h3) h3.textContent = this.stats.violations || 0;
            }
        }
    }

    /**
     * Update charts with real data
     */
    updateCharts() {
        // Destroy existing charts
        if (typeof Chart !== 'undefined') {
            Chart.helpers.each(Chart.instances, (instance) => {
                instance.destroy();
            });
        }

        // Process violation data for charts
        const violationTypes = this.processViolationTypes();
        const departmentViolations = this.processDepartmentViolations();
        const monthlyTrends = this.processMonthlyTrends();

        // Update Violation Types Chart
        this.updateViolationTypesChart(violationTypes);

        // Update Department Violations Chart
        this.updateDepartmentViolationsChart(departmentViolations);

        // Update Monthly Trends Chart
        this.updateMonthlyTrendsChart(monthlyTrends);
    }

    /**
     * Process violation types from data
     */
    processViolationTypes() {
        const types = {};
        
        this.violations.forEach(violation => {
            const type = violation.violationType || violation.violation_type || 'Other';
            types[type] = (types[type] || 0) + 1;
        });

        // Get top 5 types
        const sorted = Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            labels: sorted.map(([label]) => label),
            data: sorted.map(([, count]) => count)
        };
    }

    /**
     * Process department violations from data
     */
    processDepartmentViolations() {
        const deptViolations = {};
        
        this.violations.forEach(violation => {
            const dept = violation.studentDept || violation.student_dept || violation.department || 'Unknown';
            deptViolations[dept] = (deptViolations[dept] || 0) + 1;
        });

        // Get top 6 departments
        const sorted = Object.entries(deptViolations)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        return {
            labels: sorted.map(([label]) => label),
            data: sorted.map(([, count]) => count)
        };
    }

    /**
     * Process monthly trends from data
     */
    processMonthlyTrends() {
        const monthlyData = {
            'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
            'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
        };

        this.violations.forEach(violation => {
            const dateStr = violation.violationDate || violation.violation_date || violation.dateReported || '';
            if (dateStr) {
                try {
                    const date = new Date(dateStr);
                    const month = date.toLocaleString('en-US', { month: 'short' });
                    if (monthlyData.hasOwnProperty(month)) {
                        monthlyData[month]++;
                    }
                } catch (e) {
                    // Invalid date, skip
                }
            }
        });

        return {
            labels: Object.keys(monthlyData),
            data: Object.values(monthlyData)
        };
    }

    /**
     * Update Violation Types Pie Chart
     */
    updateViolationTypesChart(data) {
        const ctx = document.getElementById('violationTypesChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const isDark = document.body.classList.contains('dark');
        const textColor = isDark ? '#ffffff' : '#333333';

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels.length > 0 ? data.labels : ['No Data'],
                datasets: [{
                    data: data.data.length > 0 ? data.data : [1],
                    backgroundColor: [
                        '#FFD700',
                        '#FFCE26',
                        '#FD7238',
                        '#1bb44eff',
                        '#6c757d'
                    ],
                    borderWidth: 2,
                    borderColor: isDark ? '#2d3748' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12 },
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update Department Violations Bar Chart
     */
    updateDepartmentViolationsChart(data) {
        const ctx = document.getElementById('departmentViolationsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const isDark = document.body.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#ffffff' : '#333333';
        const bgColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels.length > 0 ? data.labels : ['No Data'],
                datasets: [{
                    label: 'Violations',
                    data: data.data.length > 0 ? data.data : [0],
                    backgroundColor: [
                        '#FFD700',
                        '#FFCE26',
                        '#FD7238',
                        '#3fbe18ff',
                        '#DB504A',
                        '#6c757d'
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                        background: { color: bgColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }

    /**
     * Update Monthly Trends Line Chart
     */
    updateMonthlyTrendsChart(data) {
        const ctx = document.getElementById('monthlyTrendsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const isDark = document.body.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#ffffff' : '#333333';
        const bgColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Violations',
                    data: data.data,
                    borderColor: '#FFD700',
                    backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#FFD700',
                    pointBorderColor: isDark ? '#2d3748' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                        background: { color: bgColor }
                    },
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }

    /**
     * Update Recent Violators Table
     */
    updateRecentViolators() {
        const tbody = document.querySelector('.table-data .order table tbody');
        if (!tbody) return;

        // Get recent violations (last 5)
        const recentViolations = this.violations
            .sort((a, b) => {
                const dateA = new Date(a.violationDate || a.violation_date || a.dateReported || 0);
                const dateB = new Date(b.violationDate || b.violation_date || b.dateReported || 0);
                return dateB - dateA;
            })
            .slice(0, 5);

        tbody.innerHTML = '';

        if (recentViolations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No violations found</td></tr>';
            return;
        }

        recentViolations.forEach(violation => {
            const studentName = violation.studentName || 
                              `${violation.firstName || ''} ${violation.lastName || ''}`.trim() || 
                              'Unknown Student';
            const date = violation.violationDate || violation.violation_date || violation.dateReported || 'N/A';
            const status = violation.status || 'pending';
            const avatar = violation.studentImage || violation.avatar || '../app/assets/img/default.png';

            const statusClass = status === 'completed' || status === 'resolved' ? 'completed' :
                               status === 'warning' ? 'process' : 'pending';
            const statusText = status === 'completed' || status === 'resolved' ? 'Resolved' :
                              status === 'warning' ? 'Warning' :
                              status === 'disciplinary' ? 'Disciplinary Action' : 'Pending';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${avatar}" alt="Student Image" onerror="this.src='../app/assets/img/default.png'">
                    <p>${this.escapeHtml(studentName)}</p>
                </td>
                <td>${this.formatDate(date)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Update Top Violators List
     */
    updateTopViolators() {
        const violatorList = document.querySelector('.violators .violator-list');
        if (!violatorList) return;

        // Count violations per student
        const studentViolations = {};
        this.violations.forEach(violation => {
            const studentId = violation.studentId || violation.student_id;
            if (studentId) {
                if (!studentViolations[studentId]) {
                    studentViolations[studentId] = {
                        id: studentId,
                        name: violation.studentName || 
                              `${violation.firstName || ''} ${violation.lastName || ''}`.trim() || 
                              'Unknown Student',
                        count: 0
                    };
                }
                studentViolations[studentId].count++;
            }
        });

        // Sort by violation count and get top 5
        const topViolators = Object.values(studentViolations)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        violatorList.innerHTML = '';

        if (topViolators.length === 0) {
            violatorList.innerHTML = '<li style="padding: 20px; text-align: center;">No violators found</li>';
            return;
        }

        topViolators.forEach((violator, index) => {
            const priority = violator.count >= 10 ? 'high-priority' :
                            violator.count >= 5 ? 'medium-priority' : 'low-priority';

            const li = document.createElement('li');
            li.className = priority;
            li.innerHTML = `
                <div class="violator-info">
                    <span class="rank">${index + 1}</span>
                    <span class="name">${this.escapeHtml(violator.name)}</span>
                    <span class="violations">${violator.count} violation${violator.count !== 1 ? 's' : ''}</span>
                </div>
                <i class='bx bx-chevron-right'></i>
            `;
            violatorList.appendChild(li);
        });
    }

    /**
     * Update announcements on dashboard
     */
    updateAnnouncements() {
        const announcementsContent = document.getElementById('announcementsContent');
        if (!announcementsContent) return;

        if (this.announcements.length === 0) {
            announcementsContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--dark-grey);">
                    <i class='bx bx-info-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>No announcements available</p>
                </div>
            `;
            return;
        }

        announcementsContent.innerHTML = '';

        this.announcements.forEach(announcement => {
            const typeClass = announcement.type || 'info';
            const iconClass = typeClass === 'urgent' ? 'bxs-error-circle' : 
                             typeClass === 'warning' ? 'bxs-error' : 'bxs-info-circle';
            const timeAgo = this.getTimeAgo(announcement.created_at);

            const item = document.createElement('div');
            item.className = `announcement-item ${typeClass}`;
            item.innerHTML = `
                <div class="announcement-icon">
                    <i class='bx ${iconClass}'></i>
                </div>
                <div class="announcement-details">
                    <h4>${this.escapeHtml(announcement.title || 'Untitled')}</h4>
                    <p>${this.escapeHtml(announcement.message || '')}</p>
                    <span class="announcement-time">${timeAgo}</span>
                </div>
                <div class="announcement-actions">
                    <button class="btn-read-more" onclick="viewAnnouncement(${announcement.id})">Read More</button>
                </div>
            `;
            announcementsContent.appendChild(item);
        });
    }

    /**
     * Get time ago string
     */
    getTimeAgo(dateString) {
        if (!dateString) return 'Unknown time';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard data when page loads
let dashboardDataInstance = null;

function initDashboardData() {
    if (!dashboardDataInstance) {
        dashboardDataInstance = new DashboardData();
    }
    
    // Wait for dashboard content to load
    const checkInterval = setInterval(() => {
        const dashcontent = document.querySelector('.box-info');
        if (dashcontent) {
            clearInterval(checkInterval);
            dashboardDataInstance.loadAllData();
        }
    }, 100);
    
    // Also try after a delay
    setTimeout(() => {
        if (dashboardDataInstance && document.querySelector('.box-info')) {
            dashboardDataInstance.loadAllData();
        }
    }, 500);
}

// Export for global use
window.DashboardData = DashboardData;
window.initDashboardData = initDashboardData;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardData);
} else {
    initDashboardData();
}

