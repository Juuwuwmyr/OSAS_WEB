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
    console.log('Student ID:', studentId); // Debug: check student ID

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

    // Cookie fallback - prefer student_id_code (actual student ID string) over student_id (database ID)
    const cookies = Object.fromEntries(
        document.cookie
            .split(';')
            .map(c => c.trim().split('='))
            .map(([k,v]) => [k, decodeURIComponent(v)])
    );

    // Prefer student_id_code as it's the actual student ID string (e.g., "2023-001")
    return cookies.student_id_code || cookies.student_id || null;
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
        const res = await fetch(`${API_BASE}violations.php?student_id=${studentId}`);
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

    // Count violations by specific type from database
    const countByType = (type) => {
        return userViolations.filter(v => {
            const violationType = (v.violation_type || v.violationType || '').toLowerCase();
            const violationTypeLabel = (v.violationTypeLabel || '').toLowerCase();
            
            // Check for specific violation types
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

    if (userViolations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:40px;">
                    No violations found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = userViolations.map(v => {
        const status = (v.status || 'pending').toLowerCase();
        const statusClass = status === 'resolved' || status === 'permitted' ? 'resolved' : 'pending';
        const statusText = statusClass === 'resolved' ? 'Permitted' : 'Pending';
        
        // Format violation type
        const violationType = v.violationTypeLabel || v.violation_type || 'Unknown';
        const violationTypeFormatted = formatViolationType(violationType);

        return `
            <tr class="violation-row" data-status="${statusClass}" data-type="${(violationType || '').toLowerCase()}">
                <td>${formatDate(v.created_at || v.violation_date || v.date)}</td>
                <td>${escapeHtml(violationTypeFormatted)}</td>
                <td>${escapeHtml(v.notes || v.description || '-')}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-view-details" onclick="viewViolationDetails(${v.id})">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/*********************************************************
 * FILTERS
 *********************************************************/
function filterViolations() {
    const type = document.getElementById('violationFilter').value;
    const status = document.getElementById('statusFilter').value;

    document.querySelectorAll('.violation-row').forEach(row => {
        const rowType = row.dataset.type || '';
        const matchesType = type === 'all' || rowType.includes(type.toLowerCase().replace(' ', '_'));
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

    // Format violation type
    const violationType = formatViolationType(v.violationTypeLabel || v.violation_type || 'Unknown');
    
    // Format date
    const date = formatDate(v.created_at || v.violation_date || v.date);
    
    // Format status
    const status = (v.status || 'pending').toLowerCase();
    const statusText = status === 'resolved' || status === 'permitted' ? 'Permitted' : 
                      status === 'warning' ? 'Warning' : 
                      status === 'disciplinary' ? 'Disciplinary' : 'Pending';

    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalType').textContent = violationType;
    document.getElementById('modalDescription').textContent = v.notes || v.description || '-';
    document.getElementById('modalStatus').textContent = statusText;
    document.getElementById('modalReportedBy').textContent = v.reported_by || v.reportedBy || 'N/A';
    
    // Show resolution if available
    const resolutionEl = document.getElementById('modalResolution');
    if (resolutionEl) {
        resolutionEl.textContent = v.resolution || v.resolution_notes || 'N/A';
    }

    // Show modal with proper styling
    const modal = document.getElementById('violationModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeViolationModal() {
    const modal = document.getElementById('violationModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('violationModal');
    if (modal && modal.classList.contains('active')) {
        if (e.target === modal || e.target.classList.contains('modal')) {
            closeViolationModal();
        }
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeViolationModal();
    }
});

/*********************************************************
 * UTILS
 *********************************************************/
function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatViolationType(type) {
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

/*********************************************************
 * EXPORTS
 *********************************************************/
window.filterViolations = filterViolations;
window.viewViolationDetails = viewViolationDetails;
window.closeViolationModal = closeViolationModal;
