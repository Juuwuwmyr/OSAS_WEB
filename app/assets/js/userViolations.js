function getUserAPIBasePath() {
    const currentPath = window.location.pathname;
    const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
    const projectBase = pathMatch ? pathMatch[1] : '';
    
    if (currentPath.includes('/includes/') || currentPath.includes('/app/entry/')) {
        return '../api/';
    } else if (currentPath.includes('/app/views/')) {
        return '../../api/';
    } else if (projectBase) {
        return projectBase + '/api/';
    } else {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);
        
        if (pathParts.length > 0) {
            return '/' + pathParts[0] + '/api/';
        }
        
        return 'api/';
    }
}

const USER_API_BASE = getUserAPIBasePath();
console.log('🔗 User Violations API Base Path:', USER_API_BASE);

let userViolations = [];
let userId = null;
let studentId = null;

async function initUserViolations() {
    console.log('🔄 Initializing user violations page...');
    
    userId = getUserId();
    if (!userId) {
        console.warn('⚠️ User ID not found');
        const tbody = document.getElementById('violationsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>User ID not found. Please log in again.</p>
                    </td>
                </tr>
            `;
        }
        return;
    }

    console.log('✅ User ID found:', userId);

    studentId = getStudentId();
    
    if (!studentId) {
        console.log('⚠️ Student ID not in session, fetching from profile...');
        await loadUserProfile();
    } else {
        console.log('✅ Student ID found in session:', studentId);
    }
    
    if (!studentId) {
        console.warn('⚠️ Student ID not found');
        const tbody = document.getElementById('violationsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>Student profile not found. Please contact administrator.</p>
                    </td>
                </tr>
            `;
        }
        return;
    }
    
    await loadUserViolations();
    
    console.log('✅ User violations page initialized');
}

function initializeUserViolations() {
    const violationsPage = document.getElementById('violationsTableBody') || 
                          document.querySelector('.violation-history tbody') ||
                          document.getElementById('violationStatsBoxes');
    
    if (violationsPage) {
        setTimeout(initUserViolations, 100);
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initUserViolations, 100);
        });
    } else {
        setTimeout(initializeUserViolations, 500);
    }
}

window.initUserViolations = initUserViolations;
window.initializeUserViolations = initializeUserViolations;

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeUserViolations, 100);
}

function getUserId() {
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

function getStudentId() {
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

async function loadUserProfile() {
    try {
        console.log('🔄 Loading user profile to get student_id...');
        const url = USER_API_BASE + 'students.php';
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            return;
        }

        const responseText = await response.text();
        console.log('Students API response (first 500 chars):', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            return;
        }
        
        if (data.status === 'error') {
            console.error('API error:', data.message);
            return;
        }

        const students = data.data || data.students || [];
        console.log(`📋 Total students in database: ${students.length}`);
        
        const student = students.find(s => {
            const match = s.user_id && parseInt(s.user_id) === parseInt(userId);
            if (match) {
                console.log('✅ Found matching student:', s);
            }
            return match;
        });
        
        if (student) {
            studentId = student.student_id || student.studentId || student.id;
            console.log('✅ Student ID found:', studentId);
            console.log('Student data:', { id: student.id, student_id: student.student_id, studentId: student.studentId });
        } else {
            console.warn('⚠️ Student not found for user_id:', userId);
        }
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
        console.error('Error details:', error.message, error.stack);
    }
}

async function loadUserViolations() {
    try {
        if (!studentId) {
            console.warn('⚠️ Student ID not available, cannot load violations');
            userViolations = [];
            updateViolationStats();
            updateViolationTable();
            return;
        }

        console.log('🔄 Loading user violations...');
        console.log('Filtering for student_id:', studentId);
        const url = USER_API_BASE + 'violations.php?student_id=' + encodeURIComponent(studentId);
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

        userViolations = data.violations || data.data || [];
        console.log(`✅ Loaded ${userViolations.length} violations for student_id: ${studentId}`);
        
        const tbody = document.getElementById('violationsTableBody');
        if (tbody) {
            updateViolationStats();
            updateViolationTable();
        } else {
            console.warn('⚠️ Table body not found, retrying...');
            setTimeout(() => {
                updateViolationStats();
                updateViolationTable();
            }, 100);
        }
    } catch (error) {
        console.error('❌ Error loading violations:', error);
        console.error('Error details:', error.message, error.stack);
        userViolations = [];
        
        updateViolationStats();
        updateViolationTable();
        
        const tbody = document.getElementById('violationsTableBody');
        if (tbody && tbody.innerHTML.includes('Loading violations')) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class='bx bx-error-circle' style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>Error loading violations: ${error.message}</p>
                        <button onclick="initUserViolations()" style="margin-top: 10px; padding: 8px 16px; background: var(--gold); border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                    </td>
                </tr>
            `;
        }
    }
}

function updateViolationStats() {
    const total = userViolations.length;
    const active = userViolations.filter(v => {
        const status = (v.status || '').toLowerCase();
        return status !== 'resolved' && status !== 'permitted';
    }).length;

    const typeCounts = {};
    userViolations.forEach(v => {
        const type = (v.violation_type || v.type || 'unknown').toLowerCase().replace(/\s+/g, '_');
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const improperUniform = typeCounts['improper_uniform'] || 0;
    const improperFootwear = typeCounts['improper_footwear'] || 0;
    const noId = typeCounts['no_id'] || 0;

    const boxes = document.querySelectorAll('.box-info li') || document.querySelectorAll('#violationStatsBoxes li');
    if (boxes[0]) boxes[0].querySelector('h3').textContent = improperUniform;
    if (boxes[1]) boxes[1].querySelector('h3').textContent = improperFootwear;
    if (boxes[2]) boxes[2].querySelector('h3').textContent = noId;
    if (boxes[3]) boxes[3].querySelector('h3').textContent = total;
}

function updateViolationTable() {
    const tbody = document.querySelector('.violation-history tbody') || document.getElementById('violationsTableBody');
    if (!tbody) {
        console.warn('⚠️ Violations table body not found');
        return;
    }

    if (userViolations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                    <p>No violations found</p>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...userViolations].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || a.violation_date);
        const dateB = new Date(b.date || b.created_at || b.violation_date);
        return dateB - dateA;
    });

    tbody.innerHTML = sorted.map(v => {
        const type = v.violation_type || v.type || 'Unknown';
        const date = formatDate(v.date || v.created_at || v.violation_date);
        const description = v.notes || v.description || 'No description';
        const status = (v.status || 'pending').toLowerCase();
        const statusClass = status === 'resolved' || status === 'permitted' ? 'resolved' : 'pending';
        const statusText = status === 'resolved' || status === 'permitted' ? 'Permitted' : 'Pending';
        
        let icon = 'bxs-info-circle';
        if (type.toLowerCase().includes('uniform')) icon = 'bxs-t-shirt';
        else if (type.toLowerCase().includes('footwear') || type.toLowerCase().includes('shoe')) icon = 'bxs-shoe';
        else if (type.toLowerCase().includes('id')) icon = 'bxs-id-card';

        const typeClass = type.toLowerCase().replace(/\s+/g, '_');

        return `
            <tr class="violation-row" data-type="${typeClass}" data-status="${statusClass}">
                <td>${date}</td>
                <td>
                    <div class="violation-info">
                        <i class='bx ${icon}'></i>
                        <span>${escapeHtml(type)}</span>
                    </div>
                </td>
                <td>${escapeHtml(description.substring(0, 50))}${description.length > 50 ? '...' : ''}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-view-details" onclick="viewViolationDetails(${v.id || v.violation_id})">View Details</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterViolations() {
    const typeFilter = document.getElementById('violationFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const rows = document.querySelectorAll('.violation-row');
    
    rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        const rowStatus = row.getAttribute('data-status');
        
        let showRow = true;
        
        if (typeFilter !== 'all' && rowType !== typeFilter) {
            showRow = false;
        }
        
        if (statusFilter !== 'all' && rowStatus !== statusFilter) {
            showRow = false;
        }
        
        row.style.display = showRow ? 'table-row' : 'none';
    });
}

async function viewViolationDetails(violationId) {
    console.log('Viewing violation details for ID:', violationId);
    const violation = userViolations.find(v => {
        const vId = v.id || v.violation_id;
        return vId && (parseInt(vId) === parseInt(violationId));
    });
    
    if (!violation) {
        console.warn('Violation not found:', violationId);
        alert('Violation not found');
        return;
    }

    const modal = document.getElementById('violationModal');
    if (!modal) {
        console.warn('Violation modal not found');
        return;
    }

    const dateEl = document.getElementById('modalDate');
    const typeEl = document.getElementById('modalType');
    const descEl = document.getElementById('modalDescription');
    const statusEl = document.getElementById('modalStatus');
    const reportedByEl = document.getElementById('modalReportedBy');
    const resolutionEl = document.getElementById('modalResolution');

    if (dateEl) dateEl.textContent = formatDate(violation.date || violation.created_at || violation.violation_date || violation.dateReported);
    if (typeEl) typeEl.textContent = violation.violation_type || violation.violationType || violation.type || 'Unknown';
    if (descEl) descEl.textContent = violation.notes || violation.description || 'No description';
    
    const status = (violation.status || 'pending').toLowerCase();
    const statusText = status === 'resolved' || status === 'permitted' ? 'Permitted' : 'Pending';
    if (statusEl) statusEl.textContent = statusText;
    
    if (reportedByEl) reportedByEl.textContent = violation.reported_by || violation.reportedBy || 'N/A';
    if (resolutionEl) resolutionEl.textContent = violation.resolution || 'No resolution notes';

    modal.style.display = 'block';
}

function closeViolationModal() {
    const modal = document.getElementById('violationModal');
    if (modal) modal.style.display = 'none';
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

window.onclick = function(event) {
    const modal = document.getElementById('violationModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

window.filterViolations = filterViolations;
window.viewViolationDetails = viewViolationDetails;
window.closeViolationModal = closeViolationModal;
