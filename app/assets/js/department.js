// department.js
function initDepartmentModule() {
  console.log('🛠 Initializing Department module...');

  // Elements
  const tableBody = document.getElementById('departmentTableBody');
  const btnAddDepartment = document.getElementById('btnAddDepartment');
  const btnAddFirstDept = document.getElementById('btnAddFirstDepartment');
  const modal = document.getElementById('departmentModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelModal');
  const departmentForm = document.getElementById('departmentForm');
  const searchInput = document.getElementById('searchDepartment');
  const filterSelect = document.getElementById('departmentFilter');
  const printBtn = document.getElementById('btnPrintDepartments');

  // Check for essential elements
  if (!tableBody) {
    console.error('❗ #departmentTableBody not found. Table won\'t render.');
    return;
  }

  if (!modal) {
    console.warn('⚠️ #departmentModal not found. Modal functionality disabled.');
  }

  // --- Department data (loaded from database) ---
  let departments = [];
  let currentView = 'active'; // 'active' or 'archived'

  // Get department icon based on code
  function getDeptIcon(code) {
    const icons = {
      'CS': 'bx-code-alt',
      'BA': 'bx-briefcase-alt',
      'NUR': 'bx-heart',
      'BSIS': 'bx-laptop',
      'WFT': 'bx-cog',
      'BTVTEd': 'bx-wrench',
      'ENG': 'bx-calculator',
      'ART': 'bx-palette'
    };
    return icons[code] || 'bx-building';
  }

  // --- Render helper (updated for new table structure) ---
  function renderDepartments(deptArray = departments) {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterValue = filterSelect ? filterSelect.value : 'all';
    
    // Filter departments
    const filteredDepts = deptArray.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm) || 
                           d.code.toLowerCase().includes(searchTerm) ||
                           d.hod.toLowerCase().includes(searchTerm);
      const matchesFilter = filterValue === 'all' || d.status === filterValue;
      return matchesSearch && matchesFilter;
    });

    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    if (filteredDepts.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      tableBody.innerHTML = '';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    tableBody.innerHTML = filteredDepts.map(d => `
      <tr data-id="${d.id}">
        <td class="department-id">${d.id}</td>
        <td class="department-name">
          <div class="name-wrapper">
            <div class="department-icon">
              <i class='bx ${getDeptIcon(d.code)}'></i>
            </div>
            <div>
              <strong>${d.name}</strong>
              <small class="department-code">${d.code}</small>
            </div>
          </div>
        </td>
        <td class="hod-name">${d.hod}</td>
        <td class="student-count">${d.studentCount}</td>
        <td class="date-created">${d.date}</td>
        <td>
          <span class="status-badge ${d.status}">${d.status === 'active' ? 'Active' : 'Archived'}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit" data-id="${d.id}" title="Edit">
              <i class='bx bx-edit'></i>
            </button>
            ${d.status === 'archived' ? 
              `<button class="action-btn restore" data-id="${d.id}" title="Restore">
                <i class='bx bx-reset'></i>
              </button>` : 
              ''
            }
            <button class="action-btn delete" data-id="${d.id}" title="Delete">
              <i class='bx bx-trash'></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Update stats and counts
    updateStats();
    updateCounts(filteredDepts);
  }

  // Update statistics (now loaded from database)
  function updateStats() {
    // Stats are loaded from database via loadStats()
    // This function is kept for compatibility but stats are updated via API
  }

  // Update showing/total counts
  function updateCounts(filteredDepts) {
    const showingEl = document.getElementById('showingCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (showingEl) showingEl.textContent = filteredDepts.length;
    if (totalCountEl) totalCountEl.textContent = departments.length;
  }

  // --- Load departments from database ---
  async function loadDepartments(filter = 'active') {
    try {
      // Determine correct API path based on context
      const apiPath = window.location.pathname.includes('admin_page') 
        ? '../../api/departments.php' 
        : '../api/departments.php';
      
      const url = `${apiPath}?action=get&filter=${filter}`;
      console.log('Fetching from:', url); // Debug log
      
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
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('Parsed API Response:', result); // Debug log
      
      if (result.status === 'success') {
        departments = result.data.map(dept => ({
          id: dept.department_id,
          name: dept.name,
          code: dept.code,
          hod: dept.hod,
          studentCount: dept.student_count,
          date: dept.date,
          status: dept.status,
          description: dept.description,
          dbId: dept.id // Store database ID for API calls
        }));
        renderDepartments();
        loadStats();
      } else {
        console.error('Error loading departments:', result.message);
        alert('Error loading departments: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      console.error('Full error details:', error.message, error.stack);
      alert('Error fetching departments. Please check your connection and console for details.');
    }
  }

  // --- Load statistics from database ---
  async function loadStats() {
    try {
      const response = await fetch('../api/departments.php?action=stats');
      const result = await response.json();
      
      if (result.status === 'success') {
        const stats = result.data;
        const totalEl = document.getElementById('totalDepartments');
        const activeEl = document.getElementById('activeDepartments');
        const archivedEl = document.getElementById('archivedDepartments');
        
        if (totalEl) totalEl.textContent = stats.total;
        if (activeEl) activeEl.textContent = stats.active;
        if (archivedEl) archivedEl.textContent = stats.archived;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  // Initial load - fetch from database
  loadDepartments('active');

  // --- Modal functions ---
  function openModal(editId = null) {
    if (!modal) return;
    
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('departmentForm');
    
    if (editId) {
      // Edit mode
      modalTitle.textContent = 'Edit Department';
      const dept = departments.find(d => d.id === editId);
      if (dept) {
        document.getElementById('deptName').value = dept.name;
        document.getElementById('deptCode').value = dept.code;
        document.getElementById('hodName').value = dept.hod === 'N/A' ? '' : dept.hod;
        document.getElementById('deptDescription').value = dept.description || '';
        document.getElementById('deptStatus').value = dept.status;
      }
      modal.dataset.editingId = editId;
      modal.dataset.editingDbId = dept ? dept.dbId : null;
    } else {
      // Add mode
      modalTitle.textContent = 'Add New Department';
      if (form) form.reset();
      delete modal.dataset.editingId;
      delete modal.dataset.editingDbId;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    const form = document.getElementById('departmentForm');
    if (form) form.reset();
    delete modal.dataset.editingId;
  }

  // --- Actions (event delegation) ---
  tableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.action-btn.edit');
    const restoreBtn = e.target.closest('.action-btn.restore');
    const deleteBtn = e.target.closest('.action-btn.delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      openModal(id);
    }

    if (restoreBtn) {
      const id = restoreBtn.dataset.id;
      const dept = departments.find(d => d.id === id);
      if (dept && confirm(`Restore department "${dept.name}"?`)) {
        restoreDepartment(dept.dbId);
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const dept = departments.find(d => d.id === id);
      if (dept && confirm(`Archive department "${dept.name}"? This will move it to archived.`)) {
        deleteDepartment(dept.dbId);
      }
    }
  });

  // --- Modal open/close + Save ---
  if (btnAddDepartment && modal) {
    // Add Department button
    btnAddDepartment.addEventListener('click', () => {
      openModal();
    });

    // Add First Department button (empty state)
    if (btnAddFirstDept) {
      btnAddFirstDept.addEventListener('click', () => {
        openModal();
      });
    }

    // Close modal buttons
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Form submission
    if (departmentForm) {
      departmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const deptName = document.getElementById('deptName').value.trim();
        const deptCode = document.getElementById('deptCode').value.trim();
        const hodName = document.getElementById('hodName').value.trim();
        const deptDescription = document.getElementById('deptDescription').value.trim();
        const deptStatus = document.getElementById('deptStatus').value;
        
        if (!deptName || !deptCode) {
          alert('Please fill in Department Name and Department Code.');
          return;
        }

        const editingDbId = modal.dataset.editingDbId;
        
        if (editingDbId) {
          // Update existing department
          updateDepartment(editingDbId, {
            deptName,
            deptCode,
            hodName,
            deptDescription,
            deptStatus
          });
        } else {
          // Add new department
          addDepartment({
            deptName,
            deptCode,
            hodName,
            deptDescription,
            deptStatus
          });
        }
      });
    }
  } else {
    console.warn('ℹ️ Department modal elements not found or not mounted (skipping modal wiring).');
  }

  // --- Search functionality ---
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          loadDepartmentsWithSearch(currentView, searchTerm);
        } else {
          loadDepartments(currentView);
        }
      }, 300); // Debounce search
    });
  }

  // --- Load departments with search ---
  async function loadDepartmentsWithSearch(filter = 'active', search = '') {
    try {
      const url = `../api/departments.php?action=get&filter=${filter}&search=${encodeURIComponent(search)}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.status === 'success') {
        departments = result.data.map(dept => ({
          id: dept.department_id,
          name: dept.name,
          code: dept.code,
          hod: dept.hod,
          studentCount: dept.student_count,
          date: dept.date,
          status: dept.status,
          description: dept.description,
          dbId: dept.id
        }));
        renderDepartments();
      } else {
        console.error('Error loading departments:', result.message);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  // --- Archived button functionality ---
  const btnArchived = document.getElementById('btnArchived');

  // --- Filter functionality ---
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      const filterValue = filterSelect.value;
      if (filterValue === 'archived') {
        currentView = 'archived';
        loadDepartments('archived');
        if (btnArchived) btnArchived.classList.add('active');
      } else if (filterValue === 'active') {
        currentView = 'active';
        loadDepartments('active');
        if (btnArchived) btnArchived.classList.remove('active');
      } else {
        currentView = 'all';
        loadDepartments('all');
        if (btnArchived) btnArchived.classList.remove('active');
      }
    });
  }

  if (btnArchived) {
    btnArchived.addEventListener('click', () => {
      if (currentView === 'archived') {
        // Switch back to active view
        currentView = 'active';
        if (filterSelect) filterSelect.value = 'active';
        loadDepartments('active');
        btnArchived.classList.remove('active');
      } else {
        // Switch to archived view
        currentView = 'archived';
        if (filterSelect) filterSelect.value = 'archived';
        loadDepartments('archived');
        btnArchived.classList.add('active');
      }
    });
  }

  // --- API Functions ---
  async function addDepartment(data) {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));

      const response = await fetch('../api/departments.php?action=add', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert(result.message);
        closeModal();
        loadDepartments(currentView);
        loadStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding department:', error);
      alert('Error adding department. Please try again.');
    }
  }

  async function updateDepartment(dbId, data) {
    try {
      const formData = new FormData();
      formData.append('deptId', dbId);
      Object.keys(data).forEach(key => formData.append(key, data[key]));

      const response = await fetch('../api/departments.php?action=update', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert(result.message);
        closeModal();
        loadDepartments(currentView);
        loadStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Error updating department. Please try again.');
    }
  }

  async function deleteDepartment(dbId) {
    try {
      const response = await fetch(`../api/departments.php?action=delete&id=${dbId}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert(result.message);
        loadDepartments(currentView);
        loadStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department. Please try again.');
    }
  }

  async function archiveDepartment(dbId) {
    try {
      const response = await fetch(`../api/departments.php?action=archive&id=${dbId}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert(result.message);
        loadDepartments(currentView);
        loadStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error archiving department:', error);
      alert('Error archiving department. Please try again.');
    }
  }

  async function restoreDepartment(dbId) {
    try {
      const response = await fetch(`../api/departments.php?action=restore&id=${dbId}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert(result.message);
        loadDepartments(currentView);
        loadStats();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error restoring department:', error);
      alert('Error restoring department. Please try again.');
    }
  }

  // --- Sort functionality ---
  const sortHeaders = document.querySelectorAll('.sortable');
  sortHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sortBy = this.dataset.sort;
      sortDepartments(sortBy);
    });
  });

  function sortDepartments(sortBy) {
    departments.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.date) - new Date(a.date); // newest first
        case 'id':
        default:
          return a.id.localeCompare(b.id);
      }
    });
    renderDepartments();
  }

  // --- Print functionality ---
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      const printArea = document.querySelector('.content-card');

      const printContent = `
        <html>
          <head>
            <title>Departments Report - OSAS System</title>
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
              .archived { background: #ffebee; color: #c62828; }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h1>Departments Report</h1>
              <div class="report-date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            ${printArea.innerHTML}
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    });
  }

  // --- Export functionality ---
  const btnExport = document.getElementById('btnExport');
  const exportModal = document.getElementById('exportModal');
  const exportModalOverlay = document.getElementById('exportModalOverlay');
  const closeExportModal = document.getElementById('closeExportModal');
  const cancelExportModal = document.getElementById('cancelExportModal');
  const exportFormatSelect = document.getElementById('exportFormat');
  const confirmExportBtn = document.getElementById('confirmExportBtn');

  // Open export modal
  if (btnExport) {
    btnExport.addEventListener('click', function() {
      if (departments.length === 0) {
        alert('No departments to export. Please add departments first.');
        return;
      }
      if (exportModal) {
        exportModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Reset select
        if (exportFormatSelect) {
          exportFormatSelect.value = '';
        }
      }
    });
  }

  // Close export modal
  function closeExportModalFunc() {
    if (exportModal) {
      exportModal.classList.remove('active');
      document.body.style.overflow = 'auto';
      // Reset select
      if (exportFormatSelect) {
        exportFormatSelect.value = '';
      }
    }
  }

  if (closeExportModal) {
    closeExportModal.addEventListener('click', closeExportModalFunc);
  }

  if (cancelExportModal) {
    cancelExportModal.addEventListener('click', closeExportModalFunc);
  }

  if (exportModalOverlay) {
    exportModalOverlay.addEventListener('click', closeExportModalFunc);
  }

  // Escape key to close export modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && exportModal && exportModal.classList.contains('active')) {
      closeExportModalFunc();
    }
  });

  // Get filtered departments for export
  function getFilteredDepartments() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterValue = filterSelect ? filterSelect.value : 'all';
    
    return departments.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm) || 
                           d.code.toLowerCase().includes(searchTerm) ||
                           d.hod.toLowerCase().includes(searchTerm);
      const matchesFilter = filterValue === 'all' || d.status === filterValue;
      return matchesSearch && matchesFilter;
    });
  }

  // Export to PDF
  function exportToPDF() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const filteredDepts = getFilteredDepartments();

      // Add title
      doc.setFontSize(18);
      doc.text('Departments Report', 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 14, 28);

      // Prepare table data
      const tableData = filteredDepts.map(dept => [
        dept.id,
        `${dept.name} (${dept.code})`,
        dept.hod || 'N/A',
        dept.studentCount || 0,
        dept.date,
        dept.status === 'active' ? 'Active' : 'Archived'
      ]);

      // Add table
      doc.autoTable({
        head: [['ID', 'Department', 'Head of Dept', 'Students', 'Date Created', 'Status']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 35 }
      });

      // Save PDF
      const fileName = `Departments_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      closeExportModalFunc();
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  }

  // Export to Excel
  function exportToExcel() {
    try {
      const filteredDepts = getFilteredDepartments();
      
      // Prepare data
      const data = filteredDepts.map(dept => ({
        'ID': dept.id,
        'Department Name': dept.name,
        'Department Code': dept.code,
        'Head of Department': dept.hod || 'N/A',
        'Student Count': dept.studentCount || 0,
        'Date Created': dept.date,
        'Status': dept.status === 'active' ? 'Active' : 'Archived',
        'Description': dept.description || ''
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // ID
        { wch: 25 },  // Department Name
        { wch: 15 },  // Department Code
        { wch: 25 },  // Head of Department
        { wch: 12 },  // Student Count
        { wch: 15 },  // Date Created
        { wch: 10 },  // Status
        { wch: 40 }   // Description
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Departments');

      // Generate file name
      const fileName = `Departments_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
      
      closeExportModalFunc();
      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    }
  }

  // Export to Word
  function exportToWord() {
    try {
      const filteredDepts = getFilteredDepartments();
      
      // Create Word document content
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Departments Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 40px;
              line-height: 1.6;
            }
            h1 {
              color: #333;
              border-bottom: 3px solid #4285f4;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .report-info {
              color: #666;
              margin-bottom: 30px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th {
              background-color: #4285f4;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e0e0e0;
            }
            tr:nth-child(even) {
              background-color: #f5f5f5;
            }
            tr:hover {
              background-color: #e8f0fe;
            }
            .status-active {
              color: #2e7d32;
              font-weight: 600;
            }
            .status-archived {
              color: #c62828;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <h1>Departments Report</h1>
          <div class="report-info">
            Generated on: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            <br>
            Total Departments: ${filteredDepts.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Department Name</th>
                <th>Code</th>
                <th>Head of Department</th>
                <th>Student Count</th>
                <th>Date Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
      `;

      filteredDepts.forEach(dept => {
        htmlContent += `
          <tr>
            <td>${dept.id}</td>
            <td>${dept.name}</td>
            <td>${dept.code}</td>
            <td>${dept.hod || 'N/A'}</td>
            <td>${dept.studentCount || 0}</td>
            <td>${dept.date}</td>
            <td class="status-${dept.status}">${dept.status === 'active' ? 'Active' : 'Archived'}</td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Departments_Report_${new Date().toISOString().split('T')[0]}.doc`;
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

  // Export to CSV
  function exportToCSV() {
    try {
      const filteredDepts = getFilteredDepartments();
      
      // Prepare CSV headers
      const headers = ['ID', 'Department Name', 'Department Code', 'Head of Department', 'Student Count', 'Date Created', 'Status', 'Description'];
      
      // Prepare CSV rows
      const rows = filteredDepts.map(dept => [
        dept.id,
        `"${dept.name.replace(/"/g, '""')}"`,
        dept.code,
        `"${(dept.hod || 'N/A').replace(/"/g, '""')}"`,
        dept.studentCount || 0,
        dept.date,
        dept.status === 'active' ? 'Active' : 'Archived',
        `"${(dept.description || '').replace(/"/g, '""')}"`
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Departments_Report_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Export to JSON
  function exportToJSON() {
    try {
      const filteredDepts = getFilteredDepartments();
      
      // Prepare JSON data
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalDepartments: filteredDepts.length,
        departments: filteredDepts.map(dept => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          headOfDepartment: dept.hod || 'N/A',
          studentCount: dept.studentCount || 0,
          dateCreated: dept.date,
          status: dept.status,
          description: dept.description || ''
        }))
      };
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Departments_Report_${new Date().toISOString().split('T')[0]}.json`;
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

  // Handle confirm export button
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', function() {
      if (!exportFormatSelect || !exportFormatSelect.value) {
        alert('Please select an export format.');
        return;
      }

      const format = exportFormatSelect.value;

      switch(format) {
        case 'pdf':
          exportToPDF();
          break;
        case 'excel':
          exportToExcel();
          break;
        case 'word':
          exportToWord();
          break;
        case 'csv':
          exportToCSV();
          break;
        case 'json':
          exportToJSON();
          break;
        default:
          alert('Unknown export format');
      }
    });
  }

  // --- Import functionality ---
  const btnImport = document.getElementById('btnImport');
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

  // Open import modal
  if (btnImport) {
    btnImport.addEventListener('click', function() {
      if (importModal) {
        importModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Reset form
        if (importFileInput) {
          importFileInput.value = '';
        }
        if (selectedFileName) {
          selectedFileName.style.display = 'none';
        }
        if (importPreview) {
          importPreview.style.display = 'none';
        }
        if (confirmImportBtn) {
          confirmImportBtn.disabled = true;
        }
        importData = [];
      }
    });
  }

  // Close import modal
  function closeImportModalFunc() {
    if (importModal) {
      importModal.classList.remove('active');
      document.body.style.overflow = 'auto';
      // Reset form
      if (importFileInput) {
        importFileInput.value = '';
      }
      if (selectedFileName) {
        selectedFileName.style.display = 'none';
      }
      if (importPreview) {
        importPreview.style.display = 'none';
      }
      if (confirmImportBtn) {
        confirmImportBtn.disabled = true;
      }
      importData = [];
    }
  }

  if (closeImportModal) {
    closeImportModal.addEventListener('click', closeImportModalFunc);
  }

  if (cancelImportModal) {
    cancelImportModal.addEventListener('click', closeImportModalFunc);
  }

  if (importModalOverlay) {
    importModalOverlay.addEventListener('click', closeImportModalFunc);
  }

  // Escape key to close import modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && importModal && importModal.classList.contains('active')) {
      closeImportModalFunc();
    }
  });

  // Handle file selection
  if (importFileInput) {
    importFileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const validExtensions = ['.csv', '.xls', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!validExtensions.includes(fileExtension) && !validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload a CSV or Excel file (.csv, .xls, .xlsx)');
        this.value = '';
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        this.value = '';
        return;
      }

      // Show selected file name
      if (selectedFileName) {
        selectedFileName.innerHTML = `<i class='bx bx-file'></i> ${file.name}`;
        selectedFileName.style.display = 'flex';
      }

      // Read and parse file
      parseImportFile(file);
    });
  }

  // Parse import file
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
        alert('Error parsing file. Please check the file format and try again.');
      }
    };

    if (fileExtension === '.csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  // Parse CSV file
  function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('File must contain at least a header row and one data row.');
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Find column indices
    const nameIdx = findColumnIndex(headers, ['department name', 'name', 'department_name']);
    const codeIdx = findColumnIndex(headers, ['department code', 'code', 'department_code']);
    const hodIdx = findColumnIndex(headers, ['head of department', 'hod', 'head_of_department']);
    const descIdx = findColumnIndex(headers, ['description', 'desc']);
    const statusIdx = findColumnIndex(headers, ['status']);

    if (nameIdx === -1 || codeIdx === -1) {
      alert('Required columns not found. Please ensure the file contains "Department Name" and "Department Code" columns.');
      return;
    }

    // Parse data rows
    importData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 2) continue;

      const dept = {
        name: values[nameIdx]?.trim() || '',
        code: values[codeIdx]?.trim() || '',
        hod: hodIdx >= 0 ? (values[hodIdx]?.trim() || '') : '',
        description: descIdx >= 0 ? (values[descIdx]?.trim() || '') : '',
        status: statusIdx >= 0 ? (values[statusIdx]?.trim().toLowerCase() || 'active') : 'active'
      };

      if (dept.name && dept.code) {
        importData.push(dept);
      }
    }

    if (importData.length === 0) {
      alert('No valid data found in the file.');
      return;
    }

    showPreview();
  }

  // Parse CSV line (handles quoted values)
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

  // Parse Excel file
  function parseExcel(arrayBuffer, file) {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (jsonData.length < 2) {
        alert('File must contain at least a header row and one data row.');
        return;
      }

      // Parse header
      const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
      
      // Find column indices
      const nameIdx = findColumnIndex(headers, ['department name', 'name', 'department_name']);
      const codeIdx = findColumnIndex(headers, ['department code', 'code', 'department_code']);
      const hodIdx = findColumnIndex(headers, ['head of department', 'hod', 'head_of_department']);
      const descIdx = findColumnIndex(headers, ['description', 'desc']);
      const statusIdx = findColumnIndex(headers, ['status']);

      if (nameIdx === -1 || codeIdx === -1) {
        alert('Required columns not found. Please ensure the file contains "Department Name" and "Department Code" columns.');
        return;
      }

      // Parse data rows
      importData = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 2) continue;

        const dept = {
          name: String(row[nameIdx] || '').trim(),
          code: String(row[codeIdx] || '').trim(),
          hod: hodIdx >= 0 ? String(row[hodIdx] || '').trim() : '',
          description: descIdx >= 0 ? String(row[descIdx] || '').trim() : '',
          status: statusIdx >= 0 ? String(row[statusIdx] || '').trim().toLowerCase() || 'active' : 'active'
        };

        if (dept.name && dept.code) {
          importData.push(dept);
        }
      }

      if (importData.length === 0) {
        alert('No valid data found in the file.');
        return;
      }

      showPreview();
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Error parsing Excel file. Please check the file format and try again.');
    }
  }

  // Find column index by possible names
  function findColumnIndex(headers, possibleNames) {
    for (let name of possibleNames) {
      const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  }

  // Show preview of imported data
  function showPreview() {
    if (!importPreview || !previewTable || importData.length === 0) return;

    const previewRows = importData.slice(0, 5);
    let html = '<table><thead><tr>';
    html += '<th>Department Name</th><th>Code</th><th>Head of Dept</th><th>Status</th>';
    html += '</tr></thead><tbody>';

    previewRows.forEach(row => {
      html += '<tr>';
      html += `<td>${row.name}</td>`;
      html += `<td>${row.code}</td>`;
      html += `<td>${row.hod || 'N/A'}</td>`;
      html += `<td>${row.status}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    if (importData.length > 5) {
      html += `<p style="margin-top: 12px; color: #666; font-size: 13px;">... and ${importData.length - 5} more rows</p>`;
    }

    previewTable.innerHTML = html;
    importPreview.style.display = 'block';

    if (confirmImportBtn) {
      confirmImportBtn.disabled = false;
    }
  }

  // Handle import confirmation
  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', async function() {
      if (importData.length === 0) {
        alert('No data to import.');
        return;
      }

      // Disable button and show loading
      this.disabled = true;
      this.classList.add('loading');
      const originalText = this.innerHTML;
      this.innerHTML = '<i class="bx bx-loader-alt"></i> Importing...';

      try {
        const formData = new FormData();
        formData.append('departments', JSON.stringify(importData));

        const response = await fetch('../api/departments.php?action=import', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
          alert(`Successfully imported ${result.data.imported || importData.length} department(s)!`);
          closeImportModalFunc();
          loadDepartments(currentView);
          loadStats();
        } else {
          alert('Error: ' + result.message);
          this.disabled = false;
          this.classList.remove('loading');
          this.innerHTML = originalText;
        }
      } catch (error) {
        console.error('Error importing departments:', error);
        alert('Error importing departments. Please try again.');
        this.disabled = false;
        this.classList.remove('loading');
        this.innerHTML = originalText;
      }
    });
  }

  console.log('✅ Department module ready!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initDepartmentModule();
});