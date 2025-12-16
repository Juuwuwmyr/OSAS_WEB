// ===============================
// USER DASHBOARD SCRIPT (FULL FIX)
// ===============================

// DOM Elements
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');
const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');
const switchMode = document.getElementById('switch-mode');
const mainContent = document.getElementById('main-content');

// ===============================
// PAGE INITIALIZATION
// ===============================
document.addEventListener('DOMContentLoaded', function () {
  console.log("🚀 Initializing user dashboard...");

  const session = checkAuthentication();

  if (!session) return; // Redirected if not authenticated

  // Load default page
  const defaultPage = 'user-page/user_dashcontent';
  loadContent(defaultPage);

  // Highlight active menu
  const dashboardLink = document.querySelector(`[data-page="${defaultPage}"]`);
  if (dashboardLink) {
    allSideMenu.forEach(i => i.parentElement.classList.remove('active'));
    dashboardLink.parentElement.classList.add('active');
  }
});

// ===============================
// AUTHENTICATION HANDLING
// ===============================
function checkAuthentication() {
  console.log('🔍 Checking authentication...');

  // Check if PHP session is valid (cookies exist) - this is the primary check
  const hasCookies = document.cookie.includes('user_id') && document.cookie.includes('role');
  
  if (hasCookies) {
    console.log('✅ PHP session cookies found, authentication valid');
    // Try to get localStorage session for UI updates
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        updateUserInfo(session);
        console.log('✅ Authenticated as:', session.name, '| Role:', session.role);
        return session;
      } catch (error) {
        console.warn('⚠️ Could not parse localStorage session, but cookies are valid');
      }
    }
    return { role: 'user' }; // Return minimal session object
  }

  // Fallback to localStorage check (only if cookies don't exist)
  let storedSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');

  if (!storedSession) {
    console.warn('❌ No session found. Redirecting to login.');
    redirectToLogin();
    return null;
  }

  let session;
  try {
    session = JSON.parse(storedSession);
  } catch (err) {
    console.error('❌ Invalid session format. Clearing...');
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    redirectToLogin();
    return null;
  }

  const now = new Date().getTime();
  if (session.expires && now > session.expires) {
    console.warn('⚠️ Session expired. Clearing storage.');
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    redirectToLogin();
    return null;
  }

  // Role check
  if (session.role !== 'user') {
    console.warn('⚠️ Unauthorized role detected:', session.role);
    if (session.role === 'admin') {
      window.location.href = '../includes/dashboard.php';
    } else {
      redirectToLogin();
    }
    return null;
  }

  updateUserInfo(session);
  console.log('✅ Authenticated as:', session.name, '| Role:', session.role);
  return session;
}

function redirectToLogin() {
  window.location.href = '../index.php';
}

// ===============================
// USER INFO
// ===============================
function updateUserInfo(session) {
  const profileName = document.querySelector('.profile-name');
  const studentId = document.querySelector('.student-id');

  if (profileName) profileName.textContent = session.name || 'Unknown User';
  if (studentId && session.studentId) studentId.textContent = `ID: ${session.studentId}`;
}

// ===============================
// LOGOUT FUNCTION
// ===============================
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    deleteCookie('userSession');
    window.location.href = '../index.php';
  }
}

// ===============================
// COOKIE HELPERS
// ===============================
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/';
}

// ===============================
// SIDEBAR HANDLING
// ===============================
allSideMenu.forEach(item => {
  // Skip chatbot buttons - they have their own handlers
  if (item.classList.contains('chatbot-sidebar-btn')) {
    return;
  }
  
  const li = item.parentElement;

  item.addEventListener('click', function (e) {
    e.preventDefault();
    const page = this.getAttribute('data-page');
    if (!page) return;

    allSideMenu.forEach(i => {
      if (!i.classList.contains('chatbot-sidebar-btn')) {
        i.parentElement.classList.remove('active');
      }
    });
    li.classList.add('active');

    loadContent(page);
  });
});

// ===============================
// DYNAMIC CONTENT LOADER
// ===============================
function loadContent(page) {
  console.log(`📄 Loading page: ${page}`);

  const xhr = new XMLHttpRequest();
  // Load from app/views/loader.php instead of pages/
  xhr.open('GET', `../app/views/loader.php?view=${page}`, true);

  xhr.onload = function () {
    if (this.status === 200) {
      const response = this.responseText;
      console.log('Raw response received, length:', response.length);
      
      // Parse HTML properly using DOMParser (handles <head> and <body> tags)
      const parser = new DOMParser();
      const doc = parser.parseFromString(response, 'text/html');
      const headContent = doc.querySelector('head');
      const bodyContent = doc.querySelector('body');
      
      console.log('Head found:', !!headContent);
      console.log('Body found:', !!bodyContent);
      
      if (headContent || bodyContent) {
        // Extract all link tags (CSS) from head
        if (headContent) {
          const links = headContent.querySelectorAll('link[rel="stylesheet"]');
          console.log('Found', links.length, 'CSS link(s) in head');
          links.forEach((link, index) => {
            const href = link.getAttribute('href');
            console.log(`CSS ${index + 1}:`, href);
            
            // Use href as-is if it's already absolute (starts with / or http)
            // View::asset() returns absolute paths starting with /
            let absoluteHref = href;
            if (href && !href.startsWith('http') && !href.startsWith('/')) {
              // It's a relative path, make it absolute
              const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
              absoluteHref = basePath + '/' + href;
              console.log('Converted relative to absolute:', absoluteHref);
            } else if (href && href.startsWith('./')) {
              // Remove leading ./
              absoluteHref = href.substring(2);
              const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
              absoluteHref = basePath + '/' + absoluteHref;
              console.log('Converted ./ to absolute:', absoluteHref);
            } else if (href && href.startsWith('/')) {
              // Already absolute path - use as-is
              console.log('Using absolute path as-is:', absoluteHref);
            }
            
            // Check if this CSS is already loaded
            const existingLink = document.querySelector(`link[href="${href}"], link[href="${absoluteHref}"]`);
            if (!existingLink) {
              const newLink = document.createElement('link');
              newLink.rel = 'stylesheet';
              newLink.href = absoluteHref;
              newLink.onload = () => console.log('✓ CSS loaded successfully:', absoluteHref);
              newLink.onerror = (e) => {
                console.error('✗ CSS failed to load:', absoluteHref);
                console.error('Error details:', e);
              };
              document.head.appendChild(newLink);
              console.log('→ Injecting CSS:', absoluteHref);
            } else {
              console.log('→ CSS already loaded:', href);
            }
          });
        } else {
          console.warn('No head element found in loaded content');
        }
        
        // Extract all script tags from both head and body
        const allScripts = [];
        if (headContent) {
          headContent.querySelectorAll('script').forEach(script => {
            allScripts.push(script);
          });
        }
        if (bodyContent) {
          bodyContent.querySelectorAll('script').forEach(script => {
            allScripts.push(script);
          });
        }
        
        // Extract content from body or main tag (without scripts)
        if (bodyContent) {
          // Clone body content and remove scripts
          const bodyClone = bodyContent.cloneNode(true);
          bodyClone.querySelectorAll('script').forEach(script => script.remove());
          mainContent.innerHTML = bodyClone.innerHTML;
        } else {
          // If no body tag, try to get main content
          const mainTag = tempDiv.querySelector('main');
          if (mainTag) {
            const mainClone = mainTag.cloneNode(true);
            mainClone.querySelectorAll('script').forEach(script => script.remove());
            mainContent.innerHTML = mainClone.outerHTML;
          } else {
            mainContent.innerHTML = response;
          }
        }
        
        // Load and execute scripts
        const loadScript = (script) => {
          return new Promise((resolve, reject) => {
            if (script.src) {
              // External script
              const src = script.getAttribute('src');
              // Check if script is already loaded
              if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
              }
              const newScript = document.createElement('script');
              newScript.src = src;
              newScript.onload = resolve;
              newScript.onerror = reject;
              document.body.appendChild(newScript);
            } else {
              // Inline script
              const newScript = document.createElement('script');
              newScript.textContent = script.textContent;
              document.body.appendChild(newScript);
              resolve();
            }
          });
        };
        
        // Load scripts sequentially
        const loadScriptsSequentially = async () => {
          console.log(`Loading ${allScripts.length} script(s)...`);
          for (const script of allScripts) {
            try {
              await loadScript(script);
            } catch (error) {
              console.warn('Failed to load script:', script.src || 'inline', error);
            }
          }
          console.log('All scripts loaded');
          
          // Initialize modules after scripts are loaded
          if (page.toLowerCase().includes('user_dashcontent')) {
            setTimeout(() => {
              if (typeof initializeUserDashboard === 'function') initializeUserDashboard();
              if (typeof initializeAnnouncements === 'function') initializeAnnouncements();
            }, 100);
          }

          if (page.toLowerCase().includes('my_violations') && typeof initViolationsModule === 'function') {
            initViolationsModule();
          }

          if (page.toLowerCase().includes('my_profile') && typeof initProfileModule === 'function') {
            initProfileModule();
          }

          if (page.toLowerCase().includes('announcements') && typeof initAnnouncementsModule === 'function') {
            initAnnouncementsModule();
          }
        };
        
        loadScriptsSequentially();
      } else {
        mainContent.innerHTML = response;
        
        // Fallback: Initialize modules even if structure is different
        if (page.toLowerCase().includes('user_dashcontent')) {
          setTimeout(() => {
            if (typeof initializeUserDashboard === 'function') initializeUserDashboard();
            if (typeof initializeAnnouncements === 'function') initializeAnnouncements();
            // Load dashboard data from database
            if (typeof userDashboardData !== 'undefined' && userDashboardData) {
              userDashboardData.loadAllData();
            }
          }, 100);
        }

        if (page.toLowerCase().includes('my_violations')) {
          // Load user violations script
          loadScript('../app/assets/js/userViolations.js', () => {
            console.log('✅ User violations script loaded');
          });
        }

        if (page.toLowerCase().includes('my_profile')) {
          // Load user profile script
          loadScript('../app/assets/js/userProfile.js', () => {
            console.log('✅ User profile script loaded');
          });
        }

        if (page.toLowerCase().includes('announcements') && !page.toLowerCase().includes('user_dashcontent')) {
          // Load user announcements script (only if not dashboard)
          loadScript('../app/assets/js/userAnnouncements.js', () => {
            console.log('✅ User announcements script loaded');
          });
        }
      }
    } else if (this.status === 404) {
      mainContent.innerHTML = '<h2 style="color:red; padding:20px;">Page not found.</h2>';
    }
  };

  xhr.onerror = function () {
    mainContent.innerHTML = '<h2 style="color:red; padding:20px;">Error loading page.</h2>';
  };

  xhr.send();
}

// Load script dynamically
function loadScript(src, callback) {
  // Check if script already loaded
  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    if (callback) callback();
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.onload = callback;
  script.onerror = function() {
    console.error(`❌ Failed to load script: ${src}`);
  };
  document.head.appendChild(script);
}

// Announcements functionality
function toggleAnnouncements() {
  const content = document.getElementById('announcementsContent');
  const toggle = document.querySelector('.announcement-toggle');

  if (content && toggle) {
    content.classList.toggle('collapsed');
    toggle.classList.toggle('rotated');
  }
}

// Initialize announcements
function initializeAnnouncements() {
  // Add click events to read more buttons
  const readMoreButtons = document.querySelectorAll('.btn-read-more');
  readMoreButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      // Here you can add functionality to show full announcement details
      console.log('Read more clicked for announcement');
    });
  });

  // Auto-collapse announcements after 5 seconds (optional)
  setTimeout(() => {
    const content = document.getElementById('announcementsContent');
    const toggle = document.querySelector('.announcement-toggle');
    if (content && !content.classList.contains('collapsed')) {
      content.classList.add('collapsed');
      toggle.classList.add('rotated');
    }
  }, 5000);
}

// Enhanced announcement functions
function markAsRead(button) {
  const announcementItem = button.closest('.announcement-item');
  announcementItem.classList.remove('unread');
  button.style.display = 'none';

  // Update announcement count
  updateAnnouncementCount();

  // Show success message
  showNotification('Announcement marked as read', 'success');
}

function markAllAsRead() {
  const unreadItems = document.querySelectorAll('.announcement-item.unread');
  unreadItems.forEach(item => {
    item.classList.remove('unread');
    const markButton = item.querySelector('.btn-mark-read');
    if (markButton) {
      markButton.style.display = 'none';
    }
  });

  updateAnnouncementCount();
  showNotification('All announcements marked as read', 'success');
}

function updateAnnouncementCount() {
  const unreadCount = document.querySelectorAll('.announcement-item.unread').length;
  const countElement = document.querySelector('.announcement-count');
  if (countElement) {
    if (unreadCount > 0) {
      countElement.textContent = `${unreadCount} New`;
      countElement.style.display = 'inline-block';
    } else {
      countElement.style.display = 'none';
    }
  }
}

function openAnnouncement(id) {
  // Here you can implement opening full announcement details
  console.log(`Opening announcement ${id}`);
  showNotification('Opening announcement details...', 'info');
}

function viewAllAnnouncements() {
  // Here you can implement viewing all announcements
  console.log('Viewing all announcements');
  showNotification('Opening all announcements...', 'info');
}

// Settings functions
function showSettingsTab(tabName) {
  // Hide all panels
  const panels = document.querySelectorAll('.settings-panel');
  panels.forEach(panel => panel.classList.remove('active'));

  // Remove active class from all tabs
  const tabs = document.querySelectorAll('.settings-tab');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Show selected panel
  const selectedPanel = document.getElementById(`${tabName}-settings`);
  if (selectedPanel) {
    selectedPanel.classList.add('active');
  }

  // Add active class to selected tab
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
}

function saveSettings() {
  showNotification('Settings saved successfully!', 'success');
  // Here you can implement actual settings saving logic
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
    showNotification('Settings reset to default', 'info');
    // Here you can implement actual settings reset logic
  }
}

function uploadProfilePicture() {
  showNotification('Profile picture upload feature coming soon!', 'info');
  // Here you can implement profile picture upload
}

function changePassword() {
  showNotification('Password change feature coming soon!', 'info');
  // Here you can implement password change modal
}

function manageSessions() {
  showNotification('Session management feature coming soon!', 'info');
  // Here you can implement session management
}

function clearCache() {
  if (confirm('Are you sure you want to clear the system cache?')) {
    showNotification('Cache cleared successfully!', 'success');
    // Here you can implement cache clearing logic
  }
}

// Notification system
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class='bx ${getNotificationIcon(type)}'></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class='bx bx-x'></i>
    </button>
  `;

  // Add to body
  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: 'bx-check-circle',
    error: 'bx-error-circle',
    warning: 'bx-error',
    info: 'bx-info-circle'
  };
  return icons[type] || icons.info;
}

// Initialize user dashboard
function initializeUserDashboard() {
  // Add event listeners for violation details buttons
  const viewDetailsButtons = document.querySelectorAll('.btn-view-details');
  viewDetailsButtons.forEach(button => {
    button.addEventListener('click', function () {
      showViolationDetails(this);
    });
  });

  // Update violation counts and status
  updateViolationStats();

  console.log('⚡ User dashboard initialized');
}

// Show violation details
function showViolationDetails(button) {
  const row = button.closest('tr');
  const violationType = row.querySelector('.violation-info span').textContent;
  const date = row.querySelector('td:first-child').textContent;

  showNotification(`Viewing details for ${violationType} on ${date}`, 'info');
  // Here you can implement a modal or detailed view
}

// Update violation statistics
function updateViolationStats() {
  // This would typically fetch data from an API
  // For now, we'll use mock data
  const stats = {
    activeViolations: 0,
    totalViolations: 3,
    status: 'Good',
    daysClean: 7
  };

  // Update the stats display
  const activeViolations = document.querySelector('.box-info li:nth-child(1) h3');
  const totalViolations = document.querySelector('.box-info li:nth-child(2) h3');
  const status = document.querySelector('.box-info li:nth-child(3) h3');
  const daysClean = document.querySelector('.box-info li:nth-child(4) h3');

  if (activeViolations) activeViolations.textContent = stats.activeViolations;
  if (totalViolations) totalViolations.textContent = stats.totalViolations;
  if (status) status.textContent = stats.status;
  if (daysClean) daysClean.textContent = stats.daysClean;
}

// Initialize settings page
function initializeSettings() {
  // Set default active tab
  showSettingsTab('general');

  // Add event listeners for toggle switches
  const toggleSwitches = document.querySelectorAll('.toggle-switch input');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', function () {
      const statusElement = this.closest('.setting-item').querySelector('.setting-status');
      if (statusElement) {
        if (this.checked) {
          statusElement.textContent = 'Enabled';
          statusElement.className = 'setting-status enabled';
        } else {
          statusElement.textContent = 'Disabled';
          statusElement.className = 'setting-status disabled';
        }
      }
    });
  });

  console.log('⚡ Settings page initialized');
}

// Chart initialization function
function initializeCharts() {
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js is not loaded');
    return;
  }

  // Violation Types Pie Chart
  const violationTypesCtx = document.getElementById('violationTypesChart');
  if (violationTypesCtx) {
    new Chart(violationTypesCtx, {
      type: 'pie',
      data: {
        labels: ['Academic Dishonesty', 'Disruptive Behavior', 'Dress Code', 'Late Attendance', 'Other'],
        datasets: [{
          data: [25, 20, 15, 30, 10],
          backgroundColor: [
            '#FFD700',
            '#FFCE26',
            '#FD7238',
            '#DB504A',
            '#AAAAAA'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  }

  // Department Violations Bar Chart
  const departmentViolationsCtx = document.getElementById('departmentViolationsChart');
  if (departmentViolationsCtx) {
    new Chart(departmentViolationsCtx, {
      type: 'bar',
      data: {
        labels: ['Engineering', 'Business', 'Education', 'Arts', 'Science'],
        datasets: [{
          label: 'Violations',
          data: [45, 32, 28, 19, 15],
          backgroundColor: [
            '#FFD700',
            '#FFCE26',
            '#FD7238',
            '#DB504A',
            '#AAAAAA'
          ],
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Monthly Trends Line Chart
  const monthlyTrendsCtx = document.getElementById('monthlyTrendsChart');
  if (monthlyTrendsCtx) {
    new Chart(monthlyTrendsCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Violations',
          data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 28, 24, 20],
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointBackgroundColor: '#FFD700',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          }
        }
      }
    });
  }
}

// Toggle sidebar
menuBar.addEventListener('click', function () {
  sidebar.classList.toggle('hide');
});

// Search button functionality for mobile
searchButton.addEventListener('click', function (e) {
  if (window.innerWidth < 576) {
    e.preventDefault();
    searchForm.classList.toggle('show');
    searchButtonIcon.classList.toggle('bx-x', searchForm.classList.contains('show'));
    searchButtonIcon.classList.toggle('bx-search', !searchForm.classList.contains('show'));
  }
});

// Theme switcher: dark mode
switchMode.addEventListener('change', function () {
  if (this.checked) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
});

// Responsive adjustments on load
if (window.innerWidth < 768) {
  sidebar.classList.add('hide');
}
if (window.innerWidth > 576) {
  searchButtonIcon.classList.replace('bx-x', 'bx-search');
  searchForm.classList.remove('show');
}

// Responsive adjustments on resize
window.addEventListener('resize', function () {
  if (this.innerWidth > 576) {
    searchButtonIcon.classList.replace('bx-x', 'bx-search');
    searchForm.classList.remove('show');
  }
});
