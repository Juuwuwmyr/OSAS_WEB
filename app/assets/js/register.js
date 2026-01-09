// Global Theme Manager
class ThemeManager {
    constructor() {
        this.darkMode = true;
        this.init();
    }

    init() {
        // Check for saved theme preference
        this.checkSavedTheme();
        
        // Watch for system theme changes
        this.watchSystemTheme();
        
        // Apply theme to all pages
        this.applyGlobalTheme();
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.updateTheme();
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { darkMode: this.darkMode }
        }));
    }

    updateTheme() {
        // Apply to current page
        document.body.classList.toggle('dark-mode', this.darkMode);
        
        // Update CSS custom properties
        this.updateCSSVariables();
        
        // Update theme toggle icon
        this.updateThemeToggle();
        
        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor();
    }

    updateCSSVariables() {
        const root = document.documentElement;
        
        if (this.darkMode) {
            root.style.setProperty('--bg-primary', '#121212');
            root.style.setProperty('--bg-secondary', '#1e1e1e');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b0b0b0');
            root.style.setProperty('--accent-color', '#4a6cf7');
            root.style.setProperty('--border-color', '#333333');
            root.style.setProperty('--card-bg', '#1e1e1e');
            root.style.setProperty('--shadow', '0 2px 10px rgba(0, 0, 0, 0.3)');
        } else {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f5f5f5');
            root.style.setProperty('--text-primary', '#333333');
            root.style.setProperty('--text-secondary', '#666666');
            root.style.setProperty('--accent-color', '#4a6cf7');
            root.style.setProperty('--border-color', '#e0e0e0');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--shadow', '0 2px 10px rgba(0, 0, 0, 0.1)');
        }
    }

    updateThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle i');
        if (!themeToggle) return;
        
        if (this.darkMode) {
            themeToggle.classList.remove('fa-moon');
            themeToggle.classList.add('fa-sun');
        } else {
            themeToggle.classList.remove('fa-sun');
            themeToggle.classList.add('fa-moon');
        }
    }

    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = this.darkMode ? '#121212' : '#ffffff';
    }

    checkSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            this.darkMode = savedTheme === 'dark';
        } else {
            this.darkMode = systemPrefersDark;
        }

        this.updateTheme();
    }

    watchSystemTheme() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.darkMode = e.matches;
                this.updateTheme();
            }
        });
    }

    applyGlobalTheme() {
        // Apply theme to iframes and other embedded content
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    iframe.contentDocument.body.classList.toggle('dark-mode', this.darkMode);
                }
            } catch (e) {
                // Cross-origin iframe, can't access
            }
        });
    }

    // Get current theme state
    getCurrentTheme() {
        return this.darkMode ? 'dark' : 'light';
    }

    // Set theme directly
    setTheme(theme) {
        this.darkMode = theme === 'dark';
        this.updateTheme();
        localStorage.setItem('theme', theme);
    }
}

// Initialize global theme manager
const themeManager = new ThemeManager();

// Global functions for HTML onclick attributes
function toggleTheme() {
    themeManager.toggleTheme();
}

function setTheme(theme) {
    themeManager.setTheme(theme);
}

// Password visibility toggle
function togglePasswordVisibility(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleButton = passwordInput.parentNode.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}

// Clear error message
function clearError(field) {
    document.getElementById(`${field}-error`).textContent = '';
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Accept terms function
function acceptTerms() {
    document.getElementById('agreeTerms').checked = true;
    closeModal('termsModal');
    closeModal('privacyModal');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    }
});

// Modern Notification System
function showNotification(type, title, message, duration = 5000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
        <div class="notification-progress"></div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 400);
            }
        }, duration);
    }
    
    return notification;
}

// Form validation and submission - CONNECTED TO YOUR PHP BACKEND
function handleSignup(event) {
    event.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const department = document.getElementById('department').value;
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Clear previous errors
    clearError('firstName');
    clearError('lastName');
    clearError('studentId');
    clearError('department');
    clearError('email');
    clearError('username');
    clearError('password');
    clearError('confirmPassword');

    // Basic validation
    let hasErrors = false;

    if (!agreeTerms) {
        showNotification('error', 'Terms Required', 'Please agree to the Terms of Service and Privacy Policy');
        hasErrors = true;
    }

    if (password !== confirmPassword) {
        document.getElementById("confirmPassword-error").textContent = "Passwords do not match.";
        showNotification('error', 'Password Mismatch', 'Please make sure your passwords match');
        hasErrors = true;
    }

    // Email validation
    if (!isValidEmail(email)) {
        document.getElementById("email-error").textContent = "Please enter a valid email address.";
        hasErrors = true;
    }

    // Check if email is verified
    const emailVerified = document.getElementById('emailVerified');
    if (!emailVerified || emailVerified.value !== '1') {
        document.getElementById("email-error").textContent = "Please verify your email address with the OTP code.";
        showNotification('error', 'Email Not Verified', 'Please verify your email address before proceeding.');
        hasErrors = true;
        // Scroll to email field
        document.getElementById('email').scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Show OTP section if hidden
        const otpSection = document.getElementById('otpSection');
        if (otpSection && otpSection.style.display === 'none') {
            otpSection.style.display = 'block';
        }
    }

    // Required field validation (matching your PHP validation)
    if (!firstName) {
        document.getElementById("firstName-error").textContent = "First name is required.";
        hasErrors = true;
    }

    if (!lastName) {
        document.getElementById("lastName-error").textContent = "Last name is required.";
        hasErrors = true;
    }

    if (!email) {
        document.getElementById("email-error").textContent = "Email is required.";
        hasErrors = true;
    }

    if (!username) {
        document.getElementById("username-error").textContent = "Username is required.";
        hasErrors = true;
    }

    if (!password) {
        document.getElementById("password-error").textContent = "Password is required.";
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    const signupButton = document.getElementById('signupButton');
    signupButton.disabled = true;
    signupButton.innerHTML = '<span class="loading-spinner"></span>';

    // Determine the correct API path based on current location
    function getRegisterAPIPath() {
        const currentPath = window.location.pathname;
        const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
        const projectBase = pathMatch ? pathMatch[1] : '';
        
        if (projectBase) {
            return projectBase + '/app/views/auth/register.php';
        }
        
        if (currentPath.includes('/includes/')) {
            return '../app/views/auth/register.php';
        } else if (currentPath.includes('/app/views/')) {
            return '../auth/register.php';
        } else {
            return 'app/views/auth/register.php';
        }
    }
    
    const apiPath = getRegisterAPIPath();
    console.log('Register API Path:', apiPath);
    console.log('Current page URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Send data to PHP backend
    fetch(apiPath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            student_id: studentId,
            first_name: firstName,
            last_name: lastName,
            department: department,
            email: email,
            username: username,
            password: password,
            role: 'user'
        })
    })
    .then(async response => {
        // Log response for debugging
        console.log('Response status:', response.status);
        console.log('Response URL:', response.url);
        
        // Get response text first to check if it's JSON
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response URL:', response.url);
        console.log('Response text length:', responseText.length);
        console.log('Response text (full):', responseText);
        
        // Check if response is empty
        if (!responseText || responseText.trim().length === 0) {
            throw new Error('Server returned an empty response. The API endpoint may not exist or there was a server error.');
        }
        
        // Try to parse as JSON
        let data;
        try {
            // Trim whitespace that might cause issues
            const trimmedText = responseText.trim();
            data = JSON.parse(trimmedText);
        } catch (e) {
            // If it's not JSON, it's probably an HTML error page
            console.error('Failed to parse JSON:', e);
            console.error('Full response text:', responseText);
            
            // Check if it's an HTML error page
            if (responseText.trim().startsWith('<!') || responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
                throw new Error('Server returned HTML instead of JSON. The API endpoint may be incorrect or there was a PHP error. Check the console for details.');
            }
            
            // Check if it's a 404 or other error
            if (responseText.includes('404') || responseText.includes('Not Found')) {
                throw new Error('API endpoint not found (404). Please check the API path in the console.');
            }
            
            // Show more of the response for debugging
            const preview = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
            throw new Error('Invalid response from server. Response: ' + preview);
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'Network response was not ok');
        }
        
        return data;
    })
    .then(data => {
        signupButton.disabled = false;
        signupButton.innerHTML = '<span>Create Account</span>';

        if (data.status === 'success') {
            showNotification(
                'success', 
                'Account Created Successfully!', 
                data.message,
                6000
            );
            
            // Reset form
            event.target.reset();
            
            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '../index.php';
            }, 3000);
        } else {
            // Handle error response from your PHP
            showNotification('error', 'Registration Failed', data.message);
            
            // You can add specific field error handling here if needed
            if (data.message.includes('Email or username already exists')) {
                document.getElementById("email-error").textContent = "Email or username already exists.";
                document.getElementById("username-error").textContent = "Email or username already exists.";
            }
        }
    })
    .catch(error => {
        signupButton.disabled = false;
        signupButton.innerHTML = '<span>Create Account</span>';
        console.error('Registration Error:', error);
        
        let errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification('error', 'Registration Failed', errorMessage);
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle email input
function handleEmailInput() {
    const email = document.getElementById('email').value.trim();
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const emailVerified = document.getElementById('emailVerified');
    
    // Reset email verification status
    if (emailVerified) {
        emailVerified.value = '0';
    }
    
    // Hide OTP section if email changes
    const otpSection = document.getElementById('otpSection');
    if (otpSection) {
        otpSection.style.display = 'none';
    }
    
    // Clear OTP fields
    if (document.getElementById('otp')) {
        document.getElementById('otp').value = '';
    }
    
    // Enable/disable send OTP button based on email validity
    if (sendOtpBtn) {
        if (isValidEmail(email)) {
            sendOtpBtn.disabled = false;
        } else {
            sendOtpBtn.disabled = true;
        }
    }
    
    // Clear success/error messages
    const emailSuccess = document.getElementById('email-success');
    const emailError = document.getElementById('email-error');
    if (emailSuccess) emailSuccess.textContent = '';
    if (emailError) emailError.textContent = '';
}

// Handle OTP input
function handleOtpInput() {
    const otp = document.getElementById('otp').value.trim();
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    
    if (verifyOtpBtn) {
        if (otp.length === 6) {
            verifyOtpBtn.disabled = false;
        } else {
            verifyOtpBtn.disabled = true;
        }
    }
}

// Send OTP to email
function sendOTP(resend = false) {
    const email = document.getElementById('email').value.trim();
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const sendOtpText = document.getElementById('sendOtpText');
    const emailError = document.getElementById('email-error');
    const emailSuccess = document.getElementById('email-success');
    const otpSection = document.getElementById('otpSection');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    // Validate email
    if (!isValidEmail(email)) {
        if (emailError) {
            emailError.textContent = 'Please enter a valid email address.';
        }
        return;
    }
    
    // Disable button and show loading
    if (sendOtpBtn) {
        sendOtpBtn.disabled = true;
        if (sendOtpText) {
            sendOtpText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
    }
    
    // Clear previous messages
    if (emailError) emailError.textContent = '';
    if (emailSuccess) emailSuccess.textContent = '';
    
    // Determine API path
    function getApiPath(endpoint) {
        const currentPath = window.location.pathname;
        const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
        const projectBase = pathMatch ? pathMatch[1] : '';
        
        if (projectBase) {
            return projectBase + '/api/' + endpoint;
        }
        
        if (currentPath.includes('/includes/') || currentPath.includes('/app/views/')) {
            return '../api/' + endpoint;
        } else {
            return 'api/' + endpoint;
        }
    }
    
    const apiPath = getApiPath('send_otp.php');
    
    // Send OTP request
    fetch(apiPath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            email: email
        })
    })
    .then(async response => {
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid response from server.');
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send OTP');
        }
        
        return data;
    })
    .then(data => {
        if (data.status === 'success') {
            // Show success message
            if (emailSuccess) {
                emailSuccess.textContent = data.message;
            }
            
            // Show OTP section
            if (otpSection) {
                otpSection.style.display = 'block';
                const otpInput = document.getElementById('otp');
                if (otpInput) {
                    otpInput.focus();
                }
            }
            
            // Start OTP timer (10 minutes)
            startOtpTimer(600);
            
            // For development: log OTP (remove in production)
            if (data.otp) {
                console.log('OTP (development only):', data.otp);
                showNotification('info', 'OTP Sent', 'Check your email. OTP: ' + data.otp + ' (shown only for development)');
            } else {
                showNotification('success', 'OTP Sent', 'Please check your email for the verification code.');
            }
        } else {
            throw new Error(data.message || 'Failed to send OTP');
        }
    })
    .catch(error => {
        if (emailError) {
            emailError.textContent = error.message || 'Failed to send OTP. Please try again.';
        }
        showNotification('error', 'OTP Failed', error.message || 'Failed to send OTP. Please try again.');
    })
    .finally(() => {
        // Re-enable button
        if (sendOtpBtn) {
            sendOtpBtn.disabled = false;
            if (sendOtpText) {
                sendOtpText.textContent = resend ? 'Resend OTP' : 'Send OTP';
            }
        }
        
        // Hide resend button initially
        if (resendOtpBtn) {
            resendOtpBtn.style.display = 'none';
        }
    });
}

// Verify OTP
function verifyOTP() {
    const email = document.getElementById('email').value.trim();
    const otp = document.getElementById('otp').value.trim();
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const verifyOtpText = document.getElementById('verifyOtpText');
    const otpError = document.getElementById('otp-error');
    const otpSuccess = document.getElementById('otp-success');
    const emailVerified = document.getElementById('emailVerified');
    
    // Validate OTP length
    if (otp.length !== 6) {
        if (otpError) {
            otpError.textContent = 'Please enter a valid 6-digit OTP code.';
        }
        return;
    }
    
    // Disable button and show loading
    if (verifyOtpBtn) {
        verifyOtpBtn.disabled = true;
        if (verifyOtpText) {
            verifyOtpText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        }
    }
    
    // Clear previous messages
    if (otpError) otpError.textContent = '';
    if (otpSuccess) otpSuccess.textContent = '';
    
    // Determine API path
    function getApiPath(endpoint) {
        const currentPath = window.location.pathname;
        const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
        const projectBase = pathMatch ? pathMatch[1] : '';
        
        if (projectBase) {
            return projectBase + '/api/' + endpoint;
        }
        
        if (currentPath.includes('/includes/') || currentPath.includes('/app/views/')) {
            return '../api/' + endpoint;
        } else {
            return 'api/' + endpoint;
        }
    }
    
    const apiPath = getApiPath('verify_otp.php');
    
    // Verify OTP request
    fetch(apiPath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            email: email,
            otp: otp
        })
    })
    .then(async response => {
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid response from server.');
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'OTP verification failed');
        }
        
        return data;
    })
    .then(data => {
        if (data.status === 'success') {
            // Mark email as verified
            if (emailVerified) {
                emailVerified.value = '1';
            }
            
            // Show success message
            if (otpSuccess) {
                otpSuccess.textContent = data.message || 'Email verified successfully!';
            }
            
            // Update email field to show it's verified
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.style.borderColor = '#4caf50';
            }
            
            // Disable OTP inputs
            const otpInput = document.getElementById('otp');
            if (otpInput) {
                otpInput.disabled = true;
            }
            if (verifyOtpBtn) {
                verifyOtpBtn.disabled = true;
                if (verifyOtpText) {
                    verifyOtpText.innerHTML = '<i class="fas fa-check"></i> Verified';
                }
            }
            
            // Stop timer
            stopOtpTimer();
            
            showNotification('success', 'Email Verified', 'Your email has been verified successfully!');
        } else {
            throw new Error(data.message || 'OTP verification failed');
        }
    })
    .catch(error => {
        if (otpError) {
            otpError.textContent = error.message || 'Invalid OTP. Please try again.';
        }
        showNotification('error', 'Verification Failed', error.message || 'Invalid OTP. Please try again.');
    })
    .finally(() => {
        // Re-enable button if verification failed
        if (verifyOtpBtn && emailVerified && emailVerified.value !== '1') {
            verifyOtpBtn.disabled = false;
            if (verifyOtpText) {
                verifyOtpText.textContent = 'Verify';
            }
        }
    });
}

// OTP Timer functions
let otpTimerInterval = null;

function startOtpTimer(seconds) {
    stopOtpTimer(); // Clear any existing timer
    
    const otpTimer = document.getElementById('otpTimer');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    if (!otpTimer) return;
    
    let remaining = seconds;
    
    function updateTimer() {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        otpTimer.textContent = `OTP expires in ${minutes}:${secs.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            stopOtpTimer();
            if (otpTimer) {
                otpTimer.textContent = 'OTP has expired.';
                otpTimer.style.color = '#f44336';
            }
            if (resendOtpBtn) {
                resendOtpBtn.style.display = 'inline-block';
            }
        } else {
            remaining--;
        }
    }
    
    updateTimer(); // Initial update
    otpTimerInterval = setInterval(updateTimer, 1000);
}

function stopOtpTimer() {
    if (otpTimerInterval) {
        clearInterval(otpTimerInterval);
        otpTimerInterval = null;
    }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Theme is already initialized by the ThemeManager class
    // Add any additional initialization here
    
    // Listen for theme changes if needed
    window.addEventListener('themeChanged', (event) => {
        console.log('Theme changed to:', event.detail.darkMode ? 'dark' : 'light');
        // Add any custom logic for theme changes
    });
});