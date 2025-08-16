const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { Service, Package, Portfolio, User } = require('../utils/database');

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

// --- Validation helpers ---
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 80);
}

function validateServicePayload(payload, forUpdate = false) {
  const errors = [];
  const allowedCalculationTypes = ['quantity', 'area', 'time', 'fixed'];

  // Names/descriptions
  if (!payload.name || typeof payload.name !== 'object' || !payload.name.en) {
    errors.push('name.en is required');
  }
  if (!payload.description || typeof payload.description !== 'object' || !payload.description.en) {
    errors.push('description.en is required');
  }

  // Numbers
  if (payload.price == null || isNaN(Number(payload.price)) || Number(payload.price) < 0) {
    errors.push('price must be a non-negative number');
  }
  if (payload.duration == null || isNaN(Number(payload.duration)) || Number(payload.duration) < 0) {
    errors.push('duration must be a non-negative number (minutes)');
  }

  // calculationType-specific
  if (!payload.calculationType || !allowedCalculationTypes.includes(payload.calculationType)) {
    errors.push(`calculationType must be one of: ${allowedCalculationTypes.join(', ')}`);
  } else {
    if (payload.calculationType === 'quantity') {
      if (!payload.unit) errors.push('unit is required for quantity type');
      if (payload.maxQuantity != null && (isNaN(Number(payload.maxQuantity)) || Number(payload.maxQuantity) <= 0)) {
        errors.push('maxQuantity must be a positive number if provided');
      }
    }
    if (payload.calculationType === 'area') {
      if (!payload.unit) errors.push('unit is required for area type');
      if (payload.minArea != null && (isNaN(Number(payload.minArea)) || Number(payload.minArea) < 0)) {
        errors.push('minArea must be a non-negative number if provided');
      }
      if (payload.maxArea != null && (isNaN(Number(payload.maxArea)) || Number(payload.maxArea) <= 0)) {
        errors.push('maxArea must be a positive number if provided');
      }
    }
    if (payload.calculationType === 'time') {
      // time-based can rely on duration and perhaps a labor rate client-side
    }
  }

  // Booleans/strings
  if (payload.available != null && typeof payload.available !== 'boolean') {
    errors.push('available must be boolean');
  }

  if (payload.category != null && typeof payload.category !== 'string') {
    errors.push('category must be a string');
  }

  return errors;
}

function validatePackagePayload(payload, allServices) {
  const errors = [];
  if (!payload.name || typeof payload.name !== 'object' || !payload.name.en) {
    errors.push('name.en is required');
  }
  if (!payload.description || typeof payload.description !== 'object' || !payload.description.en) {
    errors.push('description.en is required');
  }
  if (!Array.isArray(payload.services)) {
    errors.push('services must be an array of service IDs');
  } else {
    const serviceIds = new Set(allServices.map(s => s.id));
    const unknown = payload.services.filter(id => !serviceIds.has(id));
    if (unknown.length) errors.push(`Unknown service IDs: ${unknown.join(', ')}`);
  }
  if (payload.price == null || isNaN(Number(payload.price)) || Number(payload.price) < 0) {
    errors.push('price must be a non-negative number');
  }
  if (payload.discount == null || isNaN(Number(payload.discount)) || Number(payload.discount) < 0 || Number(payload.discount) > 100) {
    errors.push('discount must be between 0 and 100');
  }
  if (payload.duration == null || isNaN(Number(payload.duration)) || Number(payload.duration) < 0) {
    errors.push('duration must be a non-negative number (minutes)');
  }
  if (payload.available != null && typeof payload.available !== 'boolean') {
    errors.push('available must be boolean');
  }
  return errors;
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    // remember original URL for redirect after login
    if (!req.session.returnTo) {
      req.session.returnTo = req.originalUrl || '/admin';
    }
    res.redirect('/admin/login');
  }
}

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin');
  }

  res.render('pages/admin/login', {
    title: res.__('admin.login'),
    currentPage: 'admin-login',
    hideHeaderFooter: true
  });
});

// Admin login POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = await readJSONFile('users.json');
    const user = users.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = {
        username: user.username,
        role: user.role,
        email: user.email
      };

      // Enhanced admin redirect logic
      const redirectUrl = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;

      res.json({
        success: true,
        redirect: redirectUrl,
        user: {
          username: user.username,
          role: user.role
        }
      });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Login failed' });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin dashboard - Enhanced with redirect functionality
router.get('/', requireAuth, async (req, res) => {
  try {
    const services = await readJSONFile('services.json');
    const packages = await readJSONFile('packages.json');
    const portfolio = await readJSONFile('portfolio.json');

    res.render('pages/admin/dashboard', {
      title: res.__('admin.dashboard'),
      currentPage: 'admin-dashboard',
      hideHeaderFooter: true,
      stats: {
        services: services.filter(s => s.available !== false).length, // Only count available services
        packages: packages.filter(p => p.available !== false).length, // Only count available packages
        portfolio: portfolio.length
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load dashboard'
    });
  }
});

// Admin dashboard with explicit route
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const services = await readJSONFile('services.json');
    const packages = await readJSONFile('packages.json');
    const portfolio = await readJSONFile('portfolio.json');

    // Get recent activity and stats
    const stats = {
      totalServices: services.length,
      activeServices: services.filter(s => s.available).length,
      totalPackages: packages.length,
      portfolioItems: portfolio.length,
      // Add revenue tracking later
      monthlyRevenue: 0,
      completedJobs: 0
    };

    res.render('pages/admin/dashboard', {
      title: res.__('admin.dashboard'),
      currentPage: 'admin-dashboard',
      hideHeaderFooter: true,
      stats,
      recentActivity: [] // Add recent activity tracking later
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load dashboard'
    });
  }
});

// Manage portfolio
router.get('/portfolio', requireAuth, async (req, res) => {
  try {
    const portfolio = await readJSONFile('portfolio.json');

    res.render('pages/admin/portfolio', {
      title: res.__('admin.manage_portfolio'),
      currentPage: 'admin-portfolio',
      hideHeaderFooter: true,
      portfolio
    });
  } catch (error) {
    console.error('Portfolio management error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load portfolio'
    });
  }
});

// Add portfolio item
router.post('/portfolio', requireAuth, upload.fields([
  { name: 'before', maxCount: 1 },
  { name: 'after', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description } = req.body;
    const portfolio = await readJSONFile('portfolio.json');

    const newItem = {
      id: Date.now().toString(),
      title: JSON.parse(title),
      description: JSON.parse(description),
      before: req.files.before ? `/uploads/${req.files.before[0].filename}` : null,
      after: req.files.after ? `/uploads/${req.files.after[0].filename}` : null,
      created: new Date().toISOString()
    };

    portfolio.push(newItem);
    await writeJSONFile('portfolio.json', portfolio);

    res.json({ success: true });
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.json({ success: false, message: 'Failed to add portfolio item' });
  }
});

// Manage services
router.get('/services', requireAuth, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.render('pages/admin/services', {
      title: res.__('admin.manage_services'),
      currentPage: 'admin-services',
      hideHeaderFooter: true,
      services
    });
  } catch (error) {
    console.error('Services management error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load services'
    });
  }
});

// Create service
router.post('/services', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};

    // Coerce types
    payload.price = Number(payload.price);
    payload.duration = Number(payload.duration);
    if (payload.maxQuantity != null) payload.maxQuantity = Number(payload.maxQuantity);
    if (payload.minArea != null) payload.minArea = Number(payload.minArea);
    if (payload.maxArea != null) payload.maxArea = Number(payload.maxArea);
    payload.available = payload.available === true || payload.available === 'true';

    const errors = validateServicePayload(payload);
    if (errors.length) return res.status(400).json({ success: false, errors });

    // Generate or validate ID
    let id = payload.id || slugify(payload.name.en);
    if (!id) id = 'service-' + Date.now();
    
    // Check if ID already exists
    let uniqueId = id;
    let counter = 1;
    while (await Service.findOne({ id: uniqueId })) {
      uniqueId = `${id}-${counter++}`;
    }

    const newService = new Service({
      id: uniqueId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      duration: payload.duration,
      category: payload.category || 'general',
      available: payload.available !== false,
      calculationType: payload.calculationType,
      unit: payload.unit || null,
      maxQuantity: payload.maxQuantity != null ? payload.maxQuantity : undefined,
      minArea: payload.minArea != null ? payload.minArea : undefined,
      maxArea: payload.maxArea != null ? payload.maxArea : undefined
    });

    await newService.save();

    res.json({ success: true, service: newService });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, errors: ['Failed to create service'] });
  }
});

// Update service
router.put('/services/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOne({ id });
    if (!service) return res.status(404).json({ success: false, errors: ['Service not found'] });

    const payload = req.body || {};
    // Coerce types
    if (payload.price != null) payload.price = Number(payload.price);
    if (payload.duration != null) payload.duration = Number(payload.duration);
    if (payload.maxQuantity != null) payload.maxQuantity = Number(payload.maxQuantity);
    if (payload.minArea != null) payload.minArea = Number(payload.minArea);
    if (payload.maxArea != null) payload.maxArea = Number(payload.maxArea);
    if (payload.available != null) payload.available = payload.available === true || payload.available === 'true';

    const merged = { ...service.toObject(), ...payload };
    const errors = validateServicePayload(merged, true);
    if (errors.length) return res.status(400).json({ success: false, errors });

    Object.assign(service, payload);
    await service.save();

    res.json({ success: true, service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, errors: ['Failed to update service'] });
  }
});

// Delete service (and remove references from packages)
router.delete('/services/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOne({ id });
    if (!service) return res.status(404).json({ success: false, errors: ['Service not found'] });

    await Service.deleteOne({ id });

    // Clean up packages that reference this service
    const packages = await Package.find({ services: id });
    let changed = false;
    for (const pkg of packages) {
      pkg.services = pkg.services.filter(sid => sid !== id);
      await pkg.save();
      changed = true;
    }

    res.json({ success: true, removedFromPackages: changed });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, errors: ['Failed to delete service'] });
  }
});

// Manage packages
router.get('/packages', requireAuth, async (req, res) => {
  try {
    const packages = await readJSONFile('packages.json');
    const services = await readJSONFile('services.json');

    res.render('pages/admin/packages', {
      title: res.__('admin.manage_packages'),
      currentPage: 'admin-packages',
      hideHeaderFooter: true,
      packages,
      services
    });
  } catch (error) {
    console.error('Packages management error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      currentPage: 'error',
      error: 'Failed to load packages'
    });
  }
});

// Create package
router.post('/packages', requireAuth, async (req, res) => {
  try {
    const packages = await readJSONFile('packages.json');
    const services = await readJSONFile('services.json');
    const payload = req.body || {};

    // Coerce types
    if (typeof payload.services === 'string') {
      // support single select or comma string
      try {
        const parsed = JSON.parse(payload.services);
        payload.services = parsed;
      } catch {
        payload.services = payload.services.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    payload.price = Number(payload.price);
    payload.discount = Number(payload.discount);
    payload.duration = Number(payload.duration);
    payload.available = payload.available === true || payload.available === 'true';

    const errors = validatePackagePayload(payload, services);
    if (errors.length) return res.status(400).json({ success: false, errors });

    // Generate or validate ID
    let id = payload.id || slugify(payload.name.en);
    if (!id) id = 'package-' + Date.now();
    let uniqueId = id;
    let counter = 1;
    while (packages.find(p => p.id === uniqueId)) {
      uniqueId = `${id}-${counter++}`;
    }

    const newPackage = {
      id: uniqueId,
      name: payload.name,
      description: payload.description,
      services: payload.services || [],
      price: payload.price,
      discount: payload.discount,
      duration: payload.duration,
      available: payload.available !== false
    };

    packages.push(newPackage);
    const ok = await writeJSONFile('packages.json', packages);
    if (!ok) return res.status(500).json({ success: false, errors: ['Failed to persist package'] });

    res.json({ success: true, package: newPackage });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ success: false, errors: ['Failed to create package'] });
  }
});

// Update package
router.put('/packages/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const packages = await readJSONFile('packages.json');
    const services = await readJSONFile('services.json');
    const idx = packages.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ success: false, errors: ['Package not found'] });

    const payload = req.body || {};
    if (payload.services != null) {
      if (typeof payload.services === 'string') {
        try {
          const parsed = JSON.parse(payload.services);
          payload.services = parsed;
        } catch {
          payload.services = payload.services.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }
    if (payload.price != null) payload.price = Number(payload.price);
    if (payload.discount != null) payload.discount = Number(payload.discount);
    if (payload.duration != null) payload.duration = Number(payload.duration);
    if (payload.available != null) payload.available = payload.available === true || payload.available === 'true';

    const merged = { ...packages[idx], ...payload };
    const errors = validatePackagePayload(merged, services);
    if (errors.length) return res.status(400).json({ success: false, errors });

    packages[idx] = merged;
    const ok = await writeJSONFile('packages.json', packages);
    if (!ok) return res.status(500).json({ success: false, errors: ['Failed to persist package'] });

    res.json({ success: true, package: merged });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ success: false, errors: ['Failed to update package'] });
  }
});

// Delete package
router.delete('/packages/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const packages = await readJSONFile('packages.json');
    const idx = packages.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ success: false, errors: ['Package not found'] });

    packages.splice(idx, 1);
    const ok = await writeJSONFile('packages.json', packages);
    if (!ok) return res.status(500).json({ success: false, errors: ['Failed to delete package'] });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ success: false, errors: ['Failed to delete package'] });
  }
});

module.exports = router;