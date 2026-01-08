/**
 * Firebase Configuration
 * 
 * HOW TO SET UP (FREE):
 * 1. Go to https://console.firebase.google.com/
 * 2. Click "Create a project" or "Add project"
 * 3. Enter project name (e.g., "OSAS-System")
 * 4. Disable Google Analytics (optional, for simplicity)
 * 5. Click "Create project"
 * 6. Once created, click the web icon </> to add a web app
 * 7. Register your app with a nickname
 * 8. Copy the firebaseConfig values below
 * 9. Go to Authentication > Sign-in method
 * 10. Enable "Google" and "Facebook" providers
 * 11. For Facebook, you'll need to add your Facebook App ID and Secret
 * 
 * That's it! Firebase handles all the OAuth complexity for free.
 */

// ============================================
// FIREBASE CONFIGURATION
// Replace with your Firebase project config
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBViZP-lok8j3gfTQnvUlHN7-WoGkTtzsU",
    authDomain: "osas-a076b.firebaseapp.com",
    projectId: "osas-a076b",
    storageBucket: "osas-a076b.firebasestorage.app",
    messagingSenderId: "195070527318",
    appId: "1:195070527318:web:c30ce779ab9df4994938f7"
  };
  
// Initialize Firebase
let firebaseApp = null;
let firebaseAuth = null;

// Check if Firebase is configured (not using placeholder values)
function isFirebaseConfigured() {
    // Check if API key exists and is not a placeholder
    const hasValidApiKey = firebaseConfig.apiKey && 
                          firebaseConfig.apiKey !== 'YOUR_API_KEY' && 
                          !firebaseConfig.apiKey.includes('YOUR_');
    
    // Check if other required fields are present
    const hasValidConfig = hasValidApiKey && 
                          firebaseConfig.authDomain && 
                          firebaseConfig.projectId &&
                          firebaseConfig.apiKey.length > 20; // Real API keys are longer
    
    return hasValidConfig;
}

// Initialize Firebase when ready
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded. Make sure Firebase scripts are included before this file.');
        return false;
    }

    if (!isFirebaseConfigured()) {
        console.log('ℹ️ Firebase config appears to be using placeholders');
        return false;
    }

    try {
        // Check if already initialized
        if (firebaseApp) {
            firebaseAuth = firebase.auth();
            return true;
        }

        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        // Check if app already exists (might be initialized elsewhere)
        if (error.code === 'app/duplicate-app') {
            firebaseApp = firebase.app();
            firebaseAuth = firebase.auth();
            console.log('✅ Firebase already initialized');
            return true;
        }
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

// Try to initialize immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    // DOM already loaded, try to initialize
    setTimeout(initializeFirebase, 100);
}

// ============================================
// FIREBASE AUTH FUNCTIONS
// ============================================

/**
 * Sign in with Google using Firebase
 */
async function firebaseGoogleSignIn() {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        return { success: false, error: 'not_configured', message: 'Firebase SDK not loaded' };
    }

    // Check if Firebase Auth is initialized, initialize if needed
    if (!firebaseAuth) {
        const initialized = initializeFirebase();
        if (!initialized) {
            return { success: false, error: 'not_configured', message: 'Firebase is not configured or failed to initialize' };
        }
    }

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await firebaseAuth.signInWithPopup(provider);
        const user = result.user;
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: user.photoURL,
                provider: 'google'
            },
            token: await user.getIdToken()
        };
    } catch (error) {
        console.error('Google sign-in error:', error);
        return {
            success: false,
            error: error.code,
            message: error.message
        };
    }
}

/**
 * Sign in with Facebook using Firebase
 */
async function firebaseFacebookSignIn() {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        return { success: false, error: 'not_configured', message: 'Firebase SDK not loaded' };
    }

    // Check if Firebase Auth is initialized, initialize if needed
    if (!firebaseAuth) {
        const initialized = initializeFirebase();
        if (!initialized) {
            return { success: false, error: 'not_configured', message: 'Firebase is not configured or failed to initialize' };
        }
    }

    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        
        const result = await firebaseAuth.signInWithPopup(provider);
        const user = result.user;
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: user.photoURL,
                provider: 'facebook'
            },
            token: await user.getIdToken()
        };
    } catch (error) {
        console.error('Facebook sign-in error:', error);
        return {
            success: false,
            error: error.code,
            message: error.message
        };
    }
}

/**
 * Sign out from Firebase
 */
async function firebaseSignOut() {
    if (firebaseAuth) {
        try {
            await firebaseAuth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'Firebase not initialized' };
}

/**
 * Get current Firebase user
 */
function getCurrentFirebaseUser() {
    return firebaseAuth?.currentUser || null;
}

// Export functions to window for global access
window.firebaseGoogleSignIn = firebaseGoogleSignIn;
window.firebaseFacebookSignIn = firebaseFacebookSignIn;
window.firebaseSignOut = firebaseSignOut;
window.getCurrentFirebaseUser = getCurrentFirebaseUser;
window.isFirebaseConfigured = isFirebaseConfigured;

