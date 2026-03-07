// reports.js - Complete working version
function initReportsModule() {
    console.log('🛠 Reports module initializing...');
    
    try {
        // Elements
        const tableBody = document.getElementById('ReportsTableBody');
        const btnGenerateReport = document.getElementById('btnGenerateReports');
        const btnGenerateFirst = document.getElementById('btnGenerateFirstReport');
        const btnExportReports = document.getElementById('btnExportReports');
        const btnPrintReports = document.getElementById('btnPrintReports');
        const btnRefreshReports = document.getElementById('btnRefreshReports');
        const generateModal = document.getElementById('ReportsGenerateModal');
        const detailsModal = document.getElementById('ReportDetailsModal');
        const closeGenerateBtn = document.getElementById('closeReportsModal');
        const closeDetailsBtn = document.getElementById('closeDetailsModal');
        const cancelGenerateBtn = document.getElementById('cancelReportsModal');
        const generateOverlay = document.getElementById('ReportsModalOverlay');
        const detailsOverlay = document.getElementById('DetailsModalOverlay');
        const generateForm = document.getElementById('ReportsGenerateForm');
        const searchInput = document.getElementById('searchReport');
        const deptFilter = document.getElementById('ReportsDepartmentFilter');
        const sectionFilter = document.getElementById('ReportsSectionFilter');
        const statusFilter = document.getElementById('ReportsStatusFilter');
        const timeFilter = document.getElementById('ReportsTimeFilter');
        const sortByFilter = document.getElementById('ReportsSortBy');
        const applyFiltersBtn = document.getElementById('applyFilters');
        const clearFiltersBtn = document.getElementById('clearFilters');
        const resetFiltersBtn = document.getElementById('resetFilters');
        const dateRangeGroup = document.getElementById('dateRangeGroup');
        const viewButtons = document.querySelectorAll('.Reports-view-btn');
        const paginationContainer = document.querySelector('.Reports-pagination');

        // Debug logging
        console.log('🔍 Generate button found:', btnGenerateReport);
        console.log('🔍 Generate modal found:', generateModal);

        if (!btnGenerateReport) {
            console.error('❌ #btnGenerateReports NOT FOUND!');
            return;
        }

        if (!generateModal) {
            console.error('❌ #ReportsGenerateModal NOT FOUND!');
            return;
        }

        // ========== API CONFIG ==========
        
        // Detect the correct API path based on current page location
        function getAPIBasePath() {
            const currentPath = window.location.pathname;
            console.log('📍 Current path:', currentPath);
            
            // Try to extract the base project path from the URL
            const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
            const projectBase = pathMatch ? pathMatch[1] : '';
            console.log('📁 Project base:', projectBase);
            
            // Use absolute path from project root for reliability
            if (projectBase) {
                return projectBase + '/api/';
            }
            
            // Fallback to relative paths
            if (currentPath.includes('/app/views/')) {
                return '../../api/';
            } else if (currentPath.includes('/includes/')) {
                return '../api/';
            } else {
                return 'api/';
            }
        }
        
        const API_BASE = getAPIBasePath();
        console.log('🔗 Reports API Base Path:', API_BASE);
        
        // ========== DATA ==========
        
        // Reports data loaded from API
        let reports = [];
        let allReports = []; // Store all reports for client-side filtering

        let currentPage = 1;
        let itemsPerPage = 10;
        let totalRecords = 0;
        let totalPages = 1;

        // ========== HELPER FUNCTIONS ==========
        
        function getDepartmentClass(deptCode) {
            const classes = {
                'BSIS': 'bsis',
                'WFT': 'wft',
                'BTVTED': 'btvted',
                'CHS': 'chs'
            };
            return classes[deptCode] || 'default';
        }

        function getStatusClass(status) {
            const classes = {
                'permitted': 'permitted',
                'warning': 'warning',
                'disciplinary': 'disciplinary'
            };
            return classes[status] || 'default';
        }

        function getCountBadgeClass(count) {
            if (count >= 3) return 'high';
            if (count >= 2) return 'medium';
            if (count >= 1) return 'low';
            return 'none';
        }

        function calculateStats(statsData = null) {
            // Use provided stats or calculate from current reports
            let totalViolations, uniformViolations, footwearViolations, noIdViolations, totalStudents;
            
            if (statsData) {
                totalViolations = statsData.totalViolations || 0;
                uniformViolations = statsData.uniformViolations || 0;
                footwearViolations = statsData.footwearViolations || 0;
                noIdViolations = statsData.noIdViolations || 0;
                totalStudents = statsData.totalStudents || reports.length;
            } else {
                totalViolations = reports.reduce((sum, report) => sum + report.totalViolations, 0);
                uniformViolations = reports.reduce((sum, report) => sum + report.uniformCount, 0);
                footwearViolations = reports.reduce((sum, report) => sum + report.footwearCount, 0);
                noIdViolations = reports.reduce((sum, report) => sum + report.noIdCount, 0);
                totalStudents = reports.length;
            }
            
            // Update stats cards
            const totalViolationsEl = document.getElementById('totalViolationsCount');
            const uniformViolationsEl = document.getElementById('uniformViolations');
            const footwearViolationsEl = document.getElementById('footwearViolations');
            const noIdViolationsEl = document.getElementById('noIdViolations');
            
            if (totalViolationsEl) totalViolationsEl.textContent = totalViolations;
            if (uniformViolationsEl) uniformViolationsEl.textContent = uniformViolations;
            if (footwearViolationsEl) footwearViolationsEl.textContent = footwearViolations;
            if (noIdViolationsEl) noIdViolationsEl.textContent = noIdViolations;
            
            // Calculate and update percentages
            const uniformPercentageEl = document.getElementById('uniformPercentage');
            const footwearPercentageEl = document.getElementById('footwearPercentage');
            const noIdPercentageEl = document.getElementById('noIdPercentage');
            
            if (uniformPercentageEl) {
                const percentage = totalViolations > 0 ? ((uniformViolations / totalViolations) * 100).toFixed(0) : 0;
                uniformPercentageEl.textContent = percentage + '%';
            }
            if (footwearPercentageEl) {
                const percentage = totalViolations > 0 ? ((footwearViolations / totalViolations) * 100).toFixed(0) : 0;
                footwearPercentageEl.textContent = percentage + '%';
            }
            if (noIdPercentageEl) {
                const percentage = totalViolations > 0 ? ((noIdViolations / totalViolations) * 100).toFixed(0) : 0;
                noIdPercentageEl.textContent = percentage + '%';
            }
            
            // Update footer stats
            const totalStudentsEl = document.getElementById('totalStudentsCount');
            const totalViolationsFooterEl = document.getElementById('totalViolationsFooter');
            const avgViolationsEl = document.getElementById('avgViolations');
            const totalReportsCountEl = document.getElementById('totalReportsCount');
            
            if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
            if (totalViolationsFooterEl) totalViolationsFooterEl.textContent = totalViolations;
            if (avgViolationsEl) avgViolationsEl.textContent = totalStudents > 0 ? (totalViolations / totalStudents).toFixed(1) : '0';
            if (totalReportsCountEl) totalReportsCountEl.textContent = totalStudents;
        }
        
        // ========== CHART FUNCTIONS ==========
        // Charts removed as per request
        
        function initCharts() {
            // Functionality removed
        }

        function updateCharts(data) {
            // Functionality removed
        }

        // ========== API FUNCTIONS ==========
        
        async function loadReports(showLoading = true) {
            try {
                if (showLoading) {
                    if (tableBody) {
                        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px;">Loading reports...</td></tr>';
                    }
                }
                
                console.log('🔄 Loading reports from API...');
                
                // Build query parameters
                const params = new URLSearchParams();
                const deptValue = deptFilter ? deptFilter.value : 'all';
                const sectionValue = sectionFilter ? sectionFilter.value : 'all';
                const statusValue = statusFilter ? statusFilter.value : 'all';
                const timeValue = timeFilter ? timeFilter.value : 'all';
                const searchValue = searchInput ? searchInput.value.trim() : '';
                
                if (deptValue !== 'all') params.append('department', deptValue);
                if (sectionValue !== 'all') params.append('section', sectionValue);
                if (statusValue !== 'all') params.append('status', statusValue);
                if (searchValue) params.append('search', searchValue);
                
                // Handle time period
                if (timeValue && timeValue !== 'all' && timeValue !== 'custom') {
                    params.append('timePeriod', timeValue);
                } else if (timeValue === 'custom') {
                    const startDate = document.getElementById('ReportsStart')?.value;
                    const endDate = document.getElementById('ReportsEnd')?.value;
                    if (startDate) params.append('startDate', startDate);
                    if (endDate) params.append('endDate', endDate);
                }
                
                const queryString = params.toString();
                const url = API_BASE + 'reports.php' + (queryString ? '?' + queryString : '');
                
                console.log('📡 Fetching from:', url);
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                console.log('📊 API Response:', data);
                
                if (data.status === 'error') {
                    console.error('❌ API Error:', data.message);
                    throw new Error(data.message || 'API returned error status');
                }
                
                // Store all reports
                allReports = data.reports || data.data || [];
                reports = [...allReports]; // Copy for filtering
                
                console.log(`✅ Loaded ${reports.length} reports from database`);
                
                if (reports.length === 0) {
                    console.warn('⚠️ No reports found. This could mean:');
                    console.warn('  1. No violations exist in the database');
                    console.warn('  2. Filters are too restrictive');
                    console.warn('  3. No students have violations');
                    console.warn('  4. student_id mismatch between violations and students tables');
                    console.warn('💡 Try: Clear all filters and check if violations exist in the Violations page');
                    
                    // Show helpful message in table
                    if (tableBody) {
                        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 40px;">
                            <div style="font-size: 1.2em; color: #666; margin-bottom: 10px;">
                                <i class='bx bx-info-circle' style="font-size: 2em; color: #4a90e2;"></i>
                            </div>
                            <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 10px; color: #333;">
                                No Reports Found
                            </div>
                            <div style="color: #666; line-height: 1.6;">
                                <p>There are no violation reports to display. This could mean:</p>
                                <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                                    <li>No violations have been recorded in the database</li>
                                    <li>The current filters are too restrictive</li>
                                    <li>No students have violations matching the criteria</li>
                                </ul>
                                <p style="margin-top: 15px;">
                                    <strong>Tip:</strong> Go to the <strong>Violations</strong> page to add violations, 
                                    or try clearing your filters.
                                </p>
                            </div>
                        </td></tr>`;
                    }
                }
                
                // Update stats if provided
                if (data.stats) {
                    calculateStats(data.stats);
                } else {
                    calculateStats();
                }
                
                // Apply client-side filtering and sorting
            updateCharts(reports); // Initial chart update with all data
            renderReports();
        } catch (error) {
                console.error('❌ Error loading reports:', error);
                console.error('Error details:', error.stack);
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px; color: #e74c3c;">
                        <div style="margin-bottom: 10px;">❌ Error loading reports: ${error.message}</div>
                        <div style="font-size: 0.9em; color: #666;">Check browser console for details</div>
                    </td></tr>`;
                }
                // Set empty stats
                calculateStats({
                    totalViolations: 0,
                    uniformViolations: 0,
                    footwearViolations: 0,
                    noIdViolations: 0,
                    totalStudents: 0
                });
            }
        }

        // ========== RENDER FUNCTIONS ==========
        
        function renderReports() {
            if (!tableBody) return;
            
            // Client-side filtering for search and sort (department, section, status are handled by API)
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const sortValue = sortByFilter ? sortByFilter.value : 'total_desc';
            
            let filteredReports = reports;
            
            // Apply search filter (client-side)
            if (searchTerm) {
                filteredReports = filteredReports.filter(report => {
                    return report.studentName.toLowerCase().includes(searchTerm) || 
                           report.reportId.toLowerCase().includes(searchTerm) ||
                           report.studentId.toLowerCase().includes(searchTerm);
                });
            }

            // Sort reports
            filteredReports.sort((a, b) => {
                switch(sortValue) {
                    case 'total_desc':
                        return b.totalViolations - a.totalViolations;
                    case 'total_asc':
                        return a.totalViolations - b.totalViolations;
                    case 'name_asc':
                        return a.studentName.localeCompare(b.studentName);
                    case 'name_desc':
                        return b.studentName.localeCompare(a.studentName);
                    case 'dept_asc':
                        return a.department.localeCompare(b.department);
                    case 'section_asc':
                        return a.section.localeCompare(b.section);
                    default:
                        return b.id - a.id;
                }
            });

            // Update charts with filtered data
            updateCharts(filteredReports);

            totalRecords = filteredReports.length;
            totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;
            if (currentPage > totalPages) currentPage = totalPages;
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = filteredReports.slice(start, end);

            // Show/hide empty state
            const emptyState = document.getElementById('ReportsEmptyState');
            if (emptyState) {
                if (filteredReports.length === 0 && reports.length === 0) {
                    emptyState.style.display = 'flex';
                } else if (filteredReports.length === 0 && reports.length > 0) {
                    emptyState.style.display = 'none';
                    // Show message in table instead
                    if (tableBody && tableBody.innerHTML.trim() === '') {
                        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px; color: #666;">
                            No reports match the current filters. Try adjusting your search or filter criteria.
                        </td></tr>`;
                    }
                } else {
                    emptyState.style.display = 'none';
                }
            }

            tableBody.innerHTML = pageItems.map(report => {
                const deptClass = getDepartmentClass(report.deptCode);
                const statusClass = getStatusClass(report.status);
                const uniformClass = getCountBadgeClass(report.uniformCount);
                const footwearClass = getCountBadgeClass(report.footwearCount);
                const noIdClass = getCountBadgeClass(report.noIdCount);
                const totalClass = getCountBadgeClass(report.totalViolations);
                
                return `
                <tr data-id="${report.id}">
                    <td class="report-id" data-label="Report ID">${report.reportId}</td>
                    <td class="report-student-info" data-label="Student">
                        <div class="student-info-wrapper">
                            <div class="student-avatar">
                                <img src="${report.studentImage}" 
                                     alt="${report.studentName}" 
                                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(report.studentName)}&background=ffd700&color=333&size=32'">
                            </div>
                            <div class="student-details">
                                <strong>${report.studentName}</strong>
                                <small>${report.studentId} • ${report.section || 'N/A'}</small>
                            </div>
                        </div>
                    </td>
                    <td class="report-dept" data-label="Department">
                        <span class="dept-badge ${deptClass}">${report.department}</span>
                    </td>
                    <td class="report-section" data-label="Section">${report.section}</td>
                    <td class="report-yearlevel" data-label="Year Level">
                        <span class="yearlevel-badge">${report.yearlevel || 'N/A'}</span>
                    </td>
                    <td class="violation-count uniform" data-label="Uniform">
                        <div class="count-badge ${uniformClass}">${report.uniformCount}</div>
                    </td>
                    <td class="violation-count footwear" data-label="Footwear">
                        <div class="count-badge ${footwearClass}">${report.footwearCount}</div>
                    </td>
                    <td class="violation-count no-id" data-label="No ID">
                        <div class="count-badge ${noIdClass}">${report.noIdCount}</div>
                    </td>
                    <td class="total-violations" data-label="Total">
                        <div class="total-badge ${totalClass}">${report.totalViolations}</div>
                    </td>
                    <td data-label="Status">
                        <span class="Reports-status-badge ${statusClass}">${report.statusLabel}</span>
                    </td>
                    <td data-label="Actions">
                        <div class="Reports-action-buttons">
                            <button class="Reports-action-btn view" data-id="${report.id}" title="View Details">
                                <i class='bx bx-show'></i>
                            </button>
                            <button class="Reports-action-btn export" data-id="${report.id}" title="Export Report">
                                <i class='bx bx-download'></i>
                            </button>
                            <button class="Reports-action-btn print" data-id="${report.id}" title="Print Report">
                                <i class='bx bx-printer'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join('');

            calculateStats();
            const showingEl = document.getElementById('showingReportsCount');
            const totalEl = document.getElementById('totalReportsCount');
            if (showingEl) showingEl.textContent = pageItems.length;
            if (totalEl) totalEl.textContent = totalRecords;

            renderReportsPagination();
        }

        function renderReportsPagination() {
            if (!paginationContainer) return;
            paginationContainer.innerHTML = '';

            const makeBtn = (label, opts = {}) => {
                const btn = document.createElement('button');
                btn.className = 'Reports-pagination-btn' + (opts.active ? ' active' : '');
                btn.textContent = label;
                if (opts.disabled) btn.disabled = true;
                if (opts.page) btn.dataset.page = String(opts.page);
                if (opts.action) btn.dataset.action = opts.action;
                return btn;
            };

            paginationContainer.appendChild(makeBtn('‹', { disabled: currentPage === 1, action: 'prev' }));

            const maxButtons = 7;
            let startPage = Math.max(1, currentPage - 3);
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);
            if (endPage - startPage + 1 < maxButtons) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }

            for (let p = startPage; p <= endPage; p++) {
                paginationContainer.appendChild(makeBtn(String(p), { active: p === currentPage, page: p }));
            }

            paginationContainer.appendChild(makeBtn('›', { disabled: currentPage === totalPages, action: 'next' }));
        }

        function handlePaginationClick(e) {
            const target = e.target.closest('button');
            if (!target) return;
            const action = target.dataset.action;
            const pageAttr = target.dataset.page;
            if (action === 'prev') {
                if (currentPage > 1) currentPage--;
            } else if (action === 'next') {
                if (currentPage < totalPages) currentPage++;
            } else if (pageAttr) {
                const pageNum = parseInt(pageAttr, 10);
                if (!isNaN(pageNum)) currentPage = pageNum;
            } else {
                return;
            }
            renderReports();
        }

        // ========== MODAL FUNCTIONS ==========
        
        function openGenerateModal() {
            console.log('🎯 Opening generate report modal...');
            generateModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Set default dates
            const today = new Date();
            const startDate = document.getElementById('startDate');
            const endDate = document.getElementById('endDate');
            
            if (startDate) {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate.value = firstDay.toISOString().split('T')[0];
            }
            
            if (endDate) {
                endDate.value = today.toISOString().split('T')[0];
            }
        }

        function openDetailsModal(reportId) {
            if (!detailsModal) return;
            
            const report = reports.find(r => r.id === reportId);
            if (!report) {
                console.error('Report not found:', reportId);
                return;
            }
            
            // Populate report header
            const reportHeader = detailsModal.querySelector('.report-header h3');
            if (reportHeader) {
                reportHeader.textContent = `Student Violation Analysis Report - ${report.studentName}`;
            }
            
            const reportIdEl = detailsModal.querySelector('.report-id');
            if (reportIdEl) {
                reportIdEl.textContent = `Report ID: ${report.reportId}`;
            }
            
            const reportDateEl = detailsModal.querySelector('.report-date');
            if (reportDateEl) {
                reportDateEl.textContent = `Generated: ${new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            }
            
            // Populate student info
            const studentInfoGrid = detailsModal.querySelector('.student-info-grid');
            if (studentInfoGrid) {
                studentInfoGrid.innerHTML = `
                    <div class="info-item">
                        <span class="info-label">Student Name:</span>
                        <span class="info-value">${report.studentName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Student ID:</span>
                        <span class="info-value">${report.studentId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Department:</span>
                        <span class="info-value">${report.department}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Section:</span>
                        <span class="info-value">${report.section}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Year Level:</span>
                        <span class="info-value">${report.yearlevel || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Contact No:</span>
                        <span class="info-value">${report.studentContact}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Report Period:</span>
                        <span class="info-value">${report.lastUpdated ? new Date(report.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                `;
            }
            
            // Populate violation statistics
            const statsGrid = detailsModal.querySelector('.stats-grid');
            if (statsGrid) {
                statsGrid.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class='bx bx-t-shirt'></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-title">Uniform Violations</span>
                            <span class="stat-value">${report.uniformCount}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class='bx bx-walk'></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-title">Footwear Violations</span>
                            <span class="stat-value">${report.footwearCount}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class='bx bx-id-card'></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-title">No ID Violations</span>
                            <span class="stat-value">${report.noIdCount}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class='bx bx-bar-chart-alt'></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-title">Total Violations</span>
                            <span class="stat-value">${report.totalViolations}</span>
                        </div>
                    </div>
                `;
            }
            
            // Populate timeline
            const timelineEl = detailsModal.querySelector('.timeline');
            if (timelineEl) {
                if (report.history && report.history.length > 0) {
                    timelineEl.innerHTML = report.history.map(item => `
                        <div class="timeline-item">
                            <div class="timeline-date">${item.date}</div>
                            <div class="timeline-content">
                                <span class="timeline-title">${item.title}</span>
                                <span class="timeline-desc">${item.desc}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    timelineEl.innerHTML = '<div class="timeline-item"><div class="timeline-content">No violation history available</div></div>';
                }
            }
            
            // Populate recommendations
            const recommendationsEl = detailsModal.querySelector('.recommendations-list');
            if (recommendationsEl) {
                if (report.recommendations && report.recommendations.length > 0) {
                    recommendationsEl.innerHTML = report.recommendations.map(rec => `
                        <div class="recommendation-item">
                            <i class='bx bx-check-circle'></i>
                            <span>${rec}</span>
                        </div>
                    `).join('');
                } else {
                    recommendationsEl.innerHTML = '<div class="recommendation-item"><span>No recommendations at this time</span></div>';
                }
            }
            
            detailsModal.dataset.viewingId = reportId;
            detailsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeGenerateModal() {
            console.log('Closing generate modal');
            generateModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Reset form if exists
            const form = document.getElementById('ReportsGenerateForm');
            if (form) form.reset();
        }

        function closeDetailsModal() {
            if (!detailsModal) return;
            detailsModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            delete detailsModal.dataset.viewingId;
        }

        // ========== EVENT HANDLERS ==========
        
        function handleTableClick(e) {
            const viewBtn = e.target.closest('.Reports-action-btn.view');
            const exportBtn = e.target.closest('.Reports-action-btn.export');
            const printBtn = e.target.closest('.Reports-action-btn.print');

            if (viewBtn) {
                const id = parseInt(viewBtn.dataset.id);
                openDetailsModal(id);
            }

            if (exportBtn) {
                const id = parseInt(exportBtn.dataset.id);
                const report = reports.find(r => r.id === id);
                if (report) {
                    downloadSingleReport(report);
                }
            }

            if (printBtn) {
                const id = parseInt(printBtn.dataset.id);
                const report = reports.find(r => r.id === id);
                if (report) {
                    printReport(report);
                }
            }
        }

        function handleStudentSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            renderReports();
        }

        // ========== EVENT LISTENERS ==========
        
        // 1. OPEN GENERATE MODAL
        if (btnGenerateReport) {
            btnGenerateReport.addEventListener('click', openGenerateModal);
            console.log('✅ Added click event to btnGenerateReports');
        }

        // 2. OPEN GENERATE MODAL (FIRST REPORT)
        if (btnGenerateFirst) {
            btnGenerateFirst.addEventListener('click', openGenerateModal);
            console.log('✅ Added click event to btnGenerateFirstReport');
        }

        // 3. EXPORT REPORTS
        if (btnExportReports) {
            btnExportReports.addEventListener('click', function() {
                downloadAllReports();
            });
        }

        // 4. PRINT REPORTS
        if (btnPrintReports) {
            btnPrintReports.addEventListener('click', function() {
                printAllReports();
            });
        }

        // 5. REFRESH REPORTS
        if (btnRefreshReports) {
            btnRefreshReports.addEventListener('click', function() {
                loadReports(true);
            });
        }

        // 6. CLOSE MODAL BUTTONS
        if (closeGenerateBtn) {
            closeGenerateBtn.addEventListener('click', closeGenerateModal);
            console.log('✅ Added click event to closeReportsModal');
        }

        if (cancelGenerateBtn) {
            cancelGenerateBtn.addEventListener('click', closeGenerateModal);
            console.log('✅ Added click event to cancelReportsModal');
        }

        if (generateOverlay) {
            generateOverlay.addEventListener('click', closeGenerateModal);
            console.log('✅ Added click event to ReportsModalOverlay');
        }

        if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeDetailsModal);
        if (detailsOverlay) detailsOverlay.addEventListener('click', closeDetailsModal);

        // 7. ESCAPE KEY TO CLOSE MODAL
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (generateModal && generateModal.classList.contains('active')) {
                    closeGenerateModal();
                }
                if (detailsModal && detailsModal.classList.contains('active')) {
                    closeDetailsModal();
                }
            }
        });

        // 8. TABLE EVENT LISTENERS
        if (tableBody) {
            tableBody.addEventListener('click', handleTableClick);
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', handlePaginationClick);
        }

        // 9. SEARCH FUNCTIONALITY
        if (searchInput) {
            searchInput.addEventListener('input', () => { currentPage = 1; handleStudentSearch(); });
        }

        // 10. FILTER FUNCTIONALITY
        if (deptFilter) {
            deptFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports(true);
            });
        }

        if (sectionFilter) {
            sectionFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports(true);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                currentPage = 1;
                loadReports(true);
            });
        }

        if (timeFilter) {
            timeFilter.addEventListener('change', function() {
                if (this.value === 'custom') {
                    if (dateRangeGroup) dateRangeGroup.style.display = 'block';
                } else {
                    if (dateRangeGroup) dateRangeGroup.style.display = 'none';
                    currentPage = 1;
                    loadReports(true);
                }
            });
        }

        if (sortByFilter) {
            sortByFilter.addEventListener('change', () => { currentPage = 1; renderReports(); });
        }

        // 11. APPLY FILTERS BUTTON
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                currentPage = 1;
                loadReports(true);
            });
        }

        // 12. CLEAR FILTERS BUTTON
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function() {
                if (deptFilter) deptFilter.value = 'all';
                if (sectionFilter) sectionFilter.value = 'all';
                if (statusFilter) statusFilter.value = 'all';
                if (timeFilter) timeFilter.value = 'today';
                if (sortByFilter) sortByFilter.value = 'total_desc';
                if (dateRangeGroup) dateRangeGroup.style.display = 'none';
                if (searchInput) searchInput.value = '';
                currentPage = 1;
                loadReports(true);
            });
        }

        // 13. RESET FILTERS BUTTON
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                if (deptFilter) deptFilter.value = 'all';
                if (sectionFilter) sectionFilter.value = 'all';
                if (statusFilter) statusFilter.value = 'all';
                currentPage = 1;
                loadReports(true);
            });
        }

        // 14. FORM SUBMISSION
        if (generateForm) {
            generateForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const reportName = document.getElementById('reportName').value.trim();
                const reportType = document.getElementById('reportType').value;
                const reportFormat = document.getElementById('reportFormat').value;
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                
                if (!reportName || !reportType || !reportFormat || !startDate || !endDate) {
                    alert('Please fill in all required fields.');
                    return;
                }

                try {
                    // Generate reports from violations
                    const params = new URLSearchParams();
                    params.append('generate', 'true');
                    if (startDate) params.append('startDate', startDate);
                    if (endDate) params.append('endDate', endDate);
                    
                    if (reportFormat) params.append('reportFormat', reportFormat);
                    if (reportType) params.append('reportType', reportType);

                    // Add filters
                    const departments = Array.from(document.querySelectorAll('input[name="departments"]:checked'))
                        .map(cb => cb.value).join(',');
                    if (departments) params.append('departments', departments);

                    const violationTypes = Array.from(document.querySelectorAll('input[name="violationTypes"]:checked'))
                        .map(cb => cb.value).join(',');
                    if (violationTypes) params.append('violationTypes', violationTypes);

                    const response = await fetch(API_BASE + 'reports.php?' + params.toString());
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        // Use message from server
                        alert(data.message || `Reports generated successfully!\nGenerated: ${data.generated}\nUpdated: ${data.updated}\nTotal: ${data.total}`);
                        
                        // Check for download URL (CSV/Excel)
                        if (data.downloadUrl) {
                            window.location.href = API_BASE + data.downloadUrl;
                        }

                        // Check for client-side download (PDF/DOCX)
                    if (reportFormat === 'pdf' || reportFormat === 'docx') {
                         if (data.reports && data.reports.length > 0) {
                             const includeCharts = document.getElementById('includeCharts') ? document.getElementById('includeCharts').checked : false;
                             
                             if (reportFormat === 'pdf') {
                                 downloadPDF(data.reports, reportName || 'Violation Report', includeCharts);
                             } else if (reportFormat === 'docx') {
                                 downloadDOCX(data.reports, reportName || 'Violation Report', includeCharts);
                             }
                         } else {
                             alert('No reports found to export for the selected criteria.');
                         }
                    }
                        
                        closeGenerateModal();
                        // Reload reports
                        loadReports(true);
                    } else {
                        alert('Error generating reports: ' + (data.message || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error generating reports:', error);
                    alert('Error generating reports: ' + error.message);
                }
            });
        }

        // 15. VIEW OPTIONS (Table/Grid/Card view)
        if (viewButtons.length > 0) {
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const view = this.dataset.view;
                    
                    // Remove active class from all buttons
                    viewButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    // For now, just log the view change
                    console.log(`Switched to ${view} view`);
                    alert(`Switched to ${view} view (Note: Grid/Card view implementation would go here)`);
                });
            });
        }

        // 16. DETAILS MODAL ACTION BUTTONS
        const detailExportBtn = document.getElementById('detailExportBtn');
        const detailPrintBtn = document.getElementById('detailPrintBtn');
        const detailEditBtn = document.getElementById('detailEditBtn');
        const detailShareBtn = document.getElementById('detailShareBtn');
        const detailDownloadBtn = document.getElementById('detailDownloadBtn');

        if (detailExportBtn) {
            detailExportBtn.addEventListener('click', function() {
                const reportId = detailsModal.dataset.viewingId;
                const report = reports.find(r => r.id === parseInt(reportId));
                if (report) {
                    downloadSingleReport(report);
                }
            });
        }

        if (detailPrintBtn) {
            detailPrintBtn.addEventListener('click', function() {
                const reportId = detailsModal.dataset.viewingId;
                const report = reports.find(r => r.id === parseInt(reportId));
                if (report) {
                    printReport(report);
                }
            });
        }

        if (detailEditBtn) {
            detailEditBtn.addEventListener('click', function() {
                alert('Edit report feature would open here');
            });
        }

        if (detailShareBtn) {
            detailShareBtn.addEventListener('click', function() {
                alert('Share report feature would open here');
            });
        }

        if (detailDownloadBtn) {
            detailDownloadBtn.addEventListener('click', function() {
                const reportId = detailsModal.dataset.viewingId;
                const report = reports.find(r => r.id === parseInt(reportId));
                if (report) {
                    downloadSingleReport(report);
                }
            });
        }

        // ========== UTILITY FUNCTIONS ==========
        
        function csvEscape(value) {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (/[",\n]/.test(str)) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }

        async function loadImage(url) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => {
                    console.warn('Could not load image:', url);
                    resolve(null);
                }
                img.src = url;
            });
        }

        async function createChartImage(type, data, options) {
            return new Promise((resolve) => {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'absolute';
                wrapper.style.left = '-9999px';
                wrapper.style.top = '-9999px';
                wrapper.style.width = '600px';
                wrapper.style.height = '400px';
                document.body.appendChild(wrapper);

                const canvas = document.createElement('canvas');
                wrapper.appendChild(canvas);

                const chart = new Chart(canvas, {
                    type: type,
                    data: data,
                    options: {
                        ...options,
                        animation: false,
                        responsive: false,
                        maintainAspectRatio: false,
                        devicePixelRatio: 2
                    }
                });

                // Small delay to ensure render
                setTimeout(() => {
                    const imgData = canvas.toDataURL('image/png');
                    chart.destroy();
                    document.body.removeChild(wrapper);
                    resolve(imgData);
                }, 100);
            });
        }

        async function downloadPDF(reportsData, filenamePrefix, includeCharts = false) {
            if (!window.jspdf) {
                alert('PDF library not loaded. Please refresh the page.');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const now = new Date();
            
            // --- Header Design ---
            const logoPath = '/OSAS_WEB/app/assets/img/default.png';
            const logoData = await loadImage(logoPath);

            // Left Side: Logo & Institution Name
            if (logoData) {
                doc.addImage(logoData, 'PNG', 14, 10, 20, 20);
                
                doc.setFontSize(18);
                doc.setTextColor(44, 62, 80); // Dark Blue-Gray
                doc.setFont("helvetica", "bold");
                doc.text("E-OSAS SYSTEM", 40, 18);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(127, 140, 141); // Gray
                doc.text("Office of Student Affairs and Services", 40, 24);
            } else {
                // Fallback Layout
                doc.setFontSize(22);
                doc.setTextColor(44, 62, 80);
                doc.setFont("helvetica", "bold");
                doc.text("E-OSAS SYSTEM", 14, 20);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(127, 140, 141);
                doc.text("Office of Student Affairs and Services", 14, 28);
            }

            // Right Side: Report Title & Date
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185); // Accent Blue
            doc.setFont("helvetica", "bold");
            doc.text("VIOLATION REPORT", 196, 18, { align: 'right' });

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 196, 24, { align: 'right' });

            // Divider Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 35, 196, 35);
            
            // Summary Stats
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Total Records: ${reportsData.length}`, 14, 45);
            
            let startY = 50;

            // Table
            const tableColumn = ["Student ID", "Name", "Dept", "Section", "Uniform", "Footwear", "No ID", "Total", "Status"];
            const tableRows = [];

            reportsData.forEach(report => {
                const reportData = [
                    report.studentId,
                    report.studentName,
                    report.department,
                    report.section,
                    report.uniformCount,
                    report.footwearCount,
                    report.noIdCount,
                    report.totalViolations,
                    report.statusLabel
                ];
                tableRows.push(reportData);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: startY,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
                headStyles: { 
                    fillColor: [245, 245, 245], 
                    textColor: [44, 62, 80], 
                    fontStyle: 'bold',
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200]
                },
                columnStyles: {
                    0: { cellWidth: 25 }, // Student ID
                    1: { cellWidth: 'auto' }, // Name
                    7: { halign: 'center' }, // Total
                    8: { halign: 'center' }  // Status
                },
                alternateRowStyles: { fillColor: [255, 255, 255] },
                margin: { top: 60 }
            });

            // Charts Section (Bottom)
            if (includeCharts) {
                try {
                    let finalY = doc.lastAutoTable.finalY + 20;
                    
                    // Check if we need a new page for charts
                    if (finalY + 100 > 280) {
                        doc.addPage();
                        finalY = 20;
                    }

                    // Section Title
                    doc.setFontSize(16);
                    doc.setTextColor(41, 128, 185);
                    doc.text("Visual Analysis", 105, finalY, { align: 'center' });
                    doc.setDrawColor(200, 200, 200);
                    doc.line(70, finalY + 2, 140, finalY + 2); // Underline
                    
                    finalY += 15;

                    // Department Data
                    const deptCounts = {};
                    reportsData.forEach(r => {
                        const dept = r.department || 'Unknown';
                        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                    });

                    const deptChartData = {
                        labels: Object.keys(deptCounts),
                        datasets: [{
                            data: Object.values(deptCounts),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#76A346']
                        }]
                    };
                    
                    // Type Data
                    const typeCounts = { uniform: 0, footwear: 0, noId: 0 };
                    reportsData.forEach(r => {
                        typeCounts.uniform += parseInt(r.uniformCount) || 0;
                        typeCounts.footwear += parseInt(r.footwearCount) || 0;
                        typeCounts.noId += parseInt(r.noIdCount) || 0;
                    });

                    const typeChartData = {
                        labels: ['Uniform', 'Footwear', 'No ID'],
                        datasets: [{
                            label: 'Violations',
                            data: [typeCounts.uniform, typeCounts.footwear, typeCounts.noId],
                            backgroundColor: ['#4e73df', '#f6c23e', '#e74a3b']
                        }]
                    };

                    // Generate Images
                    const deptImg = await createChartImage('doughnut', deptChartData, { 
                        plugins: { 
                            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } },
                            title: { display: true, text: 'By Department' }
                        } 
                    });
                    const typeImg = await createChartImage('bar', typeChartData, { 
                        plugins: { 
                            legend: { display: false },
                            title: { display: true, text: 'By Violation Type' }
                        } 
                    });

                    // Add to PDF (Side by Side)
                    // Page width is 210mm. Margins 14mm. Usable ~180mm.
                    // Each chart 85mm wide.
                    
                    doc.addImage(deptImg, 'PNG', 14, finalY, 85, 60);
                    doc.addImage(typeImg, 'PNG', 110, finalY, 85, 60);
                    
                    // Add captions/titles manually if needed, but chart title plugin handles it cleaner inside the image
                    
                } catch (e) {
                    console.error('Error adding charts to PDF:', e);
                }
            }

            doc.save(`${filenamePrefix}_${now.toISOString().slice(0, 10)}.pdf`);
        }

        async function downloadDOCX(reportsData, filenamePrefix, includeCharts = false) {
            if (!window.docx) {
                alert('DOCX library not loaded. Please refresh the page.');
                return;
            }
            
            const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, TextRun } = window.docx;
            const now = new Date();
            
            // Table Header
            const tableHeader = new TableRow({
                children: [
                    "Student ID", "Name", "Dept", "Section", "Uniform", "Footwear", "No ID", "Total", "Status"
                ].map(text => new TableCell({
                    children: [new Paragraph({ text, bold: true, size: 20 })], // size is in half-points
                    width: { size: 100 / 9, type: WidthType.PERCENTAGE },
                    shading: { fill: "E0E0E0" }
                }))
            });
            
            // Table Rows
            const tableRows = reportsData.map(report => new TableRow({
                children: [
                    report.studentId,
                    report.studentName,
                    report.department,
                    report.section,
                    String(report.uniformCount),
                    String(report.footwearCount),
                    String(report.noIdCount),
                    String(report.totalViolations),
                    report.statusLabel
                ].map(text => new TableCell({
                    children: [new Paragraph({ text: text || "", size: 18 })],
                    width: { size: 100 / 9, type: WidthType.PERCENTAGE }
                }))
            }));

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "Student Violation Report",
                            heading: HeadingLevel.HEADING_1,
                            alignment: "center"
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Generated: ${now.toLocaleString()}`,
                                    italics: true,
                                    color: "666666"
                                })
                            ],
                            alignment: "center",
                            spacing: { after: 400 }
                        }),
                        new Paragraph({
                            text: `Total Students: ${reportsData.length}`,
                            spacing: { after: 200 }
                        }),
                        new Table({
                            rows: [tableHeader, ...tableRows],
                            width: { size: 100, type: WidthType.PERCENTAGE }
                        })
                    ]
                }]
            });

            Packer.toBlob(doc).then(blob => {
                if (typeof saveAs === 'function') {
                    saveAs(blob, `${filenamePrefix}_${now.toISOString().slice(0, 10)}.docx`);
                } else {
                    console.error('FileSaver.js not loaded');
                    alert('Error: FileSaver.js not loaded');
                }
            });
        }

        function downloadSingleReport(report) {
            const lines = [];
            const now = new Date();
            lines.push('Student Violation Report');
            lines.push('Generated,' + csvEscape(now.toLocaleString()));
            lines.push('');
            lines.push([
                'Report ID',
                'Student ID',
                'Student Name',
                'Department',
                'Section',
                'Year Level',
                'Uniform Violations',
                'Footwear Violations',
                'No ID Violations',
                'Total Violations',
                'Status'
            ].map(csvEscape).join(','));
            lines.push([
                report.reportId,
                report.studentId,
                report.studentName,
                report.department,
                report.section,
                report.yearlevel || '',
                report.uniformCount,
                report.footwearCount,
                report.noIdCount,
                report.totalViolations,
                report.statusLabel
            ].map(csvEscape).join(','));
            lines.push('');
            lines.push('Violation History');
            lines.push(['Date', 'Violation', 'Description'].map(csvEscape).join(','));
            if (Array.isArray(report.history)) {
                report.history.forEach(item => {
                    lines.push([
                        item.date,
                        item.title,
                        item.desc
                    ].map(csvEscape).join(','));
                });
            }
            const csvContent = lines.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const fileName = 'report_' + (report.reportId || report.id || 'student') + '.csv';
            if (typeof saveAs === 'function') {
                saveAs(blob, fileName);
            } else {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }

        function downloadAllReports() {
            if (!Array.isArray(reports) || reports.length === 0) return;
            const lines = [];
            const now = new Date();
            lines.push('All Student Violation Reports');
            lines.push('Generated,' + csvEscape(now.toLocaleString()));
            lines.push('');
            lines.push([
                'Report ID',
                'Student ID',
                'Student Name',
                'Department',
                'Section',
                'Year Level',
                'Uniform Violations',
                'Footwear Violations',
                'No ID Violations',
                'Total Violations',
                'Status'
            ].map(csvEscape).join(','));
            reports.forEach(report => {
                lines.push([
                    report.reportId,
                    report.studentId,
                    report.studentName,
                    report.department,
                    report.section,
                    report.yearlevel || '',
                    report.uniformCount,
                    report.footwearCount,
                    report.noIdCount,
                    report.totalViolations,
                    report.statusLabel
                ].map(csvEscape).join(','));
            });
            const csvContent = lines.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const fileName = 'reports_export_' + now.toISOString().slice(0, 10) + '.csv';
            if (typeof saveAs === 'function') {
                saveAs(blob, fileName);
            } else {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }

        function printReport(report) {
            const printContent = `
                <html>
                    <head>
                        <title>Violation Report - ${report.studentName}</title>
                        <style>
                            body { font-family: 'Segoe UI', sans-serif; margin: 40px; }
                            h1 { color: #333; margin-bottom: 10px; }
                            h2 { color: #555; margin-bottom: 20px; }
                            .report-header { margin-bottom: 30px; }
                            .report-info { margin-bottom: 20px; }
                            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
                            .info-item { margin-bottom: 8px; }
                            .info-label { font-weight: 600; color: #666; }
                            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                            .stat-title { font-size: 14px; color: #666; margin-bottom: 5px; }
                            .stat-value { font-size: 24px; font-weight: 700; color: #333; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f8f9fa; font-weight: 600; }
                        </style>
                    </head>
                    <body>
                        <div class="report-header">
                            <h1>Student Violation Report</h1>
                            <p>Report ID: ${report.reportId}</p>
                            <p>Generated: ${new Date().toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                            })}</p>
                        </div>
                        
                        <div class="report-info">
                            <h2>Student Information</h2>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Name:</span> ${report.studentName}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Student ID:</span> ${report.studentId}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Department:</span> ${report.department}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Section:</span> ${report.section}
                                </div>
                            </div>
                        </div>
                        
                        <h2>Violation Statistics</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-title">Uniform Violations</div>
                                <div class="stat-value">${report.uniformCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Footwear Violations</div>
                                <div class="stat-value">${report.footwearCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">No ID Violations</div>
                                <div class="stat-value">${report.noIdCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Total Violations</div>
                                <div class="stat-value">${report.totalViolations}</div>
                            </div>
                        </div>
                        
                        <h2>Violation History</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Violation</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.history.map(item => `
                                    <tr>
                                        <td>${item.date}</td>
                                        <td>${item.title}</td>
                                        <td>${item.desc}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }

        function printAllReports() {
            const printContent = `
                <html>
                    <head>
                        <title>All Violation Reports - OSAS System</title>
                        <style>
                            body { font-family: 'Segoe UI', sans-serif; margin: 40px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                            th { background-color: #f8f9fa; font-weight: 600; }
                            h1 { color: #333; margin-bottom: 10px; }
                            .report-header { margin-bottom: 30px; }
                            .report-date { color: #666; margin-bottom: 20px; }
                            .summary { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <div class="report-header">
                            <h1>All Student Violation Reports</h1>
                            <p style="color: #666;">Comprehensive violation analysis report</p>
                            <div class="report-date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</div>
                        </div>
                        
                        <div class="summary">
                            <strong>Summary:</strong> ${reports.length} students, ${reports.reduce((sum, r) => sum + r.totalViolations, 0)} total violations
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Student Name</th>
                                    <th>Department</th>
                                    <th>Section</th>
                                    <th>Uniform</th>
                                    <th>Footwear</th>
                                    <th>No ID</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reports.map(report => `
                                    <tr>
                                        <td>${report.reportId}</td>
                                        <td>${report.studentName}</td>
                                        <td>${report.department}</td>
                                        <td>${report.section}</td>
                                        <td>${report.uniformCount}</td>
                                        <td>${report.footwearCount}</td>
                                        <td>${report.noIdCount}</td>
                                        <td>${report.totalViolations}</td>
                                        <td>${report.statusLabel}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }

        // ========== LOAD DEPARTMENTS AND SECTIONS ==========
        
        async function loadDepartments() {
            try {
                const response = await fetch(API_BASE + 'departments.php');
                const data = await response.json();
                
                if (data.status === 'success' && deptFilter) {
                    // Clear existing options except "All"
                    const allOption = deptFilter.querySelector('option[value="all"]');
                    deptFilter.innerHTML = '';
                    if (allOption) {
                        deptFilter.appendChild(allOption);
                    }
                    
                    // Add departments
                    data.data.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept.department_code || dept.code || dept.id;
                        option.textContent = dept.department_name || dept.name || dept.department_code || dept.code;
                        deptFilter.appendChild(option);
                    });
                    console.log(`✅ Loaded ${data.data.length} departments`);
                }
            } catch (error) {
                console.error('❌ Error loading departments:', error);
            }
        }
        
        async function loadSections() {
            try {
                const response = await fetch(API_BASE + 'sections.php');
                const data = await response.json();
                
                if (data.status === 'success' && sectionFilter) {
                    // Clear existing options except "All"
                    const allOption = sectionFilter.querySelector('option[value="all"]');
                    sectionFilter.innerHTML = '';
                    if (allOption) {
                        sectionFilter.appendChild(allOption);
                    }
                    
                    // Add sections
                    data.data.forEach(section => {
                        const option = document.createElement('option');
                        option.value = section.section_code || section.code || section.id;
                        option.textContent = section.section_code || section.code || section.section_name || section.name;
                        sectionFilter.appendChild(option);
                    });
                    console.log(`✅ Loaded ${data.data.length} sections`);
                }
            } catch (error) {
                console.error('❌ Error loading sections:', error);
            }
        }
        
        // ========== INITIAL LOAD ==========
        // Ensure we are on the reports page before proceeding
        if (!document.getElementById('Reports-page')) {
            console.log('Not on Reports page, skipping initialization');
            return;
        }

        initCharts(); // Initialize charts
        loadDepartments();
        loadSections();
        loadReports(true);
        console.log('✅ Reports module initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing reports module:', error);
    }
}

// Make function globally available
window.initReportsModule = initReportsModule;

// Auto-initialize if loaded directly (for testing)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportsModule);
} else {
    // Give a small delay for dynamic loading
    setTimeout(initReportsModule, 500);
}
