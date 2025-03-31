// auth.js - Client side authentication functions

let isInitialized = false;
let isCheckingHomes = false;

// Wait for Firebase to be ready
function waitForFirebase(callback, maxAttempts = 20) {
    let attempts = 0;
    const checkFirebase = () => {
        attempts++;
        console.log(`Checking Firebase (attempt ${attempts}/${maxAttempts})...`);
        
        // Check both for firebase.apps and the global flag
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && window.firebaseReady) {
            console.log('Firebase is ready!');
            setTimeout(callback, 100); // Small delay to ensure auth is ready
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(checkFirebase, 200); // Increased timeout between attempts
        } else {
            console.error('Firebase initialization timeout after multiple attempts');
            
            // Try to initialize again as a fallback
            try {
                if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
                    const firebaseConfig = {
                        apiKey: "AIzaSyDJme3UanLUE3H2D3QY7xXaG_Xlbii1JL8",
                        authDomain: "easy-chore-project.firebaseapp.com",
                        projectId: "easy-chore-project",
                        storageBucket: "easy-chore-project.firebasestorage.app",
                        messagingSenderId: "444941357579",
                        appId: "1:444941357579:web:1867f23936ded8700b2d0e"
                    };
                    firebase.initializeApp(firebaseConfig);
                    console.log("Firebase initialized as fallback");
                    setTimeout(callback, 500);
                    return;
                }
            } catch (error) {
                console.error("Fallback initialization failed:", error);
            }
            
            showAlert('Failed to initialize authentication. Please refresh the page.', 'error');
            
            // Show the landing page content despite errors
            const landingPage = document.querySelector('.landing-page');
            if (landingPage) {
                landingPage.classList.add('ready');
            }
            
            // Hide loading state
            const loadingState = document.getElementById('loading-state');
            if (loadingState) {
                loadingState.classList.add('hidden');
            }
        }
    };
    
    checkFirebase();
}

// Initialize authentication
function initializeAuth() {
    if (isInitialized) return;
    isInitialized = true;

    try {
        // Setup event listeners
        setupEventListeners();

        // Check authentication state
        checkAuthState();
    } catch (error) {
        console.error('Authentication setup error:', error);
        showAlert('Failed to initialize authentication. Please refresh the page.', 'error');
    }
}

// Start initialization when the page loads
waitForFirebase(initializeAuth);

// Setup all event listeners
function setupEventListeners() {
    // Modal functionality
    setupModals();

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showAlert('Please enter both email and password', 'error');
                return;
            }

            try {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                showAlert('Login successful!', 'success');
                
                // Redirect to select-home page instead of dashboard
                setTimeout(() => {
                    window.location.href = 'select-home.html';
                }, 1000);
            } catch (error) {
                console.error('Login error:', error);
                
                let errorMessage = 'Login failed';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Invalid email or password';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many unsuccessful login attempts. Please try again later';
                }
                
                showAlert(errorMessage, 'error');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Google authentication
    const googleLoginBtn = document.getElementById('google-login');
    const googleSignupBtn = document.getElementById('google-signup');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => handleGoogleAuth('login'));
    }
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', () => handleGoogleAuth('signup'));
    }
}

// Setup modal functionality
function setupModals() {
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    
    // Login modal
    const loginBtn = document.getElementById('login-btn');
    const loginClose = loginModal?.querySelector('.close');

    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => showModal(loginModal));
    }

    if (loginClose) {
        loginClose.addEventListener('click', () => hideModal(loginModal));
    }

    // Signup modal
    const signupBtn = document.getElementById('signup-btn');
    const signupClose = signupModal?.querySelector('.close');

    if (signupBtn && signupModal) {
        signupBtn.addEventListener('click', () => showModal(signupModal));
    }

    if (signupClose) {
        signupClose.addEventListener('click', () => hideModal(signupModal));
    }

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) hideModal(loginModal);
        if (event.target === signupModal) hideModal(signupModal);
    });
}

// Modal helper functions
function showModal(modal) {
    if (modal) modal.style.display = 'block';
}

function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

// Handle signup form submission
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.updateProfile({ displayName: name });
        const token = await user.getIdToken();
        
        // Create user in backend
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                email,
                uid: user.uid
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to register user in database');
        }
        
        localStorage.setItem('token', token);
        hideModal(document.getElementById('signup-modal'));
        showAlert('Account created successfully!', 'success');
        
        window.location.href = '/create-join-home.html';
    } catch (error) {
        console.error('Signup Error:', error);
        let errorMessage = 'Signup failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please login instead.';
        }
        showAlert(errorMessage, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle Google authentication
async function handleGoogleAuth(type) {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const token = await result.user.getIdToken();
        localStorage.setItem('token', token);
        
        if (type === 'signup') {
            window.location.href = '/create-join-home.html';
        } else {
            await checkUserHome(result.user.email);
        }
    } catch (error) {
        console.error('Google Auth Error:', error);
        showAlert('Google authentication failed. Please try again.', 'error');
    }
}

// Show alert
function showAlert(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    
    // Add the alert to the page
    document.body.appendChild(alertBox);
    
    // Position the alert at the top
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translateX(-50%)';
    alertBox.style.zIndex = '9999';
    alertBox.style.padding = '10px 20px';
    alertBox.style.borderRadius = '4px';
    alertBox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    // Style based on type
    if (type === 'error') {
        alertBox.style.backgroundColor = '#f8d7da';
        alertBox.style.color = '#721c24';
        alertBox.style.border = '1px solid #f5c6cb';
    } else if (type === 'success') {
        alertBox.style.backgroundColor = '#d4edda';
        alertBox.style.color = '#155724';
        alertBox.style.border = '1px solid #c3e6cb';
    } else {
        alertBox.style.backgroundColor = '#cce5ff';
        alertBox.style.color = '#004085';
        alertBox.style.border = '1px solid #b8daff';
    }
    
    // Remove the alert after 5 seconds
    setTimeout(() => {
        alertBox.style.opacity = '0';
        alertBox.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (alertBox.parentNode) {
                alertBox.parentNode.removeChild(alertBox);
            }
        }, 500);
    }, 5000);
}

// Check if user is already authenticated
function checkAuthState() {
    let authCheckTimeout;
    
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        clearTimeout(authCheckTimeout);
        
        if (user) {
            try {
                const token = await user.getIdToken();
                localStorage.setItem('token', token);
                
                // Only check homes if we're on the landing page and not already checking
                if ((window.location.pathname === '/' || window.location.pathname === '/index.html') && !isCheckingHomes) {
                    // Add a small delay to prevent flickering
                    setTimeout(async () => {
                        await checkUserHome(user.email);
                    }, 500);
                } else {
                    // Show the landing page content for other pages
                    const landingPage = document.querySelector('.landing-page');
                    if (landingPage) {
                        landingPage.classList.add('ready');
                    }
                    
                    // Hide loading state
                    const loadingState = document.getElementById('loading-state');
                    if (loadingState) {
                        loadingState.classList.add('hidden');
                    }
                }
            } catch (error) {
                console.error('Auth state check error:', error);
                showAlert('Authentication error. Please try logging in again.', 'error');
                handleLogout();
            }
        } else {
            // User is not logged in, clear any stored data
            localStorage.removeItem('token');
            localStorage.removeItem('currentHomeId');
            localStorage.removeItem('currentHomeName');
            localStorage.removeItem('selectedHome');
            localStorage.removeItem('homes');
            
            // Only redirect to landing page if we're not already there
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                window.location.href = '/';
            } else {
                // Show the landing page content
                const landingPage = document.querySelector('.landing-page');
                if (landingPage) {
                    landingPage.classList.add('ready');
                }
                
                // Hide loading state
                const loadingState = document.getElementById('loading-state');
                if (loadingState) {
                    loadingState.classList.add('hidden');
                }
            }
        }
    }, (error) => {
        console.error('Auth state listener error:', error);
        showAlert('Authentication error. Please refresh the page.', 'error');
    });

    // Set a timeout to prevent infinite loading
    authCheckTimeout = setTimeout(() => {
        unsubscribe();
        showAlert('Loading timeout. Please refresh the page.', 'error');
    }, 10000); // 10 second timeout
}

// Check if user has a home
async function checkUserHome(email) {
    if (isCheckingHomes) return;
    isCheckingHomes = true;

    try {
        const token = await firebase.auth().currentUser.getIdToken();
        
        // First try the user homes endpoint
        let response = await fetch('/api/homes/user/homes', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // If that fails, try the alternative endpoint
        if (!response.ok) {
            console.log('First endpoint failed, trying alternative...');
            response = await fetch('/api/homes', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch homes: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Homes data:', data);

        // Handle different API response formats
        const homes = data.homes || data;
        if (!homes || !Array.isArray(homes) || homes.length === 0) {
            // No homes found, redirect to create/join home page
            console.log('No homes found, redirecting to create-join-home.html');
            window.location.href = '/create-join-home.html';
            return;
        }

        // Store homes data
        localStorage.setItem('homes', JSON.stringify(homes));
        
        // If there's only one home, set it as current
        if (homes.length === 1) {
            const home = homes[0];
            const homeId = home.homeId || home._id;
            localStorage.setItem('currentHomeId', homeId);
            localStorage.setItem('currentHomeName', home.name || 'My Home');
            
            // Also set up selectedHome object for compatibility
            localStorage.setItem('selectedHome', JSON.stringify({
                homeId: homeId,
                name: home.name || 'My Home'
            }));
            
            console.log('One home found, redirecting to dashboard.html');
            window.location.href = '/dashboard.html';
            return;
        }

        // Multiple homes, redirect to select home page
        console.log('Multiple homes found, redirecting to select-home.html');
        window.location.href = '/select-home.html';
    } catch (error) {
        console.error('Error checking homes:', error);
        
        // Fallback for API failures - show the landing page
        const landingPage = document.querySelector('.landing-page');
        if (landingPage) {
            landingPage.classList.add('ready');
        }
        
        // Hide loading state
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
        
        showAlert('Failed to load homes. Please try again.', 'error');
    } finally {
        isCheckingHomes = false;
    }
}

// Handle logout
async function handleLogout() {
    try {
        // First sign out from Firebase
        await firebase.auth().signOut();
        
        // Then clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Force reload the page to clear any cached state
        window.location.href = '/';
    } catch (error) {
        console.error('Logout Error:', error);
        showAlert('Failed to log out. Please try again.', 'error');
    }
}