// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDJme3UanLUE3H2D3QY7xXaG_Xlbii1JL8",
    authDomain: "easy-chore-project.firebaseapp.com",
    projectId: "easy-chore-project",
    storageBucket: "easy-chore-project.firebasestorage.app",
    messagingSenderId: "444941357579",
    appId: "1:444941357579:web:1867f23936ded8700b2d0e"
};

// Initialize Firebase immediately
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    } else {
        console.log("Firebase already initialized");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Set a flag to indicate Firebase is ready
window.firebaseReady = true;

// Make sure loading state is hidden when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        setTimeout(() => {
            loadingState.classList.add('hidden');
        }, 1000); // Give a small delay to ensure everything is loaded
    }
}); 