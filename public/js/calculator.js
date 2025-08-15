// Advanced Calculator for Cleaning Services
class AdvancedCalculator {
    constructor() {
        this.baseAddress = "1650 Woodbourn St, Philadelphia, PA";
        this.gasPrice = 4.00; // $/gallon
        this.vehicleMPG = 23; // Audi SUV average MPG
        this.freeDistanceMiles = 5; // First 5 miles free
        this.laborRate = 25; // $/hour
        this.initializeCalculator();
    }

    initializeCalculator() {
        this.loadServices();
        this.setupEventListeners();
        this.initializeGoogleMaps();
    }

    async loadServices() {
        try {
            const response = await fetch('/api/services');
            this.services = await response.json();
            this.populateServiceSelect();
        } catch (error) {
            console.error('Error loading services:', error);
            showNotification('Error loading services', 'error');
        }
    }

    populateServiceSelect() {
        const serviceSelect = document.getElementById('service-select');
        if (!serviceSelect) return;

        serviceSelect.innerHTML = '<option value="">Select a service...</option>';

        this.services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name.en;
            option.setAttribute('data-calculation-type', service.calculationType);
            option.setAttribute('data-unit', service.unit);
            serviceSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        const form = document.getElementById('calculator-form');
        const serviceSelect = document.getElementById('service-select');
        const calculateBtn = document.getElementById('calculate-btn');
        const addressInput = document.getElementById('customer-address');

        if (serviceSelect) {
            serviceSelect.addEventListener('change', () => this.onServiceChange());
        }

        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateQuote();
            });
        }

        if (addressInput) {
            addressInput.addEventListener('blur', () => this.calculateDistance());
        }
    }

    onServiceChange() {
        const serviceSelect = document.getElementById('service-select');
        const selectedOption = serviceSelect.selectedOptions[0];

        if (!selectedOption || !selectedOption.value) {
            this.hideQuantityInputs();
            return;
        }

        const calculationType = selectedOption.getAttribute('data-calculation-type');
        const unit = selectedOption.getAttribute('data-unit');

        this.showQuantityInputs(calculationType, unit);
    }

    showQuantityInputs(calculationType, unit) {
        const quantityContainer = document.getElementById('quantity-container');
        if (!quantityContainer) return;

        let html = '';

        switch (calculationType) {
            case 'quantity':
                html = `
                    <div class="input-group">
                        <label for="quantity">Number of ${unit}s:</label>
                        <input type="number" id="quantity" min="1" max="100" required>
                        <span class="unit-label">${unit}s</span>
                    </div>
                `;
                break;

            case 'area':
                html = `
                    <div class="input-group">
                        <label for="area">Area to clean:</label>
                        <input type="number" id="area" min="1" max="10000" step="0.1" required>
                        <span class="unit-label">square feet</span>
                    </div>
                `;
                break;

            case 'time':
                html = `
                    <div class="input-group">
                        <label for="hours">Estimated hours:</label>
                        <input type="number" id="hours" min="0.5" max="12" step="0.5" required>
                        <span class="unit-label">hours</span>
                    </div>
                `;
                break;
        }

        quantityContainer.innerHTML = html;
        quantityContainer.style.display = 'block';
    }

    hideQuantityInputs() {
        const quantityContainer = document.getElementById('quantity-container');
        if (quantityContainer) {
            quantityContainer.style.display = 'none';
        }
    }

    async initializeGoogleMaps() {
        // Initialize Google Maps API for distance calculation
        if (typeof google !== 'undefined' && google.maps) {
            this.directionsService = new google.maps.DirectionsService();
        }
    }

    async calculateDistance() {
        const addressInput = document.getElementById('customer-address');
        if (!addressInput || !addressInput.value.trim()) return 0;

        const customerAddress = addressInput.value.trim();

        try {
            // Using a geocoding service or direct calculation
            const distance = await this.getDistanceBetweenAddresses(this.baseAddress, customerAddress);

            document.getElementById('calculated-distance').textContent = `${distance.toFixed(1)} miles`;
            this.lastCalculatedDistance = distance; // Store for payment data
            return distance;
        } catch (error) {
            console.error('Error calculating distance:', error);
            return 0;
        }
    } async getDistanceBetweenAddresses(origin, destination) {
        // Simplified distance calculation - in production, use Google Maps Distance Matrix API
        // For now, using approximate calculation
        return new Promise((resolve) => {
            // This is a placeholder - implement actual distance calculation
            const mockDistance = Math.random() * 20 + 1; // Random distance 1-21 miles
            setTimeout(() => resolve(mockDistance), 500);
        });
    }

    calculateTravelCost(distanceMiles) {
        if (distanceMiles <= this.freeDistanceMiles) {
            return 0;
        }

        const chargeMiles = distanceMiles - this.freeDistanceMiles;
        const gallonsUsed = (chargeMiles * 2) / this.vehicleMPG; // Round trip
        const gasCost = gallonsUsed * this.gasPrice;

        // Add small markup for vehicle wear and time
        const travelCost = gasCost * 1.5;

        return Math.round(travelCost * 100) / 100; // Round to 2 decimal places
    }

    async calculateQuote() {
        const serviceSelect = document.getElementById('service-select');
        const selectedServiceId = serviceSelect.value;

        if (!selectedServiceId) {
            showNotification('Please select a service', 'error');
            return;
        }

        const service = this.services.find(s => s.id === selectedServiceId);
        if (!service) {
            showNotification('Service not found', 'error');
            return;
        }

        let serviceCost = 0;
        let details = '';

        // Calculate service cost based on type
        switch (service.calculationType) {
            case 'quantity':
                const quantity = parseInt(document.getElementById('quantity').value) || 0;
                serviceCost = service.price * quantity;
                details = `${quantity} ${service.unit}${quantity !== 1 ? 's' : ''} × $${service.price} = $${serviceCost}`;
                break;

            case 'area':
                const area = parseFloat(document.getElementById('area').value) || 0;
                serviceCost = service.price * area;
                details = `${area} sqft × $${service.price}/sqft = $${serviceCost}`;
                break;

            case 'time':
                const hours = parseFloat(document.getElementById('hours').value) || 0;
                serviceCost = this.laborRate * hours;
                details = `${hours} hours × $${this.laborRate}/hour = $${serviceCost}`;
                break;

            default:
                serviceCost = service.price;
                details = `Fixed price: $${serviceCost}`;
        }

        // Calculate travel cost
        const distance = await this.calculateDistance();
        const travelCost = this.calculateTravelCost(distance);

        // Calculate total
        const subtotal = serviceCost + travelCost;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + tax;

        // Display results
        this.displayQuoteResults({
            service: service.name.en,
            serviceCost,
            details,
            distance,
            travelCost,
            subtotal,
            tax,
            total
        });
    }

    displayQuoteResults(quote) {
        const resultsContainer = document.getElementById('quote-results');
        if (!resultsContainer) return;

        const html = `
            <div class="quote-summary">
                <h3>Quote Summary</h3>
                
                <div class="quote-line">
                    <span class="service-name">${quote.service}</span>
                    <span class="service-cost">$${quote.serviceCost.toFixed(2)}</span>
                </div>
                <div class="quote-details">${quote.details}</div>
                
                ${quote.travelCost > 0 ? `
                    <div class="quote-line">
                        <span>Travel Cost (${quote.distance.toFixed(1)} mi)</span>
                        <span>$${quote.travelCost.toFixed(2)}</span>
                    </div>
                    <div class="quote-note">*First 5 miles free</div>
                ` : `
                    <div class="quote-line">
                        <span>Travel Cost (${quote.distance.toFixed(1)} mi)</span>
                        <span class="free">FREE</span>
                    </div>
                `}
                
                <div class="quote-line subtotal">
                    <span>Subtotal</span>
                    <span>$${quote.subtotal.toFixed(2)}</span>
                </div>
                
                <div class="quote-line">
                    <span>Tax (8%)</span>
                    <span>$${quote.tax.toFixed(2)}</span>
                </div>
                
                <div class="quote-line total">
                    <span>Total</span>
                    <span>$${quote.total.toFixed(2)}</span>
                </div>
                
                <div class="quote-actions">
                    <button type="button" class="btn btn-primary" onclick="calculator.proceedToPayment()">
                        Proceed to Payment
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="calculator.requestService()">
                        Request This Service
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="calculator.resetCalculator()">
                        Calculate Another
                    </button>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';

        // Smooth scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async requestService() {
        const serviceSelect = document.getElementById('service-select');
        const addressInput = document.getElementById('customer-address');
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');
        const emailInput = document.getElementById('customer-email');

        const requestData = {
            service: serviceSelect.value,
            customerName: nameInput?.value || '',
            customerPhone: phoneInput?.value || '',
            customerEmail: emailInput?.value || '',
            customerAddress: addressInput?.value || '',
            quoteSummary: document.querySelector('.quote-summary').outerHTML
        };

        try {
            const response = await fetch('/api/request-service', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                showNotification('Service request submitted successfully!', 'success');
                this.resetCalculator();
            } else {
                showNotification('Error submitting request. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting service request:', error);
            showNotification('Error submitting request. Please try again.', 'error');
        }
    }

    proceedToPayment() {
        // Get current quote data
        const quoteData = this.getCurrentQuoteData();

        if (!quoteData) {
            showNotification('Please calculate a quote first', 'error');
            return;
        }

        // Store payment data
        localStorage.setItem('shiningstar_payment_data', JSON.stringify(quoteData));

        // Redirect to payment page
        window.location.href = '/payment';
    }

    getCurrentQuoteData() {
        const summaryElement = document.querySelector('.quote-summary');
        if (!summaryElement) return null;

        const serviceSelect = document.getElementById('service-select');
        const addressInput = document.getElementById('customer-address');

        // Extract data from the quote summary
        const serviceName = summaryElement.querySelector('.service-name')?.textContent || '';
        const serviceCostText = summaryElement.querySelector('.service-cost')?.textContent || '$0';
        const serviceCost = parseFloat(serviceCostText.replace('$', '')) || 0;

        const travelCostElement = summaryElement.querySelector('.quote-line:nth-child(3) span:last-child');
        const travelCostText = travelCostElement?.textContent || '$0';
        const travelCost = travelCostText === 'FREE' ? 0 : parseFloat(travelCostText.replace('$', '')) || 0;

        const subtotalText = summaryElement.querySelector('.subtotal span:last-child')?.textContent || '$0';
        const subtotal = parseFloat(subtotalText.replace('$', '')) || 0;

        const taxText = summaryElement.querySelector('.quote-line:nth-last-child(2) span:last-child')?.textContent || '$0';
        const tax = parseFloat(taxText.replace('$', '')) || 0;

        const totalText = summaryElement.querySelector('.total span:last-child')?.textContent || '$0';
        const total = parseFloat(totalText.replace('$', '')) || 0;

        const detailsElement = summaryElement.querySelector('.quote-details');
        const details = detailsElement?.textContent || '';

        return {
            service: serviceName,
            serviceCost,
            travelCost,
            subtotal,
            tax,
            total,
            details,
            address: addressInput?.value || '',
            distance: this.lastCalculatedDistance || 0,
            services: [{
                name: serviceName,
                description: details,
                rate: serviceCost,
                total: serviceCost
            }]
        };
    }

    resetCalculator() {
        document.getElementById('calculator-form').reset();
        this.hideQuantityInputs();

        const resultsContainer = document.getElementById('quote-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }

        const distanceDisplay = document.getElementById('calculated-distance');
        if (distanceDisplay) {
            distanceDisplay.textContent = '';
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('calculator-form')) {
        window.calculator = new AdvancedCalculator();
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedCalculator;
}
