// profile.js - Client side profile management

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = '/';
            return;
        }
        
        // Load user profile data
        loadUserProfile();
        
        // Setup form submission handlers
        const profileForm = document.getElementById('profile-form');
        const paymentForm = document.getElementById('payment-form');
        
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }
        
        if (paymentForm) {
            paymentForm.addEventListener('submit', handlePaymentInfoUpdate);
        }
    });
});

// Load user profile information
async function loadUserProfile() {
    try {
        // Display authenticated user info while loading
        const user = firebase.auth().currentUser;
        document.getElementById('profile-name').textContent = user.displayName || 'User';
        document.getElementById('profile-email').textContent = user.email || '';
        
        // Fetch user profile from our backend
        const token = await user.getIdToken();
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const data = await response.json();
        
        // Update profile form with user data
        if (data.user) {
            document.getElementById('name').value = data.user.name || user.displayName || '';
            document.getElementById('phone').value = data.user.phone || '';
            document.getElementById('upi-id').value = data.user.upiId || '';
            
            // Update displayed profile info
            document.getElementById('profile-name').textContent = data.user.name || user.displayName || 'User';
        }
        
        // Also load home info to show current home
        loadHomeInfo();
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile information', 'error');
    }
}

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
            // Fetch home details
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
                // Display the home name
                document.getElementById('current-home-name').textContent = data.home.name;
            } else {
                throw new Error('Invalid home data received');
            }
        })
        .catch(error => {
            console.error('Error loading home info:', error);
            document.getElementById('current-home-name').textContent = 'Error loading home';
        });
}

// Handle profile form submission
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!name) {
        showAlert('Please enter your name', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        // Update profile in Firebase Auth (for display name)
        await firebase.auth().currentUser.updateProfile({
            displayName: name
        });
        
        // Update profile in our backend
        const token = await firebase.auth().currentUser.getIdToken();
        const response = await fetch('/api/users/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                phone
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update profile');
        }
        
        // Update displayed profile info
        document.getElementById('profile-name').textContent = name;
        
        // Show success message
        showAlert('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile: ' + error.message, 'error');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle payment info form submission
async function handlePaymentInfoUpdate(e) {
    e.preventDefault();
    
    const upiId = document.getElementById('upi-id').value.trim();
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        // Save UPI ID to local storage for quick access
        localStorage.setItem('upiId', upiId);
        
        // Update UPI ID in our backend
        const token = await firebase.auth().currentUser.getIdToken();
        const response = await fetch('/api/users/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                upiId
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update payment information');
        }
        
        // Show success message
        showAlert('Payment information updated successfully', 'success');
    } catch (error) {
        console.error('Error updating payment info:', error);
        showAlert('Failed to update payment information: ' + error.message, 'error');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Show alert message
function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Add alert to the page
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Remove alert after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
} 