// Mobile Navigation Implementation

// Create the mobile navigation bar dynamically
function initMobileNav() {
    // Only create mobile nav on smaller screens
    if (window.innerWidth > 768) return;

    // Check if mobile nav already exists
    if (document.querySelector('.mobile-nav')) return;

    // Create mobile nav container
    const mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    mobileNav.setAttribute('aria-label', 'Mobile navigation');

    // Define navigation items
    const navItems = [
        { icon: 'fa-home', text: 'Home', url: 'dashboard.html' },
        { icon: 'fa-broom', text: 'Chores', url: 'view-chores.html' },
        { icon: 'fa-receipt', text: 'Expenses', url: 'view-expenses.html' },
        { icon: 'fa-comments', text: 'Chat', url: 'home-chat.html', action: 'navigateToChat()' },
        { icon: 'fa-cog', text: 'Settings', url: 'manage-home.html' }
    ];

    // Create navigation items
    navItems.forEach(item => {
        const navItem = document.createElement('a');
        navItem.className = 'mobile-nav-item';
        
        // Determine if this is the current page
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === item.url) {
            navItem.classList.add('active');
        }
        
        // Handle special case for chat navigation
        if (item.action) {
            navItem.setAttribute('onclick', item.action);
            navItem.href = 'javascript:void(0);';
        } else {
            navItem.href = item.url;
        }
        
        // Create icon
        const icon = document.createElement('i');
        icon.className = `fas ${item.icon}`;
        navItem.appendChild(icon);
        
        // Add text
        const text = document.createElement('span');
        text.textContent = item.text;
        navItem.appendChild(text);
        
        mobileNav.appendChild(navItem);
    });

    // Add to document
    document.body.appendChild(mobileNav);
    
    // Add extra padding to footer if needed
    const footer = document.querySelector('footer');
    if (footer) {
        footer.style.paddingBottom = '70px';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initMobileNav);

// Re-initialize on window resize
window.addEventListener('resize', () => {
    const mobileNav = document.querySelector('.mobile-nav');
    if (window.innerWidth <= 768) {
        if (!mobileNav) initMobileNav();
    } else {
        if (mobileNav) mobileNav.remove();
    }
});

// mobile-nav.js - Mobile navigation enhancement

document.addEventListener('DOMContentLoaded', function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Adding mobile navigation enhancements');
        
        // Only add mobile nav if it doesn't already exist
        if (!document.querySelector('.mobile-nav')) {
            addMobileNavigation();
        }
        
        // Check if we're on the create-join-home page and enhance back navigation
        if (window.location.pathname.includes('create-join-home')) {
            enhanceBackNavigation();
        }
    }
});

// Add mobile-specific bottom navigation
function addMobileNavigation() {
    // Only add if we're on a page that needs it
    if (document.querySelector('.container') && !document.querySelector('.landing-page')) {
        // Create mobile navigation
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        
        // Determine which page we're on
        const currentPath = window.location.pathname;
        
        // Define nav items with active states
        const navItems = [
            { 
                icon: 'fa-home', 
                text: 'Dashboard', 
                href: 'dashboard.html',
                active: currentPath.includes('dashboard')
            },
            { 
                icon: 'fa-tasks', 
                text: 'Chores', 
                href: 'view-chores.html',
                active: currentPath.includes('chore')
            },
            { 
                icon: 'fa-users', 
                text: 'Members', 
                href: 'members.html',
                active: currentPath.includes('member')
            },
            { 
                icon: 'fa-cog', 
                text: 'Settings', 
                href: 'settings.html',
                active: currentPath.includes('settings')
            }
        ];
        
        // Create nav items
        navItems.forEach(item => {
            const navItem = document.createElement('a');
            navItem.className = 'mobile-nav-item' + (item.active ? ' active' : '');
            navItem.href = item.href;
            
            // Create icon
            const icon = document.createElement('i');
            icon.className = 'fas ' + item.icon;
            
            // Create text
            const text = document.createElement('span');
            text.textContent = item.text;
            
            // Add to nav item
            navItem.appendChild(icon);
            navItem.appendChild(text);
            
            // Add touch feedback
            navItem.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            }, { passive: true });
            
            navItem.addEventListener('touchend', function() {
                this.style.opacity = '1';
            }, { passive: true });
            
            // Add to mobile nav
            mobileNav.appendChild(navItem);
        });
        
        // Add to document
        document.body.appendChild(mobileNav);
        
        // Add padding to footer if it exists
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.paddingBottom = '70px';
        }
    }
}

// Enhance back navigation for mobile
function enhanceBackNavigation() {
    // Add back button to header if not exists
    const header = document.querySelector('header');
    if (header && !header.querySelector('.back-button')) {
        // Create back button
        const backButton = document.createElement('button');
        backButton.className = 'btn secondary-btn back-button';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        backButton.style.marginRight = '10px';
        backButton.style.minHeight = '44px';
        
        // Add event listeners
        ['click', 'touchstart'].forEach(eventType => {
            backButton.addEventListener(eventType, function(e) {
                if (eventType === 'touchstart') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.classList.add('touch-active');
                }
                
                // Check if there are forms visible
                const visibleForms = document.querySelectorAll('.form-container[style*="display: block"]');
                if (visibleForms.length > 0) {
                    // Hide forms and show cards
                    visibleForms.forEach(form => form.style.display = 'none');
                    document.querySelector('.option-cards').style.display = 'flex';
                } else {
                    // Go back in history
                    window.history.back();
                }
            }, { passive: false });
        });
        
        // Add to header
        const nav = header.querySelector('nav');
        if (nav) {
            nav.insertBefore(backButton, nav.firstChild);
        } else {
            header.insertBefore(backButton, header.firstChild);
        }
    }
    
    // Override browser back button behavior
    window.addEventListener('popstate', function(e) {
        // Check if there are forms visible
        const visibleForms = document.querySelectorAll('.form-container[style*="display: block"]');
        if (visibleForms.length > 0) {
            // Prevent default navigation
            e.preventDefault();
            history.pushState(null, document.title, window.location.href);
            
            // Hide forms and show cards
            visibleForms.forEach(form => form.style.display = 'none');
            document.querySelector('.option-cards').style.display = 'flex';
        }
    });
} 