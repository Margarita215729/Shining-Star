// Main JavaScript functionality for Shining Star Cleaning Services

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    initMobileNav();
    
    // Initialize language switching
    initLanguageSwitching();
    
    // Initialize contact form
    initContactForm();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize loading states
    initLoadingStates();
});

// Mobile Navigation
function initMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const icon = navToggle.querySelector('.nav-toggle-icon');
            icon.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.querySelector('.nav-toggle-icon').classList.remove('active');
            });
        });
    }
}

// Language Switching
function initLanguageSwitching() {
    const languageSelect = document.getElementById('language-select');
    
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            changeLanguage(selectedLang);
        });
    }
}

function changeLanguage(lang) {
    // Show loading state
    showGlobalLoading();
    
    // Navigate to language route
    window.location.href = `/lang/${lang}`;
}

// Contact Form
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitContactForm();
        });
    }
}

async function submitContactForm() {
    const form = document.getElementById('contact-form');
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Show loading state
    setButtonLoading(submitButton, true);
    
    try {
        const response = await fetch('/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('success-message', result.message);
            form.reset();
        } else {
            showMessage('error-message', result.message || 'Error sending message');
        }
    } catch (error) {
        console.error('Contact form error:', error);
        showMessage('error-message', 'Error sending message. Please try again.');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Smooth Scrolling
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Loading States
function initLoadingStates() {
    // Add loading class to body when navigating
    window.addEventListener('beforeunload', function() {
        document.body.classList.add('loading');
    });
}

function showGlobalLoading() {
    document.body.classList.add('loading');
    
    // Create loading overlay if it doesn't exist
    if (!document.querySelector('.loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-star fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
}

function hideGlobalLoading() {
    document.body.classList.remove('loading');
    
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            ${button.dataset.loadingText || 'Loading...'}
        `;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.textContent;
    }
}

// Message Display
function showMessage(messageId, text) {
    const messagesContainer = document.getElementById('form-messages');
    const messageElement = document.getElementById(messageId);
    
    if (messagesContainer && messageElement) {
        // Update message text
        const messageText = messageElement.querySelector('span');
        if (messageText) {
            messageText.textContent = text;
        }
        
        // Show messages container
        messagesContainer.style.display = 'block';
        
        // Show specific message
        messageElement.style.display = 'flex';
        
        // Hide other messages
        const allMessages = messagesContainer.querySelectorAll('.message');
        allMessages.forEach(msg => {
            if (msg.id !== messageId) {
                msg.style.display = 'none';
            }
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideMessage(messageId);
        }, 5000);
    }
}

function hideMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    const messagesContainer = document.getElementById('form-messages');
    
    if (messageElement) {
        messageElement.style.display = 'none';
    }
    
    // Hide container if no messages are visible
    if (messagesContainer) {
        const visibleMessages = messagesContainer.querySelectorAll('.message[style*="flex"]');
        if (visibleMessages.length === 0) {
            messagesContainer.style.display = 'none';
        }
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format duration
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${remainingMinutes}min`;
        }
    }
}

// Animation helpers
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        element.style.opacity = Math.min(progress / duration, 1);
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
    let start = null;
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        
        element.style.opacity = initialOpacity - (initialOpacity * progress / duration);
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button functionality
window.addEventListener('scroll', function() {
    const scrollButton = document.getElementById('scroll-to-top');
    if (scrollButton) {
        if (window.pageYOffset > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    }
});

// Export functions for use in other scripts
window.ShiningStarUtils = {
    showMessage,
    hideMessage,
    setButtonLoading,
    formatCurrency,
    formatDuration,
    fadeIn,
    fadeOut,
    debounce,
    throttle
};