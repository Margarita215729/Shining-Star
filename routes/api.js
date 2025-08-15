const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const PaymentProcessor = require('../utils/paymentProcessor');

// Initialize payment processor
const paymentProcessor = new PaymentProcessor();

// Helper function to read JSON data
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(path.join(__dirname, '..', 'data', filePath), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Helper function to write JSON data
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(
      path.join(__dirname, '..', 'data', filePath),
      JSON.stringify(data, null, 2)
    );
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Get all services
router.get('/services', async (req, res) => {
  try {
    const services = await readJSONFile('services.json');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// Get all packages
router.get('/packages', async (req, res) => {
  try {
    const packages = await readJSONFile('packages.json');
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load packages' });
  }
});

// Get portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const portfolio = await readJSONFile('portfolio.json');
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

// Calculate quote based on selected services
router.post('/quote', async (req, res) => {
  try {
    const { services: selectedServices, packages: selectedPackages } = req.body;
    const services = await readJSONFile('services.json');
    const packages = await readJSONFile('packages.json');

    let totalPrice = 0;
    let totalDuration = 0;
    let items = [];

    // Calculate individual services
    if (selectedServices && selectedServices.length > 0) {
      selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service && service.available) {
          totalPrice += service.price;
          totalDuration += service.duration;
          items.push({
            type: 'service',
            id: service.id,
            name: service.name,
            price: service.price,
            duration: service.duration
          });
        }
      });
    }

    // Calculate packages
    if (selectedPackages && selectedPackages.length > 0) {
      selectedPackages.forEach(packageId => {
        const package = packages.find(p => p.id === packageId);
        if (package && package.available) {
          const discountedPrice = package.price * (1 - package.discount / 100);
          totalPrice += discountedPrice;
          totalDuration += package.duration;
          items.push({
            type: 'package',
            id: package.id,
            name: package.name,
            originalPrice: package.price,
            price: discountedPrice,
            discount: package.discount,
            duration: package.duration
          });
        }
      });
    }

    res.json({
      totalPrice: Math.round(totalPrice * 100) / 100,
      totalDuration,
      items,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Quote calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
});

// Submit service request
router.post('/request', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      services: selectedServices,
      packages: selectedPackages,
      preferredDate,
      message
    } = req.body;

    // In a real application, you would save this to a database
    const request = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      address,
      services: selectedServices || [],
      packages: selectedPackages || [],
      preferredDate,
      message,
      status: 'pending',
      created: new Date().toISOString()
    };

    console.log('Service request received:', request);

    res.json({
      success: true,
      message: 'Your service request has been submitted successfully!',
      requestId: request.id
    });
  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit service request'
    });
  }
});

// Calculate advanced quote with distance and quantity/area pricing
router.post('/calculate-quote', async (req, res) => {
  try {
    const {
      serviceId,
      quantity,
      area,
      hours,
      customerAddress
    } = req.body;

    const services = await readJSONFile('services.json');
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    let serviceCost = 0;
    let details = '';

    // Calculate service cost based on type
    switch (service.calculationType) {
      case 'quantity':
        const qty = parseInt(quantity) || 1;
        serviceCost = service.price * qty;
        details = `${qty} ${service.unit}${qty !== 1 ? 's' : ''} × $${service.price} = $${serviceCost}`;
        break;

      case 'area':
        const sqft = parseFloat(area) || 0;
        serviceCost = service.price * sqft;
        details = `${sqft} sqft × $${service.price}/sqft = $${serviceCost}`;
        break;

      case 'time':
        const hrs = parseFloat(hours) || 0;
        const laborRate = 25; // $25/hour
        serviceCost = laborRate * hrs;
        details = `${hrs} hours × $${laborRate}/hour = $${serviceCost}`;
        break;

      default:
        serviceCost = service.price;
        details = `Fixed price: $${serviceCost}`;
    }

    // Calculate travel cost (simplified - in production use Google Maps API)
    const distance = calculateMockDistance(customerAddress);
    const travelCost = calculateTravelCost(distance);

    // Calculate totals
    const subtotal = serviceCost + travelCost;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    res.json({
      success: true,
      quote: {
        service: service.name.en,
        serviceCost: Math.round(serviceCost * 100) / 100,
        details,
        distance: Math.round(distance * 10) / 10,
        travelCost: Math.round(travelCost * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100
      }
    });
  } catch (error) {
    console.error('Advanced quote calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
});

// Helper functions for distance and travel cost calculation
function calculateMockDistance(address) {
  // Mock distance calculation - replace with actual Google Maps API
  if (!address) return 0;

  // Simulate distance based on address string length for demo
  const mockDistance = Math.random() * 20 + 1; // 1-21 miles
  return Math.round(mockDistance * 10) / 10;
}

function calculateTravelCost(distanceMiles) {
  const freeDistanceMiles = 5;
  const gasPrice = 4.00;
  const vehicleMPG = 23;

  if (distanceMiles <= freeDistanceMiles) {
    return 0;
  }

  const chargeMiles = distanceMiles - freeDistanceMiles;
  const gallonsUsed = (chargeMiles * 2) / vehicleMPG; // Round trip
  const gasCost = gallonsUsed * gasPrice;

  // Add markup for vehicle wear and time
  const travelCost = gasCost * 1.5;

  return Math.round(travelCost * 100) / 100;
}

// Submit advanced service request
router.post('/request-service', async (req, res) => {
  try {
    const {
      service,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      quoteSummary
    } = req.body;

    // In a real application, save to database
    const request = {
      id: Date.now().toString(),
      service,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      quoteSummary,
      status: 'pending',
      created: new Date().toISOString()
    };

    console.log('Advanced service request received:', request);

    res.json({
      success: true,
      message: 'Service request submitted successfully!',
      requestId: request.id
    });
  } catch (error) {
    console.error('Advanced service request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit service request'
    });
  }
});

// Payment processing endpoints

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, serviceData, customerData } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await paymentProcessor.createPaymentIntent(
      amount,
      currency,
      {
        serviceData: JSON.stringify(serviceData),
        customerData: JSON.stringify(customerData)
      }
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Process payment
router.post('/process-payment', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, customerData, serviceData } = req.body;

    // Validate payment method
    const validation = await paymentProcessor.validatePaymentMethod(paymentMethodId, 0);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Process payment
    const paymentResult = await paymentProcessor.processPayment(paymentIntentId, paymentMethodId);

    if (paymentResult.status === 'succeeded') {
      // Generate invoice
      const invoice = await paymentProcessor.generateInvoice(
        paymentResult,
        customerData,
        serviceData
      );

      // Save booking record
      const booking = {
        id: Date.now().toString(),
        paymentIntentId,
        customerData,
        serviceData,
        paymentResult,
        invoice,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // In production, save to database
      console.log('Booking confirmed:', booking);

      res.json({
        success: true,
        paymentStatus: paymentResult.status,
        bookingId: booking.id,
        invoice: invoice
      });
    } else {
      res.json({
        success: false,
        paymentStatus: paymentResult.status,
        error: 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get invoice
router.get('/invoice/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const invoicePath = path.join(__dirname, '..', 'data', 'invoices', `${invoiceNumber}.html`);

    const invoiceExists = await fs.access(invoicePath).then(() => true).catch(() => false);
    if (!invoiceExists) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceHTML = await fs.readFile(invoicePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(invoiceHTML);
  } catch (error) {
    console.error('Invoice retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
});

// Process refund
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    const refund = await paymentProcessor.processRefund(paymentIntentId, amount, reason);

    res.json({
      success: true,
      refund
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

module.exports = router;