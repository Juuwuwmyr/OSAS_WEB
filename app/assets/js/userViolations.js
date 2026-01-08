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

    // Cookie fallback
    const cookies = Object.fromEntries(
        document.cookie
            .split(';')
            .map(c => c.trim().split('='))
            .map(([k,v]) => [k, decodeURIComponent(v)])
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
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/*********************************************************
 * EXPORTS
 *********************************************************/
window.filterViolations = filterViolations;
window.viewViolationDetails = viewViolationDetails;
window.closeViolationModal = closeViolationModal;
