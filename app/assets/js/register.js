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
            root.style.setProperty('--bg-primary', '#0F0F0F');
            root.style.setProperty('--bg-secondary', '#1A1A1A');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#B8B8B8');
            root.style.setProperty('--accent-color', '#4a6cf7');
            root.style.setProperty('--border-color', '#2A2A2A');
            root.style.setProperty('--card-bg', '#1A1A1A');
            root.style.setProperty('--shadow', '0 2px 10px rgba(0, 0, 0, 0.5)');
        } else {
            // Warmer, softer light mode
            root.style.setProperty('--bg-primary', '#F0F0ED');
            root.style.setProperty('--bg-secondary', '#FAFAF8');
            root.style.setProperty('--text-primary', '#1A1A1A');
            root.style.setProperty('--text-secondary', '#555555');
            root.style.setProperty('--accent-color', '#4a6cf7');
            root.style.setProperty('--border-color', '#D8D8D5');
            root.style.setProperty('--card-bg', '#FAFAF8');
            root.style.setProperty('--shadow', '0 2px 10px rgba(0, 0, 0, 0.08)');
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
        metaThemeColor.content = this.darkMode ? '#0F0F0F' : '#ffffff';
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
            // Check if verification is required
            if (data.requireVerification) {
                showNotification(
                    'info', 
                    'Verify Your Email', 
                    'Please enter the verification code sent to your email.',
                    8000
                );
                
                // Show OTP verification modal
                showOTPVerificationModal(data.email);
            } else {
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
            }
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

// ============================================
// SOCIAL LOGIN HANDLERS FOR SIGNUP (Firebase)
// ============================================

// Google Signup Handler using Firebase
async function handleGoogleSignup() {
    const googleBtn = document.querySelector('.social-button.google');
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<div class="loading-spinner"></div><span>Connecting to Google...</span>`;
    }

    try {
        // Check if Firebase functions are available
        if (typeof firebaseGoogleSignIn !== 'function') {
            throw new Error('Firebase is not loaded. Please check your configuration.');
        }

        const result = await firebaseGoogleSignIn();
        
        if (result.success) {
            showNotification('success', 'Google Connected!', 'Processing your signup...');
            
            // Send user data to PHP backend
            await processSocialSignup(result.user, result.token);
        } else {
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = `<i class="fab fa-google"></i>Sign up with Google`;
            }
            
            if (result.error === 'auth/popup-closed-by-user') {
                showNotification('info', 'Cancelled', 'Signup cancelled');
            } else if (result.error === 'not_configured') {
                showNotification('error', 'Configuration Error', 'Firebase is not configured. Please check firebase-config.js');
            } else {
                showNotification('error', 'Error', result.message || 'Google signup failed');
            }
        }
    } catch (error) {
        console.error('Google signup error:', error);
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = `<i class="fab fa-google"></i>Sign up with Google`;
        }
        showNotification('error', 'Error', error.message || 'An error occurred during Google signup');
    }
}

// Facebook Signup Handler using Firebase
async function handleFacebookSignup() {
    const facebookBtn = document.querySelector('.social-button.facebook');
    if (facebookBtn) {
        facebookBtn.disabled = true;
        facebookBtn.innerHTML = `<div class="loading-spinner"></div><span>Connecting to Facebook...</span>`;
    }

    try {
        // Check if Firebase functions are available
        if (typeof firebaseFacebookSignIn !== 'function') {
            throw new Error('Firebase is not loaded. Please check your configuration.');
        }

        const result = await firebaseFacebookSignIn();
        
        if (result.success) {
            showNotification('success', 'Facebook Connected!', 'Processing your signup...');
            
            // Send user data to PHP backend
            await processSocialSignup(result.user, result.token);
        } else {
            if (facebookBtn) {
                facebookBtn.disabled = false;
                facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Sign up with Facebook`;
            }
            
            if (result.error === 'auth/popup-closed-by-user') {
                showNotification('info', 'Cancelled', 'Signup cancelled');
            } else if (result.error === 'not_configured') {
                showNotification('error', 'Configuration Error', 'Firebase is not configured. Please check firebase-config.js');
            } else {
                showNotification('error', 'Error', result.message || 'Facebook signup failed');
            }
        }
    } catch (error) {
        console.error('Facebook signup error:', error);
        if (facebookBtn) {
            facebookBtn.disabled = false;
            facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Sign up with Facebook`;
        }
        showNotification('error', 'Error', error.message || 'An error occurred during Facebook signup');
    }
}

// Process social signup - send to PHP backend
async function processSocialSignup(userData, token) {
    try {
        const response = await fetch('../app/views/auth/social_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                firstName: userData.firstName,
                lastName: userData.lastName,
                photoURL: userData.photoURL,
                provider: userData.provider,
                token: token
            })
        });

        // Check if response is OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', response.status, errorText);
            throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        // Get response text first to check if it's JSON
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Invalid JSON response:', responseText);
            throw new Error('Server returned invalid response. Check console for details.');
        }

        if (data.status === 'success') {
            // Store session data
            const sessionData = {
                name: data.name,
                role: data.role,
                user_id: data.user_id,
                expires: data.expires * 1000,
                theme: themeManager.darkMode ? 'dark' : 'light'
            };

            localStorage.setItem('userSession', JSON.stringify(sessionData));

            showNotification('success', 'Account Created!', 'Redirecting to dashboard...');

            setTimeout(() => {
                if (data.role === 'admin') {
                    window.location.href = '../includes/dashboard.php';
                } else {
                    window.location.href = '../includes/user_dashboard.php';
                }
            }, 1500);
        } else {
            showNotification('error', 'Signup Failed', data.message || 'Could not create account');
            
            // Reset buttons
            const googleBtn = document.querySelector('.social-button.google');
            const facebookBtn = document.querySelector('.social-button.facebook');
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = `<i class="fab fa-google"></i>Sign up with Google`;
            }
            if (facebookBtn) {
                facebookBtn.disabled = false;
                facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Sign up with Facebook`;
            }
        }
    } catch (error) {
        console.error('Social signup processing error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            userData: userData
        });
        
        const errorMessage = error.message || 'Failed to process signup. Please check console for details.';
        showNotification('error', 'Error', errorMessage);
        
        // Reset buttons
        const googleBtn = document.querySelector('.social-button.google');
        const facebookBtn = document.querySelector('.social-button.facebook');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = `<i class="fab fa-google"></i>Sign up with Google`;
        }
        if (facebookBtn) {
            facebookBtn.disabled = false;
            facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Sign up with Facebook`;
        }
    }
}

// Show social signup info modal (Firebase setup)
function showSocialSignupModal(provider) {
    const providerName = provider === 'google' ? 'Google' : 'Facebook';
    const providerColor = provider === 'google' ? '#DB4437' : '#1877F2';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'social-modal-overlay';
    modal.innerHTML = `
        <div class="social-modal">
            <div class="social-modal-header" style="background: linear-gradient(135deg, #FFCA28, #FF9800)">
                <i class="fas fa-fire"></i>
                <h3>Firebase Setup (FREE)</h3>
            </div>
            <div class="social-modal-body">
                <div class="social-modal-icon">
                    <i class="fab fa-${provider}" style="color: ${providerColor}"></i>
                </div>
                <h4>Enable ${providerName} Sign Up</h4>
                <p>Firebase Authentication is FREE and easy to set up:</p>
                <ol>
                    <li>Go to <strong>Firebase Console</strong></li>
                    <li>Create a new project (disable Analytics)</li>
                    <li>Click <strong>&lt;/&gt;</strong> to add a web app</li>
                    <li>Copy the config to <code>firebase-config.js</code></li>
                    <li>Go to <strong>Authentication → Sign-in method</strong></li>
                    <li>Enable <strong>${providerName}</strong> provider</li>
                </ol>
                <div class="social-modal-note">
                    <i class="fas fa-check-circle" style="color: #4CAF50"></i>
                    <span>No credit card required! Firebase free tier is generous.</span>
                </div>
            </div>
            <div class="social-modal-footer">
                <button class="social-modal-btn secondary" onclick="closeSocialModal()">Close</button>
                <a href="https://console.firebase.google.com/" 
                   target="_blank" class="social-modal-btn primary" style="background: linear-gradient(135deg, #FFCA28, #FF9800)">
                    <i class="fas fa-external-link-alt"></i>
                    Firebase Console
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animation
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeSocialModal();
        }
    });
}

function closeSocialModal() {
    const modal = document.querySelector('.social-modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ============================================

let verificationEmail = '';

function getOTPAPIPath(fileName) {
    const currentPath = window.location.pathname;
    const pathMatch = currentPath.match(/^(\/[^\/]+)\//);
    const projectBase = pathMatch ? pathMatch[1] : '';

    if (projectBase) {
        return projectBase + '/app/views/auth/' + fileName;
    }

    if (currentPath.includes('/includes/')) {
        return '../app/views/auth/' + fileName;
    } else if (currentPath.includes('/app/views/')) {
        return '../auth/' + fileName;
    }

    return 'app/views/auth/' + fileName;
}

function showOTPVerificationModal(email) {
    verificationEmail = email;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('otpVerificationModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'otpVerificationModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <style>
            .otp-modal-content {
                background: #111;
                border-radius: 16px;
                padding: 28px;
                max-width: 420px;
                width: 92%;
                box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
                position: relative;
            }
            .otp-close-btn {
                position: absolute;
                top: 12px;
                right: 12px;
                background: transparent;
                border: none;
                color: #9a9a9a;
                font-size: 22px;
                cursor: pointer;
            }
            .otp-close-btn:hover {
                color: #fff;
            }
            .otp-title {
                color: #fff;
                font-size: 22px;
                font-weight: 700;
                margin: 0 0 6px;
                text-align: center;
            }
            .otp-subtitle {
                color: #b0b0b0;
                font-size: 14px;
                text-align: center;
                margin: 0 0 14px;
            }
            .otp-email {
                color: #d4af37;
                font-weight: 600;
                font-size: 14px;
                text-align: center;
                margin: 0 0 18px;
                overflow-wrap: anywhere;
            }
            .otp-inputs {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 16px;
            }
            .otp-input {
                width: 46px;
                height: 56px;
                text-align: center;
                font-size: 22px;
                font-weight: 700;
                border: 1px solid #2f2f2f;
                border-radius: 10px;
                background: #0b0b0b;
                color: #fff;
                outline: none;
            }
            .otp-input:focus {
                border-color: #d4af37;
                box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.18);
            }
            .otp-error {
                color: #ff4444;
                font-size: 14px;
                text-align: center;
                margin-bottom: 15px;
                display: none;
            }
            .otp-verify-btn {
                width: 100%;
                padding: 12px 14px;
                background: #d4af37;
                border: none;
                border-radius: 10px;
                color: #000;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
            }
            .otp-verify-btn:hover {
                filter: brightness(0.95);
            }
            .otp-verify-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            .otp-resend {
                text-align: center;
                margin-top: 14px;
                color: #8d8d8d;
                font-size: 14px;
            }
            .otp-resend a {
                color: #d4af37;
                text-decoration: none;
                font-weight: 600;
            }
            .otp-resend a:hover {
                text-decoration: underline;
            }
            .otp-timer {
                text-align: center;
                color: #7a7a7a;
                font-size: 13px;
                margin-top: 10px;
            }
            .otp-timer span {
                color: #d4af37;
                font-weight: 600;
            }
        </style>
        <div class="otp-modal-content">
            <button class="otp-close-btn" onclick="closeOTPModal()">&times;</button>
            <h2 class="otp-title">Verify your email</h2>
            <p class="otp-subtitle">Enter the 6-digit code sent to</p>
            <div class="otp-email">${email}</div>
            
            <div class="otp-inputs">
                <input type="text" maxlength="1" class="otp-input" data-index="0" inputmode="numeric" pattern="[0-9]*">
                <input type="text" maxlength="1" class="otp-input" data-index="1" inputmode="numeric" pattern="[0-9]*">
                <input type="text" maxlength="1" class="otp-input" data-index="2" inputmode="numeric" pattern="[0-9]*">
                <input type="text" maxlength="1" class="otp-input" data-index="3" inputmode="numeric" pattern="[0-9]*">
                <input type="text" maxlength="1" class="otp-input" data-index="4" inputmode="numeric" pattern="[0-9]*">
                <input type="text" maxlength="1" class="otp-input" data-index="5" inputmode="numeric" pattern="[0-9]*">
            </div>
            
            <div id="otpError" class="otp-error"></div>
            
            <button id="verifyOTPBtn" class="otp-verify-btn" onclick="verifyOTP()">
                Verify
            </button>
            
            <p class="otp-resend">
                Didn't receive the code? <a href="#" onclick="resendOTP(); return false;">Resend Code</a>
            </p>
            <p class="otp-timer">Code expires in <span id="otpCountdown">15:00</span></p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup input handlers
    const inputs = modal.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value && index < 5) {
                inputs[index + 1].focus();
            }
            // Auto-submit when all filled
            const code = Array.from(inputs).map(i => i.value).join('');
            if (code.length === 6) {
                setTimeout(() => verifyOTP(), 100);
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
            if (e.key === 'ArrowLeft' && index > 0) inputs[index - 1].focus();
            if (e.key === 'ArrowRight' && index < 5) inputs[index + 1].focus();
        });
        
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
            if (paste.length === 6) {
                paste.split('').forEach((char, i) => {
                    if (inputs[i]) inputs[i].value = char;
                });
                inputs[5].focus();
                setTimeout(() => verifyOTP(), 100);
            }
        });
    });
    
    // Focus first input
    setTimeout(() => inputs[0].focus(), 100);
    
    // Start countdown timer
    startOTPCountdown();
}

let countdownInterval;

function startOTPCountdown() {
    let timeLeft = 15 * 60; // 15 minutes in seconds
    const countdownEl = document.getElementById('otpCountdown');
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (countdownEl) {
            countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            if (countdownEl) {
                countdownEl.textContent = 'Expired';
                countdownEl.style.color = '#ff4444';
            }
        }
        
        timeLeft--;
    }, 1000);
}

function handleOTPInput(input, index) {
    // Only allow numbers
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Move to next input
    if (input.value.length === 1 && index < 5) {
        const inputs = document.querySelectorAll('.otp-input');
        inputs[index + 1].focus();
    }
    
    // Auto-submit when all fields are filled
    const inputs = document.querySelectorAll('.otp-input');
    const code = Array.from(inputs).map(i => i.value).join('');
    if (code.length === 6) {
        verifyOTP();
    }
}

function handleOTPKeydown(event, index) {
    const inputs = document.querySelectorAll('.otp-input');
    
    // Handle backspace
    if (event.key === 'Backspace' && index > 0 && !inputs[index].value) {
        inputs[index - 1].focus();
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
        inputs[index + 1].focus();
    }
}

function verifyOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    const code = Array.from(inputs).map(i => i.value).join('');
    
    if (code.length !== 6) {
        showOTPError('Please enter the complete 6-digit code.');
        return;
    }
    
    const verifyBtn = document.getElementById('verifyOTPBtn');
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="loading-spinner"></span>';

    const apiPath = getOTPAPIPath('verify_otp.php');
    
    fetch(apiPath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            email: verificationEmail,
            code: code
        })
    })
    .then(async (response) => {
        const responseText = await response.text();
        let data = null;

        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            const msg = (data && data.message) ? data.message : (responseText || `Request failed (${response.status})`);
            throw new Error(msg);
        }

        if (!data) {
            throw new Error('Server returned an invalid response (not JSON).');
        }

        return data;
    })
    .then(data => {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span>Verify Email</span>';
        
        if (data.status === 'success') {
            showNotification('success', 'Email Verified!', 'Your account is now active. Redirecting to login...', 5000);
            closeOTPModal();
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = '../index.php';
            }, 2000);
        } else {
            showOTPError(data.message || 'Invalid verification code.');
            // Clear inputs
            inputs.forEach(input => input.value = '');
            inputs[0].focus();
        }
    })
    .catch(error => {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span>Verify Email</span>';
        showOTPError(error.message || 'Failed to verify. Please try again.');
        console.error('Verification error:', error);
    });
}

function resendOTP() {
    const apiPath = getOTPAPIPath('resend_otp.php');
    
    showNotification('info', 'Sending...', 'Sending new verification code...', 3000);
    
    fetch(apiPath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            email: verificationEmail
        })
    })
    .then(async (response) => {
        const responseText = await response.text();
        let data = null;

        try {
            data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            const msg = (data && data.message) ? data.message : (responseText || `Request failed (${response.status})`);
            throw new Error(msg);
        }

        if (!data) {
            throw new Error('Server returned an invalid response (not JSON).');
        }

        return data;
    })
    .then(data => {
        if (data.status === 'success') {
            showNotification('success', 'Code Sent!', 'New verification code sent to your email.', 5000);
            // Clear inputs
            const inputs = document.querySelectorAll('.otp-input');
            inputs.forEach(input => input.value = '');
            inputs[0].focus();
        } else {
            showNotification('error', 'Failed', data.message || 'Failed to resend code.');
        }
    })
    .catch(error => {
        showNotification('error', 'Error', error.message || 'Failed to resend code. Please try again.');
        console.error('Resend error:', error);
    });
}

function showOTPError(message) {
    const errorDiv = document.getElementById('otpError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function closeOTPModal() {
    const modal = document.getElementById('otpVerificationModal');
    if (modal) {
        modal.remove();
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

    // Signup form validation
    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        console.log('Signup form found, adding event listener');
        signupForm.addEventListener('submit', handleSignup);
    } else {
        console.log('Signup form not found');
    }

    // Privacy checkbox validation
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    if (agreeTermsCheckbox) {
        console.log('Privacy checkbox found, adding event listener');
        agreeTermsCheckbox.addEventListener('change', function() {
            console.log('Checkbox changed:', this.checked);
            // Update visual state
            const checkmark = this.nextElementSibling;
            if (checkmark && checkmark.classList.contains('checkmark')) {
                if (this.checked) {
                    checkmark.style.background = '#4a2d6d';
                    checkmark.style.borderColor = '#4a2d6d';
                } else {
                    checkmark.style.background = '';
                    checkmark.style.borderColor = '';
                }
            }
        });
    } else {
        console.log('Privacy checkbox not found');
    }

    // Social signup buttons
    const googleBtn = document.querySelector('.social-button.google');
    const facebookBtn = document.querySelector('.social-button.facebook');

    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleSignup);
        console.log('Google signup button event listener added');
    }

    if (facebookBtn) {
        facebookBtn.addEventListener('click', handleFacebookSignup);
        console.log('Facebook signup button event listener added');
    }
});