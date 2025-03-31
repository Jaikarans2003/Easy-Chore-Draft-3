// Mobile form enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Detect if user is on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || (window.innerWidth <= 768);
    
    if (!isMobile) return;
    
    // Find all forms on the page
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        enhanceFormForMobile(form);
    });
    
    // Add to any dynamically added forms in the future
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'FORM') {
                        enhanceFormForMobile(node);
                    } else if (node.querySelectorAll) {
                        const forms = node.querySelectorAll('form');
                        forms.forEach(form => enhanceFormForMobile(form));
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
});

function enhanceFormForMobile(form) {
    // Improve form submission for mobile
    form.addEventListener('submit', function(event) {
        // Blur active input to hide keyboard before form submission
        if (document.activeElement && document.activeElement.tagName !== 'BODY') {
            document.activeElement.blur();
        }
    });
    
    // Add better input handling for mobile
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Make sure numeric inputs use numeric keyboard
        if (input.type === 'number') {
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('pattern', '[0-9]*');
        }
        
        // Make telephone inputs use telephone keypad
        if (input.type === 'tel') {
            input.setAttribute('inputmode', 'tel');
        }
        
        // Make email inputs use email keyboard
        if (input.type === 'email') {
            input.setAttribute('inputmode', 'email');
        }
        
        // Enhance date inputs
        if (input.type === 'date') {
            enhanceDateInput(input);
        }
        
        // Add clear button for text inputs
        if (input.type === 'text' || input.type === 'search' || input.type === 'email') {
            addClearButton(input);
        }
        
        // Improve scrolling when input gets focus
        input.addEventListener('focus', function() {
            // Ensure input is visible when keyboard appears
            setTimeout(() => {
                const rect = this.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                if (rect.bottom > windowHeight * 0.8) {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
    });
    
    // Improve select elements on mobile
    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
        enhanceSelectForMobile(select);
    });
}

function enhanceDateInput(input) {
    // Check if native date input is supported
    const isDateSupported = function() {
        const input = document.createElement('input');
        input.setAttribute('type', 'date');
        const notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue);
        return input.value !== notADateValue;
    }();
    
    // If date input is not supported well (some older browsers)
    if (!isDateSupported) {
        // Convert to text input with pattern
        input.type = 'text';
        input.placeholder = 'YYYY-MM-DD';
        input.pattern = '[0-9]{4}-[0-9]{2}-[0-9]{2}';
        
        // Add calendar icon
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-date-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-calendar-alt mobile-date-icon';
        wrapper.appendChild(icon);
        
        // Style the wrapper
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        
        // Style the icon
        icon.style.position = 'absolute';
        icon.style.right = '10px';
        icon.style.top = '50%';
        icon.style.transform = 'translateY(-50%)';
        icon.style.color = '#777';
        icon.style.pointerEvents = 'none';
    }
}

function enhanceSelectForMobile(select) {
    // Add an indicator icon
    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-select-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-chevron-down mobile-select-icon';
    wrapper.appendChild(icon);
    
    // Style the wrapper
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    // Ensure select takes full width
    select.style.width = '100%';
    select.style.appearance = 'none';
    select.style.webkitAppearance = 'none';
    select.style.paddingRight = '30px';
    
    // Style the icon
    icon.style.position = 'absolute';
    icon.style.right = '10px';
    icon.style.top = '50%';
    icon.style.transform = 'translateY(-50%)';
    icon.style.color = '#777';
    icon.style.pointerEvents = 'none';
}

function addClearButton(input) {
    // Only add if not already added
    if (input.parentNode.querySelector('.mobile-clear-button')) return;
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-input-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    
    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'mobile-clear-button';
    clearButton.innerHTML = '&times;';
    clearButton.style.display = 'none'; // Hide initially
    wrapper.appendChild(clearButton);
    
    // Style the wrapper
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    // Style the clear button
    clearButton.style.position = 'absolute';
    clearButton.style.right = '10px';
    clearButton.style.top = '50%';
    clearButton.style.transform = 'translateY(-50%)';
    clearButton.style.background = 'none';
    clearButton.style.border = 'none';
    clearButton.style.color = '#777';
    clearButton.style.fontSize = '18px';
    clearButton.style.cursor = 'pointer';
    clearButton.style.padding = '0 5px';
    
    // Show/hide clear button based on input content
    input.addEventListener('input', function() {
        clearButton.style.display = this.value ? 'block' : 'none';
    });
    
    // Clear the input on button click
    clearButton.addEventListener('click', function() {
        input.value = '';
        clearButton.style.display = 'none';
        input.focus();
    });
}

// form-mobile-enhancements.js - Improving form interactions on mobile devices

document.addEventListener('DOMContentLoaded', function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Applying mobile form enhancements');
        enhanceFormInputs();
        preventZoomOnFocus();
        enhanceSubmitButtons();
        
        // Special handling for create/join home forms
        if (document.getElementById('create-home') || document.getElementById('join-home')) {
            enhanceCreateJoinForms();
        }
    }
});

// Enhance form inputs for better mobile interaction
function enhanceFormInputs() {
    // Make inputs more touch-friendly
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        // Increase touch target size
        input.style.minHeight = '44px';
        input.style.fontSize = '16px'; // Prevent iOS zoom
        
        // Add focus/blur visual feedback
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.5)';
        });
        
        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });
    });
    
    // Make labels more visible
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
        label.style.fontSize = '16px';
        label.style.fontWeight = 'bold';
        label.style.marginBottom = '8px';
        label.style.display = 'block';
    });
}

// Prevent automatic zoom on input focus on iOS
function preventZoomOnFocus() {
    // Add meta tag to prevent zooming
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    
    // Set font size to prevent iOS zoom on input focus
    const inputFields = document.querySelectorAll('input, select, textarea');
    inputFields.forEach(field => {
        field.style.fontSize = '16px';
    });
}

// Enhance submit buttons for better mobile feedback
function enhanceSubmitButtons() {
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], .form-actions .btn');
    
    submitButtons.forEach(button => {
        // Make buttons larger for better touch targets
        button.style.minHeight = '48px';
        button.style.padding = '12px 20px';
        button.style.fontSize = '16px';
        
        // Add touch feedback
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.opacity = '0.9';
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        }, { passive: true });
    });
}

// Specific enhancements for create/join home forms
function enhanceCreateJoinForms() {
    // Handle create home form
    const createHomeForm = document.getElementById('create-home');
    if (createHomeForm) {
        // Ensure proper button handling
        const createHomeSubmit = createHomeForm.querySelector('button[type="submit"]');
        if (createHomeSubmit) {
            createHomeSubmit.addEventListener('touchstart', function(e) {
                // Provide immediate visual feedback
                this.classList.add('touch-active');
            }, { passive: true });
            
            // Fix form submission on mobile
            createHomeForm.addEventListener('submit', function(e) {
                console.log('Form submission triggered');
                
                // Get form data - we don't prevent default here to allow normal submission
                const formData = new FormData(this);
                console.log('Form data collected for debugging');
                
                // Log submission attempt for debugging
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }
            });
        }
    }
    
    // Handle join home form
    const joinHomeForm = document.getElementById('join-home');
    if (joinHomeForm) {
        // Ensure proper button handling
        const joinHomeSubmit = joinHomeForm.querySelector('button[type="submit"]');
        if (joinHomeSubmit) {
            joinHomeSubmit.addEventListener('touchstart', function(e) {
                // Provide immediate visual feedback
                this.classList.add('touch-active');
            }, { passive: true });
            
            // Fix form submission on mobile
            joinHomeForm.addEventListener('submit', function(e) {
                console.log('Join form submission triggered');
                
                // Get form data - we don't prevent default here to allow normal submission
                const formData = new FormData(this);
                console.log('Form data collected for debugging');
                
                // Log submission attempt for debugging
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }
            });
        }
    }
    
    // Enhance back buttons
    const backButtons = document.querySelectorAll('.btn-back');
    backButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            this.classList.add('touch-active');
        }, { passive: true });
        
        button.addEventListener('touchend', function(e) {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
} 