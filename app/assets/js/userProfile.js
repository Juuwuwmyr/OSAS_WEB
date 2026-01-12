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
    
    // First, replace any "Loading..." texts that might be stuck
    replaceLoadingTexts();
    
    userId = getUserId();
    if (!userId) {
        console.warn('⚠️ User ID not found');
        setAllFieldsToNA('User not found');
        return;
    }

    console.log('✅ User ID found:', userId);

    // Always load profile data - it will handle getting student_id internally
    console.log('🔄 Loading user profile data...');
    await loadUserProfile();
    
    if (!userProfile) {
        console.warn('⚠️ Student profile not loaded after loadUserProfile()');
        setAllFieldsToNA('Student profile not found');
        return;
    }

    console.log('✅ Profile loaded, loading violations...');
    await loadUserViolations(); // This will call updateViolationSummary() internally

    console.log('✅ Updating profile display...');
    updateProfileDisplay();
    
    // Violation summary is already updated in loadUserViolations()
    // But update again to ensure it's current
    updateViolationSummary();
    
    updateSidebarProfile();
    
    // Final check - replace any remaining "Loading..." texts
    setTimeout(() => {
        replaceLoadingTexts();
        // Double check all fields
        const loadingElements = document.querySelectorAll('#userName, #studentId, #studentIdValue, #fullName, #email, #phone, #department, #yearLevel, #section, #enrollmentDate, #address, #profileStatusBadge');
        loadingElements.forEach(el => {
            if (el && el.textContent && el.textContent.includes('Loading')) {
                console.warn('⚠️ Found remaining Loading text in:', el.id);
                if (el.id === 'userName') el.textContent = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'N/A' : 'N/A';
                else if (el.id === 'studentId') el.textContent = `Student ID: ${userProfile ? (userProfile.student_id || 'N/A') : 'N/A'}`;
                else if (el.id === 'studentIdValue') el.textContent = userProfile ? (userProfile.student_id || 'N/A') : 'N/A';
                else el.textContent = 'N/A';
            }
        });
    }, 1000);
    
    console.log('✅ User profile page initialized successfully');
}

// Helper function to set all fields to N/A if loading fails
function setAllFieldsToNA(errorMessage = '') {
    const fields = {
        'userName': errorMessage || 'N/A',
        'studentId': 'Student ID: N/A',
        'studentIdValue': 'N/A',
        'fullName': 'N/A',
        'email': 'N/A',
        'phone': 'N/A',
        'department': 'N/A',
        'yearLevel': 'N/A',
        'section': 'N/A',
        'enrollmentDate': 'N/A',
        'address': 'N/A'
    };
    
    Object.keys(fields).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Replace "Loading..." or any loading text
            if (el.textContent.includes('Loading') || el.textContent.trim() === '') {
                el.textContent = fields[id];
            }
        }
    });
    
    const statusEl = document.getElementById('profileStatusBadge');
    if (statusEl) {
        if (statusEl.textContent.includes('Loading') || statusEl.textContent.trim() === '') {
            statusEl.textContent = 'Unknown';
            statusEl.className = 'status-badge';
        }
    }
    
    // Also update violation summary container
    const violationContainer = document.getElementById('profileViolationSummary');
    if (violationContainer) {
        const hasLoading = violationContainer.innerHTML.includes('Loading');
        if (hasLoading) {
            violationContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                    <p>No violation data available</p>
                </div>
            `;
        }
    }
}

// Function to replace all "Loading..." text on page load
function replaceLoadingTexts() {
    // Replace all elements with "Loading..." text
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.children.length === 0 && el.textContent && el.textContent.trim() === 'Loading...') {
            // Only replace if it's a direct text node (not nested)
            const parent = el.parentElement;
            if (parent) {
                const id = el.id || parent.id;
                if (id && ['userName', 'studentId', 'studentIdValue', 'fullName', 'email', 'phone', 
                           'department', 'yearLevel', 'section', 
                           'enrollmentDate', 'address', 'profileStatusBadge'].includes(id)) {
                    // This will be handled by setAllFieldsToNA or updateProfileDisplay
                    return;
                }
            }
        }
    });
}

// Update sidebar profile with student data
function updateSidebarProfile() {
    if (!userProfile) {
        // Try to get from students API if not loaded yet
        const loadSidebarProfile = async () => {
            try {
                const url = USER_API_BASE + 'students.php';
                const response = await fetch(url);
                if (!response.ok) return;
                
                const data = await response.json();
                const students = data.data || data.students || [];
                const userId = getUserId();
                
                if (userId) {
                    const student = students.find(s => s.user_id && parseInt(s.user_id) === parseInt(userId));
                    if (student) {
                        updateSidebarProfileWithData(student);
                    }
                }
            } catch (error) {
                console.error('Error loading sidebar profile:', error);
            }
        };
        
        loadSidebarProfile();
        return;
    }
    
    updateSidebarProfileWithData(userProfile);
}

function updateSidebarProfileWithData(student) {
    const sidebarUsername = document.getElementById('sidebarUsername');
    const sidebarProfileImage = document.getElementById('sidebarProfileImage');
    
    if (sidebarUsername) {
        const firstName = student.first_name || student.firstName || '';
        const lastName = student.last_name || student.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Student';
        sidebarUsername.textContent = fullName;
    }
    
    if (sidebarProfileImage) {
        if (student.avatar && student.avatar.trim() !== '') {
            // Check if avatar is a full URL or relative path
            let avatarUrl = student.avatar;
            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
                avatarUrl = '../app/assets/img/students/' + avatarUrl;
            }
            sidebarProfileImage.src = avatarUrl;
            sidebarProfileImage.onerror = function() {
                this.src = '../app/assets/img/default.png';
            };
        } else {
            sidebarProfileImage.src = '../app/assets/img/default.png';
        }
    }
}

// Function to immediately replace all "Loading..." texts on page load
function replaceAllLoadingTexts() {
    const loadingTexts = ['Loading...', 'Loading', 'loading...', 'loading'];
    const elementsToCheck = [
        'userName', 'studentId', 'studentIdValue', 'fullName', 'email', 
        'phone', 'dateOfBirth', 'gender', 'department', 'yearLevel', 
        'section', 'enrollmentDate', 'address', 'profileStatusBadge'
    ];
    
    elementsToCheck.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const text = el.textContent.trim();
            if (loadingTexts.some(loading => text.includes(loading))) {
                console.log(`Replacing Loading text in ${id}`);
                if (id === 'userName') el.textContent = 'N/A';
                else if (id === 'studentId') el.textContent = 'Student ID: N/A';
                else if (id === 'profileStatusBadge') {
                    el.textContent = 'Unknown';
                    el.className = 'status-badge';
                }
                else el.textContent = 'N/A';
            }
        }
    });
    
    // Also check violation summary container
    const violationContainer = document.getElementById('profileViolationSummary');
    if (violationContainer && violationContainer.innerHTML.includes('Loading')) {
        violationContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                <p>Loading violation data...</p>
            </div>
        `;
    }
}

// Initialize immediately if DOM is ready, or wait for it
function initializeUserProfile() {
    // First, replace any "Loading..." texts immediately
    replaceAllLoadingTexts();
    
    // Check if we're on the profile page
    const profilePage = document.getElementById('userName') || 
                       document.getElementById('fullName') ||
                       document.getElementById('profileViolationSummary');
    
    if (profilePage) {
        // Page elements exist, initialize immediately
        console.log('✅ Profile page detected, initializing...');
        setTimeout(initUserProfile, 100);
    } else if (document.readyState === 'loading') {
        // Wait for DOM
        console.log('⏳ Waiting for DOM to load...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOM loaded, initializing profile...');
            replaceAllLoadingTexts();
            setTimeout(initUserProfile, 100);
        });
    } else {
        // DOM ready but page not loaded yet, try again later
        console.log('⚠️ Profile page not found, retrying...');
        setTimeout(initializeUserProfile, 500);
    }
}

// Also initialize when script loads
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🔄 Script loaded, checking for profile page...');
    replaceAllLoadingTexts();
    initializeUserProfile();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 DOMContentLoaded, checking for profile page...');
        replaceAllLoadingTexts();
        initializeUserProfile();
    });
}

// Export for dynamic loading
// Update sidebar profile with student data
function updateSidebarProfile() {
    if (!userProfile) {
        // Try to get from students API if not loaded yet
        const loadSidebarProfile = async () => {
            try {
                const url = USER_API_BASE + 'students.php';
                const response = await fetch(url);
                if (!response.ok) return;
                
                const data = await response.json();
                const students = data.data || data.students || [];
                const currentUserId = getUserId();
                
                if (currentUserId) {
                    const student = students.find(s => s.user_id && parseInt(s.user_id) === parseInt(currentUserId));
                    if (student) {
                        updateSidebarProfileWithData(student);
                    }
                }
            } catch (error) {
                console.error('Error loading sidebar profile:', error);
            }
        };
        
        loadSidebarProfile();
        return;
    }
    
    updateSidebarProfileWithData(userProfile);
}

function updateSidebarProfileWithData(student) {
    const sidebarUsername = document.getElementById('sidebarUsername');
    const sidebarProfileImage = document.getElementById('sidebarProfileImage');
    
    if (sidebarUsername) {
        const firstName = student.first_name || student.firstName || '';
        const lastName = student.last_name || student.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Student';
        sidebarUsername.textContent = fullName;
    }
    
    if (sidebarProfileImage) {
        if (student.avatar && student.avatar.trim() !== '') {
            // Check if avatar is a full URL or relative path
            let avatarUrl = student.avatar;
            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
                avatarUrl = '../app/assets/img/students/' + avatarUrl;
            }
            sidebarProfileImage.src = avatarUrl;
            sidebarProfileImage.onerror = function() {
                this.src = '../app/assets/img/default.png';
            };
        } else {
            sidebarProfileImage.src = '../app/assets/img/default.png';
        }
    }
}

window.initUserProfile = initUserProfile;
window.initializeUserProfile = initializeUserProfile;
window.updateSidebarProfile = updateSidebarProfile;

// Function to immediately replace all "Loading..." texts on page load
function replaceAllLoadingTexts() {
    const loadingTexts = ['Loading...', 'Loading', 'loading...', 'loading'];
    const elementsToCheck = [
        'userName', 'studentId', 'studentIdValue', 'fullName', 'email', 
        'phone', 'dateOfBirth', 'gender', 'department', 'yearLevel', 
        'section', 'enrollmentDate', 'address', 'profileStatusBadge'
    ];
    
    elementsToCheck.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const text = el.textContent.trim();
            if (loadingTexts.some(loading => text.includes(loading))) {
                console.log(`🔄 Replacing Loading text in ${id}`);
                if (id === 'userName') el.textContent = 'N/A';
                else if (id === 'studentId') el.textContent = 'Student ID: N/A';
                else if (id === 'profileStatusBadge') {
                    el.textContent = 'Unknown';
                    el.className = 'status-badge';
                }
                else el.textContent = 'N/A';
            }
        }
    });
    
    // Also check violation summary container
    const violationContainer = document.getElementById('profileViolationSummary');
    if (violationContainer && violationContainer.innerHTML.includes('Loading')) {
        violationContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class='bx bx-info-circle' style="font-size: 48px; color: var(--dark-grey); margin-bottom: 10px;"></i>
                <p>Loading violation data...</p>
            </div>
        `;
    }
}

// Initialize immediately when script loads
(function() {
    // Replace Loading texts immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        replaceAllLoadingTexts();
        setTimeout(initializeUserProfile, 100);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            replaceAllLoadingTexts();
            setTimeout(initializeUserProfile, 100);
        });
    }
    
    // Also try after a short delay to catch any late-loading elements
    setTimeout(replaceAllLoadingTexts, 500);
    setTimeout(replaceAllLoadingTexts, 2000);
})();

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
    // Priority: PHP-injected variable
    if (window.STUDENT_ID) return window.STUDENT_ID;
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
    
    // Prefer student_id_code (actual student ID string) over student_id (database ID)
    if (cookies.student_id_code) {
        return cookies.student_id_code;
    }
    
    if (cookies.student_id) {
        return cookies.student_id;
    }
    
    const storedCode = localStorage.getItem('student_id_code');
    if (storedCode) {
        return storedCode;
    }
    
    const storedId = localStorage.getItem('student_id');
    if (storedId) {
        return storedId;
    }
    
    try {
        const session = localStorage.getItem('userSession');
        if (session) {
            const parsed = JSON.parse(session);
            return parsed.studentIdCode || parsed.studentId;
        }
    } catch (e) {
        console.warn('Could not parse user session:', e);
    }
    
    return null;
}

async function loadUserProfile() {
    try {
        console.log('🔄 Loading user profile...');
        
        // First, try to get student_id from cookies/session
        let studentIdCode = getStudentId();
        console.log('Student ID Code from cookies/session:', studentIdCode);
        
        // If not found, fetch from users table using user_id
        if (!studentIdCode) {
            console.log('⚠️ Student ID not in cookies, fetching from users table...');
            const currentUserId = getUserId();
            
            if (!currentUserId) {
                console.warn('⚠️ User ID not found');
                setAllFieldsToNA('User not found - Please login again');
                return;
            }
            
            try {
                // Fetch student_id from users table
                const userInfoUrl = USER_API_BASE + 'user_info.php';
                console.log('Fetching user info from:', userInfoUrl);
                
                const userInfoResponse = await fetch(userInfoUrl);
                if (!userInfoResponse.ok) {
                    throw new Error(`HTTP ${userInfoResponse.status}: ${userInfoResponse.statusText}`);
                }
                
                const userInfoData = await userInfoResponse.json();
                console.log('User info response:', userInfoData);
                
                if (userInfoData.status === 'success' && userInfoData.data && userInfoData.data.student_id) {
                    studentIdCode = userInfoData.data.student_id;
                    console.log('✅ Got student_id from users table:', studentIdCode);
                    
                    // Store in localStorage for future use
                    localStorage.setItem('student_id_code', studentIdCode);
                } else {
                    console.warn('⚠️ Student ID not found in users table');
                    setAllFieldsToNA('Student profile not found - Please contact administrator');
                    return;
                }
            } catch (error) {
                console.error('❌ Error fetching user info:', error);
                setAllFieldsToNA('Error loading profile');
                return;
            }
        }
        
        if (!studentIdCode) {
            console.warn('⚠️ Student ID not found');
            setAllFieldsToNA('Student profile not found - Please login again');
            return;
        }
        
        // Query students table directly by student_id (the actual student ID string like "2023-0195")
        // Use student_id parameter to get single student directly from database
        const url = USER_API_BASE + 'students.php?student_id=' + encodeURIComponent(studentIdCode);
        console.log('Fetching student from students table:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('📦 Student API response (first 500 chars):', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e);
            console.error('Response text:', responseText);
            throw new Error('Invalid JSON response from students API');
        }
        
        if (data.status === 'error') {
            console.error('❌ API error:', data.message);
            throw new Error(data.message || 'Error loading student data');
        }

        // Get student data directly (single student response)
        userProfile = data.data || null;
        
        // If still not found, log for debugging
        if (!userProfile) {
            console.warn('⚠️ Student not found for student_id:', studentIdCode);
            console.warn('⚠️ API response:', data);
            setAllFieldsToNA('Student profile not found');
            return;
        }

        // Set studentId for violations loading - use the student_id_code (actual student ID string)
        studentId = userProfile.student_id || userProfile.studentId || studentIdCode || userProfile.id;
        console.log('✅ Loaded user profile successfully');
        console.log('Student ID (for violations):', studentId);
        console.log('Full Student data:', userProfile);
        console.log('Student data summary:', {
            id: userProfile.id,
            student_id: userProfile.student_id || userProfile.studentId,
            name: `${userProfile.first_name || userProfile.firstName || ''} ${userProfile.last_name || userProfile.lastName || ''}`.trim(),
            email: userProfile.email,
            department: userProfile.department || userProfile.department_name
        });
        
        // Update sidebar profile
        updateSidebarProfile();
        
        // Immediately update the display with the loaded data
        console.log('🔄 Updating profile display immediately after loading...');
        updateProfileDisplay();
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
        console.error('Error details:', error.message, error.stack);
        setAllFieldsToNA('Error loading profile');
    }
}

async function loadUserViolations() {
    try {
        // Use student_id from userProfile if available, otherwise use the global studentId
        const studentIdToUse = userProfile?.student_id || userProfile?.studentId || studentId;
        
        if (!studentIdToUse) {
            console.warn('⚠️ Student ID not available, cannot load violations');
            console.warn('userProfile:', userProfile);
            console.warn('studentId:', studentId);
            userViolations = [];
            updateViolationSummary(); // Update summary to show "No violations"
            return;
        }

        console.log('🔄 Loading user violations...');
        console.log('Using student_id:', studentIdToUse);
        const url = USER_API_BASE + 'violations.php?student_id=' + encodeURIComponent(studentIdToUse);
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', response.status, errorText);
            userViolations = [];
            updateViolationSummary(); // Update summary even on error
            return;
        }

        const responseText = await response.text();
        console.log('📦 Violations API response (first 500 chars):', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e);
            console.error('Response text:', responseText);
            userViolations = [];
            updateViolationSummary(); // Update summary even on parse error
            return;
        }
        
        if (data.status === 'error') {
            console.error('❌ API error:', data.message);
            userViolations = [];
            updateViolationSummary(); // Update summary even on API error
            return;
        }

        userViolations = data.violations || data.data || [];
        console.log(`✅ Loaded ${userViolations.length} violations for student_id: ${studentIdToUse}`);
        console.log('Violations data:', userViolations);
        
        // Immediately update violation summary after loading
        updateViolationSummary();
    } catch (error) {
        console.error('❌ Error loading violations:', error);
        console.error('Error details:', error.message, error.stack);
        userViolations = [];
        updateViolationSummary(); // Update summary even on error
    }
}

function updateProfileDisplay() {
    // First, replace any remaining "Loading..." texts
    replaceAllLoadingTexts();
    
    if (!userProfile) {
        console.warn('⚠️ User profile not loaded yet');
        console.log('Current userProfile:', userProfile);
        // Still try to replace Loading texts
        setAllFieldsToNA('Profile not loaded');
        return;
    }

    console.log('🔄 Updating profile display with data:', userProfile);

    // Update profile header - handle both snake_case and camelCase
    const firstName = userProfile.first_name || userProfile.firstName || '';
    const middleName = userProfile.middle_name || userProfile.middleName || '';
    const lastName = userProfile.last_name || userProfile.lastName || '';
    const fullName = `${firstName} ${middleName} ${lastName}`.trim();
    
    console.log('Full name:', fullName);
    
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = fullName || 'Student';
        console.log('✅ Updated userName:', fullName);
    }

    const studentIdValue = userProfile.student_id || userProfile.studentId || 'N/A';
    const studentIdEl = document.getElementById('studentId');
    if (studentIdEl) {
        studentIdEl.textContent = `Student ID: ${studentIdValue}`;
        console.log('✅ Updated studentId header:', studentIdValue);
    }

    const studentIdValueEl = document.getElementById('studentIdValue');
    if (studentIdValueEl) {
        studentIdValueEl.textContent = studentIdValue;
        console.log('✅ Updated studentIdValue:', studentIdValue);
    }

    // Update personal information
    const fullNameEl = document.getElementById('fullName');
    if (fullNameEl) {
        fullNameEl.textContent = fullName || 'N/A';
        console.log('✅ Updated fullName:', fullName);
    }

    const emailEl = document.getElementById('email');
    if (emailEl) {
        const email = userProfile.email || 'N/A';
        emailEl.textContent = email;
        console.log('✅ Updated email:', email);
    }

    const phoneEl = document.getElementById('phone');
    if (phoneEl) {
        const phone = userProfile.contact_number || userProfile.contact || userProfile.phone || 'N/A';
        phoneEl.textContent = phone;
        console.log('✅ Updated phone:', phone);
    }

    // Update academic information
    const departmentEl = document.getElementById('department');
    if (departmentEl) {
        const dept = userProfile.department || userProfile.department_name || 'N/A';
        departmentEl.textContent = dept;
        console.log('✅ Updated department:', dept);
    }

    const yearLevelEl = document.getElementById('yearLevel');
    if (yearLevelEl) {
        const yearLevel = userProfile.year_level || userProfile.yearLevel || userProfile.year || 'N/A';
        yearLevelEl.textContent = yearLevel;
        console.log('✅ Updated yearLevel:', yearLevel);
    }

    const sectionEl = document.getElementById('section');
    if (sectionEl) {
        const section = userProfile.section || userProfile.section_code || userProfile.section_name || 'N/A';
        sectionEl.textContent = section;
        console.log('✅ Updated section:', section);
    }

    // Update advisor - hide if N/A or empty
    const advisorEl = document.getElementById('advisor');
    const advisorItem = advisorEl ? advisorEl.closest('.info-item') : null;
    if (advisorEl) {
        const advisor = userProfile.advisor || userProfile.advisor_name || userProfile.adviser || null;
        if (advisor && advisor !== 'N/A' && advisor.toString().trim() !== '') {
            advisorEl.textContent = advisor;
            if (advisorItem) advisorItem.style.display = '';
            console.log('✅ Updated advisor:', advisor);
        } else {
            advisorEl.textContent = 'N/A';
            if (advisorItem) advisorItem.style.display = 'none';
            console.log('⚠️ No advisor found, hiding field');
        }
    }

    // Update enrollment date
    const enrollmentDateEl = document.getElementById('enrollmentDate');
    if (enrollmentDateEl) {
        const enrollmentDate = userProfile.enrollment_date || userProfile.enrollmentDate || userProfile.created_at || null;
        if (enrollmentDate) {
            enrollmentDateEl.textContent = formatDate(enrollmentDate);
            console.log('✅ Updated enrollmentDate:', enrollmentDate);
        } else {
            enrollmentDateEl.textContent = 'N/A';
            console.log('⚠️ No enrollment date found');
        }
    }

    // Update graduation date - hide if N/A or empty
    const graduationDateEl = document.getElementById('graduationDate');
    const graduationDateItem = graduationDateEl ? graduationDateEl.closest('.info-item') : null;
    if (graduationDateEl) {
        const graduationDate = userProfile.graduation_date || userProfile.graduationDate || null;
        if (graduationDate && graduationDate !== 'N/A' && graduationDate.toString().trim() !== '') {
            graduationDateEl.textContent = formatDate(graduationDate);
            if (graduationDateItem) graduationDateItem.style.display = '';
            console.log('✅ Updated graduationDate:', graduationDate);
        } else {
            graduationDateEl.textContent = 'N/A';
            if (graduationDateItem) graduationDateItem.style.display = 'none';
            console.log('⚠️ No graduation date found, hiding field');
        }
    }

    // Update address
    const addressEl = document.getElementById('address');
    if (addressEl) {
        const address = userProfile.address || 'N/A';
        addressEl.textContent = address;
        console.log('✅ Updated address:', address);
    }

    // Update emergency contact - hide if N/A or empty
    const emergencyContactEl = document.getElementById('emergencyContact');
    const emergencyContactItem = emergencyContactEl ? emergencyContactEl.closest('.info-item') : null;
    if (emergencyContactEl) {
        const emergencyContact = userProfile.emergency_contact || userProfile.emergencyContact || null;
        if (emergencyContact && emergencyContact !== 'N/A' && emergencyContact.toString().trim() !== '') {
            emergencyContactEl.textContent = emergencyContact;
            if (emergencyContactItem) emergencyContactItem.style.display = '';
            console.log('✅ Updated emergencyContact:', emergencyContact);
        } else {
            emergencyContactEl.textContent = 'N/A';
            if (emergencyContactItem) emergencyContactItem.style.display = 'none';
            console.log('⚠️ No emergency contact found, hiding field');
        }
    }

    // Update guardian - hide if N/A or empty
    const guardianEl = document.getElementById('guardian');
    const guardianItem = guardianEl ? guardianEl.closest('.info-item') : null;
    if (guardianEl) {
        const guardian = userProfile.guardian || userProfile.guardian_name || null;
        if (guardian && guardian !== 'N/A' && guardian.toString().trim() !== '') {
            guardianEl.textContent = guardian;
            if (guardianItem) guardianItem.style.display = '';
            console.log('✅ Updated guardian:', guardian);
        } else {
            guardianEl.textContent = 'N/A';
            if (guardianItem) guardianItem.style.display = 'none';
            console.log('⚠️ No guardian found, hiding field');
        }
    }
    
    // Update contact phone in Contact Information section
    const contactPhoneEl = document.getElementById('contactPhone');
    if (contactPhoneEl) {
        const contactPhone = userProfile.contact_number || userProfile.contact || userProfile.phone || 'N/A';
        contactPhoneEl.textContent = contactPhone;
        console.log('✅ Updated contactPhone:', contactPhone);
    }
    
    // Update profile picture
    const profilePictureEl = document.getElementById('profilePicture');
    if (profilePictureEl) {
        if (userProfile.avatar && userProfile.avatar.trim() !== '') {
            let avatarUrl = userProfile.avatar;
            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
                avatarUrl = '../app/assets/img/students/' + avatarUrl;
            }
            profilePictureEl.src = avatarUrl;
            profilePictureEl.onerror = function() {
                this.src = '../app/assets/img/default.png';
            };
            console.log('✅ Updated profile picture:', avatarUrl);
        } else {
            profilePictureEl.src = '../app/assets/img/default.png';
            console.log('⚠️ No avatar found, using default');
        }
    }

    // Update status
    const statusEl = document.querySelector('.status-badge') || document.getElementById('profileStatusBadge');
    if (statusEl) {
        const activeViolations = userViolations.filter(v => {
            const status = (v.status || '').toLowerCase();
            return status !== 'resolved' && status !== 'permitted';
        }).length;
        statusEl.textContent = activeViolations === 0 ? 'Good Standing' : 'Warning';
        statusEl.className = `status-badge ${activeViolations === 0 ? 'good' : 'warning'}`;
        console.log('✅ Updated status badge, active violations:', activeViolations);
    }

    console.log('✅ Profile display updated successfully');
}

function updateViolationSummary() {
    const container = document.querySelector('.violation-summary-cards') || document.getElementById('profileViolationSummary');
    if (!container) {
        console.warn('⚠️ Violation summary container not found');
        return;
    }

    console.log('🔄 Updating violation summary...');
    console.log('userViolations:', userViolations);
    console.log('userViolations length:', userViolations ? userViolations.length : 0);
    console.log('Is array?', Array.isArray(userViolations));

    // Remove any loading indicators first
    if (container.innerHTML.includes('Loading') || container.innerHTML.includes('loading')) {
        console.log('🔄 Removing loading indicator from violation summary');
    }

    // If no violations data, show empty state
    if (!userViolations || !Array.isArray(userViolations) || userViolations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class='bx bx-check-circle' style="font-size: 48px; color: #10b981; margin-bottom: 10px;"></i>
                <p>No violations recorded</p>
            </div>
        `;
        console.log('✅ Updated violation summary: No violations');
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
