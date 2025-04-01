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
        const profileNameElement = document.getElementById('profile-name');
        const profileEmailElement = document.getElementById('profile-email');
        
        if (profileNameElement) {
            profileNameElement.textContent = user.displayName || 'User';
        }
        if (profileEmailElement) {
            profileEmailElement.textContent = user.email || '';
        }
        
        // Show loading state
        showAlert('Loading profile information...', 'info');
        
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
            const data = await response.json();
            throw new Error(data.message || 'Failed to load profile');
        }
        
        const data = await response.json();
        
        // Update profile form with user data
        if (data.user) {
            const nameInput = document.getElementById('name');
            const phoneInput = document.getElementById('phone');
            const upiInput = document.getElementById('upi-id');
            
            if (nameInput) {
                nameInput.value = data.user.name || user.displayName || '';
            }
            if (phoneInput) {
                phoneInput.value = data.user.phone || '';
            }
            if (upiInput) {
                upiInput.value = data.user.upiId || '';
            }
            
            // Update displayed profile info
            if (profileNameElement) {
                profileNameElement.textContent = data.user.name || user.displayName || 'User';
            }
            
            // Clear loading message
            showAlert('Profile loaded successfully', 'success');
        }
        
        // Also load home info to show current home
        loadHomeInfo();
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile information: ' + error.message, 'error');
    }
}

// Load home information
function loadHomeInfo() {
    const homeId = localStorage.getItem('currentHomeId');
    const currentHomeElement = document.getElementById('current-home-name');
    
    if (!homeId) {
        if (currentHomeElement) {
            currentHomeElement.textContent = 'No home selected';
        }
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
                return response.json().then(err => {
                    throw new Error(err.message || 'Failed to load home information');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.home && currentHomeElement) {
                currentHomeElement.textContent = data.home.name;
            } else {
                throw new Error('Invalid home data received');
            }
        })
        .catch(error => {
            console.error('Error loading home info:', error);
            if (currentHomeElement) {
                currentHomeElement.textContent = 'Error loading home';
            }
            showAlert('Failed to load home information: ' + error.message, 'error');
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
        
        const data = await response.json();
        
        // Update displayed profile info
        const profileNameElement = document.getElementById('profile-name');
        if (profileNameElement) {
            profileNameElement.textContent = name;
        }
        
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
        
        const data = await response.json();
        
        // Save UPI ID to local storage for quick access
        localStorage.setItem('upiId', upiId);
        
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
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Remove alert after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
} 