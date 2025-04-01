// dashboard.js - Main dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = '/';
            return;
        }
        
        // Set user name
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || 'User';
        }
        
        // Load home information
        loadHomeInfo();
        
        // Setup logout button
        setupLogout();
        
        // Hide loading state
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
    });
});

// Load home information
function loadHomeInfo() {
    const homeId = localStorage.getItem('currentHomeId');
    
    if (!homeId) {
        // No home selected, redirect to create/join page
        window.location.href = '/create-join-home.html';
        return;
    }
    
    // Get current user token
    firebase.auth().currentUser.getIdToken()
        .then(token => {
            return fetch(`/api/homes/${homeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load home information');
            }
            return response.json();
        })
        .then(data => {
            if (data.home) {
                // Update home name
                const homeNameElement = document.getElementById('current-home-name');
                if (homeNameElement) {
                    homeNameElement.textContent = data.home.name;
                }
                
                // Store home data for other pages
                localStorage.setItem('currentHome', JSON.stringify(data.home));
                
                // Display members
                displayMembers(data.home.members);
            }
        })
        .catch(error => {
            console.error('Error loading home info:', error);
            showAlert('Failed to load home information', 'error');
        });
}

// Display members list
function displayMembers(members) {
    const membersList = document.getElementById('members-list');
    if (!membersList) return;
    
    // Clear loading state
    membersList.innerHTML = '';
    
    if (!members || members.length === 0) {
        membersList.innerHTML = '<li class="list-item">No members found</li>';
        return;
    }
    
    // Get current user for comparison
    const currentUser = firebase.auth().currentUser;
    
    // Sort members alphabetically by name
    const sortedMembers = [...members].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
    );
    
    sortedMembers.forEach(member => {
        const memberItem = document.createElement('li');
        memberItem.className = 'list-item';
        
        const isCurrentUser = currentUser && (
            member.uid === currentUser.uid || 
            member.email === currentUser.email
        );
        
        memberItem.innerHTML = `
            <div class="member-info">
                <div class="member-name-container">
                    <span class="member-name">${member.name || 'Unknown User'}</span>
                    ${isCurrentUser ? '<span class="member-badge">You</span>' : ''}
                </div>
                <span class="member-email">${member.email || 'No email'}</span>
            </div>
        `;
        
        membersList.appendChild(memberItem);
    });
}

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            firebase.auth().signOut()
                .then(() => {
                    // Clear local storage
                    localStorage.clear();
                    // Redirect to login
                    window.location.href = '/';
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    showAlert('Failed to logout', 'error');
                });
        });
    }
}

// Function to navigate to chat
function navigateToChat() {
    // Get current home data
    const currentHomeId = localStorage.getItem('currentHomeId');
    const homeName = document.getElementById('current-home-name').textContent || 'My Home';
    
    if (!currentHomeId) {
        showAlert('No home selected. Please select a home first.', 'error');
        window.location.href = 'select-home.html';
        return;
    }
    
    // Set the selectedHome with the most current data
    const homeData = {
        homeId: currentHomeId,
        name: homeName
    };
    localStorage.setItem('selectedHome', JSON.stringify(homeData));
    
    // Navigate to chat page
    window.location.href = `home-chat.html?homeId=${currentHomeId}`;
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