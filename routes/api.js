const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

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

module.exports = router;