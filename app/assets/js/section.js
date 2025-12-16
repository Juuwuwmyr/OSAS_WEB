// sections.js - Database-integrated version
function initSectionsModule() {
    console.log('🛠 Sections module initializing...');
    
    try {
        // Elements
        const tableBody = document.getElementById('sectionsTableBody');
        const btnAddSection = document.getElementById('btnAddSection');
        const btnAddFirstSection = document.getElementById('btnAddFirstSection');
        const modal = document.getElementById('sectionsModal');
        const modalOverlay = document.getElementById('sectionsModalOverlay');
        const closeBtn = document.getElementById('closeSectionsModal');
        const cancelBtn = document.getElementById('cancelSectionsModal');
        const sectionsForm = document.getElementById('sectionsForm');
        const searchInput = document.getElementById('searchSection');
        const filterSelect = document.getElementById('sectionFilterSelect');
        const printBtn = document.getElementById('btnPrintSection');

        // Check for essential elements
        if (!tableBody) {
            console.error('❗ #sectionsTableBody not found');
            return;
        }

        if (!modal) {
            console.warn('⚠️ #sectionsModal not found');
        }

        // Sections data from database
        let sections = [];
        let allSections = []; // Store all sections for filtering

        // API base URL
        const apiBase = '../api/sections.php';

        // Track current view mode
        let currentView = 'active'; // 'active' or 'archived'

        // --- API Functions ---
        async function fetchSections() {
            try {
                // Determine filter based on current view
                const filter = currentView === 'archived' ? 'archived' : 'active';
                const search = searchInput ? searchInput.value : '';
                
                let url = `${apiBase}?action=get&filter=${filter}`;
                if (search) {
                    url += `&search=${encodeURIComponent(search)}`;
                }

                console.log('Fetching sections from:', url); // Debug log

                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                console.log('Raw API Response:', text); // Debug log

                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', text);
                    throw new Error('Invalid JSON response from server');
                }

                console.log('Parsed API Response:', data); // Debug log

                if (data.status === 'success') {
                    sections = data.data;
                    allSections = data.data; // Store all for stats
                    renderSections();
                    updateStats();
                } else {
                    console.error('Error fetching sections:', data.message);
                    showError('Failed to load sections: ' + data.message);
                }
            } catch (error) {
                console.error('Error fetching sections:', error);
                console.error('Full error details:', error.message, error.stack);
                showError('Failed to load sections. Please check your connection and console for details.');
            }
        }

        async function fetchStats() {
            try {
                const response = await fetch(`${apiBase}?action=stats`);
                const data = await response.json();

                if (data.status === 'success') {
                    updateStatsFromData(data.data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        }

        async function addSection(formData) {
            try {
                const response = await fetch(`${apiBase}?action=add`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.status === 'success') {
                    showSuccess(data.message || 'Section added successfully!');
                    await fetchSections();
                    await fetchStats();
                    closeModal();
                } else {
                    showError(data.message || 'Failed to add section');
                }
            } catch (error) {
                console.error('Error adding section:', error);
                showError('Failed to add section. Please try again.');
            }
        }

        async function updateSection(sectionId, formData) {
            try {
                formData.append('sectionId', sectionId);
                const response = await fetch(`${apiBase}?action=update`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.status === 'success') {
                    showSuccess(data.message || 'Section updated successfully!');
                    await fetchSections();
                    await fetchStats();
                    closeModal();
                } else {
                    showError(data.message || 'Failed to update section');
                }
            } catch (error) {
                console.error('Error updating section:', error);
                showError('Failed to update section. Please try again.');
            }
        }

        async function deleteSection(sectionId) {
            try {
                const response = await fetch(`${apiBase}?action=delete&id=${sectionId}`, {
                    method: 'GET'
                });
                const data = await response.json();

                if (data.status === 'success') {
                    showSuccess(data.message || 'Section archived successfully!');
                    await fetchSections();
                    await fetchStats();
                } else {
                    showError(data.message || 'Failed to archive section');
                }
            } catch (error) {
                console.error('Error deleting section:', error);
                showError('Failed to delete section. Please try again.');
            }
        }

        async function archiveSection(sectionId) {
            try {
                const response = await fetch(`${apiBase}?action=archive&id=${sectionId}`, {
                    method: 'GET'
                });
                const data = await response.json();

                if (data.status === 'success') {
                    showSuccess(data.message || 'Section archived successfully!');
                    await fetchSections();
                    await fetchStats();
                } else {
                    showError(data.message || 'Failed to archive section');
                }
            } catch (error) {
                console.error('Error archiving section:', error);
                showError('Failed to archive section. Please try again.');
            }
        }

        async function restoreSection(sectionId) {
            try {
                const response = await fetch(`${apiBase}?action=restore&id=${sectionId}`, {
                    method: 'GET'
                });
                const data = await response.json();

                if (data.status === 'success') {
                    showSuccess(data.message || 'Section restored successfully!');
                    await fetchSections();
                    await fetchStats();
                } else {
                    showError(data.message || 'Failed to restore section');
                }
            } catch (error) {
                console.error('Error restoring section:', error);
                showError('Failed to restore section. Please try again.');
            }
        }

        async function loadDepartments() {
            try {
                const response = await fetch('../api/departments.php');
                const data = await response.json();

                if (data.status === 'success') {
                    const select = document.getElementById('sectionDepartment');
                    if (select) {
                        // Clear existing options except the first one
                        const firstOption = select.querySelector('option[value=""]');
                        select.innerHTML = '';
                        if (firstOption) {
                            select.appendChild(firstOption);
                        }
                        
                        // Add departments
                        data.data.forEach(dept => {
                            const option = document.createElement('option');
                            option.value = dept.id;
                            option.textContent = dept.name;
                            select.appendChild(option);
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading departments:', error);
            }
        }

        // --- Render function ---
        function renderSections() {
            if (sections.length === 0) {
                tableBody.innerHTML = '';
                const emptyState = document.getElementById('sectionsEmptyState');
                if (emptyState) {
                    emptyState.style.display = 'flex';
                }
                updateCounts([]);
                return;
            }

            const emptyState = document.getElementById('sectionsEmptyState');
            if (emptyState) {
                emptyState.style.display = 'none';
            }

            tableBody.innerHTML = sections.map(s => `
                <tr data-id="${s.id}">
                    <td class="section-id">${s.section_id || 'SEC-' + String(s.id).padStart(3, '0')}</td>
                    <td class="section-name">
                        <div class="section-name-wrapper">
                            <div class="section-icon">
                                <i class='bx bx-group'></i>
                            </div>
                            <div>
                                <strong>${escapeHtml(s.name)}</strong>
                                <small class="section-year">${escapeHtml(s.academic_year || '')}</small>
                            </div>
                        </div>
                    </td>
                    <td class="department-name">${escapeHtml(s.department || 'N/A')}</td>
                    <td class="student-count">${s.student_count || 0}</td>
                    <td class="date-created">${s.date || ''}</td>
                    <td>
                        <span class="sections-status-badge ${s.status}">${s.status === 'active' ? 'Active' : 'Archived'}</span>
                    </td>
                    <td>
                        <div class="sections-action-buttons">
                            <button class="sections-action-btn edit" data-id="${s.id}" title="Edit">
                                <i class='bx bx-edit'></i>
                            </button>
                            ${s.status === 'archived' ? 
                                `<button class="sections-action-btn restore" data-id="${s.id}" title="Restore">
                                    <i class='bx bx-reset'></i>
                                </button>` : 
                                ''
                            }
                            <button class="sections-action-btn delete" data-id="${s.id}" title="Delete">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            updateCounts(sections);
        }

        function updateStats() {
            fetchStats();
        }

        function updateStatsFromData(stats) {
            const totalEl = document.getElementById('totalSections');
            const activeEl = document.getElementById('activeSections');
            const archivedEl = document.getElementById('archivedSections');
            
            if (totalEl) totalEl.textContent = stats.total || 0;
            if (activeEl) activeEl.textContent = stats.active || 0;
            if (archivedEl) archivedEl.textContent = stats.archived || 0;
        }

        function updateCounts(filteredSections) {
            const showingEl = document.getElementById('showingSectionsCount');
            const totalCountEl = document.getElementById('totalSectionsCount');
            
            if (showingEl) showingEl.textContent = filteredSections.length;
            if (totalCountEl) totalCountEl.textContent = allSections.length;
        }

        // --- Modal functions ---
        function openModal(editId = null) {
            if (!modal) return;
            
            const modalTitle = document.getElementById('sectionsModalTitle');
            const form = document.getElementById('sectionsForm');
            
            if (editId) {
                modalTitle.textContent = 'Edit Section';
                const section = sections.find(s => s.id == editId);
                if (section) {
                    document.getElementById('sectionName').value = section.name || '';
                    document.getElementById('sectionCode').value = section.code || '';
                    document.getElementById('sectionDepartment').value = section.department_id || '';
                    document.getElementById('academicYear').value = section.academic_year || '';
                    document.getElementById('sectionStatus').value = section.status || 'active';
                }
                modal.dataset.editingId = editId;
            } else {
                modalTitle.textContent = 'Add New Section';
                if (form) form.reset();
                delete modal.dataset.editingId;
            }
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            if (!modal) return;
            
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            const form = document.getElementById('sectionsForm');
            if (form) form.reset();
            delete modal.dataset.editingId;
        }

        // --- Event handlers ---
        function handleTableClick(e) {
            const editBtn = e.target.closest('.sections-action-btn.edit');
            const restoreBtn = e.target.closest('.sections-action-btn.restore');
            const deleteBtn = e.target.closest('.sections-action-btn.delete');

            if (editBtn) {
                const id = editBtn.dataset.id;
                openModal(id);
            }

            if (restoreBtn) {
                const id = restoreBtn.dataset.id;
                const section = sections.find(s => s.id == id);
                if (section && confirm(`Restore section "${section.name}"?`)) {
                    restoreSection(id);
                }
            }

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const section = sections.find(s => s.id == id);
                if (section && confirm(`Archive section "${section.name}"? This will move it to archived.`)) {
                    deleteSection(id);
                }
            }
        }

        // --- Utility functions ---
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showSuccess(message) {
            alert(message); // You can replace this with a better notification system
        }

        function showError(message) {
            alert(message); // You can replace this with a better notification system
        }

        // --- Initialize ---
        async function initialize() {
            // Load departments for dropdown
            await loadDepartments();

            // Set default view to active (hide archived by default)
            currentView = 'active';
            if (filterSelect) {
                filterSelect.value = 'active';
            }

            // Initial load - only active sections
            await fetchSections();

            // Event listeners for table
            tableBody.addEventListener('click', handleTableClick);

            // Add Section button
            if (btnAddSection) {
                btnAddSection.addEventListener('click', () => openModal());
            }

            // Add First Section button
            if (btnAddFirstSection) {
                btnAddFirstSection.addEventListener('click', () => openModal());
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

            // Form submission
            if (sectionsForm) {
                sectionsForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const sectionName = document.getElementById('sectionName').value.trim();
                    const sectionCode = document.getElementById('sectionCode').value.trim();
                    const sectionDepartment = document.getElementById('sectionDepartment').value;
                    const academicYear = document.getElementById('academicYear').value.trim();
                    const sectionStatus = document.getElementById('sectionStatus').value;
                    
                    if (!sectionName || !sectionCode || !sectionDepartment || !academicYear) {
                        alert('Please fill in all required fields.');
                        return;
                    }

                    const editingId = modal.dataset.editingId;
                    const formData = new FormData();
                    formData.append('sectionName', sectionName);
                    formData.append('sectionCode', sectionCode);
                    formData.append('sectionDepartment', sectionDepartment);
                    formData.append('academicYear', academicYear);
                    formData.append('sectionStatus', sectionStatus);
                    
                    if (editingId) {
                        await updateSection(editingId, formData);
                    } else {
                        await addSection(formData);
                    }
                });
            }

            // Search functionality
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        fetchSections();
                    }, 500); // Debounce search
                });
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
                    fetchSections();
                    // Update archived button state
                    const btnArchived = document.getElementById('btnArchivedSections');
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
            const btnArchived = document.getElementById('btnArchivedSections');
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
                    fetchSections();
                });
            }

            // Print functionality
            if (printBtn) {
                printBtn.addEventListener('click', function() {
                    const printArea = document.getElementById('sectionsPrintArea');
                    const tableTitle = document.querySelector('.sections-table-title')?.textContent || 'Section List';
                    const tableSubtitle = document.querySelector('.sections-table-subtitle')?.textContent || 'All academic sections and their details';

                    const printContent = `
                <html>
                  <head>
                    <title>Sections Report - OSAS System</title>
                    <style>
                      body { font-family: 'Segoe UI', sans-serif; margin: 40px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                      th { background-color: #f8f9fa; font-weight: 600; }
                      h1 { color: #333; margin-bottom: 10px; }
                      .report-header { margin-bottom: 30px; }
                      .report-date { color: #666; margin-bottom: 20px; }
                      .sections-status-badge { 
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

            // Sort functionality
            const sortHeaders = document.querySelectorAll('.sections-sortable');
            sortHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const sortBy = this.dataset.sort;
                    sortSections(sortBy);
                });
            });

            function sortSections(sortBy) {
                sections.sort((a, b) => {
                    switch(sortBy) {
                        case 'name':
                            return a.name.localeCompare(b.name);
                        case 'date':
                            return new Date(b.date) - new Date(a.date);
                        case 'id':
                        default:
                            return (a.section_id || '').localeCompare(b.section_id || '');
                    }
                });
                renderSections();
            }

            // --- Export functionality ---
            const btnExport = document.getElementById('btnExportSections');
            const exportModal = document.getElementById('exportModal');
            const exportModalOverlay = document.getElementById('exportModalOverlay');
            const closeExportModal = document.getElementById('closeExportModal');
            const cancelExportModal = document.getElementById('cancelExportModal');
            const exportFormatSelect = document.getElementById('exportFormat');
            const confirmExportBtn = document.getElementById('confirmExportBtn');

            // Get filtered sections for export
            function getFilteredSections() {
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                const filterValue = filterSelect ? filterSelect.value : 'all';
                
                return sections.filter(s => {
                    const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm) || 
                                         (s.code || '').toLowerCase().includes(searchTerm) ||
                                         (s.department || '').toLowerCase().includes(searchTerm);
                    const matchesFilter = filterValue === 'all' || s.status === filterValue;
                    return matchesSearch && matchesFilter;
                });
            }

            // Export functions
            function exportToPDF() {
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    const filteredSects = getFilteredSections();

                    doc.setFontSize(18);
                    doc.text('Sections Report', 14, 20);
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}`, 14, 28);

                    const tableData = filteredSects.map(sect => [
                        sect.section_id || sect.id,
                        sect.name || '',
                        sect.department || 'N/A',
                        sect.student_count || 0,
                        sect.date || '',
                        sect.status === 'active' ? 'Active' : 'Archived'
                    ]);

                    doc.autoTable({
                        head: [['ID', 'Section Name', 'Department', 'Students', 'Date Created', 'Status']],
                        body: tableData,
                        startY: 35,
                        styles: { fontSize: 9, cellPadding: 3 },
                        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        margin: { top: 35 }
                    });

                    doc.save(`Sections_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                    closeExportModalFunc();
                    alert('PDF exported successfully!');
                } catch (error) {
                    console.error('Error exporting to PDF:', error);
                    alert('Error exporting to PDF. Please try again.');
                }
            }

            function exportToExcel() {
                try {
                    const filteredSects = getFilteredSections();
                    const data = filteredSects.map(sect => ({
                        'ID': sect.section_id || sect.id,
                        'Section Name': sect.name || '',
                        'Section Code': sect.code || '',
                        'Department': sect.department || 'N/A',
                        'Student Count': sect.student_count || 0,
                        'Date Created': sect.date || '',
                        'Status': sect.status === 'active' ? 'Active' : 'Archived',
                        'Description': sect.description || ''
                    }));

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws['!cols'] = [
                        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
                        { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 40 }
                    ];
                    XLSX.utils.book_append_sheet(wb, ws, 'Sections');
                    XLSX.writeFile(wb, `Sections_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                    closeExportModalFunc();
                    alert('Excel file exported successfully!');
                } catch (error) {
                    console.error('Error exporting to Excel:', error);
                    alert('Error exporting to Excel. Please try again.');
                }
            }

            function exportToWord() {
                try {
                    const filteredSects = getFilteredSections();
                    let htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sections Report</title><style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; line-height: 1.6; }
                        h1 { color: #333; border-bottom: 3px solid #4285f4; padding-bottom: 10px; margin-bottom: 10px; }
                        .report-info { color: #666; margin-bottom: 30px; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        th { background-color: #4285f4; color: white; padding: 12px; text-align: left; font-weight: 600; }
                        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
                        tr:nth-child(even) { background-color: #f5f5f5; }
                        tr:hover { background-color: #e8f0fe; }
                        .status-active { color: #2e7d32; font-weight: 600; }
                        .status-archived { color: #c62828; font-weight: 600; }
                    </style></head><body>
                        <h1>Sections Report</h1>
                        <div class="report-info">Generated on: ${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}<br>Total Sections: ${filteredSects.length}</div>
                        <table><thead><tr><th>ID</th><th>Section Name</th><th>Code</th><th>Department</th><th>Student Count</th><th>Date Created</th><th>Status</th></tr></thead><tbody>`;

                    filteredSects.forEach(sect => {
                        htmlContent += `<tr>
                            <td>${sect.section_id || sect.id}</td>
                            <td>${sect.name || ''}</td>
                            <td>${sect.code || ''}</td>
                            <td>${sect.department || 'N/A'}</td>
                            <td>${sect.student_count || 0}</td>
                            <td>${sect.date || ''}</td>
                            <td class="status-${sect.status}">${sect.status === 'active' ? 'Active' : 'Archived'}</td>
                        </tr>`;
                    });

                    htmlContent += `</tbody></table></body></html>`;
                    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Sections_Report_${new Date().toISOString().split('T')[0]}.doc`;
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
                    const filteredSects = getFilteredSections();
                    const headers = ['ID', 'Section Name', 'Section Code', 'Department', 'Student Count', 'Date Created', 'Status', 'Description'];
                    const rows = filteredSects.map(sect => [
                        sect.section_id || sect.id,
                        `"${(sect.name || '').replace(/"/g, '""')}"`,
                        sect.code || '',
                        `"${(sect.department || 'N/A').replace(/"/g, '""')}"`,
                        sect.student_count || 0,
                        sect.date || '',
                        sect.status === 'active' ? 'Active' : 'Archived',
                        `"${(sect.description || '').replace(/"/g, '""')}"`
                    ]);
                    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Sections_Report_${new Date().toISOString().split('T')[0]}.csv`;
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
                    const filteredSects = getFilteredSections();
                    const jsonData = {
                        exportDate: new Date().toISOString(),
                        totalSections: filteredSects.length,
                        sections: filteredSects.map(sect => ({
                            id: sect.section_id || sect.id,
                            name: sect.name || '',
                            code: sect.code || '',
                            department: sect.department || 'N/A',
                            studentCount: sect.student_count || 0,
                            dateCreated: sect.date || '',
                            status: sect.status,
                            description: sect.description || ''
                        }))
                    };
                    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Sections_Report_${new Date().toISOString().split('T')[0]}.json`;
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

            // Export modal handlers
            function closeExportModalFunc() {
                if (exportModal) {
                    exportModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    if (exportFormatSelect) exportFormatSelect.value = '';
                }
            }

            if (btnExport) {
                btnExport.addEventListener('click', function() {
                    if (sections.length === 0) {
                        alert('No sections to export. Please add sections first.');
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
            const btnImport = document.getElementById('btnImportSections');
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
                const nameIdx = findColumnIndex(headers, ['section name', 'name', 'section_name']);
                const codeIdx = findColumnIndex(headers, ['section code', 'code', 'section_code']);
                const deptIdx = findColumnIndex(headers, ['department', 'department code', 'dept']);
                const descIdx = findColumnIndex(headers, ['description', 'desc']);
                const statusIdx = findColumnIndex(headers, ['status']);
                if (nameIdx === -1) {
                    alert('Required column "Section Name" not found.');
                    return;
                }
                importData = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    const sect = {
                        name: values[nameIdx]?.trim() || '',
                        code: codeIdx >= 0 ? (values[codeIdx]?.trim() || '') : '',
                        department: deptIdx >= 0 ? (values[deptIdx]?.trim() || '') : '',
                        description: descIdx >= 0 ? (values[descIdx]?.trim() || '') : '',
                        status: statusIdx >= 0 ? (values[statusIdx]?.trim().toLowerCase() || 'active') : 'active'
                    };
                    if (sect.name) importData.push(sect);
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
                    const nameIdx = findColumnIndex(headers, ['section name', 'name', 'section_name']);
                    const codeIdx = findColumnIndex(headers, ['section code', 'code', 'section_code']);
                    const deptIdx = findColumnIndex(headers, ['department', 'department code', 'dept']);
                    const descIdx = findColumnIndex(headers, ['description', 'desc']);
                    const statusIdx = findColumnIndex(headers, ['status']);
                    if (nameIdx === -1) {
                        alert('Required column "Section Name" not found.');
                        return;
                    }
                    importData = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length < 1) continue;
                        const sect = {
                            name: String(row[nameIdx] || '').trim(),
                            code: codeIdx >= 0 ? String(row[codeIdx] || '').trim() : '',
                            department: deptIdx >= 0 ? String(row[deptIdx] || '').trim() : '',
                            description: descIdx >= 0 ? String(row[descIdx] || '').trim() : '',
                            status: statusIdx >= 0 ? String(row[statusIdx] || '').trim().toLowerCase() || 'active' : 'active'
                        };
                        if (sect.name) importData.push(sect);
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
                let html = '<table><thead><tr><th>Section Name</th><th>Code</th><th>Department</th><th>Status</th></tr></thead><tbody>';
                previewRows.forEach(row => {
                    html += `<tr><td>${row.name}</td><td>${row.code || 'N/A'}</td><td>${row.department || 'N/A'}</td><td>${row.status}</td></tr>`;
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
                        formData.append('sections', JSON.stringify(importData));
                        const response = await fetch('../api/sections.php?action=import', {
                            method: 'POST',
                            body: formData
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            alert(`Successfully imported ${result.data.imported || importData.length} section(s)!`);
                            closeImportModalFunc();
                            fetchSections();
                            fetchStats();
                        } else {
                            alert('Error: ' + result.message);
                            this.disabled = false;
                            this.classList.remove('loading');
                            this.innerHTML = originalText;
                        }
                    } catch (error) {
                        console.error('Error importing sections:', error);
                        alert('Error importing sections. Please try again.');
                        this.disabled = false;
                        this.classList.remove('loading');
                        this.innerHTML = originalText;
                    }
                });
            }

            console.log('✅ Sections module initialized successfully!');
        }

        // Start initialization
        initialize();

    } catch (error) {
        console.error('❌ Error initializing sections module:', error);
    }
}

// Make function globally available
window.initSectionsModule = initSectionsModule;

// Auto-initialize if loaded directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSectionsModule);
} else {
    setTimeout(initSectionsModule, 100);
}

