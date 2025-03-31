// Mobile Optimizations

// Detect if user is on a mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || (window.innerWidth <= 768);

// Apply mobile-specific optimizations
function applyMobileOptimizations() {
    if (!isMobile) return;
    
    // Lazy load images when they come into view
    lazyLoadImages();
    
    // Defer non-critical scripts
    deferNonCriticalScripts();
    
    // Add touch optimizations
    addTouchOptimizations();
    
    // Handle virtual keyboard adjustments
    handleVirtualKeyboard();
    
    // Optimize scrolling performance
    optimizeScrolling();
}

// Lazy load images
function lazyLoadImages() {
    if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const dataSrc = img.getAttribute('data-src');
                    if (dataSrc) {
                        img.src = dataSrc;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        // Convert all images with data-src to lazy-loaded
        document.querySelectorAll('img[data-src]').forEach(img => {
            imgObserver.observe(img);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
}

// Defer loading of non-critical scripts
function deferNonCriticalScripts() {
    const deferScripts = document.querySelectorAll('script[defer-load]');
    
    if (deferScripts.length > 0) {
        setTimeout(() => {
            deferScripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
                script.remove();
            });
        }, 1000); // Load after 1 second
    }
}

// Add touch optimizations
function addTouchOptimizations() {
    // Prevent 300ms tap delay
    document.documentElement.style.touchAction = 'manipulation';
    
    // Add active states for touch feedback
    document.querySelectorAll('a, button, .dashboard-card, .list-item').forEach(el => {
        el.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        el.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

// Handle virtual keyboard adjustments
function handleVirtualKeyboard() {
    // Fix viewport issues when keyboard appears
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            // Scroll to the input after a short delay to let keyboard appear
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
}

// Optimize scrolling performance
function optimizeScrolling() {
    // Use passive event listeners for scroll events
    let supportsPassive = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: function() {
                supportsPassive = true;
                return true;
            }
        });
        window.addEventListener('testPassive', null, opts);
        window.removeEventListener('testPassive', null, opts);
    } catch (e) {}
    
    const scrollOpt = supportsPassive ? { passive: true } : false;
    
    // Apply passive scroll listeners
    document.addEventListener('scroll', scrollHandler, scrollOpt);
    document.addEventListener('touchmove', scrollHandler, scrollOpt);
    
    // Debounced scroll handler
    let scrollTimeout;
    function scrollHandler() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            // Additional scroll optimizations can go here
        }, 100);
    }
}

// Initialize optimizations
document.addEventListener('DOMContentLoaded', applyMobileOptimizations);

// Add a class to the body for mobile-specific CSS
if (isMobile) {
    document.body.classList.add('mobile-device');
}

// Export for use in other scripts
window.mobileUtils = {
    isMobile,
    lazyLoadImages,
    addTouchOptimizations
};

// mobile-optimizations.js - Enhancing mobile interactions

document.addEventListener('DOMContentLoaded', function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Mobile device detected, applying optimizations');
        
        // Add mobile detection class to body
        document.body.classList.add('mobile-device');
        
        // Fix 300ms tap delay on mobile devices
        if ('touchAction' in document.body.style) {
            document.body.style.touchAction = 'manipulation';
        }
        
        // Improve button touch feedback
        const allButtons = document.querySelectorAll('button, .btn');
        allButtons.forEach(button => {
            // Add touch feedback
            button.addEventListener('touchstart', function(e) {
                this.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', function(e) {
                this.classList.remove('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchcancel', function(e) {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
        
        // Debug touch events if needed
        if (location.search.includes('debug=true')) {
            enableTouchDebugging();
        }
        
        // Handle specific screens
        if (document.querySelector('.option-cards')) {
            enhanceCreateJoinHomeScreen();
        }
    }
});

// Enable visual debugging of touch events
function enableTouchDebugging() {
    const debugElement = document.createElement('div');
    debugElement.id = 'touch-debug';
    debugElement.style.cssText = 'position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:5px;z-index:9999;font-size:12px;';
    document.body.appendChild(debugElement);
    
    const events = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'click'];
    events.forEach(eventType => {
        document.addEventListener(eventType, function(e) {
            const target = e.target.tagName + (e.target.className ? ' .' + e.target.className.split(' ')[0] : '');
            debugElement.textContent = `${eventType} on ${target}`;
            
            // Clear after 2 seconds
            setTimeout(() => { 
                debugElement.textContent = '';
            }, 2000);
        }, { passive: true });
    });
}

// Enhance the create/join home screen specifically
function enhanceCreateJoinHomeScreen() {
    console.log('Enhancing Create/Join Home screen for mobile');
    
    // Direct button handling with proper z-index management
    const createHomeButton = document.getElementById('create-home-button');
    const joinHomeButton = document.getElementById('join-home-button');
    const optionCards = document.querySelector('.option-cards');
    const createHomeForm = document.getElementById('create-home-form');
    const joinHomeForm = document.getElementById('join-home-form');
    
    if (createHomeButton) {
        createHomeButton.style.zIndex = '50';
        createHomeButton.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            console.log('Create home button touch');
            this.classList.add('touch-active');
            setTimeout(() => {
                optionCards.style.display = 'none';
                createHomeForm.style.display = 'block';
            }, 50);
        }, { passive: false });
    }
    
    if (joinHomeButton) {
        joinHomeButton.style.zIndex = '50';
        joinHomeButton.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            console.log('Join home button touch');
            this.classList.add('touch-active');
            setTimeout(() => {
                optionCards.style.display = 'none';
                joinHomeForm.style.display = 'block';
            }, 50);
        }, { passive: false });
    }
    
    // Back buttons enhanced for mobile
    const backButtons = document.querySelectorAll('.btn-back');
    backButtons.forEach(button => {
        button.style.zIndex = '50';
        button.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            console.log('Back button touch');
            this.classList.add('touch-active');
            setTimeout(() => {
                createHomeForm.style.display = 'none';
                joinHomeForm.style.display = 'none';
                optionCards.style.display = 'flex';
            }, 50);
        }, { passive: false });
    });
    
    // Add member button enhancement
    const addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.style.zIndex = '50';
    }
} 