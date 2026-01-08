// settings.js - Complete working version with database integration
function initSettingsModule() {
    console.log('🛠 Settings module initializing...');
    
    try {
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
        
        // ========== ELEMENTS ==========
        
        const settingsTabs = document.querySelectorAll('.settings-tab');
        const settingsPanels = document.querySelectorAll('.settings-panel');
        const btnSaveSettings = document.getElementById('btnSaveSettings');
        const btnResetSettings = document.getElementById('btnResetSettings');
        const allSettingsInputs = document.querySelectorAll('.setting-input, .setting-select');
        const allToggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
        
        // ========== DATA ==========
        
        let settings = {};
        let originalSettings = {};
        
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
            
            // Populate toggle switches
            allToggleSwitches.forEach(toggle => {
                const key = toggle.dataset.key;
                if (key && settingsData[key]) {
                    const setting = settingsData[key];
                    toggle.checked = setting.value || false;
                    updateStatusIndicator(key, setting.value);
                }
            });
            
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
                
                allToggleSwitches.forEach(toggle => {
                    const key = toggle.dataset.key;
                    if (key) {
                        settingsToSave[key] = toggle.checked;
                    }
                });
                
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
        
        // Tab navigation
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                showSettingsTab(tabName);
            });
        });
        
        // Save settings button
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener('click', saveSettings);
        }
        
        // Reset settings button
        if (btnResetSettings) {
            btnResetSettings.addEventListener('click', resetSettings);
        }
        
        // Toggle switch changes
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
        
        // Input changes (for real-time updates if needed)
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
        
        // ========== INITIAL LOAD ==========
        
        loadSettings();
        console.log('✅ Settings module initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing settings module:', error);
    }
}

// Make function globally available
window.initSettingsModule = initSettingsModule;

// Auto-initialize if loaded directly (for testing)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsModule);
} else {
    // Give a small delay for dynamic loading
    setTimeout(initSettingsModule, 500);
}

