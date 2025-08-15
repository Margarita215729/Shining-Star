// Contact page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const urlParams = new URLSearchParams(window.location.search);
    
    // Pre-fill form based on URL parameters
    prefillForm();
    
    function prefillForm() {
        // Pre-fill from package selection
        const selectedPackage = urlParams.get('package');
        const selectedPrice = urlParams.get('price');
        const selectedServices = urlParams.get('services');
        const customPackage = urlParams.get('customPackage');
        
        const messageField = document.getElementById('message');
        
        if (selectedPackage && selectedPrice) {
            messageField.value = `I'm interested in the "${selectedPackage}" package (${selectedPrice}). Please provide more information and schedule a consultation.`;
        } else if (selectedServices) {
            const serviceIds = selectedServices.split(',');
            const total = urlParams.get('total');
            
            // Check corresponding service checkboxes
            serviceIds.forEach(serviceId => {
                const checkbox = document.querySelector(`input[name="services"][value="${serviceId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            messageField.value = `I'm interested in the selected services${total ? ` with a total of ${total}` : ''}. Please provide more information and schedule a consultation.`;
        } else if (customPackage) {
            try {
                const packageData = JSON.parse(decodeURIComponent(customPackage));
                messageField.value = `I'm interested in a custom package with a total of $${packageData.total.toFixed(2)} (subtotal: $${packageData.subtotal.toFixed(2)}, discount: $${packageData.discount.toFixed(2)}). Services: ${packageData.services}. Please contact me to discuss this custom package.`;
            } catch (e) {
                console.error('Error parsing custom package data:', e);
            }
        }
    }
    
    // Form validation and submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button to prevent double submission
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Collect form data
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            services: formData.getAll('services'),
            message: formData.get('message')
        };
        
        // Basic validation
        if (!data.name || !data.email || !data.message) {
            showNotification('Please fill in all required fields.', 'error');
            resetSubmitButton(submitBtn, originalText);
            return;
        }
        
        if (!isValidEmail(data.email)) {
            showNotification('Please enter a valid email address.', 'error');
            resetSubmitButton(submitBtn, originalText);
            return;
        }
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification(result.message || 'Thank you! We\'ll get back to you soon.', 'success');
                this.reset();
                
                // Remove URL parameters after successful submission
                if (window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else {
                showNotification(result.message || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            showNotification('Error sending message. Please try again or call us directly.', 'error');
        } finally {
            resetSubmitButton(submitBtn, originalText);
        }
    });
    
    function resetSubmitButton(button, originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 7 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 7000);
        
        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
        
        // Scroll to top to make notification visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('h4');
        const answer = item.querySelector('p');
        
        // Initially hide all answers
        answer.style.display = 'none';
        question.style.cursor = 'pointer';
        question.style.position = 'relative';
        
        // Add expand/collapse icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-plus faq-icon';
        icon.style.position = 'absolute';
        icon.style.right = '0';
        icon.style.top = '50%';
        icon.style.transform = 'translateY(-50%)';
        icon.style.color = '#667eea';
        question.appendChild(icon);
        
        question.addEventListener('click', function() {
            const isOpen = answer.style.display !== 'none';
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                const otherAnswer = otherItem.querySelector('p');
                const otherIcon = otherItem.querySelector('.faq-icon');
                if (otherItem !== item) {
                    otherAnswer.style.display = 'none';
                    otherIcon.className = 'fas fa-plus faq-icon';
                }
            });
            
            // Toggle current item
            if (isOpen) {
                answer.style.display = 'none';
                icon.className = 'fas fa-plus faq-icon';
            } else {
                answer.style.display = 'block';
                icon.className = 'fas fa-minus faq-icon';
            }
        });
    });
    
    // Service selection counter
    const serviceCheckboxes = document.querySelectorAll('input[name="services"]');
    let selectedCount = 0;
    
    function updateServiceSelection() {
        selectedCount = Array.from(serviceCheckboxes).filter(cb => cb.checked).length;
        
        // Add visual feedback for service selection
        if (selectedCount > 0) {
            const servicesSection = document.querySelector('.services-selection');
            servicesSection.style.borderLeft = '4px solid #667eea';
            servicesSection.style.paddingLeft = '15px';
        } else {
            const servicesSection = document.querySelector('.services-selection');
            servicesSection.style.borderLeft = 'none';
            servicesSection.style.paddingLeft = '0';
        }
    }
    
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateServiceSelection);
    });
    
    // Initialize service selection display
    updateServiceSelection();
    
    // Form field validation feedback
    const requiredFields = document.querySelectorAll('input[required], textarea[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            } else {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 0.2rem rgba(40, 167, 69, 0.25)';
            }
        });
        
        field.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 0.2rem rgba(40, 167, 69, 0.25)';
            }
        });
    });
    
    // Email field specific validation
    const emailField = document.getElementById('email');
    emailField.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            this.style.borderColor = '#dc3545';
            this.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            
            // Show inline error message
            let errorMsg = this.parentNode.querySelector('.error-message');
            if (!errorMsg) {
                errorMsg = document.createElement('small');
                errorMsg.className = 'error-message';
                errorMsg.style.color = '#dc3545';
                errorMsg.style.fontSize = '0.875rem';
                errorMsg.style.marginTop = '0.25rem';
                errorMsg.style.display = 'block';
                this.parentNode.appendChild(errorMsg);
            }
            errorMsg.textContent = 'Please enter a valid email address';
        } else {
            // Remove error message
            const errorMsg = this.parentNode.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    });
});