// settings.js - Modal version with database integration
(function() {
    'use strict';
    
    console.log('🛠 Settings module initializing...');
    
    // ========== API CONFIG ==========
    
    // Detect the correct API path based on current page location
    function getAPIBasePath() {
        const currentPath = window.location.pathname;
        console.log('📍 Current path:', currentPath);
        
        // Try to extract the base project path from the URL
        const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
        const projectBase = pathMatch ? pathMatch[1] : '';
        console.log('📁 Project base:', projectBase);
        
        // Use absolute path from project root for reliability
        if (projectBase) {
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
    console.log('🔗 Settings API Base Path:', API_BASE);
    
    // ========== MODAL ELEMENTS ==========
    
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalOverlay = settingsModal?.querySelector('.settings-modal-overlay');
    const settingsModalClose = document.getElementById('settingsModalClose');
    const openSettingsBtn = document.getElementById('openSettingsModal');
    
    // ========== SETTINGS ELEMENTS ==========
    
    let settingsTabs, settingsPanels, btnSaveSettings, btnResetSettings;
    let allSettingsInputs, allToggleSwitches;
    
    // ========== DATA ==========
    
    let settings = {};
    let originalSettings = {};
    
    // ========== MODAL FUNCTIONS ==========
    
    function openSettingsModal() {
        if (!settingsModal) {
            console.error('❌ Settings modal not found');
            return;
        }
        
        // Initialize settings elements when modal opens
        initializeSettingsElements();
        
        // Load settings when modal opens
        loadSettings();
        
        // Show modal
        settingsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Settings modal opened');
    }
    
    function closeSettingsModal() {
        if (!settingsModal) return;
        
        settingsModal.classList.remove('active');
        document.body.style.overflow = '';
        
        console.log('✅ Settings modal closed');
    }
    
    function initializeSettingsElements() {
        if (!settingsModal) return;
        
        settingsTabs = settingsModal.querySelectorAll('.settings-tab');
        settingsPanels = settingsModal.querySelectorAll('.settings-panel');
        btnSaveSettings = settingsModal.querySelector('#btnSaveSettings');
        btnResetSettings = settingsModal.querySelector('#btnResetSettings');
        allSettingsInputs = settingsModal.querySelectorAll('.setting-input, .setting-select');
        allToggleSwitches = settingsModal.querySelectorAll('.toggle-switch input[type="checkbox"]');
        
        // Re-attach event listeners
        attachEventListeners();
    }
    
    // ========== HELPER FUNCTIONS ==========
    
    function updateStatusIndicator(settingKey, value) {
        const statusEl = document.getElementById(`status-${settingKey}`);
        if (statusEl) {
            if (typeof value === 'boolean') {
                statusEl.textContent = value ? 'Enabled' : 'Disabled';
                statusEl.className = value ? 'setting-status enabled' : 'setting-status disabled';
            }
        }
    }
    
    function populateSettings(settingsData) {
        console.log('📝 Populating settings:', settingsData);
        
        // Store original settings for reset
        originalSettings = JSON.parse(JSON.stringify(settingsData));
        settings = settingsData;
        
        // Populate all input fields
        if (allSettingsInputs) {
            allSettingsInputs.forEach(input => {
                const key = input.dataset.key;
                if (key && settingsData[key]) {
                    const setting = settingsData[key];
                    const value = setting.value;
                    
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else if (input.type === 'color') {
                        input.value = value || '#FFD700';
                    } else {
                        input.value = value || '';
                    }
                    
                    // Update status indicators for toggles
                    if (input.type === 'checkbox') {
                        updateStatusIndicator(key, value);
                    }
                }
            });
        }
        
        // Populate toggle switches
        if (allToggleSwitches) {
            allToggleSwitches.forEach(toggle => {
                const key = toggle.dataset.key;
                if (key && settingsData[key]) {
                    const setting = settingsData[key];
                    toggle.checked = setting.value || false;
                    updateStatusIndicator(key, setting.value);
                }
            });
        }
        
        console.log('✅ Settings populated');
    }
    
    // ========== API FUNCTIONS ==========
    
    async function loadSettings() {
        try {
            console.log('🔄 Loading settings from API...');
            
            const response = await fetch(API_BASE + 'settings.php?action=grouped');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'API returned error status');
            }
            
            // Flatten grouped settings
            const flattened = {};
            if (data.settings) {
                Object.values(data.settings).forEach(category => {
                    Object.assign(flattened, category);
                });
            }
            
            populateSettings(flattened);
            console.log('✅ Settings loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            alert('Error loading settings: ' + error.message);
        }
    }
    
    async function saveSettings() {
        try {
            // Collect all settings
            const settingsToSave = {};
            
            if (allSettingsInputs) {
                allSettingsInputs.forEach(input => {
                    const key = input.dataset.key;
                    if (key) {
                        let value = input.value;
                        
                        // Convert based on input type
                        if (input.type === 'number') {
                            value = parseInt(value);
                        } else if (input.type === 'checkbox') {
                            value = input.checked;
                        } else if (input.type === 'color') {
                            value = value.toUpperCase();
                        }
                        
                        settingsToSave[key] = value;
                    }
                });
            }
            
            if (allToggleSwitches) {
                allToggleSwitches.forEach(toggle => {
                    const key = toggle.dataset.key;
                    if (key) {
                        settingsToSave[key] = toggle.checked;
                    }
                });
            }
            
            console.log('💾 Saving settings:', settingsToSave);
            
            const response = await fetch(API_BASE + 'settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: settingsToSave
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to save settings');
            }
            
            // Update original settings
            originalSettings = JSON.parse(JSON.stringify(settings));
            Object.assign(settings, settingsToSave);
            
            // Update status indicators
            Object.keys(settingsToSave).forEach(key => {
                updateStatusIndicator(key, settingsToSave[key]);
            });
            
            alert(`✅ Settings saved successfully!\nUpdated: ${data.updated} setting(s)`);
            console.log('✅ Settings saved successfully');
            
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            alert('Error saving settings: ' + error.message);
        }
    }
    
    async function resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Reset to original loaded values
            populateSettings(originalSettings);
            alert('✅ Settings reset to last saved values');
        } catch (error) {
            console.error('❌ Error resetting settings:', error);
            alert('Error resetting settings: ' + error.message);
        }
    }
    
    // ========== TAB NAVIGATION ==========
    
    function showSettingsTab(tabName) {
        if (!settingsPanels || !settingsTabs) return;
        
        // Hide all panels
        settingsPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Remove active class from all tabs
        settingsTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected panel
        const panel = document.getElementById(`panel-${tabName}`);
        if (panel) {
            panel.classList.add('active');
        }
        
        // Add active class to selected tab
        const tab = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
        if (tab) {
            tab.classList.add('active');
        }
        
        console.log(`📑 Switched to ${tabName} tab`);
    }
    
    // ========== EVENT LISTENERS ==========
    
    function attachEventListeners() {
        // Tab navigation
        if (settingsTabs) {
            settingsTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabName = this.dataset.tab;
                    showSettingsTab(tabName);
                });
            });
        }
        
        // Save settings button
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', saveSettings);
        }
        
        // Reset settings button
        if (btnResetSettings) {
            btnResetSettings.addEventListener('click', resetSettings);
        }
        
        // Toggle switch changes
        if (allToggleSwitches) {
            allToggleSwitches.forEach(toggle => {
                toggle.addEventListener('change', function() {
                    const key = this.dataset.key;
                    const value = this.checked;
                    updateStatusIndicator(key, value);
                    
                    // Update settings object
                    if (settings[key]) {
                        settings[key].value = value;
                    }
                });
            });
        }
        
        // Input changes (for real-time updates if needed)
        if (allSettingsInputs) {
            allSettingsInputs.forEach(input => {
                input.addEventListener('change', function() {
                    const key = this.dataset.key;
                    let value = this.value;
                    
                    // Convert based on type
                    if (this.type === 'number') {
                        value = parseInt(value);
                    } else if (this.type === 'color') {
                        value = value.toUpperCase();
                    }
                    
                    // Update settings object
                    if (settings[key]) {
                        settings[key].value = value;
                    }
                });
            });
        }
    }
    
    // ========== MODAL EVENT LISTENERS ==========
    
    // Open modal button
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openSettingsModal();
        });
    }
    
    // Close modal button
    if (settingsModalClose) {
        settingsModalClose.addEventListener('click', closeSettingsModal);
    }
    
    // Close on overlay click
    if (settingsModalOverlay) {
        settingsModalOverlay.addEventListener('click', closeSettingsModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && settingsModal && settingsModal.classList.contains('active')) {
            closeSettingsModal();
        }
    });
    
    // ========== INITIALIZATION ==========
    
    // Make functions globally available
    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = closeSettingsModal;
    
    console.log('✅ Settings module initialized successfully!');
    
})();
