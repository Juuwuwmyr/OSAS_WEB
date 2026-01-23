// Dark/Light Mode Functionality
let darkMode = true;

function toggleTheme() {
    darkMode = !darkMode;
    updateTheme();
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    console.log('Theme toggled to:', darkMode ? 'dark' : 'light');
}

function updateTheme() {
    // Toggle dark-mode class on body
    document.body.classList.toggle('dark-mode', darkMode);

    // Update theme toggle icon
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        if (darkMode) {
            themeToggle.classList.remove('fa-sun');
            themeToggle.classList.add('fa-moon');
        } else {
            themeToggle.classList.remove('fa-moon');
            themeToggle.classList.add('fa-sun');
        }
    }

    // Update theme-color meta tag for PWA
    updateThemeColor();
}

function updateThemeColor() {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', darkMode ? '#0F0F0F' : '#ffffff');
    }
}

// Check for saved theme preference or system preference
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        darkMode = savedTheme === 'dark';
    } else {
        darkMode = systemPrefersDark;
    }

    updateTheme();
}

// Password visibility toggle
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.toggle-password i');

    if (passwordInput && toggleButton) {
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
}

// Toast Notification Function
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 400);
    }, 5000);
}

// Form validation
function validateForm(username, password) {
    if (!username || !password) {
        showToast('Please fill in all fields.', 'error');
        return false;
    }

    if (username.length < 3) {
        showToast('Username must be at least 3 characters long.', 'error');
        return false;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return false;
    }

    return true;
}

// AJAX Login Handler
function handleLoginFormSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginButton = document.getElementById('loginButton');
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    if (!validateForm(username, password)) {
        return;
    }

    // Loading Animation
    loginButton.disabled = true;
    loginButton.innerHTML = `<div class="spinner"></div><span>Logging in...</span>`;

    fetch('./app/views/auth/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&rememberMe=${rememberMe}`
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(data => {
            loginButton.disabled = false;
            loginButton.innerHTML = `<span>Login</span>`;

            if (data.status === 'success') {
                showToast('Login successful! Redirecting...', 'success');

                const payload = data.data || data;

                const sessionData = {
                    name: payload.name,
                    role: payload.role,
                    user_id: payload.user_id || payload.studentId,
                    studentId: payload.studentId,
                    studentIdCode: payload.studentIdCode,
                    expires: payload.expires * 1000,
                    theme: darkMode ? 'dark' : 'light'
                };

                localStorage.setItem('userSession', JSON.stringify(sessionData));
                
                if (payload.studentId) {
                    localStorage.setItem('student_id', payload.studentId);
                    if (payload.studentIdCode) {
                        localStorage.setItem('student_id_code', payload.studentIdCode);
                    }
                }

                setTimeout(() => {
                    if (payload.role === 'admin') {
                        window.location.href = './includes/dashboard.php';
                    } else {
                        window.location.href = './includes/user_dashboard.php';
                    }
                }, 1000);
            } else {
                showToast(data.message || 'Invalid credentials.', 'error');
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            loginButton.disabled = false;
            loginButton.innerHTML = `<span>Login</span>`;
            showToast('Server error. Please try again later.', 'error');
        });
}

// ============================================
// SOCIAL LOGIN HANDLERS (Firebase)
// ============================================

// Google Login Handler using Firebase
async function handleGoogleLogin() {
    const googleBtn = document.querySelector('.social-button.google');
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<div class="spinner"></div><span>Connecting to Google...</span>`;
    }

    try {
        // Check if Firebase functions are available
        if (typeof firebaseGoogleSignIn !== 'function') {
            throw new Error('Firebase is not loaded. Please check your configuration.');
        }

        const result = await firebaseGoogleSignIn();
        
        if (result.success) {
            showToast('Google login successful! Processing...', 'success');
            
            // Send user data to PHP backend for session creation
            await processSocialLogin(result.user, result.token);
        } else {
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = `<i class="fab fa-google"></i>Continue with Google`;
            }
            
            if (result.error === 'auth/popup-closed-by-user') {
                showToast('Login cancelled', 'info');
            } else if (result.error === 'not_configured') {
                showToast('Firebase is not configured. Please check firebase-config.js', 'error');
            } else {
                showToast(result.message || 'Google login failed', 'error');
            }
        }
    } catch (error) {
        console.error('Google login error:', error);
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = `<i class="fab fa-google"></i>Continue with Google`;
        }
        showToast(error.message || 'An error occurred during Google login', 'error');
    }
}

// Facebook Login Handler using Firebase
async function handleFacebookLogin() {
    const facebookBtn = document.querySelector('.social-button.facebook');
    if (facebookBtn) {
        facebookBtn.disabled = true;
        facebookBtn.innerHTML = `<div class="spinner"></div><span>Connecting to Facebook...</span>`;
    }

    try {
        // Check if Firebase functions are available
        if (typeof firebaseFacebookSignIn !== 'function') {
            throw new Error('Firebase is not loaded. Please check your configuration.');
        }

        const result = await firebaseFacebookSignIn();
        
        if (result.success) {
            showToast('Facebook login successful! Processing...', 'success');
            
            // Send user data to PHP backend for session creation
            await processSocialLogin(result.user, result.token);
        } else {
            if (facebookBtn) {
                facebookBtn.disabled = false;
                facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Continue with Facebook`;
            }
            
            if (result.error === 'auth/popup-closed-by-user') {
                showToast('Login cancelled', 'info');
            } else if (result.error === 'not_configured') {
                showToast('Firebase is not configured. Please check firebase-config.js', 'error');
            } else {
                showToast(result.message || 'Facebook login failed', 'error');
            }
        }
    } catch (error) {
        console.error('Facebook login error:', error);
        if (facebookBtn) {
            facebookBtn.disabled = false;
            facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Continue with Facebook`;
        }
        showToast(error.message || 'An error occurred during Facebook login', 'error');
    }
}

// Process social login - send to PHP backend
async function processSocialLogin(userData, token) {
    try {
        const response = await fetch('./app/views/auth/social_login.php', {
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
                theme: darkMode ? 'dark' : 'light'
            };

            localStorage.setItem('userSession', JSON.stringify(sessionData));

            showToast('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                if (data.role === 'admin') {
                    window.location.href = './includes/dashboard.php';
                } else {
                    window.location.href = './includes/user_dashboard.php';
                }
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
            
            // Reset buttons
            const googleBtn = document.querySelector('.social-button.google');
            const facebookBtn = document.querySelector('.social-button.facebook');
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = `<i class="fab fa-google"></i>Continue with Google`;
            }
            if (facebookBtn) {
                facebookBtn.disabled = false;
                facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Continue with Facebook`;
            }
        }
    } catch (error) {
        console.error('Social login processing error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            userData: userData
        });
        
        const errorMessage = error.message || 'Failed to process login. Please check console for details.';
        showToast(errorMessage, 'error');
        
        // Reset buttons
        const googleBtn = document.querySelector('.social-button.google');
        const facebookBtn = document.querySelector('.social-button.facebook');
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = `<i class="fab fa-google"></i>Continue with Google`;
        }
        if (facebookBtn) {
            facebookBtn.disabled = false;
            facebookBtn.innerHTML = `<i class="fab fa-facebook-f"></i>Continue with Facebook`;
        }
    }
}

// Show social login info modal (Firebase setup)
function showSocialLoginModal(provider) {
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
                <h4>Enable ${providerName} Login</h4>
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

// Initialize application
function initApp() {
    console.log('Initializing app...');

    // Initialize theme
    checkSavedTheme();

    // Add event listeners
    const loginForm = document.getElementById('loginForm');
    const themeToggle = document.getElementById('themeToggle');
    const passwordToggle = document.getElementById('passwordToggle');

    console.log('Elements found:', {
        loginForm: !!loginForm,
        themeToggle: !!themeToggle,
        passwordToggle: !!passwordToggle
    });

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
        console.log('Login form event listener added');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle event listener added');
    }

    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
        console.log('Password toggle event listener added');
    }

    // Social login buttons
    const googleBtn = document.querySelector('.social-button.google');
    const facebookBtn = document.querySelector('.social-button.facebook');

    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
        console.log('Google login button event listener added');
    }

    if (facebookBtn) {
        facebookBtn.addEventListener('click', handleFacebookLogin);
        console.log('Facebook login button event listener added');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function (e) {
        // Only update if user hasn't explicitly set a preference
        if (!localStorage.getItem('theme')) {
            darkMode = e.matches;
            updateTheme();
        }
    });

    console.log('App initialization complete');
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded');
    initApp();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('DOM already ready, initializing immediately');
    initApp();
}