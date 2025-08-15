const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public/uploads/portfolio');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Session configuration
app.use(session({
    secret: 'shining-star-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Language support
const loadTranslations = (lang) => {
    try {
        const translations = fs.readFileSync(path.join(__dirname, 'locales', lang, 'common.json'), 'utf8');
        return JSON.parse(translations);
    } catch (error) {
        // Fallback to English if language file not found
        const translations = fs.readFileSync(path.join(__dirname, 'locales', 'en', 'common.json'), 'utf8');
        return JSON.parse(translations);
    }
};

// Language middleware
app.use((req, res, next) => {
    const lang = req.query.lang || req.session.lang || 'en';
    req.session.lang = lang;
    res.locals.lang = lang;
    res.locals.t = loadTranslations(lang);
    res.locals.currentPath = req.path;
    next();
});

// Load data helpers
const loadData = (filename) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const saveData = (filename, data) => {
    fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
};

// Routes
app.get('/', (req, res) => {
    const services = loadData('services.json');
    const packages = loadData('packages.json');
    const portfolio = loadData('portfolio.json');
    
    res.render('pages/home', {
        title: res.locals.t.home,
        services: services.slice(0, 6), // Show first 6 services
        packages: packages.slice(0, 3), // Show first 3 packages
        portfolio: portfolio.slice(0, 6) // Show first 6 portfolio items
    });
});

app.get('/services', (req, res) => {
    const services = loadData('services.json');
    res.render('pages/services', {
        title: res.locals.t.services,
        services: services
    });
});

app.get('/portfolio', (req, res) => {
    const portfolio = loadData('portfolio.json');
    res.render('pages/portfolio', {
        title: res.locals.t.portfolio,
        portfolio: portfolio
    });
});

app.get('/packages', (req, res) => {
    const packages = loadData('packages.json');
    res.render('pages/packages', {
        title: res.locals.t.packages,
        packages: packages
    });
});

app.get('/contact', (req, res) => {
    res.render('pages/contact', {
        title: res.locals.t.contact
    });
});

// Admin routes
app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    
    const services = loadData('services.json');
    const packages = loadData('packages.json');
    const portfolio = loadData('portfolio.json');
    
    res.render('pages/admin/dashboard', {
        title: 'Admin Dashboard',
        services: services,
        packages: packages,
        portfolio: portfolio
    });
});

app.get('/admin/login', (req, res) => {
    res.render('pages/admin/login', {
        title: 'Admin Login',
        error: null
    });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Simple authentication (in production, use proper hashing)
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.render('pages/admin/login', {
            title: 'Admin Login',
            error: 'Invalid credentials'
        });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Admin portfolio management
app.post('/admin/portfolio', upload.fields([{ name: 'beforeImage' }, { name: 'afterImage' }]), (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    
    const portfolio = loadData('portfolio.json');
    const newItem = {
        id: Date.now(),
        title: req.body.title,
        description: req.body.description,
        beforeImage: req.files.beforeImage ? `/uploads/portfolio/${req.files.beforeImage[0].filename}` : '',
        afterImage: req.files.afterImage ? `/uploads/portfolio/${req.files.afterImage[0].filename}` : '',
        createdAt: new Date().toISOString()
    };
    
    portfolio.push(newItem);
    saveData('portfolio.json', portfolio);
    res.redirect('/admin');
});

// Admin services management
app.post('/admin/services', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    
    const services = loadData('services.json');
    const newService = {
        id: Date.now(),
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        duration: req.body.duration,
        category: req.body.category
    };
    
    services.push(newService);
    saveData('services.json', services);
    res.redirect('/admin');
});

// Admin packages management
app.post('/admin/packages', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    
    const packages = loadData('packages.json');
    const selectedServices = Array.isArray(req.body.services) ? req.body.services : [req.body.services];
    
    const newPackage = {
        id: Date.now(),
        name: req.body.name,
        description: req.body.description,
        originalPrice: parseFloat(req.body.originalPrice),
        discountPrice: parseFloat(req.body.discountPrice),
        services: selectedServices || [],
        discount: req.body.discount
    };
    
    packages.push(newPackage);
    saveData('packages.json', packages);
    res.redirect('/admin');
});

// API routes for dynamic content
app.get('/api/services', (req, res) => {
    const services = loadData('services.json');
    res.json(services);
});

app.post('/api/contact', (req, res) => {
    const { name, email, phone, services, message } = req.body;
    
    // In a real application, you would send an email or save to database
    console.log('Contact form submission:', { name, email, phone, services, message });
    
    res.json({ success: true, message: res.locals.t.contactSuccess || 'Message sent successfully!' });
});

// Language switcher
app.get('/lang/:lang', (req, res) => {
    const supportedLangs = ['en', 'ru', 'es'];
    const lang = supportedLangs.includes(req.params.lang) ? req.params.lang : 'en';
    req.session.lang = lang;
    res.redirect(req.get('Referer') || '/');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('pages/error', {
        title: 'Error',
        error: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('pages/error', {
        title: '404 - Page Not Found',
        error: 'Page not found!'
    });
});

app.listen(PORT, () => {
    console.log(`Shining Star Cleaning Services running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});