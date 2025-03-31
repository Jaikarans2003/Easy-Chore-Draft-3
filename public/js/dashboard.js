// dashboard.js - Dashboard functionality

let isInitialized = false;
let currentUser = null;
let homeData = null;

// Cache DOM elements
const domElements = {
    loadingState: null,
    userName: null,
    currentHomeName: null,
    homeId: null,
    membersList: null,
    logoutBtn: null
};

// Initialize DOM elements
function initializeDOMElements() {
    domElements.loadingState = document.getElementById('loading-state');
    domElements.userName = document.getElementById('user-name');
    domElements.currentHomeName = document.getElementById('current-home-name');
    domElements.homeId = document.getElementById('home-id');
    domElements.membersList = document.getElementById('members-list');
    domElements.logoutBtn = document.getElementById('logout-btn');
}

// Wait for Firebase to be ready
function waitForFirebase(callback, maxAttempts = 20) {
    let attempts = 0;
    const checkFirebase = () => {
        attempts++;
        console.log(`Dashboard: Checking Firebase (attempt ${attempts}/${maxAttempts})...`);
        
        // Check if Firebase is defined and initialized
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            console.log('Dashboard: Firebase is ready!');
            setTimeout(callback, 100); // Small delay to ensure auth is ready
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(checkFirebase, 200);
        } else {
            console.error('Dashboard: Firebase initialization timeout');
            
            // Show error and reveal content anyway
            showAlert('Failed to initialize authentication. Please refresh the page.', 'error');
            
            // Hide loading state
            if (domElements.loadingState) {
                domElements.loadingState.classList.add('hidden');
            }
        }
    };
    checkFirebase();
}

// Initialize dashboard
function initializeDashboard() {
    if (isInitialized) return;
    isInitialized = true;
    console.log('Dashboard: Initializing dashboard...');

    // Initialize DOM elements
    initializeDOMElements();

    // Show loading state
    if (domElements.loadingState) {
        domElements.loadingState.classList.remove('hidden');
    }

    // Check authentication
    firebase.auth().onAuthStateChanged(async function(user) {
        console.log('Dashboard: Auth state changed:', user ? user.email : 'No user');
        currentUser = user;
        if (user) {
            try {
                const token = await user.getIdToken();
                localStorage.setItem('token', token);
                
                // Display user name if available
                if (domElements.userName && user.displayName) {
                    domElements.userName.textContent = user.displayName;
                }
                
                // Load home data
                await loadHomeData();
            } catch (error) {
                console.error('Dashboard: Error getting token:', error);
                showAlert('Authentication error. Please log in again.', 'error');
                handleLogout();
            }
        } else {
            window.location.href = '/';
        }
    });

    // Setup logout button
    setupLogoutButton();
}

// Start initialization when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard: DOM loaded, waiting for Firebase...');
    waitForFirebase(initializeDashboard);
});

// Setup logout button
function setupLogoutButton() {
    if (!domElements.logoutBtn) {
        console.error('Dashboard: Logout button not found');
        return;
    }

    // Remove any existing click listeners
    const newLogoutBtn = domElements.logoutBtn.cloneNode(true);
    domElements.logoutBtn.parentNode.replaceChild(newLogoutBtn, domElements.logoutBtn);
    domElements.logoutBtn = newLogoutBtn;
    
    // Add click event listener
    newLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleLogout();
    });
    
    console.log('Dashboard: Logout button initialized');
}

// Load home data from localStorage first, then fetch from API
async function loadHomeData() {
    console.log('Dashboard: Loading home data...');
    
    try {
        // Show loading state
        if (domElements.loadingState) {
            domElements.loadingState.classList.remove('hidden');
        }
        
        // First try to get data from localStorage to display immediately
        const cachedHomeId = localStorage.getItem('currentHomeId');
        const cachedHomeName = localStorage.getItem('currentHomeName');
        const cachedHomeData = localStorage.getItem('selectedHome');
        
        if (cachedHomeId && cachedHomeName) {
            console.log('Dashboard: Using cached home data for initial display');
            
            // Display cached home info while we fetch the latest
            if (domElements.currentHomeName) {
                domElements.currentHomeName.textContent = cachedHomeName;
            }
            if (domElements.homeId) {
                domElements.homeId.textContent = `ID: ${cachedHomeId}`;
            }
            
            // Try to display cached members if available
            if (cachedHomeData) {
                try {
                    const parsedHome = JSON.parse(cachedHomeData);
                    if (parsedHome.members && parsedHome.members.length > 0) {
                        displayMembers(parsedHome.members);
                    }
                } catch (e) {
                    console.warn('Dashboard: Failed to parse cached home data', e);
                }
            }
        }
        
        // Get home ID from localStorage
        const homeId = localStorage.getItem('currentHomeId');
        
        if (!homeId) {
            showAlert('No home selected. Please select a home.', 'error');
            window.location.href = '/select-home.html';
            return;
        }
        
        // Fetch fresh home data from API
        console.log(`Dashboard: Fetching home data for ${homeId}...`);
        const token = await currentUser.getIdToken();
        
        // Try multiple endpoints in case one fails
        let response;
        try {
            // First try specific home endpoint
            response = await fetch(`/api/homes/${homeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Dashboard: First API attempt failed:', error);
            
            // Try alternative endpoint
            response = await fetch(`/api/homes/home/${homeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        
        if (!response.ok) {
            if (response.status === 404) {
                showAlert('Home not found. Please select a different home.', 'error');
                window.location.href = '/select-home.html';
                return;
            }
            if (response.status === 403) {
                showAlert('You are not a member of this home. Please select a different home.', 'error');
                window.location.href = '/select-home.html';
                return;
            }
            throw new Error(`Failed to load home data: ${response.status} ${response.statusText}`);
        }
        
        // Parse the response
        const responseData = await response.json();
        console.log('Dashboard: Home data response:', responseData);
        
        // Get home data from response
        homeData = responseData.home || responseData;
        if (!homeData) {
            throw new Error('Invalid home data received from server');
        }
        
        // Normalize home data structure
        const normalizedHomeData = {
            homeId: homeData.homeId || homeData._id,
            name: homeData.name || 'My Home',
            members: homeData.members || []
        };
        
        console.log('Dashboard: Normalized home data:', normalizedHomeData);
        
        // Store home data in localStorage
        localStorage.setItem('currentHomeId', normalizedHomeData.homeId);
        localStorage.setItem('currentHomeName', normalizedHomeData.name);
        
        // Make sure selectedHome is also set for the chat feature
        localStorage.setItem('selectedHome', JSON.stringify(normalizedHomeData));
        
        // Display home info
        displayHomeInfo(normalizedHomeData);
        
        // Display members list
        if (normalizedHomeData.members && normalizedHomeData.members.length > 0) {
            displayMembers(normalizedHomeData.members);
        } else {
            if (domElements.membersList) {
                domElements.membersList.innerHTML = '<li class="list-item">No members found</li>';
            }
        }
    } catch (error) {
        console.error('Dashboard: Error loading home data:', error);
        showAlert('Error loading home data: ' + error.message, 'error');
    } finally {
        // Hide loading state
        if (domElements.loadingState) {
            setTimeout(() => {
                if (domElements.loadingState) {
                    domElements.loadingState.classList.add('hidden');
                }
            }, 500); // Short delay to ensure UI updates are visible
        }
    }
}

// Display home information
function displayHomeInfo(home) {
    console.log('Dashboard: Displaying home info:', home);
    
    if (domElements.currentHomeName) {
        domElements.currentHomeName.textContent = home.name || 'No Home';
        console.log('Dashboard: Set home name to:', home.name || 'No Home');
    } else {
        console.error('Dashboard: Home name element not found');
    }
    
    if (domElements.homeId && home.homeId) {
        domElements.homeId.textContent = `ID: ${home.homeId}`;
        console.log('Dashboard: Set home ID to:', home.homeId);
    } else {
        console.error('Dashboard: Home ID element not found or homeId missing');
    }
}

// Display members list
function displayMembers(members) {
    console.log('Dashboard: Displaying members:', members);
    if (!domElements.membersList) {
        console.error('Dashboard: Members list element not found');
        return;
    }

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (!members || members.length === 0) {
        console.log('Dashboard: No members found');
        domElements.membersList.innerHTML = '<li class="list-item">No members found</li>';
        return;
    }

    // Clear current list
    domElements.membersList.innerHTML = '';

    if (!currentUser) {
        console.warn('Dashboard: Current user not found, displaying members anyway');
    } else {
        console.log('Dashboard: Current user:', currentUser.email);
    }

    members.forEach(member => {
        // Skip invalid members
        if (!member || (!member.email && !member.uid && !member._id)) {
            console.warn('Dashboard: Invalid member data:', member);
            return;
        }
        
        const memberItem = document.createElement('li');
        memberItem.className = 'list-item';
        
        // Get member name and email, with fallbacks
        const memberName = member.name || member.displayName || 'Unknown User';
        const memberEmail = member.email || 'No email';
        const memberUid = member.uid || member._id || '';
        
        // Check if this is the current user (by email or uid)
        let isCurrentUser = false;
        if (currentUser) {
            isCurrentUser = 
                (member.email && member.email === currentUser.email) || 
                (member.uid && member.uid === currentUser.uid) ||
                (member._id && member._id === currentUser.uid);
        }
        
        memberItem.innerHTML = `
            <div class="member-info">
                <span class="member-name">${memberName}</span>
                ${isCurrentUser ? '<span class="member-badge">You</span>' : ''}
                <span class="member-email">${memberEmail}</span>
            </div>
        `;
        
        fragment.appendChild(memberItem);
        console.log(`Dashboard: Added member: ${memberName} (${memberEmail}), isCurrentUser: ${isCurrentUser}`);
    });

    // Add all members at once
    domElements.membersList.appendChild(fragment);
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
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