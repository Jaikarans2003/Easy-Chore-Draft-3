// home.js - Client-side home management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = '/';
            return;
        } else {
            // User is authenticated, setup the page
            setupUIInteractions();
            setupFormSubmissions(user);
            
            // Add debug info for mobile
            console.log('User authenticated:', user.uid);
            console.log('User email:', user.email);
            console.log('Device width:', window.innerWidth);
            console.log('User agent:', navigator.userAgent);
        }
    });
});

// Setup UI interactions
function setupUIInteractions() {
    // Create Home card click
    const createHomeCard = document.getElementById('create-home-card');
    const createHomeForm = document.getElementById('create-home-form');
    const createHomeBtn = createHomeCard.querySelector('.btn');

    // Add multiple event listeners for both touch and click
    ['click', 'touchstart'].forEach(eventType => {
        createHomeBtn.addEventListener(eventType, function(e) {
            e.preventDefault();
            
            // Prevent double-firing on mobile devices
            if (eventType === 'touchstart') {
                e.stopPropagation();
            }
            
            console.log('Create home button ' + eventType);
            createHomeCard.parentElement.style.display = 'none';
            createHomeForm.style.display = 'block';
        }, { passive: false });
    });

    // Join Home card click
    const joinHomeCard = document.getElementById('join-home-card');
    const joinHomeForm = document.getElementById('join-home-form');
    const joinHomeBtn = joinHomeCard.querySelector('.btn');

    // Add multiple event listeners for both touch and click
    ['click', 'touchstart'].forEach(eventType => {
        joinHomeBtn.addEventListener(eventType, function(e) {
            e.preventDefault();
            
            // Prevent double-firing on mobile devices
            if (eventType === 'touchstart') {
                e.stopPropagation();
            }
            
            console.log('Join home button ' + eventType);
            joinHomeCard.parentElement.style.display = 'none';
            joinHomeForm.style.display = 'block';
        }, { passive: false });
    });

    // Back buttons
    const backButtons = document.querySelectorAll('.btn-back');
    backButtons.forEach(button => {
        ['click', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, function(e) {
                e.preventDefault();
                
                // Prevent double-firing on mobile devices
                if (eventType === 'touchstart') {
                    e.stopPropagation();
                }
                
                console.log('Back button ' + eventType);
                // Hide all forms
                document.getElementById('create-home-form').style.display = 'none';
                document.getElementById('join-home-form').style.display = 'none';
                
                // Show option cards
                document.querySelector('.option-cards').style.display = 'flex';
            }, { passive: false });
        });
    });

    // Add member button
    const addMemberBtn = document.getElementById('add-member-btn');
    let memberCount = 1;

    ['click', 'touchstart'].forEach(eventType => {
        addMemberBtn.addEventListener(eventType, function(e) {
            e.preventDefault();
            
            // Prevent double-firing on mobile devices
            if (eventType === 'touchstart') {
                e.stopPropagation();
            }
            
            memberCount++;
            
            const memberInputs = document.createElement('div');
            memberInputs.className = 'member-inputs';
            memberInputs.innerHTML = `
                <div class="form-group">
                    <label for="member-name-${memberCount}">Name</label>
                    <input type="text" id="member-name-${memberCount}" placeholder="Member's name">
                </div>
                <div class="form-group">
                    <label for="member-email-${memberCount}">Email</label>
                    <input type="email" id="member-email-${memberCount}" placeholder="Member's email">
                </div>
                <button type="button" class="remove-member-btn"><i class="fas fa-times"></i></button>
            `;
            
            document.getElementById('members-container').appendChild(memberInputs);
            
            // Add event listeners to remove button
            const removeBtn = memberInputs.querySelector('.remove-member-btn');
            ['click', 'touchstart'].forEach(evt => {
                removeBtn.addEventListener(evt, function(e) {
                    e.preventDefault();
                    if (evt === 'touchstart') {
                        e.stopPropagation();
                    }
                    memberInputs.remove();
                }, { passive: false });
            });
        }, { passive: false });
    });
}

// Setup form submissions
function setupFormSubmissions(user) {
    // Create Home form submission
    const createHomeForm = document.getElementById('create-home');
    
    createHomeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const homeNameInput = document.getElementById('home-name');
        const homeName = homeNameInput.value.trim();
        
        if (!homeName) {
            showAlert('Please enter a home name', 'error');
            return;
        }
        
        // Disable the submit button to prevent multiple submissions
        const submitBtn = createHomeForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        try {
            // Make sure user is still authenticated
            if (!firebase.auth().currentUser) {
                console.log("User not authenticated when creating home");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!firebase.auth().currentUser) {
                    throw new Error('You need to be logged in to create a home.');
                }
            }
            
            // Get the current user token
            console.log("Getting token for user:", firebase.auth().currentUser.uid);
            const token = await firebase.auth().currentUser.getIdToken(true);
            console.log("Token received, length:", token.length);
            
            // Collect member data
            const members = [];
            const memberInputs = document.querySelectorAll('[id^="member-name-"]');
            memberInputs.forEach(input => {
                const index = input.id.split('-').pop();
                const nameInput = document.getElementById(`member-name-${index}`);
                const emailInput = document.getElementById(`member-email-${index}`);
                
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                
                if (name && email) {
                    members.push({ name, email });
                }
            });
            
            console.log("Sending create home request with", members.length, "members");
            
            // Send the request to create a home
            const response = await fetch('/api/homes/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: homeName,
                    members: members
                })
            });
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                let errorMessage = 'Failed to create home';
                try {
                    const data = await response.json();
                    errorMessage = data.message || errorMessage;
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    // Try to get the text response if JSON parsing fails
                    const textResponse = await response.text();
                    console.error('Error response text:', textResponse);
                    if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html>')) {
                        errorMessage = 'Server error. Please try again later.';
                    }
                }
                throw new Error(errorMessage);
            }
            
            // Get the response data
            let data;
            try {
                data = await response.json();
                console.log("Success response:", data);
            } catch (jsonError) {
                console.error('Error parsing success response:', jsonError);
                throw new Error('Invalid response from server');
            }
            
            showAlert('Home created successfully!', 'success');
            
            // Store home ID and redirect to home page
            localStorage.setItem('currentHomeId', data.homeId);
            
            // Redirect to select-home page instead of dashboard
            setTimeout(() => {
                window.location.href = 'select-home.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error creating home:', error);
            showAlert(error.message || 'Failed to create home', 'error');
            
            // Re-enable the submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Join Home form submission
    const joinHomeForm = document.getElementById('join-home');
    
    joinHomeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const homeIdInput = document.getElementById('home-id');
        const homeId = homeIdInput.value.trim().toUpperCase();
        
        if (!homeId) {
            showAlert('Please enter a home ID', 'error');
            return;
        }
        
        // Disable the submit button to prevent multiple submissions
        const submitBtn = joinHomeForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
        
        try {
            // Make sure user is still authenticated
            if (!firebase.auth().currentUser) {
                console.log("User not authenticated when joining home");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!firebase.auth().currentUser) {
                    throw new Error('You need to be logged in to join a home.');
                }
            }
            
            // Get the current user token
            console.log("Getting token for user:", firebase.auth().currentUser.uid);
            const token = await firebase.auth().currentUser.getIdToken(true);
            console.log("Token received, length:", token.length);
            
            console.log("Sending join home request for home ID:", homeId);
            
            // Send the request to join a home
            const response = await fetch('/api/homes/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    homeId: homeId
                })
            });
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                let errorMessage = 'Failed to join home';
                try {
                    const data = await response.json();
                    errorMessage = data.message || errorMessage;
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    // Try to get the text response if JSON parsing fails
                    const textResponse = await response.text();
                    console.error('Error response text:', textResponse);
                    if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html>')) {
                        errorMessage = 'Server error. Please try again later.';
                    }
                }
                throw new Error(errorMessage);
            }
            
            let responseData;
            try {
                responseData = await response.json();
                console.log('Join home response:', responseData);
            } catch (jsonError) {
                console.error('Error parsing success response:', jsonError);
                // If we can't parse the JSON but the response was OK, we'll continue
            }
            
            showAlert('Successfully joined the home!', 'success');
            
            // Store home ID and redirect to dashboard
            localStorage.setItem('currentHomeId', homeId);
            
            // Redirect to select-home page instead of dashboard
            setTimeout(() => {
                window.location.href = 'select-home.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error joining home:', error);
            showAlert(error.message || 'Failed to join home', 'error');
            
            // Re-enable the submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// Show alert message with improved mobile visibility
function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Mobile-friendly styling
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '10px';
    alertDiv.style.left = '10px';
    alertDiv.style.right = '10px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.padding = '12px 15px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    if (type === 'success') {
        alertDiv.style.backgroundColor = '#4CAF50';
        alertDiv.style.color = 'white';
    } else if (type === 'error') {
        alertDiv.style.backgroundColor = '#f44336';
        alertDiv.style.color = 'white';
    }
    
    // Add alert to the page
    document.body.appendChild(alertDiv);
    
    // Remove alert after 3 seconds
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 3000);
}