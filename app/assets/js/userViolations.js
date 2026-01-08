<<<<<<< HEAD
/**
 * User Violations Page
 * Connects to database to show user's violations
 */

// API Base Path
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

let userViolations = [];
let userId = null;
let studentId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initUserViolations();
});

async function initUserViolations() {
    // Get user ID
    userId = getUserId();
    if (!userId) {
        console.warn('⚠️ User ID not found');
        return;
    }

    // Load user profile to get student_id
    await loadUserProfile();
    
    // Load violations
    await loadUserViolations();
    
    // Update display
    updateViolationStats();
    updateViolationTable();
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

async function loadUserProfile() {
    try {
        const response = await fetch(USER_API_BASE + 'students.php');
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.status === 'error') return;
        
        const students = data.data || data.students || [];
        const student = students.find(s => 
            (s.user_id && parseInt(s.user_id) === parseInt(userId)) ||
            (s.id && parseInt(s.id) === parseInt(userId))
        );
        
        if (student) {
            studentId = student.id || student.student_id;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadUserViolations() {
    try {
        const response = await fetch(USER_API_BASE + 'violations.php');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'error') {
            throw new Error(data.message || 'Failed to load violations');
        }

        const allViolations = data.violations || data.data || [];
        
        // Filter by student_id
        if (studentId) {
            userViolations = allViolations.filter(v => 
                (v.student_id && parseInt(v.student_id) === parseInt(studentId)) ||
                (v.studentId && parseInt(v.studentId) === parseInt(studentId))
            );
        } else {
            userViolations = [];
        }
    } catch (error) {
        console.error('Error loading violations:', error);
        userViolations = [];
    }
}

function updateViolationStats() {
    const total = userViolations.length;
    const active = userViolations.filter(v => {
        const status = (v.status || '').toLowerCase();
        return status !== 'resolved' && status !== 'permitted';
    }).length;

    // Count by type
    const typeCounts = {};
    userViolations.forEach(v => {
        const type = (v.violation_type || v.type || 'unknown').toLowerCase().replace(/\s+/g, '_');
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Update stats boxes
    const improperUniform = typeCounts['improper_uniform'] || 0;
    const improperFootwear = typeCounts['improper_footwear'] || 0;
    const noId = typeCounts['no_id'] || 0;

    const boxes = document.querySelectorAll('.box-info li');
    if (boxes[0]) boxes[0].querySelector('h3').textContent = improperUniform;
    if (boxes[1]) boxes[1].querySelector('h3').textContent = improperFootwear;
    if (boxes[2]) boxes[2].querySelector('h3').textContent = noId;
    if (boxes[3]) boxes[3].querySelector('h3').textContent = total;
}

function updateViolationTable() {
    const tbody = document.querySelector('.violation-history tbody');
    if (!tbody) return;
=======
/*********************************************************
 * CONFIG
 *********************************************************/
const API_BASE = '/OSAS_WEB/api/';


let studentId = null;
let userViolations = [];

/*********************************************************
 * INIT
 *********************************************************/
document.addEventListener('DOMContentLoaded', initUserViolations);

async function initUserViolations() {
    const tbody = document.getElementById('violationsTableBody');

    studentId = getStudentId();

    if (!studentId) {
        tbody.innerHTML = errorRow('Student ID not found. Please login again.');
        return;
    }

    await loadUserViolations();
}

/*********************************************************
 * HELPERS
 *********************************************************/
function getStudentId() {
    // Priority: PHP-injected variable
    if (window.STUDENT_ID) return window.STUDENT_ID;

    // Cookie fallback
    const cookies = Object.fromEntries(
        document.cookie.split(';').map(c => c.trim().split('='))
    );

    return cookies.student_id || cookies.student_id_code || null;
}

function errorRow(message) {
    return `
        <tr>
            <td colspan="5" style="text-align:center; padding:40px; color:#ef4444;">
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
        const res = await fetch(`${API_BASE}violations.php?student_id=${studentId}`)

        const json = await res.json();

        if (json.status !== 'success') {
            throw new Error(json.message || 'Failed to load violations');
        }

        userViolations = json.data || [];

        updateViolationStats();
        renderViolationTable();

    } catch (err) {
        console.error(err);
        tbody.innerHTML = errorRow(err.message);
    }
}

/*********************************************************
 * STATS
 *********************************************************/
function updateViolationStats() {
    const total = userViolations.length;

    const countByType = (type) =>
        userViolations.filter(v =>
            (v.violation_type || '').toLowerCase().includes(type)
        ).length;

    const boxes = document.querySelectorAll('.box-info li h3');
    if (!boxes.length) return;

    boxes[0].textContent = countByType('uniform');
    boxes[1].textContent = countByType('footwear');
    boxes[2].textContent = countByType('id');
    boxes[3].textContent = total;
}

/*********************************************************
 * TABLE
 *********************************************************/
function renderViolationTable() {
    const tbody = document.getElementById('violationsTableBody');
>>>>>>> dbac73674c57c74e9b697c55aa52db7eae288df6

    if (userViolations.length === 0) {
        tbody.innerHTML = `
            <tr>
<<<<<<< HEAD
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                    <p>No violations found</p>
=======
                <td colspan="5" style="text-align:center; padding:40px;">
                    No violations found
>>>>>>> dbac73674c57c74e9b697c55aa52db7eae288df6
                </td>
            </tr>
        `;
        return;
    }

<<<<<<< HEAD
    // Sort by date (newest first)
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
=======
    tbody.innerHTML = userViolations.map(v => {
        const status = (v.status || 'pending').toLowerCase();
        const statusClass = status === 'resolved' ? 'resolved' : 'pending';

        return `
            <tr class="violation-row" data-status="${statusClass}">
                <td>${formatDate(v.created_at || v.violation_date)}</td>
                <td>${escapeHtml(v.violation_type)}</td>
                <td>${escapeHtml(v.notes || v.description || '-')}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <button onclick="viewViolationDetails(${v.id})">
                        View
                    </button>
>>>>>>> dbac73674c57c74e9b697c55aa52db7eae288df6
                </td>
            </tr>
        `;
    }).join('');
}

<<<<<<< HEAD
// Filter violations
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

// View violation details
async function viewViolationDetails(violationId) {
    const violation = userViolations.find(v => (v.id || v.violation_id) === violationId);
    if (!violation) {
        alert('Violation not found');
        return;
    }

    const modal = document.getElementById('violationModal');
    if (!modal) return;

    document.getElementById('modalDate').textContent = formatDate(violation.date || violation.created_at || violation.violation_date);
    document.getElementById('modalType').textContent = violation.violation_type || violation.type || 'Unknown';
    document.getElementById('modalDescription').textContent = violation.notes || violation.description || 'No description';
    
    const status = (violation.status || 'pending').toLowerCase();
    const statusText = status === 'resolved' || status === 'permitted' ? 'Permitted' : 'Pending';
    document.getElementById('modalStatus').textContent = statusText;
    
    document.getElementById('modalReportedBy').textContent = violation.reported_by || 'N/A';
    document.getElementById('modalResolution').textContent = violation.resolution || 'No resolution notes';

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
=======
/*********************************************************
 * FILTERS
 *********************************************************/
function filterViolations() {
    const type = document.getElementById('violationFilter').value;
    const status = document.getElementById('statusFilter').value;

    document.querySelectorAll('.violation-row').forEach(row => {
        const matchesType = type === 'all' || row.innerHTML.includes(type);
        const matchesStatus = status === 'all' || row.dataset.status === status;
        row.style.display = matchesType && matchesStatus ? '' : 'none';
    });
}

/*********************************************************
 * MODAL
 *********************************************************/
function viewViolationDetails(id) {
    const v = userViolations.find(x => x.id == id);
    if (!v) return;

    document.getElementById('modalDate').textContent =
        formatDate(v.created_at || v.violation_date);

    document.getElementById('modalType').textContent = v.violation_type;
    document.getElementById('modalDescription').textContent =
        v.notes || v.description || '-';

    document.getElementById('modalStatus').textContent = v.status;
    document.getElementById('modalReportedBy').textContent =
        v.reported_by || 'N/A';

    document.getElementById('violationModal').style.display = 'block';
}

function closeViolationModal() {
    document.getElementById('violationModal').style.display = 'none';
}

/*********************************************************
 * UTILS
 *********************************************************/
function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
>>>>>>> dbac73674c57c74e9b697c55aa52db7eae288df6
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

<<<<<<< HEAD
// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('violationModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Export functions
window.filterViolations = filterViolations;
window.viewViolationDetails = viewViolationDetails;
window.closeViolationModal = closeViolationModal;

=======
/*********************************************************
 * EXPORTS
 *********************************************************/
window.filterViolations = filterViolations;
window.viewViolationDetails = viewViolationDetails;
window.closeViolationModal = closeViolationModal;
>>>>>>> dbac73674c57c74e9b697c55aa52db7eae288df6
