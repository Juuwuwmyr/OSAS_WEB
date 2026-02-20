/*********************************************************
 * CONFIG
 *********************************************************/
const API_BASE = '/OSAS_WEB/api/';

let studentId = null;
let userViolations = [];
let currentViolationId = null;

/*********************************************************
 * INIT
 *********************************************************/
document.addEventListener('DOMContentLoaded', initUserViolations);

// Also listen for dynamic page loads
if (typeof window.addEventListener !== 'undefined') {
    window.addEventListener('pageContentLoaded', initUserViolations);
}

async function initUserViolations() {
    const tbody = document.getElementById('violationsTableBody');
    
    // Only initialize if the violations table exists on the page
    if (!tbody) {
        console.log('Violations table not found on this page, skipping initialization');
        return;
    }

    // Attach search listener
    const searchInput = document.getElementById('searchViolation');
    if (searchInput) {
        searchInput.addEventListener('input', filterViolations);
    }

    studentId = getStudentId();
    console.log('Student ID:', studentId);

    if (!studentId) {
        tbody.innerHTML = errorRow('Student ID not found. Please login again.');
        return;
    }

    // Attach download listener
    const btnDownload = document.getElementById('btnDownloadReport');
    if (btnDownload) {
        btnDownload.addEventListener('click', function(e) {
            e.preventDefault();
            downloadViolationsReport();
        });
    }

    await loadUserViolations();
}

/*********************************************************
 * HELPERS
 *********************************************************/
function getStudentId() {
    if (window.STUDENT_ID) return window.STUDENT_ID;
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent.dataset.studentId) return mainContent.dataset.studentId;
    
    const cookies = Object.fromEntries(
        document.cookie.split(';').map(c => c.trim().split('=')).map(([k,v]) => [k, decodeURIComponent(v)])
    );
    return cookies.student_id_code || cookies.student_id;
}

function errorRow(message) {
    return `
        <tr>
            <td colspan="6" style="text-align:center; padding:40px; color:#ef4444;">
                ${message}
            </td>
        </tr>
    `;
}

/*********************************************************
 * LOAD VIOLATIONS
 *********************************************************/
async function loadUserViolations() {
    const tbody = document.getElementById('violationsTableBody');

    try {
        const apiUrl = `${API_BASE}violations.php`;
        console.log('📡 Fetching violations from:', apiUrl);
        
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.message || 'Failed to load violations');

        userViolations = json.data || [];
        console.log('✅ Loaded', userViolations.length, 'violations');

        updateViolationStats();
        renderViolationTable();

    } catch (err) {
        console.error('❌ Error loading violations:', err);
        tbody.innerHTML = errorRow(err.message);
    }
}

/*********************************************************
 * STATS
 *********************************************************/
function updateViolationStats() {
    const total = userViolations.length;

    const countByType = (type) => {
        return userViolations.filter(v => {
            const rawType = v.violation_type_name || v.violation_type || v.violationType || '';
            const violationType = String(rawType).toLowerCase();
            const violationTypeLabel = String(v.violationTypeLabel || '').toLowerCase();
            
            if (type === 'uniform') {
                return violationType.includes('uniform') || violationTypeLabel.includes('uniform');
            } else if (type === 'footwear') {
                return violationType.includes('footwear') || violationType.includes('shoe') || 
                       violationTypeLabel.includes('footwear') || violationTypeLabel.includes('shoe');
            } else if (type === 'id') {
                return violationType.includes('id') || violationType.includes('no_id') ||
                       violationTypeLabel.includes('id') || violationTypeLabel.includes('no id');
            }
            return false;
        }).length;
    };

    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setStat('statUniform', countByType('uniform'));
    setStat('statFootwear', countByType('footwear'));
    setStat('statId', countByType('id'));
    setStat('statTotal', total);
}

/*********************************************************
 * TABLE & FILTER
 *********************************************************/
function renderViolationTable() {
    const tbody = document.getElementById('violationsTableBody');
    const showingCount = document.getElementById('showingViolationsCount');
    
    // Apply filters
    const searchTerm = (document.getElementById('searchViolation')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('violationFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    const filtered = userViolations.filter(v => {
        // Search filter (Case ID, Type, Date)
        const searchStr = `${v.case_id || v.id} ${v.violation_type_name || ''} ${v.violation_type || ''} ${v.violationTypeLabel || ''} ${v.created_at || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || searchStr.includes(searchTerm);

        // Type filter
        const rawType = String(v.violation_type_name || v.violation_type || v.violationType || '').toLowerCase();
        const matchesType = typeFilter === 'all' || rawType.includes(typeFilter.replace('improper_', '')); // simple mapping

        // Status filter
        const status = (v.status || 'pending').toLowerCase();
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'resolved' && (status === 'resolved' || status === 'permitted')) ||
                             status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    if (showingCount) showingCount.textContent = filtered.length;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:40px; color: #666;">
                    No violations found matching your filters
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(v => {
        const status = (v.status || 'pending').toLowerCase();
        
        const level = v.violation_level_name || v.violationLevelLabel || v.level || v.offense_level || '1';
        const levelVal = String(level).toLowerCase();
        const isDisciplinary = levelVal.includes('warning 3') || levelVal.includes('3rd') || levelVal.includes('disciplinary');
       
        let statusClass = 'warning';
        let statusText = 'Pending';

        if (status === 'resolved' || status === 'permitted') {
            statusClass = isDisciplinary ? 'resolved' : 'permitted';
            statusText = isDisciplinary ? 'Resolved' : 'Permitted';
        } else if (isDisciplinary || status === 'disciplinary') {
            statusClass = 'disciplinary';
            statusText = 'Disciplinary';
        } else if (status === 'warning') {
            statusClass = 'warning';
            statusText = 'Warning';
        }

        const violationType = v.violation_type_name || v.violationTypeLabel || v.violation_type || 'Unknown';
        const violationTypeFormatted = formatViolationType(String(violationType));

        return `
            <tr class="violation-row">
                <td><span style="font-family:monospace; font-weight:600;">#${v.case_id || v.id}</span></td>
                <td>${escapeHtml(violationTypeFormatted)}</td>
                <td><span class="Violations-badge warning">${level}</span></td>
                <td>${formatDate(v.created_at || v.violation_date || v.date)}</td>
                <td><span class="Violations-status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="Violations-btn small" onclick="viewViolationDetails(${v.id})" title="View Details">
                        <i class='bx bx-show'></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterViolations() {
    renderViolationTable();
}

/*********************************************************
 * MODAL
 *********************************************************/
function getImageUrl(imagePath, fallbackName = 'Student') {
    if (!imagePath || imagePath.trim() === '') {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=ffd700&color=333&size=80`;
    }
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    
    // Adjust based on your path structure
    // Assuming relative to project root if not absolute
    // Note: API_BASE is /OSAS_WEB/api/, so we want /OSAS_WEB/
    const projectBase = API_BASE.replace('api/', '');

    if (imagePath.startsWith('assets/')) return projectBase + 'app/' + imagePath;
    if (imagePath.startsWith('app/assets/')) return projectBase + imagePath;
    
    return projectBase + 'app/assets/img/students/' + imagePath;
}

function getStatusClass(status) {
    status = (status || '').toLowerCase();
    if (status === 'resolved') return 'resolved';
    if (status === 'permitted') return 'permitted';
    if (status === 'disciplinary') return 'disciplinary';
    if (status === 'warning') return 'warning';
    return 'warning';
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}

function viewViolationDetails(id) {
    const v = userViolations.find(x => x.id == id);
    if (!v) return;
    currentViolationId = id;

    // Helper functions for safe element access
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text || 'N/A';
    };
    const setElementSrc = (id, src) => {
        const el = document.getElementById(id);
        if (el) el.src = src;
    };
    const setElementClass = (id, className) => {
        const el = document.getElementById(id);
        if (el) el.className = className;
    };

    // --- Case Header ---
    let displayStatus = (v.status || '').toLowerCase();
    let displayStatusLabel = v.statusLabel || (displayStatus ? displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1) : 'Unknown');

    const levelLabel = (v.violation_level_name || v.violationLevelLabel || v.level || v.offense_level || '').toLowerCase();
    const isDisciplinary = levelLabel.includes('warning 3') || levelLabel.includes('3rd') || levelLabel.includes('disciplinary');

    if (displayStatus === 'resolved' || displayStatus === 'permitted') {
        displayStatusLabel = isDisciplinary ? 'Resolved' : 'Permitted';
        // Ensure we use the success color
        displayStatus = 'resolved'; 
    } else if (isDisciplinary || displayStatus === 'disciplinary') {
        displayStatus = 'disciplinary';
        displayStatusLabel = 'Disciplinary';
    }

    setElementText('detailCaseId', v.case_id || '#' + v.id);
    setElementText('detailStatusBadge', displayStatusLabel);
    setElementClass('detailStatusBadge', `case-status-badge ${getStatusClass(displayStatus)}`);

    // --- Student Info ---
    // Note: Student info might be partial in the violation object depending on the API query.
    // If we have it, use it. Otherwise, use what's available or placeholders.
    const studentName = v.student_name || v.studentName || 'Student';
    const studentImg = v.student_image || v.studentImage || '';
    
    const studentImageUrl = getImageUrl(studentImg, studentName);
    setElementSrc('detailStudentImage', studentImageUrl);
    setElementText('detailStudentName', studentName);
    setElementText('detailStudentId', v.student_id || studentId); // Fallback to global studentId
    setElementText('detailStudentDept', v.department || v.department_name || 'N/A');
    setElementClass('detailStudentDept', `student-dept badge`); // Could add dept specific class if mapped
    setElementText('detailStudentSection', v.section || 'N/A');
    setElementText('detailStudentContact', v.student_contact || v.studentContact || 'N/A');

    // --- Violation Details Grid ---
    setElementText('detailViolationType', formatViolationType(v.violation_type_name || v.violationTypeLabel || v.violation_type));
    setElementText('detailViolationLevel', v.violation_level_name || v.violationLevelLabel || v.level || v.offense_level || '1');
    
    const dateStr = formatDate(v.created_at || v.violation_date || v.date);
    const timeStr = formatTime(v.violation_time || '');
    setElementText('detailDateTime', `${dateStr} ${timeStr ? '• ' + timeStr : ''}`);
    
    setElementText('detailLocation', v.locationLabel || v.location || 'N/A');
    setElementText('detailReportedBy', v.reported_by || v.reportedBy || 'N/A');
    
    setElementText('detailStatus', displayStatusLabel);
    const statusBadge = document.getElementById('detailStatus');
    if(statusBadge) statusBadge.className = `detail-value badge ${getStatusClass(displayStatus)}`;

    // --- Description / Notes ---
    setElementText('detailNotes', v.notes || v.description || 'No description provided.');

    // --- Resolution (if exists) ---
    const resSection = document.getElementById('resolutionSection');
    const resText = document.getElementById('detailResolution');
    if (v.resolution || v.resolution_notes) {
        resSection.style.display = 'block';
        resText.textContent = v.resolution || v.resolution_notes;
    } else {
        resSection.style.display = 'none';
    }

    // --- History Timeline ---
    const timelineEl = document.getElementById('detailTimeline');
    if (timelineEl) {
        // Since userViolations contains ALL violations for this student, we just use it directly.
        // Filter out duplicates if any (though API shouldn't return dupes)
        // Sort by date descending
        let history = [...userViolations];
        
        history.sort((a, b) => {
             const dateA = new Date((a.created_at || a.violation_date) + ' ' + (a.violation_time || '00:00'));
             const dateB = new Date((b.created_at || b.violation_date) + ' ' + (b.violation_time || '00:00'));
             return dateB - dateA;
        });

        if (history.length > 0) {
            timelineEl.innerHTML = history.map(h => {
                const isCurrent = String(h.id) === String(v.id);
                const activeClass = isCurrent ? 'current-viewing' : '';
                const hDateStr = formatDate(h.created_at || h.violation_date);
                const hTimeStr = formatTime(h.violation_time);
                
                let itemStatus = (h.status || '').toLowerCase();
                const hLevel = (h.violation_level_name || h.violationLevelLabel || h.level || h.offense_level || '').toLowerCase();
                const hIsDisciplinary = hLevel.includes('warning 3') || hLevel.includes('3rd') || hLevel.includes('disciplinary');
                
                let statusHtml = '';
                if (itemStatus === 'resolved' || itemStatus === 'permitted') {
                    const label = hIsDisciplinary ? 'Resolved' : 'Permitted';
                    statusHtml = `<span style="color: green; font-weight: bold;">(${label})</span>`;
                } else if (hIsDisciplinary || itemStatus === 'disciplinary') {
                    statusHtml = '<span style="color: #e74c3c; font-weight: bold;">(Disciplinary)</span>';
                }

                return `
                <div class="timeline-item ${activeClass}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <span class="timeline-date">${hDateStr} ${hTimeStr ? '• ' + hTimeStr : ''}</span>
                        <span class="timeline-title">
                            ${h.violation_level_name || h.violationLevelLabel || h.level || h.offense_level || 'Level'} - ${formatViolationType(h.violation_type_name || h.violationTypeLabel || h.violation_type || 'Type')}
                            ${isCurrent ? '<span style="font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">Current</span>' : ''}
                        </span>
                        <span class="timeline-desc">
                            Reported at ${h.locationLabel || h.location || 'N/A'} 
                            ${statusHtml}
                        </span>
                    </div>
                </div>
            `}).join('');
        } else {
            timelineEl.innerHTML = '<p style="color: #6c757d; font-size: 14px; text-align: center; padding: 10px;">No history available.</p>';
        }
    }

    // Show Modal
    const modal = document.getElementById('ViolationDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
        // Add active class if CSS requires it for animation
        modal.classList.add('active');
    }
}

function closeViolationModal() {
    const modal = document.getElementById('ViolationDetailsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('ViolationDetailsModal');
    if (modal && modal.style.display === 'flex') {
        if (e.target === modal || e.target.classList.contains('Violations-modal-overlay')) {
            closeViolationModal();
        }
    }
});

function downloadViolationsReport() {
    if (!userViolations || userViolations.length === 0) {
        alert('No violations to download.');
        return;
    }

    const lines = [];
    const now = new Date();
    
    // Header Info
    lines.push('My Violation Report');
    lines.push('Generated,' + csvEscape(now.toLocaleString()));
    lines.push('');
    
    // Column Headers
    lines.push(['Case ID', 'Violation Type', 'Level', 'Status', 'Date Reported'].map(csvEscape).join(','));

    // Data Rows
    userViolations.forEach(v => {
        const type = formatViolationType(v.violation_type || v.type);
        const date = formatDate(v.created_at || v.violation_date || v.date);
        const level = v.violation_level || v.level || 'Minor';
        const status = v.status || 'Unknown';
        
        lines.push([
            v.case_id || v.id,
            type,
            level,
            status,
            date
        ].map(csvEscape).join(','));
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = 'my_violations_' + now.toISOString().slice(0, 10) + '.csv';
    
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

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function printViolationSlip() {
    if (!currentViolationId) {
        alert('No violation selected');
        return;
    }
    const url = `${API_BASE}violations.php?action=generate_slip&violation_id=${currentViolationId}`;
    window.open(url, '_blank');
}

/*********************************************************
 * UTILS
 *********************************************************/
function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatViolationType(type) {
    if (!type) return 'Unknown';
    type = String(type);
    
    const typeMap = {
        'improper_uniform': 'Improper Uniform',
        'improper_footwear': 'Improper Footwear',
        'no_id': 'No ID Card',
        'misconduct': 'Misconduct'
    };
    
    if (typeMap[type.toLowerCase()]) return typeMap[type.toLowerCase()];
    
    const lowerType = type.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
        if (lowerType.includes(key.replace('_', ' ')) || lowerType === key) {
            return value;
        }
    }
    
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/*********************************************************
 * EXPORTS
 *********************************************************/
window.initUserViolations = initUserViolations;
window.filterViolations = filterViolations;
window.viewViolationDetails = viewViolationDetails;
window.closeViolationModal = closeViolationModal;
window.printViolationSlip = printViolationSlip;
