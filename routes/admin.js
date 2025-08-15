const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

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
    currentPage: 'login'
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
      res.json({ success: true, redirect: '/admin' });
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

// Admin dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const services = await readJSONFile('services.json');
    const packages = await readJSONFile('packages.json');
    const portfolio = await readJSONFile('portfolio.json');
    
    res.render('pages/admin/dashboard', {
      title: res.__('admin.dashboard'),
      currentPage: 'dashboard',
      stats: {
        services: services.length,
        packages: packages.length,
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

// Manage portfolio
router.get('/portfolio', requireAuth, async (req, res) => {
  try {
    const portfolio = await readJSONFile('portfolio.json');
    
    res.render('pages/admin/portfolio', {
      title: res.__('admin.manage_portfolio'),
      currentPage: 'portfolio',
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
    const services = await readJSONFile('services.json');
    
    res.render('pages/admin/services', {
      title: res.__('admin.manage_services'),
      currentPage: 'services',
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

// Manage packages
router.get('/packages', requireAuth, async (req, res) => {
  try {
    const packages = await readJSONFile('packages.json');
    const services = await readJSONFile('services.json');
    
    res.render('pages/admin/packages', {
      title: res.__('admin.manage_packages'),
      currentPage: 'packages',
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

module.exports = router;