// Services page functionality for Shining Star Cleaning Services

document.addEventListener('DOMContentLoaded', function () {
    // Initialize service selection
    initServiceSelection();

    // Initialize quote calculation
    initQuoteCalculation();

    // Initialize quote modal
    initQuoteModal();

    // Initialize quote form
    initQuoteForm();

    // Initialize form validation
    initFormValidation();
});

let selectedServices = [];
let selectedPackages = [];
let currentQuote = null;

// Service Selection
function initServiceSelection() {
    // Individual services
    const serviceCards = document.querySelectorAll('.service-card.selectable');
    serviceCards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                toggleServiceSelection(card, this.checked);
            });

            // Also allow clicking on the card to toggle
            card.addEventListener('click', function (e) {
                if (e.target.type !== 'checkbox') {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        }
    });

    // Package selection
    const packageCards = document.querySelectorAll('.package-card.selectable');
    packageCards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                togglePackageSelection(card, this.checked);
            });

            // Also allow clicking on the card to toggle
            card.addEventListener('click', function (e) {
                if (e.target.type !== 'checkbox') {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        }
    });
}

function toggleServiceSelection(card, isSelected) {
    const serviceId = card.dataset.serviceId;
    const price = parseFloat(card.dataset.price);
    const duration = parseInt(card.dataset.duration);

    if (isSelected) {
        card.classList.add('selected');
        selectedServices.push({
            id: serviceId,
            name: card.querySelector('.service-title').textContent,
            price: price,
            duration: duration
        });
    } else {
        card.classList.remove('selected');
        selectedServices = selectedServices.filter(service => service.id !== serviceId);
    }

    updateQuoteSummary();
}

function togglePackageSelection(card, isSelected) {
    const packageId = card.dataset.packageId;
    const price = parseFloat(card.dataset.price);
    const duration = parseInt(card.dataset.duration);

    if (isSelected) {
        card.classList.add('selected');
        selectedPackages.push({
            id: packageId,
            name: card.querySelector('.package-title').textContent,
            price: price,
            duration: duration
        });
    } else {
        card.classList.remove('selected');
        selectedPackages = selectedPackages.filter(pkg => pkg.id !== packageId);
    }

    updateQuoteSummary();
}

// Quote Calculation
function initQuoteCalculation() {
    updateQuoteSummary();
}

function updateQuoteSummary() {
    const quoteItems = document.getElementById('quote-items');
    const quoteTotal = document.getElementById('quote-total');
    const totalDuration = document.getElementById('total-duration');
    const totalPrice = document.getElementById('total-price');
    const getQuoteBtn = document.getElementById('get-quote-btn');

    // Clear current items
    quoteItems.innerHTML = '';

    let totalCost = 0;
    let totalTime = 0;
    let hasSelections = false;

    // Add selected services
    selectedServices.forEach(service => {
        hasSelections = true;
        totalCost += service.price;
        totalTime += service.duration;

        const item = document.createElement('div');
        item.className = 'quote-item';
        item.innerHTML = `
            <span>${service.name}</span>
            <span>$${service.price}</span>
        `;
        quoteItems.appendChild(item);
    });

    // Add selected packages
    selectedPackages.forEach(package => {
        hasSelections = true;
        totalCost += package.price;
        totalTime += package.duration;

        const item = document.createElement('div');
        item.className = 'quote-item';
        item.innerHTML = `
            <span>${package.name} (Package)</span>
            <span>$${package.price}</span>
        `;
        quoteItems.appendChild(item);
    });

    if (hasSelections) {
        // Show quote details
        quoteTotal.style.display = 'block';
        totalDuration.textContent = totalTime;
        totalPrice.textContent = totalCost.toFixed(2);
        getQuoteBtn.disabled = false;

        // Store current quote for modal
        currentQuote = {
            services: selectedServices,
            packages: selectedPackages,
            totalPrice: totalCost,
            totalDuration: totalTime
        };
    } else {
        // Show no selection message
        quoteItems.innerHTML = '<p class="no-selection">Select services to see your quote</p>';
        quoteTotal.style.display = 'none';
        getQuoteBtn.disabled = true;
        currentQuote = null;
    }
}

// Quote Modal
function initQuoteModal() {
    const getQuoteBtn = document.getElementById('get-quote-btn');
    const quoteModal = document.getElementById('quote-modal');
    const modalClose = quoteModal.querySelector('.modal-close');

    if (getQuoteBtn) {
        getQuoteBtn.addEventListener('click', function () {
            openQuoteModal();
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', function () {
            closeQuoteModal();
        });
    }

    // Close modal when clicking outside
    quoteModal.addEventListener('click', function (e) {
        if (e.target === quoteModal) {
            closeQuoteModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && quoteModal.style.display === 'block') {
            closeQuoteModal();
        }
    });
}

function openQuoteModal() {
    const quoteModal = document.getElementById('quote-modal');
    const modalQuoteItems = document.getElementById('modal-quote-items');
    const modalTotalDuration = document.getElementById('modal-total-duration');
    const modalTotalPrice = document.getElementById('modal-total-price');

    if (!currentQuote) return;

    // Clear and populate modal quote items
    modalQuoteItems.innerHTML = '';

    // Add services
    currentQuote.services.forEach(service => {
        const item = document.createElement('div');
        item.className = 'quote-item';
        item.innerHTML = `
            <span>${service.name}</span>
            <span>$${service.price}</span>
        `;
        modalQuoteItems.appendChild(item);
    });

    // Add packages
    currentQuote.packages.forEach(package => {
        const item = document.createElement('div');
        item.className = 'quote-item';
        item.innerHTML = `
            <span>${package.name} (Package)</span>
            <span>$${package.price}</span>
        `;
        modalQuoteItems.appendChild(item);
    });

    // Update totals
    modalTotalDuration.textContent = currentQuote.totalDuration;
    modalTotalPrice.textContent = currentQuote.totalPrice.toFixed(2);

    // Set minimum date to today
    const dateInput = document.getElementById('quote-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Show modal
    quoteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeQuoteModal() {
    const quoteModal = document.getElementById('quote-modal');
    quoteModal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Reset form
    const form = document.getElementById('quote-form');
    if (form) {
        form.reset();
    }
}

// Quote Form
function initQuoteForm() {
    const quoteForm = document.getElementById('quote-form');

    if (quoteForm) {
        quoteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitQuoteRequest();
        });
    }
}

async function submitQuoteRequest() {
    const form = document.getElementById('quote-form');
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    if (!currentQuote) {
        window.ShiningStarUtils.showNotification(
            'warning',
            'No Services Selected',
            'Please select services before submitting.'
        );
        return;
    }

    // Validate form fields
    const validationErrors = validateQuoteForm(form);
    if (validationErrors.length > 0) {
        window.ShiningStarUtils.showNotification(
            'error',
            'Validation Error',
            validationErrors.join(', ')
        );
        return;
    }

    // Prepare request data
    const requestData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        preferredDate: formData.get('preferredDate'),
        message: formData.get('message'),
        services: currentQuote.services.map(s => s.id),
        packages: currentQuote.packages.map(p => p.id)
    };

    // Show loading state
    window.ShiningStarUtils.setButtonLoading(submitButton, true);

    try {
        const response = await fetch('/api/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (result.success) {
            // Show success notification
            window.ShiningStarUtils.showNotification(
                'success',
                'Request Submitted!',
                `Your service request has been submitted. Request ID: ${result.requestId}`
            );

            // Close modal and reset selections
            closeQuoteModal();
            resetSelections();
        } else {
            window.ShiningStarUtils.showNotification(
                'error',
                'Submission Failed',
                result.error || 'Error submitting request'
            );
        }
    } catch (error) {
        console.error('Quote request error:', error);
        window.ShiningStarUtils.showNotification(
            'error',
            'Connection Error',
            'Error submitting request. Please try again.'
        );
    } finally {
        window.ShiningStarUtils.setButtonLoading(submitButton, false);
    }
}

function resetSelections() {
    // Clear selections
    selectedServices = [];
    selectedPackages = [];
    currentQuote = null;

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Remove selected classes
    const selectedCards = document.querySelectorAll('.selectable.selected');
    selectedCards.forEach(card => {
        card.classList.remove('selected');
    });

    // Update quote summary
    updateQuoteSummary();
}

// Calculate quote via API (alternative method)
async function calculateQuoteAPI() {
    try {
        const response = await fetch('/api/quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                services: selectedServices.map(s => s.id),
                packages: selectedPackages.map(p => p.id)
            })
        });

        const quote = await response.json();
        return quote;
    } catch (error) {
        console.error('Quote calculation error:', error);
        return null;
    }
}

// Export functions for global access
window.ServicesPage = {
    toggleServiceSelection,
    togglePackageSelection,
    updateQuoteSummary,
    openQuoteModal,
    closeQuoteModal,
    resetSelections,
    calculateQuoteAPI
};

// Form Validation
function validateQuoteForm(form) {
    const errors = [];

    // Name validation
    const name = form.querySelector('#quote-name').value.trim();
    if (!name || name.length < 2) {
        errors.push('Name must be at least 2 characters');
    }

    // Email validation
    const email = form.querySelector('#quote-email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Valid email address is required');
    }

    // Phone validation
    const phone = form.querySelector('#quote-phone').value.trim();
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phone || !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Valid phone number is required');
    }

    // Address validation
    const address = form.querySelector('#quote-address').value.trim();
    if (!address || address.length < 10) {
        errors.push('Complete address is required');
    }

    // Date validation
    const preferredDate = form.querySelector('#quote-date').value;
    if (!preferredDate) {
        errors.push('Preferred date is required');
    } else {
        const selectedDate = new Date(preferredDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            errors.push('Preferred date cannot be in the past');
        }
    }

    return errors;
}

// Real-time form validation
function initFormValidation() {
    const form = document.getElementById('quote-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
        case 'name':
            if (!value || value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value || !emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Valid email address is required';
            }
            break;
        case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!value || !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                isValid = false;
                errorMessage = 'Valid phone number is required';
            }
            break;
        case 'address':
            if (!value || value.length < 10) {
                isValid = false;
                errorMessage = 'Complete address is required';
            }
            break;
        case 'preferredDate':
            if (!value) {
                isValid = false;
                errorMessage = 'Preferred date is required';
            } else {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    isValid = false;
                    errorMessage = 'Preferred date cannot be in the past';
                }
            }
            break;
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }

    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);

    field.classList.add('error');
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;

    field.parentNode.appendChild(errorElement);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}