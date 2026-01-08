/**
 * User Profile Page
 * Connects to database to show and update user profile
 */

// API Base Path
function getUserAPIBasePath() {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(p => p);
    
    // Find project root (typically the first directory in the path)
    // For paths like /OSAS_WEB/app/entry/user_dashboard.php
    // Project root is OSAS_WEB, so API is at /OSAS_WEB/api/
    if (pathParts.length > 0) {
        const projectRoot = pathParts[0];
        return '/' + projectRoot + '/api/';
    }
    
    // Fallback to relative path
    if (currentPath.includes('/includes/') || currentPath.includes('/app/entry/')) {
        return '../api/';
    } else if (currentPath.includes('/app/views/')) {
        return '../../api/';
    }
    
    return '/api/';
}

const USER_API_BASE = getUserAPIBasePath();
console.log('🔗 User Profile API Base Path:', USER_API_BASE);

let userProfile = null;
let userViolations = [];
let userId = null;
let studentId = null;

// Initialize function
async function initUserProfile() {
    console.log('🔄 Initializing user profile page...');
    
    userId = getUserId();
    if (!userId) {
        console.warn('⚠️ User ID not found');
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = 'User not found';
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
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = 'Student profile not found';
        return;
    }

    await loadUserViolations();

    updateProfileDisplay();
    updateViolationSummary();
    
    console.log('✅ User profile page initialized');
}

// Initialize immediately if DOM is ready, or wait for it
function initializeUserProfile() {
    // Check if we're on the profile page
    const profilePage = document.getElementById('userName') || 
                       document.getElementById('fullName') ||
                       document.getElementById('profileViolationSummary');
    
    if (profilePage) {
        // Page elements exist, initialize immediately
        setTimeout(initUserProfile, 100);
    } else if (document.readyState === 'loading') {
        // Wait for DOM
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initUserProfile, 100);
        });
    } else {
        // DOM ready but page not loaded yet, try again later
        setTimeout(initializeUserProfile, 500);
    }
}

// Export for dynamic loading
window.initUserProfile = initUserProfile;
window.initializeUserProfile = initializeUserProfile;

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeUserProfile, 100);
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
        console.log('🔄 Loading user profile...');
        console.log('Looking for user_id:', userId);
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
        
        userProfile = students.find(s => {
            const match = s.user_id && parseInt(s.user_id) === parseInt(userId);
            if (match) {
                console.log('✅ Found matching student:', s);
            }
            return match;
        });

        if (userProfile) {
            studentId = userProfile.student_id || userProfile.studentId || userProfile.id;
            console.log('✅ Loaded user profile, student_id:', studentId);
            console.log('Student data:', { id: userProfile.id, student_id: userProfile.student_id, studentId: userProfile.studentId });
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
            return;
        }

        const responseText = await response.text();
        console.log('Violations API response (first 500 chars):', responseText.substring(0, 500));
        
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

        userViolations = data.violations || data.data || [];
        console.log(`✅ Loaded ${userViolations.length} violations for student_id: ${studentId}`);
    } catch (error) {
        console.error('❌ Error loading violations:', error);
        console.error('Error details:', error.message, error.stack);
        userViolations = [];
    }
}

function updateProfileDisplay() {
    if (!userProfile) {
        console.warn('⚠️ User profile not loaded yet');
        return;
    }

    // Update profile header - handle both snake_case and camelCase
    const firstName = userProfile.first_name || userProfile.firstName || '';
    const middleName = userProfile.middle_name || userProfile.middleName || '';
    const lastName = userProfile.last_name || userProfile.lastName || '';
    const fullName = `${firstName} ${middleName} ${lastName}`.trim();
    
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = fullName || 'Student';

    const studentIdValue = userProfile.student_id || userProfile.studentId || 'N/A';
    const studentIdEl = document.getElementById('studentId');
    if (studentIdEl) studentIdEl.textContent = `Student ID: ${studentIdValue}`;

    const studentIdValueEl = document.getElementById('studentIdValue');
    if (studentIdValueEl) studentIdValueEl.textContent = studentIdValue;

    // Update personal information
    const fullNameEl = document.getElementById('fullName');
    if (fullNameEl) fullNameEl.textContent = fullName || 'N/A';

    const emailEl = document.getElementById('email');
    if (emailEl) emailEl.textContent = userProfile.email || 'N/A';

    const phoneEl = document.getElementById('phone');
    if (phoneEl) phoneEl.textContent = userProfile.contact_number || userProfile.contact || 'N/A';

    const dateOfBirthEl = document.getElementById('dateOfBirth');
    if (dateOfBirthEl) {
        const dob = userProfile.date_of_birth || userProfile.dateOfBirth;
        if (dob) {
            dateOfBirthEl.textContent = formatDate(dob);
        } else {
            dateOfBirthEl.textContent = 'N/A';
        }
    }

    const genderEl = document.getElementById('gender');
    if (genderEl) genderEl.textContent = userProfile.gender || 'N/A';

    // Update academic information
    const departmentEl = document.getElementById('department');
    if (departmentEl) departmentEl.textContent = userProfile.department || 'N/A';

    const yearLevelEl = document.getElementById('yearLevel');
    if (yearLevelEl) yearLevelEl.textContent = userProfile.year_level || userProfile.yearLevel || 'N/A';

    const sectionEl = document.getElementById('section');
    if (sectionEl) sectionEl.textContent = userProfile.section || userProfile.section_code || 'N/A';

    // Update address
    const addressEl = document.getElementById('address');
    if (addressEl) addressEl.textContent = userProfile.address || 'N/A';

    // Update status
    const statusEl = document.querySelector('.status-badge') || document.getElementById('profileStatusBadge');
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
    const container = document.querySelector('.violation-summary-cards') || document.getElementById('profileViolationSummary');
    if (!container) {
        console.warn('⚠️ Violation summary container not found');
        return;
    }

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
        const firstName = userProfile.first_name || userProfile.firstName || '';
        const middleName = userProfile.middle_name || userProfile.middleName || '';
        const lastName = userProfile.last_name || userProfile.lastName || '';
        const fullName = `${firstName} ${middleName} ${lastName}`.trim();
        document.getElementById('editFullName').value = fullName;
        document.getElementById('editEmail').value = userProfile.email || '';
        document.getElementById('editPhone').value = userProfile.contact_number || userProfile.contact || '';
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
