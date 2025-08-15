// Payment Processing JavaScript
class PaymentHandler {
    constructor() {
        this.paymentData = null;
        this.selectedPaymentMethod = 'card';
        this.initializePaymentForm();
        this.loadOrderData();
    }

    initializePaymentForm() {
        this.setupPaymentMethodSelection();
        this.setupFormValidation();
        this.setupCardFormatting();
        this.setupBillingAddressToggle();
        this.setupFormSubmission();
    }

    setupPaymentMethodSelection() {
        const paymentMethods = document.querySelectorAll('.payment-method');
        const paymentForms = document.querySelectorAll('.payment-method-form');

        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                // Remove active class from all methods
                paymentMethods.forEach(m => m.classList.remove('active'));
                paymentForms.forEach(f => f.classList.remove('active'));

                // Add active class to selected method
                method.classList.add('active');
                this.selectedPaymentMethod = method.dataset.method;

                // Show corresponding form
                const formId = `${this.selectedPaymentMethod}-payment`;
                const form = document.getElementById(formId);
                if (form) {
                    form.classList.add('active');
                }

                this.updatePayButton();
            });
        });
    }

    setupCardFormatting() {
        const cardNumberInput = document.getElementById('card-number');
        const cardExpiryInput = document.getElementById('card-expiry');
        const cardCvcInput = document.getElementById('card-cvc');

        // Format card number
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;

                if (formattedValue.length > 19) {
                    formattedValue = formattedValue.substring(0, 19);
                }

                e.target.value = formattedValue;
                this.validateCardNumber(value.replace(/\s/g, ''));
            });
        }

        // Format expiry date
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
                this.validateExpiry(value);
            });
        }

        // Format CVC
        if (cardCvcInput) {
            cardCvcInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 4);
                this.validateCvc(e.target.value);
            });
        }
    }

    validateCardNumber(number) {
        const cardNumberInput = document.getElementById('card-number');
        const isValid = this.luhnCheck(number) && number.length >= 13;

        this.setFieldValidation(cardNumberInput, isValid);
        return isValid;
    }

    validateExpiry(expiry) {
        const expiryInput = document.getElementById('card-expiry');
        const [month, year] = expiry.split('/');

        if (!month || !year || month.length !== 2 || year.length !== 2) {
            this.setFieldValidation(expiryInput, false);
            return false;
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt('20' + year);
        const currentDate = new Date();
        const expiryDate = new Date(yearNum, monthNum - 1);

        const isValid = monthNum >= 1 && monthNum <= 12 && expiryDate > currentDate;
        this.setFieldValidation(expiryInput, isValid);
        return isValid;
    }

    validateCvc(cvc) {
        const cvcInput = document.getElementById('card-cvc');
        const isValid = cvc.length >= 3;

        this.setFieldValidation(cvcInput, isValid);
        return isValid;
    }

    luhnCheck(cardNumber) {
        let sum = 0;
        let alternate = false;

        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let n = parseInt(cardNumber.charAt(i));

            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }

            sum += n;
            alternate = !alternate;
        }

        return (sum % 10) === 0;
    }

    setFieldValidation(field, isValid) {
        if (isValid) {
            field.classList.remove('error');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('error');
        }
    }

    setupBillingAddressToggle() {
        const checkbox = document.getElementById('same-as-service');
        const billingForm = document.getElementById('billing-address-form');

        if (checkbox && billingForm) {
            checkbox.addEventListener('change', () => {
                billingForm.style.display = checkbox.checked ? 'none' : 'block';
            });
        }
    }

    setupFormValidation() {
        const form = document.getElementById('payment-form');
        const inputs = form.querySelectorAll('input[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(field) {
        const isValid = field.checkValidity() && field.value.trim() !== '';
        this.setFieldValidation(field, isValid);
        return isValid;
    }

    setupFormSubmission() {
        const form = document.getElementById('payment-form');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processPayment();
        });
    }

    async processPayment() {
        const isValid = this.validateAllFields();
        if (!isValid) {
            showNotification('Please fill in all required fields correctly', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Collect form data
            const customerData = this.collectCustomerData();
            const paymentMethodData = this.collectPaymentMethodData();

            // Create payment intent
            const paymentIntent = await this.createPaymentIntent(customerData);

            if (!paymentIntent.success) {
                throw new Error('Failed to create payment intent');
            }

            // Process payment based on selected method
            let paymentResult;
            switch (this.selectedPaymentMethod) {
                case 'card':
                    paymentResult = await this.processCardPayment(paymentIntent, paymentMethodData, customerData);
                    break;
                case 'paypal':
                    paymentResult = await this.processPayPalPayment(paymentIntent, customerData);
                    break;
                case 'apple-pay':
                    paymentResult = await this.processApplePayPayment(paymentIntent, customerData);
                    break;
                default:
                    throw new Error('Invalid payment method');
            }

            if (paymentResult.success) {
                this.showPaymentSuccess(paymentResult);
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }

        } catch (error) {
            console.error('Payment error:', error);
            showNotification(error.message || 'Payment failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateAllFields() {
        const form = document.getElementById('payment-form');
        const requiredFields = form.querySelectorAll('input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Additional validation for card payment
        if (this.selectedPaymentMethod === 'card') {
            const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvc = document.getElementById('card-cvc').value;

            if (!this.validateCardNumber(cardNumber) ||
                !this.validateExpiry(cardExpiry) ||
                !this.validateCvc(cardCvc)) {
                isValid = false;
            }
        }

        return isValid;
    }

    collectCustomerData() {
        return {
            name: document.getElementById('customer-name').value,
            email: document.getElementById('customer-email').value,
            phone: document.getElementById('customer-phone').value,
            address: document.getElementById('customer-address').value,
            billingAddress: this.collectBillingAddress()
        };
    }

    collectBillingAddress() {
        const sameAsService = document.getElementById('same-as-service').checked;

        if (sameAsService) {
            return document.getElementById('customer-address').value;
        } else {
            const address = document.getElementById('billing-address').value;
            const city = document.getElementById('billing-city').value;
            const state = document.getElementById('billing-state').value;
            const zip = document.getElementById('billing-zip').value;

            return `${address}, ${city}, ${state} ${zip}`;
        }
    }

    collectPaymentMethodData() {
        if (this.selectedPaymentMethod === 'card') {
            return {
                type: 'card',
                cardNumber: document.getElementById('card-number').value.replace(/\s/g, ''),
                expiry: document.getElementById('card-expiry').value,
                cvc: document.getElementById('card-cvc').value,
                nameOnCard: document.getElementById('card-name').value
            };
        }

        return { type: this.selectedPaymentMethod };
    }

    async createPaymentIntent(customerData) {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: this.paymentData.total,
                    currency: 'USD',
                    customerData,
                    serviceData: this.paymentData.services
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Payment intent creation error:', error);
            return { success: false, error: 'Failed to create payment intent' };
        }
    }

    async processCardPayment(paymentIntent, paymentMethodData, customerData) {
        try {
            // In production, use Stripe Elements or similar
            const mockPaymentMethodId = `pm_card_${Date.now()}`;

            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentIntentId: paymentIntent.paymentIntentId,
                    paymentMethodId: mockPaymentMethodId,
                    customerData,
                    serviceData: this.paymentData
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Card payment error:', error);
            return { success: false, error: 'Card payment failed' };
        }
    }

    async processPayPalPayment(paymentIntent, customerData) {
        // In production, integrate with PayPal SDK
        try {
            // Mock PayPal payment
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

            return {
                success: true,
                paymentStatus: 'succeeded',
                bookingId: `booking_${Date.now()}`,
                invoice: { invoiceNumber: `INV-${Date.now()}` }
            };
        } catch (error) {
            return { success: false, error: 'PayPal payment failed' };
        }
    }

    async processApplePayPayment(paymentIntent, customerData) {
        // In production, integrate with Apple Pay
        try {
            // Mock Apple Pay payment
            await new Promise(resolve => setTimeout(resolve, 1500));

            return {
                success: true,
                paymentStatus: 'succeeded',
                bookingId: `booking_${Date.now()}`,
                invoice: { invoiceNumber: `INV-${Date.now()}` }
            };
        } catch (error) {
            return { success: false, error: 'Apple Pay payment failed' };
        }
    }

    showPaymentSuccess(paymentResult) {
        const modal = document.getElementById('payment-success-modal');
        const bookingDetails = document.getElementById('booking-details');

        bookingDetails.innerHTML = `
            <div class="booking-info">
                <p><strong>Booking ID:</strong> ${paymentResult.bookingId}</p>
                <p><strong>Invoice:</strong> ${paymentResult.invoice.invoiceNumber}</p>
                <p><strong>Payment Status:</strong> ✅ Paid</p>
                <p><strong>Amount:</strong> $${this.paymentData.total.toFixed(2)}</p>
            </div>
        `;

        // Store invoice number for download
        window.invoiceNumber = paymentResult.invoice.invoiceNumber;

        modal.style.display = 'flex';
    }

    showLoading(show) {
        const loading = document.getElementById('payment-loading');
        loading.style.display = show ? 'flex' : 'none';
    }

    loadOrderData() {
        // Get order data from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const orderData = urlParams.get('data');

        if (orderData) {
            try {
                this.paymentData = JSON.parse(decodeURIComponent(orderData));
                this.displayOrderSummary();
                this.updatePayButton();
            } catch (error) {
                console.error('Error parsing order data:', error);
                // Redirect back if no valid order data
                history.back();
            }
        } else {
            // Try to get from localStorage
            const savedData = localStorage.getItem('shiningstar_payment_data');
            if (savedData) {
                this.paymentData = JSON.parse(savedData);
                this.displayOrderSummary();
                this.updatePayButton();
            } else {
                history.back();
            }
        }
    }

    displayOrderSummary() {
        const orderDetails = document.getElementById('order-details');
        if (!this.paymentData) return;

        const html = `
            <div class="order-summary">
                <div class="service-details">
                    <h4>${this.paymentData.service}</h4>
                    <p>${this.paymentData.details}</p>
                </div>
                
                <div class="cost-breakdown">
                    <div class="cost-line">
                        <span>Service Cost:</span>
                        <span>$${this.paymentData.serviceCost.toFixed(2)}</span>
                    </div>
                    
                    ${this.paymentData.travelCost > 0 ? `
                        <div class="cost-line">
                            <span>Travel Cost:</span>
                            <span>$${this.paymentData.travelCost.toFixed(2)}</span>
                        </div>
                    ` : `
                        <div class="cost-line">
                            <span>Travel Cost:</span>
                            <span class="free">FREE</span>
                        </div>
                    `}
                    
                    <div class="cost-line">
                        <span>Subtotal:</span>
                        <span>$${this.paymentData.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div class="cost-line">
                        <span>Tax (8%):</span>
                        <span>$${this.paymentData.tax.toFixed(2)}</span>
                    </div>
                    
                    <div class="cost-line total">
                        <span>Total:</span>
                        <span>$${this.paymentData.total.toFixed(2)}</span>
                    </div>
                </div>
                
                ${this.paymentData.distance ? `
                    <div class="service-info">
                        <p><strong>Distance:</strong> ${this.paymentData.distance.toFixed(1)} miles from our location</p>
                        <p><strong>Service Address:</strong> ${this.paymentData.address || 'Address from calculator'}</p>
                    </div>
                ` : ''}
            </div>
        `;

        orderDetails.innerHTML = html;
    }

    updatePayButton() {
        const payButton = document.getElementById('pay-button');
        const payButtonText = document.getElementById('pay-button-text');
        const payButtonAmount = document.getElementById('pay-button-amount');

        if (this.paymentData) {
            payButtonAmount.textContent = `$${this.paymentData.total.toFixed(2)}`;
        }

        // Update button text based on payment method
        switch (this.selectedPaymentMethod) {
            case 'card':
                payButtonText.textContent = 'Pay with Card';
                break;
            case 'paypal':
                payButtonText.textContent = 'Pay with PayPal';
                break;
            case 'apple-pay':
                payButtonText.textContent = 'Pay with Apple Pay';
                break;
        }
    }
}

// Download invoice function
function downloadInvoice() {
    if (window.invoiceNumber) {
        window.open(`/api/invoice/${window.invoiceNumber}`, '_blank');
    }
}

// Initialize payment handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.paymentHandler = new PaymentHandler();
});

// Add CSS for validation states
const style = document.createElement('style');
style.textContent = `
    .form-group input.valid {
        border-color: #38a169;
        box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
    }
    
    .form-group input.error {
        border-color: #e53e3e;
        box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
    }
    
    .cost-breakdown {
        border-top: 1px solid #edf2f7;
        padding-top: 1rem;
        margin-top: 1rem;
    }
    
    .cost-line {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f7fafc;
    }
    
    .cost-line.total {
        font-weight: bold;
        font-size: 1.2rem;
        border-top: 2px solid #667eea;
        border-bottom: none;
        padding-top: 1rem;
        margin-top: 0.5rem;
        color: #667eea;
    }
    
    .free {
        color: #38a169;
        font-weight: bold;
    }
    
    .service-info {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #edf2f7;
        font-size: 0.9rem;
        color: #718096;
    }
`;
document.head.appendChild(style);
