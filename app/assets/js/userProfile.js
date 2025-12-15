/**
 * User Profile Page
 * Connects to database to show and update user profile
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

let userProfile = null;
let userViolations = [];
let userId = null;
let studentId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initUserProfile();
});

async function initUserProfile() {
    userId = getUserId();
    if (!userId) {
        console.warn('⚠️ User ID not found');
        return;
    }

    await Promise.all([
        loadUserProfile(),
        loadUserViolations()
    ]);

    updateProfileDisplay();
    updateViolationSummary();
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
        userProfile = students.find(s => 
            (s.user_id && parseInt(s.user_id) === parseInt(userId)) ||
            (s.id && parseInt(s.id) === parseInt(userId))
        );

        if (userProfile) {
            studentId = userProfile.id || userProfile.student_id;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadUserViolations() {
    try {
        const response = await fetch(USER_API_BASE + 'violations.php');
        if (!response.ok) return;

        const data = await response.json();
        if (data.status === 'error') return;

        const allViolations = data.violations || data.data || [];
        
        if (studentId) {
            userViolations = allViolations.filter(v => 
                (v.student_id && parseInt(v.student_id) === parseInt(studentId)) ||
                (v.studentId && parseInt(v.studentId) === parseInt(studentId))
            );
        }
    } catch (error) {
        console.error('Error loading violations:', error);
    }
}

function updateProfileDisplay() {
    if (!userProfile) return;

    // Update profile header
    const fullName = `${userProfile.first_name || ''} ${userProfile.middle_name || ''} ${userProfile.last_name || ''}`.trim();
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = fullName || 'Student';

    const studentIdEl = document.getElementById('studentId');
    if (studentIdEl) studentIdEl.textContent = `Student ID: ${userProfile.student_id || 'N/A'}`;

    const studentIdValueEl = document.getElementById('studentIdValue');
    if (studentIdValueEl) studentIdValueEl.textContent = userProfile.student_id || 'N/A';

    // Update personal information
    const fullNameEl = document.getElementById('fullName');
    if (fullNameEl) fullNameEl.textContent = fullName;

    const emailEl = document.getElementById('email');
    if (emailEl) emailEl.textContent = userProfile.email || 'N/A';

    const phoneEl = document.getElementById('phone');
    if (phoneEl) phoneEl.textContent = userProfile.contact_number || 'N/A';

    const dateOfBirthEl = document.getElementById('dateOfBirth');
    if (dateOfBirthEl && userProfile.date_of_birth) {
        dateOfBirthEl.textContent = formatDate(userProfile.date_of_birth);
    }

    const genderEl = document.getElementById('gender');
    if (genderEl) genderEl.textContent = userProfile.gender || 'N/A';

    // Update academic information
    const departmentEl = document.getElementById('department');
    if (departmentEl) departmentEl.textContent = userProfile.department || 'N/A';

    const yearLevelEl = document.getElementById('yearLevel');
    if (yearLevelEl) yearLevelEl.textContent = userProfile.year_level || 'N/A';

    const sectionEl = document.getElementById('section');
    if (sectionEl) sectionEl.textContent = userProfile.section || 'N/A';

    // Update status
    const statusEl = document.querySelector('.status-badge');
    if (statusEl) {
        const activeViolations = userViolations.filter(v => {
            const status = (v.status || '').toLowerCase();
            return status !== 'resolved' && status !== 'permitted';
        }).length;
        statusEl.textContent = activeViolations === 0 ? 'Good Standing' : 'Warning';
        statusEl.className = `status-badge ${activeViolations === 0 ? 'good' : 'warning'}`;
    }
}

function updateViolationSummary() {
    const container = document.querySelector('.violation-summary-cards');
    if (!container) return;

    const typeCounts = {};
    userViolations.forEach(v => {
        const type = (v.violation_type || v.type || 'unknown').toLowerCase().replace(/\s+/g, '_');
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const types = [
        { key: 'improper_uniform', label: 'Improper Uniform', icon: 'bxs-t-shirt' },
        { key: 'improper_footwear', label: 'Improper Footwear', icon: 'bxs-shoe' },
        { key: 'no_id', label: 'No ID Card', icon: 'bxs-id-card' }
    ];

    container.innerHTML = types.map(type => {
        const count = typeCounts[type.key] || 0;
        const violationsOfType = userViolations.filter(v => {
            const vType = (v.violation_type || v.type || '').toLowerCase().replace(/\s+/g, '_');
            return vType === type.key;
        });
        
        let lastViolation = 'Never';
        if (violationsOfType.length > 0) {
            const sorted = [...violationsOfType].sort((a, b) => {
                const dateA = new Date(a.date || a.created_at || a.violation_date);
                const dateB = new Date(b.date || b.created_at || b.violation_date);
                return dateB - dateA;
            });
            lastViolation = formatTimeAgo(sorted[0].date || sorted[0].created_at || sorted[0].violation_date);
        }

        return `
            <div class="summary-card">
                <div class="card-icon ${type.key}">
                    <i class='bx ${type.icon}'></i>
                </div>
                <div class="card-content">
                    <h4>${type.label}</h4>
                    <p class="count">${count} violation${count !== 1 ? 's' : ''}</p>
                    <p class="last-violation">Last: ${lastViolation}</p>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
}

// Export functions
window.editProfile = function() {
    showEditModal('Edit Profile', 'personal');
};

window.editPersonalInfo = function() {
    showEditModal('Edit Personal Information', 'personal');
};

window.editAcademicInfo = function() {
    showEditModal('Edit Academic Information', 'academic');
};

window.editContactInfo = function() {
    showEditModal('Edit Contact Information', 'contact');
};

function showEditModal(title, type) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    document.getElementById('modalTitle').textContent = title;
    modal.style.display = 'block';
    
    if (type === 'personal' && userProfile) {
        const fullName = `${userProfile.first_name || ''} ${userProfile.middle_name || ''} ${userProfile.last_name || ''}`.trim();
        document.getElementById('editFullName').value = fullName;
        document.getElementById('editEmail').value = userProfile.email || '';
        document.getElementById('editPhone').value = userProfile.contact_number || '';
    } else if (type === 'contact' && userProfile) {
        document.getElementById('editAddress').value = userProfile.address || '';
    }
}

window.closeEditModal = function() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
};

window.saveProfile = async function() {
    // In future, implement API call to update profile
    showNotification('Profile update feature coming soon!', 'info');
    closeEditModal();
};

window.changeProfilePicture = function() {
    showNotification('Profile picture upload feature coming soon!', 'info');
};

function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
};

