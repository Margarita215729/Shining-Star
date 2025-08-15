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

// Language switching middleware
router.get('/lang/:lang', (req, res) => {
  const lang = req.params.lang;
  if (['en', 'ru', 'es'].includes(lang)) {
    req.session.lang = lang;
    res.cookie('lang', lang);
    res.setLocale(lang);
  }
  res.redirect(req.get('Referer') || '/');
});

// Home page
router.get('/', async (req, res) => {
  try {
    const services = await readJSONFile('services.json');
    const packages = await readJSONFile('packages.json');

    res.render('pages/home', {
      title: res.__('home.title'),
      currentPage: 'home',
      services: services.slice(0, 4), // Show only first 4 services on home
      packages: packages
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load page'
    });
  }
});

// Services page
router.get('/services', async (req, res) => {
  try {
    const services = await readJSONFile('services.json');
    const packages = await readJSONFile('packages.json');

    res.render('pages/services', {
      title: res.__('services.title'),
      currentPage: 'services',
      services,
      packages
    });
  } catch (error) {
    console.error('Error loading services page:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load services'
    });
  }
});

// Portfolio page
router.get('/portfolio', async (req, res) => {
  try {
    const portfolio = await readJSONFile('portfolio.json');

    res.render('pages/portfolio', {
      title: res.__('portfolio.title'),
      currentPage: 'portfolio',
      portfolio
    });
  } catch (error) {
    console.error('Error loading portfolio page:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load portfolio'
    });
  }
});

// Calculator page
router.get('/calculator', async (req, res) => {
  try {
    const services = await readJSONFile('services.json');

    res.render('calculator', {
      title: res.__('calculator.title'),
      currentPage: 'calculator',
      services
    });
  } catch (error) {
    console.error('Error loading calculator page:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load calculator'
    });
  }
});

// Payment page
router.get('/payment', (req, res) => {
  res.render('payment', {
    title: res.__('payment.title'),
    currentPage: 'payment'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: res.__('contact.title'),
    currentPage: 'contact'
  });
});

// Contact form submission
router.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;

  // In a real application, you would save this to a database or send an email
  console.log('Contact form submission:', { name, email, phone, message });

  res.json({
    success: true,
    message: res.__('contact.success')
  });
});

module.exports = router;