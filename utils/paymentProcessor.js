// Payment Processing System for Shining Star Cleaning Services
// This module handles payment processing integration and PDF invoice generation

const fs = require('fs').promises;
const path = require('path');

class PaymentProcessor {
    constructor() {
        this.paymentProviders = {
            stripe: {
                enabled: false,
                publicKey: process.env.STRIPE_PUBLIC_KEY,
                secretKey: process.env.STRIPE_SECRET_KEY
            },
            paypal: {
                enabled: false,
                clientId: process.env.PAYPAL_CLIENT_ID,
                clientSecret: process.env.PAYPAL_CLIENT_SECRET
            },
            square: {
                enabled: false,
                applicationId: process.env.SQUARE_APPLICATION_ID,
                accessToken: process.env.SQUARE_ACCESS_TOKEN
            }
        };

        this.taxRate = 0.08; // 8% tax rate for Philadelphia
        this.baseAddress = "1650 Woodbourn St, Philadelphia, PA";
    }

    // Create payment intent
    async createPaymentIntent(amount, currency = 'USD', metadata = {}) {
        try {
            // Prepare payment data
            const paymentData = {
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                metadata: {
                    ...metadata,
                    businessName: 'Shining Star Cleaning Services',
                    businessAddress: this.baseAddress,
                    timestamp: new Date().toISOString()
                }
            };

            // In production, integrate with actual payment providers
            // For now, return a mock payment intent
            return {
                id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
                amount: paymentData.amount,
                currency: paymentData.currency,
                status: 'requires_payment_method',
                metadata: paymentData.metadata
            };
        } catch (error) {
            console.error('Payment intent creation error:', error);
            throw new Error('Failed to create payment intent');
        }
    }

    // Process payment
    async processPayment(paymentIntentId, paymentMethodId) {
        try {
            // In production, confirm payment with payment provider
            // For now, simulate payment processing

            const paymentResult = {
                id: paymentIntentId,
                status: 'succeeded',
                amount: 0, // Will be filled from payment intent
                currency: 'usd',
                paymentMethod: paymentMethodId,
                processedAt: new Date().toISOString(),
                fees: 0,
                netAmount: 0
            };

            // Generate invoice after successful payment
            if (paymentResult.status === 'succeeded') {
                await this.generateInvoice(paymentResult);
            }

            return paymentResult;
        } catch (error) {
            console.error('Payment processing error:', error);
            throw new Error('Payment processing failed');
        }
    }

    // Calculate total with tax and fees
    calculateTotal(subtotal, travelCost = 0, discounts = 0) {
        const serviceTotal = subtotal + travelCost - discounts;
        const tax = serviceTotal * this.taxRate;
        const total = serviceTotal + tax;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            travelCost: Math.round(travelCost * 100) / 100,
            discounts: Math.round(discounts * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    }

    // Generate PDF invoice
    async generateInvoice(paymentData, customerData, serviceData) {
        try {
            // For PDF generation, we'll use a simple HTML-to-PDF approach
            // In production, use libraries like puppeteer or jsPDF

            const invoiceData = {
                invoiceNumber: `INV-${Date.now()}`,
                date: new Date().toLocaleDateString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                businessInfo: {
                    name: 'Shining Star Cleaning Services',
                    address: this.baseAddress,
                    phone: '(215) 555-STAR',
                    email: 'info@shiningstar-cleaning.com'
                },
                customerInfo: customerData,
                services: serviceData,
                payment: paymentData,
                totals: this.calculateTotal(
                    serviceData.reduce((sum, service) => sum + service.total, 0),
                    serviceData.travelCost || 0
                )
            };

            // Generate HTML invoice
            const invoiceHTML = this.generateInvoiceHTML(invoiceData);

            // Save invoice (in production, convert to PDF)
            const invoiceDir = path.join(__dirname, '..', 'data', 'invoices');
            await fs.mkdir(invoiceDir, { recursive: true });

            const invoicePath = path.join(invoiceDir, `${invoiceData.invoiceNumber}.html`);
            await fs.writeFile(invoicePath, invoiceHTML);

            return {
                invoiceNumber: invoiceData.invoiceNumber,
                invoicePath,
                downloadUrl: `/api/invoice/${invoiceData.invoiceNumber}`
            };
        } catch (error) {
            console.error('Invoice generation error:', error);
            throw new Error('Failed to generate invoice');
        }
    }

    // Generate invoice HTML template
    generateInvoiceHTML(data) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${data.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 40px;
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
        }
        .business-info h1 {
            color: #667eea;
            margin: 0;
            font-size: 28px;
        }
        .business-info p {
            margin: 5px 0;
            color: #666;
        }
        .invoice-meta {
            text-align: right;
        }
        .invoice-meta h2 {
            color: #333;
            margin: 0;
            font-size: 32px;
        }
        .invoice-meta p {
            margin: 5px 0;
            color: #666;
        }
        .billing-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        .billing-section h3 {
            color: #667eea;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .services-table th,
        .services-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .services-table th {
            background: #f8f9fa;
            color: #333;
            font-weight: 600;
        }
        .services-table tr:hover {
            background: #f8f9fa;
        }
        .totals-section {
            width: 300px;
            margin-left: auto;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
        }
        .totals-table .total-row {
            background: #667eea;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }
        .payment-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .payment-info h3 {
            color: #38a169;
            margin-top: 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
        }
        @media print {
            body { margin: 0; }
            .invoice-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="business-info">
                <h1>⭐ ${data.businessInfo.name}</h1>
                <p>${data.businessInfo.address}</p>
                <p>Phone: ${data.businessInfo.phone}</p>
                <p>Email: ${data.businessInfo.email}</p>
            </div>
            <div class="invoice-meta">
                <h2>INVOICE</h2>
                <p><strong>${data.invoiceNumber}</strong></p>
                <p>Date: ${data.date}</p>
                <p>Due: ${data.dueDate}</p>
            </div>
        </div>

        <div class="billing-info">
            <div class="billing-section">
                <h3>Bill To:</h3>
                <p><strong>${data.customerInfo.name}</strong></p>
                <p>${data.customerInfo.address}</p>
                <p>Phone: ${data.customerInfo.phone}</p>
                ${data.customerInfo.email ? `<p>Email: ${data.customerInfo.email}</p>` : ''}
            </div>
            <div class="billing-section">
                <h3>Service Details:</h3>
                <p>Service Date: ${data.date}</p>
                <p>Payment Status: ${data.payment.status === 'succeeded' ? '✅ Paid' : '⏳ Pending'}</p>
                <p>Payment Method: ${data.payment.paymentMethod || 'N/A'}</p>
            </div>
        </div>

        <table class="services-table">
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th>Quantity/Area</th>
                    <th>Rate</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.services.map(service => `
                    <tr>
                        <td><strong>${service.name}</strong></td>
                        <td>${service.description || ''}</td>
                        <td>${service.quantity || service.area || '1'}</td>
                        <td>$${service.rate.toFixed(2)}</td>
                        <td>$${service.total.toFixed(2)}</td>
                    </tr>
                `).join('')}
                ${data.totals.travelCost > 0 ? `
                    <tr>
                        <td><strong>Travel Cost</strong></td>
                        <td>Distance: ${data.serviceData?.distance || 'N/A'} miles</td>
                        <td>1</td>
                        <td>$${data.totals.travelCost.toFixed(2)}</td>
                        <td>$${data.totals.travelCost.toFixed(2)}</td>
                    </tr>
                ` : ''}
            </tbody>
        </table>

        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td>$${data.totals.subtotal.toFixed(2)}</td>
                </tr>
                ${data.totals.travelCost > 0 ? `
                    <tr>
                        <td>Travel Cost:</td>
                        <td>$${data.totals.travelCost.toFixed(2)}</td>
                    </tr>
                ` : ''}
                ${data.totals.discounts > 0 ? `
                    <tr>
                        <td>Discounts:</td>
                        <td>-$${data.totals.discounts.toFixed(2)}</td>
                    </tr>
                ` : ''}
                <tr>
                    <td>Tax (8%):</td>
                    <td>$${data.totals.tax.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td>Total:</td>
                    <td>$${data.totals.total.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        ${data.payment.status === 'succeeded' ? `
            <div class="payment-info">
                <h3>✅ Payment Received</h3>
                <p><strong>Payment ID:</strong> ${data.payment.id}</p>
                <p><strong>Amount:</strong> $${(data.payment.amount / 100).toFixed(2)}</p>
                <p><strong>Processed:</strong> ${new Date(data.payment.processedAt).toLocaleString()}</p>
            </div>
        ` : `
            <div class="payment-info">
                <h3>⏳ Payment Pending</h3>
                <p>Please complete payment to finalize your service booking.</p>
            </div>
        `}

        <div class="footer">
            <p>Thank you for choosing Shining Star Cleaning Services!</p>
            <p>For questions about this invoice, please contact us at ${data.businessInfo.phone} or ${data.businessInfo.email}</p>
        </div>
    </div>
</body>
</html>`;
    }

    // Validate payment method
    async validatePaymentMethod(paymentMethodId, amount) {
        try {
            // In production, validate with payment provider
            // For now, return mock validation
            return {
                valid: true,
                paymentMethod: {
                    id: paymentMethodId,
                    type: 'card',
                    last4: '4242',
                    brand: 'visa'
                }
            };
        } catch (error) {
            console.error('Payment method validation error:', error);
            return { valid: false, error: 'Invalid payment method' };
        }
    }

    // Handle refunds
    async processRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
        try {
            // In production, process refund with payment provider
            const refund = {
                id: `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                paymentIntent: paymentIntentId,
                amount: amount, // If null, full refund
                reason,
                status: 'succeeded',
                processedAt: new Date().toISOString()
            };

            return refund;
        } catch (error) {
            console.error('Refund processing error:', error);
            throw new Error('Refund processing failed');
        }
    }
}

module.exports = PaymentProcessor;
