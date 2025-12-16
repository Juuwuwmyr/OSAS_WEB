// student.js - Complete working version with API integration
function initStudentsModule() {
    console.log('🛠 Students module initializing...');
    
    try {
        // Elements
        const tableBody = document.getElementById('StudentsTableBody');
        const btnAddStudent = document.getElementById('btnAddStudents');
        const btnAddFirstStudent = document.getElementById('btnAddFirstStudent');
        const modal = document.getElementById('StudentsModal');
        const modalOverlay = document.getElementById('StudentsModalOverlay');
        const closeBtn = document.getElementById('closeStudentsModal');
        const cancelBtn = document.getElementById('cancelStudentsModal');
        const studentsForm = document.getElementById('StudentsForm');
        const searchInput = document.getElementById('searchStudent');
        const filterSelect = document.getElementById('StudentsFilterSelect');
        const printBtn = document.getElementById('btnPrintStudents');
        const studentDeptSelect = document.getElementById('studentDept');
        const studentSectionSelect = document.getElementById('studentSection');

        // Check for essential elements
        if (!tableBody) {
            console.error('❗ #StudentsTableBody not found');
            return;
        }

        if (!modal) {
            console.warn('⚠️ #StudentsModal not found');
        }

        // Students data (will be loaded from database)
        let students = [];
        let allStudents = []; // Store all students for stats
        let currentView = 'active'; // 'active' or 'archived'
        let editingStudentId = null;

        // ========== DYNAMIC API PATH DETECTION ==========
        // Detect the correct API path based on current page location
        function getAPIBasePath() {
            const currentPath = window.location.pathname;
            console.log('📍 Current path:', currentPath);
            
            // Try to extract the base project path from the URL
            // e.g., /OSAS_WEBSYS/app/views/loader.php -> /OSAS_WEBSYS/
            const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
            const projectBase = pathMatch ? pathMatch[1] : '';
            console.log('📁 Project base:', projectBase);
            
            // Use absolute path from project root for reliability
            if (projectBase) {
                // We have a project folder (e.g., /OSAS_WEBSYS)
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
        console.log('🔗 API Base Path:', API_BASE);
        
        const apiBase = API_BASE+'students.php';
        const departmentsApiBase = API_BASE + 'departments.php';
        const sectionsApiBase = API_BASE + 'sections.php';
        
        console.log('📡 Students API:', apiBase);
        console.log('📡 Departments API:', departmentsApiBase);
        console.log('📡 Sections API:', sectionsApiBase);

        // --- API Functions ---
        async function fetchStudents() {
            try {
                const filter = filterSelect ? filterSelect.value : 'all';
                const search = searchInput ? searchInput.value : '';
                
                let url = `${apiBase}?action=get&filter=${filter}`;
                if (search) {
                    url += `&search=${encodeURIComponent(search)}`;
                }
                
                console.log('Fetching students from:', url); // Debug log
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const text = await response.text();
                console.log('Raw API Response:', text); // Debug log
                
                let result;
                try {
                    result = JSON.parse(text);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', text);
                    throw new Error('Invalid JSON response from server. The students table may not exist. Please run the database setup SQL files.');
                }
                
                console.log('Parsed API Response:', result); // Debug log
                
                if (result.status === 'success') {
                    allStudents = result.data || [];
                    
                    // Filter by current view
                    if (currentView === 'archived') {
                        students = allStudents.filter(s => s.status === 'archived');
                    } else {
                        students = allStudents.filter(s => s.status !== 'archived');
                    }
                    
                    renderStudents();
                    await loadStats();
                } else {
                    console.error('Error fetching students:', result.message);
                    showError(result.message || 'Failed to load students');
                }
            } catch (error) {
                console.error('Error fetching students:', error);
                console.error('Full error details:', error.message, error.stack);
                showError('Error loading students: ' + error.message + '. Please check if the students table exists in the database.');
            }
        }

        async function loadStats() {
            try {
                const response = await fetch(`${apiBase}?action=stats`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (parseError) {
                    console.error('JSON Parse Error in stats:', parseError);
                    return; // Silently fail for stats
                }
                
                if (result.status === 'success') {
                    const stats = result.data;
                    const totalEl = document.getElementById('totalStudents');
                    const activeEl = document.getElementById('activeStudents');
                    const inactiveEl = document.getElementById('inactiveStudents');
                    const graduatingEl = document.getElementById('graduatingStudents');
                    
                    if (totalEl) totalEl.textContent = stats.total || 0;
                    if (activeEl) activeEl.textContent = stats.active || 0;
                    if (inactiveEl) inactiveEl.textContent = stats.inactive || 0;
                    if (graduatingEl) graduatingEl.textContent = stats.graduating || 0;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
                // Don't show error for stats, just log it
            }
        }

        async function addStudent(formData) {
            try {
                formData.append('action', 'add');
                const response = await fetch(`${apiBase}?action=add`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showSuccess(result.message || 'Student added successfully!');
                    await fetchStudents();
                    closeModal();
                } else {
                    showError(result.message || 'Failed to add student');
                }
            } catch (error) {
                console.error('Error adding student:', error);
                showError('Error adding student. Please try again.');
            }
        }

        async function updateStudent(studentId, formData) {
            try {
                formData.append('action', 'update');
                formData.append('studentId', studentId);
                
                const response = await fetch(`${apiBase}?action=update`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showSuccess(result.message || 'Student updated successfully!');
                    await fetchStudents();
                    closeModal();
                } else {
                    showError(result.message || 'Failed to update student');
                }
            } catch (error) {
                console.error('Error updating student:', error);
                showError('Error updating student. Please try again.');
            }
        }

        async function deleteStudent(studentId) {
            try {
                const response = await fetch(`${apiBase}?action=delete&id=${studentId}`, {
                    method: 'GET'
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showSuccess(result.message || 'Student archived successfully!');
                    await fetchStudents();
                } else {
                    showError(result.message || 'Failed to archive student');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                showError('Error archiving student. Please try again.');
            }
        }

        async function restoreStudent(studentId) {
            try {
                const response = await fetch(`${apiBase}?action=restore&id=${studentId}`, {
                    method: 'GET'
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showSuccess(result.message || 'Student restored successfully!');
                    await fetchStudents();
                } else {
                    showError(result.message || 'Failed to restore student');
                }
            } catch (error) {
                console.error('Error restoring student:', error);
                showError('Error restoring student. Please try again.');
            }
        }

        async function activateStudent(studentId) {
            try {
                const formData = new FormData();
                formData.append('action', 'update');
                formData.append('studentId', studentId);
                formData.append('studentStatus', 'active');
                
                // Get current student data first
                const student = allStudents.find(s => s.id === studentId);
                if (student) {
                    formData.append('studentIdCode', student.studentId);
                    formData.append('firstName', student.firstName);
                    formData.append('lastName', student.lastName);
                    formData.append('studentEmail', student.email);
                    formData.append('studentContact', student.contact || '');
                    formData.append('studentDept', student.department || '');
                    formData.append('studentSection', student.section_id || '');
                    formData.append('studentStatus', 'active');
                }
                
                const response = await fetch(`${apiBase}?action=update`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showSuccess('Student activated successfully!');
                    await fetchStudents();
                } else {
                    showError(result.message || 'Failed to activate student');
                }
            } catch (error) {
                console.error('Error activating student:', error);
                showError('Error activating student. Please try again.');
            }
        }

        async function deactivateStudent(studentId) {
            try {
                const formData = new FormData();
                formData.append('action', 'update');
                formData.append('studentId', studentId);
                formData.append('studentStatus', 'inactive');
                
                // Get current student data first
                const student = allStudents.find(s => s.id === studentId);
                if (student) {
                    formData.append('studentIdCode', student.studentId);
                    formData.append('firstName', student.firstName);
                    formData.append('lastName', student.lastName);
                    formData.append('studentEmail', student.email);
                    formData.append('studentContact', student.contact || '');
                    formData.append('studentDept', student.department || '');
                    formData.append('studentSection', student.section_id || '');
                    formData.append('studentStatus', 'inactive');
                }
                
                const response = await fetch(`${apiBase}?action=update`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showSuccess('Student deactivated successfully!');
                    await fetchStudents();
                } else {
                    showError(result.message || 'Failed to deactivate student');
                }
            } catch (error) {
                console.error('Error deactivating student:', error);
                showError('Error deactivating student. Please try again.');
            }
        }

        async function loadDepartments() {
            if (!studentDeptSelect) {
                console.warn('studentDeptSelect element not found');
                return;
            }
            
            try {
                const response = await fetch(departmentsApiBase);
                const result = await response.json();
                console.log('Departments API response:', result);
                
                // Clear existing options except the first one
                studentDeptSelect.innerHTML = '<option value="">Select Department</option>';
                
                if (result.status === 'success' && result.data && result.data.length > 0) {
                    result.data.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept.code; // Use department_code as value
                        option.textContent = dept.name; // Use department_name as display text
                        studentDeptSelect.appendChild(option);
                    });
                    console.log(`Loaded ${result.data.length} departments`);
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No departments available';
                    studentDeptSelect.appendChild(option);
                    console.warn('No departments found or API error:', result);
                }
            } catch (error) {
                console.error('Error loading departments:', error);
                studentDeptSelect.innerHTML = '<option value="">Error loading departments</option>';
            }
        }

        async function loadSectionsByDepartment(departmentCode) {
            if (!departmentCode || !studentSectionSelect) {
                console.warn('Missing departmentCode or studentSectionSelect');
                return;
            }
            
            try {
                const url = `${sectionsApiBase}?action=getByDepartment&department_code=${encodeURIComponent(departmentCode)}`;
                console.log('Loading sections from:', url);
                const response = await fetch(url);
                const result = await response.json();
                console.log('Sections API response:', result);
                
                // Clear existing options
                studentSectionSelect.innerHTML = '<option value="">Select Section</option>';
                
                if (result.status === 'success' && result.data && result.data.length > 0) {
                    result.data.forEach(section => {
                        const option = document.createElement('option');
                        option.value = section.id;
                        option.textContent = `${section.section_code} - ${section.section_name}`;
                        studentSectionSelect.appendChild(option);
                    });
                    console.log(`Loaded ${result.data.length} sections for department ${departmentCode}`);
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No sections available';
                    studentSectionSelect.appendChild(option);
                    console.warn('No sections found for department:', departmentCode, result);
                }
            } catch (error) {
                console.error('Error loading sections:', error);
                studentSectionSelect.innerHTML = '<option value="">Error loading sections</option>';
            }
        }

        // --- Render function ---
        function renderStudents() {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const filterValue = filterSelect ? filterSelect.value : 'all';
            
            const filteredStudents = students.filter(s => {
                const fullName = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.toLowerCase();
                const matchesSearch = fullName.includes(searchTerm) || 
                                    (s.studentId || '').toLowerCase().includes(searchTerm) ||
                                    (s.email || '').toLowerCase().includes(searchTerm) ||
                                    (s.department || '').toLowerCase().includes(searchTerm) ||
                                    (s.section || '').toLowerCase().includes(searchTerm);
                
                // Filter by status, but exclude archived from normal view
                let matchesFilter = true;
                if (currentView === 'archived') {
                    matchesFilter = s.status === 'archived';
                } else {
                    matchesFilter = s.status !== 'archived' && (filterValue === 'all' || s.status === filterValue);
                }
                
                return matchesSearch && matchesFilter;
            });

            // Show/hide empty state
            const emptyState = document.getElementById('StudentsEmptyState');
            if (emptyState) {
                emptyState.style.display = filteredStudents.length === 0 ? 'flex' : 'none';
            }

            if (filteredStudents.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px; color: #999;">
                            <i class='bx bx-inbox' style="font-size: 48px; display: block; margin-bottom: 10px;"></i>
                            <p>No students found</p>
                        </td>
                    </tr>
                `;
            } else {
                tableBody.innerHTML = filteredStudents.map(s => {
                    const fullName = `${s.firstName || ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName || ''}`;
                    const deptClass = getDepartmentClass(s.department);
                    
                    // Build avatar URL - handle relative paths
                    let avatarUrl = '';
                    if (s.avatar && s.avatar !== '') {
                        // If it's already a full URL (http/https) or data URL, use it as is
                        if (s.avatar.startsWith('http') || s.avatar.startsWith('data:')) {
                            avatarUrl = s.avatar;
                        } else {
                            // It's a relative path like 'assets/img/students/filename.jpg' or 'app/assets/img/students/filename.jpg'
                            // Normalize to app/assets/ if it starts with assets/
                            let normalizedAvatar = s.avatar;
                            if (normalizedAvatar.startsWith('assets/') && !normalizedAvatar.startsWith('app/assets/')) {
                                normalizedAvatar = normalizedAvatar.replace('assets/', 'app/assets/');
                            }
                            // Convert to absolute path from project root
                            const pathMatch = window.location.pathname.match(/^(\/[^\/]+)\//);
                            const projectBase = pathMatch ? pathMatch[1] : '';
                            avatarUrl = projectBase + '/' + normalizedAvatar;
                        }
                    } else {
                        // Use default avatar generator
                        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffd700&color=333&size=40`;
                    }
                    
                    return `
                    <tr data-id="${s.id}">
                        <td class="student-row-id">${s.id}</td>
                        <td class="student-image-cell">
                            <div class="student-image-wrapper">
                                <img src="${avatarUrl}" alt="${escapeHtml(fullName)}" class="student-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffd700&color=333&size=40'">
                            </div>
                        </td>
                        <td class="student-id">${escapeHtml(s.studentId || '')}</td>
                        <td class="student-name">
                            <div class="student-name-wrapper">
                                <strong>${escapeHtml(fullName)}</strong>
                                <small>${escapeHtml(s.email || '')}</small>
                            </div>
                        </td>
                        <td class="student-dept">
                            <span class="dept-badge ${deptClass}">${escapeHtml(s.department || 'N/A')}</span>
                        </td>
                        <td class="student-section">${escapeHtml(s.section || 'N/A')}</td>
                        <td class="student-contact">${escapeHtml(s.contact || 'N/A')}</td>
                        <td>
                            <span class="Students-status-badge ${s.status || 'active'}">${formatStatus(s.status || 'active')}</span>
                        </td>
                        <td>
                            <div class="Students-action-buttons">
                                <button class="Students-action-btn view" data-id="${s.id}" title="View Profile">
                                    <i class='bx bx-user'></i>
                                </button>
                                <button class="Students-action-btn edit" data-id="${s.id}" title="Edit">
                                    <i class='bx bx-edit'></i>
                                </button>
                                <button class="Students-action-btn delete" data-id="${s.id}" title="Archive">
                                    <i class='bx bx-trash'></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                }).join('');
            }

            updateCounts(filteredStudents);
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getDepartmentClass(dept) {
            const classes = {
                'BSIT': 'bsit',
                'BSCS': 'bscs',
                'BSBA': 'business',
                'BSN': 'nursing',
                'BEED': 'education',
                'BSED': 'education',
                'CS': 'bsit',
                'BA': 'business',
                'NUR': 'nursing',
                'BSIS': 'bsit',
                'WFT': 'default',
                'BTVTEd': 'education'
            };
            return classes[dept] || 'default';
        }

        function formatStatus(status) {
            const statusMap = {
                'active': 'Active',
                'inactive': 'Inactive',
                'graduating': 'Graduating',
                'archived': 'Archived'
            };
            return statusMap[status] || status;
        }

        function updateCounts(filteredStudents) {
            const showingEl = document.getElementById('showingStudentsCount');
            const totalCountEl = document.getElementById('totalStudentsCount');
            
            if (showingEl) showingEl.textContent = filteredStudents.length;
            if (totalCountEl) totalCountEl.textContent = allStudents.length;
        }

        // --- Modal functions ---
        async function openModal(editId = null) {
            if (!modal) return;
            
            const modalTitle = document.getElementById('StudentsModalTitle');
            const form = document.getElementById('StudentsForm');
            
            editingStudentId = editId;
            
            // Load departments every time modal opens
            await loadDepartments();
            
            if (editId) {
                modalTitle.textContent = 'Edit Student';
                const student = allStudents.find(s => s.id === editId);
                if (student) {
                    document.getElementById('studentId').value = student.studentId || '';
                    document.getElementById('studentStatus').value = student.status || 'active';
                    document.getElementById('firstName').value = student.firstName || '';
                    document.getElementById('middleName').value = student.middleName || '';
                    document.getElementById('lastName').value = student.lastName || '';
                    document.getElementById('studentEmail').value = student.email || '';
                    document.getElementById('studentContact').value = student.contact || '';
                    document.getElementById('studentDept').value = student.department || '';
                    document.getElementById('studentAddress').value = student.address || '';
                    
                    // Load sections for the department
                    if (student.department) {
                        await loadSectionsByDepartment(student.department);
                        if (student.section_id) {
                            document.getElementById('studentSection').value = student.section_id;
                        }
                    }
                    
                    // Set image preview if avatar exists
                    if (student.avatar && student.avatar !== '') {
                        const previewImg = document.querySelector('.Students-preview-img');
                        const previewPlaceholder = document.querySelector('.Students-preview-placeholder');
                        if (previewImg && previewPlaceholder) {
                            // Build the correct avatar URL
                            let avatarUrl = student.avatar;
                            // If it's a relative path, make it absolute
                            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:') && !avatarUrl.startsWith('/')) {
                                // It's a relative path like 'assets/img/students/filename.jpg' or 'app/assets/img/students/filename.jpg'
                                // Normalize to app/assets/ if needed
                                if (avatarUrl.startsWith('assets/') && !avatarUrl.startsWith('app/assets/')) {
                                    avatarUrl = avatarUrl.replace('assets/', 'app/assets/');
                                }
                                // Convert to absolute path from project root
                                const pathMatch = window.location.pathname.match(/^(\/[^\/]+)\//);
                                const projectBase = pathMatch ? pathMatch[1] : '';
                                avatarUrl = projectBase + '/' + avatarUrl;
                            }
                            previewImg.src = avatarUrl;
                            previewImg.setAttribute('data-existing-avatar', student.avatar); // Store original path
                            previewImg.style.display = 'block';
                            previewPlaceholder.style.display = 'none';
                        }
                    }
                }
            } else {
                modalTitle.textContent = 'Add New Student';
                if (form) form.reset();
                // Reset image preview
                const previewImg = document.querySelector('.Students-preview-img');
                const previewPlaceholder = document.querySelector('.Students-preview-placeholder');
                if (previewImg && previewPlaceholder) {
                    previewImg.style.display = 'none';
                    previewImg.src = '';
                    previewImg.removeAttribute('data-existing-avatar');
                    previewPlaceholder.style.display = 'flex';
                }
                // Reset image input
                const studentImageInput = document.getElementById('studentImage');
                if (studentImageInput) {
                    studentImageInput.value = '';
                }
                // Reset section dropdown
                if (studentSectionSelect) {
                    studentSectionSelect.innerHTML = '<option value="">Select Department First</option>';
                }
            }
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            if (!modal) return;
            
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            const form = document.getElementById('StudentsForm');
            if (form) form.reset();
            // Reset image preview
            const previewImg = document.querySelector('.Students-preview-img');
            const previewPlaceholder = document.querySelector('.Students-preview-placeholder');
            if (previewImg && previewPlaceholder) {
                previewImg.style.display = 'none';
                previewImg.src = '';
                previewImg.removeAttribute('data-existing-avatar');
                previewPlaceholder.style.display = 'flex';
            }
            // Reset image input
            const studentImageInput = document.getElementById('studentImage');
            if (studentImageInput) {
                studentImageInput.value = '';
            }
            editingStudentId = null;
        }

        // --- Event handlers ---
        function handleTableClick(e) {
            const viewBtn = e.target.closest('.Students-action-btn.view');
            const editBtn = e.target.closest('.Students-action-btn.edit');
            const deleteBtn = e.target.closest('.Students-action-btn.delete');

            if (viewBtn) {
                const id = parseInt(viewBtn.dataset.id);
                const student = allStudents.find(s => s.id === id);
                if (student) {
                    const fullName = `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`;
                    alert(`Viewing ${fullName}\nStudent ID: ${student.studentId}\nEmail: ${student.email}\nDepartment: ${student.department}\nSection: ${student.section}`);
                }
            }

            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                openModal(id);
            }

            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                const student = allStudents.find(s => s.id === id);
                if (student && confirm(`Archive student "${student.firstName} ${student.lastName}"?`)) {
                    deleteStudent(id);
                }
            }
        }

        // Utility functions
        function showError(message) {
            alert(message); // You can replace this with a better notification system
        }

        function showSuccess(message) {
            alert(message); // You can replace this with a better notification system
        }

        // --- Initialize ---
        async function initialize() {
            // Set default view to active (hide archived by default)
            currentView = 'active';
            if (filterSelect) {
                filterSelect.value = 'active';
            }

            // Initial load - only active students
            await fetchStudents();

            // Event listeners for table
            tableBody.addEventListener('click', handleTableClick);

            // Add Student button
            if (btnAddStudent) {
                btnAddStudent.addEventListener('click', () => openModal());
            }

            // Add First Student button
            if (btnAddFirstStudent) {
                btnAddFirstStudent.addEventListener('click', () => openModal());
            }

            // Close modal
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
            if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

            // Escape key to close modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                    closeModal();
                }
            });

            // Image upload preview
            const studentImageInput = document.getElementById('studentImage');
            const uploadImageBtn = document.getElementById('uploadImageBtn');
            const previewImg = document.querySelector('.Students-preview-img');
            const previewPlaceholder = document.querySelector('.Students-preview-placeholder');

            if (uploadImageBtn) {
                uploadImageBtn.addEventListener('click', () => {
                    if (studentImageInput) studentImageInput.click();
                });
            }

            if (studentImageInput && previewImg && previewPlaceholder) {
                studentImageInput.addEventListener('change', function() {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            previewImg.src = e.target.result;
                            previewImg.style.display = 'block';
                            previewPlaceholder.style.display = 'none';
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            // Department change - load sections
            if (studentDeptSelect) {
                studentDeptSelect.addEventListener('change', function() {
                    const deptCode = this.value;
                    if (deptCode) {
                        loadSectionsByDepartment(deptCode);
                    } else {
                        if (studentSectionSelect) {
                            studentSectionSelect.innerHTML = '<option value="">Select Department First</option>';
                        }
                    }
                });
            }

            // Form submission
            if (studentsForm) {
                studentsForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const studentId = document.getElementById('studentId').value.trim();
                    const firstName = document.getElementById('firstName').value.trim();
                    const lastName = document.getElementById('lastName').value.trim();
                    const middleName = document.getElementById('middleName').value.trim();
                    const studentEmail = document.getElementById('studentEmail').value.trim();
                    const studentContact = document.getElementById('studentContact').value.trim();
                    const studentAddress = document.getElementById('studentAddress').value.trim();
                    const studentDept = document.getElementById('studentDept').value;
                    const studentSection = document.getElementById('studentSection').value;
                    const studentStatus = document.getElementById('studentStatus').value;
                    
                    if (!studentId || !firstName || !lastName || !studentEmail || !studentContact || !studentDept || !studentSection) {
                        alert('Please fill in all required fields.');
                        return;
                    }

                    // Handle avatar image upload
                    const studentImageInput = document.getElementById('studentImage');
                    let avatarPath = '';
                    
                    // If a new image file is selected, upload it first
                    if (studentImageInput && studentImageInput.files && studentImageInput.files.length > 0) {
                        try {
                            const uploadFormData = new FormData();
                            uploadFormData.append('image', studentImageInput.files[0]);
                            
                            const uploadApiBase = window.location.pathname.includes('admin_page')
                                ? '../../api/upload_student_image.php'
                                : '../api/upload_student_image.php';
                            
                            const uploadResponse = await fetch(uploadApiBase, {
                                method: 'POST',
                                body: uploadFormData
                            });
                            
                            const uploadResult = await uploadResponse.json();
                            
                            if (uploadResult.status === 'success' && uploadResult.data && uploadResult.data.path) {
                                avatarPath = uploadResult.data.path; // e.g., 'app/assets/img/students/filename.jpg'
                            } else {
                                showError(uploadResult.message || 'Failed to upload image');
                                return;
                            }
                        } catch (error) {
                            console.error('Error uploading image:', error);
                            showError('Error uploading image. Please try again.');
                            return;
                        }
                    } else {
                        // No new file - check if we have existing avatar (for edit mode)
                        const previewImg = document.querySelector('.Students-preview-img');
                        if (previewImg && previewImg.getAttribute('data-existing-avatar')) {
                            avatarPath = previewImg.getAttribute('data-existing-avatar');
                        }
                    }
                    
                    // Now submit the form with the avatar path
                    const formData = new FormData();
                    if (editingStudentId) {
                        formData.append('studentId', editingStudentId);
                    }
                    
                    formData.append('studentIdCode', studentId);
                    formData.append('firstName', firstName);
                    formData.append('middleName', middleName);
                    formData.append('lastName', lastName);
                    formData.append('studentEmail', studentEmail);
                    formData.append('studentContact', studentContact);
                    formData.append('studentAddress', studentAddress);
                    formData.append('studentDept', studentDept);
                    formData.append('studentSection', studentSection);
                    formData.append('studentStatus', studentStatus);
                    formData.append('studentAvatar', avatarPath);
                    
                    if (editingStudentId) {
                        await updateStudent(editingStudentId, formData);
                    } else {
                        await addStudent(formData);
                    }
                });
            }

            // Search functionality
            if (searchInput) {
                searchInput.addEventListener('input', renderStudents);
            }

            // Filter functionality - hide archived by default
            if (filterSelect) {
                // Set default to active
                filterSelect.value = 'active';
                currentView = 'active';
                
                filterSelect.addEventListener('change', () => {
                    if (filterSelect.value === 'archived') {
                        currentView = 'archived';
                    } else {
                        currentView = 'active';
                    }
                    fetchStudents();
                    // Update archived button state
                    const btnArchived = document.getElementById('btnArchivedStudents');
                    if (btnArchived) {
                        if (currentView === 'archived') {
                            btnArchived.classList.add('active');
                        } else {
                            btnArchived.classList.remove('active');
                        }
                    }
                });
            }

            // Archived button functionality
            const btnArchived = document.getElementById('btnArchivedStudents');
            if (btnArchived) {
                btnArchived.addEventListener('click', () => {
                    if (currentView === 'archived') {
                        // Switch back to active view
                        currentView = 'active';
                        if (filterSelect) filterSelect.value = 'active';
                        btnArchived.classList.remove('active');
                    } else {
                        // Switch to archived view
                        currentView = 'archived';
                        if (filterSelect) filterSelect.value = 'archived';
                        btnArchived.classList.add('active');
                    }
                    fetchStudents();
                });
            }

            // Print functionality
            if (printBtn) {
                printBtn.addEventListener('click', function() {
                    const tableTitle = document.querySelector('.Students-table-title')?.textContent || 'Student List';
                    const tableSubtitle = document.querySelector('.Students-table-subtitle')?.textContent || 'All student records and their details';

                    // Generate HTML table for printing
                    let printTableHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Section</th>
                                    <th>Contact No</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    students.forEach(student => {
                        const fullName = `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`;
                        
                        printTableHTML += `
                            <tr>
                                <td>${student.id}</td>
                                <td>${student.studentId}</td>
                                <td>${fullName}<br><small>${student.email}</small></td>
                                <td>${student.department}</td>
                                <td>${student.section}</td>
                                <td>${student.contact}</td>
                                <td><span class="status-badge ${student.status}">${formatStatus(student.status)}</span></td>
                            </tr>
                        `;
                    });

                    printTableHTML += `
                            </tbody>
                        </table>
                    `;

                    const printContent = `
                        <html>
                            <head>
                                <title>Students Report - OSAS System</title>
                                <style>
                                    body { font-family: 'Segoe UI', sans-serif; margin: 40px; }
                                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                    th { background-color: #f8f9fa; font-weight: 600; }
                                    h1 { color: #333; margin-bottom: 10px; }
                                    .report-header { margin-bottom: 30px; }
                                    .report-date { color: #666; margin-bottom: 20px; }
                                    .status-badge { 
                                        padding: 4px 12px; 
                                        border-radius: 20px; 
                                        font-size: 12px; 
                                        font-weight: 600; 
                                    }
                                    .active { background: #e8f5e9; color: #2e7d32; }
                                    .inactive { background: #ffebee; color: #c62828; }
                                    .graduating { background: #e3f2fd; color: #1565c0; }
                                </style>
                            </head>
                            <body>
                                <div class="report-header">
                                    <h1>${tableTitle}</h1>
                                    <p style="color: #666;">${tableSubtitle}</p>
                                    <div class="report-date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</div>
                                </div>
                                ${printTableHTML}
                            </body>
                        </html>
                    `;

                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.print();
                });
            }

            // Sort functionality
            const sortHeaders = document.querySelectorAll('.Students-sortable');
            sortHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const sortBy = this.dataset.sort;
                    sortStudents(sortBy);
                });
            });

            function sortStudents(sortBy) {
                students.sort((a, b) => {
                    switch(sortBy) {
                        case 'name':
                            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                            return nameA.localeCompare(nameB);
                        case 'studentId':
                            return (a.studentId || '').localeCompare(b.studentId || '');
                        case 'department':
                            return (a.department || '').localeCompare(b.department || '');
                        case 'section':
                            return (a.section || '').localeCompare(b.section || '');
                        case 'status':
                            return (a.status || '').localeCompare(b.status || '');
                        case 'id':
                            return (a.id || 0) - (b.id || 0);
                        default:
                            return 0;
                    }
                });
                renderStudents();
            }

            // --- Export functionality ---
            const btnExport = document.getElementById('btnExportStudents');
            const exportModal = document.getElementById('exportModal');
            const exportModalOverlay = document.getElementById('exportModalOverlay');
            const closeExportModal = document.getElementById('closeExportModal');
            const cancelExportModal = document.getElementById('cancelExportModal');
            const exportFormatSelect = document.getElementById('exportFormat');
            const confirmExportBtn = document.getElementById('confirmExportBtn');

            function getFilteredStudents() {
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                const filterValue = filterSelect ? filterSelect.value : 'all';
                
                return students.filter(s => {
                    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
                    const matchesSearch = fullName.includes(searchTerm) || 
                                         (s.studentId || '').toLowerCase().includes(searchTerm) ||
                                         (s.department || '').toLowerCase().includes(searchTerm);
                    const matchesFilter = filterValue === 'all' || s.status === filterValue;
                    return matchesSearch && matchesFilter;
                });
            }

            function exportToPDF() {
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    const filteredStudents = getFilteredStudents();

                    doc.setFontSize(18);
                    doc.text('Students Report', 14, 20);
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}`, 14, 28);

                    const tableData = filteredStudents.map(student => [
                        student.studentId || student.id,
                        `${student.firstName || ''} ${student.lastName || ''}`,
                        student.department || 'N/A',
                        student.section || 'N/A',
                        student.email || 'N/A',
                        student.status === 'active' ? 'Active' : (student.status === 'graduating' ? 'Graduating' : 'Inactive')
                    ]);

                    doc.autoTable({
                        head: [['Student ID', 'Name', 'Department', 'Section', 'Email', 'Status']],
                        body: tableData,
                        startY: 35,
                        styles: { fontSize: 8, cellPadding: 2 },
                        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        margin: { top: 35 }
                    });

                    doc.save(`Students_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                    closeExportModalFunc();
                    alert('PDF exported successfully!');
                } catch (error) {
                    console.error('Error exporting to PDF:', error);
                    alert('Error exporting to PDF. Please try again.');
                }
            }

            function exportToExcel() {
                try {
                    const filteredStudents = getFilteredStudents();
                    const data = filteredStudents.map(student => ({
                        'Student ID': student.studentId || student.id,
                        'First Name': student.firstName || '',
                        'Middle Name': student.middleName || '',
                        'Last Name': student.lastName || '',
                        'Department': student.department || '',
                        'Section': student.section || '',
                        'Email': student.email || '',
                        'Phone': student.phone || '',
                        'Status': student.status || 'active'
                    }));

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws['!cols'] = [
                        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }
                    ];
                    XLSX.utils.book_append_sheet(wb, ws, 'Students');
                    XLSX.writeFile(wb, `Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                    closeExportModalFunc();
                    alert('Excel file exported successfully!');
                } catch (error) {
                    console.error('Error exporting to Excel:', error);
                    alert('Error exporting to Excel. Please try again.');
                }
            }

            function exportToWord() {
                try {
                    const filteredStudents = getFilteredStudents();
                    let htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Students Report</title><style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; line-height: 1.6; }
                        h1 { color: #333; border-bottom: 3px solid #4285f4; padding-bottom: 10px; margin-bottom: 10px; }
                        .report-info { color: #666; margin-bottom: 30px; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        th { background-color: #4285f4; color: white; padding: 12px; text-align: left; font-weight: 600; }
                        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
                        tr:nth-child(even) { background-color: #f5f5f5; }
                        tr:hover { background-color: #e8f0fe; }
                    </style></head><body>
                        <h1>Students Report</h1>
                        <div class="report-info">Generated on: ${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}<br>Total Students: ${filteredStudents.length}</div>
                        <table><thead><tr><th>Student ID</th><th>Name</th><th>Department</th><th>Section</th><th>Email</th><th>Status</th></tr></thead><tbody>`;

                    filteredStudents.forEach(student => {
                        htmlContent += `<tr>
                            <td>${student.studentId || student.id}</td>
                            <td>${student.firstName || ''} ${student.lastName || ''}</td>
                            <td>${student.department || 'N/A'}</td>
                            <td>${student.section || 'N/A'}</td>
                            <td>${student.email || 'N/A'}</td>
                            <td>${student.status || 'active'}</td>
                        </tr>`;
                    });

                    htmlContent += `</tbody></table></body></html>`;
                    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Students_Report_${new Date().toISOString().split('T')[0]}.doc`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    closeExportModalFunc();
                    alert('Word document exported successfully!');
                } catch (error) {
                    console.error('Error exporting to Word:', error);
                    alert('Error exporting to Word. Please try again.');
                }
            }

            function exportToCSV() {
                try {
                    const filteredStudents = getFilteredStudents();
                    const headers = ['Student ID', 'First Name', 'Middle Name', 'Last Name', 'Department', 'Section', 'Email', 'Phone', 'Status'];
                    const rows = filteredStudents.map(student => [
                        student.studentId || student.id,
                        `"${(student.firstName || '').replace(/"/g, '""')}"`,
                        `"${(student.middleName || '').replace(/"/g, '""')}"`,
                        `"${(student.lastName || '').replace(/"/g, '""')}"`,
                        `"${(student.department || '').replace(/"/g, '""')}"`,
                        `"${(student.section || '').replace(/"/g, '""')}"`,
                        `"${(student.email || '').replace(/"/g, '""')}"`,
                        `"${(student.phone || '').replace(/"/g, '""')}"`,
                        student.status || 'active'
                    ]);
                    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Students_Report_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    closeExportModalFunc();
                    alert('CSV file exported successfully!');
                } catch (error) {
                    console.error('Error exporting to CSV:', error);
                    alert('Error exporting to CSV. Please try again.');
                }
            }

            function exportToJSON() {
                try {
                    const filteredStudents = getFilteredStudents();
                    const jsonData = {
                        exportDate: new Date().toISOString(),
                        totalStudents: filteredStudents.length,
                        students: filteredStudents.map(student => ({
                            studentId: student.studentId || student.id,
                            firstName: student.firstName || '',
                            middleName: student.middleName || '',
                            lastName: student.lastName || '',
                            department: student.department || '',
                            section: student.section || '',
                            email: student.email || '',
                            phone: student.phone || '',
                            status: student.status || 'active'
                        }))
                    };
                    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Students_Report_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    closeExportModalFunc();
                    alert('JSON file exported successfully!');
                } catch (error) {
                    console.error('Error exporting to JSON:', error);
                    alert('Error exporting to JSON. Please try again.');
                }
            }

            function closeExportModalFunc() {
                if (exportModal) {
                    exportModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    if (exportFormatSelect) exportFormatSelect.value = '';
                }
            }

            if (btnExport) {
                btnExport.addEventListener('click', function() {
                    if (students.length === 0) {
                        alert('No students to export. Please add students first.');
                        return;
                    }
                    if (exportModal) {
                        exportModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                        if (exportFormatSelect) exportFormatSelect.value = '';
                    }
                });
            }

            if (closeExportModal) closeExportModal.addEventListener('click', closeExportModalFunc);
            if (cancelExportModal) cancelExportModal.addEventListener('click', closeExportModalFunc);
            if (exportModalOverlay) exportModalOverlay.addEventListener('click', closeExportModalFunc);

            if (confirmExportBtn) {
                confirmExportBtn.addEventListener('click', function() {
                    if (!exportFormatSelect || !exportFormatSelect.value) {
                        alert('Please select an export format.');
                        return;
                    }
                    switch(exportFormatSelect.value) {
                        case 'pdf': exportToPDF(); break;
                        case 'excel': exportToExcel(); break;
                        case 'word': exportToWord(); break;
                        case 'csv': exportToCSV(); break;
                        case 'json': exportToJSON(); break;
                        default: alert('Unknown export format');
                    }
                });
            }

            // Import functionality
            const btnImport = document.getElementById('btnImportStudents');
            const importModal = document.getElementById('importModal');
            const importModalOverlay = document.getElementById('importModalOverlay');
            const closeImportModal = document.getElementById('closeImportModal');
            const cancelImportModal = document.getElementById('cancelImportModal');
            const importFileInput = document.getElementById('importFile');
            const confirmImportBtn = document.getElementById('confirmImportBtn');
            const selectedFileName = document.getElementById('selectedFileName');
            const importPreview = document.getElementById('importPreview');
            const previewTable = document.getElementById('previewTable');
            let importData = [];

            function closeImportModalFunc() {
                if (importModal) {
                    importModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    if (importFileInput) importFileInput.value = '';
                    if (selectedFileName) selectedFileName.style.display = 'none';
                    if (importPreview) importPreview.style.display = 'none';
                    if (confirmImportBtn) confirmImportBtn.disabled = true;
                    importData = [];
                }
            }

            if (btnImport) {
                btnImport.addEventListener('click', function() {
                    if (importModal) {
                        importModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                        if (importFileInput) importFileInput.value = '';
                        if (selectedFileName) selectedFileName.style.display = 'none';
                        if (importPreview) importPreview.style.display = 'none';
                        if (confirmImportBtn) confirmImportBtn.disabled = true;
                        importData = [];
                    }
                });
            }

            if (closeImportModal) closeImportModal.addEventListener('click', closeImportModalFunc);
            if (cancelImportModal) cancelImportModal.addEventListener('click', closeImportModalFunc);
            if (importModalOverlay) importModalOverlay.addEventListener('click', closeImportModalFunc);

            if (importFileInput) {
                importFileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    const validExtensions = ['.csv', '.xls', '.xlsx'];
                    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                    if (!validExtensions.includes(fileExtension)) {
                        alert('Invalid file type. Please upload a CSV or Excel file.');
                        this.value = '';
                        return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                        alert('File size exceeds 10MB limit.');
                        this.value = '';
                        return;
                    }
                    if (selectedFileName) {
                        selectedFileName.innerHTML = `<i class='bx bx-file'></i> ${file.name}`;
                        selectedFileName.style.display = 'flex';
                    }
                    parseImportFile(file);
                });
            }

            function parseImportFile(file) {
                const reader = new FileReader();
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                reader.onload = function(e) {
                    try {
                        if (fileExtension === '.csv') {
                            parseCSV(e.target.result);
                        } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
                            parseExcel(e.target.result, file);
                        }
                    } catch (error) {
                        console.error('Error parsing file:', error);
                        alert('Error parsing file. Please check the file format.');
                    }
                };
                if (fileExtension === '.csv') {
                    reader.readAsText(file);
                } else {
                    reader.readAsArrayBuffer(file);
                }
            }

            function parseCSV(csvText) {
                const lines = csvText.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    alert('File must contain at least a header row and one data row.');
                    return;
                }
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
                const studentIdIdx = findColumnIndex(headers, ['student id', 'student_id', 'id']);
                const firstNameIdx = findColumnIndex(headers, ['first name', 'firstname', 'first_name', 'fname']);
                const lastNameIdx = findColumnIndex(headers, ['last name', 'lastname', 'last_name', 'lname']);
                const middleNameIdx = findColumnIndex(headers, ['middle name', 'middlename', 'middle_name', 'mname']);
                const deptIdx = findColumnIndex(headers, ['department', 'dept', 'department code']);
                const sectionIdx = findColumnIndex(headers, ['section', 'section code']);
                const emailIdx = findColumnIndex(headers, ['email', 'email address']);
                const phoneIdx = findColumnIndex(headers, ['phone', 'phone number', 'contact']);
                const statusIdx = findColumnIndex(headers, ['status']);

                if (studentIdIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
                    alert('Required columns not found. Please ensure the file contains "Student ID", "First Name", and "Last Name" columns.');
                    return;
                }

                importData = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    const student = {
                        studentId: values[studentIdIdx]?.trim() || '',
                        firstName: values[firstNameIdx]?.trim() || '',
                        lastName: values[lastNameIdx]?.trim() || '',
                        middleName: middleNameIdx >= 0 ? (values[middleNameIdx]?.trim() || '') : '',
                        department: deptIdx >= 0 ? (values[deptIdx]?.trim() || '') : '',
                        section: sectionIdx >= 0 ? (values[sectionIdx]?.trim() || '') : '',
                        email: emailIdx >= 0 ? (values[emailIdx]?.trim() || '') : '',
                        phone: phoneIdx >= 0 ? (values[phoneIdx]?.trim() || '') : '',
                        status: statusIdx >= 0 ? (values[statusIdx]?.trim().toLowerCase() || 'active') : 'active'
                    };
                    if (student.studentId && student.firstName && student.lastName) {
                        importData.push(student);
                    }
                }
                if (importData.length === 0) {
                    alert('No valid data found in the file.');
                    return;
                }
                showPreview();
            }

            function parseCSVLine(line) {
                const values = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());
                return values;
            }

            function parseExcel(arrayBuffer, file) {
                try {
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    if (jsonData.length < 2) {
                        alert('File must contain at least a header row and one data row.');
                        return;
                    }
                    const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
                    const studentIdIdx = findColumnIndex(headers, ['student id', 'student_id', 'id']);
                    const firstNameIdx = findColumnIndex(headers, ['first name', 'firstname', 'first_name', 'fname']);
                    const lastNameIdx = findColumnIndex(headers, ['last name', 'lastname', 'last_name', 'lname']);
                    const middleNameIdx = findColumnIndex(headers, ['middle name', 'middlename', 'middle_name', 'mname']);
                    const deptIdx = findColumnIndex(headers, ['department', 'dept', 'department code']);
                    const sectionIdx = findColumnIndex(headers, ['section', 'section code']);
                    const emailIdx = findColumnIndex(headers, ['email', 'email address']);
                    const phoneIdx = findColumnIndex(headers, ['phone', 'phone number', 'contact']);
                    const statusIdx = findColumnIndex(headers, ['status']);

                    if (studentIdIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
                        alert('Required columns not found. Please ensure the file contains "Student ID", "First Name", and "Last Name" columns.');
                        return;
                    }

                    importData = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length < 1) continue;
                        const student = {
                            studentId: String(row[studentIdIdx] || '').trim(),
                            firstName: String(row[firstNameIdx] || '').trim(),
                            lastName: String(row[lastNameIdx] || '').trim(),
                            middleName: middleNameIdx >= 0 ? String(row[middleNameIdx] || '').trim() : '',
                            department: deptIdx >= 0 ? String(row[deptIdx] || '').trim() : '',
                            section: sectionIdx >= 0 ? String(row[sectionIdx] || '').trim() : '',
                            email: emailIdx >= 0 ? String(row[emailIdx] || '').trim() : '',
                            phone: phoneIdx >= 0 ? String(row[phoneIdx] || '').trim() : '',
                            status: statusIdx >= 0 ? String(row[statusIdx] || '').trim().toLowerCase() || 'active' : 'active'
                        };
                        if (student.studentId && student.firstName && student.lastName) {
                            importData.push(student);
                        }
                    }
                    if (importData.length === 0) {
                        alert('No valid data found in the file.');
                        return;
                    }
                    showPreview();
                } catch (error) {
                    console.error('Error parsing Excel file:', error);
                    alert('Error parsing Excel file. Please check the file format.');
                }
            }

            function findColumnIndex(headers, possibleNames) {
                for (let name of possibleNames) {
                    const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
                    if (idx !== -1) return idx;
                }
                return -1;
            }

            function showPreview() {
                if (!importPreview || !previewTable || importData.length === 0) return;
                const previewRows = importData.slice(0, 5);
                let html = '<table><thead><tr><th>Student ID</th><th>First Name</th><th>Last Name</th><th>Department</th><th>Status</th></tr></thead><tbody>';
                previewRows.forEach(row => {
                    html += `<tr><td>${row.studentId}</td><td>${row.firstName}</td><td>${row.lastName}</td><td>${row.department || 'N/A'}</td><td>${row.status}</td></tr>`;
                });
                html += '</tbody></table>';
                if (importData.length > 5) {
                    html += `<p style="margin-top: 12px; color: #666; font-size: 13px;">... and ${importData.length - 5} more rows</p>`;
                }
                previewTable.innerHTML = html;
                importPreview.style.display = 'block';
                if (confirmImportBtn) confirmImportBtn.disabled = false;
            }

            if (confirmImportBtn) {
                confirmImportBtn.addEventListener('click', async function() {
                    if (importData.length === 0) {
                        alert('No data to import.');
                        return;
                    }
                    this.disabled = true;
                    this.classList.add('loading');
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="bx bx-loader-alt"></i> Importing...';
                    try {
                        const formData = new FormData();
                        formData.append('students', JSON.stringify(importData));
                        const response = await fetch('../api/students.php?action=import', {
                            method: 'POST',
                            body: formData
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            alert(`Successfully imported ${result.data.imported || importData.length} student(s)!`);
                            closeImportModalFunc();
                            fetchStudents();
                            fetchStats();
                        } else {
                            alert('Error: ' + result.message);
                            this.disabled = false;
                            this.classList.remove('loading');
                            this.innerHTML = originalText;
                        }
                    } catch (error) {
                        console.error('Error importing students:', error);
                        alert('Error importing students. Please try again.');
                        this.disabled = false;
                        this.classList.remove('loading');
                        this.innerHTML = originalText;
                    }
                });
            }
        }

        // Start initialization
        initialize();
        
    } catch (error) {
        console.error('❌ Error initializing Students module:', error);
    }
}